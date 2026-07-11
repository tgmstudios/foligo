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
    if (!platform) return false;
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
      // Track to Foligo if authed
      try {
        await GoApplyAPI.trackJob({
          company: jobInfo.company || 'Unknown',
          jobTitle: jobInfo.jobTitle || 'Unknown Role',
          url: window.location.href,
          platform: platform.platform,
          location: jobInfo.location,
          status: 'APPLIED',
          source: 'extension',
        });
      } catch(e) {}
      // Also save locally
      await Tracker.saveApplication(jobInfo);
      UI.showSuccessModal(jobInfo);
    });
    return true;
  }

  // ─── Autofill ─────────────────────────────────────────────────────

  async function fullAutofill() {
    if (!foundFields.length) { UI.showToast('No fillable fields'); return; }
    
    const profile = await Filler.loadProfile();

    let filled = 0, skipped = 0;
    for (let i = 0; i < foundFields.length; i++) {
      const f = foundFields[i];
      try {
        const r = Filler.fillField(f, profile);
        if (r.success) { UI.highlightField(f.element); filled++; }
        else if (r.reason === 'no value configured') skipped++;
      } catch(e) {}
      if (i % 3 === 0 && i > 0) await new Promise(r => setTimeout(r, 50));
      UI.updateAutofillProgress(i + 1, foundFields.length);
    }
    
    UI.showToast(`Filled ${filled}/${foundFields.length}` + (skipped ? ` (${skipped} skipped)` : ''));
    
    setTimeout(() => {
      const btn = Tracker.findSubmitButton(platform?.config);
      if (btn) { Tracker.highlightSubmitButton(btn); UI.showToast('🎯 Review & submit'); }
    }, 800);
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
    if (msg.action === 'autofill') { fullAutofill().then(() => sendResponse({ success: true })); return true; }
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
