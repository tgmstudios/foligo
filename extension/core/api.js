/**
 * GoApply API Client — Talks to Foligo backend.
 * All AI, profile sync, job tracking, and Kanban go through Foligo.
 * AI is model-agnostic — provider can be selected per-request.
 */
const GoApplyAPI = (() => {
  // ─── Server Endpoints ───────────────────────────────────────────
  // Lets the extension point at production, a local dev stack, or a
  // custom pair of URLs (e.g. a staging deploy) instead of hardcoding
  // api.foligo.tech everywhere.
  const ENVIRONMENTS = {
    production: { api: 'https://api.foligo.tech', web: 'https://foligo.tech' },
    local: { api: 'http://localhost:3000', web: 'http://localhost' },
  };
  const DEFAULT_ENV = 'production';

  async function getEnvironment() {
    try {
      const stored = await chrome.storage.local.get(['goapplyEnv', 'goapplyCustomEndpoints']);
      const env = stored.goapplyEnv || DEFAULT_ENV;
      if (env === 'custom') {
        const custom = stored.goapplyCustomEndpoints;
        if (custom?.api && custom?.web) return { env, ...custom };
        return { env: DEFAULT_ENV, ...ENVIRONMENTS[DEFAULT_ENV] };
      }
      return { env, ...(ENVIRONMENTS[env] || ENVIRONMENTS[DEFAULT_ENV]) };
    } catch (e) {
      return { env: DEFAULT_ENV, ...ENVIRONMENTS[DEFAULT_ENV] };
    }
  }

  async function getEndpoints() {
    const { api, web } = await getEnvironment();
    return { api, web };
  }

  async function setEnvironment(env) {
    if (env !== 'custom' && !ENVIRONMENTS[env]) throw new Error(`Unknown environment: ${env}`);
    await chrome.storage.local.set({ goapplyEnv: env });
  }

  async function setCustomEndpoints(api, web) {
    await chrome.storage.local.set({
      goapplyEnv: 'custom',
      goapplyCustomEndpoints: { api: api.replace(/\/+$/, ''), web: web.replace(/\/+$/, '') },
    });
  }

  async function getToken() {
    try {
      const stored = await chrome.storage.local.get('foligoToken');
      return stored.foligoToken || null;
    } catch(e) { return null; }
  }

  async function setToken(token) {
    await chrome.storage.local.set({ foligoToken: token });
  }

  async function getAIPreference() {
    try {
      const stored = await chrome.storage.local.get('aiProvider');
      return stored.aiProvider || null; // null = use Foligo default
    } catch(e) { return null; }
  }

  async function setAIPreference(provider) {
    await chrome.storage.local.set({ aiProvider: provider });
  }

  async function request(path, options = {}) {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated. Open Foligo dashboard to sign in.');

    const { api: BASE_URL } = await getEndpoints();
    const url = `${BASE_URL}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const resp = await fetch(url, { ...options, headers });
    if (resp.status === 401) {
      await chrome.storage.local.remove('foligoToken');
      throw new Error('Session expired. Please sign in again.');
    }
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`API ${resp.status}: ${err}`);
    }
    return resp.json();
  }

  // ─── Profile ────────────────────────────────────────────────────
  async function getProfile() { return request('/api/auth/me'); }
  // Full GoApply profile — every field the extension can autofill (Personal
  // Info, Location, Education, Experience, EEO, Work Authorization, Social &
  // Links, Other). Distinct from getProfile()/'/api/auth/me', which only
  // returns basic account identity.
  async function getGoApplyProfile() { return request('/api/goapply/profile'); }
  async function syncProfile(profile) { return request('/api/goapply/profile', { method: 'PUT', body: JSON.stringify(profile) }); }

  // ─── Jobs ───────────────────────────────────────────────────────
  async function getJobs(status) { return request('/api/goapply/jobs' + (status ? `?status=${status}` : '')); }
  async function trackJob(job) { return request('/api/goapply/jobs', { method: 'POST', body: JSON.stringify(job) }); }
  async function updateJob(id, data) { return request(`/api/goapply/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  async function deleteJob(id) { return request(`/api/goapply/jobs/${id}`, { method: 'DELETE' }); }

  // ─── Kanban ─────────────────────────────────────────────────────
  async function getKanban() { return request('/api/goapply/kanban'); }
  async function reorderCards(columnId, cardIds) { return request('/api/goapply/kanban/reorder', { method: 'PUT', body: JSON.stringify({ columnId, cardIds }) }); }

  // ─── Cover Letters ──────────────────────────────────────────────
  async function getCoverLetters() { return request('/api/goapply/cover-letters'); }
  async function saveCoverLetter(data) { return request('/api/goapply/cover-letters', { method: 'POST', body: JSON.stringify(data) }); }
  async function setDefaultCoverLetter(id) { return request(`/api/goapply/cover-letters/${id}`, { method: 'PATCH', body: JSON.stringify({ isDefault: true }) }); }

  // ─── Saved Answers ──────────────────────────────────────────────
  async function getAnswers() { return request('/api/goapply/answers'); }
  async function saveAnswer(data) { return request('/api/goapply/answers', { method: 'POST', body: JSON.stringify(data) }); }

  // ─── AI Providers ───────────────────────────────────────────────
  async function listAIProviders() { return request('/api/ai/providers'); }
  async function testAIProvider(type) { return request('/api/ai/test-provider', { method: 'POST', body: JSON.stringify({ type }) }); }

  // ─── AI Generation (model-agnostic via Foligo) ─────────────────
  async function generateCoverLetter(jobDescription, company, role, templateId) {
    const provider = await getAIPreference();
    return request('/api/ai/cover-letter', {
      method: 'POST',
      body: JSON.stringify({ jobDescription, company, role, templateId, ...(provider ? { provider } : {}) }),
    });
  }
  async function tailorResume(jobDescription, resumeText) {
    const provider = await getAIPreference();
    return request('/api/ai/tailor-resume', {
      method: 'POST',
      body: JSON.stringify({ jobDescription, resumeText, ...(provider ? { provider } : {}) }),
    });
  }
  async function generateEmail(type, company, role, recipient) {
    const provider = await getAIPreference();
    return request('/api/ai/email', {
      method: 'POST',
      body: JSON.stringify({ type, company, role, recipient, ...(provider ? { provider } : {}) }),
    });
  }
  async function generateCustomAnswer(question, jobDescription) {
    const provider = await getAIPreference();
    return request('/api/ai/custom-answer', {
      method: 'POST',
      body: JSON.stringify({ question, jobDescription, ...(provider ? { provider } : {}) }),
    });
  }

  // ─── Auth check ─────────────────────────────────────────────────
  async function checkAuth() {
    try { await getProfile(); return true; } catch(e) { return false; }
  }

  // ─── Device Code Login ────────────────────────────────────────────

  /** Generate a random 6-character alphanumeric device code */
  function generateDeviceCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for clarity
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * Exchange a device code for a JWT token.
   * Public endpoint — no auth required.
   */
  async function exchangeDeviceCode(deviceCode) {
    const { api: BASE_URL } = await getEndpoints();
    const url = `${BASE_URL}/api/auth/device-code/exchange`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceCode }),
    });

    if (resp.status === 202) {
      // Still pending — the web page hasn't submitted the code yet
      return { status: 'pending' };
    }

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Exchange failed (${resp.status}): ${err}`);
    }

    const data = await resp.json();
    // Store the token
    if (data.token) {
      await setToken(data.token);
    }
    return { status: 'success', token: data.token, user: data.user };
  }

  return {
    ENVIRONMENTS,
    getEnvironment, getEndpoints, setEnvironment, setCustomEndpoints,
    getToken, setToken, checkAuth,
    getAIPreference, setAIPreference,
    listAIProviders, testAIProvider,
    getProfile, getGoApplyProfile, syncProfile,
    getJobs, trackJob, updateJob, deleteJob,
    getKanban, reorderCards,
    getCoverLetters, saveCoverLetter, setDefaultCoverLetter,
    getAnswers, saveAnswer,
    generateCoverLetter, tailorResume, generateEmail, generateCustomAnswer,
    // Device code
    generateDeviceCode, exchangeDeviceCode,
  };
})();
