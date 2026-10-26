import { getRequestURL, sendRedirect } from 'h3'
import { getDomainMigrationRedirect } from '../../utils/domain-migration.js'
import { getDashboardRedirect } from '../../utils/dashboard-routing.js'

export default defineEventHandler((event) => {
  const requestUrl = getRequestURL(event)

  // Full TLD migration takes priority: foligo.tech/* -> foligo.org/* first,
  // then the dashboard-path check runs against the already-migrated URL so
  // a legacy-domain dashboard deep link lands on app.foligo.org directly
  // instead of app.foligo.tech.
  const domainRedirect = getDomainMigrationRedirect(requestUrl.toString())
  if (domainRedirect) {
    const dashboardRedirect = getDashboardRedirect(domainRedirect, useRuntimeConfig(event).public.dashboardUrl)
    return sendRedirect(event, dashboardRedirect || domainRedirect, 308)
  }

  const dashboardRedirect = getDashboardRedirect(requestUrl.toString(), useRuntimeConfig(event).public.dashboardUrl)
  if (dashboardRedirect) return sendRedirect(event, dashboardRedirect, 308)
})
