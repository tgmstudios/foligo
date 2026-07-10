/**
 * Finder — Form field discovery using platform selectors + label-text heuristics.
 * Handles both configured selectors AND discovers fields via DOM patterns:
 *   - label[for] → input#id (Greenhouse, Lever pattern)
 *   - input[name] (traditional pattern)
 *   - data-automation-id (Workday pattern)
 *   - aria-label / aria-labelledby
 */
const Finder = (() => {
  // ─── Field name normalization ─────────────────────────────────────

  function normalizeLabelText(text) {
    if (!text) return '';
    return text
      .replace(/[\u00A0]/g, ' ')
      .replace(/[\u2000-\u200F\u2028-\u202F\u205F\u3000]/g, ' ')
      .replace(/[/:_\-,.;()?!*&]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  // ─── Label → field type mapping ──────────────────────────────────

  function categorizeByLabel(labelText) {
    const t = normalizeLabelText(labelText);
    const patterns = [
      { names: ['first_name'], re: /first\s*name|given\s*name|forename/i },
      { names: ['last_name'], re: /last\s*name|surname|family\s*name/i },
      { names: ['full_name'], re: /full\s*name|legal\s*name/i },
      { names: ['middle_name'], re: /middle\s*name/i },
      { names: ['preferred_name'], re: /preferred\s*name|nickname/i },
      { names: ['email'], re: /email|e\-mail/i },
      { names: ['phone'], re: /phone|mobile|cell|telephone/i },
      { names: ['city'], re: /^city$/i },
      { names: ['state'], re: /^state$|province|region/i },
      { names: ['country'], re: /^country$|nationality|currently work/i },
      { names: ['location'], re: /location|address|where/i },
      { names: ['zip'], re: /zip|postal\s*code|postcode/i },
      { names: ['linkedin'], re: /linkedin|linked\s*in/i },
      { names: ['github'], re: /github|git\s*hub/i },
      { names: ['website'], re: /^website$|portfolio|personal\s*site/i },
      { names: ['school'], re: /^school$|university$|college$/i },
      { names: ['degree'], re: /^degree$|qualification/i },
      { names: ['highestDegree'], re: /highest.*(degree|education)/i },
      { names: ['discipline'], re: /discipline|field\s*of\s*study|major/i },
      { names: ['gpa'], re: /gpa|grade\s*point/i },
      { names: ['education'], re: /education|academic/i },
      { names: ['resume'], re: /resume|cv|curriculum\s*vitae|attach/i },
      { names: ['cover_letter'], re: /cover\s*letter/i },
      { names: ['current_company'], re: /current\s*company|employer/i },
      { names: ['current_title'], re: /current\s*title|job\s*title|position/i },
      { names: ['years_experience'], re: /years.*experience|experience.*years/i },
      { names: ['skills'], re: /skill|proficien/i },
      { names: ['salary'], re: /salary|compensation|wage|desired\s*pay/i },
      { names: ['start_date'], re: /start\s*date|available|earliest/i },
      { names: ['referral'], re: /refer|how.*hear|source/i },
      { names: ['visa'], re: /visa|sponsor|authori[sz]|work\s*permit/i },
      { names: ['gender'], re: /gender|sex|identify\s*as/i },
      { names: ['race'], re: /race|ethnic/i },
      { names: ['veteran'], re: /veteran|military/i },
      { names: ['disability'], re: /disability/i },
      { names: ['hispanic'], re: /hispanic|latino/i },
      { names: ['work_authorization'], re: /authori[sz]|eligible.*work|right.*work/i },
      { names: ['relocate'], re: /relocat|willing.*move/i },
      { names: ['travel'], re: /travel|willing.*commit|meet.*person/i },
    ];

    for (const { names, re } of patterns) {
      if (re.test(t)) return { fieldNames: names, category: names[0] };
    }
    
    // Check for agreement/consent
    if (/agree|consent|privacy|understand|own words|plagiarism/i.test(t)) {
      return { fieldNames: ['agreement'], category: 'agreement' };
    }
    
    // Check for degree result / GPA text
    if (/degree.*result|gpa|grade.*system|bachelor/i.test(t)) {
      return { fieldNames: ['education_details'], category: 'education_details' };
    }
    
    // Check for high school / rationale
    if (/high\s*school|rationale|evidence|sat|act|ib\s*result/i.test(t)) {
      return { fieldNames: ['education_details'], category: 'education_details' };
    }
    
    // Check for math / language performance
    if (/math|native\s*language|perform.*high\s*school/i.test(t)) {
      return { fieldNames: ['education_details'], category: 'education_details' };
    }
    
    return { fieldNames: [t.substring(0, 30).replace(/\s+/g, '_')], category: 'custom' };
  }

  // ─── XPath selector resolution ───────────────────────────────────

  function resolveSelector(selector, container = document) {
    if (typeof selector === 'string') {
      return Detector.getFirstXPathMatch(selector, container);
    }
    if (Array.isArray(selector)) {
      for (const s of selector) {
        const node = Detector.getFirstXPathMatch(s, container);
        if (node) return node;
      }
      return null;
    }
    if (selector && typeof selector === 'object' && selector.path) {
      const path = typeof selector.path === 'string' ? selector.path : 
        (Array.isArray(selector.path) ? selector.path : null);
      if (Array.isArray(path)) {
        for (const p of path) {
          const node = Detector.getFirstXPathMatch(p, container);
          if (node) return { node, method: selector.method, track: selector.track };
        }
      } else if (typeof path === 'string') {
        const node = Detector.getFirstXPathMatch(path, container);
        if (node) return { node, method: selector.method, track: selector.track };
      }
    }
    return null;
  }

  // ─── Container resolution ────────────────────────────────────────

  function resolveContainer(containerPaths) {
    if (!containerPaths || !containerPaths.length) return document;
    for (const path of containerPaths) {
      const node = Detector.getFirstXPathMatch(path, document.documentElement);
      if (node) return node;
    }
    return document;
  }

  // ─── Primary: find fields using platform config ──────────────────

  function findFields(platformConfig) {
    const inputSelectors = platformConfig.inputSelectors || [];
    const containerPaths = platformConfig.containerPath || [];
    const container = resolveContainer(containerPaths);
    
    const foundFields = [];
    const foundIds = new Set();
    
    for (const [fieldName, selectors] of inputSelectors) {
      for (const sel of selectors) {
        const resolved = resolveSelector(sel, container);
        if (resolved) {
          const element = resolved.node || resolved;
          const elId = element.id || element.name;
          if (!foundIds.has(elId + fieldName)) {
            foundIds.add(elId + fieldName);
            foundFields.push({
              fieldName,
              element,
              method: resolved.method || platformConfig.defaultMethod || 'default',
              container
            });
          }
          break;
        }
      }
    }
    
    // ─── Secondary: discover via label[for] pattern ────────────────
    const labelFields = discoverLabelFields(container, foundIds);
    foundFields.push(...labelFields);
    labelFields.forEach(f => foundIds.add((f.element.id || f.element.name) + f.fieldName));
    
    // ─── Tertiary: discover via input[name] with smart categorization ──
    const nameFields = discoverNameFields(container, foundIds);
    foundFields.push(...nameFields);
    
    return foundFields;
  }

  // ─── Discover fields via label[for] ──────────────────────────────

  function discoverLabelFields(container = document, skipIds = new Set()) {
    const fields = [];
    const labels = (container === document ? document : container).querySelectorAll('label[for]');
    
    for (const label of labels) {
      const forId = label.getAttribute('for');
      if (!forId || skipIds.has(forId)) continue;
      
      const target = document.getElementById(forId);
      if (!target) continue;
      if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) continue;
      if (target.type === 'hidden') continue;
      
      const labelText = label.textContent.replace(/\*/g, '').trim();
      if (!labelText || labelText.length > 200) continue; // Skip essay-length labels
      
      const { fieldNames, category } = categorizeByLabel(labelText);
      const primaryName = fieldNames[0];
      
      // Skip if already found via primary selectors
      if (skipIds.has(primaryName)) continue;
      
      let method = 'default';
      if (target.type === 'file') method = 'uploadResume';
      if (target.tagName === 'SELECT') method = 'selectCheckboxOrRadio';
      if (target.type === 'checkbox' || target.type === 'radio') method = 'selectCheckboxOrRadio';
      
      fields.push({
        fieldName: primaryName,
        element: target,
        method,
        container,
        _source: 'label-text',
        _labelText: labelText,
      });
      
      skipIds.add(forId);
      skipIds.add(primaryName);
    }
    
    return fields;
  }

  // ─── Discover fields via input[name] ─────────────────────────────

  function discoverNameFields(container = document, skipIds = new Set()) {
    const fields = [];
    const inputs = (container === document ? document : container).querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea'
    );
    
    for (const el of inputs) {
      const id = el.id || el.name;
      if (!id || skipIds.has(id)) continue;
      
      // Only pick up fields that aren't already covered by label[for]
      const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (label) continue; // Already handled by discoverLabelFields
      
      const { fieldNames } = categorizeByLabel(id);
      const primaryName = fieldNames[0];
      
      if (skipIds.has(primaryName)) continue;
      
      let method = 'default';
      if (el.type === 'file') method = 'uploadResume';
      if (el.tagName === 'SELECT') method = 'selectCheckboxOrRadio';
      
      fields.push({
        fieldName: primaryName,
        element: el,
        method,
        container,
        _source: 'name-attribute',
      });
      
      skipIds.add(id);
      skipIds.add(primaryName);
    }
    
    return fields;
  }

  // ─── Find all forms on page (heuristic) ──────────────────────────

  function findAllForms() {
    const forms = [];
    
    document.querySelectorAll('form').forEach(form => {
      if (formHasEnoughInputs(form, 3)) {
        forms.push({ element: form, type: 'form' });
      }
    });
    
    document.querySelectorAll('div[class*="form"], div[class*="application"], div[class*="apply"], fieldset').forEach(el => {
      if (!el.closest('form') && formHasEnoughInputs(el, 5)) {
        forms.push({ element: el, type: 'form-like-container' });
      }
    });
    
    findShadowForms(document.body, forms);
    return forms;
  }

  function formHasEnoughInputs(container, min) {
    let count = 0;
    const inputs = container.querySelectorAll('input:not([type="hidden"]), select, textarea');
    const hasName = container.querySelector('input[name*="name" i], input[id*="name" i], input[autocomplete*="name"]');
    const hasEmail = container.querySelector('input[type="email"], input[name*="email" i], input[id*="email" i], input[autocomplete="email"]');
    return inputs.length >= min && (hasName || hasEmail);
  }

  function findShadowForms(root, forms, depth = 0) {
    if (depth > 3) return;
    const allElements = root.querySelectorAll('*');
    for (const el of allElements) {
      if (el.shadowRoot) {
        const shadowInputs = el.shadowRoot.querySelectorAll('input:not([type="hidden"]), select, textarea');
        if (shadowInputs.length >= 3) {
          const hasName = el.shadowRoot.querySelector('input[name*="name" i], input[id*="name" i]');
          const hasEmail = el.shadowRoot.querySelector('input[type="email"], input[name*="email" i]');
          if (hasName || hasEmail) {
            forms.push({ element: el, type: 'shadow-root' });
          }
        }
        findShadowForms(el.shadowRoot, forms, depth + 1);
      }
    }
  }

  return {
    findFields, findAllForms, categorizeByLabel,
    resolveSelector, resolveContainer,
    discoverLabelFields, discoverNameFields,
  };
})();
