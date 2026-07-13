(function () {
  'use strict';

  // ---- Configuration ----
  const script = document.currentScript || document.querySelector('script[data-key]');
  const KEY = script?.getAttribute('data-key') || window.FOLIGO_ANALYTICS_KEY || '';
  if (!KEY) return;

  const ENDPOINT = 'https://api.foligo.tech/api/analytics/events';
  const VISITOR_KEY = 'foligo_visitor_id';
  const SESSION_KEY = 'foligo_session_id';
  const VISIT_COUNT_KEY = 'foligo_visit_count';
  const PREV_PATH_KEY = 'foligo_prev_path';

  // ---- Visitor & session IDs ----
  var visitorId, sessionId, isNewSession, visitCount, prevPath, pageEnteredAt, pagePath, pageTitle;
  try {
    visitorId = localStorage.getItem(VISITOR_KEY);
    if (!visitorId) { visitorId = crypto.randomUUID(); localStorage.setItem(VISITOR_KEY, visitorId); }
    sessionId = sessionStorage.getItem(SESSION_KEY);
    isNewSession = !sessionId;
    if (isNewSession) { sessionId = crypto.randomUUID(); sessionStorage.setItem(SESSION_KEY, sessionId); }
    visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
    if (isNewSession) { visitCount += 1; localStorage.setItem(VISIT_COUNT_KEY, String(visitCount)); }
    prevPath = sessionStorage.getItem(PREV_PATH_KEY) || undefined;
  } catch (e) { return; }

  // ---- Device fingerprinting ----
  var ua = navigator.userAgent;
  var sw = screen.width;

  function parseOS(ua) {
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac OS/i.test(ua) || /Macintosh/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua) && !/Android/i.test(ua)) return 'Linux';
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua) || /like Mac OS X/i.test(ua)) return 'iOS';
    if (/CrOS/i.test(ua)) return 'ChromeOS';
    return 'Other';
  }

  function parseBrowser(ua) {
    if (/Edg\//i.test(ua)) return 'Edge';
    if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
    if (/Chrome/i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) return 'Chrome';
    if (/Firefox/i.test(ua)) return 'Firefox';
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
    if (/Trident|MSIE/i.test(ua)) return 'IE';
    return 'Other';
  }

  function detectDeviceType(ua, sw) {
    if (/Mobi|Android/i.test(ua) || (/iPhone|iPod/i.test(ua) && !/iPad/i.test(ua))) {
      if (/iPhone|iPod/i.test(ua) || (/Mac OS X/i.test(ua) && /like Mac OS X/i.test(ua) && !/iPad/i.test(ua))) return 'mobile-ios';
      if (/Android/i.test(ua) && /Mobi/i.test(ua)) return 'mobile-android';
      return 'mobile-other';
    }
    if (/iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobi/i.test(ua)) || (sw && sw >= 600 && sw < 1024)) return 'tablet';
    if (/Windows/i.test(ua)) return 'desktop-windows';
    if (/Mac OS/i.test(ua) || /Macintosh/i.test(ua)) return 'desktop-mac';
    if (/Linux/i.test(ua)) return 'desktop-linux';
    return 'desktop-other';
  }

  var os = parseOS(ua);
  var browser = parseBrowser(ua);
  var deviceType = detectDeviceType(ua, sw);
  var domain = location.hostname;

  // ---- Track function ----
  function sendEvent(name, extra) {
    var payload = {
      name: name,
      visitorId: visitorId,
      sessionId: sessionId,
      url: location.href,
      path: pagePath || location.pathname,
      title: pageTitle || document.title,
      referrer: document.referrer || undefined,
      timestamp: new Date().toISOString(),
      domain: domain,
      previousPath: prevPath,
      visitCount: visitCount,
      os: os,
      browser: browser,
      deviceType: deviceType,
      device: /mobile/i.test(deviceType) ? 'mobile' : /tablet/i.test(deviceType) ? 'tablet' : 'desktop'
    };
    if (extra) {
      if (extra.duration) payload.duration = extra.duration;
      if (extra.metadata) payload.metadata = extra.metadata;
    }

    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Analytics-Key': KEY },
        body: JSON.stringify(payload),
        keepalive: true
      });
    } catch (e) {}
  }

  // ---- Track page view ----
  function trackPageView(pathOverride, titleOverride) {
    pagePath = pathOverride || location.pathname;
    pageTitle = titleOverride || document.title;
    pageEnteredAt = Date.now();
    sendEvent('page_view');
    try { sessionStorage.setItem(PREV_PATH_KEY, pagePath); } catch (e) {}
  }

  // Track initial page
  trackPageView();

  // ---- Time on page ----
  window.addEventListener('beforeunload', function () {
    if (!pageEnteredAt) return;
    var duration = Date.now() - pageEnteredAt;
    if (duration > 3600000) duration = 3600000;
    if (duration < 0) return;
    var payload = {
      name: 'page_exit',
      visitorId: visitorId,
      sessionId: sessionId,
      url: location.href,
      path: pagePath || location.pathname,
      title: pageTitle || document.title,
      timestamp: new Date().toISOString(),
      domain: domain,
      visitCount: visitCount,
      duration: duration
    };
    try {
      navigator.sendBeacon(ENDPOINT, JSON.stringify(payload));
    } catch (e) {}
  });

  // ---- SPA navigation tracking ----
  var _pushState = history.pushState;
  var _replaceState = history.replaceState;
  history.pushState = function () {
    var oldPath = location.pathname;
    _pushState.apply(this, arguments);
    onNav(oldPath);
  };
  history.replaceState = function () {
    var oldPath = location.pathname;
    _replaceState.apply(this, arguments);
    onNav(oldPath);
  };
  window.addEventListener('popstate', function () {
    prevPath = pagePath || location.pathname;
    trackPageView();
  });

  function onNav(oldPath) {
    prevPath = oldPath;
    trackPageView();
  }

  // ---- Expose for manual use (custom events, SPA frameworks) ----
  window.foligo = {
    track: function (name, meta) { sendEvent(name, meta ? { metadata: meta } : undefined); },
    trackPage: trackPageView,
    getVisitorId: function () { return visitorId; },
    getSessionId: function () { return sessionId; }
  };
})();
