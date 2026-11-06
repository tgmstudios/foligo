import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { setActivePinia, createPinia } from 'pinia'

register('./support/store-loader.mjs', import.meta.url)
const { useProjectStore } = await import('../src/stores/projects.ts')

// Shape mirrors GET /api/projects (projectInclude with non-revision private content).
const row = (id: string, projectId: string, status: string, extra: Record<string, unknown> = {}) => ({
  id, projectId, type: 'BLOG', contentType: 'BLOG', title: id, slug: id, content: `body-${id}`,
  status, order: 0, revisionOf: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', ...extra,
})
const project = (id: string, isPublished: boolean, content: unknown) =>
  ({ id, name: id, ownerId: 'u1', isPublished, updatedAt: '2026-01-02T00:00:00Z', content })

let calls: string[]
function mockApi(listBody: any) {
  calls = []
  ;(globalThis as any).__fakeApi = {
    get: async (url: string) => {
      calls.push(url)
      if (url === '/projects') return { data: listBody }
      // what the real server does for the public feed of an unpublished project
      const err: any = new Error('Request failed with status code 404')
      err.response = { status: 404, data: { error: 'Not Found' } }
      throw err
    },
  }
}

beforeEach(() => setActivePinia(createPinia()))

test('fetchProjects keeps private DRAFT/HIDDEN content on unpublished and published projects and makes no public feed call', async () => {
  const unpub = [row('d1', 'p-unpub', 'DRAFT'), row('h1', 'p-unpub', 'HIDDEN')]
  const pub = [row('a', 'p-pub', 'PUBLISHED'), row('d2', 'p-pub', 'DRAFT'), row('h2', 'p-pub', 'HIDDEN')]
  mockApi({
    ownedProjects: [project('p-unpub', false, unpub), project('p-pub', true, pub)],
    memberProjects: [project('p-member', false, [row('m1', 'p-member', 'DRAFT')])],
  })
  const store = useProjectStore()
  await store.fetchProjects()

  assert.deepEqual(calls, ['/projects'])
  const byId = Object.fromEntries(store.projects.map((p) => [p.id, p.content!.map((c) => c.id)]))
  assert.deepEqual(byId, { 'p-unpub': ['d1', 'h1'], 'p-pub': ['a', 'd2', 'h2'], 'p-member': ['m1'] })
  assert.equal(store.projects[0].content![0].content, 'body-d1')
})

test('fetchProjects tolerates missing/non-array content and recentContent excludes revisions', async () => {
  mockApi({
    ownedProjects: [
      project('p1', false, undefined),
      project('p2', true, 'oops'),
      project('p3', true, [row('x', 'p3', 'DRAFT'), row('r', 'p3', 'REVISION', { revisionOf: 'x' })]),
    ],
    memberProjects: [],
  })
  const store = useProjectStore()
  await store.fetchProjects()
  assert.deepEqual(calls, ['/projects'])
  assert.deepEqual(store.projects[0].content, [])
  assert.deepEqual(store.projects[1].content, [])
  assert.deepEqual(store.recentContent.map((c) => c.id), ['x'])
})
