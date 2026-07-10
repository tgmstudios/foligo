/**
 * Foligo Device-Code Auth Bridge
 * Injected on foligo.tech/* pages. Detects /auth/link-device?code=XXXXXX
 * and submits the device code to the Foligo API using the page's
 * authenticated session cookies.
 */
(async function FoligoAuthBridge() {
  'use strict';

  const API_BASE = 'https://api.foligo.tech';

  // Only act on the link-device page
  const path = window.location.pathname;
  if (!path.startsWith('/auth/link-device')) return;

  const params = new URLSearchParams(window.location.search);
  const deviceCode = params.get('code');

  if (!deviceCode || deviceCode.length < 4) {
    console.log('[FoligoAuth] No valid device code in URL');
    showMessage('No device code found in URL. Please try again from the extension.', 'error');
    return;
  }

  console.log('[FoligoAuth] Submitting device code:', deviceCode);

  try {
    const resp = await fetch(`${API_BASE}/api/auth/device-code-external`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // send foligo.tech session cookies
      body: JSON.stringify({ deviceCode }),
    });

    if (resp.ok) {
      console.log('[FoligoAuth] Device code submitted successfully');

      // Notify the Vue page via postMessage
      window.postMessage({ type: 'foligo-device-link', success: true }, window.location.origin);

      // Notify the extension (if popup is open)
      try {
        chrome.runtime.sendMessage({ action: 'deviceCodeSubmitted', deviceCode });
      } catch (e) {
        // Popup might not be open — that's fine, polling handles it
      }
    } else {
      const err = await resp.text();
      console.error('[FoligoAuth] Submission failed:', resp.status, err);

      window.postMessage({
        type: 'foligo-device-link',
        success: false,
        error: resp.status === 401
          ? 'You are not logged in. Please log in to Foligo first, then try again.'
          : `Server error (${resp.status}). Please try again.`
      }, window.location.origin);

      showMessage(
        resp.status === 401
          ? 'You are not logged in. Please log in to Foligo first.'
          : `Failed to link device: ${resp.status}`,
        'error'
      );
    }
  } catch (e) {
    console.error('[FoligoAuth] Network error:', e);
    window.postMessage({
      type: 'foligo-device-link',
      success: false,
      error: 'Network error. Check your connection and try again.'
    }, window.location.origin);
    showMessage('Network error. Check your connection and try again.', 'error');
  }

  function showMessage(text, type) {
    // Remove any existing message
    const existing = document.getElementById('foligo-auth-msg');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'foligo-auth-msg';
    const bg = type === 'success' ? '#00A86B' : '#DF1B41';
    div.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      padding: 14px 28px; border-radius: 10px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px; font-weight: 600; z-index: 99999; text-align: center;
      max-width: 420px; box-shadow: 0 4px 20px rgba(10,37,64,0.15);
      background: ${bg}; color: white;
    `;
    div.textContent = text;
    document.body.appendChild(div);

    // Auto-dismiss success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => div.remove(), 5000);
    }
  }
})();
