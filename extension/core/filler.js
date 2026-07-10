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
  };

  let cachedProfile = null;

  async function loadProfile() {
    if (cachedProfile) return cachedProfile;
    try {
      const stored = await chrome.storage.local.get('profile');
      cachedProfile = stored.profile || {};
      return cachedProfile;
    } catch (e) {
      cachedProfile = {};
      return cachedProfile;
    }
  }

  function invalidateCache() { cachedProfile = null; }

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.profile) invalidateCache();
    });
  }

  function resolveValueSync(fieldName, profile = {}) {
    if (profile[fieldName]) return profile[fieldName];
    const aliases = {
      full_name: ['full_name', 'name'],
      first_name: ['first_name', 'firstName'],
      last_name: ['last_name', 'lastName'],
      email: ['email', 'emailAddress'],
      phone: ['phone', 'phoneNumber', 'mobile'],
      city: ['city', 'cityName'],
      state: ['state', 'stateName'],
      country: ['country', 'countryName'],
      location: ['location', 'current_location'],
      linkedin: ['linkedin', 'linkedin_url'],
      github: ['github', 'github_url'],
      website: ['website', 'portfolio', 'website_url'],
      current_company: ['current_company', 'company'],
      current_title: ['current_title', 'title', 'job_title'],
      salary: ['salary', 'desired_compensation', 'desired_salary'],
    };
    if (aliases[fieldName]) {
      for (const alias of aliases[fieldName]) {
        if (profile[alias]) return profile[alias];
      }
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
