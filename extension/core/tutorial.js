/**
 * Tutorial — 5-step onboarding walkthrough.
 * Simplified version of the real Simplify's 13-step flow.
 */
const Tutorial = (() => {
  let currentStep = 0;
  let overlayEl = null;
  let onComplete = null;

  const STEPS = [
    {
      title: 'Welcome to OneApply! 🎉',
      body: 'Autofill job applications, track your progress, and get AI-powered resume suggestions — all from one extension.',
      button: 'Get Started',
    },
    {
      title: 'Autofill Any Application',
      body: 'When you open a job application (Lever, Greenhouse, Workday, etc.), the OneApply panel appears. Click "Autofill" to fill in your details instantly.',
      button: 'Next',
    },
    {
      title: 'Track Your Applications',
      body: 'Every submitted application is automatically tracked. View your history in the Settings page. Your job search, organized.',
      button: 'Next',
    },
    {
      title: 'Resume Score & AI',
      body: 'On job description pages, you\'ll see a Resume Match Score. Connect an AI API in Settings to get personalized cover letters and resume tailoring tips.',
      button: 'Next',
    },
    {
      title: 'You\'re All Set! 🚀',
      body: 'Go to any job application and look for the OneApply panel in the bottom-right corner. Click the extension icon to check status or change settings.',
      button: 'Start Applying',
    },
  ];

  function createOverlay(step) {
    if (overlayEl) overlayEl.remove();

    overlayEl = document.createElement('div');
    overlayEl.style.cssText = `
      position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;
      background:rgba(10,37,64,0.6);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    `;

    const isFirst = step === 0;
    const isLast = step === STEPS.length - 1;

    overlayEl.innerHTML = `
      <div style="
        background:white;border-radius:16px;padding:24px 32px;max-width:440px;
        text-align:center;box-shadow:0 16px 48px rgba(10,37,64,0.2);
        animation:srFadeIn 0.2s ease-out;
      ">
        <div style="font-size:40px;margin-bottom:12px;">
          ${['🎉','⚡','📋','📊','🚀'][step]}
        </div>
        <h2 style="font-size:18px;font-weight:700;color:#0A2540;margin-bottom:8px;">
          ${STEPS[step].title}
        </h2>
        <p style="font-size:13px;color:#6B7C93;margin-bottom:16px;line-height:1.5;">
          ${STEPS[step].body}
        </p>
        <div style="display:flex;gap:8px;align-items:center;justify-content:center;">
          ${!isFirst ? `<button id="sr-tutorial-back" style="
            padding:10px 20px;border:1px solid #E0E6ED;border-radius:8px;background:white;
            color:#6B7C93;font-size:13px;font-weight:600;cursor:pointer;
          ">← Back</button>` : ''}
          <button id="sr-tutorial-next" style="
            padding:10px 24px;border:none;border-radius:8px;
            background:${isLast ? '#00A86B' : '#635BFF'};color:white;
            font-size:13px;font-weight:600;cursor:pointer;
          ">${STEPS[step].button}</button>
        </div>
        <div style="display:flex;gap:6px;justify-content:center;margin-top:12px;">
          ${STEPS.map((_, i) => `<div style="
            width:8px;height:8px;border-radius:50%;
            background:${i === step ? '#635BFF' : '#E0E6ED'};
          "></div>`).join('')}
        </div>
        <button id="sr-tutorial-skip" style="
          margin-top:8px;background:none;border:none;color:#6B7C93;
          font-size:11px;cursor:pointer;
        ">Skip tutorial</button>
      </div>
    `;

    document.body.appendChild(overlayEl);

    overlayEl.querySelector('#sr-tutorial-next').addEventListener('click', () => {
      if (isLast) {
        finish();
      } else {
        showStep(step + 1);
      }
    });

    const backBtn = overlayEl.querySelector('#sr-tutorial-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => showStep(step - 1));
    }

    overlayEl.querySelector('#sr-tutorial-skip').addEventListener('click', finish);
  }

  function showStep(step) {
    currentStep = step;
    createOverlay(step);
  }

  function finish() {
    if (overlayEl) { overlayEl.remove(); overlayEl = null; }
    try {
      chrome.storage.local.set({ tutorialComplete: true });
    } catch(e) {}
    if (onComplete) onComplete();
  }

  async function start(callback) {
    onComplete = callback || null;
    
    // Check if already completed
    try {
      const stored = await chrome.storage.local.get('tutorialComplete');
      if (stored.tutorialComplete) {
        if (onComplete) onComplete();
        return;
      }
    } catch(e) {}
    
    showStep(0);
  }

  return { start, STEPS };
})();
