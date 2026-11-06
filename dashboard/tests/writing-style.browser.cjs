// Run against Vite with Playwright installed externally; all API responses are mocked.
// PLAYWRIGHT_MODULE may point to an external Playwright installation.
// node dashboard/tests/writing-style.browser.cjs http://127.0.0.1:5173
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const catalog = require('../../api/src/services/ai/writing-style-questionnaire');
const assert = require('node:assert/strict');
const base = (process.argv[2] || 'http://127.0.0.1:5173').replace(/\/$/u, '');
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}), args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; page.on('pageerror', error => errors.push(error.stack));
  let saved = null, saves = 0, previewProfile = null, rewriteRequests = 0;
  const postId = '123e4567-e89b-42d3-a456-426614174000';
  const projectId = '223e4567-e89b-42d3-a456-426614174000';
  const post = { id: postId, projectId, title: 'My post', content: '# My post\n\nOur team tested the website and fixed the navigation.', type: 'BLOG', contentType: 'BLOG', status: 'DRAFT', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await page.addInitScript(() => localStorage.setItem('auth_token', 'browser-test-token'));
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    let data = [];
    if (path === '/api/users/me/projects' || path === '/api/projects') data = { ownedProjects: [], memberProjects: [] };
    else if (path === '/api/auth/tokens') data = { tokens: [] };
    else if (path === '/api/auth/me') data = { id: 'author', name: 'Test Writer', email: 'writer@example.com', hasCompletedOnboarding: true };
    else if (path === '/api/users/me/writing-style') {
      if (method === 'PUT') { saved = route.request().postDataJSON().writingStyle; saves++; }
      data = { writingStyle: saved, questionnaire: catalog };
    } else if (path.endsWith('/writing-style/preview')) {
      previewProfile = route.request().postDataJSON().writingStyle;
      data = { text: 'We tested our website, found a navigation issue, and simplified it. Next up: preparing for launch.' };
    } else if (path.endsWith('/rewrite')) { rewriteRequests++; data = { content: '# My post\n\nWe tested the website and simplified its navigation.' }; }
    else if (path === `/api/content/${postId}`) data = post;
    else if (path === `/api/projects/${projectId}`) data = { id: projectId, name: 'My portfolio', ownerId: 'author', subdomain: 'test' };
    else if (path.endsWith('/chat-sessions') && method === 'POST') data = { id: 'session', title: 'Test', chatHistory: [] };
    else if (path.endsWith('/providers')) data = [{ type: 'test-model', displayName: 'Test model', configured: true }];
    else if (/github/.test(path)) data = { connected: false };
    await route.fulfill({ json: data });
  });
  await page.goto(`${base}/settings`);
  await page.getByRole('button', { name: 'Build my writing profile', exact: true }).click();
  await page.getByLabel('Cover letters and job applications', { exact: true }).selectOption('formal');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('input[name="tone"][value="warm-professional"]').check();
  await page.locator('input[name="enthusiasm"][value="warm"]').check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('input[name="detail"][value="concise"]').check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Corporate buzzwords', { exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: '+ Add a writing sample', exact: true }).click();
  await page.getByLabel('Writing sample 1', { exact: true }).fill('I like to start with what changed, then explain why.');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Generate a test draft', exact: true }).click();
  await page.getByText('We tested our website, found a navigation issue, and simplified it. Next up: preparing for launch.', { exact: true }).waitFor();
  assert.equal(saves, 0, 'preview must not save');
  assert.equal(previewProfile.contexts.applications, 'formal');
  await page.getByLabel('Anything else that makes writing sound like you?', { exact: true }).fill('Start with the outcome.');
  await page.getByText('Your profile changed after this draft.', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Save my writing profile', exact: true }).click();
  await page.getByText('Writing profile saved.', { exact: false }).waitFor();
  assert.equal(saved.version, 2); assert.equal(saved.tone, 'warm-professional'); assert.equal(saved.samples.length, 1);
  await page.getByRole('button', { name: 'Edit writing profile', exact: true }).click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Continue', exact: true }).click();
  assert.equal(await page.getByLabel('Writing sample 1', { exact: true }).inputValue(), saved.samples[0].text);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'mobile settings overflow');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Edit writing profile', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'mobile questionnaire overflow');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/studio/content/${projectId}/${postId}`);
  await page.getByRole('button', { name: 'Rewrite with AI', exact: true }).click();
  await page.getByRole('button', { name: 'Generate rewrite', exact: true }).click();
  await page.getByRole('button', { name: 'Apply to editor', exact: true }).waitFor();
  assert.equal(await page.getByLabel(/Suggested rewrite/).inputValue(), '# My post\n\nWe tested the website and simplified its navigation.');
  await page.getByLabel('Extra direction (optional)', { exact: true }).fill('Use short sentences.');
  assert.equal(await page.getByRole('button', { name: 'Apply to editor', exact: true }).isDisabled(), true, 'changed settings must invalidate the rewrite');
  await page.getByLabel('Extra direction (optional)', { exact: true }).fill('');
  await page.evaluate(async () => {
    const { monaco } = await import('/src/lib/monaco.ts');
    const model = monaco.editor.getModels()[0];
    model.setValue(model.getValue() + '\n\nAn unsaved edit made while rewriting.');
  });
  await page.getByText('The editor text changed after this rewrite started.', { exact: false }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Apply to editor', exact: true }).isDisabled(), true, 'changed editor must invalidate the rewrite');
  await page.getByRole('button', { name: 'Generate another rewrite', exact: true }).click();
  await page.getByRole('button', { name: 'Apply to editor', exact: true }).click();
  await page.getByText('Unsaved changes', { exact: true }).waitFor();
  assert.equal(rewriteRequests, 2);

  assert.deepEqual(errors, [], 'browser runtime errors');
  console.log('PASS: questionnaire choices, optional samples, unsaved preview, stale-preview detection, persistence, retake, mobile layout, studio rewrite review/apply, dirty state, no runtime errors.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
