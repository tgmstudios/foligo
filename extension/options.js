// GoApply Options — Extension status + server endpoint switcher
const $ = id => document.getElementById(id);

async function refreshStatus() {
  const { web } = await GoApplyAPI.getEndpoints();
  $('openDashboardLink').href = `${web}/dashboard/settings`;
  $('dashboardHint').textContent = `${web.replace(/^https?:\/\//, '')}/dashboard · Manage profile, resumes, AI, Kanban board`;

  try {
    const authed = await GoApplyAPI.checkAuth();
    if (authed) {
      $('syncDot').className = 'status-dot dot-on';
      $('syncStatus').textContent = 'Connected';
    } else {
      $('syncDot').className = 'status-dot dot-off';
      $('syncStatus').textContent = 'Disconnected — sign in from the extension popup';
    }
  } catch (e) {
    $('syncDot').className = 'status-dot dot-off';
    $('syncStatus').textContent = 'Cannot reach ' + web;
  }
}

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
