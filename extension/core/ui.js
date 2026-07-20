/**
 * UI — in-page feedback that has to live on the page itself: toasts, field
 * highlighting, the submit-success modal. The control panel (Autofill/AI
 * Rescan/Track/field list) used to live here as a floating bottom-right box;
 * it's been replaced by the side panel (side-panel.html/side-panel.js),
 * which doesn't fight host-page CSS and survives navigation natively. Only
 * things that are inherently anchored to a specific point on the page stay
 * here.
 *
 * Stripe Color Palette:
 *   Primary:    #635BFF  (Cornflower Blue)
 *   Dark:       #0A2540  (Downriver Navy)
 *   Background: #F6F9FC  (Black Squeeze)
 *   Surface:    #FFFFFF
 *   Success:    #00A86B  (Jade)
 *   Border:     #E0E6ED
 *   Muted:      #6B7C93
 *   Warning:    #FF9500
 */
const UI = (() => {
  const COLORS = {
    primary: '#635BFF', primaryHover: '#5851DB',
    dark: '#0A2540', background: '#F6F9FC', surface: '#FFFFFF',
    success: '#00A86B', successLight: '#E6F7F0',
    border: '#E0E6ED', muted: '#6B7C93',
    text: '#1A1F36', danger: '#DF1B41', warning: '#FF9500',
  };

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ─── Stylesheet ───────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById('goapply-styles')) return;
    const style = document.createElement('style');
    style.id = 'goapply-styles';
    style.textContent = `
      .sr-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        padding: 8px 16px; border: none; border-radius: 6px;
        font-size: 13px; font-weight: 600; cursor: pointer;
        transition: all 0.15s; white-space: nowrap;
      }
      .sr-btn-primary { background: ${COLORS.primary}; color: #fff; box-shadow: 0 1px 3px rgba(99,91,255,0.2); }
      .sr-fade-in { animation: srFadeIn 0.2s ease-out; }
      @keyframes srFadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .sr-toast {
        position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;
        background: ${COLORS.dark}; color: white; padding: 10px 18px;
        border-radius: 8px; font-size: 13px; font-weight: 500;
        box-shadow: 0 8px 32px rgba(10,37,64,0.24);
        animation: srToastIn 0.3s ease-out;
      }
      @keyframes srToastIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .sr-success-modal {
        position: fixed; inset: 0; z-index: 2147483647;
        display: flex; align-items: center; justify-content: center;
        background: rgba(10,37,64,0.6);
      }
      .sr-success-content {
        background: white; border-radius: 16px; padding: 32px;
        max-width: 400px; text-align: center;
        box-shadow: 0 16px 48px rgba(10,37,64,0.2);
      }
      .sr-success-content h2 { color: ${COLORS.success}; font-size: 20px; margin-bottom: 8px; }
      .sr-success-content p { color: ${COLORS.muted}; font-size: 13px; margin-bottom: 16px; }
      .sr-submit-highlight {
        outline: 3px solid ${COLORS.success} !important; outline-offset: 4px !important;
      }
      #goapply-agent-border {
        position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;
        border: 3px solid ${COLORS.primary};
        box-shadow: inset 0 0 22px rgba(99,91,255,.3);
        animation: srAgentBorderPulse 2.4s ease-in-out infinite;
      }
      @keyframes srAgentBorderPulse {
        0%, 100% { border-color: ${COLORS.primary}; box-shadow: inset 0 0 18px rgba(99,91,255,.26); }
        50% { border-color: ${COLORS.success}; box-shadow: inset 0 0 26px rgba(0,168,107,.26); }
      }
    `;
    document.head.appendChild(style);
  }

  // A full-viewport border while the AI agent is actively working the page —
  // the same "something is driving this tab" affordance Claude for Chrome
  // shows. Appended to <html> rather than <body> so it isn't affected by
  // whatever the agent's own DOM writes are doing to body content.
  function showAgentBorder() {
    injectStyles();
    if (document.getElementById('goapply-agent-border')) return;
    const el = document.createElement('div');
    el.id = 'goapply-agent-border';
    document.documentElement.appendChild(el);
  }

  function hideAgentBorder() {
    document.getElementById('goapply-agent-border')?.remove();
  }

  function showSuccessModal(jobInfo, onClose) {
    injectStyles();
    const modal = document.createElement('div');
    modal.className = 'sr-success-modal sr-fade-in';
    modal.innerHTML = `
      <div class="sr-success-content">
        <div style="font-size:48px;margin-bottom:8px;">🎉</div>
        <h2>Application Submitted!</h2>
        <p>${jobInfo.company ? 'Your application to <strong>' + escapeHtml(jobInfo.company) + '</strong> has been tracked.' : 'Your application has been tracked.'}</p>
        <p style="font-size:12px;color:${COLORS.muted};">${escapeHtml(jobInfo.jobTitle || '')}</p>
        <button class="sr-btn sr-btn-primary" id="sr-success-close" style="margin-top:8px;">View Tracked Jobs</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#sr-success-close').addEventListener('click', () => {
      modal.remove();
      if (onClose) onClose();
    });

    // Also close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) { modal.remove(); if (onClose) onClose(); }
    });
  }

  function showToast(message, duration = 3000) {
    injectStyles();
    const toast = document.createElement('div');
    toast.className = 'sr-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function highlightField(element) {
    const origOutline = element.style.outline;
    element.style.transition = 'outline 0.2s, background 0.2s';
    element.style.outline = `2px solid ${COLORS.success}`;
    element.style.outlineOffset = '2px';
    element.style.background = COLORS.successLight;
    setTimeout(() => {
      element.style.outline = origOutline;
      element.style.background = '';
    }, 1500);
  }

  return { showSuccessModal, showToast, highlightField, showAgentBorder, hideAgentBorder, COLORS };
})();
