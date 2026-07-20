/**
 * GoApply Main — Detection → Finding → Filling → Tracking → Foligo sync.
 * All AI features are offloaded to Foligo's Gemini API.
 * Job tracking syncs to Foligo's Kanban board.
 */
(async function Main() {
  'use strict';
  const log = (...a) => console.log('[GoApply]', ...a);
  const warn = (...a) => console.warn('[GoApply]', ...a);

  let platform = null, foundFields = [], observer = null, urlObserver = null;
  let boardsInterval = null, successWatcher = null, isActivated = false;
  let bannerInjected = false, currentJobInfo = null;

  // ─── Side panel bridge ────────────────────────────────────────────
  // Content scripts don't know their own tab id; cache it once so streamed
  // agent events can be tagged for the side panel to filter by.

  let ownTabId = null;
  async function getOwnTabId() {
    if (ownTabId != null) return ownTabId;
    try {
      const res = await chrome.runtime.sendMessage({ action: 'get-own-tab-id' });
      ownTabId = res?.tabId ?? null;
    } catch (e) { ownTabId = null; }
    return ownTabId;
  }

  function broadcastToSidePanel(tabId, event) {
    if (tabId == null) return;
    try { chrome.runtime.sendMessage({ type: 'sp-agent-event', tabId, event }); } catch (e) {}
  }

  function broadcastTurnCompletion(tabId, result) {
    broadcastToSidePanel(tabId, { type: 'turn-complete', result });
  }

  // ─── Submit tracking ──────────────────────────────────────────────

  // Success is only inferred after the user actually clicks the real submit
  // button — starting the DOM watcher on activation let autofill's own field
  // mutations (and a site's per-field validation styling) false-positive as
  // "submitted" before the form was ever sent.
  function armSubmitWatcher(button) {
    if (!button || button.dataset.srArmed) return;
    button.dataset.srArmed = '1';
    button.addEventListener('click', () => {
      if (successWatcher) return;
      const info = currentJobInfo || {};
      successWatcher = Tracker.watchForSuccess(platform?.config, async () => {
        log('Submitted!');
        try {
          await Tracker.trackApplication({ ...info, platform: platform?.platform }, 'applied');
        } catch(e) { warn('Submission tracking failed:', e.message); }
        UI.showSuccessModal(info);
      });
    }, { once: true });
  }

  // ─── Document preview ──────────────────────────────────────────────

  // Opens a bundled extension page that fetches and renders the PDF itself.
  // A window.open() called after the async doc fetch/compile would land on
  // about:blank: by the time the network round-trip finishes, the click's
  // transient user-activation has expired, and Chrome silently refuses to
  // navigate a popup to a data:/blob: URL without it. Navigating straight to
  // our own extension page, synchronously inside the click handler, has no
  // such restriction — the page then does its own fetching after it loads.
  function previewDocument(kind) {
    const url = chrome.runtime.getURL(`preview.html?kind=${encodeURIComponent(kind)}`);
    const tab = window.open(url, '_blank');
    if (!tab) UI.showToast('Preview blocked — allow popups for this site');
  }

  // ─── Startup ──────────────────────────────────────────────────────

  async function startup() {
    await new Promise(r => Consent.showIfNeeded(r));
    await new Promise(r => Tutorial.start(r));
    await start();
  }

  // ─── Activation ───────────────────────────────────────────────────

  async function tryActivate({ forceAgent = false } = {}) {
    if (isActivated) return true;
    try { platform = await Detector.shouldActivate(); } catch(e) { platform = null; }
    if (!platform) {
      // A known ATS can render its form after document_idle. Do not lock it
      // into generic mode while its configured container is still loading. If
      // a form is already present but its markup changed, retain the known ATS
      // selectors and let Finder's heuristics supplement them.
      let knownPlatform = null;
      try {
        knownPlatform = await Detector.detectPlatform();
      } catch (e) {}
      let forms = [];
      try { forms = Finder.findAllForms(); } catch (e) {}
      if (!knownPlatform && !forms.length && !forceAgent) return false;
      platform = knownPlatform || {
          platform: 'generic',
          config: { inputSelectors: [], containerPath: [], containerRequired: false },
        };
    }
    isActivated = true;
    log('Platform:', platform.platform);

    try { foundFields = Finder.findFields(platform.config); log('Fields:', foundFields.length); }
    catch(e) { foundFields = []; }

    const jobInfo = Tracker.extractJobInfo();
    currentJobInfo = jobInfo;
    AgentController.initializePage(foundFields, platform, jobInfo);
    AgentController.setOnFieldsRefreshed((freshFields) => { foundFields = freshFields; });

    if (!bannerInjected) { try { await Banners.injectBanner(platform); bannerInjected = true; } catch(e) {} }

    try { armSubmitWatcher(Tracker.findSubmitButton(platform.config)); } catch(e) {}
    // A multi-step agent turn can outlive a real page navigation (the script
    // context that started it is destroyed); the resumed turn's events go to
    // whichever side panel is open for this tab, same as any other turn.
    const tabId = await getOwnTabId();
    AgentController.tryRestoreAfterNavigation(
      platform,
      jobInfo,
      (event) => broadcastToSidePanel(tabId, event),
      () => { try { chrome.runtime.sendMessage({ action: 'open-side-panel' }); } catch (e) {} },
    ).then((restored) => {
      if (restored) broadcastTurnCompletion(tabId, { success: true, restored: true });
    }).catch((error) => {
      warn('Agent navigation restore failed:', error.message);
      broadcastTurnCompletion(tabId, { success: false, message: error.message, stopped: error.code === 'USER_STOPPED' });
    });
    return true;
  }

  // ─── Side panel entry points ───────────────────────────────────────
  // The side panel is the only chat/control surface now — it can't reach
  // into this page's DOM, so AgentController still runs here and every
  // event is streamed to it via broadcastToSidePanel.

  async function sidePanelRescan() {
    const activated = await tryActivate({ forceAgent: true });
    if (!activated) return { success: false, message: 'No fillable page detected here.' };
    const tabId = await getOwnTabId();
    try {
      const result = await AgentController.startRescan(foundFields, platform, currentJobInfo, (event) => broadcastToSidePanel(tabId, event));
      return { success: true, continuationLimitReached: Boolean(result.continuationLimitReached) };
    } catch (error) {
      return { success: false, message: error.message, stopped: error.code === 'USER_STOPPED' };
    }
  }

  async function sidePanelChat(text) {
    await tryActivate();
    const tabId = await getOwnTabId();
    try {
      const result = await AgentController.sendChatMessage(text, platform, currentJobInfo, (event) => broadcastToSidePanel(tabId, event));
      return { success: true, assistantText: result.assistantText };
    } catch (error) {
      return { success: false, message: error.message, stopped: error.code === 'USER_STOPPED' };
    }
  }

  async function sidePanelFieldFill(fieldRef) {
    await tryActivate();
    const tabId = await getOwnTabId();
    try {
      const result = await AgentController.startFieldFill(fieldRef, platform, currentJobInfo, (event) => broadcastToSidePanel(tabId, event));
      return { success: true, continuationLimitReached: Boolean(result.continuationLimitReached) };
    } catch (error) {
      return { success: false, message: error.message, stopped: error.code === 'USER_STOPPED' };
    }
  }

  // ─── Autofill ─────────────────────────────────────────────────────

  async function fullAutofill() {
    if (!foundFields.length) {
      UI.showToast('No fillable fields');
      return { success: false, filled: 0, total: 0, skipped: 0, message: 'No fillable fields detected' };
    }
    
    // Autofill is an explicit user action, so prefer current server data over a
    // potentially stale ten-minute cache from an earlier dashboard edit.
    const profile = await Filler.loadProfile(true);
    log('Autofill starting:', foundFields.length, 'unique fields,', Object.keys(profile).length, 'profile properties');
    if (Object.keys(profile).length === 0) {
      const message = 'Profile sync returned no data. Sign in and sync your GoApply profile.';
      console.error('[GoApply:Autofill]', message);
      UI.showToast(message);
      return { success: false, filled: 0, total: foundFields.length, skipped: foundFields.length, manual: 0, message };
    }

    let filled = 0, skipped = 0, manual = 0;
    for (let i = 0; i < foundFields.length; i++) {
      const f = foundFields[i];
      try {
        const r = await Filler.fillField(f, profile);
        if (r.manual) {
          manual++;
          console.debug('[GoApply:Autofill]', f.fieldName, 'manual action required');
        } else if (!r.success) {
          skipped++;
          console.warn('[GoApply:Autofill]', f.fieldName, 'skipped:', r.reason || 'fill failed');
        } else {
          // Give React and custom controls time to process their synthetic event
          // before claiming that the field was filled.
          await new Promise(resolve => setTimeout(resolve, f.method === 'select' ? 300 : 30));
          const element = f.element;
          const candidates = r.expectedChoices || [r.expectedValue];
          const actual = r.retainedValue || Filler.readFieldValue(f);
          const retained = Filler.valueMatches(actual, candidates);
          if (retained) {
            UI.highlightField(element);
            filled++;
            console.debug('[GoApply:Autofill]', f.fieldName, `filled method=${f.method || 'default'} retained=yes`);
          } else {
            skipped++;
            console.warn('[GoApply:Autofill]', f.fieldName, `write attempted method=${f.method || 'default'} retained=no`);
          }
        }
      } catch(e) {
        skipped++;
        console.error('[GoApply:Autofill]', f.fieldName, 'error:', e.message);
      }
      if (i % 3 === 0 && i > 0) await new Promise(r => setTimeout(r, 50));
    }

    log('Autofill finished:', { filled, skipped, manual, total: foundFields.length });
    UI.showToast(`Filled ${filled}/${foundFields.length}` + (skipped ? ` (${skipped} skipped)` : '') + (manual ? ` (${manual} manual)` : ''));
    
    setTimeout(() => {
      const btn = Tracker.findSubmitButton(platform?.config);
      if (btn) { Tracker.highlightSubmitButton(btn); armSubmitWatcher(btn); UI.showToast('🎯 Review & submit'); }
    }, 800);
    let tracking = null;
    const trackable = String(currentJobInfo?.company || '').trim()
      && String(currentJobInfo?.jobTitle || currentJobInfo?.position || '').trim();
    if (filled > 0 && trackable) {
      try { tracking = await Tracker.trackApplication(currentJobInfo, 'saved'); }
      catch (error) { warn('Automatic job tracking failed:', error.message); }
    }
    return { success: filled > 0, filled, total: foundFields.length, skipped, manual, tracking };
  }

  // ─── Side panel control actions ─────────────────────────────────────
  // Autofill/Track/Find-Submit/field-list used to be buttons on the
  // in-page floating panel; that panel is gone, so the side panel drives
  // these the same way it drives rescan/chat/field-fill — via messages.

  function findAndHighlightSubmit() {
    const btn = Tracker.findSubmitButton(platform?.config);
    if (btn) { Tracker.highlightSubmitButton(btn); armSubmitWatcher(btn); }
    return Boolean(btn);
  }

  async function trackCurrentJob(status = 'saved', allowStatusChange = false) {
    // The extension may not have activated when the panel first opened, and
    // SPA job pages can replace their metadata without a full reload. Always
    // read the live page at the moment the user asks to track it.
    currentJobInfo = Tracker.extractJobInfo();
    const company = String(currentJobInfo?.company || '').trim();
    const position = String(currentJobInfo?.jobTitle || currentJobInfo?.position || '').trim();
    try {
      // A board card already matched by URL needs no second company/title
      // identification pass. This is especially important inside embedded
      // application steps whose header metadata has disappeared.
      const existing = await Tracker.getTrackedApplication(currentJobInfo);
      if (!existing && (!Tracker.isTrackableJobInfo(currentJobInfo) || !company || !position)) {
        return {
          success: false,
          unavailable: true,
          message: 'The page needs AI identification before it can be tracked.',
          jobInfo: currentJobInfo,
        };
      }
      const result = await Tracker.trackApplication(currentJobInfo, status, {
        allowStatusChange,
        ...(company ? { company } : {}),
        ...(position ? { position } : {}),
      });
      return { success: true, created: result.created, changed: result.changed, job: result.job };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async function getCurrentJobTracking() {
    try {
      currentJobInfo = Tracker.extractJobInfo();
      // URL identity still lets a previously tracked card be found when a
      // site's title/company metadata is temporarily absent during rendering.
      const job = await Tracker.getTrackedApplication(currentJobInfo, { reconcile: true });
      return { success: true, job, jobInfo: currentJobInfo };
    } catch (error) {
      return { success: false, job: null, jobInfo: currentJobInfo, message: error.message };
    }
  }

  function summarizeFoundFields() {
    const flagged = AgentController.getFlaggedRefs();
    return foundFields.map((f, i) => {
      const ref = `f${i}`;
      const docKind = f.method === 'uploadResume' ? 'resume' : f.method === 'uploadCoverLetter' ? 'coverLetter' : null;
      return {
        ref,
        label: (f.fieldName || '').replace(/_/g, ' '),
        docKind,
        flaggedReason: flagged.get(ref) || null,
      };
    });
  }

  // ─── Observer ─────────────────────────────────────────────────────

  async function start() {
    log('GoApply v1.1 starting...');
    await tryActivate();
    
    if (!isActivated) {
      try { boardsInterval = Boards.startWatching(); } catch(e) {}
      try {
        const obs = Detector.createObserver(async () => { if (!isActivated) await tryActivate(); }, { debounceMs: 500, maxDebounceMs: 5000 });
        observer = obs.observer;
      } catch(e) {}
      
    }

    // Reuse the existing DOM-observer approach for SPA URL changes, but keep
    // it active even when the extension was already activated on first load.
    let lastUrl = window.location.href;
    try {
      if (urlObserver) urlObserver.disconnect();
      urlObserver = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          platform = null; foundFields = []; isActivated = false; bannerInjected = false;
          if (successWatcher) { successWatcher.disconnect(); successWatcher = null; }
          Banners.removeBanner();
          setTimeout(tryActivate, 1000);
        }
      });
      urlObserver.observe(document, { subtree: true, childList: true });
    } catch(e) {}
  }

  // ─── Cleanup ──────────────────────────────────────────────────────
  window.addEventListener('beforeunload', () => {
    if (observer) try { observer.disconnect(); } catch(e) {}
    if (urlObserver) try { urlObserver.disconnect(); } catch(e) {}
    if (boardsInterval) clearInterval(boardsInterval);
    if (successWatcher) try { successWatcher.disconnect(); } catch(e) {}
    Banners.removeBanner();
  });

  // ─── Messages ─────────────────────────────────────────────────────
  chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'detect') {
      (async () => {
        const jobInfo = Tracker.extractJobInfo();
        sendResponse({ platform: platform?.platform || null, fieldsFound: foundFields.length, isActivated, jobInfo });
      })(); return true;
    }
    if (msg.action === 'sp-rescan') {
      getOwnTabId().then(tabId => sidePanelRescan().then(result => broadcastTurnCompletion(tabId, result)));
      sendResponse({ success: true, accepted: true });
      return false;
    }
    if (msg.action === 'sp-chat') {
      getOwnTabId().then(tabId => sidePanelChat(msg.text).then(result => broadcastTurnCompletion(tabId, result)));
      sendResponse({ success: true, accepted: true });
      return false;
    }
    if (msg.action === 'sp-field-fill') {
      getOwnTabId().then(tabId => sidePanelFieldFill(msg.fieldRef).then(result => broadcastTurnCompletion(tabId, result)));
      sendResponse({ success: true, accepted: true });
      return false;
    }
    if (msg.action === 'sp-stop') { sendResponse({ stopped: AgentController.stop() }); return false; }
    if (msg.action === 'sp-is-busy') { sendResponse({ busy: AgentController.isBusy() }); return false; }
    if (msg.action === 'sp-new-chat') { sendResponse({ success: AgentController.resetSession() }); return false; }
    if (msg.action === 'sp-autofill') { fullAutofill().then(sendResponse); return true; }
    if (msg.action === 'sp-track') {
      trackCurrentJob(msg.status || 'saved', msg.allowStatusChange === true).then(sendResponse);
      return true;
    }
    if (msg.action === 'sp-get-job-tracking') { getCurrentJobTracking().then(sendResponse); return true; }
    if (msg.action === 'sp-find-submit') { sendResponse({ found: findAndHighlightSubmit() }); return false; }
    if (msg.action === 'sp-preview') { previewDocument(msg.kind); sendResponse({ success: true }); return false; }
    if (msg.action === 'sp-get-fields') { sendResponse({ fields: summarizeFoundFields(), jobInfo: currentJobInfo }); return false; }
    if (msg.action === 'agent-execute-tool') {
      tryActivate({ forceAgent: true })
        .then(() => AgentController.executeExternalTool(msg.toolName, msg.input || {}))
        .then(sendResponse)
        .catch((error) => sendResponse({ error: error.message }));
      return true;
    }
  });

  try { await startup(); log('Ready'); } catch(e) { warn('Startup:', e.message); }
})();
