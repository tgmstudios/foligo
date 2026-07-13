/**
 * Network bridge for extension API requests.
 *
 * Manifest V3 content scripts inherit the web page's CORS origin even when the
 * extension has host permissions. Fetching here gives requests the extension
 * origin, so job-board CORS policies cannot block Foligo profile/board sync.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action !== 'goapplyApiRequest') return false;

  (async () => {
    try {
      const url = new URL(message.url);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Unsupported API URL');
      }

      const response = await fetch(url.href, {
        method: message.options?.method || 'GET',
        headers: message.options?.headers || {},
        body: message.options?.body,
      });
      const text = await response.text();
      sendResponse({ ok: response.ok, status: response.status, text });
    } catch (error) {
      sendResponse({ ok: false, status: 0, networkError: error.message });
    }
  })();

  return true;
});
