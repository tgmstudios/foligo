const MARKETING_HOSTS = new Set(['foligo.tech', 'www.foligo.tech'])
const DASHBOARD_PATHS = new Set(['/auth/link-device', '/login', '/signup', '/auth/callback'])
const DEFAULT_DASHBOARD_ORIGIN = 'https://app.foligo.tech'

/**
 * Moves legacy marketing-host dashboard routes to the canonical workspace host.
 * Public portfolio pages remain on their original host.
 */
export function getDashboardRedirect(url, dashboardOrigin = DEFAULT_DASHBOARD_ORIGIN) {
  const requestUrl = new URL(url)
  if (!MARKETING_HOSTS.has(requestUrl.hostname) || !DASHBOARD_PATHS.has(requestUrl.pathname)) return null

  const target = new URL(dashboardOrigin)
  target.pathname = requestUrl.pathname
  target.search = requestUrl.search
  target.hash = requestUrl.hash
  return target.toString()
}
