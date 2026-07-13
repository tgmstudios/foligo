/**
 * Tracker — Job application tracking, submit button detection,
 * success confirmation, and job info extraction.
 */
const Tracker = (() => {
  // Text-only signal that a control performs the final submit/apply action —
  // deliberately not keyed off input type, since a multi-step wizard's
  // "Next"/"Continue" button is very often also type="submit".
  const FINAL_SUBMIT_TEXT_RE = /^\s*(?:submit\b|apply\b|send(?:\s+(?:your\s+)?application)?\b|finish\s+application\b|complete\s+application\b)/i;

  // ─── Job info extraction ──────────────────────────────────────────

  function extractJobInfo() {
    const url = window.location.href;
    const info = { url, title: document.title, company: '', jobTitle: '', location: '', platform: '' };

    // Try JSON-LD structured data
    try {
      const ld = document.querySelector('script[type="application/ld+json"]');
      if (ld) {
        const data = JSON.parse(ld.textContent);
        if (data.title) info.jobTitle = data.title;
        if (data.hiringOrganization?.name) info.company = data.hiringOrganization.name;
        if (data.jobLocation?.address?.addressLocality) info.location = data.jobLocation.address.addressLocality;
      }
    } catch(e) {}

    // Platform-specific extraction
    if (url.includes('lever.co')) {
      info.platform = 'Lever';
      const metaCompany = document.querySelector('meta[property="og:site_name"]');
      if (metaCompany) info.company = metaCompany.getAttribute('content');
      // Lever puts job title in the heading
      const heading = document.querySelector('.posting-headline h2, h2');
      if (heading) info.jobTitle = heading.textContent.trim();
      const loc = document.querySelector('.location');
      if (loc) info.location = loc.textContent.trim();
    } else if (url.includes('greenhouse.io')) {
      info.platform = 'Greenhouse';
      const h1 = document.querySelector('h1.app-title, h1');
      if (h1) info.jobTitle = h1.textContent.trim();
      const companyLink = document.querySelector('.company-name, .employer-name');
      if (companyLink) info.company = companyLink.textContent.trim();
      const loc = document.querySelector('.location');
      if (loc) info.location = loc.textContent.trim();
    } else if (url.includes('myworkdayjobs.com') || url.includes('workday.com')) {
      info.platform = 'Workday';
      const meta = document.querySelector('meta[property="og:title"]');
      if (meta) {
        const parts = meta.getAttribute('content').split('|').map(s => s.trim());
        info.jobTitle = parts[0] || '';
        info.company = parts[1] || '';
      }
    } else if (url.includes('icims.com')) {
      info.platform = 'iCIMS';
      const h1 = document.querySelector('h1');
      if (h1) info.jobTitle = h1.textContent.trim();
    }

    // Fallback: meta tags
    if (!info.jobTitle) {
      const t = document.querySelector('meta[property="og:title"], meta[name="twitter:title"]');
      if (t) info.jobTitle = t.getAttribute('content');
    }
    if (!info.company) {
      const c = document.querySelector('meta[property="og:site_name"]');
      if (c) info.company = c.getAttribute('content');
    }
    if (!info.location) {
      const l = document.querySelector('[class*="location"], [data-automation-id*="location"]');
      if (l) info.location = l.textContent.trim();
    }

    return info;
  }

  // ─── Submit button detection ──────────────────────────────────────

  function findSubmitButton(platformConfig) {
    // Check platform-specific paths first
    if (platformConfig?.submitButtonPaths) {
      for (const xpath of platformConfig.submitButtonPaths) {
        try {
          const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          if (result.singleNodeValue) return result.singleNodeValue;
        } catch(e) {}
      }
    }

    // Generic submit button detection
    const genericSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:contains("Submit"), button:contains("Apply"), button:contains("Send")',
      '[data-automation-id*="submit"]',
      '[data-automation-id*="next"]',
      '#submit_button, #submit, #apply_button, #apply, #btn-submit',
      '.submit-button, .apply-button',
    ];

    for (const sel of genericSelectors) {
      try {
        // Handle text-contains selectors
        if (sel.includes(':contains(')) {
          const match = sel.match(/(.+):contains\("(.+)"\)/);
          if (match) {
            const base = match[1];
            const texts = match[2].split(', ');
            const buttons = document.querySelectorAll(base);
            for (const btn of buttons) {
              for (const t of texts) {
                if (btn.textContent.toLowerCase().includes(t.toLowerCase())) return btn;
              }
            }
          }
        } else {
          const el = document.querySelector(sel);
          if (el) return el;
        }
      } catch(e) {}
    }

    // Fallback: find any button containing "submit" or "apply"
    const allButtons = document.querySelectorAll('button, input[type="submit"], [role="button"]');
    for (const btn of allButtons) {
      const text = (btn.textContent || btn.value || '').toLowerCase();
      if (FINAL_SUBMIT_TEXT_RE.test(text) && btn.offsetParent !== null) {
        return btn;
      }
    }

    return null;
  }

  // ─── Navigation candidates (for the AI agent's multi-step flow) ───

  // Buttons/links a multi-step application wizard might use to advance
  // ("Next", "Continue", "Save & Continue", ...). Excludes anything that
  // looks like the final submit/apply action — the AI agent's click_element
  // tool only ever operates on these candidates, never on findSubmitButton's
  // target, so it can advance a wizard without ever being able to submit it.
  function findNavigationCandidates() {
    const candidates = [];
    const elements = document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"], a');
    for (const el of elements) {
      if (el.offsetParent === null) continue; // hidden
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
      const text = (el.textContent || el.value || el.getAttribute('aria-label') || '').trim();
      if (!text || text.length > 60) continue;
      candidates.push({ element: el, label: text, likelyFinal: FINAL_SUBMIT_TEXT_RE.test(text) });
    }
    return candidates;
  }

  function highlightSubmitButton(button) {
    if (!button) return;
    button.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const orig = button.style.outline;
    button.style.outline = '3px solid #00A86B';
    button.style.outlineOffset = '4px';
    button.style.transition = 'outline 0.2s';
    // Add pulsing animation
    if (!document.getElementById('sr-submit-keyframes')) {
      const style = document.createElement('style');
      style.id = 'sr-submit-keyframes';
      style.textContent = '@keyframes srSubmitPulse { 0%,100% { outline-color: #00A86B; box-shadow: 0 0 0 0 rgba(0,168,107,0.4); } 50% { outline-color: #635BFF; box-shadow: 0 0 0 8px rgba(99,91,255,0); } }';
      document.head.appendChild(style);
    }
    button.style.animation = 'srSubmitPulse 2s ease-in-out infinite';
    setTimeout(() => {
      button.style.outline = orig;
      button.style.animation = '';
    }, 10000);
  }

  // ─── Success detection ────────────────────────────────────────────

  function detectSuccess(platformConfig) {
    // Check platform-specific success paths
    if (platformConfig?.submittedSuccessPaths) {
      for (const xpath of platformConfig.submittedSuccessPaths) {
        try {
          const result = document.evaluate(xpath, document, null, XPathResult.BOOLEAN_TYPE, null);
          if (result.booleanValue) return true;
        } catch(e) {}
      }
    }

    // Generic success detection
    const successPatterns = [
      /thank you/i, /application submitted/i, /application received/i,
      /we .{0,20} received/i, /successfully submitted/i,
      /your application/i, /apply confirmed/i, /submission complete/i,
    ];

    // Check page text
    const bodyText = document.body.textContent || '';
    if (successPatterns.some(p => p.test(bodyText.substring(0, 3000)))) {
      return true;
    }

    // Check for success elements
    const successSelectors = [
      '[class*="success"]', '[class*="confirmation"]', '[class*="thank"]',
      '[data-qa*="success"]', '[data-automation-id*="success"]',
      '.application-confirmation', '#application-confirmation',
    ];
    for (const sel of successSelectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return true;
    }

    return false;
  }

  // ─── Application tracking ────────────────────────────────────────

  async function saveApplication(jobInfo) {
    try {
      const stored = await chrome.storage.local.get('applications');
      const apps = stored.applications || [];
      
      // Don't duplicate
      if (apps.some(a => a.url === jobInfo.url)) return false;
      
      apps.push({
        ...jobInfo,
        submittedAt: new Date().toISOString(),
      });
      
      await chrome.storage.local.set({ applications: apps });
      return true;
    } catch(e) {
      console.error('[Tracker] Failed to save application:', e);
      return false;
    }
  }

  /**
   * Persist a job to the Foligo board, then mirror it locally for offline
   * history. URL is the stable identity so tracking and later submission update
   * one card instead of creating duplicates.
   */
  async function trackApplication(jobInfo, status = 'saved') {
    if (typeof GoApplyAPI === 'undefined') throw new Error('Foligo API is unavailable');
    const url = jobInfo.url || window.location.href;
    const jobs = await GoApplyAPI.getJobs();
    let job = (jobs || []).find(candidate => candidate.url === url);
    let created = false;

    if (job) {
      // Submission promotes an existing saved card. Clicking Track again must
      // never demote an application already further along the pipeline.
      if (status === 'applied' && job.status === 'saved') {
        job = await GoApplyAPI.updateJob(job.id, { status });
      }
    } else {
      job = await GoApplyAPI.trackJob({
        company: jobInfo.company || 'Unknown company',
        position: jobInfo.jobTitle || jobInfo.position || jobInfo.title || 'Unknown role',
        url,
        status,
        source: 'extension',
      });
      created = true;
    }

    await saveApplication({ ...jobInfo, url });
    return { job, created };
  }

  async function getApplications() {
    try {
      const stored = await chrome.storage.local.get('applications');
      return stored.applications || [];
    } catch(e) {
      return [];
    }
  }

  async function getApplicationCount() {
    const apps = await getApplications();
    return apps.length;
  }

  // ─── Mutation-based success watcher ───────────────────────────────

  function watchForSuccess(platformConfig, onSuccess) {
    let detected = false;
    // Some application forms contain phrases such as "your application" before
    // submission. Only react to a new success state, never one present when the
    // watcher starts or exposed by GoApply mounting its own UI.
    let wasSuccessful = detectSuccess(platformConfig);
    const observer = new MutationObserver(() => {
      if (detected) return;
      const isSuccessful = detectSuccess(platformConfig);
      if (!wasSuccessful && isSuccessful) {
        detected = true;
        observer.disconnect();
        if (onSuccess) onSuccess();
      }
      wasSuccessful = isSuccessful;
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return observer;
  }

  return {
    extractJobInfo,
    findSubmitButton,
    findNavigationCandidates,
    FINAL_SUBMIT_TEXT_RE,
    highlightSubmitButton,
    detectSuccess,
    watchForSuccess,
    saveApplication,
    trackApplication,
    getApplications,
    getApplicationCount,
  };
})();
