/**
 * AgentController — drives the AI page-filling agent (force rescan,
 * per-field fill, and chat) on top of the streaming Port opened by
 * GoApplyAPI.openAgentPort(). Owns:
 *   - field/nav "refs" the model can refer to (rebuilt on every rescan)
 *   - execution of client-side tools against the live DOM
 *   - the turn/continuation loop: the server's tool-calling loop stops
 *     whenever the model calls a tool with no server-side `execute` (a
 *     client tool); this module detects that (a tool-call with no matching
 *     tool-result by the time the stream ends), executes it locally, and
 *     re-sends a continuation turn with the result until the model stops
 *     calling client tools.
 */
const AgentController = (() => {
  const MAX_CONTINUATIONS = 100;
  const SNAPSHOT_TTL_MS = 5 * 60 * 1000;

  let fieldRefs = new Map();   // ref -> fieldInfo (Finder shape: {fieldName, element, method, container, values})
  let navRefs = new Map();     // ref -> { element, label, likelyFinal }
  let pageRefs = new Map();    // ref -> arbitrary visible interactive element
  let flagged = new Map();     // ref -> reason
  let currentPlatform = null;
  let currentJobInfo = null;
  let activeSession = null; // { mode, messages }
  let agentPort = null;
  let isRunning = false;
  let currentRequestId = null;
  let currentAbortReject = null;
  let currentAbortCleanup = null;
  let cancelRequested = false;
  let resetRequested = false;
  const cancelWaiters = new Set();
  let navigationSnapshotPending = false;
  let pageIsUnloading = false;
  window.addEventListener('pagehide', () => { pageIsUnloading = true; });

  function workspaceSessionKey() {
    return chrome.runtime.sendMessage({ action: 'get-own-tab-id' })
      .then(({ tabId, groupId } = {}) => {
        const none = chrome.tabGroups?.TAB_GROUP_ID_NONE ?? -1;
        return groupId != null && groupId !== none
          ? `goapplyAgentSession:group-${groupId}`
          : `goapplyAgentSession:tab-${tabId}`;
      })
      .catch(() => null);
  }

  async function restoreWorkspaceSession() {
    if (activeSession) return activeSession;
    const key = await workspaceSessionKey();
    if (!key || !chrome.storage.session) return null;
    try {
      const stored = await chrome.storage.session.get(key);
      const session = stored[key];
      if (session && Array.isArray(session.messages) && ['chat', 'rescan', 'field'].includes(session.mode)) {
        activeSession = session;
      }
    } catch (error) {}
    return activeSession;
  }

  async function persistWorkspaceSession() {
    const key = await workspaceSessionKey();
    if (!key || !activeSession || !chrome.storage.session) return;
    try { await chrome.storage.session.set({ [key]: activeSession }); } catch (error) {}
  }

  async function clearWorkspaceSession() {
    const key = await workspaceSessionKey();
    if (!key || !chrome.storage.session) return;
    try { await chrome.storage.session.remove(key); } catch (error) {}
  }

  // ─── Ref bookkeeping ──────────────────────────────────────────────

  function resetRefs() {
    fieldRefs = new Map();
    navRefs = new Map();
    pageRefs = new Map();
  }

  // Refs are index-based ("f0", "f1", ...), not an incrementing counter, so
  // that ui.js — which renders rows by iterating this same foundFields array
  // — can address a row by its position without needing AgentController to
  // hand back the ref map.
  function rebuildFromFoundFields(foundFields) {
    resetRefs();
    (foundFields || []).forEach((field, i) => fieldRefs.set(`f${i}`, field));
    (typeof Tracker !== 'undefined' ? Tracker.findNavigationCandidates() : []).forEach((nav, i) => navRefs.set(`n${i}`, nav));
  }

  function labelForField(field) {
    if (field._labelText) return field._labelText;
    const label = field.element?.id && document.querySelector(`label[for="${CSS.escape(field.element.id)}"]`);
    if (label) return label.textContent.trim().slice(0, 120);
    const controlLabel = field.element?.closest?.('.select__container, .select-shell, .ant-select, .select2-container')
      ?.querySelector?.('label');
    return controlLabel ? controlLabel.textContent.trim().slice(0, 120) : '';
  }

  function currentElementValue(field) {
    if (field?._attachedFileName) return field._attachedFileName;
    return typeof Filler !== 'undefined' && typeof Filler.readFieldValue === 'function'
      ? Filler.readFieldValue(field)
      : '';
  }

  function summarizeFields() {
    return [...fieldRefs.entries()].map(([ref, field]) => ({
      ref,
      fieldName: field.fieldName,
      method: field.method,
      labelText: labelForField(field),
      hasValue: Boolean(currentElementValue(field)),
      flaggedReason: flagged.get(ref) || undefined,
    }));
  }

  function summarizeNavCandidates() {
    return [...navRefs.entries()].map(([ref, nav]) => ({ ref, label: nav.label, likelyFinal: nav.likelyFinal }));
  }

  function buildContext(targetFieldRef) {
    const pageText = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
    return {
      url: window.location.href,
      title: document.title,
      pageText: pageText.slice(0, 8000),
      pageTextTruncated: pageText.length > 8000,
      jobInfo: currentJobInfo || undefined,
      fields: summarizeFields(),
      navCandidates: summarizeNavCandidates(),
      ...(targetFieldRef ? { targetFieldRef } : {}),
    };
  }

  // ─── Client tool execution ────────────────────────────────────────

  async function toolSetFieldValue({ fieldRef, value, confidence, reason }) {
    const field = fieldRefs.get(fieldRef);
    if (!field) return { applied: false, note: 'Unknown fieldRef — rescan_page first.' };
    if (field.method === 'uploadResume' || field.method === 'uploadCoverLetter') {
      return { applied: false, note: 'This field is a document upload — use the existing resume/cover-letter attach flow, not set_field_value.' };
    }
    try {
      const result = await Filler.fillField(field, { [field.fieldName]: value });
      if (field.method !== 'select') await new Promise(resolve => setTimeout(resolve, 50));
      const retainedValue = result?.retainedValue || currentElementValue(field);
      const expectedChoices = result?.expectedChoices || Filler.choiceCandidates(value, field.values);
      const checkboxExpected = value === true || ['true', 'yes', 'on', 'checked'].includes(String(value).toLowerCase());
      const applied = Boolean(result?.success) && (field.element?.type === 'checkbox'
        ? field.element.checked === checkboxExpected
        : Filler.valueMatches(retainedValue, expectedChoices));
      if (applied) {
        if (confidence === 'low') {
          flagged.set(fieldRef, reason || 'Low-confidence AI guess — please review.');
        } else {
          flagged.delete(fieldRef);
        }
        if (typeof UI !== 'undefined' && field.element) UI.highlightField(field.element);
      }
      return {
        applied,
        retainedValue,
        note: result?.reason || (!applied ? 'The page did not retain the requested value.' : undefined),
      };
    } catch (e) {
      return { applied: false, note: e.message };
    }
  }

  async function toolInspectFieldControl({ fieldRef, open = true, query }) {
    const field = fieldRefs.get(fieldRef);
    if (!field) return { found: false, note: 'Unknown fieldRef — rescan_page first.' };
    return Filler.inspectField(field, { open, query });
  }

  async function toolSelectFieldOption({ fieldRef, value, confidence = 'high', reason }) {
    const field = fieldRefs.get(fieldRef);
    if (!field) return { applied: false, note: 'Unknown fieldRef — rescan_page first.' };
    if (field.method !== 'select') {
      return { applied: false, note: 'This field is not a select control; use set_field_value.' };
    }
    return toolSetFieldValue({ fieldRef, value, confidence, reason });
  }

  async function toolSetFieldValues({ fields = [] }) {
    const results = [];
    for (const request of fields) {
      results.push({ fieldRef: request.fieldRef, ...(await toolSetFieldValue(request)) });
    }
    return { results };
  }

  async function toolSetCheckboxState({ fieldRef, checked, confidence = 'high', reason }) {
    const field = fieldRefs.get(fieldRef);
    if (!field) return { applied: false, note: 'Unknown fieldRef — rescan_page first.' };
    if (field.element?.type !== 'checkbox') {
      return { applied: false, note: 'This field is not a checkbox; inspect it and use the matching field tool.' };
    }
    return toolSetFieldValue({ fieldRef, value: checked ? 'true' : 'false', confidence, reason });
  }

  function summarizeFoligoDocument(document) {
    const rawLinkedJob = document?.linkedJob || document?.job;
    const linkedJob = rawLinkedJob && typeof rawLinkedJob === 'object'
      ? {
          id: rawLinkedJob.id,
          company: rawLinkedJob.company,
          position: rawLinkedJob.position,
          category: rawLinkedJob.category,
        }
      : undefined;
    const jobDescription = typeof document?.jobDescription === 'string'
      ? document.jobDescription.replace(/\s+/g, ' ').trim().slice(0, 1200)
      : undefined;
    return {
      documentId: document?.id,
      name: document?.name || 'Untitled document',
      isDefault: document?.isDefault === true,
      isTemplate: document?.isTemplate === true,
      linkedJob,
      jobDescription: jobDescription || undefined,
      updatedAt: document?.updatedAt,
    };
  }

  async function toolListFoligoDocuments({ kind }) {
    if (kind !== 'resume' && kind !== 'coverLetter') {
      return { kind, documents: [], note: 'kind must be resume or coverLetter.' };
    }
    const [documents, selectedId, selectedSource] = await Promise.all([
      Filler.listDocuments(kind),
      Filler.getSelectedDocId(kind),
      Filler.getSelectedDocSource(kind),
    ]);
    return {
      kind,
      documents: documents.map((document) => ({
        ...summarizeFoligoDocument(document),
        selected: document?.id === selectedId,
        userSelected: document?.id === selectedId && selectedSource === 'user',
      })).filter((document) => document.documentId),
      selectionRequired: true,
      selectionSource: selectedId ? selectedSource : null,
      note: documents.length
        ? (selectedId && selectedSource === 'user'
            ? 'The user explicitly selected one document in the side panel. Attach that documentId unless it is unavailable.'
            : 'Choose the best matching documentId for this page, then pass that exact ID to attach_document.')
        : `No Foligo ${kind === 'resume' ? 'résumés' : 'cover letters'} are available.`,
    };
  }

  async function toolInspectFoligoDocument({ kind, documentId }) {
    const documents = await Filler.listDocuments(kind);
    const listed = documents.find((document) => document?.id === documentId);
    if (!listed) return { found: false, note: 'That documentId is not present in the current Foligo catalog.' };
    const document = await Filler.getDocument(kind, documentId);
    if (!document) return { found: false, note: 'Foligo could not load that document.' };
    const content = String(document.content || document.latexContent || document.text || '');
    return {
      found: true,
      document: summarizeFoligoDocument({ ...listed, ...document }),
      content: content.slice(0, 16000),
      contentTruncated: content.length > 16000,
    };
  }

  function currentJobWithOverrides(input = {}) {
    return {
      ...(currentJobInfo || {}),
      ...(input.company ? { company: input.company } : {}),
      ...(input.position ? { jobTitle: input.position, position: input.position } : {}),
      ...(input.url ? { url: input.url } : {}),
    };
  }

  function recognizableJob(jobInfo) {
    const company = String(jobInfo?.company || '').trim();
    const position = String(jobInfo?.jobTitle || jobInfo?.position || jobInfo?.title || '').trim();
    return Boolean(company && position);
  }

  async function toolTrackCurrentJob(input = {}) {
    const jobInfo = currentJobWithOverrides(input);
    if (!recognizableJob(jobInfo)) {
      return { tracked: false, note: 'Company and position could not be identified confidently on this page.' };
    }
    const result = await Tracker.trackApplication(jobInfo, input.status || 'saved', {
      allowStatusChange: false,
      company: input.company,
      position: input.position,
      category: input.category,
      tags: input.tags,
      notes: input.notes,
    });
    return {
      tracked: true,
      created: result.created,
      changed: result.changed,
      job: result.job,
      note: result.created ? 'Added this job to the Foligo board.' : 'This job was already tracked; its existing pipeline status was preserved.',
    };
  }

  async function toolListTrackedJobs({ query, status } = {}) {
    const jobs = await GoApplyAPI.getJobs(status);
    const needle = String(query || '').trim().toLowerCase();
    const matches = (jobs || []).filter((job) => !needle || [
      job.company, job.position, job.url, job.category, ...(Array.isArray(job.tags) ? job.tags : []),
    ].filter(Boolean).join(' ').toLowerCase().includes(needle));
    return {
      jobs: matches.slice(0, 50).map((job) => ({
        jobId: job.id,
        company: job.company,
        position: job.position,
        status: job.status,
        url: job.url,
        category: job.category,
        tags: job.tags,
        updatedAt: job.updatedAt,
      })),
      total: matches.length,
      truncated: matches.length > 50,
    };
  }

  async function toolUpdateJobStatus({ jobId, status, notes }) {
    const jobs = await GoApplyAPI.getJobs();
    const job = jobId
      ? (jobs || []).find((candidate) => candidate.id === jobId)
      : await Tracker.getTrackedApplication(currentJobInfo || { url: window.location.href });
    if (!job) {
      return { updated: false, note: jobId ? 'That Foligo job was not found.' : 'The current job is not tracked yet. Call track_current_job first.' };
    }
    const updatedJob = await GoApplyAPI.updateJob(job.id, {
      status,
      ...(notes !== undefined ? { notes } : {}),
      ...(status === 'applied' && !job.appliedAt ? { appliedAt: new Date().toISOString() } : {}),
    });
    return {
      updated: true,
      job: updatedJob,
      previousStatus: job.status,
      status: updatedJob.status,
    };
  }

  async function toolAttachDocument({ fieldRef, kind, documentId }) {
    const field = fieldRefs.get(fieldRef);
    if (!field) return { applied: false, note: 'Unknown fieldRef — rescan_page first.' };
    const expectedMethod = kind === 'resume' ? 'uploadResume' : 'uploadCoverLetter';
    if (field.method !== expectedMethod) {
      return { applied: false, note: `Field ${fieldRef} is not a ${kind} upload field.` };
    }
    if (!documentId) {
      return {
        applied: false,
        note: 'No Foligo documentId was supplied. Call list_foligo_documents, choose one document, then retry attach_document.',
      };
    }
    const documents = await Filler.listDocuments(kind);
    const selected = documents.find((document) => document?.id === documentId);
    if (!selected) {
      return {
        applied: false,
        note: `Foligo document "${documentId}" is unavailable. Refresh the catalog with list_foligo_documents.`,
      };
    }
    let profile = {};
    try { profile = (await Filler.loadProfile()) || {}; } catch (error) {}
    const result = await Filler.attachDocument(field, kind, documentId, profile);
    const file = field.element?.files?.[0];
    const fileName = file?.name || result?.retainedValue || result?.expectedValue;
    const applied = Boolean(result?.success && !result?.manual && fileName);
    if (applied) field._attachedFileName = fileName;
    return {
      applied,
      documentId,
      documentName: selected.name || 'Untitled document',
      fileName,
      note: result?.note || result?.reason || (!applied ? 'No Foligo document could be attached automatically.' : undefined),
    };
  }

  function toolFlagFieldUncertain({ fieldRef, reason }) {
    if (!fieldRefs.has(fieldRef)) return { flagged: false, note: 'Unknown fieldRef.' };
    flagged.set(fieldRef, reason);
    return { flagged: true };
  }

  async function toolClickElement({ elementRef, expectation }, callContext) {
    const nav = navRefs.get(elementRef);
    if (!nav) return { clicked: false, refused: 'Not a known navigation candidate.' };
    const liveLabel = (nav.element.textContent || nav.element.value || nav.element.getAttribute?.('aria-label') || '').trim();
    if (nav.likelyFinal || Tracker.isFinalSubmitText(liveLabel)) {
      return { clicked: false, refused: 'Refused: this looks like the final submit/apply action. The user must click that themselves.' };
    }
    if (!nav.element.isConnected || nav.element.disabled || nav.element.getAttribute?.('aria-disabled') === 'true') {
      return { clicked: false, refused: 'Navigation candidate is no longer available.' };
    }

    if (expectation === 'next-page') {
      const navigationOutput = { clicked: true, navigationStarted: true };
      await snapshotForNavigation([
        ...callContext.messages,
        {
          role: 'tool',
          content: [
            ...(callContext.pendingResults || []),
            toolResultPart(callContext.toolCallId, 'click_element', navigationOutput),
          ],
        },
      ], callContext.mode);
      navigationSnapshotPending = true;
    }

    const urlBefore = window.location.href;
    nav.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise((r) => setTimeout(r, 200));
    // CDP dispatch with a same-tab-click fallback — see Filler.clickElement.
    // The isFinalSubmitText refusal above already ran before this point, so
    // the click mechanism swap cannot affect the submit-safety gate.
    await Filler.clickElement(nav.element);
    await new Promise((r) => setTimeout(r, 500));
    const urlChanged = window.location.href !== urlBefore;
    return { clicked: true, urlChanged };
  }

  function toolFindSubmitButton() {
    const btn = Tracker.findSubmitButton(currentPlatform?.config);
    if (!btn) return { found: false };
    Tracker.highlightSubmitButton(btn);
    return { found: true, label: (btn.textContent || btn.value || '').trim().slice(0, 60) };
  }

  let onFieldsRefreshed = null;
  function setOnFieldsRefreshed(callback) { onFieldsRefreshed = callback; }

  // Multi-step wizards (Workday-style) don't always finish their async
  // transition by the time click_element's fixed 500ms wait returns. If the
  // model still has a live navRef to wait on, poll that specifically;
  // otherwise fall back to a generic "DOM stopped mutating" settle signal.
  function toolWaitForElement({ elementRef, timeoutMs = 4000 } = {}) {
    const started = Date.now();
    const nav = elementRef ? navRefs.get(elementRef) : null;
    if (nav) {
      return new Promise((resolve) => {
        const poll = () => {
          if (nav.element?.isConnected && nav.element.offsetParent !== null) {
            resolve({ ready: true, waitedMs: Date.now() - started });
          } else if (Date.now() - started >= timeoutMs) {
            resolve({ ready: false, waitedMs: Date.now() - started, note: 'Element did not become ready before the timeout.' });
          } else {
            setTimeout(poll, 150);
          }
        };
        poll();
      });
    }
    return new Promise((resolve) => {
      let settleTimer = null;
      const finish = (ready) => { observer.disconnect(); resolve({ ready, waitedMs: Date.now() - started }); };
      const hardTimeout = setTimeout(() => finish(false), timeoutMs);
      const observer = new MutationObserver(() => {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => { clearTimeout(hardTimeout); finish(true); }, 300);
      });
      observer.observe(document.body, { childList: true, subtree: true });
      settleTimer = setTimeout(() => { clearTimeout(hardTimeout); finish(true); }, 300);
    });
  }

  function toolReadPageText({ maxChars = 2000 } = {}) {
    const text = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
    return { text: text.slice(0, maxChars), truncated: text.length > maxChars };
  }

  function visibleElement(element) {
    if (!element?.isConnected) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  }

  function pageElementLabel(element) {
    return (
      element.getAttribute('aria-label')
      || element.getAttribute('title')
      || element.labels?.[0]?.innerText
      || element.innerText
      || element.value
      || element.getAttribute('placeholder')
      || element.getAttribute('alt')
      || ''
    ).replace(/\s+/g, ' ').trim().slice(0, 180);
  }

  function toolInspectPage({ maxElements = 80, maxTextChars = 6000, includeHiddenFiles = false } = {}) {
    pageRefs = new Map();
    const selector = [
      'a[href]', 'button', 'input:not([type="hidden"])', 'textarea', 'select',
      '[role="button"]', '[role="link"]', '[role="checkbox"]', '[role="radio"]',
      '[role="tab"]', '[role="menuitem"]', '[contenteditable="true"]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    const elements = [];
    const candidates = [...document.querySelectorAll(selector)];
    if (includeHiddenFiles) {
      for (const fileInput of document.querySelectorAll('input[type="file"]')) {
        if (!candidates.includes(fileInput)) candidates.push(fileInput);
      }
    }
    for (const element of candidates) {
      const hiddenFile = includeHiddenFiles && element.matches?.('input[type="file"]');
      if (!hiddenFile && !visibleElement(element)) continue;
      const ref = `p${elements.length}`;
      pageRefs.set(ref, element);
      const rect = element.getBoundingClientRect();
      elements.push({
        ref,
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute('role') || undefined,
        type: element.getAttribute('type') || undefined,
        label: pageElementLabel(element),
        value: ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName) ? String(element.value || '').slice(0, 300) : undefined,
        checked: typeof element.checked === 'boolean' ? element.checked : undefined,
        disabled: Boolean(element.disabled || element.getAttribute('aria-disabled') === 'true'),
        hidden: !visibleElement(element),
        href: element.href ? String(element.href).slice(0, 500) : undefined,
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      });
      if (elements.length >= maxElements) break;
    }
    const pageText = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
    return {
      url: location.href,
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight, scrollX, scrollY },
      elements,
      text: pageText.slice(0, maxTextChars),
      textTruncated: pageText.length > maxTextChars,
    };
  }

  function toolReadPage({ filter = 'all', ref_id: refId, max_chars: maxChars = 50000 } = {}) {
    const inspected = toolInspectPage({
      maxElements: filter === 'interactive' ? 200 : 300,
      maxTextChars: Math.min(50000, maxChars),
      includeHiddenFiles: filter === 'all',
    });
    let elements = inspected.elements;
    if (refId) {
      const root = pageRefs.get(refId);
      if (!root) return { error: 'Unknown ref_id. Read the page again without ref_id.' };
      const descendants = new Set([root, ...root.querySelectorAll('*')]);
      elements = elements.filter(({ ref }) => descendants.has(pageRefs.get(ref)));
    }
    return {
      ...inspected,
      filter,
      elements,
      output: elements.map((element) => {
        const state = [
          element.disabled ? 'disabled' : '',
          element.checked === true ? 'checked' : '',
          element.value ? `value="${element.value}"` : '',
        ].filter(Boolean).join(' ');
        return `[${element.ref}] ${element.role || element.tag}${element.type ? ` (${element.type})` : ''} "${element.label}"${state ? ` ${state}` : ''}`;
      }).join('\n'),
    };
  }

  function toolFind({ query }) {
    if (!pageRefs.size) toolInspectPage({ maxElements: 200, maxTextChars: 1000 });
    const terms = String(query || '').toLowerCase().split(/\W+/).filter((term) => term.length > 1);
    const matches = [];
    for (const [ref, element] of pageRefs) {
      if (!visibleElement(element)) continue;
      const haystack = [
        pageElementLabel(element), element.tagName, element.getAttribute('role'),
        element.getAttribute('type'), element.getAttribute('name'), element.id,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchedTerms = terms.filter((term) => haystack.includes(term));
      if (!terms.length || !matchedTerms.length) continue;
      matches.push({
        ref,
        role: element.getAttribute('role') || element.tagName.toLowerCase(),
        name: pageElementLabel(element),
        type: element.getAttribute('type') || undefined,
        score: matchedTerms.length / terms.length,
      });
    }
    matches.sort((a, b) => b.score - a.score);
    return {
      found: matches.length > 0,
      total: matches.length,
      matches: matches.slice(0, 20),
      truncated: matches.length > 20,
      ...(!matches.length ? { note: `No visible elements matched "${query}".` } : {}),
    };
  }

  async function toolFormInput({ ref, value }) {
    const element = pageRefs.get(ref);
    if (!element || !visibleElement(element)) {
      return { applied: false, note: 'Unknown or stale ref. Read the page again.' };
    }
    if (element instanceof HTMLInputElement && ['checkbox', 'radio'].includes(element.type)) {
      const checked = typeof value === 'boolean'
        ? value
        : ['true', 'yes', 'on', 'checked', element.value.toLowerCase()].includes(String(value).toLowerCase());
      if (element.type === 'radio' && !checked) {
        return { applied: false, note: 'A radio input can only be selected, not cleared directly.' };
      }
      element.click();
      if (element.type === 'checkbox' && element.checked !== checked) element.click();
      return { applied: element.checked === checked, retainedValue: element.checked };
    }
    if (element instanceof HTMLSelectElement) {
      const wanted = String(value).trim().toLowerCase();
      const option = [...element.options].find((candidate) =>
        candidate.value.toLowerCase() === wanted || candidate.textContent.trim().toLowerCase() === wanted
      );
      if (!option) return { applied: false, note: `No select option matched "${value}".` };
      element.value = option.value;
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      return { applied: element.value === option.value, retainedValue: option.textContent.trim() };
    }
    return toolTypeInPageElement({ elementRef: ref, text: String(value) });
  }

  async function toolUploadImage({ imageId, ref, coordinate }) {
    const referenced = ref ? pageRefs.get(ref) : null;
    if (ref && !referenced) return { applied: false, note: 'Unknown or stale ref. Read the page again.' };
    const target = referenced || (Array.isArray(coordinate) ? document.elementFromPoint(coordinate[0], coordinate[1]) : null);
    if (!target) return { applied: false, note: 'No upload target was found.' };
    const image = await backgroundBrowserTool('captured-image', { imageId });
    if (!image?.ok || !image.dataUrl) return { applied: false, note: image?.error || 'Captured image is unavailable.' };
    const blob = await fetch(image.dataUrl).then((response) => response.blob());
    const extension = (blob.type || 'image/png').split('/')[1]?.replace('jpeg', 'jpg') || 'png';
    const file = new File([blob], `goapply-capture-${imageId.slice(0, 8)}.${extension}`, { type: blob.type || 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const input = target.matches?.('input[type="file"]')
      ? target
      : target.querySelector?.('input[type="file"]');
    if (input) {
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      return {
        applied: input.files?.[0]?.name === file.name,
        fileName: input.files?.[0]?.name,
        target: 'file-input',
      };
    }
    for (const type of ['dragenter', 'dragover', 'drop']) {
      target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));
    }
    return { applied: true, fileName: file.name, target: 'drop-zone', note: 'Image drop was dispatched.' };
  }

  async function toolClickPageElement({ elementRef }) {
    const element = pageRefs.get(elementRef);
    if (!element || !visibleElement(element)) return { clicked: false, note: 'Unknown or no longer visible elementRef. Inspect the page again.' };
    const label = pageElementLabel(element);
    if (Tracker.isFinalSubmitText(label)) {
      return { clicked: false, refused: 'Final Submit/Apply actions are reserved for the user.' };
    }
    element.scrollIntoView({ block: 'center', inline: 'center' });
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Filler.clickElement(element);
    return { clicked: true, label };
  }

  async function toolTypeInPageElement({ elementRef, text }) {
    const element = pageRefs.get(elementRef);
    if (!element || !visibleElement(element)) return { applied: false, note: 'Unknown or no longer visible elementRef. Inspect the page again.' };
    if (!element.matches('input:not([type="hidden"]), textarea, [contenteditable="true"]')) {
      return { applied: false, note: 'The referenced element is not text-editable.' };
    }
    element.scrollIntoView({ block: 'center', inline: 'center' });
    element.focus();
    try {
      const result = await chrome.runtime.sendMessage({ action: 'cdp-type', text: String(text) });
      if (!result?.ok) throw new Error(result?.error || 'CDP typing failed');
    } catch (error) {
      if (element.isContentEditable) {
        element.textContent = String(text);
        element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: String(text) }));
      } else {
        const setter = Object.getOwnPropertyDescriptor(element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')?.set;
        setter?.call(element, String(text));
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    const retainedValue = element.isContentEditable ? element.innerText : element.value;
    return { applied: String(retainedValue || '') === String(text), retainedValue: String(retainedValue || '').slice(0, 1000) };
  }

  function toolScrollPage({ direction, amount = 'medium', elementRef }) {
    const target = elementRef ? pageRefs.get(elementRef) : window;
    if (!target) return { scrolled: false, note: 'Unknown elementRef. Inspect the page again.' };
    const scale = { small: 250, medium: 600, large: 1000, page: Math.max(300, innerHeight - 100) }[amount] || 600;
    const x = direction === 'left' ? -scale : direction === 'right' ? scale : 0;
    const y = direction === 'up' ? -scale : direction === 'down' ? scale : 0;
    target.scrollBy({ left: x, top: y, behavior: 'smooth' });
    return { scrolled: true, direction, amount };
  }

  async function backgroundBrowserTool(action, input = {}) {
    const result = await chrome.runtime.sendMessage({
      ...input,
      ...(input.action ? { browserAction: input.action } : {}),
      action: `browser-${action}`,
    });
    return result || { error: 'No response from browser service worker.' };
  }

  async function toolComputer(input) {
    if (input.action === 'wait') {
      const duration = Math.max(0, Math.min(30, Number(input.duration ?? 1)));
      await new Promise((resolve) => setTimeout(resolve, duration * 1000));
      return { ok: true, action: 'wait', waitedSeconds: duration };
    }
    const refElement = input.ref ? pageRefs.get(input.ref) : null;
    if (input.ref && !refElement) {
      return { ok: false, error: 'Unknown element ref. Read or inspect the page again.' };
    }
    if (input.action === 'scroll_to') {
      refElement.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      return { ok: true, action: 'scroll_to', ref: input.ref };
    }
    const refRect = refElement?.getBoundingClientRect?.();
    const refCenterX = refRect ? refRect.left + refRect.width / 2 : undefined;
    const refCenterY = refRect ? refRect.top + refRect.height / 2 : undefined;
    const coordinate = Array.isArray(input.coordinate) ? input.coordinate : null;
    const start = Array.isArray(input.start_coordinate) ? input.start_coordinate : null;
    const normalized = {
      ...input,
      x: input.action === 'left_click_drag'
        ? Number(start?.[0] ?? input.x)
        : Number(coordinate?.[0] ?? refCenterX ?? input.x),
      y: input.action === 'left_click_drag'
        ? Number(start?.[1] ?? input.y)
        : Number(coordinate?.[1] ?? refCenterY ?? input.y),
      endX: Number(coordinate?.[0] ?? input.endX),
      endY: Number(coordinate?.[1] ?? input.endY),
    };
    if (['left_click', 'double_click', 'triple_click', 'right_click'].includes(input.action)) {
      const hit = refElement || document.elementFromPoint(normalized.x, normalized.y);
      if (hit && Tracker.isFinalSubmitText(pageElementLabel(hit))) {
        return { ok: false, refused: 'Final Submit/Apply actions are reserved for the user.' };
      }
    }
    const result = await chrome.runtime.sendMessage({
      ...normalized,
      action: 'computer',
      computerAction: input.action === 'hover' ? 'mouse_move' : input.action,
    });
    return result || { ok: false, error: 'No response from computer controller.' };
  }

  async function toolBrowserBatch({ actions = [] }, callContext) {
    const results = [];
    for (let index = 0; index < actions.length; index++) {
      throwIfCancelled();
      const action = actions[index] || {};
      if (!action.name || action.name === 'browser_batch') {
        return { ok: false, stoppedAt: index, results, error: 'browser_batch cannot be nested and every action needs a name.' };
      }
      const output = await executeClientTool(action.name, action.input || {}, {
        ...callContext,
        toolCallId: `${callContext.toolCallId}:${index}`,
      });
      const succeeded = toolOutputSucceeded(action.name, output);
      results.push({ index, name: action.name, succeeded, output });
      if (!succeeded) {
        return { ok: false, stoppedAt: index, results, error: `${action.name} failed; remaining actions were not run.` };
      }
    }
    return { ok: true, results };
  }

  async function toolNavigateBrowser(input, callContext) {
    const navigationOutput = { ok: true, navigationStarted: true, action: input.action };
    await snapshotForNavigation([
      ...callContext.messages,
      {
        role: 'tool',
        content: [
          ...(callContext.pendingResults || []),
          toolResultPart(callContext.toolCallId, 'navigate_browser', navigationOutput),
        ],
      },
    ], callContext.mode);
    navigationSnapshotPending = true;
    return backgroundBrowserTool('navigate', input);
  }

  function toolRescanPage() {
    let fresh = [];
    try { fresh = Finder.findFields(currentPlatform?.config || { inputSelectors: [], containerPath: [] }); } catch (e) {}
    rebuildFromFoundFields(fresh);
    onFieldsRefreshed?.(fresh);
    return { fields: summarizeFields(), navCandidates: summarizeNavCandidates() };
  }

  const ADVANCE_TEXT_RE = /^(?:save\s*(?:&|and)\s*)?(?:next|continue|proceed)(?:\s+to\s+apply)?(?:\s*→)?$/i;

  function findSafeAdvanceCandidate() {
    // Refresh because many ATSs replace their footer after field changes.
    toolRescanPage();
    for (const [elementRef, nav] of navRefs) {
      const label = String(nav.label || '').replace(/\s+/g, ' ').trim();
      if (!nav.likelyFinal && ADVANCE_TEXT_RE.test(label)) return { elementRef, nav };
    }
    return null;
  }

  async function runApplicationFlow({ mode, messages, context, onEvent }, advancesLeft = 10) {
    const result = await continueTurn({ mode, messages, context, onEvent });
    throwIfCancelled();
    if (advancesLeft <= 0) return result;
    const candidate = findSafeAdvanceCandidate();
    if (!candidate) return result;

    const toolCallId = `auto-advance-${Date.now()}`;
    const toolCall = {
      type: 'tool-call', toolCallId, toolName: 'click_element',
      input: { elementRef: candidate.elementRef, expectation: 'next-page' },
    };
    messages.push({ role: 'assistant', content: [toolCall] });
    onEvent?.({ type: 'tool-call', toolCallId, toolName: 'click_element', input: toolCall.input });
    const output = await runCancellable(toolClickElement(toolCall.input, {
      toolCallId, mode, messages, pendingResults: [],
    }));
    messages.push({ role: 'tool', content: [toolResultPart(toolCallId, 'click_element', output)] });
    onEvent?.({
      type: 'tool-result', toolCallId, toolName: 'click_element',
      output, succeeded: output.clicked === true, clientExecuted: true,
    });
    if (!output.clicked) return result;

    await runCancellable(toolWaitForElement({ timeoutMs: 5000 }));
    toolRescanPage();
    messages.push({
      role: 'user',
      content: [textPart('(GoApply advanced to the next application step. Continue filling every answerable field on this fresh step.)')],
    });
    return runApplicationFlow({ mode, messages, context: buildContext(), onEvent }, advancesLeft - 1);
  }

  // Page-mutating DOM tools whose result an active gif_creator recording
  // should capture. computer and navigate_browser are hooked in the service
  // worker itself (with real coordinates), so they are not hinted here.
  const GIF_RECORDABLE_TOOLS = new Map([
    ['click_page_element', 'Click'],
    ['type_in_page_element', 'Type'],
    ['scroll_page', 'Scroll'],
    ['form_input', 'Fill field'],
    ['set_field_value', 'Fill field'],
    ['set_field_values', 'Fill fields'],
    ['select_field_option', 'Select option'],
    ['set_checkbox_state', 'Toggle checkbox'],
    ['click_element', 'Click'],
    ['upload_image', 'Upload file'],
    ['attach_document', 'Attach document'],
  ]);

  function hintGifFrame(toolName, output) {
    if (!GIF_RECORDABLE_TOOLS.has(toolName) || !toolOutputSucceeded(toolName, output)) return;
    try {
      chrome.runtime.sendMessage({ action: 'gif-frame', label: GIF_RECORDABLE_TOOLS.get(toolName) }).catch(() => {});
    } catch (error) {}
  }

  async function executeClientTool(toolName, input, callContext = {}) {
    const tabScopedDomTools = new Set([
      'inspect_page', 'read_page', 'find', 'form_input', 'get_page_text',
      'click_page_element', 'type_in_page_element', 'scroll_page', 'computer', 'upload_image',
    ]);
    if (tabScopedDomTools.has(toolName) && Number.isInteger(input?.tabId)) {
      const own = await chrome.runtime.sendMessage({ action: 'get-own-tab-id' }).catch(() => null);
      if (own?.tabId != null && input.tabId !== own.tabId) {
        // The target tab's own controller hints the recorder for this call.
        return chrome.runtime.sendMessage({
          action: 'browser-tab-tool',
          tabId: input.tabId,
          toolName,
          input,
        });
      }
    }
    const output = await dispatchClientTool(toolName, input, callContext);
    hintGifFrame(toolName, output);
    return output;
  }

  async function dispatchClientTool(toolName, input, callContext = {}) {
    switch (toolName) {
      case 'set_field_value': return toolSetFieldValue(input);
      case 'set_field_values': return toolSetFieldValues(input);
      case 'inspect_field_control': return toolInspectFieldControl(input);
      case 'select_field_option': return toolSelectFieldOption(input);
      case 'set_checkbox_state': return toolSetCheckboxState(input);
      case 'list_foligo_documents': return toolListFoligoDocuments(input);
      case 'inspect_foligo_document': return toolInspectFoligoDocument(input);
      case 'attach_document': return toolAttachDocument(input);
      case 'track_current_job': return toolTrackCurrentJob(input);
      case 'list_tracked_jobs': return toolListTrackedJobs(input);
      case 'update_job_status': return toolUpdateJobStatus(input);
      case 'flag_field_uncertain': return toolFlagFieldUncertain(input);
      case 'click_element': return toolClickElement(input, callContext);
      case 'find_submit_button': return toolFindSubmitButton();
      case 'rescan_page': return toolRescanPage();
      case 'wait_for_element': return toolWaitForElement(input);
      case 'read_page_text': return toolReadPageText(input);
      case 'inspect_page': return toolInspectPage(input);
      case 'read_page': return toolReadPage(input);
      case 'find': return toolFind(input);
      case 'form_input': return toolFormInput(input);
      case 'get_page_text': return toolReadPageText({ maxChars: input.max_chars });
      case 'javascript_tool': return backgroundBrowserTool('javascript', input);
      case 'read_console_messages': return backgroundBrowserTool('console-messages', input);
      case 'read_network_requests': return backgroundBrowserTool('network-requests', input);
      case 'upload_image': return toolUploadImage(input);
      case 'computer': return toolComputer(input);
      case 'browser_batch': return toolBrowserBatch(input, callContext);
      case 'click_page_element': return toolClickPageElement(input);
      case 'type_in_page_element': return toolTypeInPageElement(input);
      case 'scroll_page': return toolScrollPage(input);
      case 'navigate_browser': return toolNavigateBrowser(input, callContext);
      case 'get_tabs': return backgroundBrowserTool('tabs');
      case 'tabs_context_mcp': return backgroundBrowserTool('tabs-context');
      case 'create_tab': return backgroundBrowserTool('create-tab', input);
      case 'tabs_create_mcp': return backgroundBrowserTool('create-tab', input);
      case 'activate_tab': return backgroundBrowserTool('activate-tab', input);
      case 'close_tab': return backgroundBrowserTool('close-tab', input);
      case 'tabs_close_mcp': return backgroundBrowserTool('close-tab', input);
      case 'resize_window': return backgroundBrowserTool('resize-window', input);
      case 'take_screenshot': return backgroundBrowserTool('screenshot');
      case 'gif_creator': return backgroundBrowserTool('gif', input);
      case 'group_tabs': return backgroundBrowserTool('group-tabs', input);
      case 'download_file': return backgroundBrowserTool('download', input);
      case 'schedule_browser_task': return backgroundBrowserTool('schedule', input);
      case 'list_scheduled_tasks': return backgroundBrowserTool('scheduled-tasks');
      case 'cancel_scheduled_task': return backgroundBrowserTool('cancel-scheduled-task', input);
      default: return { error: `Unknown client tool: ${toolName}` };
    }
  }

  function toolOutputSucceeded(toolName, output) {
    if (!output || output.error || output.refused) return false;
    if (toolName === 'list_foligo_documents') return Array.isArray(output.documents);
    if (toolName === 'list_tracked_jobs') return Array.isArray(output.jobs);
    if (toolName === 'track_current_job') return output.tracked === true;
    if (toolName === 'update_job_status') return output.updated === true;
    if ('applied' in output) return output.applied === true;
    if ('clicked' in output) return output.clicked === true;
    if ('flagged' in output) return output.flagged === true;
    if ('found' in output) return output.found === true;
    if ('ready' in output) return output.ready === true;
    if ('scrolled' in output) return output.scrolled === true;
    if ('ok' in output) return output.ok === true;
    if (toolName === 'set_field_values') {
      return Array.isArray(output.results) && output.results.every(result => result.applied === true);
    }
    return true;
  }

  // ─── Navigation persistence ───────────────────────────────────────

  function getSessionId() {
    const storageKey = 'goapplyAgentSessionId';
    try {
      let sessionId = window.sessionStorage.getItem(storageKey);
      if (!sessionId) {
        sessionId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        window.sessionStorage.setItem(storageKey, sessionId);
      }
      return sessionId;
    } catch (e) {
      return `${window.location.hostname}${window.location.pathname.split('/').slice(0, 2).join('/')}`;
    }
  }

  let stableTabSessionId = null;
  async function getStableSessionId() {
    if (stableTabSessionId) return stableTabSessionId;
    try {
      const response = await chrome.runtime.sendMessage({ action: 'get-own-tab-id' });
      if (response?.tabId != null) {
        stableTabSessionId = `tab-${response.tabId}`;
        return stableTabSessionId;
      }
    } catch (error) {}
    return getSessionId();
  }

  async function snapshotKey() {
    return `goapplyAgent:${await getStableSessionId()}`;
  }

  async function snapshotForNavigation(messages = activeSession?.messages, mode = activeSession?.mode) {
    if (!messages || !mode) return;
    try {
      const key = await snapshotKey();
      await chrome.storage.session?.set({
        [key]: { messages, mode, savedAt: Date.now() },
      });
    } catch (e) {}
  }

  async function restoreSnapshot() {
    try {
      const key = await snapshotKey();
      const stored = await chrome.storage.session?.get(key);
      const snap = stored?.[key];
      if (!snap || Date.now() - snap.savedAt > SNAPSHOT_TTL_MS) return null;
      await chrome.storage.session?.remove(key);
      return snap;
    } catch (e) { return null; }
  }

  // ─── Turn loop ─────────────────────────────────────────────────────

  function textPart(text) { return { type: 'text', text }; }

  function jsonOutput(value) {
    return { type: 'json', value: value === undefined ? null : value };
  }

  function withoutInlineImages(value) {
    if (Array.isArray(value)) return value.map(withoutInlineImages);
    if (!value || typeof value !== 'object') return value;
    const clean = {};
    for (const [key, nested] of Object.entries(value)) {
      clean[key] = key === 'dataUrl' && typeof nested === 'string' && nested.startsWith('data:image/')
        ? '[image attached to the next model message]'
        : withoutInlineImages(nested);
    }
    return clean;
  }

  function collectImageDataUrls(value, found = []) {
    if (found.length >= 3 || !value) return found;
    if (Array.isArray(value)) {
      for (const item of value) collectImageDataUrls(item, found);
      return found;
    }
    if (typeof value !== 'object') return found;
    for (const [key, nested] of Object.entries(value)) {
      if (key === 'dataUrl' && typeof nested === 'string' && nested.startsWith('data:image/')) {
        found.push(nested);
      } else {
        collectImageDataUrls(nested, found);
      }
      if (found.length >= 3) break;
    }
    return found;
  }

  function toolResultPart(toolCallId, toolName, value, isError = false) {
    return {
      type: 'tool-result',
      toolCallId,
      toolName,
      output: isError ? { type: 'error-text', value: String(value) } : jsonOutput(withoutInlineImages(value)),
    };
  }

  function throwIfCancelled() {
    if (!cancelRequested) return;
    const error = new Error('Stopped by user.');
    error.code = 'USER_STOPPED';
    throw error;
  }

  function runCancellable(operation) {
    return new Promise((resolve, reject) => {
      const cancel = () => {
        const error = new Error('Stopped by user.');
        error.code = 'USER_STOPPED';
        reject(error);
      };
      cancelWaiters.add(cancel);
      Promise.resolve(operation).then(resolve, reject).finally(() => cancelWaiters.delete(cancel));
      if (cancelRequested) cancel();
    });
  }

  // AI SDK requires every assistant tool-call part to be followed by a tool
  // result before another user/assistant message. Repair legacy snapshots or
  // sessions that were interrupted between those two writes so one bad turn
  // cannot permanently poison the conversation.
  function repairToolHistory(messages) {
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (message?.role !== 'assistant' || !Array.isArray(message.content)) continue;
      const calls = message.content.filter(part => part?.type === 'tool-call');
      if (!calls.length) continue;

      const next = messages[i + 1];
      const existingResults = next?.role === 'tool' && Array.isArray(next.content) ? next.content : [];
      const resultIds = new Set(existingResults.map(part => part?.toolCallId).filter(Boolean));
      const missing = calls.filter(call => !resultIds.has(call.toolCallId));
      if (!missing.length) continue;

      const repairs = missing.map(call => toolResultPart(
        call.toolCallId,
        call.toolName,
        'The tool was interrupted before it returned a result. Rescan and retry if it is still needed.',
        true,
      ));
      if (next?.role === 'tool' && Array.isArray(next.content)) next.content.push(...repairs);
      else messages.splice(i + 1, 0, { role: 'tool', content: repairs });
      i++;
    }
    return messages;
  }

  function getAgentPort() {
    if (agentPort) return agentPort;
    agentPort = GoApplyAPI.openAgentPort();
    agentPort.onDisconnect.addListener(() => { agentPort = null; });
    return agentPort;
  }

  // Server-side history replay flattens past tool calls into literal lines
  // like `[Requested tool select_field_option: {...}]` (see
  // message-history.js) so providers that reject native tool-call history
  // still have that context. A model struggling with structured tool-calling
  // will sometimes copy that exact format back as its own new text instead
  // of actually invoking the tool — the field never gets touched even though
  // the transcript reads as if it did. Matched verbatim against our own
  // flattening format, so this is reliable rather than a heuristic guess.
  const FAKE_TOOL_CALL_LINE_RE = /^\[Requested tool ([a-zA-Z0-9_]+):\s*(\{.*\})\]$/;

  async function sendPortRequestOnce(turnBody, onEvent) {
    const request = await GoApplyAPI.buildAgentRequest(turnBody);
    return new Promise((resolve, reject) => {
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const port = getAgentPort();
      // Only one request is ever in flight at a time (continueTurn awaits
      // each one sequentially), so a single mutable slot always points at
      // whichever request stop() should target.
      currentRequestId = requestId;
      currentAbortReject = reject;

      const toolCalls = new Map(); // toolCallId -> { toolName, input, resolved }
      let assistantText = '';
      let streamError = null;

      // Buffer text-delta output by line so a fake-tool-call line never
      // reaches onEvent/the UI at all — the old approach only cleaned it up
      // after the fact (in continueTurn), so it still visibly flashed on
      // screen before self-correcting. assistantText still accumulates the
      // raw text (fake lines included) for continueTurn's corrective-retry
      // logic; only what's forwarded to onEvent is filtered.
      let lineBuffer = '';
      function emitSafeLine(line, trailingNewline) {
        if (FAKE_TOOL_CALL_LINE_RE.test(line.trim())) return;
        if (line || trailingNewline) onEvent?.({ type: 'text-delta', text: line + (trailingNewline ? '\n' : '') });
      }
      function bufferTextDelta(text) {
        lineBuffer += text;
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop();
        for (const line of lines) emitSafeLine(line, true);
      }
      function flushLineBuffer() {
        if (lineBuffer) emitSafeLine(lineBuffer, false);
        lineBuffer = '';
      }

      const cleanup = () => {
        port.onMessage.removeListener(handleMessage);
        port.onDisconnect.removeListener(handleDisconnect);
        if (currentRequestId === requestId) {
          currentRequestId = null;
          currentAbortReject = null;
          currentAbortCleanup = null;
        }
      };
      currentAbortCleanup = cleanup;
      const handleDisconnect = () => {
        cleanup();
        const error = new Error('Agent connection closed before the stream completed.');
        error.code = 'AGENT_PORT_DISCONNECTED';
        error.partialToolCalls = [...toolCalls.entries()].map(([toolCallId, call]) => ({ toolCallId, ...call }));
        reject(error);
      };

      const handleMessage = (message) => {
        if (message.requestId !== requestId) return;
        if (message.type === 'agent-event') {
          const event = message.event;
          if (event.type === 'text-delta') { assistantText += event.text; bufferTextDelta(event.text); return; }
          if (event.type === 'error') streamError = new Error(event.message || 'Agent stream failed.');
          if (event.type === 'tool-call') toolCalls.set(event.toolCallId, { toolName: event.toolName, input: event.input, resolved: false });
          if (event.type === 'tool-result' || event.type === 'tool-error') {
            const entry = toolCalls.get(event.toolCallId);
            if (entry) {
              entry.resolved = true;
              entry.output = event.type === 'tool-result' ? event.output : event.error;
              entry.isError = event.type === 'tool-error';
            }
          }
          onEvent?.(event);
        } else if (message.type === 'agent-done') {
          flushLineBuffer();
          cleanup();
          if (streamError) reject(streamError);
          else resolve({ assistantText, toolCalls });
        } else if (message.type === 'agent-error') {
          cleanup();
          reject(new Error(message.message));
        }
      };

      port.onMessage.addListener(handleMessage);
      port.onDisconnect.addListener(handleDisconnect);

      try {
        port.postMessage({ type: 'agent-request', requestId, url: request.url, options: request.options });
      } catch (error) {
        cleanup();
        agentPort = null;
        reject(error);
      }
    });
  }

  const RETRY_SAFE_SERVER_TOOLS = new Set([
    'get_resume', 'get_cover_letter', 'get_goapply_profile', 'get_saved_answers',
    'generate_cover_letter', 'generate_custom_answer',
  ]);

  async function sendPortRequest(turnBody, onEvent) {
    try {
      return await sendPortRequestOnce(turnBody, onEvent);
    } catch (error) {
      const partialCalls = error.partialToolCalls || [];
      const safeToReplay = error.code === 'AGENT_PORT_DISCONNECTED'
        && partialCalls.every(call => RETRY_SAFE_SERVER_TOOLS.has(call.toolName));
      if (!safeToReplay) throw error;

      for (const call of partialCalls) {
        onEvent?.({
          type: 'tool-error', toolCallId: call.toolCallId, toolName: call.toolName,
          error: 'Connection interrupted; retrying safely…', clientExecuted: false,
        });
      }
      onEvent?.({ type: 'transport-retry', message: 'Connection interrupted — reconnecting…' });
      agentPort = null;
      await new Promise(resolve => setTimeout(resolve, 250));
      return sendPortRequestOnce(turnBody, onEvent);
    }
  }

  // Strip any fake-narration lines that slipped through, before they're
  // ever stored back into history (so a bad turn doesn't reinforce the
  // pattern for the *next* turn), and force one corrective continuation
  // instead of silently accepting the narration as if it were a real action.
  function stripFakeToolCallNarration(text) {
    if (!text) return { cleanText: text, fakeCalls: [] };
    const fakeCalls = [];
    const kept = text.split('\n').filter((line) => {
      const match = FAKE_TOOL_CALL_LINE_RE.exec(line.trim());
      if (!match) return true;
      fakeCalls.push({ toolName: match[1], input: match[2] });
      return false;
    });
    return { cleanText: kept.join('\n').trim(), fakeCalls };
  }

  async function continueTurn({ mode, messages, context, onEvent }, depth = 0) {
    throwIfCancelled();
    repairToolHistory(messages);
    const raw = await sendPortRequest({ mode, messages, context }, onEvent);
    throwIfCancelled();
    const toolCalls = raw.toolCalls;
    const { cleanText: assistantText, fakeCalls } = stripFakeToolCallNarration(raw.assistantText);
    if (fakeCalls.length) {
      console.warn('[GoApply:Agent] Model narrated fake tool calls instead of invoking them:', fakeCalls);
      onEvent?.({
        type: 'tool-error', toolCallId: `fake-${Date.now()}`, toolName: fakeCalls[0].toolName,
        error: `Described ${fakeCalls.length > 1 ? `${fakeCalls.length} actions` : 'an action'} instead of performing ${fakeCalls.length > 1 ? 'them' : 'it'} — retrying…`,
        clientExecuted: false,
      });
    }

    const assistantContent = [];
    if (assistantText) assistantContent.push(textPart(assistantText));
    for (const [toolCallId, call] of toolCalls) {
      assistantContent.push({ type: 'tool-call', toolCallId, toolName: call.toolName, input: call.input });
    }
    if (assistantContent.length) messages.push({ role: 'assistant', content: assistantContent });

    const pendingResults = [];
    const pendingImages = [];
    for (const [toolCallId, call] of toolCalls) {
      if (call.resolved) {
        pendingResults.push(toolResultPart(toolCallId, call.toolName, call.output, call.isError));
      }
    }
    const clientCalls = [...toolCalls.entries()]
      .filter(([, call]) => !call.resolved)
      // Navigation runs last so the pre-click snapshot can contain every
      // other tool result from this assistant message.
      .sort(([, a], [, b]) => Number(a.toolName === 'click_element') - Number(b.toolName === 'click_element'));
    for (const [toolCallId, call] of clientCalls) {
      throwIfCancelled();
      if (depth >= MAX_CONTINUATIONS) {
        const message = `Client tool was not executed because the ${MAX_CONTINUATIONS}-continuation safety limit was reached.`;
        pendingResults.push(toolResultPart(toolCallId, call.toolName, message, true));
        onEvent?.({ type: 'tool-error', toolCallId, toolName: call.toolName, error: message, clientExecuted: false });
        continue;
      }
      try {
        if (['inspect_field_control', 'select_field_option'].includes(call.toolName) && call.input?.fieldRef) {
          const attempts = messages.reduce((count, message) => count + (
            message.role === 'assistant' && Array.isArray(message.content)
              ? message.content.filter(part =>
                part?.type === 'tool-call'
                && part.toolName === call.toolName
                && part.input?.fieldRef === call.input.fieldRef
              ).length
              : 0
          ), 0);
          const limit = call.toolName === 'inspect_field_control' ? 3 : 4;
          if (attempts > limit) {
            const output = {
              error: `Retry limit reached for ${call.input.fieldRef}. Do not inspect/select it again in this task; flag it if unresolved and continue to the next application step.`,
            };
            pendingResults.push(toolResultPart(toolCallId, call.toolName, output, true));
            onEvent?.({ type: 'tool-error', toolCallId, toolName: call.toolName, error: output.error, clientExecuted: false });
            continue;
          }
        }
        const output = await runCancellable(
          executeClientTool(call.toolName, call.input, { toolCallId, mode, messages, pendingResults })
        );
        throwIfCancelled();
        collectImageDataUrls(output, pendingImages);
        pendingResults.push(toolResultPart(toolCallId, call.toolName, output));
        const succeeded = toolOutputSucceeded(call.toolName, output);
        if (!succeeded) console.warn('[GoApply:Agent]', call.toolName, 'did not apply:', output);
        onEvent?.({ type: 'tool-result', toolCallId, toolName: call.toolName, output, succeeded, clientExecuted: true });
      } catch (error) {
        pendingResults.push(toolResultPart(toolCallId, call.toolName, error.message || String(error), true));
        onEvent?.({ type: 'tool-error', toolCallId, toolName: call.toolName, error: error.message || String(error), clientExecuted: true });
      }
    }
    if (pendingResults.length) messages.push({ role: 'tool', content: pendingResults });
    if (pendingImages.length) {
      messages.push({
        role: 'user',
        content: [
          textPart('Screenshot result(s) from the browser tool call above:'),
          ...pendingImages.map((image) => ({ type: 'image', image, mediaType: 'image/png' })),
        ],
      });
    }

    if (fakeCalls.length && depth < MAX_CONTINUATIONS) {
      const names = [...new Set(fakeCalls.map((call) => call.toolName))].join(', ');
      messages.push({
        role: 'user',
        content: [textPart(
          `The line(s) above starting with "[Requested tool ...]" were plain text, not real tool calls — nothing happened and the field(s) are still unfilled. ` +
          `Actually invoke the real tool(s) now (${names}) using the tool-calling mechanism, not text.`,
        )],
      });
    }

    const needsContinuation = toolCalls.size > 0 || fakeCalls.length > 0;
    if (!needsContinuation || depth >= MAX_CONTINUATIONS) {
      activeSession = { mode, messages };
      await persistWorkspaceSession();
      return { done: true, assistantText, continuationLimitReached: depth >= MAX_CONTINUATIONS && needsContinuation };
    }
    activeSession = { mode, messages };
    await persistWorkspaceSession();

    // Context may have changed (rescan_page, click_element navigating a
    // same-page step) — rebuild it fresh for the continuation request.
    const nextContext = buildContext(context?.targetFieldRef);
    throwIfCancelled();
    return continueTurn({ mode, messages, context: nextContext, onEvent }, depth + 1);
  }

  // ─── Public entry points ──────────────────────────────────────────

  function initializePage(foundFields, platform, jobInfo) {
    currentPlatform = platform;
    currentJobInfo = jobInfo;
    rebuildFromFoundFields(foundFields);
  }

  async function runWithTurnState(run) {
    if (isRunning) throw new Error('Another GoApply agent turn is already running.');
    isRunning = true;
    cancelRequested = false;
    if (typeof UI !== 'undefined') UI.showAgentBorder();
    try {
      return await run();
    } finally {
      isRunning = false;
      cancelRequested = false;
      currentRequestId = null;
      currentAbortReject = null;
      currentAbortCleanup = null;
      if (resetRequested) {
        activeSession = null;
        resetRefs();
        flagged = new Map();
        resetRequested = false;
        clearWorkspaceSession();
      }
      if (typeof UI !== 'undefined') UI.hideAgentBorder();
      // A same-document/SPA flow reaches this cleanup after its continuation
      // finishes. A real navigation destroys this script context first, so
      // the snapshot remains available to the next document.
      if (navigationSnapshotPending && !pageIsUnloading) {
        navigationSnapshotPending = false;
        try { await chrome.storage.session?.remove(await snapshotKey()); } catch (e) {}
      }
    }
  }

  async function startRescan(foundFields, platform, jobInfo, onEvent) {
    initializePage(foundFields, platform, jobInfo);
    const messages = [{
      role: 'user',
      content: [textPart('Please identify and safely track this job on my Foligo board, then review this application page and fill in whatever you can.')],
    }];
    return runWithTurnState(() => runApplicationFlow({ mode: 'rescan', messages, context: buildContext(), onEvent }));
  }

  async function startFieldFill(fieldRef, platform, jobInfo, onEvent) {
    currentPlatform = platform;
    currentJobInfo = jobInfo;
    if (!fieldRefs.size) toolRescanPage();
    const messages = [{ role: 'user', content: [textPart(`Please resolve just the field ${fieldRef}.`)] }];
    return runWithTurnState(() => continueTurn({ mode: 'field', messages, context: buildContext(fieldRef), onEvent }));
  }

  async function sendChatMessage(text, platform, jobInfo, onEvent) {
    // Page/job context is live state, not conversation state. Keeping the
    // first non-null jobInfo caused later roles at the same company to reuse
    // the prior role's canonical URL and requisition identity.
    if (platform) currentPlatform = platform;
    if (jobInfo) currentJobInfo = jobInfo;
    if (!fieldRefs.size) toolRescanPage();
    await restoreWorkspaceSession();
    // Rescan and single-field turns are part of the same group conversation;
    // retain their tool/results when the user follows up in chat.
    const messages = Array.isArray(activeSession?.messages) ? activeSession.messages.slice() : [];
    repairToolHistory(messages);
    const applicationWork = /\b(fill|complete|apply|application)\b/i.test(text);
    messages.push({
      role: 'user',
      content: [textPart(applicationWork
        ? `${text}\n\n(While working on this application, identify it and ensure it is safely tracked on my Foligo board.)`
        : text)],
    });
    return runWithTurnState(async () => {
      if (applicationWork) {
        return runApplicationFlow({ mode: 'chat', messages, context: buildContext(), onEvent });
      }
      return continueTurn({ mode: 'chat', messages, context: buildContext(), onEvent });
    });
  }

  async function tryRestoreAfterNavigation(platform, jobInfo, onEvent, onRestore) {
    if (isRunning) return false;
    const snap = await restoreSnapshot();
    if (!snap) return false;
    currentPlatform = platform;
    currentJobInfo = jobInfo;
    toolRescanPage();
    onRestore?.(snap.messages);
    repairToolHistory(snap.messages);
    snap.messages.push({ role: 'user', content: [textPart('(The page navigated. Here is the fresh page state — continue.)')] });
    await runWithTurnState(() => continueTurn({ mode: snap.mode, messages: snap.messages, context: buildContext(), onEvent }));
    return true;
  }

  function getFlaggedRefs() { return new Map(flagged); }

  // Cancels whichever request is currently in flight. Takes effect at the
  // next network boundary — a client tool already mid-execution (e.g. a CDP
  // click in progress) finishes that one action first, same as most agentic
  // tools; this isn't a hard kill of DOM work already underway.
  function stop() {
    if (!isRunning && !currentRequestId) return false;
    cancelRequested = true;
    for (const cancel of [...cancelWaiters]) cancel();
    cancelWaiters.clear();
    if (currentRequestId) {
      try { agentPort?.postMessage({ type: 'agent-abort', requestId: currentRequestId }); } catch (e) {}
    }
    const reject = currentAbortReject;
    const cleanup = currentAbortCleanup;
    currentRequestId = null;
    currentAbortReject = null;
    currentAbortCleanup = null;
    cleanup?.();
    if (reject) {
      const error = new Error('Stopped by user.');
      error.code = 'USER_STOPPED';
      reject(error);
    }
    return true;
  }

  function isBusy() { return isRunning; }

  function resetSession() {
    if (isRunning) {
      resetRequested = true;
      stop();
      return true;
    }
    activeSession = null;
    resetRefs();
    flagged = new Map();
    clearWorkspaceSession();
    return true;
  }

  const EXTERNAL_TAB_TOOLS = new Set([
    'inspect_page', 'read_page', 'find', 'form_input', 'get_page_text',
    'click_page_element', 'type_in_page_element', 'scroll_page', 'computer', 'upload_image',
  ]);

  async function executeExternalTool(toolName, input = {}) {
    if (!EXTERNAL_TAB_TOOLS.has(toolName)) return { error: `Tool ${toolName} cannot be executed through a remote tab.` };
    return executeClientTool(toolName, input);
  }

  return {
    initializePage, startRescan, startFieldFill, sendChatMessage, tryRestoreAfterNavigation,
    getFlaggedRefs, setOnFieldsRefreshed, stop, isBusy, resetSession, executeExternalTool,
  };
})();
