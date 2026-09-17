<template>
  <div class="portfolio" :class="`template-${templateId}`" :style="themeStyle">
    <header class="site-header">
      <NuxtLink to="/" class="brand">{{ config.profileName || config.siteName || site.name }}</NuxtLink>
      <nav aria-label="Portfolio navigation">
        <NuxtLink to="/">Work</NuxtLink>
        <NuxtLink v-if="collections.blogs.length" to="/blog">Writing</NuxtLink>
        <NuxtLink v-if="collections.experiences.length" to="/experiences">Experience</NuxtLink>
      </nav>
    </header>

    <main v-if="page.kind === 'home'">
      <section class="hero">
        <p class="eyebrow">{{ config.templateSettings?.eyebrow || 'Selected work' }}</p>
        <img v-if="config.profileImage" class="avatar" :src="config.profileImage" :alt="config.profileName || site.name">
        <h1>{{ config.profileName || config.siteName || site.name }}</h1>
        <p class="lede">{{ config.profileBio || config.siteDescription || site.description }}</p>
        <div v-if="socialLinks.length" class="socials">
          <a v-for="link in socialLinks" :key="link.name" :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.name }}</a>
        </div>
      </section>

      <section v-for="section in sections" :key="section.key" class="collection">
        <div class="section-heading"><p>{{ section.label }}</p><NuxtLink :to="section.href">View all</NuxtLink></div>
        <div class="cards">
          <NuxtLink v-for="item in section.items.slice(0, 6)" :key="item.id" :to="itemHref(item)" class="card">
            <img v-if="item.featuredImage" :src="item.featuredImage" :alt="item.title" loading="lazy">
            <div class="card-copy"><p class="card-type">{{ item.contentType.toLowerCase() }}</p><h2>{{ item.title }}</h2><p>{{ item.excerpt }}</p></div>
          </NuxtLink>
        </div>
      </section>
    </main>

    <main v-else-if="page.kind === 'archive'" class="archive">
      <p class="eyebrow">Archive</p><h1>{{ page.label }}</h1>
      <div class="cards">
        <NuxtLink v-for="item in page.items" :key="item.id" :to="itemHref(item)" class="card">
          <img v-if="item.featuredImage" :src="item.featuredImage" :alt="item.title" loading="lazy">
          <div class="card-copy"><p class="card-type">{{ item.contentType.toLowerCase() }}</p><h2>{{ item.title }}</h2><p>{{ item.excerpt }}</p></div>
        </NuxtLink>
      </div>
    </main>

    <main v-else class="detail">
      <NuxtLink class="back" :to="archiveHref(page.item)">← Back to {{ typeLabel(page.item.contentType) }}</NuxtLink>
      <p class="eyebrow">{{ page.item.contentType.toLowerCase() }}</p>
      <h1>{{ page.item.title }}</h1><p class="lede">{{ page.item.excerpt }}</p>
      <img v-if="page.item.featuredImage" class="feature" :src="page.item.featuredImage" :alt="page.item.title">
      <article v-html="renderMarkdown(page.item.content || '')" />
    </main>

    <footer>© {{ new Date().getFullYear() }} {{ config.siteName || site.name }} · <a href="https://foligo.tech">Built with Foligo</a></footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { renderMarkdown } from '~/utils/markdownRenderer'

const props = defineProps({ siteData: { type: Object, required: true }, route: { type: Object, required: true } })
const site = computed(() => props.siteData.project || {})
const config = computed(() => props.siteData.siteConfig || {})
const templateId = computed(() => ['studio', 'editorial', 'terminal'].includes(config.value.templateId) ? config.value.templateId : 'studio')
const collections = computed(() => props.siteData.content || { projects: [], blogs: [], experiences: [] })
const socialLinks = computed(() => Object.entries(config.value.socialLinks || {}).filter(([, url]) => Boolean(url)).map(([name, url]) => ({ name, url })))
const themeStyle = computed(() => ({ '--accent': config.value.primaryColor || '#6d5dfc', '--ink': config.value.textColor || '#172033', '--paper': config.value.backgroundColor || '#f8f7f4', '--muted': `${config.value.textColor || '#172033'}a8` }))
const sections = computed(() => [
  { key: 'projects', label: 'Projects', href: '/projects', items: collections.value.projects || [] },
  { key: 'blogs', label: 'Writing', href: '/blog', items: collections.value.blogs || [] },
  { key: 'experiences', label: 'Experience', href: '/experiences', items: collections.value.experiences || [] }
].filter(section => section.items.length))
const pathParts = computed(() => props.route.path.split('/').filter(Boolean))
const allItems = computed(() => [...(collections.value.projects || []), ...(collections.value.blogs || []), ...(collections.value.experiences || [])])
const page = computed(() => {
  const [first, slug] = pathParts.value
  if (!first) return { kind: 'home' }
  const map = { projects: ['Projects', collections.value.projects || []], blog: ['Writing', collections.value.blogs || []], experiences: ['Experience', collections.value.experiences || []] }
  if (!slug && map[first]) return { kind: 'archive', label: map[first][0], items: map[first][1] }
  const item = allItems.value.find(candidate => candidate.slug === (slug || first))
  return item ? { kind: 'detail', item } : { kind: 'archive', label: 'Work', items: [] }
})
function itemHref(item) { return `/${item.contentType === 'PROJECT' ? 'project' : item.contentType === 'BLOG' ? 'blog' : 'experience'}/${item.slug}` }
function archiveHref(item) { return item.contentType === 'PROJECT' ? '/projects' : item.contentType === 'BLOG' ? '/blog' : '/experiences' }
function typeLabel(type) { return type === 'BLOG' ? 'Writing' : type === 'EXPERIENCE' ? 'Experience' : 'Projects' }
</script>

<style scoped>
.portfolio { min-height:100vh; background:var(--paper); color:var(--ink); font-family:Inter,ui-sans-serif,system-ui,sans-serif; padding:0 clamp(1.25rem,5vw,5rem); }
.site-header, footer { max-width:1180px; margin:auto; display:flex; justify-content:space-between; align-items:center; padding:1.6rem 0; border-bottom:1px solid color-mix(in srgb,var(--ink) 12%,transparent); }
.brand { font-weight:800; letter-spacing:-.04em; color:inherit; text-decoration:none; } nav { display:flex; gap:1.25rem; } nav a, footer a,.back { color:inherit; text-decoration:none; font-size:.92rem; } nav a.router-link-active { color:var(--accent); }
main { max-width:1180px; margin:auto; padding:clamp(4rem,10vw,9rem) 0; } .hero { max-width:850px; padding-bottom:5rem; } .eyebrow,.card-type { color:var(--accent); font-size:.72rem; font-weight:800; letter-spacing:.13em; text-transform:uppercase; } h1 { font-size:clamp(3rem,8vw,7rem); line-height:.93; letter-spacing:-.08em; margin:.75rem 0 1.25rem; } .lede { max-width:650px; color:var(--muted); font-size:clamp(1.1rem,2vw,1.45rem); line-height:1.6; } .avatar { width:76px;height:76px;object-fit:cover;border-radius:999px;margin-bottom:1.5rem; }
.socials{display:flex;gap:1rem;margin-top:1.5rem}.socials a{color:var(--accent);font-weight:700}.collection{margin-top:5rem}.section-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;font-weight:800}.section-heading a{color:var(--accent);font-size:.9rem}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}.card{color:inherit;text-decoration:none;border:1px solid color-mix(in srgb,var(--ink) 12%,transparent);background:color-mix(in srgb,var(--paper) 94%,var(--accent));transition:transform .2s,box-shadow .2s}.card:hover{transform:translateY(-4px);box-shadow:0 18px 38px color-mix(in srgb,var(--ink) 16%,transparent)}.card img{width:100%;height:210px;object-fit:cover}.card-copy{padding:1.25rem}.card h2{font-size:1.35rem;letter-spacing:-.04em;margin:.4rem 0}.card-copy>p:last-child{color:var(--muted);font-size:.92rem;line-height:1.5}.archive h1,.detail h1{font-size:clamp(3rem,7vw,6rem)}.detail{max-width:760px}.feature{width:100%;max-height:520px;object-fit:cover;margin:2.5rem 0}.detail article{font-size:1.08rem;line-height:1.8}.detail :deep(h2),.detail :deep(h3){margin-top:2.2rem;letter-spacing:-.04em}.detail :deep(a){color:var(--accent)}.back{display:inline-block;margin-bottom:3rem;color:var(--accent);font-weight:700}footer{border-top:1px solid color-mix(in srgb,var(--ink) 12%,transparent);border-bottom:0;color:var(--muted);font-size:.85rem}
.template-editorial{font-family:Georgia,'Times New Roman',serif}.template-editorial .brand,.template-editorial nav,.template-editorial .eyebrow,.template-editorial .card-type{font-family:Inter,system-ui,sans-serif}.template-editorial h1{letter-spacing:-.06em}.template-editorial .cards{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}.template-terminal{background:#101314;color:#d3fbd8;--paper:#101314!important;--ink:#d3fbd8!important;--muted:#9ab59d!important}.template-terminal .site-header,.template-terminal footer,.template-terminal .card{border-color:#31503a}.template-terminal .card{background:#16201a}.template-terminal .card:hover{box-shadow:0 18px 38px #000}.template-terminal h1{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:-.07em}.template-terminal .brand::before{content:'> ';color:var(--accent)}
@media(max-width:640px){.site-header{align-items:flex-start;gap:1rem;flex-direction:column}.cards{grid-template-columns:1fr}nav{gap:.9rem}main{padding:4rem 0}}
</style>
