const STORAGE_PREFIX = 'foligo:preferences:'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90

function parsePreference<T>(raw: string | null, version: number): T | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== version || typeof parsed.value !== 'object') throw new Error('Invalid preference')
    return parsed.value as T
  } catch {
    return null
  }
}

export function readPreferenceCookie<T>(name: string, version: number): T | null {
  if (typeof window === 'undefined') return null
  const storageKey = `${STORAGE_PREFIX}${name}`
  let saved: T | null = null
  try {
    saved = parsePreference<T>(window.localStorage.getItem(storageKey), version)
  } catch {
    // Some privacy modes can block browser storage; fall back to legacy cookies.
  }
  if (saved) return saved

  // Preserve existing preferences once while moving from cookie storage.
  const prefix = `${encodeURIComponent(name)}=`
  const legacy = document.cookie.split('; ').find(cookie => cookie.startsWith(prefix))?.slice(prefix.length)
  const migrated = parsePreference<T>(legacy ? decodeURIComponent(legacy) : null, version)
  if (migrated) writePreferenceCookie(name, version, migrated)
  return migrated
}

export function writePreferenceCookie<T>(name: string, version: number, value: T) {
  if (typeof window === 'undefined') return
  const payload = JSON.stringify({ version, value })
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${name}`, payload)
  } catch {
    // Keep the cookie fallback below for privacy-restricted browser storage.
  }
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(payload)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`
}

export function clearPreferenceCookie(name: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${name}`)
  } catch {
    // Storage may be unavailable in a privacy-restricted context.
  }
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`
}
