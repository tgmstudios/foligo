# Foligo Analytics Integration

Foligo Analytics accepts privacy-conscious page views and custom events from any website. Data is scoped to a portfolio through a write key and is available to authorized users on the dashboard Analytics page.

## 1. Create a write key

Open **Analytics > Integration settings**, enter the browser origins that may send events, and select **Create write key**. The complete key is displayed once. Store it as a secret if events are sent from a server. A browser write key identifies the analytics property but does not grant read or dashboard access.

Allowed-origin examples:

```text
https://example.com
https://www.example.com
*.preview.example.com
```

An empty list permits clients without an `Origin` header, which is useful for server-side collection. Use `*` only when events must be accepted from every browser origin. Origin checks are an abuse control, not a substitute for key rotation.

## 2. Enhanced tracking snippet

The snippet below provides automatic visitor/session management, device fingerprinting, return-visitor counting, and page-flow tracking — all client-side, with no personal data.

Production endpoint: `POST https://api.foligo.tech/api/analytics/events`

```html
<script>
(function () {
  const ENDPOINT = 'https://api.foligo.tech/api/analytics/events';
  const KEY = 'fa_REPLACE_WITH_YOUR_WRITE_KEY';
  const VISITOR_KEY = 'foligo_visitor_id';
  const SESSION_KEY = 'foligo_session_id';
  const VISIT_COUNT_KEY = 'foligo_visit_count';
  const PREV_PATH_KEY = 'foligo_prev_path';

  // ---- Visitor & session IDs ----
  let visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, visitorId);
  }
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  let isNewSession = false;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
    isNewSession = true;
  }

  // ---- Return-visitor counting ----
  let visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
  if (isNewSession) {
    visitCount += 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(visitCount));
  }

  // ---- Page-flow: capture previous path ----
  const prevPath = sessionStorage.getItem(PREV_PATH_KEY) || undefined;

  // ---- Device fingerprinting ----
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

  const ua = navigator.userAgent;
  const sw = screen.width;
  const os = parseOS(ua);
  const browser = parseBrowser(ua);
  const deviceType = detectDeviceType(ua, sw);
  const domain = location.hostname;

  // ---- Send page view ----
  fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Analytics-Key': KEY
    },
    body: JSON.stringify({
      name: 'page_view',
      visitorId,
      sessionId,
      url: location.href,
      path: location.pathname,
      title: document.title,
      referrer: document.referrer || undefined,
      timestamp: new Date().toISOString(),
      domain,
      previousPath: prevPath,
      visitCount,
      os,
      browser,
      deviceType,
      device: /mobile/i.test(deviceType) ? 'mobile' : /tablet/i.test(deviceType) ? 'tablet' : 'desktop'
    }),
    keepalive: true
  });

  // ---- Store current path for next navigation ----
  sessionStorage.setItem(PREV_PATH_KEY, location.pathname);
})();
</script>
```

For a single-page app, wrap the fetch call in a function and invoke it after each successful client-side route change. Make sure the `previousPath` logic uses the route that was active *before* the transition.

## 3. Send custom events

Event names must begin with a letter and can contain up to 64 letters, numbers, dots, colons, underscores, or hyphens.

```js
await fetch('https://api.foligo.tech/api/analytics/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Analytics-Key': process.env.FOLIGO_ANALYTICS_KEY
  },
  body: JSON.stringify({
    name: 'contact_form.submitted',
    visitorId: 'your-anonymous-visitor-id',
    sessionId: 'your-session-id',
    path: '/contact',
    metadata: { form: 'primary' }
  })
});
```

Do not put names, email addresses, message text, access tokens, or other personal/sensitive values in `metadata`.

## 4. Track time on page

Record how long a visitor stays on a page by sending the elapsed duration when they navigate away:

```js
const pageEnteredAt = Date.now();

window.addEventListener('beforeunload', () => {
  const duration = Date.now() - pageEnteredAt;
  navigator.sendBeacon(
    'https://api.foligo.tech/api/analytics/events',
    JSON.stringify({
      name: 'page_view',
      visitorId,
      sessionId,
      url: location.href,
      path: location.pathname,
      title: document.title,
      duration,
      timestamp: new Date().toISOString()
    })
  );
});
```

The `duration` field accepts any positive integer up to 3,600,000 ms (1 hour). Values outside this range are ignored.

## 5. Add geolocation data

If your backend or edge worker can resolve the visitor's IP to a location, include `city`, `region`, and `country` in each event:

```json
{
  "name": "page_view",
  "visitorId": "...",
  "sessionId": "...",
  "path": "/",
  "country": "US",
  "region": "California",
  "city": "San Francisco"
}
```

`country` must be a two-letter ISO 3166-1 alpha-2 code. `city` and `region` are free-form strings up to 128 characters.

## Batch ingestion

Send up to 100 events in one request:

```json
{
  "events": [
    { "name": "page_view", "path": "/" },
    { "name": "cta.clicked", "path": "/", "metadata": { "cta": "contact" } }
  ]
}
```

A successful request returns HTTP `202`:

```json
{ "accepted": 2 }
```

The whole batch is rejected when any event is invalid. Retry `429` and `5xx` responses with exponential backoff; do not retry other `4xx` responses without correcting the request.

## Event fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | yes | Use `page_view` for page traffic. |
| `timestamp` | ISO 8601 string | no | Defaults to receipt time; cannot be over five minutes in the future. |
| `visitorId` | string | no | Stable anonymous ID. Stored only as a one-way HMAC hash. |
| `sessionId` | string | no | Per-session anonymous ID. Stored only as a one-way HMAC hash. |
| `url` | string | no | Maximum 2,048 characters. |
| `path` | string | no | Maximum 512 characters; inferred from `url` when omitted. |
| `title` | string | no | Maximum 512 characters. |
| `referrer` | string | no | Maximum 2,048 characters. |
| `country` | string | no | Two-letter country code supplied by your trusted edge/server. |
| `city` | string | no | City name, such as `San Francisco`. Maximum 128 characters. |
| `region` | string | no | Region/state, such as `California`. Maximum 128 characters. |
| `duration` | number | no | Time spent on the page in milliseconds (max 3,600,000). Sent via `beforeunload`. |
| `device` | string | no | Device category such as `mobile`, `tablet`, or `desktop`. |
| `domain` | string | no | The tracked site's hostname (e.g., `tgm.one`). Maximum 256 characters. |
| `previousPath` | string | no | The path the visitor was on before this page (for navigation flow). Maximum 512 characters. |
| `visitCount` | number | no | Which visit this is for this visitor. `1` = first-time, `2+` = returning. |
| `os` | string | no | Operating system parsed from user-agent (e.g., `Windows`, `macOS`, `iOS`). |
| `browser` | string | no | Browser parsed from user-agent (e.g., `Chrome`, `Firefox`, `Safari`). |
| `deviceType` | string | no | Specific device type (e.g., `mobile-ios`, `desktop-windows`, `tablet`). |
| `metadata` | object | no | JSON object, maximum 8 KB. |

Foligo does not persist the sender IP address. `visitorId` and `sessionId` are pseudonymized before storage. Your site remains responsible for consent, disclosure, and retention requirements that apply in its jurisdiction.

## Key rotation

Select **Rotate key** in Integration settings when a key is exposed or as part of normal credential rotation. Rotation invalidates the previous key immediately and does not remove historical data.

The OpenAPI definition and interactive API explorer are available at `https://api.foligo.tech/api-docs`.
