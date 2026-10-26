import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePortfolioPage, itemHref, archiveHref } from '../utils/portfolio-routing.js'

const collections = {
  projects: [{ id: 'p1', slug: 'shared-slug', contentType: 'PROJECT', title: 'A Project' }],
  blogs: [{ id: 'b1', slug: 'shared-slug', contentType: 'BLOG', title: 'A Post' }],
  experiences: [{ id: 'e1', slug: 'acme-co', contentType: 'EXPERIENCE', title: 'Acme Co' }],
}

test('home route resolves with no path segments', () => {
  assert.deepEqual(resolvePortfolioPage([], collections), { kind: 'home' })
})

test('archive route resolves only the items belonging to that collection', () => {
  assert.deepEqual(resolvePortfolioPage(['blog'], collections), { kind: 'archive', label: 'Writing', items: collections.blogs })
  assert.deepEqual(resolvePortfolioPage(['projects'], collections), { kind: 'archive', label: 'Projects', items: collections.projects })
})

test('detail route only matches the item whose contentType matches the path prefix, even with a duplicate slug across types', () => {
  const blogDetail = resolvePortfolioPage(['blog', 'shared-slug'], collections)
  assert.equal(blogDetail.kind, 'detail')
  assert.equal(blogDetail.item.contentType, 'BLOG')

  const projectDetail = resolvePortfolioPage(['projects', 'shared-slug'], collections)
  assert.equal(projectDetail.kind, 'detail')
  assert.equal(projectDetail.item.contentType, 'PROJECT')
})

test('a slug that only exists under a different content type 404s instead of falling through to it', () => {
  // 'acme-co' only exists in experiences — requesting it under /blog must not resolve.
  assert.deepEqual(resolvePortfolioPage(['blog', 'acme-co'], collections), { kind: 'not-found' })
})

test('unknown route prefixes 404 instead of silently matching by slug alone', () => {
  assert.deepEqual(resolvePortfolioPage(['nonsense', 'shared-slug'], collections), { kind: 'not-found' })
})

test('itemHref and archiveHref agree on the same plural path prefix per content type', () => {
  for (const item of [...collections.projects, ...collections.blogs, ...collections.experiences]) {
    const href = itemHref(item)
    const archive = archiveHref(item)
    assert.ok(href.startsWith(`${archive}/`), `${href} should live under ${archive}`)
  }
})
