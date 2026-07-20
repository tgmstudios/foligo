/**
 * Filler — Multi-method field filling.
 * Supports: default, react, dijit, click, select, checkbox, 
 *           uploadResume, uploadCoverLetter, writeCoverLetter
 */
const Filler = (() => {
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
    const tracker = element._valueTracker;
    const previousValue = element.value;
    setNativeValue(element, value);
    // React uses this tracker to decide whether a synthetic change occurred.
    // It must contain the previous value when the input event is dispatched.
    if (tracker) tracker.setValue(previousValue || '');
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    if (element.contentEditable === 'true') {
      element.textContent = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function fillReact(element, value) {
    fillDefault(element, value);
    element.dispatchEvent(new Event('blur', { bubbles: true }));
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

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  // ─── CDP-backed input (real Input-domain events via background.js) ────
  //
  // Content scripts can't call chrome.debugger directly, so these ask the
  // background service worker to dispatch real Input.dispatchMouseEvent /
  // Input.insertText against this tab. Frameworks (React, custom comboboxes)
  // receive these identically to genuine user input, unlike a synthetic DOM
  // event — this is the fix for values a site's own JS silently reverts.
  // Falls back to the pre-CDP DOM-event path (via the caller) whenever the
  // background worker reports failure — e.g. debugger permission denied, or
  // another DevTools session already attached to this tab.
  function sendToBackgroundCDP(action, payload) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ action, ...payload }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('[GoApply:Filler] CDP', action, 'unreachable, falling back to DOM events:', chrome.runtime.lastError.message);
            resolve({ ok: false, error: chrome.runtime.lastError.message });
            return;
          }
          if (!response?.ok) console.warn('[GoApply:Filler] CDP', action, 'failed, falling back to DOM events:', response?.error);
          resolve(response || { ok: false, error: 'No response from background' });
        });
      } catch (e) { resolve({ ok: false, error: e.message }); }
    });
  }

  // Coordinates are relative to the frame this content script runs in — CDP
  // input dispatch targets the tab's main frame, so a field inside a
  // cross-origin iframe will fall back to the DOM-event path automatically
  // (the click will land on the wrong coordinates and fail verification).
  async function cdpClick(element) {
    if (!element?.getBoundingClientRect) return { ok: false, error: 'No element' };
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
    await wait(50);
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { ok: false, error: 'Element not visible' };
    return sendToBackgroundCDP('cdp-click', { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }

  async function cdpType(element, text) {
    if (!element?.focus) return { ok: false, error: 'No element' };
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
    element.focus();
    await wait(30);
    return sendToBackgroundCDP('cdp-type', { text });
  }

  function cdpKey(key) {
    return sendToBackgroundCDP('cdp-key', { key });
  }

  function getLiveElement(fieldInfo) {
    if (fieldInfo?.element?.isConnected !== false) return fieldInfo.element;
    if (fieldInfo?.selectorPath && typeof Detector !== 'undefined') {
      const container = fieldInfo.container?.isConnected ? fieldInfo.container : document;
      const replacement = Detector.getFirstXPathMatch(fieldInfo.selectorPath, container);
      if (replacement) {
        fieldInfo.element = replacement;
        return replacement;
      }
    }
    return fieldInfo?.element || null;
  }

  function controlRoot(element) {
    return element?.closest?.('.select__container, .select-shell, .ant-select, .select2-container')
      || element?.closest?.('[data-testid*="select" i], [class*="select-container" i], [class*="selectControl" i], [class*="dropdown" i]')
      || element?.closest?.('[role="combobox"]')?.parentElement
      || element?.parentElement
      || element;
  }

  function isVisibleElement(element) {
    if (!element?.isConnected) return false;
    const style = globalThis.getComputedStyle?.(element);
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
    return !element.getClientRects || element.getClientRects().length > 0;
  }

  function findSelectOpener(element, root = controlRoot(element)) {
    const candidates = [
      element,
      root?.querySelector?.('[role="combobox"]'),
      root?.querySelector?.('input[aria-autocomplete]'),
      root?.querySelector?.('[aria-haspopup="listbox"]'),
      root?.querySelector?.('button[aria-haspopup]'),
      root?.querySelector?.('[aria-expanded]'),
    ].filter(Boolean);
    return candidates.find(candidate => isVisibleElement(candidate)) || element;
  }

  function readFieldValue(fieldInfo) {
    const element = getLiveElement(fieldInfo);
    if (!element) return '';
    if (element.type === 'checkbox' || element.type === 'radio') {
      const checked = element.name
        ? document.querySelector(`input[name="${CSS.escape(element.name)}"]:checked`)
        : (element.checked ? element : null);
      return checked
        ? [checked.value, checked.getAttribute('aria-label'), ...(checked.labels ? Array.from(checked.labels).map(label => label.textContent) : [])].filter(Boolean).join(' ')
        : '';
    }
    if (element.tagName === 'SELECT') return element.selectedOptions?.[0]?.textContent || element.value || '';

    const root = controlRoot(element);
    const selected = root?.querySelector?.(
      '.select__single-value, .select__multi-value__label, [class*="singleValue"], [class*="selected-value" i], ' +
      '.ant-select-selection-item, .select2-chosen, [role="option"][aria-selected="true"], [data-selected="true"]'
    );
    const hiddenSelect = root?.querySelector?.('select');
    return selected?.textContent?.trim()
      || hiddenSelect?.selectedOptions?.[0]?.textContent?.trim()
      || element.getAttribute?.('aria-valuetext')
      || element.value
      || element.textContent?.trim()
      || '';
  }

  // A searchable combobox's input value is only its current query. It must
  // not be accepted as proof that an option was committed. Prefer selected
  // display nodes/hidden selects, and only trust the opener's own value once
  // the widget explicitly reports that its popup is closed.
  function readCommittedSelectValue(fieldInfo, opener) {
    const element = getLiveElement(fieldInfo);
    if (!element) return '';
    if (element.tagName === 'SELECT') return readFieldValue(fieldInfo);
    const root = controlRoot(element);
    const selected = root?.querySelector?.(
      '.select__single-value, .select__multi-value__label, [class*="singleValue"], [class*="selected-value" i], ' +
      '.ant-select-selection-item, .select2-chosen, [role="option"][aria-selected="true"], [data-selected="true"]'
    );
    const hiddenSelect = root?.querySelector?.('select');
    const semanticValue = selected?.textContent?.trim()
      || hiddenSelect?.selectedOptions?.[0]?.textContent?.trim()
      || opener?.getAttribute?.('aria-valuetext');
    if (semanticValue) return semanticValue;
    if (opener?.matches?.('button, [role="button"]')) return opener.textContent?.trim() || '';
    if (opener?.matches?.('input, textarea') && opener.getAttribute?.('aria-expanded') === 'false') {
      return opener.value || '';
    }
    return '';
  }

  function valueMatches(actual, expectedChoices) {
    const normalizedActual = normalizeChoice(actual);
    if (!normalizedActual) return false;
    return (expectedChoices || []).some(expected => {
      const wanted = normalizeChoice(expected);
      return wanted && (
        normalizedActual === wanted
        || normalizedActual.includes(wanted)
        || wanted.includes(normalizedActual)
        || normalizedActual.replace(/\s+/g, '').includes(wanted.replace(/\s+/g, ''))
      );
    });
  }

  function choiceCandidates(value, valuesMap) {
    const rawValues = Array.isArray(value) ? value : [value];
    const candidates = rawValues.map(String);
    if (!valuesMap) return candidates;
    const wantedValues = rawValues.map(normalizeChoice).filter(Boolean);
    for (const [key, aliases] of Object.entries(valuesMap)) {
      if (!Array.isArray(aliases)) continue;
      const optionNames = [key, ...aliases].map(normalizeChoice);
      if (wantedValues.some(wanted => optionNames.some(normalized =>
        normalized === wanted || normalized.includes(wanted) || wanted.includes(normalized)
      ))) candidates.push(key, ...aliases.map(String));
    }
    return [...new Set(candidates.filter(Boolean))];
  }

  const OPTION_SELECTOR = [
    '[role="option"]', '.select__option', '.ant-select-item-option',
    '.select2-result', '[data-option-index]', '[id*="-option-"]',
    '[class*="option" i]', '[role="menuitemradio"]'
  ].join(',');

  const POPUP_SELECTOR = [
    '[role="listbox"]', '[role="menu"]', '[role="tree"]',
    '.select__menu', '.ant-select-dropdown', '.select2-results',
    '[data-radix-popper-content-wrapper]', '[class*="dropdown-menu" i]',
    '[class*="listbox" i]'
  ].join(',');

  function isVisibleOption(option) {
      if (!option.textContent?.trim() || option.getAttribute('aria-disabled') === 'true') return false;
      const style = globalThis.getComputedStyle?.(option);
      if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
      return !option.getClientRects || option.getClientRects().length > 0;
  }

  function visibleOptions(scope = document) {
    return Array.from(scope.querySelectorAll?.(OPTION_SELECTOR) || []).filter(isVisibleOption);
  }

  function visiblePopupRoots() {
    return Array.from(document.querySelectorAll(POPUP_SELECTOR)).filter(isVisibleElement);
  }

  function controlledPopupIds(opener, root) {
    const controls = [opener, root?.querySelector?.('[role="combobox"]')].filter(Boolean);
    return [...new Set(controls.flatMap(control =>
      `${control.getAttribute?.('aria-controls') || ''} ${control.getAttribute?.('aria-owns') || ''}`
        .trim().split(/\s+/).filter(Boolean)
    ))];
  }

  function popupDistance(opener, popup) {
    const a = opener?.getBoundingClientRect?.();
    const b = popup?.getBoundingClientRect?.();
    if (!a || !b) return Number.MAX_SAFE_INTEGER;
    const horizontalGap = Math.max(0, a.left - b.right, b.left - a.right);
    const verticalGap = Math.max(0, a.top - b.bottom, b.top - a.bottom);
    return horizontalGap + verticalGap;
  }

  function scopedOptions(opener, root, baseline = new Map()) {
    for (const id of controlledPopupIds(opener, root)) {
      const popup = document.getElementById(id);
      const options = popup ? visibleOptions(popup) : [];
      if (options.length) return options;
    }

    const local = root ? visibleOptions(root) : [];
    if (local.length) return local;

    // Most React/Vue selects portal their menu under <body>. Associate the
    // nearest visible popup with this opener; do not reuse options from a
    // different field's stale portal.
    const popupCandidates = visiblePopupRoots()
      .map(popup => ({ popup, options: visibleOptions(popup) }))
      .filter(candidate => candidate.options.length)
      .sort((a, b) => popupDistance(opener, a.popup) - popupDistance(opener, b.popup));
    if (popupCandidates.length) return popupCandidates[0].options;

    const expanded = opener.getAttribute?.('aria-expanded') === 'true'
      || root?.querySelector?.('[aria-expanded="true"]');
    if (expanded) {
      // Some libraries render bare option nodes without a listbox wrapper and
      // recycle those nodes between controls. Treat changed text as fresh too.
      const fresh = visibleOptions().filter(option =>
        !baseline.has(option) || baseline.get(option) !== option.textContent?.trim()
      );
      if (fresh.length) return fresh;
    }
    return [];
  }

  async function closeOpenSelects() {
    const expanded = Array.from(document.querySelectorAll('[aria-expanded="true"], [aria-haspopup="listbox"]'));
    const active = document.activeElement;
    for (const control of [...new Set([active, ...expanded].filter(Boolean))]) {
      control.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      control.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', bubbles: true }));
    }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    await wait(100);
  }

  async function waitForOptions(opener, root, baseline, timeoutMs = 2500) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const options = scopedOptions(opener, root, baseline);
      if (options.length) return options;
      await wait(50);
    }
    return [];
  }

  function findMatchingOption(options, candidates) {
    const wanted = candidates.map(normalizeChoice).filter(Boolean);
    return options.find(option => wanted.includes(normalizeChoice(option.textContent)))
      || options.find(option => {
        const actual = normalizeChoice(option.textContent);
        return wanted.some(candidate => actual.startsWith(candidate) || candidate.startsWith(actual));
      })
      || options.find(option => {
        const actual = normalizeChoice(option.textContent);
        return wanted.some(candidate => actual.includes(candidate) || candidate.includes(actual));
      });
  }

  function dispatchPointerSequence(element) {
    const pointerInit = { bubbles: true, cancelable: true, view: window, pointerType: 'mouse', isPrimary: true };
    if (typeof PointerEvent === 'function') element.dispatchEvent(new PointerEvent('pointerdown', pointerInit));
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    if (typeof PointerEvent === 'function') element.dispatchEvent(new PointerEvent('pointerup', pointerInit));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    element.click?.();
  }

  async function writeSearchValue(element, value) {
    const previousValue = element.value;
    const cdpResult = await cdpType(element, value);
    if (!cdpResult.ok) {
      setNativeValue(element, value);
      if (element._valueTracker) element._valueTracker.setValue(previousValue || '');
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }
    return previousValue;
  }

  async function tryKeyboardSelection(opener, fieldInfo, candidates) {
    if (!opener?.matches?.('input, textarea, [role="combobox"]')) return null;
    opener.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
    opener.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
    await wait(75);
    opener.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    opener.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
    const started = Date.now();
    while (Date.now() - started < 1500) {
      const retainedValue = readCommittedSelectValue(fieldInfo, opener);
      if (valueMatches(retainedValue, candidates)) return { expectedChoices: candidates, retainedValue };
      await wait(50);
    }
    return null;
  }

  async function fillSelect(fieldInfo, value) {
    const element = getLiveElement(fieldInfo);
    const valuesMap = fieldInfo.values;
    const candidates = choiceCandidates(value, valuesMap);
    if (element.tagName === 'SELECT') {
      const options = Array.from(element.options);
      const option = options.find(opt => candidates.some(candidate => {
        const wanted = normalizeChoice(candidate);
        return normalizeChoice(opt.value) === wanted || normalizeChoice(opt.textContent) === wanted;
      })) || options.find(opt => candidates.some(candidate => {
        const wanted = normalizeChoice(candidate);
        const actual = normalizeChoice(opt.textContent);
        return actual.includes(wanted) || wanted.includes(actual);
      }));
      if (!option) throw new Error(`No matching option for "${value}"`);
      element.focus();
      setNativeValue(element, option.value);
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      element.blur();
      const retainedValue = readFieldValue(fieldInfo);
      if (!valueMatches(retainedValue, candidates)) throw new Error(`Selection "${option.textContent.trim()}" was not retained`);
      return { expectedChoices: candidates, retainedValue };
    }

    await closeOpenSelects();
    const root = controlRoot(element);
    const opener = findSelectOpener(element, root);
    const baseline = new Map(visibleOptions().map(option => [option, option.textContent?.trim()]));
    opener.focus?.();
    dispatchPointerSequence(opener);
    // Greenhouse school/degree controls are searchable async selects. Merely
    // opening them is insufficient: enter the desired label so React Select
    // can fetch/filter its options before attempting the click.
    let openerValueBefore;
    if (opener.matches?.('input, textarea')) {
      const searchValue = candidates.find(candidate => /[a-z]/i.test(candidate)) || candidates[0];
      openerValueBefore = await writeSearchValue(opener, searchValue);
      await wait(150);
    }
    const options = await waitForOptions(opener, root, baseline, 4000);
    const option = findMatchingOption(options, candidates);
    if (!option) {
      if (!options.length) {
        const keyboardSelection = await tryKeyboardSelection(opener, fieldInfo, candidates);
        if (keyboardSelection) return keyboardSelection;
      }
      const available = options.map(opt => opt.textContent.trim()).filter(Boolean).slice(0, 20);
      if (openerValueBefore !== undefined) await writeSearchValue(opener, openerValueBefore);
      await closeOpenSelects();
      throw new Error(`No matching option for "${value}"${available.length ? `. Available: ${available.join(' | ')}` : ''}`);
    }

    option.scrollIntoView?.({ block: 'nearest' });
    await clickWithFallback(option);
    await wait(150);
    // If CDP dispatched but the framework did not commit the choice, retry
    // through the component's own DOM event handlers before verification.
    if (option.isConnected && isVisibleOption(option)) dispatchPointerSequence(option);

    const started = Date.now();
    while (Date.now() - started < 2500) {
      const retainedValue = readCommittedSelectValue(fieldInfo, opener);
      if (valueMatches(retainedValue, candidates)) return { expectedChoices: candidates, retainedValue };
      await wait(50);
    }
    // React Select/Greenhouse occasionally ignores a pointer commit while
    // still accepting trusted keyboard selection. The query already narrows
    // the list to the intended value, so select its first match with real
    // CDP key events and verify once more.
    opener.focus?.();
    dispatchPointerSequence(opener);
    if (opener.matches?.('input, textarea')) {
      const searchValue = candidates.find(candidate => /[a-z]/i.test(candidate)) || candidates[0];
      await cdpType(opener, searchValue);
      await wait(200);
    }
    await cdpKey('ArrowDown');
    await cdpKey('Enter');
    const keyboardStarted = Date.now();
    while (Date.now() - keyboardStarted < 1800) {
      const retainedValue = readCommittedSelectValue(fieldInfo, opener);
      if (valueMatches(retainedValue, candidates)) return { expectedChoices: candidates, retainedValue };
      await wait(50);
    }
    if (openerValueBefore !== undefined) await writeSearchValue(opener, openerValueBefore);
    await closeOpenSelects();
    throw new Error(`Option "${option.textContent.trim()}" was clicked but the control did not retain it`);
  }

  async function inspectField(fieldInfo, { open = true, query } = {}) {
    const element = getLiveElement(fieldInfo);
    if (!element) return { found: false };
    let options = [];
    const root = controlRoot(element);
    if (element.tagName === 'SELECT') {
      options = Array.from(element.options).map(option => option.textContent.trim()).filter(Boolean);
    } else if (element.type === 'radio') {
      const group = element.name
        ? Array.from(document.querySelectorAll(`input[type="radio"][name="${CSS.escape(element.name)}"]`))
        : [element];
      options = group.map(input => [
        input.value,
        ...(input.labels ? Array.from(input.labels).map(label => label.textContent.trim()) : []),
        input.getAttribute('aria-label'),
      ].filter(Boolean).join(' — '));
    } else if (element.type === 'checkbox') {
      options = ['checked', 'unchecked'];
    } else if (open && fieldInfo.method === 'select') {
      await closeOpenSelects();
      const opener = findSelectOpener(element, root);
      const baseline = new Map(visibleOptions().map(option => [option, option.textContent?.trim()]));
      dispatchPointerSequence(opener);
      let openerValueBefore;
      if (query && opener.matches?.('input, textarea')) {
        openerValueBefore = await writeSearchValue(opener, query);
      }
      options = (await waitForOptions(opener, root, baseline, 4000)).map(option => option.textContent.trim()).filter(Boolean);
      opener.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      if (openerValueBefore !== undefined) await writeSearchValue(opener, openerValueBefore);
    }
    const uniqueOptions = [...new Set(options)];
    const combobox = element.matches?.('[role="combobox"]') ? element : element.querySelector?.('[role="combobox"]');
    const labelText = [
      ...(element.labels ? Array.from(element.labels).map(label => label.textContent) : []),
      root?.querySelector?.('label')?.textContent,
      element.getAttribute?.('aria-label'),
    ].find(text => text?.trim())?.replace(/\s+/g, ' ').trim();
    const controlKind = element.type === 'checkbox'
      ? 'checkbox'
      : element.type === 'radio'
        ? 'radio-group'
        : element.tagName === 'SELECT'
          ? 'native-select'
          : fieldInfo.method === 'select'
            ? (combobox?.matches?.('input, textarea') ? 'autocomplete-select' : 'dynamic-select')
            : (element.tagName || 'input').toLowerCase();
    return {
      found: true,
      controlKind,
      inputType: element.type || undefined,
      role: combobox?.getAttribute?.('role') || element.getAttribute?.('role') || undefined,
      labelText,
      checked: element.type === 'checkbox' || element.type === 'radio' ? Boolean(element.checked) : undefined,
      currentValue: readFieldValue(fieldInfo),
      optionCount: uniqueOptions.length,
      optionsTruncated: uniqueOptions.length > 50,
      options: uniqueOptions.slice(0, 50),
      query: query || undefined,
    };
  }

  function normalizeChoice(value) {
    return String(value ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\b(i am|i have|i do|identify as)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async function clickWithFallback(element) {
    const cdpResult = await cdpClick(element);
    if (cdpResult.ok) return;
    element.focus();
    element.click();
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  }

  async function fillClick(element, _value) {
    await clickWithFallback(element);
  }

  async function fillCheckbox(element, value) {
    if (element.type === 'radio') {
      const group = element.name
        ? Array.from(document.querySelectorAll(`input[type="radio"][name="${CSS.escape(element.name)}"]`))
        : [element];
      const wanted = normalizeChoice(value);
      const match = group.find(radio => {
        const label = radio.labels ? Array.from(radio.labels).map(l => l.textContent).join(' ') : '';
        return [radio.value, label, radio.getAttribute('aria-label')]
          .filter(Boolean)
          .some(candidate => {
            const normalized = normalizeChoice(candidate);
            return normalized === wanted || normalized.includes(wanted) || wanted.includes(normalized);
          });
      });
      if (!match) throw new Error(`No matching radio option for "${value}"`);
      if (!match.checked) await clickWithFallback(match);
      match.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    const shouldCheck = value === true || value === 'true' || value === 'yes' || value === 'on';
    if (element.checked !== shouldCheck) {
      await clickWithFallback(element);
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  // ─── Resume / cover letter upload ─────────────────────────────────
  //
  // Attaching a File to an <input type="file"> via DataTransfer does not
  // require a user gesture — only invoking the native picker dialog does —
  // so the default Foligo document can be attached without the user ever
  // touching the field. We still fall back to a manual highlight when no
  // default document exists, it fails to compile, or the site rejects the
  // programmatic assignment.

  // Attachment names are always derived from the applicant's name, not the
  // Foligo document's own title — a stable, predictable filename regardless
  // of what the user called the document in Resume Studio.
  function sanitizeNamePart(s) {
    return String(s || '').trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_');
  }

  function buildDocumentFileName(kind, profile = {}) {
    const first = sanitizeNamePart(resolveValueSync('first_name', profile));
    const last = sanitizeNamePart(resolveValueSync('last_name', profile));
    const label = kind === 'resume' ? 'Resume' : 'Cover_Letter';
    const parts = [first, last, label].filter(Boolean);
    return `${parts.join('_')}.pdf`;
  }

  const DOCUMENT_SOURCES = {
    resume: { list: 'getResumes', get: 'getResume', pdf: 'getResumePdf', compile: 'compileResumePdf' },
    coverLetter: { list: 'getCoverLetters', get: 'getCoverLetter', pdf: 'getCoverLetterPdf', compile: 'compileCoverLetterPdf' },
  };

  async function listDocuments(kind) {
    if (typeof GoApplyAPI === 'undefined') return [];
    try {
      const docs = await GoApplyAPI[DOCUMENT_SOURCES[kind].list]();
      return Array.isArray(docs) ? docs : [];
    } catch (e) { return []; }
  }

  async function getDocument(kind, documentId) {
    if (typeof GoApplyAPI === 'undefined' || !documentId) return null;
    const source = DOCUMENT_SOURCES[kind];
    if (!source || typeof GoApplyAPI[source.get] !== 'function') return null;
    return GoApplyAPI[source.get](documentId);
  }

  // Remember the last explicit model/user choice for continuity and display.
  // Merely having a remembered/default document never causes an upload:
  // attachDocument() still requires the exact document id for every field.
  function selectedDocStorageKey(kind) { return kind === 'resume' ? 'selectedResumeId' : 'selectedCoverLetterId'; }

  async function getSelectedDocId(kind) {
    try {
      const key = selectedDocStorageKey(kind);
      const stored = await chrome.storage.local.get(key);
      return stored[key] || null;
    } catch (e) { return null; }
  }

  async function getSelectedDocSource(kind) {
    try {
      const key = `${selectedDocStorageKey(kind)}Source`;
      const stored = await chrome.storage.local.get(key);
      return stored[key] || null;
    } catch (e) { return null; }
  }

  async function setSelectedDocId(kind, id, source = 'model') {
    try {
      const idKey = selectedDocStorageKey(kind);
      const sourceKey = `${idKey}Source`;
      if (id) await chrome.storage.local.set({ [idKey]: id, [sourceKey]: source });
      else await chrome.storage.local.remove([idKey, sourceKey]);
    } catch (e) {}
    delete cachedDocFiles[kind];
    delete cachedDocFilesAt[kind];
  }

  let cachedDocFiles = { resume: null, coverLetter: null };
  let cachedDocFilesAt = { resume: 0, coverLetter: 0 };
  const DOC_FILE_TTL_MS = 10 * 60 * 1000;

  async function fetchDocumentFile(kind, profile, documentId) {
    if (typeof GoApplyAPI === 'undefined') return null;
    const source = DOCUMENT_SOURCES[kind];
    let docs;
    try { docs = await GoApplyAPI[source.list](); } catch (e) { return null; }
    if (!Array.isArray(docs) || docs.length === 0) return null;

    const selectedId = documentId || await getSelectedDocId(kind);
    if (!selectedId) return null;
    const doc = docs.find(d => d.id === selectedId);
    if (!doc) throw new Error(`The selected Foligo ${kind} is no longer available.`);

    let blob = null;
    try { blob = await GoApplyAPI[source.pdf](doc.id); } catch (e) { /* not compiled yet */ }
    if (!blob) {
      try { blob = await GoApplyAPI[source.compile](doc.id); } catch (e) { console.warn(`[GoApply:Filler] ${kind} compile failed:`, e.message); }
    }
    if (!blob) return null;
    return new File([blob], buildDocumentFileName(kind, profile), { type: 'application/pdf' });
  }

  async function loadDocumentFile(kind, profile = {}, forceRefresh = false, documentId) {
    if (!forceRefresh && cachedDocFiles[kind]?.documentId === documentId
      && (Date.now() - cachedDocFilesAt[kind]) < DOC_FILE_TTL_MS) {
      return cachedDocFiles[kind].file;
    }
    const file = await fetchDocumentFile(kind, profile, documentId);
    if (file) { cachedDocFiles[kind] = { documentId, file }; cachedDocFilesAt[kind] = Date.now(); }
    return file;
  }

  function highlightForManualUpload(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.focus();
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
  }

  function resolveFileInput(element, kind) {
    if (element?.matches?.('input[type="file"]')) return element;
    const localRoot = element?.closest?.('label, [class*="upload" i], [class*="attach" i], [data-testid*="upload" i], fieldset, form')
      || element?.parentElement;
    const local = localRoot?.querySelector?.('input[type="file"]');
    if (local) return local;
    const hints = kind === 'resume'
      ? /resume|cv/i
      : /cover.?letter|cover_letter/i;
    const inputs = [...document.querySelectorAll('input[type="file"]')];
    return inputs.find(input => hints.test([
      input.name, input.id, input.getAttribute('aria-label'), input.getAttribute('data-testid'),
      ...(input.labels ? [...input.labels].map(label => label.textContent) : []),
    ].filter(Boolean).join(' '))) || (inputs.length === 1 ? inputs[0] : null);
  }

  async function fillUploadDocument(element, kind, profile, documentId) {
    const input = resolveFileInput(element, kind);
    if (!input) {
      highlightForManualUpload(element);
      return { success: false, note: 'No file input was found behind this upload control.', manual: true };
    }
    if (!documentId) {
      return {
        success: false,
        manual: false,
        note: 'No Foligo document was explicitly selected for this field.',
      };
    }
    let file = null;
    try {
      file = await loadDocumentFile(kind, profile, true, documentId);
    } catch (e) {
      return { success: false, manual: false, note: e.message };
    }

    if (file) {
      try {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        const dropTarget = input.closest?.('[class*="upload" i], [class*="drop" i], [class*="attach" i]') || input.parentElement;
        try {
          dropTarget?.dispatchEvent?.(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
        } catch (error) {
          // The FileList assignment/change event is the primary path; some
          // Chrome builds do not accept dataTransfer in DragEventInit.
        }
        await wait(150);
        const attached = input.files?.[0];
        if (!attached || attached.name !== file.name) {
          throw new Error('The page did not retain the attached file.');
        }
        return { success: true, note: `attached ${attached.name}`, expectedValue: attached.name, retainedValue: attached.name, manual: false };
      } catch (e) {
        console.warn('[GoApply:Filler] Programmatic file attach failed, falling back to manual:', e.message);
      }
    }

    highlightForManualUpload(input);
    return {
      success: false,
      note: file
        ? 'The site rejected the selected Foligo document; the upload control was highlighted for manual recovery.'
        : 'The selected Foligo document has no available PDF; the upload control was highlighted.',
      manual: true,
    };
  }

  async function attachDocument(fieldInfo, kind, documentId, profile = {}) {
    if (!fieldInfo?.element) return { success: false, reason: 'no element' };
    if (!documentId) return { success: false, note: 'An explicit Foligo documentId is required.' };
    const [selectedId, selectedSource] = await Promise.all([
      getSelectedDocId(kind),
      getSelectedDocSource(kind),
    ]);
    // Attaching the document must not erase a choice the user made in the
    // side-panel selector. A different ID is necessarily a model choice.
    const source = selectedId === documentId && selectedSource === 'user' ? 'user' : 'model';
    await setSelectedDocId(kind, documentId, source);
    return fillUploadDocument(fieldInfo.element, kind, profile, documentId);
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
    hispanic_ethnicity: ['hispanicLatino'],
    veteran: ['veteranStatus'],
    veteran_status: ['veteranStatus'],
    veteran_v2: ['veteranStatus'],
    armed_forces: ['veteranStatus'],
    disability: ['disabilityStatus'],
    disability_status: ['disabilityStatus'],
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
    phone_stripped: p => String(p.phone || '').replace(/\D/g, ''),
    phone_country: p => ({ US: '+1', CA: '+1', GB: '+44', AU: '+61', IN: '+91', DE: '+49', FR: '+33', ES: '+34', IT: '+39', NL: '+31', IE: '+353', NZ: '+64', SG: '+65', JP: '+81', BR: '+55', MX: '+52' }[p.phoneCountry] || p.phoneCountry || ''),
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

  async function loadProfile(forceRefresh = false) {
    const memoryHasProfile = cachedProfile && Object.keys(cachedProfile).length > 0;
    if (!forceRefresh && memoryHasProfile && (Date.now() - cachedProfileAt) < PROFILE_TTL_MS) {
      console.debug('[GoApply:Filler] Profile source=memory fields=' + Object.keys(cachedProfile).length);
      return cachedProfile;
    }
    let stored = {};
    try {
      stored = await chrome.storage.local.get(['profile', 'profileFetchedAt']);
    } catch (e) { /* storage unavailable */ }

    const storedHasProfile = stored.profile && Object.keys(stored.profile).length > 0;
    const isStale = forceRefresh || !storedHasProfile || !stored.profileFetchedAt || (Date.now() - stored.profileFetchedAt) > PROFILE_TTL_MS;
    if (isStale && typeof GoApplyAPI !== 'undefined') {
      try {
        const remote = await GoApplyAPI.getGoApplyProfile();
        if (remote) {
          cachedProfile = remote;
          cachedProfileAt = Date.now();
          try { await chrome.storage.local.set({ profile: remote, profileFetchedAt: cachedProfileAt }); } catch (e) {}
          console.debug('[GoApply:Filler] Profile source=api fields=' + Object.keys(remote).length);
          return cachedProfile;
        }
      } catch (e) {
        // Not authenticated / offline — fall back to whatever's cached locally.
        console.error('[GoApply:Filler] Profile API load failed:', e.message);
      }
    }

    cachedProfile = storedHasProfile ? stored.profile : {};
    cachedProfileAt = Date.now();
    console.debug('[GoApply:Filler] Profile source=storage fields=' + Object.keys(cachedProfile).length);
    return cachedProfile;
  }

  function invalidateCache() {
    cachedProfile = null; cachedProfileAt = 0;
    cachedDocFiles = { resume: null, coverLetter: null };
    cachedDocFilesAt = { resume: 0, coverLetter: 0 };
  }

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && (changes.profile || changes.foligoToken || changes.goapplyEnv || changes.goapplyCustomEndpoints)) invalidateCache();
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

  // fillDefault/fillReact only dispatch synthetic events — unlike fillSelect
  // (which already polls readCommittedSelectValue), they never confirmed the
  // page actually kept the value. A site that reverts an input on blur (or a
  // React component that ignores the synthetic event) would otherwise be
  // reported as filled. Give the page a tick to react, then read back.
  async function verifyTextFill(fieldInfo, value, values) {
    await wait(30);
    const expectedChoices = choiceCandidates(value, values);
    const retainedValue = readFieldValue(fieldInfo);
    if (!valueMatches(retainedValue, expectedChoices)) {
      return { success: false, reason: 'The page did not retain the typed value.', expectedValue: value, expectedChoices, retainedValue };
    }
    return { success: true, expectedValue: value, expectedChoices, retainedValue };
  }

  // ─── Main fill function ──────────────────────────────────────────

  async function fillField(fieldInfo, profile = {}) {
    profile = profile && typeof profile === 'object' ? profile : {};
    const { element, method, fieldName, values } = fieldInfo;

    const value = Object.keys(profile).length > 0
      ? resolveValueSync(fieldName, profile)
      : resolveValueSync(fieldName, cachedProfile || {});

    if (!element) return { success: false, reason: 'no element' };
    if (!value && method !== 'uploadResume' && method !== 'uploadCoverLetter' && method !== 'click') {
      return { success: false, reason: 'no value configured' };
    }

    try {
      switch (method) {
        case 'react': {
          const cdpResult = await cdpType(element, value);
          if (cdpResult.ok) element.dispatchEvent(new Event('blur', { bubbles: true }));
          else fillReact(element, value);
          return verifyTextFill(fieldInfo, value, values);
        }
        case 'dijit': fillDijit(element, value); break;
        case 'selectCheckboxOrRadio': await fillCheckbox(element, value); break;
        case 'select': {
          const selection = await fillSelect(fieldInfo, value);
          return { success: true, expectedValue: value, ...selection };
        }
        case 'click': await fillClick(element, value); break;
        case 'defaultWithoutBlur':
          element.focus(); setNativeValue(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
          element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
          break;
        case 'uploadResume': return await fillUploadDocument(element, 'resume', profile);
        case 'uploadCoverLetter': return await fillUploadDocument(element, 'coverLetter', profile);
        case 'writeCoverLetter':
          return fillWriteCoverLetter(element, value);
        default: {
          const cdpResult = await cdpType(element, value);
          if (!cdpResult.ok) fillDefault(element, value);
          return verifyTextFill(fieldInfo, value, values);
        }
      }
      return { success: true, expectedValue: value, expectedChoices: choiceCandidates(value, values) };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  }

  async function fillAll(foundFields, profile = {}) {
    const results = [];
    for (const field of foundFields) {
      const result = await fillField(field, profile);
      results.push({ ...field, ...result });
    }
    return results;
  }

  return {
    fillField, fillAll, fillDefault, fillReact, fillDijit,
    resolveValue, resolveValueSync, loadProfile, invalidateCache,
    fillWriteCoverLetter, loadDocumentFile, listDocuments, getDocument, attachDocument,
    getSelectedDocId, getSelectedDocSource, setSelectedDocId, readFieldValue, valueMatches,
    choiceCandidates, inspectField, DEFAULT_VALUES, clickElement: clickWithFallback
  };
})();
