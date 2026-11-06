// Routing regression tests. Run from repo root or dashboard/:
//   node --test dashboard/tests/routing.test.mjs
// Loads the REAL src/router/index.ts through Vite SSR (view components are
// stubbed so no browser-only deps load) and drives real vue-router navigation
// against a minimal window/history shim. Link targets are extracted from the
// actual .vue templates with the Vue template compiler.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { parse as sfcParse } from 'vue/compiler-sfc'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// ---- minimal browser shim (vue-router's createWebHistory needs these) ----
const loc = { pathname: '/', search: '', hash: '', href: 'http://localhost/', origin: 'http://localhost', protocol: 'http:', host: 'localhost' }
const hist = {
  state: null,
  pushState(state, _t, url) { this.state = state; setLoc(url) },
  replaceState(state, _t, url) { this.state = state; setLoc(url) },
  go() {}, back() {}, forward() {},
}
function setLoc(url) {
  const u = new URL(url, 'http://localhost')
  loc.pathname = u.pathname; loc.search = u.search; loc.hash = u.hash
  loc.href = u.href
}
const stubEl = () => ({ style: {}, setAttribute() {}, appendChild() {}, content: { appendChild() {} }, insertBefore() {}, addEventListener() {} })
const doc = {
  title: '', querySelector: () => null, addEventListener() {}, removeEventListener() {}, baseURI: 'http://localhost/',
  createElement: stubEl, createElementNS: stubEl, createTextNode: stubEl, createComment: stubEl,
  head: stubEl(), body: stubEl(), documentElement: stubEl(),
}
const storage = { getItem: () => null, setItem() {}, removeItem() {}, clear() {} }
const win = {
  location: loc, history: hist, document: doc, localStorage: storage, sessionStorage: storage,
  addEventListener() {}, removeEventListener() {}, scrollX: 0, scrollY: 0, scrollTo() {},
}
Object.assign(globalThis, { window: win, location: loc, history: hist, document: doc, localStorage: storage, sessionStorage: storage })

let server, router

before(async () => {
  const stubVue = {
    name: 'stub-vue-views',
    enforce: 'pre',
    load(id) {
      if (id.endsWith('.vue')) return 'export default { name: "Stub" }'
    },
  }
  server = await createServer({
    root,
    configFile: false,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
    resolve: { alias: { '@': path.join(root, 'src') } },
    ssr: { noExternal: ['vue-toastification', 'vue-router', 'pinia'] },
    plugins: [stubVue],
  })
  const { createPinia, setActivePinia } = await server.ssrLoadModule('pinia')
  setActivePinia(createPinia())
  router = (await server.ssrLoadModule('/src/router/index.ts')).default
})

after(async () => { await server?.close() })

// ---- helpers ----
function routerLinkTargets(file) {
  const src = fs.readFileSync(path.join(root, file), 'utf8')
  const { descriptor } = sfcParse(src)
  const ast = descriptor.template.ast
  const out = []
  const walk = (n) => {
    if (n.type === 1) {
      if (n.tag === 'router-link') {
        for (const p of n.props) {
          if (p.type === 6 && p.name === 'to') out.push(p.value.content)
          if (p.type === 7 && p.name === 'bind' && p.arg?.content === 'to') {
            const exp = p.exp.content.trim()
            // `/a/${x.id}/b` -> /a/123/b ; '/a' -> /a ; object forms are skipped (not path strings)
            const m = exp.match(/^[`'"]([\s\S]*)[`'"]$/)
            if (m) out.push(m[1].replace(/\$\{[^}]*\}/g, '123'))
          }
        }
      }
      n.children?.forEach(walk)
    } else if (n.children) {
      n.children.forEach?.(walk)
    }
  }
  ast.children.forEach(walk)
  return out
}

const OWNED_VIEWS = [
  'src/views/dashboard/DashboardView.vue',
  'src/views/projects/ProjectDetailView.vue',
]

// ---- tests ----
test('every router-link path in dashboard + portfolio detail resolves to a real route', () => {
  for (const file of OWNED_VIEWS) {
    for (const target of routerLinkTargets(file)) {
      const r = router.resolve(target)
      assert.notEqual(r.name, 'not-found', `${file}: link ${target} resolves to the 404 route`)
      assert.ok(r.matched.length > 0, `${file}: link ${target} matches nothing`)
    }
  }
})

test('dashboard portfolio links point at /portfolios/:id (view) and are not /projects/:id', () => {
  const targets = routerLinkTargets('src/views/dashboard/DashboardView.vue')
  assert.ok(targets.includes('/portfolios/123'), `missing view link; got ${JSON.stringify(targets)}`)
  assert.ok(!targets.some((t) => t.startsWith('/projects/')), `dead /projects/:id link remains: ${targets}`)
  assert.equal(router.resolve('/portfolios/123').name, 'portfolio-detail')
})

test('dashboard "Recent Portfolios → View all" goes to the portfolios list, "Recent Content → View all" to a content list', () => {
  const targets = routerLinkTargets('src/views/dashboard/DashboardView.vue')
  assert.ok(targets.includes('/portfolios'), `no /portfolios link: ${targets}`)
  assert.ok(!targets.includes('/content'), '/content has no route')
  assert.ok(targets.includes('/blogs'), `no content-list link: ${targets}`)
})

test('portfolio detail "Manage Content" link targets an existing content list; not-found back link targets portfolios', () => {
  const targets = routerLinkTargets('src/views/projects/ProjectDetailView.vue')
  assert.ok(!targets.includes('/content'))
  assert.ok(targets.includes('/blogs'), `got ${targets}`)
  assert.ok(targets.includes('/portfolios'), `got ${targets}`)
})

test('content edit link still goes to the content editor route, not portfolio detail', () => {
  const targets = routerLinkTargets('src/views/dashboard/DashboardView.vue')
  assert.ok(targets.includes('/portfolios/123/content/123/edit'))
  assert.equal(router.resolve('/portfolios/p1/content/c1/edit').name, 'content-editor')
})

test('unknown URL renders a real 404 route, not a redirect', async () => {
  const r = router.resolve('/definitely/not/here')
  assert.equal(r.name, 'not-found')
  const record = r.matched[r.matched.length - 1]
  assert.equal(record.redirect, undefined, 'catch-all must not redirect')
  assert.ok(record.components?.default || record.components, 'catch-all needs a component')

  await router.push('/definitely/not/here')
  assert.equal(router.currentRoute.value.name, 'not-found')
  assert.equal(router.currentRoute.value.fullPath, '/definitely/not/here', 'URL must be preserved')
  // dead legacy dashboard links land on 404, which is why they had to be fixed
  assert.equal(router.resolve('/projects/123').name, 'not-found')
})

test('every named route declares a non-empty meta.title', () => {
  const missing = router.getRoutes().filter((r) => r.name && !(typeof r.meta?.title === 'string' && r.meta.title.trim()))
  assert.deepEqual(missing.map((r) => String(r.name)), [])
})

test('navigation updates document.title', async () => {
  await router.push('/login')
  assert.equal(router.currentRoute.value.name, 'login')
  assert.match(doc.title, /Sign in/)
  assert.match(doc.title, /Foligo/)
  await router.push('/nope-nope')
  assert.match(doc.title, /Page not found/)
  assert.match(doc.title, /Foligo/)
})
