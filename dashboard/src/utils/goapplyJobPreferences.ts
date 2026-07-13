const COOKIE_MAX_AGE = 60 * 60 * 24 * 90

export function readPreferenceCookie<T>(name: string, version: number): T | null {
  const prefix = `${encodeURIComponent(name)}=`
  const raw = document.cookie.split('; ').find(cookie => cookie.startsWith(prefix))?.slice(prefix.length)
  if (!raw) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(raw))
    if (!parsed || parsed.version !== version || typeof parsed.value !== 'object') throw new Error('Invalid preference cookie')
    return parsed.value as T
  } catch {
    clearPreferenceCookie(name)
    return null
  }
}

export function writePreferenceCookie<T>(name: string, version: number, value: T) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(JSON.stringify({ version, value }))}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`
}

export function clearPreferenceCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`
}
