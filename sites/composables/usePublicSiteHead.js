import { resolveBuilderContent, builderPageMetadata } from '../utils/builder-content.mjs'
/**
 * Shared public-portfolio data + <head> logic used by both the root ("/")
 * and catch-all ("/[...slug]") pages so every route gets identical SEO
 * metadata, theme-color, favicon, and analytics injection — not just the
 * homepage.
 */
export function usePublicSiteHead(siteData, config) {
  const route = useRoute()
  const resolved = () => siteData.value?.siteConfig?.builderPublished ? resolveBuilderContent(siteData.value.siteConfig.builderPublished, route.path, siteData.value.content || {}) : null
  const metadata = () => builderPageMetadata(resolved(), siteData.value?.siteConfig?.builderPublished || {})
  useHead(() => (siteData.value ? {
    title: metadata().title || siteData.value.siteConfig?.metaTitle || siteData.value.project?.name || 'Portfolio',
    meta: [
      { name: 'description', content: metadata().description || siteData.value.siteConfig?.metaDescription || siteData.value.project?.description || '' },
      { name: 'theme-color', content: siteData.value.siteConfig?.primaryColor || '#3B82F6' }
    ],
    link: siteData.value.siteConfig?.favicon ? [{ rel: 'icon', href: siteData.value.siteConfig.favicon }] : [],
    script: config.public.analyticsKey
      ? [{ src: 'https://api.foligo.org/analytics.js', 'data-key': config.public.analyticsKey, defer: true }]
      : []
  } : {}))
}
