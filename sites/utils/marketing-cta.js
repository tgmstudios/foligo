const DEFAULT_DASHBOARD_ORIGIN = 'https://app.foligo.org'
const CTA_PATHS = { login: '/login', signup: '/signup' }

/**
 * Absolute canonical dashboard URL for a landing-page CTA. Landing buttons must
 * link here directly instead of to apex /login or /signup, which only exist as
 * a redirect/bridge page. Incoming query values (e.g. ?ref=, ?next=) are kept.
 */
export function getDashboardCtaHref(kind, dashboardOrigin = DEFAULT_DASHBOARD_ORIGIN, query = {}) {
  const path = CTA_PATHS[kind]
  if (!path) throw new Error(`Unknown dashboard CTA: ${kind}`)
  const target = new URL(dashboardOrigin || DEFAULT_DASHBOARD_ORIGIN)
  target.pathname = path
  target.search = ''
  target.hash = ''
  for (const [key, value] of Object.entries(query || {})) {
    if (Array.isArray(value)) value.forEach((item) => item != null && target.searchParams.append(key, item))
    else if (value != null) target.searchParams.append(key, value)
  }
  return target.toString()
}
