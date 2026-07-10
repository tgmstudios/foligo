/**
 * Consent — Privacy consent modal on first install.
 * Mirrors the real Simplify's consent dialog with toggle switches.
 */
const Consent = (() => {
  let modalEl = null;

  async function checkNeeded() {
    try {
      const stored = await chrome.storage.local.get('consent');
      return !stored.consent;
    } catch(e) { return true; }
  }

  function createModal(onAccept, onDecline) {
    if (modalEl) return;
    if (document.querySelector('.sr-consent-modal')) return;

    modalEl = document.createElement('div');
    modalEl.className = 'sr-consent-modal';
    modalEl.style.cssText = `
      position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;
      background:rgba(10,37,64,0.6);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    `;
    modalEl.innerHTML = `
      <div style="
        background:white;border-radius:16px;padding:28px;max-width:500px;max-height:90vh;
        overflow-y:auto;box-shadow:0 16px 48px rgba(10,37,64,0.2);
      ">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
          <span style="font-size:24px;">🔒</span>
          <h2 style="font-size:18px;font-weight:700;color:#0A2540;margin:0;">Your Privacy</h2>
        </div>
        <p style="font-size:13px;color:#6B7C93;margin-bottom:16px;line-height:1.5;">
          We take your privacy seriously. Your data stays on your machine.
          Nothing is ever sent to external servers without your explicit configuration.
        </p>
        <p style="font-size:13px;color:#6B7C93;margin-bottom:16px;line-height:1.5;">
          The extension uses information you provide (name, email, work history, skills) 
          to autofill job applications. Submitted application URLs are saved locally 
          so you can track your progress. You can manage or delete all data at any time 
          in Settings.
        </p>
        <div style="
          padding:12px;background:#E6F7F0;border-radius:8px;margin-bottom:16px;font-size:12px;
          color:#00A86B;line-height:1.5;
        ">
          ✓ <strong>Local-only storage</strong> — nothing uploaded to any server<br>
          ✓ <strong>You control your data</strong> — edit or delete anytime in Settings<br>
          ✓ <strong>No tracking</strong> — no analytics, no telemetry
        </div>
        <div style="display:flex;gap:8px;">
          <button id="sr-consent-accept" style="
            flex:1;padding:12px;border:none;border-radius:8px;background:#635BFF;color:white;
            font-size:14px;font-weight:600;cursor:pointer;
          ">Accept & Continue</button>
        </div>
        <p style="font-size:11px;color:#6B7C93;margin-top:12px;text-align:center;">
          By continuing, you agree to store your data locally on this device.
        </p>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.querySelector('#sr-consent-accept').addEventListener('click', async () => {
      try { await chrome.storage.local.set({ consent: { accepted: true, date: new Date().toISOString() } }); } catch(e) {}
      modalEl.remove(); modalEl = null;
      if (onAccept) onAccept();
    });

    // Close on background click
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) {
        modalEl.remove(); modalEl = null;
      }
    });
  }

  async function showIfNeeded(onAccept) {
    const needed = await checkNeeded();
    if (needed) {
      createModal(onAccept);
    }
  }

  return { showIfNeeded };
})();
