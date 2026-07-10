/**
 * Detector — URL matching, XPath evaluation, shadow DOM traversal, platform detection.
 * Extracted and rebuilt from simplify.jobs contentScript.bundle.js architecture.
 */
const Detector = (() => {
  let config = null;
  let configLoaded = false;
  let configPromise = null;

  // ─── Config loading ───────────────────────────────────────────────

  async function loadConfig() {
    if (configLoaded) return config;
    if (configPromise) return configPromise;
    
    configPromise = (async () => {
      try {
        // Try chrome.storage cache first
        try {
          const cached = await chrome.storage.local.get('remoteConfig');
          if (cached.remoteConfig && cached.remoteConfig.ATS) {
            config = cached.remoteConfig;
            configLoaded = true;
            console.log('[Detector] Config loaded from cache:', Object.keys(config.ATS || {}).length, 'ATS platforms');
            return config;
          }
        } catch (e) { /* storage unavailable, continue */ }
        
        // Fetch from extension package
        const url = chrome.runtime.getURL('config/remoteConfig.json');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        config = await resp.json();
        configLoaded = true;
        console.log('[Detector] Config loaded:', Object.keys(config.ATS || {}).length, 'ATS platforms');
        
        // Cache for next time
        try { chrome.storage.local.set({ remoteConfig: config }); } catch(e) {}
        
        return config;
      } catch (e) {
        console.error('[Detector] Failed to load config:', e.message);
        // Fall back to built-in minimal config
        config = getBuiltinConfig();
        configLoaded = true;
        return config;
      }
    })();
    return configPromise;
  }
  
  function getBuiltinConfig() {
    // Minimal built-in config so the extension works even if remoteConfig fails
    return {
      ATS: {
        "Lever": {
          "urls": ["*://*.lever.co/*/*/apply*", "*://jobs.lever.co/*/*/apply*", "*://jobs.lever.co/*/apply*"],
          "containerPath": [".//form", ".//div[contains(@class,'application-form')]", ".//div[contains(@class,'apply-form')]"],
          "inputSelectors": [
            ["full_name", [".//input[@placeholder='Full name']", ".//label[contains(.,'Full name')]/parent::*//input"]],
            ["email", [".//input[@placeholder='Email']", ".//label[contains(.,'Email')]/parent::*//input", ".//input[@type='email']"]],
            ["phone", [".//input[@placeholder='Phone']", ".//label[contains(.,'Phone')]/parent::*//input", ".//input[@type='tel']"]],
            ["current_location", [".//label[contains(.,'Current location')]/parent::*//input", ".//input[@name='location']"]],
            ["linkedin", [".//label[contains(.,'LinkedIn')]/parent::*//input", ".//input[contains(@name,'linkedin')]"]],
            ["website", [".//label[contains(.,'website')]/parent::*//input", ".//input[contains(@name,'website') or contains(@name,'portfolio')]"]],
            ["resume", [".//label[contains(.,'Resume')]/parent::*//input[@type='file']", ".//input[@type='file' and contains(@name,'resume')]"]]
          ]
        },
        "Greenhouse": {
          "urls": ["*://boards.greenhouse.io/*", "*://boards.eu.greenhouse.io/*", "*://job-boards.greenhouse.io/*", "*://*.greenhouse.io/*/jobs/*"],
          "containerPath": [".//form[@id='application_form']", ".//div[@id='application-form']", ".//form[starts-with(@action,'https://boards.greenhouse.io')]", ".//div[@id='main']"],
          "defaultMethod": "react",
          "inputSelectors": [
            ["first_name", [".//input[@id='first_name']", ".//label[contains(.,'First Name')]/parent::*//input"]],
            ["last_name", [".//input[@id='last_name']", ".//label[contains(.,'Last Name')]/parent::*//input"]],
            ["email", [".//input[@id='email']", ".//input[contains(@name,'email')]", ".//input[@autocomplete='email']"]],
            ["phone", [".//input[@id='phone']", ".//input[contains(@name,'phone')]", ".//input[@autocomplete='tel']"]],
            ["resume", [".//input[@id='resume']", ".//input[@type='file']"]],
            ["country", [".//input[@id='country']"]],
            ["school", [".//input[starts-with(@id,'school')]"]],
            ["degree", [".//input[starts-with(@id,'degree')]"]],
            ["discipline", [".//input[starts-with(@id,'discipline')]"]],
            ["linkedin", [".//label[contains(.,'LinkedIn')]/parent::*//input", ".//input[starts-with(@id,'question')][@id]"]],
            ["website", [".//label[contains(.,'Website')]/parent::*//input"]],
            ["gender", [".//input[@id='gender']"]],
            ["hispanic_ethnicity", [".//input[@id='hispanic_ethnicity']"]],
            ["veteran_status", [".//input[@id='veteran_status']"]],
            ["disability_status", [".//input[@id='disability_status']"]]
          ]
        },
        "Workday": {
          "urls": ["*://*.myworkdayjobs.com/*", "*://*.workday.com/*/apply*"],
          "containerPath": [".//div[@data-automation-id='applyFlow']", ".//div[contains(@data-automation-id,'formField')]"],
          "inputSelectors": [
            ["first_name", [".//div[contains(@data-automation-id,'firstName')]//input"]],
            ["last_name", [".//div[contains(@data-automation-id,'lastName')]//input"]],
            ["email", [".//input[@data-automation-id='email']", ".//input[@name='emailAddress']"]],
            ["phone", [".//input[@data-automation-id='phone']"]]
          ]
        }
      },
      render: { minWidth: 400, minHeight: 260, urlsExcluded: [] }
    };
  }

  // ─── URL matching (ported from webextension-pattern) ──────────────

  const VALID_SCHEMES = new Set(['http', 'https', 'ws', 'wss', 'ftp', 'ftps', 'data', 'file']);
  const BROWSER_SCHEMES = new Set(['http', 'https', 'ws', 'wss']);

  function escapeRegex(str) {
    if (typeof str !== 'string') return '.*';
    return str.replace(/([|.$+?{}()[\]\\])/g, '\\$1').replace(/\*/g, '.*');
  }

  function compilePattern(pattern) {
    if (pattern === '<all_urls>') {
      return { scheme: VALID_SCHEMES, host: null, path: null };
    }
    if (pattern === '*://*/*') {
      return { scheme: BROWSER_SCHEMES, host: null, path: null };
    }
    const schemeEnd = pattern.indexOf('://');
    if (schemeEnd === -1) throw new Error('Missing :// in pattern');
    
    const schemeStr = pattern.slice(0, schemeEnd);
    const scheme = schemeStr === '*' ? BROWSER_SCHEMES : 
      (VALID_SCHEMES.has(schemeStr) ? new Set([schemeStr]) : (() => { throw new Error('Invalid scheme'); })());
    
    const hostStart = schemeEnd + 3;
    const pathStart = pattern.indexOf('/', hostStart);
    if (pathStart === -1) throw new Error('Missing / in pattern');
    
    const hostStr = pattern.slice(hostStart, pathStart);
    let host = null;
    if (hostStr !== '*') {
      if (hostStr.includes(':')) throw new Error('Host must not include port');
      if (hostStr === '') {
        if (schemeStr === 'file') host = /^$/;
        else throw new Error('Host required for non-file schemes');
      } else if (hostStr.includes('*')) {
        if (hostStr.indexOf('*') !== 0) throw new Error('Wildcard only at start');
        const suffix = hostStr.slice(2);
        if (!/^[.\w_-]+$/.test(suffix)) throw new Error('Invalid host chars');
        host = new RegExp(`^(?:.*[.])?${escapeRegex(suffix)}$`);
      } else {
        if (!/^[.\w_-]+$/.test(hostStr)) throw new Error('Invalid host chars');
        host = new RegExp(`^${escapeRegex(hostStr)}$`);
      }
    }
    
    const pathStr = pattern.slice(pathStart + 1);
    const path = pathStr === '*' ? null : new RegExp(`^${escapeRegex(pathStr)}$`);
    
    return { scheme, host, path };
  }

  function matchPattern(pattern, url) {
    try {
      const compiled = compilePattern(pattern.replace(/#/g, '/__HASH__/'));
      const testUrl = url.replace(/#/g, '/__HASH__/');
      
      // Parse URL
      const colonIdx = testUrl.indexOf(':');
      if (colonIdx === -1 || colonIdx > 5) return false;
      const scheme = testUrl.slice(0, colonIdx);
      if (!compiled.scheme.has(scheme)) return false;
      
      let pos = colonIdx + 1;
      while (testUrl[pos] === '/') pos++;
      let pathIdx = testUrl.indexOf('/', pos);
      if (pathIdx === -1) pathIdx = testUrl.length;
      
      const host = scheme === 'file' ? '' : testUrl.slice(pos, pathIdx);
      if (compiled.host && !compiled.host.test(host)) return false;
      
      if (compiled.path) {
        const pathStart = scheme === 'file' ? pos : pathIdx + 1;
        let hashIdx = testUrl.indexOf('#', pathStart);
        if (hashIdx === -1) hashIdx = testUrl.length;
        if (!compiled.path.test(testUrl.slice(pathStart, hashIdx))) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function matchesAny(patterns, url) {
    if (!Array.isArray(patterns) || !patterns.length) return false;
    return patterns.some(p => {
      if (typeof p !== 'string') return false;
      try { return matchPattern(p, url); } catch(e) { return false; }
    });
  }

  // ─── XPath evaluation with shadow DOM traversal ──────────────────

  const SHADOW_MARKER = '/shadow-root/';

  function evaluateXPath(xpath, root, resultType = XPathResult.ORDERED_NODE_ITERATOR_TYPE) {
    if (xpath.includes(SHADOW_MARKER)) {
      return evaluateShadowXPath(xpath, root);
    }
    try {
      return document.evaluate(xpath, root, null, resultType, null);
    } catch (e) {
      return null;
    }
  }

  function evaluateShadowXPath(xpath, root) {
    const parts = xpath.split(SHADOW_MARKER);
    const baseXPath = parts[0];
    const shadowSelector = parts[1]; // e.g. "//input" or "self::*"
    
    try {
      // Find elements matching the base part
      const baseResult = document.evaluate(baseXPath, root, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
      const results = [];
      let node;
      
      while ((node = baseResult.iterateNext())) {
        if (node instanceof Element && node.shadowRoot) {
          // Traverse into shadow root
          try {
            const shadowResult = document.evaluate(
              '.' + shadowSelector, 
              node.shadowRoot, 
              null, 
              XPathResult.ORDERED_NODE_ITERATOR_TYPE, 
              null
            );
            let shadowNode;
            while ((shadowNode = shadowResult.iterateNext())) {
              results.push(shadowNode);
            }
          } catch (e) {
            // Shadow root traversal failed
          }
          
          // Handle nested shadow roots (chained)
          if (parts.length > 2) {
            const nestedXPath = parts.slice(1).join(SHADOW_MARKER);
            // Recurse through shadow root children
            for (let i = 0; i < node.shadowRoot.children.length; i++) {
              const child = node.shadowRoot.children[i];
              try {
                const nestedResults = findInShadowTree(child, nestedXPath);
                results.push(...nestedResults);
              } catch (e) {}
            }
          }
        }
      }
      
      // Return as array-like result
      return {
        iterateNext: (() => {
          let idx = 0;
          return () => idx < results.length ? results[idx++] : null;
        })(),
        snapshotLength: results.length,
        snapshotItem: (i) => results[i] || null
      };
    } catch (e) {
      return null;
    }
  }

  function findInShadowTree(element, xpath) {
    const results = [];
    const parts = xpath.split(SHADOW_MARKER);
    
    if (parts.length === 1) {
      try {
        const result = document.evaluate('.' + xpath, element, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        let node;
        while ((node = result.iterateNext())) results.push(node);
      } catch (e) {}
    } else {
      const firstPart = parts[0];
      const rest = parts.slice(1).join(SHADOW_MARKER);
      try {
        const result = document.evaluate('.' + firstPart, element, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        let node;
        while ((node = result.iterateNext())) {
          if (node.shadowRoot) {
            for (let i = 0; i < node.shadowRoot.children.length; i++) {
              results.push(...findInShadowTree(node.shadowRoot.children[i], rest));
            }
          }
        }
      } catch (e) {}
    }
    return results;
  }

  function getFirstXPathMatch(xpath, root = document) {
    try {
      const result = evaluateXPath(xpath, root, XPathResult.FIRST_ORDERED_NODE_TYPE);
      if (result && result.singleNodeValue) return result.singleNodeValue;
      // Fallback: try as iterator
      const iterResult = evaluateXPath(xpath, root);
      if (iterResult) {
        const node = iterResult.iterateNext();
        return node || null;
      }
    } catch (e) {}
    return null;
  }

  function xpathExists(xpath, root = document) {
    try {
      const result = evaluateXPath(xpath, root, XPathResult.BOOLEAN_TYPE);
      return result ? result.booleanValue : false;
    } catch (e) {
      return false;
    }
  }

  // ─── Platform detection ───────────────────────────────────────────

  async function detectPlatform(url = window.location.href) {
    const cfg = await loadConfig();
    const ats = cfg.ATS || {};
    
    for (const [platform, pconf] of Object.entries(ats)) {
      const urls = pconf.urls || [];
      if (matchesAny(urls, url)) {
        // Check exclusions
        const excluded = pconf.urlsExcluded || [];
        if (excluded.length && matchesAny(excluded, url)) continue;
        
        // Check path exclusions
        if (pconf.pathsExcluded && Array.isArray(pconf.pathsExcluded)) {
          const excluded = pconf.pathsExcluded.some(p => {
            if (typeof p !== 'string') return false;
            try { return new RegExp(p.replace(/\*/g, '.*')).test(window.location.pathname); }
            catch(e) { return false; }
          });
          if (excluded) continue;
        }
        
        // Check if we're on an embedded path (Greenhouse etc has both main site and embedded)
        if (pconf.embeddedPaths && !matchesAny(pconf.embeddedPaths, url)) {
          // Not on an embedded path — check if full URL match still works
          // Some platforms require specific paths
        }
        
        return { platform, config: pconf };
      }
    }
    return null;
  }

  async function shouldActivate() {
    // Render config minimums
    const cfg = await loadConfig();
    const render = cfg.render || {};
    const minWidth = render.minWidth || 400;
    const minHeight = render.minHeight || 260;
    
    // Check excluded URLs
    const excluded = render.urlsExcluded || [];
    if (excluded.length && matchesAny(excluded, window.location.href)) return false;
    
    // Size check
    const rect = document.documentElement.getBoundingClientRect();
    if (rect.width < minWidth || rect.height < minHeight) return false;
    
    // Platform match
    const platform = await detectPlatform();
    if (!platform) return false;
    
    // Container match if required
    const containers = platform.config.containerPath || [];
    if (platform.config.containerRequired !== false && containers.length > 0) {
      const hasContainer = containers.some(c => xpathExists(c, document.documentElement));
      if (!hasContainer) return false;
    }
    
    return platform;
  }

  // ─── Mutation observer ────────────────────────────────────────────

  function createObserver(callback, { debounceMs = 300, maxDebounceMs = 5000 } = {}) {
    let currentDebounce = debounceMs;
    let lastUrl = window.location.href;
    let timerId = null;
    let isChecking = false;
    
    const check = async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        // Reset debounce if URL changed
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          currentDebounce = debounceMs;
        } else {
          currentDebounce = Math.min(maxDebounceMs, currentDebounce * 2);
        }
        await callback();
      } finally {
        isChecking = false;
      }
    };
    
    const debouncedCheck = () => {
      if (timerId) return;
      timerId = setTimeout(() => {
        timerId = null;
        check();
      }, currentDebounce);
    };
    
    const observer = new MutationObserver(() => debouncedCheck());
    observer.observe(document, { childList: true, subtree: true });
    
    return { observer, check, disconnect: () => observer.disconnect() };
  }

  return {
    loadConfig,
    detectPlatform,
    shouldActivate,
    createObserver,
    evaluateXPath,
    getFirstXPathMatch,
    xpathExists,
    matchPattern,
    matchesAny
  };
})();
