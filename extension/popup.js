// GoApply Popup — Apply tab + Kanban board + Foligo account management
const $ = id => document.getElementById(id);

// ─── Tab switching ──────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.tab-page').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  $(`tab-${t.dataset.tab}`).classList.add('active');
  if (t.dataset.tab === 'kanban') loadKanban();
  if (t.dataset.tab === 'account') checkAuth();
}));

// ─── APPLY TAB ──────────────────────────────────────────────────────
function setStatus(state, text) {
  $('statusDot').className = 'dot dot-' + state;
  $('statusText').textContent = text;
}

async function checkPage() {
  setStatus('idle', 'Checking...');
  $('platformInfo').style.display = 'none';
  $('autofillBtn').disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) { setStatus('error', 'No active tab'); return; }
    const r = await chrome.tabs.sendMessage(tab.id, { action: 'detect' });
    if (r?.platform) {
      setStatus('active', 'Application detected');
      $('platformInfo').style.display = 'block';
      $('platformBadge').textContent = r.platform;
      $('fieldCount').textContent = ` · ${r.fieldsFound} fields`;
      $('autofillBtn').disabled = !r.fieldsFound;
    } else if (r?.fieldsFound > 0) {
      setStatus('active', 'Form detected');
      $('platformInfo').style.display = 'block';
      $('platformBadge').textContent = 'generic';
      $('fieldCount').textContent = ` · ${r.fieldsFound} fields`;
      $('autofillBtn').disabled = false;
    } else {
      setStatus('idle', 'No application form');
    }
  } catch(e) {
    setStatus('error', 'Not active on this page');
  }

  // Auth check
  const authed = await GoApplyAPI.checkAuth().catch(() => false);
  $('authWarning').style.display = authed ? 'none' : 'block';
}

$('autofillBtn').addEventListener('click', async () => {
  $('autofillBtn').disabled = true; $('autofillBtn').textContent = 'Filling...';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action: 'autofill' });
    $('autofillBtn').textContent = '✓ Filled'; $('autofillBtn').style.background = '#00A86B';
  } catch(e) { $('autofillBtn').textContent = 'Error'; $('autofillBtn').disabled = false; }
});

$('detectBtn').addEventListener('click', async () => {
  $('detectBtn').disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action: 'run' });
  } catch(e) {}
  setTimeout(() => { $('detectBtn').disabled = false; checkPage(); }, 600);
});

$('signInBtn').addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.tab-page').forEach(x => x.classList.remove('active'));
  document.querySelector('[data-tab="account"]').classList.add('active');
  $('tab-account').classList.add('active');
  checkAuth();
});

// ─── KANBAN TAB ────────────────────────────────────────────────────
const COLORS = { SAVED:'#6B7C93', APPLIED:'#635BFF', SCREENING:'#FF9500', INTERVIEW:'#FF9500', OFFER:'#00A86B', ACCEPTED:'#00A86B', REJECTED:'#DF1B41', WITHDRAWN:'#E0E6ED', ARCHIVED:'#E0E6ED' };

async function loadKanban() {
  $('kanban-loading').style.display = 'block';
  $('kanban-board').style.display = 'none';
  try {
    const columns = await GoApplyAPI.getKanban();
    if (!columns?.length) { $('kanban-loading').textContent = 'No jobs yet.'; return; }
    $('kanban-loading').style.display = 'none';
    $('kanban-board').style.display = 'block';

    const total = columns.reduce((s,c) => s + (c.cards?.length||0), 0);
    $('kanban-count').textContent = total + ' jobs';

    $('kanban-board').innerHTML = columns.map(col => `
      <div class="kanban-col">
        <div class="kanban-col-title" style="background:${COLORS[col.status]}15;color:${COLORS[col.status]}">
          ${col.name} <span>${col.cards?.length||0}</span>
        </div>
        ${(col.cards||[]).map(card => `
          <div class="kanban-card" data-job-id="${card.application?.id}">
            <div class="company">${card.application?.company||'?'}</div>
            <div class="title">${card.application?.jobTitle||''}</div>
          </div>
        `).join('') || '<div style="font-size:10px;color:#6B7C93;padding:4px;text-align:center">—</div>'}
      </div>
    `).join('');
  } catch(e) {
    $('kanban-loading').textContent = 'Connect to Foligo to see your board.';
    $('kanban-board').style.display = 'none';
  }
}

$('openDashboardBtn').addEventListener('click', () => chrome.tabs.create({ url: 'https://foligo.tech/dashboard/jobs' }));

// ─── ACCOUNT TAB ────────────────────────────────────────────────────
let devicePollInterval = null;

async function checkAuth() {
  // Check if we're in the middle of a device-code login
  const stored = await chrome.storage.local.get('pendingDeviceCode');
  const pending = stored.pendingDeviceCode;

  const authed = await GoApplyAPI.checkAuth().catch(() => false);

  if (authed) {
    // Authenticated — clear any pending device code
    if (pending) {
      await chrome.storage.local.remove('pendingDeviceCode');
      stopPolling();
    }
    showAuthedState();
    try {
      const profile = await GoApplyAPI.getProfile();
      $('authName').textContent = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || '—';
      $('authEmail').textContent = profile.email || '—';
      const jobs = await GoApplyAPI.getJobs();
      $('authJobs').textContent = (jobs?.length||0) + ' jobs tracked';
      await loadAIProviders();
    } catch(e) {}
  } else if (pending) {
    // Mid-login — resume polling
    showDeviceCodeUI(pending.code);
    startPolling(pending.code);
  } else {
    showDisconnectedState();
  }
}

function showAuthedState() {
  $('authConnected').style.display = 'block';
  $('authDisconnected').style.display = 'none';
  $('aiSettings').style.display = 'block';
  $('deviceCodeStatus').style.display = 'none';
}

function showDisconnectedState() {
  $('authConnected').style.display = 'none';
  $('authDisconnected').style.display = 'block';
  $('aiSettings').style.display = 'none';
  $('deviceCodeStatus').style.display = 'none';
}

function showDeviceCodeUI(code) {
  $('authConnected').style.display = 'none';
  $('authDisconnected').style.display = 'block';
  $('aiSettings').style.display = 'none';
  $('deviceCodeStatus').style.display = 'block';
  $('deviceCodeDisplay').textContent = code;
  // Disable the Connect button while device code flow is active
  $('connectDeviceBtn').disabled = true;
  $('connectDeviceBtn').textContent = 'Linking...';
}

// ─── Device Code Login Flow ─────────────────────────────────────────

$('connectDeviceBtn').addEventListener('click', async () => {
  const code = GoApplyAPI.generateDeviceCode();

  // Store pending code so we can resume if popup closes
  await chrome.storage.local.set({
    pendingDeviceCode: { code, startedAt: Date.now() }
  });

  // Open the Foligo link-device page
  chrome.tabs.create({ url: `https://foligo.tech/auth/link-device?code=${code}` });

  // Show the device code UI and start polling
  showDeviceCodeUI(code);
  startPolling(code);
});

$('cancelDeviceBtn').addEventListener('click', async () => {
  stopPolling();
  await chrome.storage.local.remove('pendingDeviceCode');
  showDisconnectedState();
});

function startPolling(code) {
  stopPolling(); // Clear any existing interval
  let attempts = 0;
  const maxAttempts = 60; // 2 minutes at 2s intervals

  devicePollInterval = setInterval(async () => {
    attempts++;
    try {
      const result = await GoApplyAPI.exchangeDeviceCode(code);

      if (result.status === 'success') {
        stopPolling();
        await chrome.storage.local.remove('pendingDeviceCode');
        checkAuth(); // Refresh UI with authenticated state
        return;
      }

      // status === 'pending' — keep waiting
      if (attempts >= maxAttempts) {
        stopPolling();
        await chrome.storage.local.remove('pendingDeviceCode');
        showDisconnectedState();
        $('connectDeviceBtn').disabled = false;
        $('connectDeviceBtn').textContent = '🔗 Connect with Foligo';
        $('deviceCodeStatus').style.display = 'none';
        // Could show a toast here
      }
    } catch (e) {
      console.error('[Popup] Exchange error:', e);
      stopPolling();
      await chrome.storage.local.remove('pendingDeviceCode');
      showDisconnectedState();
    }
  }, 2000);
}

function stopPolling() {
  if (devicePollInterval) {
    clearInterval(devicePollInterval);
    devicePollInterval = null;
  }
}

// ─── Token-based login (manual paste) ────────────────────────────────

$('connectBtn').addEventListener('click', async () => {
  const token = $('tokenInput').value.trim();
  if (!token) return;
  $('connectBtn').disabled = true; $('connectBtn').textContent = 'Connecting...';
  await GoApplyAPI.setToken(token);
  const ok = await GoApplyAPI.checkAuth().catch(() => false);
  if (ok) { checkAuth(); $('tokenInput').value = ''; }
  else { $('connectBtn').textContent = 'Invalid token — try again'; $('connectBtn').disabled = false; }
});

// ─── Logout ─────────────────────────────────────────────────────────

$('signOutBtn').addEventListener('click', async () => {
  stopPolling();
  await chrome.storage.local.remove('foligoToken');
  await chrome.storage.local.remove('pendingDeviceCode');
  checkAuth();
});

// ─── Foligo links ────────────────────────────────────────────────────

$('openFoligoBtn').addEventListener('click', () => chrome.tabs.create({ url: 'https://foligo.tech/dashboard/settings' }));
$('syncNowBtn').addEventListener('click', async () => {
  $('syncNowBtn').disabled = true; $('syncNowBtn').textContent = 'Syncing...';
  try {
    const stored = await chrome.storage.local.get('profile');
    if (stored.profile) {
      await GoApplyAPI.syncProfile(stored.profile);
      $('syncNowBtn').textContent = '✓ Synced';
    }
  } catch(e) { $('syncNowBtn').textContent = '✗ Failed'; }
  setTimeout(() => { $('syncNowBtn').textContent = '🔄 Sync Profile Now'; $('syncNowBtn').disabled = false; }, 2000);
});

// ─── AI PROVIDER ─────────────────────────────────────────────────
async function loadAIProviders() {
  const select = $('aiProviderSelect');
  try {
    const { providers } = await GoApplyAPI.listAIProviders();
    select.innerHTML = '<option value="">Foligo Default (OpenCode)</option>';
    providers.forEach(p => {
      const status = p.configured ? '✓' : '✗';
      select.innerHTML += `<option value="${p.type}">${status} ${p.displayName}</option>`;
    });

    // Restore saved preference
    const saved = await GoApplyAPI.getAIPreference();
    if (saved) select.value = saved;

    // Show saved status
    const val = select.value;
    if (val) {
      $('aiProviderStatus').textContent = `Using: ${select.options[select.selectedIndex]?.text || val}`;
    }
  } catch(e) {
    select.innerHTML = '<option value="">Foligo Default (OpenCode)</option><option value="opencode">OpenCode Go</option><option value="ollama">Ollama</option>';
  }
}

$('aiProviderSelect').addEventListener('change', async () => {
  const val = $('aiProviderSelect').value;
  await GoApplyAPI.setAIPreference(val || null);
  if (val) {
    $('aiProviderStatus').textContent = `Using: ${$('aiProviderSelect').options[$('aiProviderSelect').selectedIndex]?.text || val}`;
  } else {
    $('aiProviderStatus').textContent = 'Using Foligo default provider';
  }
});

$('testAIProviderBtn').addEventListener('click', async () => {
  const val = $('aiProviderSelect').value || 'gemini';
  $('testAIProviderBtn').disabled = true;
  $('testAIProviderBtn').textContent = 'Testing...';
  try {
    const result = await GoApplyAPI.testAIProvider(val);
    if (result.ok) {
      $('aiProviderStatus').textContent = `✓ Connected (${result.latency}ms)`;
      $('aiProviderStatus').style.color = '#00A86B';
    } else {
      $('aiProviderStatus').textContent = `✗ Failed: ${result.error}`;
      $('aiProviderStatus').style.color = '#DF1B41';
    }
  } catch(e) {
    $('aiProviderStatus').textContent = `✗ Error: ${e.message}`;
    $('aiProviderStatus').style.color = '#DF1B41';
  }
  $('testAIProviderBtn').disabled = false;
  $('testAIProviderBtn').textContent = '🔬 Test Connection';
});

// ─── Messages from content script ────────────────────────────────────
chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'deviceCodeSubmitted' && msg.deviceCode) {
    // Content script on foligo.tech confirms code was submitted
    // The polling will pick up the exchange — no action needed here
    console.log('[Popup] Device code submitted by foligo page:', msg.deviceCode);
  }
});

// ─── Clean up polling when popup closes ─────────────────────────────
window.addEventListener('beforeunload', () => {
  stopPolling();
});

// ─── Init ───────────────────────────────────────────────────────────
checkPage();
checkAuth().then(auth => { if (auth) loadKanban().catch(()=>{}); });
