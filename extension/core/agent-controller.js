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
  const MAX_CONTINUATIONS = 20;
  const SNAPSHOT_TTL_MS = 5 * 60 * 1000;

  let fieldRefs = new Map();   // ref -> fieldInfo (Finder shape: {fieldName, element, method, container, values})
  let navRefs = new Map();     // ref -> { element, label, likelyFinal }
  let flagged = new Map();     // ref -> reason
  let currentPlatform = null;
  let currentJobInfo = null;
  let activeSession = null; // { mode, messages }
  let agentPort = null;
  let isRunning = false;
  let navigationSnapshotPending = false;
  let pageIsUnloading = false;
  window.addEventListener('pagehide', () => { pageIsUnloading = true; });

  // ─── Ref bookkeeping ──────────────────────────────────────────────

  function resetRefs() {
    fieldRefs = new Map();
    navRefs = new Map();
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
    return {
      url: window.location.href,
      title: document.title,
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
        if (typeof UI !== 'undefined' && field.element) {
          UI.highlightField(field.element);
          if (confidence === 'low') UI.setFieldBadge?.(fieldRef, 'flagged', flagged.get(fieldRef));
          else UI.setFieldBadge?.(fieldRef, 'filled');
        }
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

  function toolFlagFieldUncertain({ fieldRef, reason }) {
    if (!fieldRefs.has(fieldRef)) return { flagged: false, note: 'Unknown fieldRef.' };
    flagged.set(fieldRef, reason);
    if (typeof UI !== 'undefined') UI.setFieldBadge?.(fieldRef, 'flagged', reason);
    return { flagged: true };
  }

  async function toolClickElement({ elementRef, expectation }, callContext) {
    const nav = navRefs.get(elementRef);
    if (!nav) return { clicked: false, refused: 'Not a known navigation candidate.' };
    const liveLabel = (nav.element.textContent || nav.element.value || nav.element.getAttribute?.('aria-label') || '').trim();
    if (nav.likelyFinal || Tracker.FINAL_SUBMIT_TEXT_RE.test(liveLabel)) {
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
    nav.element.click();
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

  function toolRescanPage() {
    let fresh = [];
    try { fresh = Finder.findFields(currentPlatform?.config || { inputSelectors: [], containerPath: [] }); } catch (e) {}
    rebuildFromFoundFields(fresh);
    onFieldsRefreshed?.(fresh);
    return { fields: summarizeFields(), navCandidates: summarizeNavCandidates() };
  }

  async function executeClientTool(toolName, input, callContext = {}) {
    switch (toolName) {
      case 'set_field_value': return toolSetFieldValue(input);
      case 'set_field_values': return toolSetFieldValues(input);
      case 'inspect_field_control': return toolInspectFieldControl(input);
      case 'select_field_option': return toolSelectFieldOption(input);
      case 'set_checkbox_state': return toolSetCheckboxState(input);
      case 'flag_field_uncertain': return toolFlagFieldUncertain(input);
      case 'click_element': return toolClickElement(input, callContext);
      case 'find_submit_button': return toolFindSubmitButton();
      case 'rescan_page': return toolRescanPage();
      default: return { error: `Unknown client tool: ${toolName}` };
    }
  }

  function toolOutputSucceeded(toolName, output) {
    if (!output || output.error || output.refused) return false;
    if ('applied' in output) return output.applied === true;
    if ('clicked' in output) return output.clicked === true;
    if ('flagged' in output) return output.flagged === true;
    if ('found' in output) return output.found === true;
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

  function snapshotKey() {
    return `goapplyAgent:${getSessionId()}`;
  }

  async function snapshotForNavigation(messages = activeSession?.messages, mode = activeSession?.mode) {
    if (!messages || !mode) return;
    try {
      await chrome.storage.session?.set({
        [snapshotKey()]: { messages, mode, savedAt: Date.now() },
      });
    } catch (e) {}
  }

  async function restoreSnapshot() {
    try {
      const stored = await chrome.storage.session?.get(snapshotKey());
      const snap = stored?.[snapshotKey()];
      if (!snap || Date.now() - snap.savedAt > SNAPSHOT_TTL_MS) return null;
      await chrome.storage.session?.remove(snapshotKey());
      return snap;
    } catch (e) { return null; }
  }

  // ─── Turn loop ─────────────────────────────────────────────────────

  function textPart(text) { return { type: 'text', text }; }

  function jsonOutput(value) {
    return { type: 'json', value: value === undefined ? null : value };
  }

  function toolResultPart(toolCallId, toolName, value, isError = false) {
    return {
      type: 'tool-result',
      toolCallId,
      toolName,
      output: isError ? { type: 'error-text', value: String(value) } : jsonOutput(value),
    };
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

  async function sendPortRequestOnce(turnBody, onEvent) {
    const request = await GoApplyAPI.buildAgentRequest(turnBody);
    return new Promise((resolve, reject) => {
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const port = getAgentPort();

      const toolCalls = new Map(); // toolCallId -> { toolName, input, resolved }
      let assistantText = '';
      let streamError = null;

      const cleanup = () => {
        port.onMessage.removeListener(handleMessage);
        port.onDisconnect.removeListener(handleDisconnect);
      };
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
          if (event.type === 'text-delta') assistantText += event.text;
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

  async function continueTurn({ mode, messages, context, onEvent }, depth = 0) {
    repairToolHistory(messages);
    const { assistantText, toolCalls } = await sendPortRequest({ mode, messages, context }, onEvent);

    const assistantContent = [];
    if (assistantText) assistantContent.push(textPart(assistantText));
    for (const [toolCallId, call] of toolCalls) {
      assistantContent.push({ type: 'tool-call', toolCallId, toolName: call.toolName, input: call.input });
    }
    if (assistantContent.length) messages.push({ role: 'assistant', content: assistantContent });

    const pendingResults = [];
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
      if (depth >= MAX_CONTINUATIONS) {
        const message = `Client tool was not executed because the ${MAX_CONTINUATIONS}-continuation safety limit was reached.`;
        pendingResults.push(toolResultPart(toolCallId, call.toolName, message, true));
        onEvent?.({ type: 'tool-error', toolCallId, toolName: call.toolName, error: message, clientExecuted: false });
        continue;
      }
      try {
        const output = await executeClientTool(call.toolName, call.input, { toolCallId, mode, messages, pendingResults });
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

    const needsContinuation = toolCalls.size > 0;
    if (!needsContinuation || depth >= MAX_CONTINUATIONS) {
      activeSession = { mode, messages };
      return { done: true, assistantText, continuationLimitReached: depth >= MAX_CONTINUATIONS && needsContinuation };
    }
    activeSession = { mode, messages };

    // Context may have changed (rescan_page, click_element navigating a
    // same-page step) — rebuild it fresh for the continuation request.
    const nextContext = buildContext(context?.targetFieldRef);
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
    try {
      return await run();
    } finally {
      isRunning = false;
      // A same-document/SPA flow reaches this cleanup after its continuation
      // finishes. A real navigation destroys this script context first, so
      // the snapshot remains available to the next document.
      if (navigationSnapshotPending && !pageIsUnloading) {
        navigationSnapshotPending = false;
        try { await chrome.storage.session?.remove(snapshotKey()); } catch (e) {}
      }
    }
  }

  async function startRescan(foundFields, platform, jobInfo, onEvent) {
    initializePage(foundFields, platform, jobInfo);
    const messages = [{ role: 'user', content: [textPart('Please review this application page and fill in whatever you can.')] }];
    return runWithTurnState(() => continueTurn({ mode: 'rescan', messages, context: buildContext(), onEvent }));
  }

  async function startFieldFill(fieldRef, platform, jobInfo, onEvent) {
    currentPlatform = platform;
    currentJobInfo = jobInfo;
    if (!fieldRefs.size) toolRescanPage();
    const messages = [{ role: 'user', content: [textPart(`Please resolve just the field ${fieldRef}.`)] }];
    return runWithTurnState(() => continueTurn({ mode: 'field', messages, context: buildContext(fieldRef), onEvent }));
  }

  async function sendChatMessage(text, platform, jobInfo, onEvent) {
    currentPlatform = currentPlatform || platform;
    currentJobInfo = currentJobInfo || jobInfo;
    if (!fieldRefs.size) toolRescanPage();
    const messages = activeSession?.mode === 'chat' ? activeSession.messages.slice() : [];
    repairToolHistory(messages);
    messages.push({ role: 'user', content: [textPart(text)] });
    return runWithTurnState(() => continueTurn({ mode: 'chat', messages, context: buildContext(), onEvent }));
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

  return {
    initializePage, startRescan, startFieldFill, sendChatMessage, tryRestoreAfterNavigation,
    getFlaggedRefs, setOnFieldsRefreshed,
  };
})();
