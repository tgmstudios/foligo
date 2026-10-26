const MARKETING_HOSTS = new Set(['foligo.org', 'www.foligo.org'])
const DEFAULT_DASHBOARD_ORIGIN = 'https://app.foligo.org'

// Exact routes — must match the full path.
const DASHBOARD_EXACT_PATHS = new Set([
  '/auth/link-device',
  '/auth/callback',
  '/login',
  '/signup',
  '/register',
  '/onboarding',
])

// Prefix routes — the entire authenticated dashboard app (DashboardLayout's
// child tree in dashboard/src/router/index.ts) plus the top-level /studio/*
// editors. Any bookmarked deep link under these should land on the workspace
// host, not the public marketing/portfolio site.
const DASHBOARD_PATH_PREFIXES = [
  '/dashboard',
  '/blogs',
  '/projects',
  '/experience',
  '/portfolios',
  '/content',
  '/users',
  '/admin',
  '/analytics',
  '/settings',
  '/media',
  '/goapply',
  '/studio',
]

function isDashboardPath(pathname) {
  if (DASHBOARD_EXACT_PATHS.has(pathname)) return true
  return DASHBOARD_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/**
 * Moves legacy marketing-host dashboard routes to the canonical workspace host.
 * Public portfolio pages (root "/" and everything else) remain on their
 * original host untouched. Assumes the request is already on foligo.org —
 * server/middleware/legacy-dashboard-redirect.ts migrates any foligo.tech
 * traffic to foligo.org before this check runs.
 */
export function getDashboardRedirect(url, dashboardOrigin = DEFAULT_DASHBOARD_ORIGIN) {
  const requestUrl = new URL(url)
  if (!MARKETING_HOSTS.has(requestUrl.hostname) || !isDashboardPath(requestUrl.pathname)) return null

  const target = new URL(dashboardOrigin)
  target.pathname = requestUrl.pathname
  target.search = requestUrl.search
  target.hash = requestUrl.hash
  return target.toString()
}
