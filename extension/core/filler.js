/**
 * Filler — Multi-method field filling.
 * Supports: default, react, dijit, click, select, checkbox, 
 *           uploadResume, uploadCoverLetter, writeCoverLetter
 */
const Filler = (() => {
  // ─── React internals detection ────────────────────────────────────

  function getReactInternals(element) {
    const key = Object.keys(element).find(k => 
      k.startsWith('__reactFiber$') || 
      k.startsWith('__reactInternalInstance$')
    );
    return key ? element[key] : null;
  }

  function getReactProps(element) {
    const fiber = getReactInternals(element);
    if (fiber) {
      let node = fiber;
      while (node) {
        const props = node.memoizedProps || node.pendingProps;
        if (props && (props.onChange || props.value !== undefined || props.onInput)) {
          return props;
        }
        node = node.return;
      }
    }
    return null;
  }

  // ─── Native setter (bypasses React) ──────────────────────────────

  function setNativeValue(element, value) {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      element.constructor.prototype, 'value'
    );
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(element, value);
    } else {
      element.value = value;
    }
  }

  // ─── Fill methods ────────────────────────────────────────────────

  function fillDefault(element, value) {
    element.focus();
    setNativeValue(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    const tracker = element._valueTracker;
    if (tracker) tracker.setValue(element.value || '');
    if (element.contentEditable === 'true') {
      element.textContent = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function fillReact(element, value) {
    const props = getReactProps(element);
    fillDefault(element, value);
    if (props && props.onChange) {
      props.onChange({ 
        target: element, currentTarget: element, type: 'change',
        nativeEvent: new Event('change', { bubbles: true })
      });
    }
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    const reactSelect = element.closest('[class*="select"]');
    if (reactSelect) {
      reactSelect.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    }
  }

  function fillDijit(element, value) {
    fillDefault(element, value);
    const widget = element.closest('[widgetid], [data-dojo-attach-point]');
    if (widget) {
      const dijitKey = Object.keys(widget).find(k => k.startsWith('dijit_'));
      if (dijitKey && widget[dijitKey] && widget[dijitKey].set) {
        widget[dijitKey].set('value', value);
      }
    }
    element.dispatchEvent(new Event('keyup', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function fillSelect(element, value) {
    element.focus();
    element.click();
    setTimeout(() => {
      const selectContainer = element.closest('[class*="select"]') || document;
      const options = selectContainer.querySelectorAll(
        '[role="option"], [role="listbox"] [role="option"], li[class*="option"]'
      );
      for (const opt of options) {
        if (opt.textContent.toLowerCase().includes(value.toLowerCase())) {
          opt.click();
          return;
        }
      }
      setNativeValue(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }, 100);
  }

  function fillClick(element, _value) {
    element.focus();
    element.click();
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  }

  function fillCheckbox(element, value) {
    const shouldCheck = value === true || value === 'true' || value === 'yes' || value === 'on';
    if (element.checked !== shouldCheck) {
      element.click();
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  // ─── Resume upload ────────────────────────────────────────────────

  function fillUploadResume(element, _value) {
    // For file inputs: focus and scroll into view, but actual file selection
    // requires user gesture. We highlight it for the user.
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.focus();
    // Create a pulsing outline to draw attention
    const origOutline = element.style.outline;
    element.style.outline = '3px solid #635BFF';
    element.style.outlineOffset = '4px';
    element.style.animation = 'srPulse 1.5s ease-in-out infinite';
    if (!document.getElementById('sr-pulse-keyframes')) {
      const style = document.createElement('style');
      style.id = 'sr-pulse-keyframes';
      style.textContent = '@keyframes srPulse { 0%,100% { outline-color: #635BFF; } 50% { outline-color: #00A86B; } }';
      document.head.appendChild(style);
    }
    setTimeout(() => {
      element.style.outline = origOutline;
      element.style.animation = '';
    }, 5000);
    return { success: true, note: 'highlighted for manual upload' };
  }

  // ─── Cover letter (contentEditable / textarea) ────────────────────

  function fillWriteCoverLetter(element, value) {
    if (!value) value = 'I am excited to apply for this position. ' +
      'My experience and skills make me a strong candidate for this role. ' +
      'I look forward to discussing how I can contribute to your team.';
    
    element.focus();
    if (element.contentEditable === 'true') {
      element.textContent = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      setNativeValue(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    return { success: true };
  }

  // ─── Value resolution ────────────────────────────────────────────
  //
  // fieldName is whatever Detector/Finder came up with — either one of the
  // canonical taxonomy keys from config/remoteConfig.json's inputSelectors
  // (e.g. "birthday_MM", "work_auth_us", "linkedin_2") or a generic
  // label-derived name from Finder.categorizeByLabel (e.g. "current_title").
  // Both need to resolve against the flat profile object the server returns
  // from GET /api/goapply/profile.

  const DEFAULT_VALUES = {
    first_name: '', last_name: '', full_name: '',
    email: '', phone: '', phone_stripped: '', phone_country: '',
    country: '', city: '', state: '', location: '', zip: '',
    city_state_full: '', country_location: '',
    linkedin: '', github: '', website: '', portfolio: '',
    highestDegree: '', school: '', gpa: '', education: '',
    current_company: '', current_title: '', years_experience: '',
    skills: '', salary: '', start_date: '', referral: '',
    work_authorization: '', need_sponsorship: '',
    race: 'Prefer not to say', gender: 'Prefer not to say',
    veteran: 'I am not a protected veteran', disability: 'Prefer not to say',
    resume: '', cover_letter: '',
    // Personal Information
    middle_name: '', preferred_name: '', username: '', pronouns: 'Prefer not to say',
    phone_type: 'Mobile',
    // Location
    address: '', address_2: '', postal_code: '',
    // Education
    discipline: '', language: '',
    // Experience
    currently_working: '',
    // EEO / voluntary disclosures
    ethnicity: 'Prefer not to say', hispanic: 'Prefer not to say',
    lgbt: 'Prefer not to say', over18: '', over21: '',
    has_drivers_license: '',
    // Work Authorization
    work_auth_us: '', sponsorship: '',
    // Social & Links
    twitter: '', behance: '', dribbble: '',
    // Other
    referred_by: '', source: '',
  };

  // Every alias list is checked in order against the profile object returned
  // by GET /api/goapply/profile; the first present (truthy or boolean) value
  // wins. Covers both the canonical ATS taxonomy names (config/remoteConfig.json)
  // and the generic label-derived names from Finder.categorizeByLabel.
  const ALIASES = {
    full_name: ['name', 'fullName'],
    legal_name: ['legalName', 'name'],
    first_name: ['firstName'],
    last_name: ['lastName'],
    middle_name: ['middleName'],
    preferred_name: ['preferredName'],
    preferred_first_name: ['preferredName', 'firstName'],
    preferred_last_name: ['lastName'],
    username: ['username', 'email'],
    email: ['email'],
    email_confirm: ['email'],
    phone: ['phone'],
    phone_stripped: ['phone'],
    phone_type: ['phoneType'],
    phone_country: ['phoneCountry'],
    pronouns: ['pronouns'],

    location: ['location'],
    country: ['country', 'location'],
    country_location: ['country', 'location'],
    in_country: ['country'],
    state: ['state'],
    city: ['city'],
    address: ['address', 'location'],
    address_2: ['address2'],
    address_type: ['address'],
    zip: ['postalCode'],
    postal_code: ['postalCode'],

    resume: ['resumeUrl'],
    cover_letter: ['coverLetter'],
    coverLetter: ['coverLetter'],

    education: ['educationSummary'],
    education_summary: ['educationSummary'],
    school: ['school'],
    degree: ['highestDegree'],
    highestDegree: ['highestDegree'],
    discipline: ['discipline'],
    gpa: ['gpa'],
    language: ['language'],
    language_preferred: ['language'],
    languages: ['language'],
    languages_text: ['language'],

    experience: ['experienceSummary'],
    experience_summary: ['experienceSummary'],
    current_company: ['currentCompany'],
    current_company_name: ['currentCompany'],
    current_title: ['currentTitle', 'title'],
    current_job_title: ['currentTitle'],
    title: ['currentTitle'],
    years_experience: ['yearsExperience'],
    currently_working: ['currentlyWorking'],
    current_employee: ['currentlyWorking'],

    gender: ['gender'],
    gender_checkable: ['gender'],
    race: ['ethnicity'],
    ethnicity: ['ethnicity'],
    multiple_ethnicities: ['ethnicity'],
    ethnicity_checkable: ['ethnicity'],
    visible_minority: ['ethnicity'],
    hispanic: ['hispanicLatino'],
    veteran: ['veteranStatus'],
    veteran_v2: ['veteranStatus'],
    armed_forces: ['veteranStatus'],
    disability: ['disabilityStatus'],
    disability_v2: ['disabilityStatus'],
    lgbt: ['lgbtStatus'],
    lgbt_v2: ['lgbtStatus'],
    transgender: ['lgbtStatus'],
    over18: ['over18'],
    over21: ['over21'],
    has_drivers_license: ['hasDriversLicense'],

    work_authorization: ['workAuthUS', 'workAuth'],
    work_auth: ['workAuthUS', 'workAuth'],
    work_auth_us: ['workAuthUS'],
    need_sponsorship: ['sponsorshipRequired'],
    sponsorship: ['sponsorshipRequired'],

    linkedin: ['linkedin'],
    github: ['github'],
    portfolio: ['portfolio'],
    website: ['website', 'portfolio'],
    websites: ['website', 'portfolio'],
    additional_url: ['website', 'portfolio'],
    twitter: ['twitter'],
    behance: ['behance'],
    dribbble: ['dribbble'],

    skill: ['skills'],
    skills: ['skills'],
    salary: ['desiredSalary'],
    salary_requirements: ['desiredSalary'],
    referral: ['referredBy'],
    referred_by: ['referredBy'],
    source: ['source'],
    source_description: ['source'],
    source_other: ['source'],
  };

  // Fields whose canonical name is itself a numbered duplicate on the same
  // form (e.g. a second LinkedIn or email box) — strip the suffix and
  // resolve as the base field so both boxes get the same value.
  const NUMBERED_SUFFIX_RE = /_(\d+)$/;

  // Fields composed from more than one profile value.
  const COMPOSERS = {
    city_state: p => [p.city, p.state].filter(Boolean).join(', '),
    city_state_full: p => [p.city, p.state].filter(Boolean).join(', ') || p.location || '',
  };

  // ─── Date-variant fields (birthday_MM, current_date_slashes_MMDDYYYY, …) ──
  // The config asks for dozens of date format variants; we store one
  // canonical value (profile.birthday) or compute today's date, then format
  // on demand instead of persisting every variant.

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const pad2 = n => String(n).padStart(2, '0');

  function formatDateVariant(d, variant) {
    if (!d || isNaN(d.getTime())) return '';
    const MM = pad2(d.getMonth() + 1), DD = pad2(d.getDate()), YYYY = String(d.getFullYear());
    switch (variant) {
      case '': return `${YYYY}-${MM}-${DD}`;
      case 'YYYY': return YYYY;
      case 'MM': return MM;
      case 'M': return String(d.getMonth() + 1);
      case 'DD': return DD;
      case 'D': return String(d.getDate());
      case 'month_text': return MONTH_NAMES[d.getMonth()];
      case 'slashes_MDYYYY': return `${d.getMonth() + 1}/${d.getDate()}/${YYYY}`;
      case 'slashes_MMDDYYYY': return `${MM}/${DD}/${YYYY}`;
      case 'slashes_MDDYY': return `${d.getMonth() + 1}/${DD}/${YYYY.slice(-2)}`;
      case 'dashes_DDMMYYYY': return `${DD}-${MM}-${YYYY}`;
      default: return `${YYYY}-${MM}-${DD}`;
    }
  }

  const DATE_FIELD_RE = new RegExp(
    '^(birthday|current_date)(?:_(YYYY|MM|M|DD|D|month_text|' +
    'slashes_MDYYYY|slashes_MMDDYYYY|slashes_MDDYY|dashes_DDMMYYYY))?$'
  );

  function resolveDateField(fieldName, profile) {
    const m = DATE_FIELD_RE.exec(fieldName);
    if (!m) return undefined;
    const [, base, variant = ''] = m;
    const d = base === 'current_date' ? new Date() : (profile.birthday ? new Date(profile.birthday) : null);
    if (!d) return '';
    return formatDateVariant(d, variant);
  }

  function boolToYesNo(v) {
    return v === true ? 'Yes' : v === false ? 'No' : '';
  }

  function resolveFromProfile(fieldName, profile) {
    if (profile[fieldName] !== undefined && profile[fieldName] !== null && profile[fieldName] !== '') {
      return typeof profile[fieldName] === 'boolean' ? boolToYesNo(profile[fieldName]) : profile[fieldName];
    }
    const dateValue = resolveDateField(fieldName, profile);
    if (dateValue !== undefined) return dateValue;
    if (COMPOSERS[fieldName]) {
      const composed = COMPOSERS[fieldName](profile);
      if (composed) return composed;
    }
    if (ALIASES[fieldName]) {
      for (const alias of ALIASES[fieldName]) {
        const v = profile[alias];
        if (v !== undefined && v !== null && v !== '') {
          return typeof v === 'boolean' ? boolToYesNo(v) : v;
        }
      }
    }
    return undefined;
  }

  let cachedProfile = null;
  let cachedProfileAt = 0;
  const PROFILE_TTL_MS = 10 * 60 * 1000;

  async function loadProfile() {
    if (cachedProfile && (Date.now() - cachedProfileAt) < PROFILE_TTL_MS) return cachedProfile;
    let stored = {};
    try {
      stored = await chrome.storage.local.get(['profile', 'profileFetchedAt']);
    } catch (e) { /* storage unavailable */ }

    const isStale = !stored.profileFetchedAt || (Date.now() - stored.profileFetchedAt) > PROFILE_TTL_MS;
    if (isStale && typeof GoApplyAPI !== 'undefined') {
      try {
        const remote = await GoApplyAPI.getGoApplyProfile();
        if (remote) {
          cachedProfile = remote;
          cachedProfileAt = Date.now();
          try { await chrome.storage.local.set({ profile: remote, profileFetchedAt: cachedProfileAt }); } catch (e) {}
          return cachedProfile;
        }
      } catch (e) {
        // Not authenticated / offline — fall back to whatever's cached locally.
      }
    }

    cachedProfile = stored.profile || {};
    cachedProfileAt = Date.now();
    return cachedProfile;
  }

  function invalidateCache() { cachedProfile = null; cachedProfileAt = 0; }

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.profile) invalidateCache();
    });
  }

  function resolveValueSync(fieldName, profile = {}) {
    const direct = resolveFromProfile(fieldName, profile);
    if (direct !== undefined) return direct;

    const numbered = NUMBERED_SUFFIX_RE.exec(fieldName);
    if (numbered) {
      const base = fieldName.slice(0, numbered.index);
      const baseValue = resolveFromProfile(base, profile);
      if (baseValue !== undefined) return baseValue;
      if (DEFAULT_VALUES[base] !== undefined) return DEFAULT_VALUES[base];
    }

    return DEFAULT_VALUES[fieldName] || '';
  }

  async function resolveValue(fieldName) {
    const profile = await loadProfile();
    return resolveValueSync(fieldName, profile);
  }

  // ─── Main fill function ──────────────────────────────────────────

  function fillField(fieldInfo, profile = {}) {
    const { element, method, fieldName } = fieldInfo;
    
    const value = Object.keys(profile).length > 0 
      ? resolveValueSync(fieldName, profile) 
      : resolveValueSync(fieldName, cachedProfile || {});
    
    if (!element) return { success: false, reason: 'no element' };
    if (!value && method !== 'uploadResume' && method !== 'click') {
      return { success: false, reason: 'no value configured' };
    }
    
    try {
      switch (method) {
        case 'react': fillReact(element, value); break;
        case 'dijit': fillDijit(element, value); break;
        case 'selectCheckboxOrRadio': fillCheckbox(element, value); break;
        case 'click': fillClick(element, value); break;
        case 'defaultWithoutBlur': 
          element.focus(); setNativeValue(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
          element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
          break;
        case 'uploadResume':
        case 'uploadCoverLetter':
          return fillUploadResume(element, value);
        case 'writeCoverLetter':
          return fillWriteCoverLetter(element, value);
        default: fillDefault(element, value);
      }
      return { success: true };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  }

  function fillAll(foundFields, profile = {}) {
    const results = [];
    for (const field of foundFields) {
      const result = fillField(field, profile);
      results.push({ ...field, ...result });
    }
    return results;
  }

  return {
    fillField, fillAll, fillDefault, fillReact, fillDijit,
    resolveValue, resolveValueSync, loadProfile, invalidateCache,
    fillUploadResume, fillWriteCoverLetter, DEFAULT_VALUES
  };
})();
