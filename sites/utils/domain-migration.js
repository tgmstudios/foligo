const LEGACY_TLD_SUFFIX = '.foligo.tech'
const LEGACY_APEX = 'foligo.tech'

/**
 * Full-domain migration foligo.tech -> foligo.org. Applies to the apex,
 * www, and every portfolio/service subdomain, preserving path/query/hash.
 * Returns null for anything not on the legacy TLD (including hosts that
 * already are foligo.org, localhost, and unrelated domains).
 */
export function getDomainMigrationRedirect(url) {
  const requestUrl = new URL(url)
  const hostname = requestUrl.hostname

  const isLegacy = hostname === LEGACY_APEX || hostname.endsWith(LEGACY_TLD_SUFFIX)
  if (!isLegacy) return null

  const target = new URL(url)
  target.hostname = hostname === LEGACY_APEX
    ? 'foligo.org'
    : `${hostname.slice(0, -LEGACY_TLD_SUFFIX.length)}.foligo.org`
  return target.toString()
}
