// PLAYWRIGHT_MODULE points to an external installation; APIs are mocked.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.argv[2] || 'http://127.0.0.1:5190';
const id = '123e4567-e89b-42d3-a456-426614174000';
const modelId = '223e4567-e89b-42d3-a456-426614174000';
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}), args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  let connections = [], savedConnection, savedPolicy, savedRates;
  let policy = { unlimited: true, monthlyRequests: null, monthlyTokens: null, monthlyCostUsd: null };
  const summary = () => ({ policy, groups: [], periodStart: '2026-11-01', periodEnd: '2026-12-01' });
  await page.addInitScript(() => localStorage.setItem('auth_token', 'test-token'));
  await page.route('**/api/**', async route => {
    const req = route.request(); const path = new URL(req.url()).pathname; const method = req.method(); let data = [];
    if (path === '/api/auth/me') data = { id, name: 'Test User', email: 'test@example.com', isAdmin: true, hasCompletedOnboarding: true };
    else if (path === '/api/projects' || path === '/api/users/me/projects') data = { ownedProjects: [], memberProjects: [] };
    else if (path === '/api/auth/tokens') data = { tokens: [] };
    else if (path === '/api/ai/personal/connections') data = { connections, codexLinkEnabled: false, codexLinkReason: 'Hosted services require an approved OpenAI integration.', claudeLinkReason: 'Use an Anthropic API key; Claude subscriptions cannot be linked.' };
    else if (path.startsWith('/api/ai/personal/connections/') && method === 'PUT') {
      savedConnection = req.postDataJSON(); connections = [{ id: 'c1', providerType: 'openai', ...savedConnection, apiKey: undefined, authType: 'apiKey' }]; data = { connection: connections[0] };
    } else if (path.startsWith('/api/ai/personal/connections/') && method === 'DELETE') { connections = []; data = { success: true }; }
    else if (path === '/api/ai/personal/codex/login') data = { success: true };
    else if (path === '/api/ai/personal/usage') data = summary();
    else if (path === `/api/admin/users/${id}`) data = { id, name: 'Test User', email: 'test@example.com', isAdmin: false, hasCompletedOnboarding: true, projectsOwned: [], projectAccess: [], aiModelGrants: [], _count: { projectsOwned: 0, projectAccess: 0, media: 0 }, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
    else if (path === '/api/admin/users/ai-model-catalog') data = { models: [] };
    else if (path === `/api/admin/ai-billing/users/${id}`) data = summary();
    else if (path.endsWith('/policy')) { savedPolicy = req.postDataJSON(); policy = savedPolicy; data = summary(); }
    else if (path.endsWith('/events')) data = { events: [], page: 1, pages: 0, total: 0 };
    else if (path === '/api/admin/ai-billing/models') data = { models: [{ id: modelId, name: 'Test Model', model: 'test', billingRates: null }] };
    else if (path.endsWith('/rates')) { savedRates = req.postDataJSON(); data = { success: true }; }
    else if (path === '/api/admin/ai-models/defaults') data = [];
    else if (path === '/api/admin/ai-models/voice') data = null;
    else if (/github/.test(path)) data = { connected: false };
    await route.fulfill({ json: data });
  });
  await page.goto(`${base}/settings`);
  const personal = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Your AI connections' }) });
  await personal.getByLabel('Model ID', { exact: true }).fill('gpt-test');
  await personal.getByLabel('API key', { exact: true }).fill('personal-test-secret');
  await personal.getByRole('button', { name: 'Save personal connection' }).click();
  await personal.getByText('openai · gpt-test').waitFor();
  assert.equal(savedConnection.apiKey, 'personal-test-secret');
  assert.equal(await personal.getByLabel('API key', { exact: true }).inputValue(), '');
  await personal.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await personal.getByText('No personal connections yet.').waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await personal.scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'settings mobile overflow');
  await page.goto(`${base}/admin/users/${id}`);
  await page.getByLabel('Unlimited server AI usage', { exact: true }).uncheck();
  await page.getByLabel('Monthly provider calls', { exact: true }).fill('10');
  await page.getByLabel('Monthly tokens', { exact: true }).fill('100000');
  await page.getByLabel('Monthly spend (USD)', { exact: true }).fill('5');
  await page.getByRole('button', { name: 'Save allowance' }).click();
  await page.getByText('Server AI allowance saved', { exact: true }).waitFor();
  assert.deepEqual(savedPolicy, { unlimited: false, monthlyRequests: 10, monthlyTokens: 100000, monthlyCostUsd: 5 });
  await page.getByLabel('Unlimited server AI usage', { exact: true }).check();
  await page.getByRole('button', { name: 'Save allowance' }).click();
  await page.waitForFunction(() => document.querySelector('input[type="number"]')?.matches(':disabled'));
  assert.equal(savedPolicy.unlimited, true);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${base}/admin/ai-models`);
  for (const name of ['Input', 'Output (incl. reasoning)', 'Cache read', 'Cache write']) await page.getByLabel(`Test Model ${name}`, { exact: true }).fill('1.5');
  await page.getByRole('button', { name: 'Save rates', exact: true }).click();
  await page.getByText('Billing rates saved', { exact: true }).waitFor();
  assert.deepEqual(savedRates.rates, { input: 1.5, output: 1.5, cacheRead: 1.5, cacheWrite: 1.5 });
  await page.screenshot({ path: '/tmp/personal-ai-admin.png', fullPage: true });
  assert.deepEqual(errors, []);
  await browser.close(); console.log('Personal AI settings and admin limits/rates browser checks passed (desktop and mobile).');
})().catch(error => { console.error(error); process.exit(1); });
