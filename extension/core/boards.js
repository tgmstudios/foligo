/**
 * Boards — Inject "Track with GoApply" / "Quick Apply" buttons 
 * onto job board listing pages (LinkedIn, Indeed, Handshake).
 */
const Boards = (() => {
  const BOARD_CONFIGS = {
    LinkedIn: {
      urls: ['*://*.linkedin.com/jobs/collections/*', '*://*.linkedin.com/jobs/search/*', '*://*.linkedin.com/jobs/view/*'],
      container: './/div[contains(@class, "job-view-layout")]//div[(contains(@class, "apply-button") or contains(@class, "jobs-s-apply"))]',
      insertMethod: 'after',
    },
    Indeed: {
      urls: ['*://*.indeed.com/viewjob*', '*://*.indeed.com/m/basecamp/viewjob*'],
      container: './/div[@id="viewJobButtonLinkContainer"]',
      insertMethod: 'after',
    },
    Handshake: {
      urls: ['*://*.joinhandshake.com/stu/jobs/*'],
      container: './/div[contains(@class, "style__buttons-container")]',
      insertMethod: 'after',
    },
  };

  function matchesAny(patterns, url) {
    return patterns.some(p => {
      try {
        const re = new RegExp('^' + p.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        return re.test(url);
      } catch(e) { return false; }
    });
  }

  function getBoardConfig(url) {
    for (const [board, cfg] of Object.entries(BOARD_CONFIGS)) {
      if (matchesAny(cfg.urls, url)) return { board, ...cfg };
    }
    return null;
  }

  function createTrackButton(board, jobUrl) {
    const btn = document.createElement('button');
    btn.className = 'sr-board-track-btn';
    btn.innerHTML = '📋 Track with GoApply';
    btn.style.cssText = `
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border: 2px solid #635BFF; border-radius: 24px;
      background: white; color: #635BFF; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.15s; font-family: -apple-system, sans-serif;
      margin: 8px 0;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#635BFF'; btn.style.color = 'white';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'white'; btn.style.color = '#635BFF';
    });
    btn.addEventListener('click', async () => {
      const info = {
        url: jobUrl || window.location.href,
        title: document.title,
        company: extractCompanyFromBoard(),
        platform: board,
        trackedAt: new Date().toISOString(),
      };
      try {
        const stored = await chrome.storage.local.get('trackedJobs');
        const jobs = stored.trackedJobs || [];
        if (!jobs.some(j => j.url === info.url)) {
          jobs.push(info);
          await chrome.storage.local.set({ trackedJobs: jobs });
          btn.innerHTML = '✓ Tracked';
          btn.style.background = '#00A86B';
          btn.style.color = 'white';
          btn.style.borderColor = '#00A86B';
          btn.disabled = true;
        }
      } catch(e) {}
    });
    return btn;
  }

  function extractCompanyFromBoard() {
    // Try common selectors
    const selectors = [
      '.job-details-jobs-unified-top-card__company-name',
      '[data-automation-id="job-company-name"]',
      '.jobsearch-InlineCompanyRating div',
      '.company-name, .employer-name',
      '[class*="company-name"]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el.textContent.trim();
    }
    return '';
  }

  async function injectButtons(url = window.location.href) {
    const cfg = getBoardConfig(url);
    if (!cfg) return false;

    // Check if already injected
    if (document.querySelector('.sr-board-track-btn')) return true;

    try {
      const result = document.evaluate(cfg.container, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      if (!result.singleNodeValue) return false;
      
      const container = result.singleNodeValue;
      const btn = createTrackButton(cfg.board, url);
      
      if (cfg.insertMethod === 'after') {
        container.insertAdjacentElement('afterend', btn);
      } else {
        container.appendChild(btn);
      }
      
      console.log('[Boards] Button injected for', cfg.board);
      return true;
    } catch(e) {
      console.error('[Boards] Injection error:', e);
      return false;
    }
  }

  // Watch for DOM changes (LinkedIn loads dynamically)
  function startWatching() {
    const url = window.location.href;
    const cfg = getBoardConfig(url);
    if (!cfg) return null;

    let attempts = 0;
    const maxAttempts = 20;
    
    const tryInject = () => {
      if (attempts >= maxAttempts) return;
      attempts++;
      injectButtons(url).then(success => {
        if (success) {
          if (interval) clearInterval(interval);
        }
      });
    };

    tryInject();
    const interval = setInterval(tryInject, 2000);
    return interval;
  }

  return { getBoardConfig, injectButtons, startWatching, BOARD_CONFIGS };
})();
