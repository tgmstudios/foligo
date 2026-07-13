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

## 2. Send a page view

Production endpoint: `POST https://api.foligo.tech/api/analytics/events`

```html
<script>
  const analyticsKey = 'fa_REPLACE_WITH_YOUR_WRITE_KEY';
  const visitorIdKey = 'foligo_visitor_id';
  const sessionIdKey = 'foligo_session_id';

  let visitorId = localStorage.getItem(visitorIdKey);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(visitorIdKey, visitorId);
  }
  let sessionId = sessionStorage.getItem(sessionIdKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(sessionIdKey, sessionId);
  }

  fetch('https://api.foligo.tech/api/analytics/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Analytics-Key': analyticsKey
    },
    body: JSON.stringify({
      name: 'page_view',
      visitorId,
      sessionId,
      url: location.href,
      path: location.pathname,
      title: document.title,
      referrer: document.referrer || undefined,
      timestamp: new Date().toISOString()
    }),
    keepalive: true
  });
</script>
```

For a single-page app, call the same function after each successful client-side route change.

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
| `metadata` | object | no | JSON object, maximum 8 KB. |

Foligo does not persist the sender IP address. `visitorId` and `sessionId` are pseudonymized before storage. Your site remains responsible for consent, disclosure, and retention requirements that apply in its jurisdiction.

## Key rotation

Select **Rotate key** in Integration settings when a key is exposed or as part of normal credential rotation. Rotation invalidates the previous key immediately and does not remove historical data.

The OpenAPI definition and interactive API explorer are available at `https://api.foligo.tech/api-docs`.
