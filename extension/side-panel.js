/**
 * Side panel — persistent chat surface for the GoApply AI agent.
 * Lives in extension context (survives page navigation natively, immune to
 * host-page CSS) but cannot touch a tab's DOM directly, so it drives the
 * agent by messaging that tab's content script (main.js), which still owns
 * AgentController and executes tools against the live page. Streamed agent
 * events are broadcast from the content script via chrome.runtime.sendMessage
 * (tagged with the source tab id) and rendered here as they arrive.
 */
(function SidePanel() {
  'use strict';

  const messagesEl = document.getElementById('sp-messages');
  const statusEl = document.getElementById('sp-tab-status');
  const inputEl = document.getElementById('sp-input');
  const sendBtn = document.getElementById('sp-send');
  const rescanBtn = document.getElementById('sp-rescan');
  const stopBtn = document.getElementById('sp-stop');
  const autofillBtn = document.getElementById('sp-autofill');
  const resumeSelect = document.getElementById('sp-resume-select');
  const resumeRefreshBtn = document.getElementById('sp-resume-refresh');
  const jobStatusSelect = document.getElementById('sp-job-status');
  const statusSaveBtn = document.getElementById('sp-status-save');
  const contextNoteEl = document.getElementById('sp-context-note');
  const uploadNoteEl = document.getElementById('sp-upload-note');
  const findSubmitBtn = document.getElementById('sp-find-submit');
  const jobCategorySelect = document.getElementById('sp-job-category');
  const jobNameEl = document.getElementById('sp-job-name');
  const jobBadgeEl = document.getElementById('sp-job-badge');
  const jobSelectToggle = document.getElementById('sp-job-select-toggle');
  const jobSelectRow = document.getElementById('sp-job-select-row');
  const jobSelect = document.getElementById('sp-job-select');
  const jobSelectRefresh = document.getElementById('sp-job-select-refresh');
  const docsListEl = document.getElementById('sp-docs-list');
  const createResumeBtn = document.getElementById('sp-create-resume');
  const createCoverBtn = document.getElementById('sp-create-cover');
  const qaQuestionEl = document.getElementById('sp-qa-question');
  const qaAnswerEl = document.getElementById('sp-qa-answer');
  const qaDraftBtn = document.getElementById('sp-qa-draft');
  const qaSaveBtn = document.getElementById('sp-qa-save');
  const qaStatusEl = document.getElementById('sp-qa-status');
  const fieldsToggle = document.getElementById('sp-fields-toggle');
  const fieldListEl = document.getElementById('sp-field-list');
  const accountStatusEl = document.getElementById('sp-account-status');
  const connectBtn = document.getElementById('sp-connect-btn');
  const signOutBtn = document.getElementById('sp-signout-btn');
  const boardBtn = document.getElementById('sp-board-btn');
  const settingsBtn = document.getElementById('sp-settings-btn');
  const deviceCodeEl = document.getElementById('sp-device-code');
  const deviceCodeValueEl = document.getElementById('sp-device-code-value');
  const cancelDeviceBtn = document.getElementById('sp-cancel-device-btn');
  const historyBtn = document.getElementById('sp-history-btn');
  const newChatBtn = document.getElementById('sp-new-chat-btn');
  const historyViewEl = document.getElementById('sp-history-view');
  const historyBackBtn = document.getElementById('sp-history-back');
  const historyListEl = document.getElementById('sp-history-list');
  const composeEl = document.querySelector('.sp-compose');

  let trackedTabId = null;
  let trackedGroupId = chrome.tabGroups.TAB_GROUP_ID_NONE;
  let currentWorkspaceId = null;
  let historySaveTimer = null;
  let fieldListOpen = false;
  let currentAssistantEl = null;
  let currentAssistantRaw = '';
  let currentThinkingEl = null;
  let currentThinkingRaw = '';
  let ignoreAgentEvents = false;
  let chatGeneration = 0;
  let agentOwnerTabId = null;
  const toolChips = new Map();
  let currentTrackedJob = null;
  let currentPageTrackable = false;
  let trackingControlsAvailable = false;
  let trackingActionPromise = null;
  let pendingAiTrack = null;
  // A tracked job the user picked by hand when the extension lost the page —
  // when set it overrides page detection for the documents/Q&A sections.
  let activeJobOverride = null;
  let currentPageJobInfo = null;
  let cachedProfile = null;
  let docsActionBusy = false;

  // The job the documents + Q&A sections operate on: an explicit manual pick
  // wins, otherwise the tracked card matched to the current page.
  function effectiveJob() {
    return activeJobOverride || currentTrackedJob || null;
  }

  function syncTrackingControlState() {
    const disabled = !trackingControlsAvailable || Boolean(trackingActionPromise) || Boolean(pendingAiTrack) || agentBusy;
    jobStatusSelect.disabled = disabled;
    jobCategorySelect.disabled = disabled;
    statusSaveBtn.disabled = disabled;
  }

  function resumeOptionLabel(document) {
    const linked = document.linkedJob || document.job;
    const role = linked?.company && linked?.position ? ` — ${linked.company}, ${linked.position}` : '';
    return `${document.name || 'Untitled résumé'}${document.isDefault ? ' (default)' : ''}${role}`;
  }

  async function refreshResumeSelector() {
    resumeRefreshBtn.disabled = true;
    try {
      const [documents, stored] = await Promise.all([
        GoApplyAPI.getResumes(),
        chrome.storage.local.get(['selectedResumeId', 'selectedResumeIdSource']),
      ]);
      const resumes = Array.isArray(documents) ? documents : [];
      resumeSelect.innerHTML = '';
      resumeSelect.appendChild(new Option('AI chooses the best résumé', ''));
      for (const document of resumes) {
        resumeSelect.appendChild(new Option(resumeOptionLabel(document), document.id));
      }
      const selectedExists = resumes.some((document) => document.id === stored.selectedResumeId);
      const explicitUserSelection = stored.selectedResumeIdSource === 'user' && selectedExists;
      resumeSelect.value = explicitUserSelection ? stored.selectedResumeId : '';
      if (!resumes.length) {
        resumeSelect.innerHTML = '';
        resumeSelect.appendChild(new Option('No Foligo résumés found', ''));
        resumeSelect.disabled = true;
        uploadNoteEl.textContent = 'Create a résumé in Foligo Resume Studio before attaching one.';
      } else {
        resumeSelect.disabled = false;
        const lastSelected = resumes.find((document) => document.id === stored.selectedResumeId);
        uploadNoteEl.textContent = explicitUserSelection
          ? 'Your selected résumé will be attached to file-upload fields.'
          : lastSelected && stored.selectedResumeIdSource === 'model'
            ? `AI last chose ${lastSelected.name || 'a résumé'} and will re-evaluate for the current job.`
            : 'AI mode compares your Foligo résumés with the current job before attaching one.';
      }
    } catch (error) {
      resumeSelect.innerHTML = '';
      resumeSelect.appendChild(new Option('Could not load résumés', ''));
      resumeSelect.disabled = true;
      uploadNoteEl.textContent = error.message || 'Could not load Foligo résumés.';
    } finally {
      resumeRefreshBtn.disabled = false;
    }
  }

  async function refreshJobTracking() {
    // Status refresh is passive UI bookkeeping; never navigate a protected
    // new-tab/about:blank page just to ask whether it is already tracked.
    const result = await sendRawToContentScript('sp-get-job-tracking');
    if (!result?.success) {
      currentTrackedJob = null;
      currentPageTrackable = false;
      trackingControlsAvailable = false;
      currentPageJobInfo = null;
      jobStatusSelect.value = 'saved';
      statusSaveBtn.textContent = '📋 Track';
      syncTrackingControlState();
      renderJobWorkspace();
      return;
    }
    trackingControlsAvailable = true;
    currentTrackedJob = result?.job || null;
    const jobInfo = result?.jobInfo || {};
    currentPageJobInfo = jobInfo;
    const detectedCompany = String(jobInfo.company || currentTrackedJob?.company || '').trim();
    const detectedPosition = String(jobInfo.jobTitle || jobInfo.position || currentTrackedJob?.position || '').trim();
    currentPageTrackable = Boolean(
      currentTrackedJob
      || (jobInfo.isLikelyJobPage && detectedCompany && detectedPosition),
    );
    jobStatusSelect.value = currentTrackedJob?.status || 'saved';
    statusSaveBtn.textContent = currentTrackedJob ? '📋 Update' : '📋 Track';
    if (currentTrackedJob?.category) selectCategoryValue(currentTrackedJob.category);
    syncTrackingControlState();
    const unavailableTitle = 'Page metadata is incomplete; Track will ask AI to identify the job.';
    statusSaveBtn.title = currentPageTrackable ? '' : unavailableTitle;
    const jobName = detectedCompany && detectedPosition
      ? `${detectedCompany} — ${detectedPosition}`
      : '';
    if (jobName) {
      if (currentTrackedJob) statusEl.textContent = jobName;
      contextNoteEl.textContent = currentTrackedJob
        ? currentTrackedJob.identityReconciled
          ? `Corrected the tracked card to ${jobName}; status is ${currentTrackedJob.status}.`
          : `${jobName} is tracked as ${currentTrackedJob.status}.`
        : `${jobName} is not tracked yet. Pick a status and hit Track.`;
    }
    renderJobWorkspace();
  }

  // ─── Job workspace (job card, selector, categories, docs, Q&A) ──────
  // The documents and Q&A sections act on effectiveJob() — the tracked card for
  // the current page, or a job the user picked by hand when detection got lost.

  let trackedJobsCache = [];

  async function ensureProfile(force = false) {
    if (cachedProfile && !force) return cachedProfile;
    try { cachedProfile = await GoApplyAPI.getGoApplyProfile(); }
    catch (error) { if (force) cachedProfile = null; }
    return cachedProfile;
  }

  function categoriesFromProfile() {
    const list = cachedProfile?.jobCategories;
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }

  function refreshCategorySelect() {
    const current = jobCategorySelect.value && jobCategorySelect.value !== '__add__' ? jobCategorySelect.value : '';
    const categories = categoriesFromProfile();
    jobCategorySelect.innerHTML = '';
    jobCategorySelect.appendChild(new Option('No category', ''));
    for (const category of categories) jobCategorySelect.appendChild(new Option(category, category));
    jobCategorySelect.appendChild(new Option('＋ Add category…', '__add__'));
    jobCategorySelect.value = current && categories.includes(current) ? current : '';
  }

  function selectCategoryValue(value) {
    if (!value) { jobCategorySelect.value = ''; return; }
    const exists = [...jobCategorySelect.options].some((option) => option.value === value);
    if (!exists) {
      const addOption = [...jobCategorySelect.options].find((option) => option.value === '__add__');
      const option = new Option(value, value);
      if (addOption) jobCategorySelect.insertBefore(option, addOption);
      else jobCategorySelect.appendChild(option);
    }
    jobCategorySelect.value = value;
  }

  function setJobBadge(kind, extra) {
    if (!kind) { jobBadgeEl.hidden = true; return; }
    jobBadgeEl.hidden = false;
    jobBadgeEl.dataset.kind = kind;
    jobBadgeEl.textContent = kind === 'tracked'
      ? `Tracked · ${extra}`
      : kind === 'selected' ? 'Selected job' : 'Not tracked';
  }

  function renderJobWorkspace() {
    const pageName = currentPageJobInfo?.company && (currentPageJobInfo.jobTitle || currentPageJobInfo.position)
      ? `${currentPageJobInfo.company} — ${currentPageJobInfo.jobTitle || currentPageJobInfo.position}`
      : '';
    if (activeJobOverride) {
      jobNameEl.textContent = `${activeJobOverride.company} — ${activeJobOverride.position}`;
      setJobBadge('selected');
    } else if (currentTrackedJob) {
      jobNameEl.textContent = `${currentTrackedJob.company} — ${currentTrackedJob.position}`;
      setJobBadge('tracked', currentTrackedJob.status);
    } else if (pageName) {
      jobNameEl.textContent = pageName;
      setJobBadge('untracked');
    } else {
      jobNameEl.textContent = 'No job detected on this page';
      setJobBadge(null);
    }
    refreshDocsSection();
  }

  async function refreshJobSelector() {
    jobSelectRefresh.disabled = true;
    try {
      trackedJobsCache = (await GoApplyAPI.getJobs()) || [];
      jobSelect.innerHTML = '';
      jobSelect.appendChild(new Option('Use the detected page', ''));
      for (const job of trackedJobsCache) {
        jobSelect.appendChild(new Option(
          `${job.company} — ${job.position}${job.category ? ` · ${job.category}` : ''}`,
          job.id,
        ));
      }
      jobSelect.value = activeJobOverride?.id || '';
    } catch (error) {
      jobSelect.innerHTML = '';
      jobSelect.appendChild(new Option('Could not load tracked jobs', ''));
    } finally {
      jobSelectRefresh.disabled = false;
    }
  }

  function docRowHtml(kind, doc) {
    const name = escapeHtml(doc.name || doc.title || (kind === 'resume' ? 'Résumé' : 'Cover letter'));
    const icon = kind === 'resume' ? '📄' : '✉️';
    const download = kind === 'resume'
      ? `<button class="sp-doc-btn" data-download="${doc.id}" title="Download PDF">⬇︎ PDF</button>`
      : '';
    return `<div class="sp-doc-row"><span class="sp-doc-name">${icon} ${name}</span>`
      + `<span class="sp-doc-actions"><button class="sp-doc-btn" data-edit="${kind}:${doc.id}" title="Open in Editor Studio">✎ Studio</button>${download}</span></div>`;
  }

  async function refreshDocsSection() {
    const job = effectiveJob();
    createResumeBtn.disabled = !job || docsActionBusy;
    createCoverBtn.disabled = !job || docsActionBusy;
    if (!job) {
      docsListEl.innerHTML = '<div class="sp-docs-empty">Track a job first, then create a tailored résumé or cover letter from your base template.</div>';
      return;
    }
    docsListEl.innerHTML = '<div class="sp-docs-empty">Loading documents…</div>';
    try {
      const [resumes, letters] = await Promise.all([
        GoApplyAPI.getResumes().catch(() => []),
        GoApplyAPI.getCoverLetters().catch(() => []),
      ]);
      const jobResumes = (resumes || []).filter((r) => r.linkedJobId === job.id || r.linkedJob?.id === job.id);
      const jobLetters = (letters || []).filter((l) => l.jobId === job.id || l.job?.id === job.id);
      const rows = [
        ...jobResumes.map((r) => docRowHtml('resume', r)),
        ...jobLetters.map((l) => docRowHtml('cover-letter', l)),
      ];
      docsListEl.innerHTML = rows.length
        ? rows.join('')
        : '<div class="sp-docs-empty">No résumé or cover letter for this job yet — create one above.</div>';
    } catch (error) {
      docsListEl.innerHTML = `<div class="sp-docs-empty">Could not load documents: ${escapeHtml(error.message || '')}</div>`;
    }
  }

  async function openStudio(kind, id) {
    const { web } = await GoApplyAPI.getEndpoints();
    const path = kind === 'resume' ? `studio/resume/${id}` : `studio/cover-letter/${id}`;
    chrome.tabs.create({ url: `${web}/${path}` });
  }

  async function createResumeForCurrentJob() {
    const job = effectiveJob();
    if (!job || docsActionBusy) return;
    docsActionBusy = true;
    createResumeBtn.disabled = true;
    const chip = addStatusChip('Creating a résumé from your base template…');
    try {
      const jobDescription = job.description || currentPageJobInfo?.description || '';
      const doc = await GoApplyAPI.createResumeForJob({
        name: `${job.company} — ${job.position} Résumé`,
        jobId: job.id,
        jobDescription,
      });
      chip.dataset.status = 'done';
      chip.textContent = '✓ Résumé created & attached — opening Studio';
      await openStudio('resume', doc.id);
      await refreshDocsSection();
    } catch (error) {
      chip.dataset.status = 'error';
      chip.textContent = `⚠ ${error.message || 'Could not create résumé'}`;
    } finally {
      docsActionBusy = false;
      createResumeBtn.disabled = !effectiveJob();
    }
  }

  async function createCoverLetterForCurrentJob() {
    const job = effectiveJob();
    if (!job || docsActionBusy) return;
    docsActionBusy = true;
    createCoverBtn.disabled = true;
    const chip = addStatusChip('Creating a cover letter from your base template…');
    try {
      const doc = await GoApplyAPI.createCoverLetterForJob({
        jobId: job.id,
        title: `${job.company} — ${job.position} Cover Letter`,
      });
      chip.dataset.status = 'done';
      chip.textContent = '✓ Cover letter created & attached — opening Studio';
      await openStudio('cover-letter', doc.id);
      await refreshDocsSection();
    } catch (error) {
      chip.dataset.status = 'error';
      chip.textContent = `⚠ ${error.message || 'Could not create cover letter'}`;
    } finally {
      docsActionBusy = false;
      createCoverBtn.disabled = !effectiveJob();
    }
  }

  async function downloadResume(id) {
    const chip = addStatusChip('Preparing résumé PDF…');
    try {
      // Compile for a fresh PDF; fall back to the last compiled one if the
      // compile route is unavailable (e.g. no LaTeX toolchain on the server).
      let blob = null;
      try { blob = await GoApplyAPI.compileResumePdf(id); }
      catch (error) { blob = await GoApplyAPI.getResumePdf(id); }
      if (!blob) throw new Error('No PDF was produced');
      const profile = await ensureProfile();
      const fullName = [profile?.firstName, profile?.lastName].map((v) => String(v || '').trim()).filter(Boolean).join(' ')
        || String(profile?.name || '').trim();
      const filename = `${fullName ? `${fullName} Resume` : 'Resume'}.pdf`
        .replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      chip.dataset.status = 'done';
      chip.textContent = `✓ Downloaded ${filename}`;
    } catch (error) {
      chip.dataset.status = 'error';
      chip.textContent = `⚠ ${error.message || 'Download failed'}`;
    }
  }

  async function draftAnswer() {
    const question = qaQuestionEl.value.trim();
    if (!question) { qaStatusEl.textContent = 'Paste an application question first.'; return; }
    qaDraftBtn.disabled = true;
    qaStatusEl.textContent = 'Drafting an answer with AI…';
    try {
      const job = effectiveJob();
      const jobDescription = job?.description || currentPageJobInfo?.description || '';
      const result = await GoApplyAPI.generateCustomAnswer(question, jobDescription);
      const answer = typeof result === 'string'
        ? result
        : (result?.answer || result?.text || result?.content || '');
      qaAnswerEl.value = answer || '';
      qaStatusEl.textContent = answer ? 'Draft ready — edit it, then Save answer.' : 'No draft was returned; write your own answer.';
    } catch (error) {
      qaStatusEl.textContent = `Could not draft: ${error.message || 'error'}`;
    } finally {
      qaDraftBtn.disabled = false;
    }
  }

  async function saveApplicationAnswer() {
    const question = qaQuestionEl.value.trim();
    const answer = qaAnswerEl.value.trim();
    if (!question || !answer) { qaStatusEl.textContent = 'Both a question and an answer are required.'; return; }
    qaSaveBtn.disabled = true;
    qaStatusEl.textContent = 'Saving…';
    try {
      const job = effectiveJob();
      await GoApplyAPI.saveAnswer({ question, answer, ...(job ? { jobIds: [job.id] } : {}) });
      qaStatusEl.textContent = job
        ? `Saved and linked to ${job.company} — ${job.position}.`
        : 'Saved to your Foligo answers.';
      qaQuestionEl.value = '';
      qaAnswerEl.value = '';
    } catch (error) {
      qaStatusEl.textContent = `Could not save: ${error.message || 'error'}`;
    } finally {
      qaSaveBtn.disabled = false;
    }
  }

  function clearMessages(placeholderText) {
    messagesEl.innerHTML = '';
    toolChips.clear();
    currentAssistantEl = null;
    currentAssistantRaw = '';
    currentThinkingEl = null;
    currentThinkingRaw = '';
    if (placeholderText) {
      const empty = document.createElement('div');
      empty.className = 'sp-empty';
      empty.textContent = placeholderText;
      messagesEl.appendChild(empty);
    }
  }

  function removeEmptyState() {
    messagesEl.querySelector('.sp-empty')?.remove();
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function workspaceIdFor(tabId, groupId) {
    return groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE ? `group-${groupId}` : `tab-${tabId}`;
  }

  function visibleTranscript() {
    return [...messagesEl.querySelectorAll('.sp-message')].map((element) => ({
      role: element.classList.contains('sp-user') ? 'user' : 'assistant',
      content: element.classList.contains('sp-assistant') && element === currentAssistantEl
        ? currentAssistantRaw
        : element.textContent || '',
    })).filter((message) => message.content.trim());
  }

  async function persistVisibleChat() {
    clearTimeout(historySaveTimer);
    historySaveTimer = null;
    if (!currentWorkspaceId) return;
    const messages = visibleTranscript();
    if (!messages.length) return;
    try {
      const stored = await chrome.storage.local.get('goapplyChatHistory');
      const history = Array.isArray(stored.goapplyChatHistory) ? stored.goapplyChatHistory : [];
      let tab = null;
      try { tab = trackedTabId == null ? null : await chrome.tabs.get(trackedTabId); } catch (error) {}
      const entry = {
        id: currentWorkspaceId,
        workspaceId: currentWorkspaceId,
        groupId: trackedGroupId,
        url: tab?.url || '',
        title: tab?.title || 'GoApply browser chat',
        savedAt: Date.now(),
        messages,
      };
      await chrome.storage.local.set({
        goapplyChatHistory: [entry, ...history.filter((item) => item.id !== entry.id)].slice(0, 50),
      });
    } catch (error) {
      console.warn('[GoApply] Could not save chat history:', error);
    }
  }

  function scheduleHistorySave() {
    clearTimeout(historySaveTimer);
    historySaveTimer = setTimeout(persistVisibleChat, 350);
  }

  async function restoreWorkspaceChat() {
    if (!currentWorkspaceId) return false;
    try {
      const stored = await chrome.storage.local.get('goapplyChatHistory');
      const history = Array.isArray(stored.goapplyChatHistory) ? stored.goapplyChatHistory : [];
      const entry = history.find((item) => item.id === currentWorkspaceId || item.workspaceId === currentWorkspaceId);
      if (!entry?.messages?.length) return false;
      messagesEl.innerHTML = '';
      for (const message of entry.messages) {
        if (message.role !== 'user' && message.role !== 'assistant') continue;
        const text = typeof message.content === 'string'
          ? message.content
          : (message.content || []).filter((part) => part?.type === 'text').map((part) => part.text).join('');
        if (!text) continue;
        const element = document.createElement('div');
        element.className = `sp-message sp-${message.role}`;
        if (message.role === 'assistant') element.innerHTML = renderMarkdown(text);
        else element.textContent = text;
        messagesEl.appendChild(element);
      }
      scrollToBottom();
      return Boolean(messagesEl.querySelector('.sp-message'));
    } catch (error) {
      console.warn('[GoApply] Could not restore chat history:', error);
      return false;
    }
  }

  // ─── Minimal, XSS-safe markdown ────────────────────────────────────
  // No CDN/library allowed in a self-contained extension page. Escapes
  // everything first, then layers a small set of inline/block transforms —
  // fenced code, inline code, bold/italic, links, and lists — on top. Code
  // blocks/inline code get their own overflow-x:auto so a long unbroken
  // token (a stack trace, a URL) scrolls inside itself instead of forcing
  // the whole side panel to scroll horizontally.

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderInline(text) {
    let s = escapeHtml(text);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return s;
  }

  function renderMarkdown(raw) {
    const segments = String(raw || '').split(/```(?:[a-zA-Z0-9_+-]*\n)?([\s\S]*?)```/g);
    let html = '';
    segments.forEach((segment, i) => {
      if (i % 2 === 1) {
        html += `<pre class="sp-code"><code>${escapeHtml(segment.replace(/\n$/, ''))}</code></pre>`;
        return;
      }
      let inList = false;
      let para = [];
      const flushPara = () => {
        if (para.length) { html += `<p>${para.map(renderInline).join('<br>')}</p>`; para = []; }
      };
      for (const line of segment.split('\n')) {
        const item = /^\s*(?:[-*]|\d+\.)\s+(.*)/.exec(line);
        if (item) {
          flushPara();
          if (!inList) { html += '<ul>'; inList = true; }
          html += `<li>${renderInline(item[1])}</li>`;
        } else {
          if (inList) { html += '</ul>'; inList = false; }
          if (line.trim() === '') flushPara();
          else para.push(line);
        }
      }
      if (inList) html += '</ul>';
      flushPara();
    });
    return html;
  }

  function addMessage(role, text = '') {
    removeEmptyState();
    const el = document.createElement('div');
    el.className = `sp-message sp-${role}`;
    if (role === 'assistant') el.innerHTML = renderMarkdown(text);
    else el.textContent = text;
    messagesEl.appendChild(el);
    scrollToBottom();
    scheduleHistorySave();
    return el;
  }

  function readableToolName(name) {
    return String(name || 'tool').replace(/_/g, ' ');
  }

  function toolResultDetail(event) {
    const output = event.output || {};
    if (output.note || output.refused || event.error) return output.note || output.refused || event.error;
    if (Array.isArray(output.results)) {
      const failed = output.results.filter((r) => r.applied !== true);
      if (failed.length) return failed.map((r) => `${r.fieldRef}: ${r.note || 'not retained'}`).join('; ');
    }
    return '';
  }

  function finalizePendingTools(message = 'Tool did not return before the turn ended') {
    for (const chip of toolChips.values()) {
      if (chip.dataset.status !== 'running') continue;
      chip.dataset.status = 'error';
      chip.textContent = `⚠ ${chip.textContent.replace(/^Pending:\s*/, '').replace(/…$/, '')} — ${message}`;
    }
  }

  function handleAgentEvent(event) {
    if (!event || ignoreAgentEvents) return;
    if (event.type === 'reasoning-delta') {
      removeEmptyState();
      if (!currentThinkingEl) {
        currentThinkingEl = document.createElement('details');
        currentThinkingEl.className = 'sp-thinking';
        currentThinkingEl.open = true;
        currentThinkingEl.innerHTML = '<summary>Thinking…</summary><div class="sp-thinking-body"></div>';
        messagesEl.appendChild(currentThinkingEl);
        currentThinkingRaw = '';
      }
      currentThinkingRaw += event.text || '';
      currentThinkingEl.querySelector('.sp-thinking-body').textContent = currentThinkingRaw;
    } else if (event.type === 'text-delta') {
      if (currentThinkingEl) currentThinkingEl.open = false;
      if (!currentAssistantEl) { currentAssistantEl = addMessage('assistant'); currentAssistantRaw = ''; }
      currentAssistantRaw += event.text || '';
      currentAssistantEl.innerHTML = renderMarkdown(currentAssistantRaw);
      scheduleHistorySave();
    } else if (event.type === 'tool-call') {
      removeEmptyState();
      const chip = document.createElement('div');
      chip.className = 'sp-tool';
      chip.dataset.status = 'running';
      chip.textContent = `Pending: ${readableToolName(event.toolName)}…`;
      messagesEl.appendChild(chip);
      toolChips.set(event.toolCallId, chip);
    } else if (event.type === 'tool-result' || event.type === 'tool-error') {
      const chip = toolChips.get(event.toolCallId);
      if (chip) {
        const succeeded = event.type === 'tool-result' && event.succeeded !== false;
        const detail = toolResultDetail(event);
        chip.dataset.status = succeeded ? 'done' : 'error';
        chip.textContent = `${succeeded ? '✓' : '⚠'} ${readableToolName(event.toolName)}${detail ? ` — ${detail}` : ''}`;
        if (detail) chip.title = detail;
        if (succeeded && typeof event.output?.dataUrl === 'string' && event.output.dataUrl.startsWith('data:image/')) {
          const preview = document.createElement('img');
          preview.className = 'sp-tool-image';
          preview.src = event.output.dataUrl;
          preview.alt = `${readableToolName(event.toolName)} result`;
          chip.insertAdjacentElement('afterend', preview);
        }
      }
      if (event.type === 'tool-result' && ['track_current_job', 'update_job_status'].includes(event.toolName)) {
        refreshJobTracking().catch(() => {});
      }
      if (event.type === 'tool-result' && event.toolName === 'attach_document') {
        refreshResumeSelector().catch(() => {});
      }
    } else if (event.type === 'transport-retry') {
      const chip = document.createElement('div');
      chip.className = 'sp-tool';
      chip.dataset.status = 'running';
      chip.textContent = event.message || 'Reconnecting…';
      messagesEl.appendChild(chip);
    } else if (event.type === 'error') {
      const el = addMessage('assistant', `I couldn't complete that request: ${event.message || 'Unknown error'}`);
      el.style.color = '#DF1B41';
    } else if (event.type === 'turn-complete') {
      const result = event.result || {};
      finalizePendingTools(result.success ? 'No result was received' : (result.message || 'Turn failed'));
      if (!result.success && !result.stopped) {
        addMessage('assistant', `I couldn't complete that request: ${result.message || 'Unknown error'}`);
      }
      setAgentBusy(false);
      agentOwnerTabId = null;
      currentAssistantEl = null;
      currentAssistantRaw = '';
      persistVisibleChat();
      if (pendingAiTrack) {
        const pending = pendingAiTrack;
        pendingAiTrack = null;
        refreshJobTracking().then(() => {
          const statusMatches = currentTrackedJob?.status === pending.status;
          pending.chip.dataset.status = statusMatches ? 'done' : 'error';
          pending.chip.textContent = statusMatches
            ? `✓ AI tracked this job as ${currentTrackedJob.status}`
            : currentTrackedJob
              ? `⚠ Job remains ${currentTrackedJob.status}; requested status was ${pending.status}`
            : result.stopped
              ? '⏹ Job identification stopped'
              : '⚠ AI could not identify a company and job title on this page';
          syncTrackingControlState();
        }).catch(() => {
          pending.chip.dataset.status = 'error';
          pending.chip.textContent = '⚠ Could not confirm the tracked job';
          syncTrackingControlState();
        });
      }
    }
    scrollToBottom();
  }

  // ─── Active-tab tracking ────────────────────────────────────────────
  // The panel is one-per-window and outlives any single tab; retarget it
  // whenever the user switches tabs or navigates, and reset the transcript
  // since a different tab means a different page/agent session.

  function sendRawToContentScript(action, extra = {}) {
    return sendRawToTab(trackedTabId, action, extra);
  }

  function sendRawToTab(tabId, action, extra = {}) {
    return new Promise((resolve) => {
      if (tabId == null) { resolve({ success: false, message: 'No active tab detected.' }); return; }
      try {
        chrome.tabs.sendMessage(tabId, { action, ...extra }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, message: chrome.runtime.lastError.message, noReceiver: true });
            return;
          }
          resolve(response || { success: false, message: 'No response from the page.' });
        });
      } catch (e) { resolve({ success: false, message: e.message }); }
    });
  }

  function sendToAgentOwner(action, extra = {}) {
    return sendRawToTab(agentOwnerTabId ?? trackedTabId, action, extra);
  }

  async function sendToContentScript(action, extra = {}) {
    const first = await sendRawToContentScript(action, extra);
    if (!first.noReceiver || trackedTabId == null) return first;

    // about:blank, chrome://newtab and other protected Chrome surfaces cannot
    // host a content script. Ask the service worker to initialize the tab on
    // a normal start page, wait for the agent listener, then replay exactly
    // the command the user originally issued.
    let prepared;
    try {
      prepared = await chrome.runtime.sendMessage({ action: 'prepare-agent-tab', tabId: trackedTabId });
    } catch (error) {
      return { success: false, message: error.message || first.message };
    }
    if (!prepared?.ok) return { success: false, message: prepared?.error || first.message };
    return sendRawToContentScript(action, extra);
  }

  async function refreshTrackedTab(tabId, { preserveChat = false } = {}) {
    const previousWorkspaceId = currentWorkspaceId;
    if (!preserveChat && previousWorkspaceId) await persistVisibleChat();
    trackedTabId = tabId ?? null;
    if (!preserveChat) {
      clearMessages('Ask about this page, request a browser task, or run an AI rescan to fill what it can.');
    }
    if (trackedTabId == null) { statusEl.textContent = 'No active tab'; return; }
    try {
      const tab = await chrome.tabs.get(trackedTabId);
      trackedGroupId = tab.groupId ?? chrome.tabGroups.TAB_GROUP_ID_NONE;
    } catch (error) {
      trackedGroupId = chrome.tabGroups.TAB_GROUP_ID_NONE;
    }
    currentWorkspaceId = workspaceIdFor(trackedTabId, trackedGroupId);
    if (!preserveChat) await restoreWorkspaceChat();
    try {
      const detected = await new Promise((resolve) => {
        chrome.tabs.sendMessage(trackedTabId, { action: 'detect' }, (response) => {
          resolve(chrome.runtime.lastError ? null : response);
        });
      });
      const detectedJobName = detected?.jobInfo?.company
        && (detected.jobInfo.jobTitle || detected.jobInfo.position)
        ? `${detected.jobInfo.company} — ${detected.jobInfo.jobTitle || detected.jobInfo.position}`
        : '';
      statusEl.textContent = detected?.platform
        ? `${detected.platform} — ${detected.fieldsFound || 0} fields detected`
        : detected?.jobInfo?.isLikelyJobPage && detectedJobName
          ? detectedJobName
          : 'Open a job application to get started';
    } catch (e) {
      statusEl.textContent = 'Open a job application to get started';
    }
    refreshJobTracking().catch(() => {});
    // A turn started before the panel switched to this tab (e.g. resumed
    // after a page navigation) is still running content-script-side even
    // though this panel never saw it start — sync the Stop button to it.
    try {
      const busyTarget = agentOwnerTabId ?? trackedTabId;
      const busyCheck = await new Promise((resolve) => {
        chrome.tabs.sendMessage(busyTarget, { action: 'sp-is-busy' }, (response) => {
          resolve(chrome.runtime.lastError ? null : response);
        });
      });
      setAgentBusy(Boolean(busyCheck?.busy));
    } catch (e) { setAgentBusy(false); }
    if (fieldListOpen) refreshFieldList();
  }

  // ─── Field list ─────────────────────────────────────────────────────

  function fieldRowHtml(field) {
    const badge = field.flaggedReason
      ? `<span class="sp-field-badge sp-field-badge-flagged" title="${field.flaggedReason.replace(/"/g, '&quot;')}">⚠ review</span>`
      : field.docKind
        ? `<span class="sp-field-badge sp-field-badge-doc">📎 ${field.docKind === 'resume' ? 'resume' : 'cover letter'}</span>`
        : '<span class="sp-field-badge">detected</span>';
    const fillBtn = field.docKind ? '' : `<button class="sp-field-fill-btn" data-fill="${field.ref}" title="Fill with AI">✨</button>`;
    const previewBtn = field.docKind ? `<button class="sp-field-preview-btn" data-preview="${field.docKind}" title="Preview">👁</button>` : '';
    return `<div class="sp-field-row"><span>${field.label}</span><span class="sp-field-controls">${fillBtn}${previewBtn}${badge}</span></div>`;
  }

  async function refreshFieldList() {
    const result = await sendToContentScript('sp-get-fields');
    const fields = result?.fields || [];
    fieldListEl.innerHTML = fields.length
      ? fields.map(fieldRowHtml).join('')
      : '<div class="sp-field-row" style="color:#6B7C93;">No fields detected on this page yet.</div>';
  }

  fieldListEl.addEventListener('click', async (event) => {
    const fillTarget = event.target.closest('[data-fill]');
    if (fillTarget) {
      if (agentBusy) return;
      agentOwnerTabId = trackedTabId;
      setAgentBusy(true);
      const chip = addStatusChip(`Filling ${fillTarget.dataset.fill} with AI…`);
      const result = await sendToContentScript('sp-field-fill', { fieldRef: fillTarget.dataset.fill });
      if (result.accepted) return;
      finalizePendingTools();
      chip.dataset.status = result.success ? 'done' : 'error';
      chip.textContent = result.success ? '✓ Field AI complete' : (result.stopped ? '⏹ Stopped' : `⚠ ${result.message || 'Field AI failed'}`);
      setAgentBusy(false);
      if (fieldListOpen) refreshFieldList();
      return;
    }
    const previewTarget = event.target.closest('[data-preview]');
    if (previewTarget) sendToContentScript('sp-preview', { kind: previewTarget.dataset.preview });
  });

  fieldsToggle.addEventListener('click', () => {
    fieldListOpen = !fieldListOpen;
    fieldListEl.hidden = !fieldListOpen;
    fieldsToggle.textContent = fieldListOpen ? '▾ Hide detected fields' : '▸ Show detected fields';
    if (fieldListOpen) refreshFieldList();
  });

  async function getActiveTabId() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id ?? null;
  }

  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    let nextGroupId = chrome.tabGroups.TAB_GROUP_ID_NONE;
    try {
      const tab = await chrome.tabs.get(tabId);
      nextGroupId = tab.groupId ?? chrome.tabGroups.TAB_GROUP_ID_NONE;
    } catch (error) {}
    const sameWorkspace = nextGroupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && nextGroupId === trackedGroupId;
    refreshTrackedTab(tabId, { preserveChat: sameWorkspace });
  });
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    // A navigation in the same tab is still the same conversation. Refresh
    // page status/field handles without wiping the visible transcript.
    if (tabId === trackedTabId && changeInfo.status === 'complete') {
      refreshTrackedTab(tabId, { preserveChat: true });
    } else if (tabId === trackedTabId && changeInfo.groupId != null) {
      refreshTrackedTab(tabId, { preserveChat: true }).then(scheduleHistorySave);
    }
  });
  chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) return;
    const tabId = await getActiveTabId();
    let sameWorkspace = false;
    try {
      const tab = tabId == null ? null : await chrome.tabs.get(tabId);
      sameWorkspace = tab?.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && tab?.groupId === trackedGroupId;
    } catch (error) {}
    refreshTrackedTab(tabId, { preserveChat: sameWorkspace });
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'goapply-group-ready' && message.tabId === trackedTabId) {
      refreshTrackedTab(trackedTabId, { preserveChat: true }).then(scheduleHistorySave);
      return;
    }
    if (message?.type !== 'sp-agent-event') return;
    if (message.tabId === trackedTabId || message.tabId === agentOwnerTabId) {
      handleAgentEvent(message.event);
      return;
    }
    if (trackedGroupId === chrome.tabGroups.TAB_GROUP_ID_NONE) return;
    chrome.tabs.get(message.tabId).then((tab) => {
      if (tab.groupId === trackedGroupId) handleAgentEvent(message.event);
    }).catch(() => {});
  });

  // ─── Actions ─────────────────────────────────────────────────────

  function addStatusChip(runningText, actionKey = '') {
    removeEmptyState();
    if (actionKey) {
      for (const existing of messagesEl.querySelectorAll('.sp-tool[data-action-key]')) {
        if (existing.dataset.actionKey === actionKey) existing.remove();
      }
    }
    const chip = document.createElement('div');
    chip.className = 'sp-tool';
    chip.dataset.status = 'running';
    if (actionKey) chip.dataset.actionKey = actionKey;
    chip.textContent = runningText;
    messagesEl.appendChild(chip);
    scrollToBottom();
    return chip;
  }

  // Only one AgentController turn (rescan/chat/field-fill) can run at a time
  // in the content script — mirror that here so Stop always targets the
  // right thing and the compose box can't fire a second overlapping turn.
  let agentBusy = false;
  function setAgentBusy(busy) {
    agentBusy = busy;
    stopBtn.hidden = !busy;
    rescanBtn.disabled = busy;
    sendBtn.disabled = busy;
    syncTrackingControlState();
  }

  async function waitForAgentIdle(timeoutMs = 10000, tabId = agentOwnerTabId ?? trackedTabId) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const state = await sendRawToTab(tabId, 'sp-is-busy');
      if (!state?.busy) return true;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
  }

  stopBtn.addEventListener('click', async () => {
    stopBtn.disabled = true;
    const ownerTabId = agentOwnerTabId ?? trackedTabId;
    const result = await sendRawToTab(ownerTabId, 'sp-stop');
    finalizePendingTools(result?.stopped ? 'Stopped by user' : 'Stop request sent');
    await waitForAgentIdle(10000, ownerTabId);
    setAgentBusy(false);
    stopBtn.disabled = false;
  });

  async function runRescan() {
    if (agentBusy) return;
    agentOwnerTabId = trackedTabId;
    setAgentBusy(true);
    const chip = addStatusChip('Rescanning with AI…');
    const result = await sendToContentScript('sp-rescan');
    if (result.accepted) return;
    finalizePendingTools();
    chip.dataset.status = result.success ? 'done' : 'error';
    chip.textContent = result.success
      ? (result.continuationLimitReached ? '⚠ AI stopped at the safety limit' : '✓ AI rescan complete')
      : (result.stopped ? '⏹ Stopped' : `⚠ ${result.message || 'AI rescan failed'}`);
    setAgentBusy(false);
    if (fieldListOpen) refreshFieldList();
  }

  async function runAutofill() {
    autofillBtn.disabled = true;
    const chip = addStatusChip('Autofilling…');
    const result = await sendToContentScript('sp-autofill');
    chip.dataset.status = result.success ? 'done' : 'error';
    chip.textContent = result.success
      ? `✓ Filled ${result.filled}/${result.total}${result.skipped ? ` (${result.skipped} skipped)` : ''}`
      : `⚠ ${result.message || 'Autofill failed'}`;
    autofillBtn.disabled = false;
    if (result.tracking) await refreshJobTracking();
    if (fieldListOpen) refreshFieldList();
  }

  async function runTrack() {
    if (trackingActionPromise) return trackingActionPromise;
    if (!trackingControlsAvailable) {
      const chip = addStatusChip('Open a normal web page before tracking a job.', 'job-tracking');
      chip.dataset.status = 'error';
      return null;
    }
    statusSaveBtn.disabled = true;
    const status = jobStatusSelect.value || 'saved';
    const category = jobCategorySelect.value && jobCategorySelect.value !== '__add__' ? jobCategorySelect.value : '';
    const statusLabel = jobStatusSelect.options[jobStatusSelect.selectedIndex]?.textContent || status;
    const chip = addStatusChip(`${currentTrackedJob ? 'Updating' : 'Tracking'} job as ${status}…`, 'job-tracking');
    trackingActionPromise = (async () => {
      const result = await sendToContentScript('sp-track', { status, category, allowStatusChange: true });
      if (result.unavailable) {
        chip.dataset.status = 'running';
        chip.textContent = 'AI is identifying the company and job title…';
        addMessage('user', `Track this job as ${statusLabel}.`);
        currentAssistantEl = null;
        currentAssistantRaw = '';
        agentOwnerTabId = trackedTabId;
        pendingAiTrack = { chip, status };
        setAgentBusy(true);
        const aiResult = await sendToContentScript('sp-chat', {
          text: `The user explicitly asked to track the job shown on the current page with Foligo status "${status}". Read the visible page and identify the real company and position. If this is a job listing or application, call track_current_job with the company, position, current page URL, and status "${status}". If an existing tracked job must change to "${status}", call update_job_status too. Do not fill fields, navigate, or click anything. If this is not a job page, explain that clearly.`,
        });
        if (!aiResult.accepted) {
          pendingAiTrack = null;
          setAgentBusy(false);
          chip.dataset.status = 'error';
          chip.textContent = `⚠ ${aiResult.message || 'AI job identification could not start'}`;
        }
        return aiResult;
      }
      chip.dataset.status = result.success ? 'done' : 'error';
      chip.textContent = result.success
        ? (result.created
            ? `✓ Added to your Foligo board as ${result.job?.status || status}`
            : result.changed
              ? `✓ Job status changed to ${result.job?.status || status}`
              : `✓ Job is tracked as ${result.job?.status || status}`)
        : `⚠ ${result.message || 'Track failed'}`;
      if (result.success) {
        await refreshJobTracking();
        refreshJobSelector().catch(() => {});
      }
      return result;
    })();
    try {
      return await trackingActionPromise;
    } finally {
      trackingActionPromise = null;
      syncTrackingControlState();
    }
  }

  async function runFindSubmit() {
    findSubmitBtn.disabled = true;
    const chip = addStatusChip('Looking for the submit button…');
    const result = await sendToContentScript('sp-find-submit');
    chip.dataset.status = result.found ? 'done' : 'error';
    chip.textContent = result.found ? '🎯 Submit button highlighted on the page' : '⚠ No submit button found';
    findSubmitBtn.disabled = false;
  }

  async function sendCurrentMessage() {
    const text = inputEl.value.trim();
    if (!text || agentBusy) return;
    inputEl.value = '';
    addMessage('user', text);
    currentAssistantEl = null;
    currentAssistantRaw = '';
    agentOwnerTabId = trackedTabId;
    setAgentBusy(true);
    const generation = chatGeneration;
    const result = await sendToContentScript('sp-chat', { text });
    if (generation !== chatGeneration) return;
    if (result.accepted) {
      inputEl.focus();
      return;
    }
    finalizePendingTools(result.success ? 'No result was received' : (result.message || 'Turn failed'));
    if (!result.success) addMessage('assistant', result.stopped ? '_Stopped._' : `I couldn't complete that request: ${result.message}`);
    currentAssistantEl = null;
    currentAssistantRaw = '';
    setAgentBusy(false);
    await persistVisibleChat();
    inputEl.focus();
  }

  rescanBtn.addEventListener('click', runRescan);
  autofillBtn.addEventListener('click', runAutofill);
  statusSaveBtn.addEventListener('click', runTrack);
  findSubmitBtn.addEventListener('click', runFindSubmit);
  sendBtn.addEventListener('click', sendCurrentMessage);

  // ─── Job workspace listeners ────────────────────────────────────────
  createResumeBtn.addEventListener('click', createResumeForCurrentJob);
  createCoverBtn.addEventListener('click', createCoverLetterForCurrentJob);
  qaDraftBtn.addEventListener('click', draftAnswer);
  qaSaveBtn.addEventListener('click', saveApplicationAnswer);

  docsListEl.addEventListener('click', (event) => {
    const editTarget = event.target.closest('[data-edit]');
    if (editTarget) {
      const [kind, id] = editTarget.dataset.edit.split(':');
      openStudio(kind, id);
      return;
    }
    const downloadTarget = event.target.closest('[data-download]');
    if (downloadTarget) downloadResume(downloadTarget.dataset.download);
  });

  jobSelectToggle.addEventListener('click', () => {
    const opening = jobSelectRow.hidden;
    jobSelectRow.hidden = !opening;
    jobSelectToggle.textContent = opening ? 'Not this job? Pick a tracked job ▴' : 'Not this job? Pick a tracked job ▾';
    if (opening) refreshJobSelector();
  });
  jobSelectRefresh.addEventListener('click', refreshJobSelector);
  jobSelect.addEventListener('change', () => {
    const id = jobSelect.value;
    activeJobOverride = id ? (trackedJobsCache.find((job) => job.id === id) || null) : null;
    renderJobWorkspace();
  });

  jobCategorySelect.addEventListener('change', async () => {
    if (jobCategorySelect.value !== '__add__') return;
    const name = (window.prompt('New category (e.g. “Summer 2026 Internships”)') || '').trim();
    if (!name) { jobCategorySelect.value = ''; return; }
    const categories = [...new Set([...categoriesFromProfile(), name])];
    try {
      cachedProfile = await GoApplyAPI.saveJobCategories(categories);
      refreshCategorySelect();
      selectCategoryValue(name);
    } catch (error) {
      jobCategorySelect.value = '';
      contextNoteEl.textContent = `Could not add category: ${error.message || 'error'}`;
    }
  });
  inputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendCurrentMessage();
    }
  });

  // ─── Account (moved here from the removed toolbar popup) ───────────

  let devicePollInterval = null;

  function stopDevicePolling() {
    if (devicePollInterval) { clearInterval(devicePollInterval); devicePollInterval = null; }
  }

  function showDeviceCodeUI(code) {
    deviceCodeEl.hidden = false;
    deviceCodeValueEl.textContent = code;
    connectBtn.disabled = true;
  }

  function hideDeviceCodeUI() {
    deviceCodeEl.hidden = true;
    connectBtn.disabled = false;
  }

  function startDevicePolling(code) {
    stopDevicePolling();
    let attempts = 0;
    devicePollInterval = setInterval(async () => {
      attempts++;
      try {
        const result = await GoApplyAPI.exchangeDeviceCode(code);
        if (result.status === 'success') {
          stopDevicePolling();
          await chrome.storage.local.remove('pendingDeviceCode');
          hideDeviceCodeUI();
          refreshAccountStatus();
          return;
        }
        if (attempts >= 60) {
          stopDevicePolling();
          await chrome.storage.local.remove('pendingDeviceCode');
          hideDeviceCodeUI();
        }
      } catch (e) {
        stopDevicePolling();
        await chrome.storage.local.remove('pendingDeviceCode');
        hideDeviceCodeUI();
      }
    }, 2000);
  }

  async function refreshAccountStatus() {
    const stored = await chrome.storage.local.get('pendingDeviceCode');
    const pending = stored.pendingDeviceCode;
    const authed = await GoApplyAPI.checkAuth().catch(() => false);

    if (authed) {
      if (pending) { await chrome.storage.local.remove('pendingDeviceCode'); stopDevicePolling(); }
      hideDeviceCodeUI();
      connectBtn.hidden = true;
      signOutBtn.hidden = false;
      try {
        const profile = await GoApplyAPI.getProfile();
        accountStatusEl.textContent = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email || 'Connected';
      } catch (e) { accountStatusEl.textContent = 'Connected'; }
      refreshResumeSelector();
      ensureProfile(true).then(() => refreshCategorySelect()).catch(() => {});
    } else if (pending) {
      connectBtn.hidden = false;
      signOutBtn.hidden = true;
      accountStatusEl.textContent = 'Linking with Foligo…';
      showDeviceCodeUI(pending.code);
      startDevicePolling(pending.code);
      resumeSelect.disabled = true;
    } else {
      connectBtn.hidden = false;
      signOutBtn.hidden = true;
      accountStatusEl.textContent = 'Not connected to Foligo';
      resumeSelect.innerHTML = '';
      resumeSelect.appendChild(new Option('Connect Foligo to choose a résumé', ''));
      resumeSelect.disabled = true;
      cachedProfile = null;
      activeJobOverride = null;
      refreshCategorySelect();
      renderJobWorkspace();
    }
  }

  connectBtn.addEventListener('click', async () => {
    const code = GoApplyAPI.generateDeviceCode();
    await chrome.storage.local.set({ pendingDeviceCode: { code, startedAt: Date.now() } });
    const { web } = await GoApplyAPI.getEndpoints();
    chrome.tabs.create({ url: `${web}/auth/link-device?code=${code}` });
    accountStatusEl.textContent = 'Linking with Foligo…';
    showDeviceCodeUI(code);
    startDevicePolling(code);
  });

  cancelDeviceBtn.addEventListener('click', async () => {
    stopDevicePolling();
    await chrome.storage.local.remove('pendingDeviceCode');
    hideDeviceCodeUI();
    refreshAccountStatus();
  });

  signOutBtn.addEventListener('click', async () => {
    stopDevicePolling();
    await chrome.storage.local.remove(['foligoToken', 'profileFetchedAt', 'pendingDeviceCode']);
    refreshAccountStatus();
  });

  resumeRefreshBtn.addEventListener('click', refreshResumeSelector);
  resumeSelect.addEventListener('change', async () => {
    const documentId = resumeSelect.value;
    if (documentId) {
      await chrome.storage.local.set({
        selectedResumeId: documentId,
        selectedResumeIdSource: 'user',
      });
      const selectedText = resumeSelect.options[resumeSelect.selectedIndex]?.textContent || 'Selected résumé';
      uploadNoteEl.textContent = `${selectedText} will be attached to file-upload fields.`;
    } else {
      await chrome.storage.local.remove(['selectedResumeId', 'selectedResumeIdSource']);
      uploadNoteEl.textContent = 'AI mode compares your Foligo résumés with the current job before attaching one.';
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes.selectedResumeId || changes.selectedResumeIdSource) refreshResumeSelector();
  });

  boardBtn.addEventListener('click', async () => {
    const { web } = await GoApplyAPI.getEndpoints();
    chrome.tabs.create({ url: `${web}/goapply/kanban` });
  });

  settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

  // ─── Past Chats ─────────────────────────────────────────────────────
  // Read-only: browsing a past transcript doesn't reattach to whatever page
  // it was on (fieldRefs are live DOM handles that don't survive), so this
  // is for reviewing what happened, not resuming a stale session mid-tool-
  // call. "Back to current chat" always returns to the live view.

  function extractMessageText(message) {
    if (typeof message.content === 'string') return message.content;
    return (message.content || []).filter((part) => part?.type === 'text').map((part) => part.text).join('');
  }

  function renderHistoryTranscript(entry) {
    historyListEl.innerHTML = '';
    const back = document.createElement('button');
    back.className = 'sp-link-btn';
    back.textContent = '← All chats';
    back.style.marginBottom = '10px';
    back.addEventListener('click', openHistoryList);
    historyListEl.appendChild(back);
    let rendered = 0;
    for (const message of entry.messages || []) {
      if (message.role !== 'user' && message.role !== 'assistant') continue;
      const text = extractMessageText(message);
      if (!text) continue;
      rendered++;
      const bubble = document.createElement('div');
      bubble.className = `sp-history-transcript-msg sp-${message.role}`;
      if (message.role === 'assistant') bubble.innerHTML = renderMarkdown(text);
      else bubble.textContent = text;
      historyListEl.appendChild(bubble);
    }
    if (!rendered) historyListEl.appendChild(Object.assign(document.createElement('div'), { className: 'sp-empty', textContent: 'Nothing to show for this chat.' }));
  }

  function renderHistoryList(entries) {
    historyListEl.innerHTML = '';
    if (!entries.length) {
      historyListEl.appendChild(Object.assign(document.createElement('div'), { className: 'sp-empty', textContent: 'No past chats yet.' }));
      return;
    }
    for (const entry of entries) {
      const item = document.createElement('div');
      item.className = 'sp-history-item';
      const label = entry.jobTitle || entry.title || entry.url || 'Untitled chat';
      const meta = [entry.company, new Date(entry.savedAt).toLocaleString()].filter(Boolean).join(' · ');
      const titleEl = document.createElement('div');
      titleEl.className = 'sp-history-item-title';
      titleEl.textContent = label;
      const metaEl = document.createElement('div');
      metaEl.className = 'sp-history-item-meta';
      metaEl.textContent = meta;
      item.append(titleEl, metaEl);
      item.addEventListener('click', () => renderHistoryTranscript(entry));
      historyListEl.appendChild(item);
    }
  }

  async function openHistoryList() {
    await persistVisibleChat();
    const stored = await chrome.storage.local.get('goapplyChatHistory');
    const entries = Array.isArray(stored.goapplyChatHistory) ? stored.goapplyChatHistory : [];
    renderHistoryList(entries);
  }

  historyBtn.addEventListener('click', () => {
    // .style.display, not the hidden attribute — .sp-messages/.sp-compose's
    // own `display: flex` class rule outranks the UA [hidden] default.
    messagesEl.style.display = 'none';
    composeEl.style.display = 'none';
    historyViewEl.hidden = false;
    openHistoryList();
  });

  newChatBtn.addEventListener('click', async () => {
    chatGeneration++;
    const ownerTabId = agentOwnerTabId ?? trackedTabId;
    if (agentBusy) {
      ignoreAgentEvents = true;
      await sendRawToTab(ownerTabId, 'sp-stop');
      finalizePendingTools('Interrupted by new chat');
    }
    await persistVisibleChat();
    try {
      const stored = await chrome.storage.local.get('goapplyChatHistory');
      const history = Array.isArray(stored.goapplyChatHistory) ? stored.goapplyChatHistory : [];
      const archived = history.map((entry) => entry.id === currentWorkspaceId
        ? { ...entry, id: `${entry.id}:${entry.savedAt || Date.now()}`, workspaceId: null }
        : entry);
      await chrome.storage.local.set({ goapplyChatHistory: archived });
    } catch (error) {}
    await sendRawToTab(ownerTabId, 'sp-new-chat');
    clearMessages('New browser chat. Ask GoApply to inspect, navigate, click, type, research, or manage tabs.');
    await waitForAgentIdle(10000, ownerTabId);
    ignoreAgentEvents = false;
    setAgentBusy(false);
    inputEl.focus();
  });

  historyBackBtn.addEventListener('click', () => {
    historyViewEl.hidden = true;
    messagesEl.style.display = '';
    composeEl.style.display = '';
  });

  window.addEventListener('pagehide', () => {
    persistVisibleChat();
  });

  refreshAccountStatus();

  getActiveTabId().then(refreshTrackedTab);
})();
