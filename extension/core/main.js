/**
 * GoApply Main — Detection → Finding → Filling → Tracking → Foligo sync.
 * All AI features are offloaded to Foligo's Gemini API.
 * Job tracking syncs to Foligo's Kanban board.
 */
(async function Main() {
  'use strict';
  const log = (...a) => console.log('[GoApply]', ...a);
  const warn = (...a) => console.warn('[GoApply]', ...a);

  let platform = null, foundFields = [], observer = null;
  let boardsInterval = null, successWatcher = null, isActivated = false;
  let bannerInjected = false;

  // ─── Startup ──────────────────────────────────────────────────────

  async function startup() {
    await new Promise(r => Consent.showIfNeeded(r));
    await new Promise(r => Tutorial.start(r));
    await start();
  }

  // ─── Activation ───────────────────────────────────────────────────

  async function tryActivate() {
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
      if (!forms.length) return false;
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
    let appCount = 0;
    try { const kanban = await GoApplyAPI.getKanban().catch(() => []); appCount = kanban.reduce((s,c) => s + (c.cards?.length||0), 0); } catch(e) {}

    if (foundFields.length > 0 || jobInfo.company) {
      UI.renderPanel(platform, foundFields, jobInfo, appCount, fullAutofill, () => { platform = null; foundFields = []; isActivated = false; });
    }

    if (!bannerInjected) { try { await Banners.injectBanner(platform); bannerInjected = true; } catch(e) {} }

    successWatcher = Tracker.watchForSuccess(platform.config, async () => {
      log('Submitted!');
      try {
        await Tracker.trackApplication({ ...jobInfo, platform: platform.platform }, 'applied');
      } catch(e) { warn('Submission tracking failed:', e.message); }
      UI.showSuccessModal(jobInfo);
    });
    return true;
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
        const r = Filler.fillField(f, profile);
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
          const normalize = input => String(input ?? '').toLowerCase().replace(/[^a-z0-9+]+/g, ' ').trim();
          const candidates = (r.expectedChoices || [r.expectedValue]).map(normalize).filter(Boolean);
          let actual = '';
          if (element.type === 'checkbox' || element.type === 'radio') {
            const checked = element.name
              ? document.querySelector(`input[name="${CSS.escape(element.name)}"]:checked`)
              : (element.checked ? element : null);
            actual = checked
              ? [checked.value, checked.getAttribute('aria-label'), ...(checked.labels ? Array.from(checked.labels).map(label => label.textContent) : [])].filter(Boolean).join(' ')
              : '';
          } else if (element.tagName === 'SELECT') {
            actual = element.selectedOptions?.[0]?.textContent || element.value;
          } else {
            actual = element.value ?? element.textContent ?? '';
          }
          const normalizedActual = normalize(actual);
          const retained = normalizedActual.length > 0 && candidates.some(expected =>
            normalizedActual === expected || normalizedActual.includes(expected) || expected.includes(normalizedActual) ||
            normalizedActual.replace(/\s+/g, '').includes(expected.replace(/\s+/g, ''))
          );
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
      if (btn) { Tracker.highlightSubmitButton(btn); UI.showToast('🎯 Review & submit'); }
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
      
      let lastUrl = window.location.href;
      try {
        new MutationObserver(() => {
          if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            platform = null; foundFields = []; isActivated = false; bannerInjected = false;
            if (successWatcher) { successWatcher.disconnect(); successWatcher = null; }
            Banners.removeBanner(); UI.unmount();
            setTimeout(tryActivate, 1000);
            try { boardsInterval = Boards.startWatching(); } catch(e) {}
          }
        }).observe(document, { subtree: true, childList: true });
      } catch(e) {}
    }
  }

  // ─── Cleanup ──────────────────────────────────────────────────────
  window.addEventListener('beforeunload', () => {
    if (observer) try { observer.disconnect(); } catch(e) {}
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
    if (msg.action === 'run') { start().then(() => sendResponse({ success: true })); return true; }
  });

  try { await startup(); log('Ready'); } catch(e) { warn('Startup:', e.message); }
})();
