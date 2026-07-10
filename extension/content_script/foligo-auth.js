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
    // Show a message to the user
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
      showMessage('✓ Device linked! You can close this tab and return to the extension.', 'success');

      // Notify the extension (if popup is open)
      try {
        chrome.runtime.sendMessage({ action: 'deviceCodeSubmitted', deviceCode });
      } catch (e) {
        // Popup might not be open — that's fine, polling handles it
      }
    } else {
      const err = await resp.text();
      console.error('[FoligoAuth] Submission failed:', resp.status, err);
      showMessage(`Failed to link device: ${resp.status}. Make sure you're logged into Foligo.`, 'error');
    }
  } catch (e) {
    console.error('[FoligoAuth] Network error:', e);
    showMessage('Network error. Check your connection and try again.', 'error');
  }

  function showMessage(text, type) {
    // Remove any existing message
    const existing = document.getElementById('foligo-auth-msg');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'foligo-auth-msg';
    div.style.cssText = `
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
      padding: 12px 24px; border-radius: 8px; font-family: -apple-system, sans-serif;
      font-size: 14px; font-weight: 600; z-index: 99999; text-align: center;
      max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      background: ${type === 'success' ? '#00A86B' : '#DF1B41'};
      color: white;
    `;
    div.textContent = text;
    document.body.appendChild(div);

    // Auto-dismiss success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => div.remove(), 5000);
    }
  }
})();
