const ARCHIVE_ROUTES = {
  projects: { label: 'Projects', contentType: 'PROJECT', collectionKey: 'projects' },
  blog: { label: 'Writing', contentType: 'BLOG', collectionKey: 'blogs' },
  experiences: { label: 'Experience', contentType: 'EXPERIENCE', collectionKey: 'experiences' },
}

/**
 * Resolves a portfolio route path (already split into segments) against the
 * site's content collections. Route type is enforced from the path prefix —
 * a /blog/<slug> URL will only ever resolve a BLOG item, never a PROJECT or
 * EXPERIENCE that happens to share the same slug.
 */
export function resolvePortfolioPage(pathParts, collections) {
  const [first, slug] = pathParts
  if (!first) return { kind: 'home' }

  const archiveRoute = ARCHIVE_ROUTES[first]
  if (!archiveRoute) return { kind: 'not-found' }

  const items = collections[archiveRoute.collectionKey] || []
  if (!slug) return { kind: 'archive', label: archiveRoute.label, items }

  const item = items.find((candidate) => candidate.slug === slug)
  if (!item) return { kind: 'not-found' }
  return { kind: 'detail', item }
}

export function itemHref(item) {
  const prefix = item.contentType === 'PROJECT' ? 'projects' : item.contentType === 'BLOG' ? 'blog' : 'experiences'
  return `/${prefix}/${item.slug}`
}

export function archiveHref(item) {
  return item.contentType === 'PROJECT' ? '/projects' : item.contentType === 'BLOG' ? '/blog' : '/experiences'
}
