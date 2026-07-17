// Foligo Analytics — client-side tracking plugin
// Injects enhanced tracking snippet with fingerprinting, device detection, and flow tracking.
// Set NUXT_PUBLIC_ANALYTICS_KEY env var in your deployment to enable.
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const analyticsKey = config.public.analyticsKey as string | undefined

  if (!analyticsKey) return

  // ── Storage keys ───────────────────────────────────────────────
  const VISITOR_KEY = 'foligo_visitor_id'
  const SESSION_KEY = 'foligo_session_id'
  const VISIT_COUNT_KEY = 'foligo_visit_count'
  const PREV_PATH_KEY = 'foligo_prev_path'
  const ENTER_TIME_KEY = 'foligo_enter_time'
  const ENDPOINT = 'https://api.foligo.tech/api/analytics/events'

  // ── Init visitor/session ───────────────────────────────────────
  let visitorId = localStorage.getItem(VISITOR_KEY)
  if (!visitorId) { visitorId = crypto.randomUUID(); localStorage.setItem(VISITOR_KEY, visitorId) }

  let sessionId = sessionStorage.getItem(SESSION_KEY)
  let isNewSession = false
  if (!sessionId) { sessionId = crypto.randomUUID(); sessionStorage.setItem(SESSION_KEY, sessionId); isNewSession = true }

  let visitCount = 1
  const storedVisits = localStorage.getItem(VISIT_COUNT_KEY)
  if (isNewSession) {
    visitCount = storedVisits ? parseInt(storedVisits, 10) + 1 : 1
    localStorage.setItem(VISIT_COUNT_KEY, String(visitCount))
  } else {
    visitCount = storedVisits ? parseInt(storedVisits, 10) : 1
  }

  // ── Device detection ───────────────────────────────────────────
  const ua = navigator.userAgent

  function parseOS(): string {
    if (/Windows/i.test(ua)) return 'Windows'
    if (/Mac OS/i.test(ua)) return 'macOS'
    if (/Linux/i.test(ua) && !/Android/i.test(ua)) return 'Linux'
    if (/Android/i.test(ua)) return 'Android'
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
    if (/CrOS/i.test(ua)) return 'ChromeOS'
    return 'Other'
  }
  function parseBrowser(): string {
    if (/Edg/i.test(ua)) return 'Edge'
    if (/OPR|Opera/i.test(ua)) return 'Opera'
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Chrome'
    if (/Firefox/i.test(ua)) return 'Firefox'
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari'
    return 'Other'
  }
  function detectDeviceType(): string {
    const mobile = /Mobi|Android/i.test(ua)
    const tablet = /iPad|Tablet|PlayBook/i.test(ua) || (mobile && screen.width >= 768)
    const os = parseOS()
    if (tablet) return 'tablet'
    if (mobile) return os === 'iOS' ? 'mobile-ios' : os === 'Android' ? 'mobile-android' : 'mobile-other'
    if (os === 'Windows') return 'desktop-windows'
    if (os === 'macOS') return 'desktop-mac'
    if (os === 'Linux') return 'desktop-linux'
    return 'desktop-other'
  }

  // ── Send event ─────────────────────────────────────────────────
  function send(name: string, extra?: Record<string, unknown>) {
    const params = new URLSearchParams(location.search)
    const payload: Record<string, unknown> = {
      name,
      visitorId,
      sessionId,
      url: location.href,
      path: location.pathname,
      title: document.title,
      referrer: document.referrer || undefined,
      domain: location.hostname,
      previousPath: sessionStorage.getItem(PREV_PATH_KEY) || undefined,
      visitCount,
      os: parseOS(),
      browser: parseBrowser(),
      deviceType: detectDeviceType(),
      metadata: {
        language: navigator.language || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
        screen: screen.width && screen.height ? `${screen.width}x${screen.height}` : undefined,
        utmSource: params.get('utm_source') || undefined,
        utmMedium: params.get('utm_medium') || undefined,
        utmCampaign: params.get('utm_campaign') || undefined,
      },
      timestamp: new Date().toISOString(),
      ...extra,
    }
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Analytics-Key': analyticsKey },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {})
  }

  // ── Track page view ────────────────────────────────────────────
  function trackPageView() {
    send('page_view')
    sessionStorage.setItem(ENTER_TIME_KEY, String(Date.now()))
  }
  trackPageView()

  // ── Track SPA navigation ───────────────────────────────────────
  const router = useRouter()
  router.afterEach((to, from) => {
    // Store where we came from
    if (from && from.fullPath) {
      sessionStorage.setItem(PREV_PATH_KEY, from.fullPath)
    }
    trackPageView()
  })

  // ── Track time on page (on exit) ───────────────────────────────
  window.addEventListener('beforeunload', () => {
    const start = sessionStorage.getItem(ENTER_TIME_KEY)
    if (!start) return
    const duration = Date.now() - parseInt(start, 10)
    if (duration < 100 || duration > 3600000) return
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Analytics-Key': analyticsKey },
      body: JSON.stringify({
        name: 'page_exit',
        visitorId,
        sessionId,
        path: location.pathname,
        domain: location.hostname,
        duration,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(() => {})
  })
})
