/**
 * UI — Stripe-inspired overlay with full feature panel.
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

  let rootEl = null;

  // ─── Stylesheet ───────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById('goapply-styles')) return;
    const style = document.createElement('style');
    style.id = 'goapply-styles';
    style.textContent = `
      #goapply-root {
        position: fixed; z-index: 2147483646;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px; line-height: 1.5; color: ${COLORS.text};
        pointer-events: none;
      }
      #goapply-root * { box-sizing: border-box; pointer-events: auto; }
      .sr-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        padding: 8px 16px; border: none; border-radius: 6px;
        font-size: 13px; font-weight: 600; cursor: pointer;
        transition: all 0.15s; white-space: nowrap;
      }
      .sr-btn-primary { background: ${COLORS.primary}; color: #fff; box-shadow: 0 1px 3px rgba(99,91,255,0.2); }
      .sr-btn-primary:hover { background: ${COLORS.primaryHover}; transform: translateY(-1px); }
      .sr-btn-success { background: ${COLORS.success}; color: #fff; }
      .sr-btn-secondary { background: ${COLORS.surface}; color: ${COLORS.dark}; border: 1px solid ${COLORS.border}; }
      .sr-btn-secondary:hover { background: ${COLORS.background}; }
      .sr-btn-sm { padding: 4px 10px; font-size: 11px; }
      .sr-btn-block { display: flex; width: 100%; }
      .sr-panel {
        background: ${COLORS.surface}; border: 1px solid ${COLORS.border};
        border-radius: 12px; padding: 16px; min-width: 280px; max-width: 340px;
        box-shadow: 0 8px 32px rgba(10,37,64,0.12), 0 1px 4px rgba(10,37,64,0.04);
      }
      .sr-panel-header {
        font-size: 15px; font-weight: 700; color: ${COLORS.dark}; margin-bottom: 2px;
      }
      .sr-panel-subtitle { font-size: 11px; color: ${COLORS.muted}; margin-bottom: 12px; }
      .sr-badge {
        display: inline-flex; align-items: center; gap: 3px;
        padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600;
      }
      .sr-badge-success { background: ${COLORS.successLight}; color: ${COLORS.success}; }
      .sr-badge-warning { background: #FFF8E7; color: ${COLORS.warning}; }
      .sr-badge-muted { background: ${COLORS.background}; color: ${COLORS.muted}; }
      .sr-field-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 5px 0; border-bottom: 1px solid ${COLORS.border}; font-size: 12px;
      }
      .sr-field-row:last-child { border-bottom: none; }
      .sr-separator { height: 1px; background: ${COLORS.border}; margin: 10px 0; }
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
      .sr-stat-row {
        display: flex; gap: 16px; margin: 12px 0;
      }
      .sr-stat {
        flex: 1; text-align: center; padding: 8px;
        background: ${COLORS.background}; border-radius: 8px;
      }
      .sr-stat-value { font-size: 18px; font-weight: 700; color: ${COLORS.dark}; }
      .sr-stat-label { font-size: 10px; color: ${COLORS.muted}; text-transform: uppercase; }
      .sr-submit-highlight {
        outline: 3px solid ${COLORS.success} !important; outline-offset: 4px !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Mount / unmount ─────────────────────────────────────────────

  function mount() {
    if (rootEl) return rootEl;
    injectStyles();
    rootEl = document.createElement('div');
    rootEl.id = 'goapply-root';
    document.body.appendChild(rootEl);
    rootEl.style.right = '16px';
    rootEl.style.bottom = '16px';
    return rootEl;
  }

  function unmount() {
    if (rootEl) { rootEl.remove(); rootEl = null; }
  }

  // ─── Full panel with all features ────────────────────────────────

  function renderPanel(platform, foundFields, jobInfo, appCount, onAutofill, onClose, onSubmitFound, onPreview) {
    const root = mount();
    if (!root) return;

    const filledCount = foundFields.length;
    const totalFields = (platform.config.inputSelectors || []).length;
    const percent = totalFields > 0 ? Math.round((filledCount / totalFields) * 100) : 0;

    root.innerHTML = `
      <div class="sr-panel sr-fade-in">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
          <div>
            <div class="sr-panel-header">⚡ GoApply by Foligo</div>
            <div class="sr-panel-subtitle">
              <span class="sr-badge sr-badge-success">${platform.platform}</span>
              ${jobInfo.company ? `<span style="color:${COLORS.dark};font-size:12px;"> · ${jobInfo.company}</span>` : ''}
            </div>
          </div>
          <button class="sr-btn sr-btn-secondary sr-btn-sm" id="sr-close" style="padding:2px 6px;font-size:14px;">×</button>
        </div>

        <!-- Stats row -->
        <div class="sr-stat-row">
          <div class="sr-stat">
            <div class="sr-stat-value">${filledCount}</div>
            <div class="sr-stat-label">Fields Found</div>
          </div>
          <div class="sr-stat">
            <div class="sr-stat-value">${percent}%</div>
            <div class="sr-stat-label">Coverage</div>
          </div>
          <div class="sr-stat">
            <div class="sr-stat-value">${appCount}</div>
            <div class="sr-stat-label">Tracked</div>
          </div>
        </div>

        <!-- Field list (collapsible) -->
        <div id="sr-fields-toggle" style="font-size:11px;color:${COLORS.muted};cursor:pointer;margin:4px 0;">
          ▸ Show ${filledCount} detected fields
        </div>
        <div id="sr-field-list" style="display:none;max-height:150px;overflow-y:auto;margin-bottom:8px;"></div>

        <div class="sr-separator"></div>

        <!-- Action buttons -->
        <button class="sr-btn sr-btn-primary sr-btn-block" id="sr-autofill" style="margin-bottom:6px;">
          ⚡ Autofill ${filledCount} Fields
        </button>

        <div style="display:flex;gap:6px;">
          <button class="sr-btn sr-btn-secondary" id="sr-track-btn" style="flex:1;font-size:12px;">
            📋 Track Job
          </button>
          <button class="sr-btn sr-btn-secondary" id="sr-submit-btn" style="flex:1;font-size:12px;">
            🎯 Find Submit
          </button>
        </div>
      </div>
    `;

    // Populate field list
    const listEl = root.querySelector('#sr-field-list');
    for (const field of foundFields.slice(0, 20)) {
      const row = document.createElement('div');
      row.className = 'sr-field-row';
      const name = field.fieldName.replace(/_/g, ' ');
      const docKind = field.method === 'uploadResume' ? 'resume' : field.method === 'uploadCoverLetter' ? 'coverLetter' : null;
      const badge = docKind === 'resume' ? '📎 resume' :
                    docKind === 'coverLetter' ? '📎 cover letter' :
                    field.method === 'writeCoverLetter' ? '✏️ text' : 'detected';
      const badgeClass = docKind ? 'sr-badge-warning' : 'sr-badge-muted';
      const previewBtn = docKind
        ? `<button class="sr-preview-btn" data-kind="${docKind}" title="Preview" style="background:none;border:none;cursor:pointer;font-size:12px;padding:0 4px;">👁</button>`
        : '';
      row.innerHTML = `<span>${name}</span><span>${previewBtn}<span class="sr-badge ${badgeClass}">${badge}</span></span>`;
      listEl.appendChild(row);
    }

    // Preview a resume/cover letter without leaving the page
    listEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.sr-preview-btn');
      if (!btn) return;
      e.stopPropagation();
      if (onPreview) onPreview(btn.dataset.kind);
    });

    // Toggle field list
    root.querySelector('#sr-fields-toggle').addEventListener('click', () => {
      const list = root.querySelector('#sr-field-list');
      const toggle = root.querySelector('#sr-fields-toggle');
      if (list.style.display === 'none') {
        list.style.display = 'block';
        toggle.textContent = '▾ Hide fields';
      } else {
        list.style.display = 'none';
        toggle.textContent = `▸ Show ${filledCount} detected fields`;
      }
    });

    // Autofill
    root.querySelector('#sr-autofill').addEventListener('click', () => {
      const btn = root.querySelector('#sr-autofill');
      btn.disabled = true;
      btn.textContent = 'Filling...';
      onAutofill();
    });

    // Track job
    root.querySelector('#sr-track-btn').addEventListener('click', async () => {
      const btn = root.querySelector('#sr-track-btn');
      btn.disabled = true;
      btn.textContent = 'Tracking...';
      try {
        const result = await Tracker.trackApplication(jobInfo, 'saved');
        btn.textContent = result.created ? '✓ Tracked' : '✓ On board';
        btn.style.color = COLORS.success;
        showToast(result.created ? 'Job added to your Foligo board' : 'Job is already on your Foligo board');
      } catch (error) {
        console.error('[GoApply] Track failed:', error.message);
        btn.textContent = 'Track failed — retry';
        btn.style.color = COLORS.danger;
        btn.disabled = false;
        showToast(`Track failed: ${error.message}`);
      }
    });

    // Find submit button
    root.querySelector('#sr-submit-btn').addEventListener('click', () => {
      const submitBtn = Tracker.findSubmitButton(platform.config);
      if (submitBtn) {
        Tracker.highlightSubmitButton(submitBtn);
        if (onSubmitFound) onSubmitFound(submitBtn);
        showToast('🎯 Submit button highlighted');
      } else {
        showToast('⚠ No submit button found');
      }
    });

    // Close
    root.querySelector('#sr-close').addEventListener('click', () => {
      unmount();
      if (onClose) onClose();
    });
  }

  function updateAutofillProgress(completed, total, customMsg) {
    if (!rootEl) return;
    const btn = rootEl.querySelector('#sr-autofill');
    if (btn) {
      if (customMsg) {
        btn.textContent = customMsg;
      } else {
        btn.textContent = `Processing ${completed}/${total}`;
      }
    }
  }

  function showSuccessModal(jobInfo, onClose) {
    const modal = document.createElement('div');
    modal.className = 'sr-success-modal sr-fade-in';
    modal.innerHTML = `
      <div class="sr-success-content">
        <div style="font-size:48px;margin-bottom:8px;">🎉</div>
        <h2>Application Submitted!</h2>
        <p>${jobInfo.company ? 'Your application to <strong>' + jobInfo.company + '</strong> has been tracked.' : 'Your application has been tracked.'}</p>
        <p style="font-size:12px;color:${COLORS.muted};">${jobInfo.jobTitle || ''}</p>
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

  return {
    mount, unmount, renderPanel, updateAutofillProgress,
    showSuccessModal, showToast, highlightField, COLORS,
  };
})();
