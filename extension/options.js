// GoApply Options — Extension status + server endpoint switcher
const $ = id => document.getElementById(id);

async function refreshStatus() {
  const { web } = await GoApplyAPI.getEndpoints();
  $('openDashboardLink').href = `${web}/dashboard/settings`;
  $('dashboardHint').textContent = `${web.replace(/^https?:\/\//, '')}/dashboard · Manage profile, resumes, AI, Kanban board`;

  try {
    const authed = await GoApplyAPI.checkAuth();
    if (authed) {
      const capabilities = await GoApplyAPI.getAgentCapabilities({ force: true });
      $('syncDot').className = 'status-dot dot-on';
      $('syncStatus').textContent = `Connected · Browser agent protocol ${capabilities.protocolVersion} · ${capabilities.tools.length} tools`;
    } else {
      $('syncDot').className = 'status-dot dot-off';
      $('syncStatus').textContent = 'Disconnected — sign in from the GoApply side panel';
    }
  } catch (e) {
    $('syncDot').className = 'status-dot dot-off';
    $('syncStatus').textContent = e.message || ('Cannot reach ' + web);
  }
}

// ─── Categories (hiring seasons) ────────────────────────────────────
// Managed here and synced to the Foligo profile so the side panel's track
// dropdown and the dashboard both read the same list.
let categories = [];

function renderCategories() {
  const list = $('catList');
  list.innerHTML = '';
  if (!categories.length) {
    const empty = document.createElement('div');
    empty.className = 'cat-empty';
    empty.textContent = 'No categories yet. Add one below.';
    list.appendChild(empty);
    return;
  }
  for (const name of categories) {
    const chip = document.createElement('span');
    chip.className = 'cat-chip';
    const label = document.createElement('span');
    label.textContent = name;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.title = `Remove ${name}`;
    remove.addEventListener('click', () => saveCategories(categories.filter((c) => c !== name)));
    chip.append(label, remove);
    list.appendChild(chip);
  }
}

function showCatMsg(text, ok) {
  const el = $('catMsg');
  el.style.display = 'block';
  el.style.color = ok ? '#00A86B' : '#DF1B41';
  el.textContent = text;
}

async function saveCategories(next) {
  const cleaned = [...new Set(next.map((c) => c.trim()).filter(Boolean))].slice(0, 50);
  try {
    const profile = await GoApplyAPI.saveJobCategories(cleaned);
    categories = Array.isArray(profile?.jobCategories) ? profile.jobCategories : cleaned;
    renderCategories();
    showCatMsg('✓ Saved', true);
  } catch (e) {
    showCatMsg('✗ ' + (e.message || 'Could not save categories'), false);
  }
}

async function loadCategories() {
  try {
    const authed = await GoApplyAPI.checkAuth();
    if (!authed) { $('categoriesCard').style.display = 'none'; return; }
    const profile = await GoApplyAPI.getGoApplyProfile();
    categories = Array.isArray(profile?.jobCategories) ? profile.jobCategories : [];
    $('categoriesCard').style.display = 'block';
    renderCategories();
  } catch (e) {
    $('categoriesCard').style.display = 'none';
  }
}

$('catAddBtn').addEventListener('click', () => {
  const input = $('catInput');
  const name = input.value.trim();
  if (!name) return;
  input.value = '';
  saveCategories([...categories, name]);
});
$('catInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); $('catAddBtn').click(); }
});

async function loadEnvForm() {
  const { env, api, web } = await GoApplyAPI.getEnvironment();
  const radio = document.querySelector(`input[name="env"][value="${env}"]`);
  if (radio) radio.checked = true;
  if (env === 'custom') {
    $('customApi').value = api;
    $('customWeb').value = web;
  }
  toggleCustomFields();
}

function toggleCustomFields() {
  const isCustom = document.querySelector('input[name="env"]:checked')?.value === 'custom';
  $('customFields').classList.toggle('show', isCustom);
}

document.querySelectorAll('input[name="env"]').forEach(r => r.addEventListener('change', toggleCustomFields));

$('saveEnvBtn').addEventListener('click', async () => {
  const selected = document.querySelector('input[name="env"]:checked')?.value || 'production';
  try {
    if (selected === 'custom') {
      const api = $('customApi').value.trim();
      const web = $('customWeb').value.trim();
      if (!api || !web) throw new Error('Enter both a custom API URL and web URL.');
      await GoApplyAPI.setCustomEndpoints(api, web);
    } else {
      await GoApplyAPI.setEnvironment(selected);
    }
    $('saveMsg').style.display = 'block';
    $('saveMsg').style.color = '#00A86B';
    $('saveMsg').textContent = '✓ Saved. Reload any open job application tabs to apply.';
    await refreshStatus();
  } catch (e) {
    $('saveMsg').style.display = 'block';
    $('saveMsg').style.color = '#DF1B41';
    $('saveMsg').textContent = '✗ ' + e.message;
  }
});

loadEnvForm();
refreshStatus();
loadCategories();
