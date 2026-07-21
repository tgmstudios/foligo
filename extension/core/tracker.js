/**
 * Tracker — Job application tracking, submit button detection,
 * success confirmation, and job info extraction.
 */
const Tracker = (() => {
  const JOB_STATUSES = ['saved', 'applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn', 'archived'];
  // Text-only signal that a control performs the final submit/apply action —
  // deliberately not keyed off input type, since a multi-step wizard's
  // "Next"/"Continue" button is very often also type="submit".
  //
  // This is the single gate that stops the AI agent (via click_element) from
  // ever clicking the real submit button, so it has to handle two failure
  // modes: a mid-wizard "Submit references"/"Submit background check" step
  // starting with the same word as the real action, and a real submit button
  // phrased as "Yes, Submit Application" where the anchor-at-start match on
  // the raw text would miss it entirely.
  const FINAL_SUBMIT_TEXT_RE = /^\s*(?:submit\b|apply\b|send(?:\s+(?:your\s+)?application)?\b|finish\s+application\b|complete\s+application\b)/i;
  const LEADING_AFFIRMATION_RE = /^\s*(?:yes|ok(?:ay)?|sure|confirm(?:ed)?)\s*[,:!.\-–]*\s+/i;
  const NON_FINAL_SUBMIT_ALLOWLIST_RE = /^\s*submit\s+(?:references?|background(?:\s*check)?|consent|for\s+review|documents?|verification|questionnaire|survey|feedback|request)\b/i;
  const MAX_FINAL_SUBMIT_WORDS = 5;

  // A control counts as the final submit/apply action only if, after
  // stripping a leading affirmation, the remaining text (a) isn't one of the
  // known mid-wizard "submit X" steps and (b) is short — a long, specific
  // label is describing something other than "send the whole application".
  function isFinalSubmitText(rawText) {
    const text = String(rawText || '').replace(LEADING_AFFIRMATION_RE, '').trim();
    if (!text) return false;
    if (NON_FINAL_SUBMIT_ALLOWLIST_RE.test(text)) return false;
    if (!FINAL_SUBMIT_TEXT_RE.test(text)) return false;
    return text.split(/\s+/).length <= MAX_FINAL_SUBMIT_WORDS;
  }

  // ─── Job info extraction ──────────────────────────────────────────

  function cleanJobText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  const MAX_DESCRIPTION_CHARS = 8000;

  // Turn HTML (JSON-LD JobPosting.description is often an HTML fragment) into
  // readable plain text: drop tags, decode the handful of common entities, and
  // collapse whitespace. Kept intentionally small — no DOM parsing of untrusted
  // markup, just a text extraction for storage/AI context.
  function htmlToPlainText(value) {
    return String(value || '')
      .replace(/<\s*(?:br|\/p|\/div|\/li|\/h[1-6])\s*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&(?:quot|#34);/gi, '"')
      .replace(/&(?:#39|apos|rsquo|lsquo);/gi, "'")
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]*\n[ \t]*/g, '\n')
      .trim();
  }

  // Best-effort full role description. Prefer the structured JobPosting.description
  // (most accurate, board-agnostic); otherwise fall back to the largest visible
  // description/job-content block on the page. Capped so a huge page can't bloat
  // the tracked record or the AI context window.
  function extractJobDescription(posting) {
    let text = '';
    if (posting && typeof posting.description === 'string') {
      text = htmlToPlainText(posting.description);
    }
    if (text.length < 200) {
      const selectors = [
        '[class*="job-description" i]', '[class*="jobDescription" i]',
        '[data-testid*="description" i]', '[class*="description" i]',
        '[id*="job-description" i]', 'article', 'main',
      ];
      for (const selector of selectors) {
        let best = '';
        for (const node of document.querySelectorAll(selector)) {
          const candidate = cleanJobText(node.innerText || node.textContent);
          if (candidate.length > best.length) best = candidate;
        }
        if (best.length > text.length) text = best;
        if (text.length >= 400) break;
      }
    }
    return text.slice(0, MAX_DESCRIPTION_CHARS);
  }

  const GENERIC_BOARD_COMPANIES = new Set([
    'greenhouse', 'linkedin', 'indeed', 'workday', 'icims', 'lever',
    'ashby', 'smartrecruiters', 'brassring', 'job board', 'careers',
  ]);
  const GENERIC_JOB_TITLES = new Set([
    'apply', 'application', 'job application', 'jobs', 'careers',
    'job details', 'job posting', 'open positions',
  ]);
  const GENERIC_ATS_PATH_PARTS = new Set([
    '', 'apply', 'application', 'applications', 'job', 'jobs', 'career',
    'careers', 'position', 'positions', 'opening', 'openings', 'search',
    'jobsearch', 'details', 'home',
  ]);

  function normalizeIdentityText(value) {
    return cleanJobText(value)
      .toLowerCase()
      .replace(/\b(?:incorporated|corporation|company|limited|llc|inc|corp|ltd)\b\.?/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isUsableCompany(value) {
    const normalized = normalizeIdentityText(value);
    return Boolean(normalized && !GENERIC_BOARD_COMPANIES.has(normalized));
  }

  function isUsablePosition(value) {
    const normalized = normalizeIdentityText(value);
    return Boolean(normalized && !GENERIC_JOB_TITLES.has(normalized));
  }

  function meaningfulExternalId(value) {
    const normalized = cleanJobText(value).toLowerCase();
    return Boolean(
      normalized
      && !GENERIC_ATS_PATH_PARTS.has(normalized)
      && normalized.length >= 3
      && /[0-9]/.test(normalized),
    );
  }

  function resolvePageUrl(value, baseUrl) {
    try {
      const resolved = new URL(value, baseUrl);
      const base = new URL(baseUrl);
      if (base.protocol === 'https:' && resolved.protocol === 'http:' && resolved.hostname === base.hostname) {
        resolved.protocol = 'https:';
      }
      return resolved.toString();
    }
    catch (error) { return ''; }
  }

  function collectJobPostings(value, results, seen = new Set()) {
    if (!value || typeof value !== 'object' || seen.has(value) || results.length >= 10) return;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) collectJobPostings(item, results, seen);
      return;
    }
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    if (types.some((type) => cleanJobText(type).toLowerCase() === 'jobposting')) results.push(value);
    for (const child of Object.values(value)) collectJobPostings(child, results, seen);
  }

  function readMetaContent(selector) {
    return cleanJobText(document.querySelector(selector)?.getAttribute('content'));
  }

  function readVisibleText(selector) {
    return cleanJobText(document.querySelector(selector)?.textContent);
  }

  function readAttribute(selector, attribute) {
    return cleanJobText(document.querySelector(selector)?.getAttribute(attribute));
  }

  function isTrackableJobInfo(info) {
    return Boolean(
      info?.isLikelyJobPage
      && isUsableCompany(info.company)
      && isUsablePosition(info.jobTitle || info.position),
    );
  }

  function extractJobInfo() {
    const url = window.location.href;
    const info = {
      url,
      title: cleanJobText(document.title),
      company: '',
      jobTitle: '',
      location: '',
      platform: '',
      isLikelyJobPage: false,
      evidence: [],
    };

    // Job boards frequently put the useful JobPosting inside an array or an
    // @graph, and not necessarily in the first JSON-LD script.
    const jobPostings = [];
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        collectJobPostings(JSON.parse(script.textContent || ''), jobPostings);
      } catch (error) {}
    }
    const posting = jobPostings[0];
    if (posting) {
      info.jobTitle = cleanJobText(posting.title || posting.name);
      info.company = cleanJobText(
        typeof posting.hiringOrganization === 'string'
          ? posting.hiringOrganization
          : posting.hiringOrganization?.name,
      );
      const rawLocation = Array.isArray(posting.jobLocation) ? posting.jobLocation[0] : posting.jobLocation;
      const address = rawLocation?.address || posting.applicantLocationRequirements?.[0]?.name;
      if (typeof address === 'string') info.location = cleanJobText(address);
      else if (address) {
        info.location = cleanJobText([
          address.addressLocality,
          address.addressRegion,
          address.addressCountry,
        ].filter(Boolean).join(', '));
      }
      info.isLikelyJobPage = true;
      info.evidence.push('structured JobPosting data');
    }

    // Platform-specific extraction
    if (url.includes('lever.co')) {
      info.platform = 'Lever';
      info.company ||= readMetaContent('meta[property="og:site_name"]');
      info.jobTitle ||= readVisibleText('.posting-headline h2, h2');
      info.location ||= readVisibleText('.location');
    } else if (url.includes('greenhouse.io')) {
      info.platform = 'Greenhouse';
      info.jobTitle ||= readVisibleText('h1.app-title, h1');
      info.company ||= readVisibleText('.company-name, .employer-name');
      info.company ||= readAttribute('a.logo img[alt], .image-container img[alt]', 'alt').replace(/\s+logo$/i, '');
      info.location ||= readVisibleText('.location');
    } else if (url.includes('myworkdayjobs.com') || url.includes('workday.com')) {
      info.platform = 'Workday';
      const metaTitle = readMetaContent('meta[property="og:title"]');
      if (metaTitle) {
        const parts = metaTitle.split('|').map(cleanJobText);
        info.jobTitle ||= parts[0] || '';
        info.company ||= parts[1] || '';
      }
    } else if (url.includes('icims.com')) {
      info.platform = 'iCIMS';
      info.jobTitle ||= readVisibleText('h1');
    } else if (url.includes('linkedin.com/jobs')) {
      info.platform = 'LinkedIn';
      info.jobTitle ||= readVisibleText(
        '.job-details-jobs-unified-top-card__job-title h1, .jobs-unified-top-card__job-title, h1',
      );
      info.company ||= readVisibleText(
        '.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, [class*="company-name" i]',
      );
    } else if (url.includes('indeed.com') && /(?:viewjob|jobs?|pagead)/i.test(url)) {
      info.platform = 'Indeed';
      info.jobTitle ||= readVisibleText('[data-testid="jobsearch-JobInfoHeader-title"], h1');
      info.company ||= readVisibleText('[data-testid="inlineHeader-companyName"], [data-company-name="true"]');
    } else if (url.includes('brassring.com')) {
      info.platform = 'BrassRing';
      info.jobTitle ||= readVisibleText('[class*="job-title" i], [id*="jobtitle" i], h1, h2');
      info.company ||= readVisibleText('[class*="company" i], [id*="company" i]');
    } else if (url.includes('ashbyhq.com') || url.includes('smartrecruiters.com')) {
      info.platform = url.includes('ashbyhq.com') ? 'Ashby' : 'SmartRecruiters';
      info.jobTitle ||= readVisibleText('main h1, h1');
      info.company ||= readVisibleText('[class*="company" i], [data-testid*="company" i]');
    }
    if (info.platform) {
      info.isLikelyJobPage = true;
      info.evidence.push(`${info.platform} job URL`);
    }

    const urlLooksJobRelated = /(?:jobs?|careers?|positions?|openings?|vacanc(?:y|ies)|apply|jobsearch|viewjob|jobdetails?|joblisting|pagead)/i.test(url);
    const hasApplicationControl = Boolean(document.querySelector(
      'form[action*="apply" i], input[type="file"][name*="resume" i], input[type="file"][id*="resume" i], [data-automation-id="applyFlow"]',
    ));
    const pageText = cleanJobText(document.body?.innerText).slice(0, 20000);
    const hasJobLanguage = /\b(?:job description|job details|job summary|about the job|easy apply|responsibilities|qualifications|employment type|apply for (?:this|the) (?:job|position)|employment opportunity|submit (?:your )?application)\b/i.test(pageText);
    if (!info.isLikelyJobPage && ((urlLooksJobRelated && (hasApplicationControl || hasJobLanguage)) || (hasApplicationControl && hasJobLanguage))) {
      info.isLikelyJobPage = true;
      info.evidence.push('job URL/application page signals');
    }

    // Generic metadata is useful only after the page has shown job signals;
    // otherwise ordinary news/docs pages become bogus board cards.
    if (!info.jobTitle) {
      info.jobTitle = readMetaContent('meta[property="og:title"], meta[name="twitter:title"]');
      if (!info.jobTitle && info.isLikelyJobPage) info.jobTitle = readVisibleText('main h1, h1');
    }
    if (!info.company) {
      info.company = readVisibleText(
        '[data-automation-id*="company" i], [data-testid*="company" i], [data-company-name="true"], .company-name, .employer-name, [class*="company-name" i]',
      );
      info.company ||= readMetaContent('meta[property="og:site_name"]');
    }
    if (!info.location) {
      info.location = readVisibleText('[class*="location" i], [data-automation-id*="location" i]');
    }

    // Common social/job-board page titles still carry enough signal even
    // when the visible header is rendered in an inaccessible nested frame.
    const rawTitles = [...new Set([
      info.title,
      readMetaContent('meta[property="og:title"]'),
    ].filter(Boolean))];
    if (info.isLikelyJobPage) {
      for (const rawTitle of rawTitles) {
        const greenhouse = /^Job Application for\s+(.+?)\s+at\s+(.+?)(?:\s+\|\s+.+)?$/i.exec(rawTitle);
        const linkedin = /^(.+?)\s+hiring\s+(.+?)(?:\s+in\s+.+?)?\s*(?:\|\s*LinkedIn)?$/i.exec(rawTitle);
        const atCompany = /^(.+?)\s+(?:at|@)\s+(.+?)(?:\s*[|–—]\s*.+)?$/i.exec(rawTitle);
        const titleDashCompany = /^(.+?)\s+[-–—]\s+(.+?)(?:\s+\|\s+.+)?$/i.exec(rawTitle);
        if (greenhouse) {
          info.jobTitle ||= cleanJobText(greenhouse[1]);
          info.company ||= cleanJobText(greenhouse[2]);
        } else if (linkedin) {
          info.company ||= cleanJobText(linkedin[1]);
          info.jobTitle ||= cleanJobText(linkedin[2]);
        } else if (atCompany) {
          info.jobTitle ||= cleanJobText(atCompany[1]);
          info.company ||= cleanJobText(atCompany[2]);
        } else if (info.platform && titleDashCompany) {
          info.jobTitle ||= cleanJobText(titleDashCompany[1]);
          info.company ||= cleanJobText(titleDashCompany[2]);
        }
        if (isUsableCompany(info.company) && isUsablePosition(info.jobTitle)) break;
      }
    }

    // A board vendor name is hosting metadata, not the employer. Discard it
    // so the AI fallback can resolve the real company instead of permanently
    // labeling the card "Greenhouse", "Indeed", etc.
    if (!isUsableCompany(info.company)) info.company = '';
    if (!isUsablePosition(info.jobTitle)) info.jobTitle = '';
    const postingIdentifier = typeof posting?.identifier === 'string'
      ? posting.identifier
      : posting?.identifier?.value || posting?.identifier?.name;
    const declaredUrl = resolvePageUrl(
      posting?.url
      || readAttribute('link[rel="canonical"]', 'href')
      || readMetaContent('meta[property="og:url"]'),
      url,
    );
    const identity = deriveJobIdentity(declaredUrl || url, postingIdentifier);
    info.pageUrl = url;
    info.url = identity.canonicalUrl;
    info.canonicalUrl = identity.canonicalUrl;
    info.identityKey = identity.identityKey;
    info.identityStrength = identity.strength;
    info.externalJobId = identity.externalJobId;
    info.identityConfidence = posting
      ? 'high'
      : isTrackableJobInfo(info) && info.platform
        ? 'medium'
        : 'low';
    info.description = extractJobDescription(posting);

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
      const text = btn.textContent || btn.value || '';
      if (isFinalSubmitText(text) && btn.offsetParent !== null) {
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
      candidates.push({ element: el, label: text, likelyFinal: isFinalSubmitText(text) });
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
  // An empty value resolves to an empty identity, never to the current page.
  // Callers that legitimately mean "this page" pass window.location.href
  // explicitly. Defaulting here instead would make every tracked job that has
  // no stored URL adopt whatever page is open, so the matcher would treat it as
  // the job being viewed and silently overwrite it.
  function normalizeJobUrl(value) {
    if (!value) return '';
    try {
      const url = new URL(value);
      url.hash = '';
      for (const key of [...url.searchParams.keys()]) {
        if (/^(?:utm_.+|source|src|ref|referrer|tracking|trk|gh_src|lever-source|iis|iisn)$/i.test(key)) {
          url.searchParams.delete(key);
        }
      }
      url.hostname = url.hostname.toLowerCase();
      url.pathname = url.pathname.replace(/\/+$/, '') || '/';
      url.searchParams.sort();
      return url.toString().replace(/\/$/, '');
    } catch (error) {
      return String(value).replace(/#.*$/, '').replace(/\/$/, '');
    }
  }

  function deriveJobIdentity(value, explicitExternalJobId = '') {
    const canonicalUrl = normalizeJobUrl(value);
    try {
      const url = new URL(canonicalUrl);
      const host = url.hostname.toLowerCase();
      const parts = url.pathname.split('/').filter(Boolean);
      let platform = '';
      let scope = host;
      let externalJobId = meaningfulExternalId(explicitExternalJobId) ? cleanJobText(explicitExternalJobId) : '';
      if (host.includes('greenhouse.io')) {
        platform = 'greenhouse';
        const match = url.pathname.match(/\/jobs\/(\d+)/i);
        externalJobId ||= match?.[1] || url.searchParams.get('job_id') || '';
        scope = parts[0] || host;
      } else if (host.includes('linkedin.com')) {
        platform = 'linkedin';
        externalJobId ||= url.pathname.match(/\/jobs\/view\/(\d+)/i)?.[1] || '';
      } else if (host.includes('indeed.com')) {
        platform = 'indeed';
        externalJobId ||= url.searchParams.get('jk') || url.searchParams.get('vjk') || '';
      } else if (host.includes('lever.co')) {
        platform = 'lever';
        scope = parts[0] || host;
        const candidate = parts.at(-1) || '';
        if (meaningfulExternalId(candidate)) externalJobId ||= candidate;
      } else if (host.includes('myworkdayjobs.com') || host.includes('workday.com')) {
        platform = 'workday';
        externalJobId ||= [...parts].reverse().find((part) => meaningfulExternalId(part)) || '';
      } else if (host.includes('ashbyhq.com')) {
        platform = 'ashby';
        scope = parts[0] || host;
        const candidate = parts.at(-1) || '';
        if (meaningfulExternalId(candidate)) externalJobId ||= candidate;
      } else if (host.includes('smartrecruiters.com')) {
        platform = 'smartrecruiters';
        scope = parts[0] || host;
        externalJobId ||= [...parts].reverse().find((part) => meaningfulExternalId(part)) || '';
      } else if (host.includes('icims.com') || host.includes('brassring.com')) {
        platform = host.includes('icims.com') ? 'icims' : 'brassring';
        externalJobId ||= url.searchParams.get('job') || url.searchParams.get('jobid')
          || url.searchParams.get('reqid')
          || [...parts].reverse().find((part) => meaningfulExternalId(part)) || '';
      }
      if (!meaningfulExternalId(externalJobId)) externalJobId = '';
      const lastPathPart = cleanJobText(parts.at(-1)).toLowerCase();
      const weakSharedUrl = GENERIC_ATS_PATH_PARTS.has(lastPathPart)
        || (parts.length === 0 && !url.search);
      const strength = platform && externalJobId ? 'strong' : weakSharedUrl ? 'weak' : 'exact';
      const identityKey = strength === 'strong'
        ? `${platform}:${normalizeIdentityText(scope)}:${normalizeIdentityText(externalJobId)}`
        : `url:${canonicalUrl}`;
      return { canonicalUrl, identityKey, externalJobId, platform, strength };
    } catch (error) {
      return { canonicalUrl, identityKey: `url:${canonicalUrl}`, externalJobId: '', platform: '', strength: 'weak' };
    }
  }

  function identityMatchScore(candidate, jobInfo, targetIdentity) {
    const candidateIdentity = deriveJobIdentity(candidate.url);
    let score = candidateIdentity.identityKey === targetIdentity.identityKey ? 100 : 0;
    if (candidateIdentity.canonicalUrl === targetIdentity.canonicalUrl) score += 60;
    const company = normalizeIdentityText(jobInfo.company);
    const position = normalizeIdentityText(jobInfo.jobTitle || jobInfo.position);
    if (company && normalizeIdentityText(candidate.company) === company) score += 30;
    if (position && normalizeIdentityText(candidate.position) === position) score += 30;
    return score;
  }

  function findBestTrackedApplication(jobs, jobInfo = {}) {
    const targetIdentity = deriveJobIdentity(jobInfo.canonicalUrl || jobInfo.url || window.location.href);
    const targetCompany = normalizeIdentityText(jobInfo.company);
    const targetPosition = normalizeIdentityText(jobInfo.jobTitle || jobInfo.position);
    return (jobs || [])
      .map((candidate) => ({
        candidate,
        identity: deriveJobIdentity(candidate.url),
        score: identityMatchScore(candidate, jobInfo, targetIdentity),
      }))
      .filter(({ candidate, identity }) => {
        // A card with no stored URL has no page identity at all — it must never
        // be claimed by whatever page happens to be open.
        if (!identity.canonicalUrl) return false;
        const canonicalMatches = identity.canonicalUrl === targetIdentity.canonicalUrl;
        const strongIdentityMatches = targetIdentity.strength === 'strong'
          && identity.strength === 'strong'
          && identity.identityKey === targetIdentity.identityKey;
        if (strongIdentityMatches) return true;
        if (!canonicalMatches) return false;
        if (targetIdentity.strength !== 'weak') return true;
        // Shared /apply or /jobs URLs are not role identities. They may only
        // match when both employer and position agree exactly.
        return Boolean(
          targetCompany
          && targetPosition
          && normalizeIdentityText(candidate.company) === targetCompany
          && normalizeIdentityText(candidate.position) === targetPosition
        );
      })
      .sort((a, b) => b.score - a.score)[0]?.candidate || null;
  }

  async function getTrackedApplication(jobInfo = {}, options = {}) {
    if (typeof GoApplyAPI === 'undefined') throw new Error('Foligo API is unavailable');
    const jobs = await GoApplyAPI.getJobs();
    let job = findBestTrackedApplication(jobs, jobInfo);
    if (job && options.reconcile === true && isTrackableJobInfo(jobInfo)) {
      const companyChanged = normalizeIdentityText(job.company) !== normalizeIdentityText(jobInfo.company);
      const positionChanged = normalizeIdentityText(job.position) !== normalizeIdentityText(jobInfo.jobTitle || jobInfo.position);
      const canonicalUrl = normalizeJobUrl(jobInfo.canonicalUrl || jobInfo.url);
      // Persist the canonical form even when normalization proves the raw URL
      // points to the same job; this removes stale campaign/query parameters
      // so later application steps resolve the same card consistently.
      const urlChanged = Boolean(canonicalUrl) && cleanJobText(job.url) !== canonicalUrl;
      if (companyChanged || positionChanged || urlChanged) {
        job = await GoApplyAPI.updateJob(job.id, {
          ...(companyChanged ? { company: cleanJobText(jobInfo.company) } : {}),
          ...(positionChanged ? { position: cleanJobText(jobInfo.jobTitle || jobInfo.position) } : {}),
          ...(urlChanged ? { url: canonicalUrl } : {}),
        });
        job = { ...job, identityReconciled: true };
      }
    }
    return job;
  }

  async function trackApplication(jobInfo, status = 'saved', options = {}) {
    if (typeof GoApplyAPI === 'undefined') throw new Error('Foligo API is unavailable');
    const normalizedStatus = String(status || 'saved').toLowerCase();
    if (!JOB_STATUSES.includes(normalizedStatus)) throw new Error(`Unsupported job status: ${status}`);
    const url = normalizeJobUrl(jobInfo.canonicalUrl || jobInfo.url || window.location.href);
    // forceNew skips matching entirely, so the same posting can be tracked as a
    // separate card (e.g. re-applying in a different hiring season).
    let job = null;
    if (options.forceNew !== true) {
      const jobs = await GoApplyAPI.getJobs();
      job = findBestTrackedApplication(jobs, { ...jobInfo, url });
    }
    let created = false;
    let changed = false;

    if (job) {
      // Submission promotes an existing saved card. Clicking Track again must
      // never demote an application already further along the pipeline.
      const shouldPromoteSubmission = normalizedStatus === 'applied' && job.status === 'saved';
      const shouldApplyExplicitStatus = options.allowStatusChange === true && normalizedStatus !== job.status;
      const metadata = {};
      if (options.category !== undefined) metadata.category = options.category;
      if (options.tags !== undefined) metadata.tags = options.tags;
      if (options.notes !== undefined) metadata.notes = options.notes;
      // Only overwrite the stored description when this track pass actually
      // captured one, so re-tracking from a metadata-poor application step can't
      // wipe a good description scraped from the original listing.
      if (options.description) metadata.description = options.description;
      if (options.company) metadata.company = options.company;
      if (options.position) metadata.position = options.position;
      if (shouldPromoteSubmission || shouldApplyExplicitStatus || Object.keys(metadata).length) {
        job = await GoApplyAPI.updateJob(job.id, {
          ...metadata,
          ...(shouldPromoteSubmission || shouldApplyExplicitStatus ? { status: normalizedStatus } : {}),
          ...(normalizedStatus === 'applied' && !job.appliedAt ? { appliedAt: new Date().toISOString() } : {}),
        });
        changed = true;
      }
    } else {
      job = await GoApplyAPI.trackJob({
        company: options.company || jobInfo.company || 'Unknown company',
        position: options.position || jobInfo.jobTitle || jobInfo.position || jobInfo.title || 'Unknown role',
        url,
        status: normalizedStatus,
        category: options.category,
        tags: options.tags,
        notes: options.notes,
        description: options.description || jobInfo.description || undefined,
        ...(normalizedStatus === 'applied' ? { appliedAt: new Date().toISOString() } : {}),
        source: 'extension',
      });
      created = true;
    }

    await saveApplication({ ...jobInfo, url });
    return { job, created, changed };
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
    isTrackableJobInfo,
    deriveJobIdentity,
    findBestTrackedApplication,
    findSubmitButton,
    findNavigationCandidates,
    FINAL_SUBMIT_TEXT_RE,
    isFinalSubmitText,
    highlightSubmitButton,
    detectSuccess,
    watchForSuccess,
    saveApplication,
    trackApplication, getTrackedApplication, JOB_STATUSES,
    getApplications,
    getApplicationCount,
  };
})();
