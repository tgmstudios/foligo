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

  // ─── AI agent actions ──────────────────────────────────────────────

  function handleAgentEvent(event) {
    if (event?.type === 'tool-call') {
      const statuses = {
        set_field_value: `Filling ${event.input?.fieldRef || 'field'}…`,
        set_field_values: 'Filling fields…',
        inspect_field_control: `Inspecting ${event.input?.fieldRef || 'field'}…`,
        select_field_option: `Selecting ${event.input?.fieldRef || 'dropdown'}…`,
        set_checkbox_state: `Updating ${event.input?.fieldRef || 'checkbox'}…`,
        flag_field_uncertain: `Flagging ${event.input?.fieldRef || 'field'} for review…`,
        click_element: `Opening ${event.input?.elementRef || 'next step'}…`,
        find_submit_button: 'Finding the submit button…',
        rescan_page: 'Rescanning page…',
        generate_cover_letter: 'Drafting cover letter…',
        generate_custom_answer: 'Drafting answer…',
      };
      UI.updateAgentProgress(statuses[event.toolName] || `Using ${String(event.toolName).replace(/_/g, ' ')}…`);
    }
  }

  async function forceAIRescan() {
    UI.updateAgentProgress('Rescanning with AI…');
    try {
      foundFields = Finder.findFields(platform?.config || { inputSelectors: [], containerPath: [] });
      AgentController.initializePage(foundFields, platform, currentJobInfo);
      const result = await AgentController.startRescan(foundFields, platform, currentJobInfo, handleAgentEvent);
      UI.updateAgentProgress(result.continuationLimitReached ? 'AI stopped at the safety limit' : 'AI rescan complete');
      UI.showToast(result.continuationLimitReached ? 'AI paused after too many steps' : '✨ AI rescan complete');
      return {
        success: true,
        fieldsFound: foundFields.length,
        continuationLimitReached: Boolean(result.continuationLimitReached),
      };
    } catch (error) {
      UI.updateAgentProgress('AI rescan failed');
      UI.showToast(`AI rescan failed: ${error.message}`);
      return { success: false, message: error.message };
    } finally {
      setTimeout(() => UI.updateAgentProgress(''), 2500);
    }
  }

  async function fillFieldWithAI(fieldRef) {
    UI.updateAgentProgress(`Filling ${fieldRef} with AI…`);
    try {
      const result = await AgentController.startFieldFill(fieldRef, platform, currentJobInfo, handleAgentEvent);
      UI.updateAgentProgress(result.continuationLimitReached ? 'AI stopped at the safety limit' : 'Field AI complete');
    } catch (error) {
      UI.updateAgentProgress('Field AI failed');
      UI.showToast(`AI fill failed: ${error.message}`);
    } finally {
      setTimeout(() => UI.updateAgentProgress(''), 2500);
    }
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
    ChatPanel.mount(document.body, () => ({ platform, jobInfo: currentJobInfo }));
    let appCount = 0;
    try { const kanban = await GoApplyAPI.getKanban().catch(() => []); appCount = kanban.reduce((s,c) => s + (c.cards?.length||0), 0); } catch(e) {}

    UI.renderPanel(
      platform,
      foundFields,
      jobInfo,
      appCount,
      fullAutofill,
      () => { platform = null; foundFields = []; isActivated = false; },
      armSubmitWatcher,
      previewDocument,
      { onRescan: forceAIRescan, onFieldFill: fillFieldWithAI, onChat: () => ChatPanel.toggle() },
    );

    if (!bannerInjected) { try { await Banners.injectBanner(platform); bannerInjected = true; } catch(e) {} }

    try { armSubmitWatcher(Tracker.findSubmitButton(platform.config)); } catch(e) {}
    AgentController.tryRestoreAfterNavigation(
      platform,
      jobInfo,
      (event) => {
        handleAgentEvent(event);
        ChatPanel.handleAgentEvent(event);
      },
      (messages) => {
        ChatPanel.restoreMessages(messages);
        ChatPanel.open();
      },
    ).then((restored) => {
      if (restored) {
        ChatPanel.open();
        UI.updateAgentProgress('Agent resumed after navigation');
        setTimeout(() => UI.updateAgentProgress(''), 2500);
      }
    }).catch((error) => warn('Agent navigation restore failed:', error.message));
    return true;
  }

  async function runManualAIRescan() {
    const activated = await tryActivate({ forceAgent: true });
    if (!activated) return { success: false, message: 'AI Rescan could not start on this page' };
    return forceAIRescan();
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
      UI.updateAutofillProgress(0, foundFields.length, 'Profile sync failed');
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
      UI.updateAutofillProgress(i + 1, foundFields.length);
    }
    
    log('Autofill finished:', { filled, skipped, manual, total: foundFields.length });
    UI.updateAutofillProgress(foundFields.length, foundFields.length, `Filled ${filled}/${foundFields.length}`);
    UI.showToast(`Filled ${filled}/${foundFields.length}` + (skipped ? ` (${skipped} skipped)` : '') + (manual ? ` (${manual} manual)` : ''));
    
    setTimeout(() => {
      const btn = Tracker.findSubmitButton(platform?.config);
      if (btn) { Tracker.highlightSubmitButton(btn); armSubmitWatcher(btn); UI.showToast('🎯 Review & submit'); }
    }, 800);
    return { success: filled > 0, filled, total: foundFields.length, skipped, manual };
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
          Banners.removeBanner(); UI.unmount();
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
    try { UI.unmount(); } catch(e) {}
  });

  // ─── Messages ─────────────────────────────────────────────────────
  chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'autofill') {
      fullAutofill()
        .then(sendResponse)
        .catch(error => sendResponse({ success: false, message: error.message }));
      return true;
    }
    if (msg.action === 'detect') {
      (async () => {
        const jobInfo = Tracker.extractJobInfo();
        sendResponse({ platform: platform?.platform || null, fieldsFound: foundFields.length, isActivated, jobInfo });
      })(); return true;
    }
    if (msg.action === 'ai-rescan') {
      runManualAIRescan()
        .then(sendResponse)
        .catch(error => sendResponse({ success: false, message: error.message }));
      return true;
    }
    if (msg.action === 'run') { start().then(() => sendResponse({ success: true })); return true; }
  });

  try { await startup(); log('Ready'); } catch(e) { warn('Startup:', e.message); }
})();
