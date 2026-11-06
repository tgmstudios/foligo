export interface SsoProviderDisplay {
  id: string
  name: string
  providerId: string
  icon: string | null
  buttonColor: string | null
  buttonText: string | null
}

const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const optString = (v: unknown): string | null => (typeof v === 'string' ? v : null)

// GET /api/auth/sso/providers returns an array of
// { id, name, providerId, icon, buttonColor, buttonText }. When the API is
// unreachable the SPA may answer with its HTML fallback (a string), so validate
// the shape before rendering and drop anything malformed.
export const normalizeSsoProviders = (data: unknown): SsoProviderDisplay[] => {
  if (!Array.isArray(data)) return []
  const result: SsoProviderDisplay[] = []
  for (const item of data) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue
    const p = item as Record<string, unknown>
    if (!nonEmpty(p.id) || !nonEmpty(p.name) || !nonEmpty(p.providerId)) continue
    result.push({
      id: p.id,
      name: p.name,
      providerId: p.providerId,
      icon: optString(p.icon),
      buttonColor: optString(p.buttonColor),
      buttonText: optString(p.buttonText),
    })
  }
  return result
}
