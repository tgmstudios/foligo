/**
 * Banners — Resume score banners injected onto job description pages.
 * Shows score + keyword matches on 52 ATS platform job boards.
 */
const Banners = (() => {
  let bannerEl = null;

  // ─── Banner HTML ──────────────────────────────────────────────────

  function createBannerHTML(scoreResult, platform) {
    const score = scoreResult.score || 0;
    const color = score >= 70 ? '#00A86B' : score >= 40 ? '#FF9500' : '#DF1B41';
    const label = score >= 70 ? 'Strong Match' : score >= 40 ? 'Partial Match' : 'Needs Work';

    return `
      <div class="sr-banner" style="
        background: white; border: 1px solid #E0E6ED; border-radius: 12px;
        padding: 16px; margin: 16px 0;
        box-shadow: 0 2px 12px rgba(10,37,64,0.06);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;">📊</span>
            <strong style="color:#0A2540;font-size:14px;">Resume Match Score</strong>
          </div>
          <span style="
            display:inline-flex;align-items:center;gap:4px;
            padding:4px 12px;border-radius:20px;
            background:${color}15;color:${color};font-weight:700;font-size:14px;
          ">
            ${score}% · ${label}
          </span>
        </div>

        <!-- Progress bar -->
        <div style="
          width:100%;height:8px;background:#F6F9FC;border-radius:4px;overflow:hidden;margin-bottom:12px;
        ">
          <div style="
            width:${score}%;height:100%;background:${color};border-radius:4px;
            transition:width 0.5s;
          "></div>
        </div>

        <!-- Keyword summary -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
          <span class="sr-banner-stat" style="
            padding:6px 10px;background:#F6F9FC;border-radius:6px;font-size:12px;
          ">
            💻 ${scoreResult.summary?.hardSkills || 0} hard skills
          </span>
          <span class="sr-banner-stat" style="
            padding:6px 10px;background:#F6F9FC;border-radius:6px;font-size:12px;
          ">
            🔧 ${scoreResult.summary?.tools || 0} tools
          </span>
          <span class="sr-banner-stat" style="
            padding:6px 10px;background:#F6F9FC;border-radius:6px;font-size:12px;
          ">
            🗣 ${scoreResult.summary?.languages || 0} languages
          </span>
          <span class="sr-banner-stat" style="
            padding:6px 10px;background:#F6F9FC;border-radius:6px;font-size:12px;
          ">
            🤝 ${scoreResult.summary?.softSkills || 0} soft skills
          </span>
        </div>

        ${scoreResult.missingKeywords?.length ? `
          <div style="margin-top:8px;padding:8px;background:#FFF8E7;border-radius:6px;font-size:12px;">
            <strong>🔑 Missing keywords:</strong> ${scoreResult.missingKeywords.join(', ')}
          </div>
        ` : ''}

        <div style="margin-top:8px;font-size:11px;color:#6B7C93;">
          ${scoreResult.totalKeywordsFound || 0} keywords found in job · 
          ${scoreResult.keywordsInResume || 0} matched in your resume
        </div>
      </div>
    `;
  }

  // ─── Find container for banner ────────────────────────────────────

  function findBannerContainer(platformConfig) {
    // Check platform-specific banner config from remoteConfig
    // (Requires loading full ResumeScores config — simplified here with common patterns)
    const commonContainers = [
      '[class*="job-description"]',
      '[class*="jobdescription"]', 
      '[id*="job-description"]',
      '.job-details', '.job-body', '.posting-body',
      '#job-detail-body', '[data-automation-id*="description"]',
      'main', 'article',
    ];

    for (const sel of commonContainers) {
      const el = document.querySelector(sel);
      if (el && el.textContent.length > 200) return el;
    }
    return null;
  }

  // ─── Inject banner ────────────────────────────────────────────────

  async function injectBanner(platform) {
    if (bannerEl) return; // Already injected
    if (document.querySelector('.sr-banner')) return;
    if (typeof ResumeScorer === 'undefined') return false;

    const container = findBannerContainer(platform?.config);
    if (!container) return false;

    let jobDesc = '';
    try {
      const scorer = ResumeScorer;
      jobDesc = scorer.extractJobDescription();
      if (!jobDesc || jobDesc.length < 100) return false;

      const stored = await chrome.storage.local.get('resumeText');
      const resumeText = stored.resumeText || '';
      
      const scoreResult = await scorer.scoreResume(resumeText, jobDesc);
      if (scoreResult.error) return false;

      const html = createBannerHTML(scoreResult, platform?.platform);
      const div = document.createElement('div');
      div.innerHTML = html;
      bannerEl = div.firstElementChild;
      
      // Insert at top of job description
      container.insertBefore(bannerEl, container.firstChild);
      
      console.log('[Banners] Score banner injected:', scoreResult.score + '%');
      return true;
    } catch(e) {
      console.error('[Banners] Error:', e);
      return false;
    }
  }

  function removeBanner() {
    if (bannerEl) { bannerEl.remove(); bannerEl = null; }
    document.querySelectorAll('.sr-banner').forEach(el => el.remove());
  }

  return { injectBanner, removeBanner };
})();
