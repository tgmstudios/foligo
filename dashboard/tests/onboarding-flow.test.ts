import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createOnboardingFlow, OnboardingStepError } from '../src/utils/onboardingFlow.ts'

const project = { name: 'Portfolio', description: 'd' }
const site = { wantsSite: true, subdomain: 'jane', siteName: 'Jane', primaryColor: '#3B82F6', secondaryColor: '#1E40AF' }

function makeDeps(overrides: Record<string, any> = {}) {
  const calls: any[][] = []
  const rec = (name: string, impl?: (...a: any[]) => any) => async (...args: any[]) => {
    calls.push([name, ...args])
    return impl ? impl(...args) : {}
  }
  const deps: any = {
    createProject: rec('createProject', () => ({ id: 'p1' })),
    updateProject: rec('updateProject'),
    updateSiteConfig: rec('updateSiteConfig'),
    publishProject: rec('publishProject'),
    completeOnboarding: rec('completeOnboarding'),
  }
  for (const [k, v] of Object.entries(overrides)) deps[k] = rec(k, v as any)
  return { deps, calls, names: () => calls.map((c) => c[0]) }
}

test('Back/Next repeats create exactly one project', async () => {
  const { deps, names } = makeDeps()
  const flow = createOnboardingFlow(deps)
  assert.equal(await flow.ensureProject(project), 'p1')
  assert.equal(await flow.ensureProject(project), 'p1')
  assert.equal(await flow.ensureProject(project), 'p1')
  assert.deepEqual(names(), ['createProject'])
})

test('concurrent ensureProject calls (double click) share one create', async () => {
  const { deps, names } = makeDeps()
  const flow = createOnboardingFlow(deps)
  const ids = await Promise.all([flow.ensureProject(project), flow.ensureProject(project)])
  assert.deepEqual(ids, ['p1', 'p1'])
  assert.deepEqual(names(), ['createProject'])
})

test('editing name after Back updates the existing project, never creates another', async () => {
  const { deps, calls } = makeDeps()
  const flow = createOnboardingFlow(deps)
  await flow.ensureProject(project)
  await flow.ensureProject({ name: 'Renamed', description: 'd' })
  assert.deepEqual(calls.map((c) => c[0]), ['createProject', 'updateProject'])
  assert.deepEqual(calls[1].slice(1), ['p1', { name: 'Renamed', description: 'd' }])
})

test('failed create is retryable and still creates only once successfully', async () => {
  let n = 0
  const { deps, names } = makeDeps({
    createProject: () => { if (n++ === 0) throw { response: { data: { message: 'boom' } } }; return { id: 'p9' } },
  })
  const flow = createOnboardingFlow(deps)
  await assert.rejects(flow.ensureProject(project), (e: any) => e instanceof OnboardingStepError && e.stage === 'project' && e.message === 'boom')
  assert.equal(flow.projectId, null)
  assert.equal(await flow.ensureProject(project), 'p9')
  assert.equal(names().filter((x) => x === 'createProject').length, 2)
})

test('uses the returned project id (not latest-in-list) for site setup, then completes last', async () => {
  const { deps, calls } = makeDeps()
  const flow = createOnboardingFlow(deps)
  await flow.ensureProject(project)
  await flow.finish(project, site)
  assert.deepEqual(calls.map((c) => c[0]), ['createProject', 'updateProject', 'updateSiteConfig', 'publishProject', 'completeOnboarding'])
  for (const c of calls.slice(1, 4)) assert.equal(c[1], 'p1')
  assert.deepEqual(calls[1][2], { subdomain: 'jane' })
  assert.deepEqual(calls[3].slice(1), ['p1', true])
})

test('no site wanted: completes without site calls', async () => {
  const { deps, names } = makeDeps()
  const flow = createOnboardingFlow(deps)
  await flow.finish(project, { ...site, wantsSite: false })
  assert.deepEqual(names(), ['createProject', 'completeOnboarding'])
})

for (const [failing, stage] of [['updateProject', 'subdomain'], ['updateSiteConfig', 'siteConfig'], ['publishProject', 'publish']] as const) {
  test(`${failing} failure => no completeOnboarding, stage ${stage}, retry resumes without recreating`, async () => {
    let fail = true
    const { deps, calls, names } = makeDeps({
      [failing]: () => { if (fail) throw { response: { data: { message: 'Subdomain taken' } } } },
    })
    const flow = createOnboardingFlow(deps)
    await assert.rejects(flow.finish(project, site), (e: any) => e.stage === stage && e.message === 'Subdomain taken')
    assert.ok(!names().includes('completeOnboarding'))
    fail = false
    await flow.finish(project, site)
    assert.equal(names().filter((x) => x === 'createProject').length, 1)
    assert.equal(names().filter((x) => x === 'completeOnboarding').length, 1)
    // steps that succeeded before the failure are not repeated
    if (stage === 'siteConfig') assert.equal(calls.filter((c) => c[0] === 'updateProject').length, 1)
    if (stage === 'publish') assert.equal(calls.filter((c) => c[0] === 'updateSiteConfig').length, 1)
    assert.equal(names().at(-1), 'completeOnboarding')
  })
}

test('completeOnboarding failure surfaces error, retry does not redo site steps', async () => {
  let fail = true
  const { deps, names } = makeDeps({ completeOnboarding: () => { if (fail) throw new Error('x') } })
  const flow = createOnboardingFlow(deps)
  await assert.rejects(flow.finish(project, site), (e: any) => e.stage === 'complete' && /try again/i.test(e.message))
  fail = false
  await flow.finish(project, site)
  assert.equal(names().filter((x) => x === 'publishProject').length, 1)
  assert.equal(names().filter((x) => x === 'createProject').length, 1)
})

test('changing subdomain after a failed attempt redoes the site steps', async () => {
  let fail = true
  const { deps, names } = makeDeps({ updateSiteConfig: () => { if (fail) throw new Error('x') } })
  const flow = createOnboardingFlow(deps)
  await assert.rejects(flow.finish(project, site))
  fail = false
  await flow.finish(project, { ...site, subdomain: 'jane2' })
  assert.equal(names().filter((x) => x === 'updateProject').length, 2)
  assert.equal(names().filter((x) => x === 'publishProject').length, 1)
})

test('invalid subdomain is rejected locally before any site call', async () => {
  const { deps, names } = makeDeps()
  const flow = createOnboardingFlow(deps)
  await assert.rejects(flow.finish(project, { ...site, subdomain: 'ab' }), (e: any) => e.stage === 'subdomain')
  assert.ok(!names().includes('completeOnboarding'))
  assert.ok(!names().includes('publishProject'))
})

test('publish fails, then siteName/colors edited: retry re-saves site config before publish and complete', async () => {
  let publishFails = true
  const { deps, names, calls } = makeDeps({
    publishProject: () => { if (publishFails) throw new Error('boom'); return {} },
  })
  const flow = createOnboardingFlow(deps)
  await assert.rejects(flow.finish(project, { ...site, siteName: 'Old' }), (e: any) => e.stage === 'publish')
  publishFails = false
  const edited = { ...site, siteName: 'New', primaryColor: '#111111' }
  await flow.finish(project, edited)
  const cfgCalls = calls.filter((c) => c[0] === 'updateSiteConfig')
  assert.equal(cfgCalls.length, 2)
  assert.deepEqual(cfgCalls[1][2], { siteName: 'New', primaryColor: '#111111', secondaryColor: site.secondaryColor })
  assert.deepEqual(names().slice(-3), ['updateSiteConfig', 'publishProject', 'completeOnboarding'])
  assert.equal(names().filter((n) => n === 'updateProject').length, 1) // subdomain not redone
})

test('secondaryColor edit after failed publish also re-saves config', async () => {
  let fail = true
  const { deps, names } = makeDeps({ publishProject: () => { if (fail) throw new Error('x'); return {} } })
  const flow = createOnboardingFlow(deps)
  await assert.rejects(flow.finish(project, site))
  fail = false
  await flow.finish(project, { ...site, secondaryColor: '#222222' })
  assert.equal(names().filter((n) => n === 'updateSiteConfig').length, 2)
})

test('identical fields on retry skip config save and only retry publish', async () => {
  let fail = true
  const { deps, names } = makeDeps({ publishProject: () => { if (fail) throw new Error('x'); return {} } })
  const flow = createOnboardingFlow(deps)
  await assert.rejects(flow.finish(project, site))
  fail = false
  await flow.finish(project, { ...site })
  assert.equal(names().filter((n) => n === 'updateSiteConfig').length, 1)
  assert.equal(names().filter((n) => n === 'publishProject').length, 2)
})

test('config edited after successful publish then complete failure: config and publish redone', async () => {
  let fail = true
  const { deps, names } = makeDeps({ completeOnboarding: () => { if (fail) throw new Error('x'); return {} } })
  const flow = createOnboardingFlow(deps)
  await assert.rejects(flow.finish(project, site), (e: any) => e.stage === 'complete')
  fail = false
  await flow.finish(project, { ...site, siteName: 'Changed' })
  assert.equal(names().filter((n) => n === 'updateSiteConfig').length, 2)
  assert.equal(names().filter((n) => n === 'publishProject').length, 2)
})
