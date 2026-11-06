import type { RouteLocationNormalized } from 'vue-router'

export const APP_TITLE = 'Foligo'

/** Resolve the most specific `meta.title` for a route (deepest matched record wins). */
export function resolveRouteTitle(route: Pick<RouteLocationNormalized, 'matched'>): string | undefined {
  for (let i = route.matched.length - 1; i >= 0; i--) {
    const title = route.matched[i].meta?.title
    if (typeof title === 'string' && title.trim()) return title
  }
  return undefined
}

/** "Page · Foligo", or just "Foligo" when the route has no title. */
export function formatDocumentTitle(route: Pick<RouteLocationNormalized, 'matched'>): string {
  const title = resolveRouteTitle(route)
  return title ? `${title} · ${APP_TITLE}` : APP_TITLE
}
