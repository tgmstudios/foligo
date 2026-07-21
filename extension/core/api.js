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
  const REQUIRED_AGENT_PROTOCOL_VERSION = 2;
  const REQUIRED_AGENT_IDENTITY = 'foligo-browser-agent';
  const REQUIRED_AGENT_TOOLS = [
    'read_page',
    'form_input',
    'computer',
    'browser_batch',
    'tabs_context_mcp',
    'tabs_create_mcp',
    'tabs_close_mcp',
    'list_foligo_documents',
    'inspect_foligo_document',
    'attach_document',
    'track_current_job',
    'list_tracked_jobs',
    'update_job_status',
  ];
  const AGENT_CAPABILITIES_TTL_MS = 60_000;
  let agentCapabilitiesCache = null;

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
    await chrome.storage.local.remove('profileFetchedAt');
    agentCapabilitiesCache = null;
  }

  async function setCustomEndpoints(api, web) {
    await chrome.storage.local.set({
      goapplyEnv: 'custom',
      goapplyCustomEndpoints: { api: api.replace(/\/+$/, ''), web: web.replace(/\/+$/, '') },
    });
    await chrome.storage.local.remove('profileFetchedAt');
    agentCapabilitiesCache = null;
  }

  async function getToken() {
    try {
      const stored = await chrome.storage.local.get('foligoToken');
      return stored.foligoToken || null;
    } catch(e) { return null; }
  }

  async function setToken(token) {
    await chrome.storage.local.set({ foligoToken: token });
    // A token can represent a different user. Never reuse the previous user's
    // profile freshness marker after login or device-code exchange.
    await chrome.storage.local.remove('profileFetchedAt');
    agentCapabilitiesCache = null;
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

    console.debug('[GoApplyAPI] Request', options.method || 'GET', path);
    const result = await sendNetworkRequest(url, { ...options, headers });
    console.debug('[GoApplyAPI] Response', options.method || 'GET', path, result?.status || 0, result?.ok ? 'ok' : 'failed');
    if (result.status === 401) {
      await chrome.storage.local.remove(['foligoToken', 'profileFetchedAt']);
      throw new Error('Session expired. Please sign in again.');
    }
    if (!result.ok) {
      throw new Error(result.networkError || `API ${result.status}: ${result.text}`);
    }
    if (!result.text) return null;
    try { return JSON.parse(result.text); }
    catch (e) { throw new Error('API returned an invalid JSON response'); }
  }

  async function sendNetworkRequest(url, options = {}) {
    // All extension pages and content scripts can reach the service worker.
    // Keep a direct-fetch fallback for tests and unusual non-extension embeds.
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      return chrome.runtime.sendMessage({
        action: 'goapplyApiRequest',
        url,
        options: {
          method: options.method || 'GET',
          headers: options.headers || {},
          body: options.body,
          binary: options.binary || false,
        },
      });
    }
    const response = await fetch(url, options);
    if (options.binary) {
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return { ok: response.ok, status: response.status, base64: btoa(binary), contentType: response.headers.get('content-type') || '' };
    }
    return { ok: response.ok, status: response.status, text: await response.text() };
  }

  /** Like request(), but for binary responses (PDF downloads) — returns a Blob. */
  async function requestBinary(path, options = {}) {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated. Open Foligo dashboard to sign in.');

    const { api: BASE_URL } = await getEndpoints();
    const url = `${BASE_URL}${path}`;
    const headers = { 'Authorization': `Bearer ${token}`, ...options.headers };

    const result = await sendNetworkRequest(url, { ...options, headers, binary: true });
    if (result.status === 401) {
      await chrome.storage.local.remove(['foligoToken', 'profileFetchedAt']);
      throw new Error('Session expired. Please sign in again.');
    }
    if (!result.ok) {
      throw new Error(result.networkError || `API ${result.status}`);
    }
    if (!result.base64) return null;
    const binary = atob(result.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: result.contentType || 'application/pdf' });
  }

  // ─── Profile ────────────────────────────────────────────────────
  async function getProfile() { return request('/api/auth/me'); }
  // Full GoApply profile — every field the extension can autofill (Personal
  // Info, Location, Education, Experience, EEO, Work Authorization, Social &
  // Links, Other). Distinct from getProfile()/'/api/auth/me', which only
  // returns basic account identity.
  async function getGoApplyProfile() { return request('/api/goapply/profile'); }
  async function syncProfile(profile) { return request('/api/goapply/profile', { method: 'PUT', body: JSON.stringify(profile) }); }
  // User-managed hiring-season categories, offered as the track-flow category
  // dropdown. Stored on the GoApply profile so they sync with the dashboard.
  async function saveJobCategories(jobCategories) {
    return request('/api/goapply/profile', { method: 'PUT', body: JSON.stringify({ jobCategories }) });
  }

  // ─── Jobs ───────────────────────────────────────────────────────
  async function getJobs(status) { return request('/api/goapply/jobs' + (status ? `?status=${status}` : '')); }
  async function trackJob(job) {
    const payload = {
      ...job,
      position: job.position || job.jobTitle,
      status: job.status ? String(job.status).toLowerCase() : undefined,
    };
    delete payload.jobTitle;
    return request('/api/goapply/jobs', { method: 'POST', body: JSON.stringify(payload) });
  }
  async function updateJob(id, data) {
    const payload = {
      ...data,
      ...(data.jobTitle && !data.position ? { position: data.jobTitle } : {}),
      ...(data.status ? { status: String(data.status).toLowerCase() } : {}),
    };
    delete payload.jobTitle;
    return request(`/api/goapply/jobs/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }
  async function deleteJob(id) { return request(`/api/goapply/jobs/${id}`, { method: 'DELETE' }); }

  // ─── Kanban ─────────────────────────────────────────────────────
  async function getKanban() {
    const board = await request('/api/goapply/kanban');
    if (Array.isArray(board)) return board;
    return Object.entries(board || {}).map(([status, jobs]) => ({
      status,
      name: status.charAt(0).toUpperCase() + status.slice(1),
      cards: (Array.isArray(jobs) ? jobs : []).map(application => ({ application })),
    }));
  }
  async function reorderCards(columnId, cardIds) { return request('/api/goapply/kanban/reorder', { method: 'PUT', body: JSON.stringify({ columnId, cardIds }) }); }

  // ─── Resumes (Foligo Resume Studio documents) ────────────────────
  async function getResumes() { return request('/api/resume/documents'); }
  async function getResume(id) { return request(`/api/resume/documents/${id}`); }
  async function getResumePdf(id) { return requestBinary(`/api/resume/documents/${id}/pdf`); }
  async function compileResumePdf(id) { return requestBinary(`/api/resume/documents/${id}/compile`, { method: 'POST' }); }
  async function updateResume(id, data) { return request(`/api/resume/documents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  // Create a résumé tailored for a tracked job. Omitting `content` makes the API
  // clone the user's default résumé template; linkedJobId attaches it to the job.
  async function createResumeForJob({ name, jobId, jobDescription } = {}) {
    return request('/api/resume/documents', {
      method: 'POST',
      body: JSON.stringify({
        ...(name ? { name } : {}),
        ...(jobId ? { linkedJobId: jobId } : {}),
        ...(jobDescription ? { jobDescription } : {}),
      }),
    });
  }

  // ─── Cover Letters ──────────────────────────────────────────────
  async function getCoverLetters() { return request('/api/goapply/cover-letters'); }
  async function getCoverLetter(id) { return request(`/api/goapply/cover-letters/${id}`); }
  async function saveCoverLetter(data) { return request('/api/goapply/cover-letters', { method: 'POST', body: JSON.stringify(data) }); }
  // Omitting `content` makes the API clone the user's default cover-letter template.
  async function createCoverLetterForJob({ jobId, title } = {}) {
    return request('/api/goapply/cover-letters', {
      method: 'POST',
      body: JSON.stringify({ title: title || 'Cover Letter', ...(jobId ? { jobId } : {}) }),
    });
  }
  async function setDefaultCoverLetter(id) { return request(`/api/goapply/cover-letters/${id}`, { method: 'PATCH', body: JSON.stringify({ isDefault: true }) }); }
  async function getCoverLetterPdf(id) { return requestBinary(`/api/goapply/cover-letters/${id}/pdf`); }
  async function compileCoverLetterPdf(id) { return requestBinary(`/api/goapply/cover-letters/${id}/compile`, { method: 'POST' }); }

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

  // ─── Agent (streaming, tool-calling) ─────────────────────────────
  // Streams over a long-lived Port instead of the one-shot sendMessage/fetch
  // above — background.js's 'goapply-agent' port listener does the real
  // fetch and relays parsed SSE frames back as they arrive.
  function openAgentPort() {
    return chrome.runtime.connect({ name: 'goapply-agent' });
  }

  async function getAgentCapabilities({ force = false } = {}) {
    const { api, env } = await getEnvironment();
    const now = Date.now();
    if (
      !force
      && agentCapabilitiesCache?.api === api
      && now - agentCapabilitiesCache.checkedAt < AGENT_CAPABILITIES_TTL_MS
    ) {
      return agentCapabilitiesCache.value;
    }

    let capabilities;
    try {
      capabilities = await request('/api/ai/agent/capabilities');
    } catch (error) {
      const endpointLabel = env === 'custom' ? `custom API ${api}` : `${env} API ${api}`;
      const compatibilityError = new Error(
        `Browser agent compatibility check failed for the ${endpointLabel}. `
        + 'This server may be offline or running an old Foligo API without full browser control. '
        + `Deploy/restart the current API, then retry. (${error.message || error})`,
      );
      compatibilityError.code = 'AGENT_BACKEND_INCOMPATIBLE';
      throw compatibilityError;
    }

    const protocolVersion = Number(capabilities?.protocolVersion || 0);
    const availableTools = new Set(Array.isArray(capabilities?.tools) ? capabilities.tools : []);
    const missingTools = REQUIRED_AGENT_TOOLS.filter((name) => !availableTools.has(name));
    if (
      capabilities?.agentIdentity !== REQUIRED_AGENT_IDENTITY
      || protocolVersion < REQUIRED_AGENT_PROTOCOL_VERSION
      || missingTools.length
    ) {
      const details = [
        capabilities?.agentIdentity !== REQUIRED_AGENT_IDENTITY
          ? `identity ${JSON.stringify(capabilities?.agentIdentity || 'missing')}`
          : null,
        protocolVersion < REQUIRED_AGENT_PROTOCOL_VERSION
          ? `protocol ${protocolVersion || 'missing'} (need ${REQUIRED_AGENT_PROTOCOL_VERSION})`
          : null,
        missingTools.length ? `missing tools: ${missingTools.join(', ')}` : null,
      ].filter(Boolean).join('; ');
      const compatibilityError = new Error(
        `The Foligo API at ${api} is outdated or incompatible with this extension (${details}). `
        + 'Deploy/restart the current API before using the browser agent.',
      );
      compatibilityError.code = 'AGENT_BACKEND_INCOMPATIBLE';
      compatibilityError.capabilities = capabilities;
      throw compatibilityError;
    }

    agentCapabilitiesCache = { api, checkedAt: now, value: capabilities };
    return capabilities;
  }

  async function buildAgentRequest(bodyObj) {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated. Open Foligo dashboard to sign in.');
    const capabilities = await getAgentCapabilities();
    const { api: BASE_URL } = await getEndpoints();
    return {
      url: `${BASE_URL}/api/ai/agent/turn`,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Foligo-Agent-Protocol': String(capabilities.protocolVersion),
        },
        body: JSON.stringify({
          ...bodyObj,
          clientAgentProtocolVersion: REQUIRED_AGENT_PROTOCOL_VERSION,
        }),
      },
    };
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
    const result = await sendNetworkRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceCode }),
    });

    if (result.status === 202) {
      // Still pending — the web page hasn't submitted the code yet
      return { status: 'pending' };
    }

    if (!result.ok) {
      throw new Error(result.networkError || `Exchange failed (${result.status}): ${result.text}`);
    }

    const data = JSON.parse(result.text);
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
    getProfile, getGoApplyProfile, syncProfile, saveJobCategories,
    getJobs, trackJob, updateJob, deleteJob,
    getKanban, reorderCards,
    getResumes, getResume, getResumePdf, compileResumePdf, updateResume, createResumeForJob,
    getCoverLetters, getCoverLetter, saveCoverLetter, createCoverLetterForJob, setDefaultCoverLetter, getCoverLetterPdf, compileCoverLetterPdf,
    getAnswers, saveAnswer,
    generateCoverLetter, tailorResume, generateEmail, generateCustomAnswer,
    openAgentPort, getAgentCapabilities, buildAgentRequest,
    // Device code
    generateDeviceCode, exchangeDeviceCode,
  };
})();
