/**
 * Shared public-portfolio data + <head> logic used by both the root ("/")
 * and catch-all ("/[...slug]") pages so every route gets identical SEO
 * metadata, theme-color, favicon, and analytics injection — not just the
 * homepage.
 */
export function usePublicSiteHead(siteData, config) {
  useHead(() => (siteData.value ? {
    title: siteData.value.siteConfig?.metaTitle || siteData.value.project?.name || 'Portfolio',
    meta: [
      { name: 'description', content: siteData.value.siteConfig?.metaDescription || siteData.value.project?.description || '' },
      { name: 'theme-color', content: siteData.value.siteConfig?.primaryColor || '#3B82F6' }
    ],
    link: siteData.value.siteConfig?.favicon ? [{ rel: 'icon', href: siteData.value.siteConfig.favicon }] : [],
    script: config.public.analyticsKey
      ? [{ src: 'https://api.foligo.org/analytics.js', 'data-key': config.public.analyticsKey, defer: true }]
      : []
  } : {}))
}
