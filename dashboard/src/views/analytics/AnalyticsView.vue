<template>
  <div class="p-6">
    <div class="space-y-8">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">Analytics</h1>
          <p class="mt-1 text-sm text-gray-400">Traffic and engagement for {{ selectedProject?.name || 'your portfolio' }}</p>
        </div>
        <div class="inline-flex self-start rounded-md border border-gray-600 bg-gray-800 p-1" aria-label="Date range">
          <button v-for="option in ranges" :key="option.days" type="button"
            class="min-w-14 rounded px-3 py-1.5 text-sm font-medium transition-colors"
            :class="days === option.days ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'"
            @click="days = option.days">
            {{ option.label }}
          </button>
        </div>
      </header>

      <div v-if="!selectedProject" class="card py-16 text-center">
        <ChartBarIcon class="mx-auto h-9 w-9 text-gray-600" />
        <p class="mt-3 text-sm text-gray-300">Select a portfolio from the top bar to view its analytics.</p>
      </div>

      <template v-else>
        <div v-if="loading" class="stats-grid">
          <div v-for="i in 9" :key="i" class="card h-24 animate-pulse p-4"><div class="h-3 w-20 rounded bg-gray-700"></div><div class="mt-4 h-7 w-16 rounded bg-gray-700"></div></div>
        </div>

        <section v-else-if="summary?.configured" class="space-y-8">
          <section class="stats-grid" aria-label="Analytics overview">
            <div v-for="metric in metrics" :key="metric.label" class="card min-w-0 p-4">
              <div class="flex min-h-16 items-center gap-3">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" :class="metric.iconClass">
                  <component :is="metric.icon" class="h-5 w-5" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-xs font-medium text-gray-400" :title="metric.label">{{ metric.label }}</p>
                  <p class="mt-1 truncate text-xl font-semibold tabular-nums text-white" :title="metric.formatted || formatNumber(metric.value)">{{ metric.formatted || formatNumber(metric.value) }}</p>
                </div>
              </div>
            </div>
          </section>

          <section class="card p-6">
            <div class="mb-6 flex items-center justify-between">
              <div><h2 class="text-sm font-semibold text-white">Traffic trend</h2><p class="mt-1 text-xs text-gray-500">Page views and unique visitors, UTC</p></div>
              <div class="flex gap-4 text-xs text-gray-400"><span class="flex items-center gap-2"><i class="h-2 w-2 rounded-full bg-primary-500"></i>Views</span><span class="flex items-center gap-2"><i class="h-2 w-2 rounded-full bg-purple-500"></i>Visitors</span></div>
            </div>
            <div class="h-72"><Line :data="chartData" :options="chartOptions" /></div>
          </section>

          <section class="grid gap-6 lg:grid-cols-3">
            <RankingTable title="Top pages" empty="No page views yet" :rows="summary.topPages" :show-duration="true" />
            <RankingTable title="Top referrers" empty="No referrers yet" :rows="summary.topReferrers" />
            <RankingTable title="Top events" empty="No events yet" :rows="summary.topEvents" />
          </section>

          <section>
            <h2 class="mb-3 text-base font-semibold text-white">Geography</h2>
            <div class="grid gap-6 lg:grid-cols-3">
            <RankingTable title="Top countries" empty="No country data yet" :rows="summary.topCountries" :is-country="true" />
            <RankingTable title="Top cities" empty="No city data yet" :rows="summary.topCities || []" />
            <RankingTable title="Top regions" empty="No region data yet" :rows="summary.topRegions || []" />
            </div>
          </section>

          <section>
            <h2 class="mb-3 text-base font-semibold text-white">Content &amp; navigation</h2>
            <div class="grid gap-6 lg:grid-cols-3">
              <RankingTable title="Entry pages" empty="No entry page data yet" :rows="summary.entryPages || []" />
              <RankingTable title="Exit pages" empty="No exit page data yet" :rows="summary.exitPages || []" />
              <RankingTable title="Navigation flows" empty="No navigation data yet" :rows="summary.topTransitions || []" />
            </div>
          </section>

          <section>
            <h2 class="mb-3 text-base font-semibold text-white">Acquisition</h2>
            <div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
              <RankingTable title="Tracked sites" empty="No site data yet" :rows="summary.topDomains || []" />
              <RankingTable title="UTM sources" empty="No campaign sources yet" :rows="summary.utmSources || []" />
              <RankingTable title="UTM mediums" empty="No campaign mediums yet" :rows="summary.utmMediums || []" />
              <RankingTable title="UTM campaigns" empty="No campaigns yet" :rows="summary.utmCampaigns || []" />
            </div>
          </section>

          <section>
            <h2 class="mb-3 text-base font-semibold text-white">Activity patterns <span class="text-xs font-normal text-gray-500">(UTC)</span></h2>
            <div class="grid gap-6 lg:grid-cols-2">
              <RankingTable title="Hours of day" empty="No hourly activity yet" :rows="summary.hourlyActivity || []" />
              <RankingTable title="Days of week" empty="No weekday activity yet" :rows="summary.weekdayActivity || []" />
            </div>
          </section>

          <section class="card overflow-hidden">
            <div class="flex border-b border-gray-700" role="tablist">
              <button v-for="tab in deviceTabs" :key="tab.key" type="button" role="tab"
                class="px-4 py-3 text-sm font-medium transition-colors"
                :class="deviceTab === tab.key ? 'border-b-2 border-primary-500 text-white' : 'text-gray-400 hover:text-white'"
                @click="deviceTab = tab.key">{{ tab.label }}</button>
            </div>
            <div class="p-6">
              <RankingTable v-if="deviceTab === 'device'" title="Device types" empty="No device data yet" :rows="summary.deviceBreakdown || []" />
              <RankingTable v-if="deviceTab === 'os'" title="Operating systems" empty="No OS data yet" :rows="summary.osBreakdown || []" />
              <RankingTable v-if="deviceTab === 'browser'" title="Browsers" empty="No browser data yet" :rows="summary.browserBreakdown || []" />
              <RankingTable v-if="deviceTab === 'language'" title="Languages" empty="No language data yet" :rows="summary.languages || []" />
              <RankingTable v-if="deviceTab === 'timezone'" title="Timezones" empty="No timezone data yet" :rows="summary.timezones || []" />
              <RankingTable v-if="deviceTab === 'screen'" title="Screen sizes" empty="No screen data yet" :rows="summary.screenSizes || []" />
            </div>
          </section>
        </section>

        <section v-if="!loading && !summary?.configured" class="card py-12 text-center">
          <SignalIcon class="mx-auto h-10 w-10 text-primary-500" />
          <h2 class="mt-4 text-base font-semibold text-white">Connect your first site</h2>
          <p class="mx-auto mt-2 max-w-md text-sm text-gray-400">Create a write key, add the tracking call to your site, and events will appear here.</p>
          <button type="button" class="btn btn-primary mt-5" @click="openSetup">Set up analytics</button>
        </section>

        <section class="card overflow-hidden">
          <button type="button" class="flex w-full items-center gap-2 px-6 py-4 text-left text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white" @click="showSetup = !showSetup">
            <CodeBracketIcon class="h-4 w-4" /> Integration settings
            <ChevronDownIcon class="h-4 w-4 transition-transform" :class="showSetup && 'rotate-180'" />
          </button>
          <div v-if="showSetup" class="grid gap-6 border-t border-gray-700 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div class="min-w-0">
              <label class="block text-xs font-medium uppercase text-gray-500">Allowed origins</label>
              <textarea v-model="originsText" rows="3" class="mt-2 block w-full rounded-md border-gray-600 bg-gray-800 text-sm text-white placeholder:text-gray-500 focus:border-primary-500 focus:ring-primary-500" placeholder="https://example.com&#10;https://www.example.com"></textarea>
              <p class="mt-2 text-xs text-gray-500">One origin per line. Leave empty for server-side collection, or use a wildcard such as <code>*.example.com</code>.</p>
              <div class="mt-4 flex items-center gap-3">
                <button type="button" :disabled="saving" class="btn btn-primary disabled:opacity-50" @click="saveProperty(false)">{{ property?.configured ? 'Save origins' : 'Create write key' }}</button>
                <button v-if="property?.configured" type="button" :disabled="saving" class="btn btn-outline disabled:opacity-50" @click="saveProperty(true)">Rotate key</button>
              </div>
            </div>
            <div class="border-l-0 border-gray-800 lg:border-l lg:pl-6">
              <p class="text-xs font-medium uppercase text-gray-500">Write key</p>
              <div class="mt-2 flex items-center gap-2">
                <code class="min-w-0 flex-1 truncate rounded bg-gray-900 px-3 py-2 text-xs text-gray-300">{{ revealedKey || (property?.configured ? `${property.writeKeyPrefix}...` : 'Not created') }}</code>
                <button v-if="revealedKey" type="button" title="Copy write key" class="rounded p-2 text-gray-400 hover:bg-gray-800 hover:text-white" @click="copy(revealedKey)"><ClipboardIcon class="h-4 w-4" /></button>
              </div>
              <p v-if="revealedKey" class="mt-2 text-xs text-amber-300">Store this key now. It will not be shown again.</p>

              <template v-if="property?.configured">
                <p class="mt-6 text-xs font-medium uppercase text-gray-500">Site snippet</p>
                <p class="mt-1 text-xs text-gray-400">Add this one line to your site's <code>&lt;head&gt;</code>:</p>
                <div class="mt-2 flex items-start gap-2">
                  <code class="min-w-0 flex-1 break-all rounded bg-gray-900 px-3 py-2 text-xs leading-relaxed text-gray-300">{{ snippet }}</code>
                  <button type="button" title="Copy snippet" class="mt-0.5 flex-shrink-0 rounded p-2 text-gray-400 hover:bg-gray-800 hover:text-white" @click="copy(snippet)"><ClipboardIcon class="h-4 w-4" /></button>
                </div>
              </template>

              <a href="https://github.com/tgmstudios/foligo/blob/main/api/docs/ANALYTICS_INTEGRATION.md" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-400">Integration guide <ArrowTopRightOnSquareIcon class="h-4 w-4" /></a>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import { ArrowPathRoundedSquareIcon, ArrowTopRightOnSquareIcon, ChartBarIcon, ChevronDownIcon, ClipboardIcon, ClockIcon, CodeBracketIcon, CursorArrowRaysIcon, EyeIcon, SignalIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import { useToast } from 'vue-toastification'
import api from '@/services/api'
import { useProjectStore } from '@/stores/projects'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)
type Row = { label: string; value: number; avgDuration?: number; visitors?: number }
type ReturnRate = { label: string; value: number }
type Summary = {
  configured: boolean; days: number | null
  totals: { events: number; pageViews: number; visitors: number; sessions: number }
  series: Array<{ date: string; views: number; visitors: number }>
  topPages: Row[]; topReferrers: Row[]; topEvents: Row[]; topCountries: Row[]
  topDomains: Row[]; topTransitions: Row[]; topCities: Row[]; topRegions: Row[]
  entryPages: Row[]; exitPages: Row[]; hourlyActivity: Row[]; weekdayActivity: Row[]
  languages: Row[]; timezones: Row[]; screenSizes: Row[]
  utmSources: Row[]; utmMediums: Row[]; utmCampaigns: Row[]
  deviceBreakdown: Row[]; osBreakdown: Row[]; browserBreakdown: Row[]
  returnRate: ReturnRate[]
  engagement: { avgTimeOnPage: number; pagesPerSession: number; eventsPerSession: number; bounceRate: number }
  avgTimeOnPage: number
}
type Property = { configured: boolean; writeKeyPrefix?: string; allowedOrigins: string[] }

function countryFlag(code: string) {
  const normalized = code.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalized)) return '🌐'
  return String.fromCodePoint(...normalized.split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
}
function formatDuration(ms: number) { if (!ms) return '0s'; return ms >= 60000 ? `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s` : `${Math.round(ms / 1000)}s` }

const RankingTable = defineComponent({
  props: { title: { type: String, required: true }, empty: { type: String, required: true }, rows: { type: Array as () => Row[], required: true }, showDuration: { type: Boolean, default: false }, isCountry: { type: Boolean, default: false } },
  setup(props) { return () => h('div', { class: 'card min-w-0 p-6' }, [h('h2', { class: 'mb-3 text-sm font-semibold text-white' }, props.title), props.rows.length ? h('div', { class: 'max-h-96 divide-y divide-gray-700 overflow-y-auto border-t border-gray-700 pr-1' }, props.rows.map((row, index) => h('div', { class: 'flex items-center gap-3 py-3 text-sm' }, [h('span', { class: 'w-7 text-xs tabular-nums text-gray-500' }, String(index + 1).padStart(2, '0')), props.isCountry ? h('span', { class: 'text-lg' }, countryFlag(row.label)) : null, h('span', { class: 'min-w-0 flex-1 truncate text-gray-300', title: row.label }, row.label), props.showDuration && row.avgDuration ? h('span', { class: 'text-xs text-gray-500' }, formatDuration(row.avgDuration)) : null, h('span', { class: 'tabular-nums text-white' }, row.value.toLocaleString())]))) : h('p', { class: 'border-t border-gray-700 py-8 text-center text-sm text-gray-500' }, props.empty)]) }
})

const toast = useToast(); const projectStore = useProjectStore()
const days = ref<number | 'all'>(30); const loading = ref(false); const saving = ref(false); const showSetup = ref(false)
const deviceTab = ref<'device' | 'os' | 'browser' | 'language' | 'timezone' | 'screen'>('device')
const summary = ref<Summary | null>(null); const property = ref<Property | null>(null); const originsText = ref(''); const revealedKey = ref('')
const ranges = [{ label: '7D', days: 7 as const }, { label: '30D', days: 30 as const }, { label: '90D', days: 90 as const }, { label: 'All', days: 'all' as const }]
const deviceTabs = [
  { key: 'device' as const, label: 'Devices' },
  { key: 'os' as const, label: 'OS' },
  { key: 'browser' as const, label: 'Browsers' },
  { key: 'language' as const, label: 'Languages' },
  { key: 'timezone' as const, label: 'Timezones' },
  { key: 'screen' as const, label: 'Screens' },
]
const selectedId = ref((window as any).selectedProjectId || '')
const selectedProject = computed(() => projectStore.projects.find(project => project.id === selectedId.value))

function returnRatePct(): string {
  const rates = summary.value?.returnRate || []
  const ret = rates.find(r => r.label === 'returning')
  const neu = rates.find(r => r.label === 'new')
  const total = (ret?.value || 0) + (neu?.value || 0)
  if (!total) return '0%'
  return `${Math.round(((ret?.value || 0) / total) * 100)}%`
}

const metrics = computed(() => {
  const m = [
    { label: 'Page views', value: summary.value?.totals.pageViews || 0, icon: EyeIcon, iconClass: 'bg-primary-100 text-primary-600' },
    { label: 'Visitors', value: summary.value?.totals.visitors || 0, icon: UserGroupIcon, iconClass: 'bg-green-100 text-green-600' },
    { label: 'Sessions', value: summary.value?.totals.sessions || 0, icon: ChartBarIcon, iconClass: 'bg-purple-100 text-purple-600' },
    { label: 'All events', value: summary.value?.totals.events || 0, icon: CursorArrowRaysIcon, iconClass: 'bg-yellow-100 text-yellow-600' },
    { label: 'Avg. time on page', value: summary.value?.avgTimeOnPage || 0, formatted: formatDuration(summary.value?.avgTimeOnPage || 0), icon: ClockIcon, iconClass: 'bg-indigo-100 text-indigo-600' },
    { label: 'Return rate', value: 0, formatted: returnRatePct(), icon: ArrowPathRoundedSquareIcon, iconClass: 'bg-cyan-100 text-cyan-600' },
    { label: 'Pages / session', value: 0, formatted: (summary.value?.engagement.pagesPerSession || 0).toFixed(1), icon: ChartBarIcon, iconClass: 'bg-rose-100 text-rose-600' },
    { label: 'Events / session', value: 0, formatted: (summary.value?.engagement.eventsPerSession || 0).toFixed(1), icon: CursorArrowRaysIcon, iconClass: 'bg-orange-100 text-orange-600' },
    { label: 'Bounce rate', value: 0, formatted: `${Math.round(summary.value?.engagement.bounceRate || 0)}%`, icon: ArrowPathRoundedSquareIcon, iconClass: 'bg-teal-100 text-teal-600' },
  ]
  return m
})
const filledSeries = computed(() => { if (days.value === 'all') return summary.value?.series || []; const map = new Map((summary.value?.series || []).map(row => [row.date, row])); const rows = []; const cursor = new Date(); cursor.setUTCHours(0, 0, 0, 0); cursor.setUTCDate(cursor.getUTCDate() - days.value + 1); for (let i = 0; i < days.value; i++) { const date = cursor.toISOString().slice(0, 10); rows.push(map.get(date) || { date, views: 0, visitors: 0 }); cursor.setUTCDate(cursor.getUTCDate() + 1) } return rows })
const chartData = computed(() => ({ labels: filledSeries.value.map(row => new Date(`${row.date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })), datasets: [{ data: filledSeries.value.map(row => row.views), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.10)', fill: true, tension: .3, pointRadius: 0, borderWidth: 2 }, { data: filledSeries.value.map(row => row.visitors), borderColor: '#a855f7', tension: .3, pointRadius: 0, borderWidth: 2 }] }))
const chartOptions = { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' as const }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#111827', borderColor: '#374151', borderWidth: 1 } }, scales: { x: { grid: { display: false }, ticks: { color: '#6b7280', maxTicksLimit: 8 } }, y: { beginAtZero: true, grid: { color: '#1f2937' }, ticks: { color: '#6b7280', precision: 0 } } } }

async function load() { if (!selectedId.value) return; loading.value = true; try { const [summaryResponse, propertyResponse] = await Promise.all([api.get(`/analytics/projects/${selectedId.value}/summary`, { params: { days: days.value } }), api.get(`/analytics/projects/${selectedId.value}/property`)]); summary.value = summaryResponse.data; property.value = propertyResponse.data; originsText.value = propertyResponse.data.allowedOrigins.join('\n') } catch { toast.error('Unable to load analytics') } finally { loading.value = false } }
async function saveProperty(rotateKey: boolean) { saving.value = true; try { const response = await api.put(`/analytics/projects/${selectedId.value}/property`, { allowedOrigins: originsText.value.split('\n').map(value => value.trim()).filter(Boolean), rotateKey }); property.value = response.data; revealedKey.value = response.data.writeKey || ''; toast.success(rotateKey ? 'Write key rotated' : 'Analytics settings saved'); await load() } catch (error: any) { toast.error(error.response?.data?.error || 'Unable to save analytics settings') } finally { saving.value = false } }
function openSetup() { showSetup.value = true }
async function copy(value: string) { await navigator.clipboard.writeText(value); toast.success('Write key copied') }
function onProjectChange(event: Event) { selectedId.value = (event as CustomEvent).detail.projectId; revealedKey.value = '' }
function formatNumber(value: number) { return new Intl.NumberFormat(undefined, { notation: value >= 10000 ? 'compact' : 'standard' }).format(value) }
const snippet = computed(() => `<script src="https://api.foligo.tech/analytics.js" data-key="${revealedKey.value || property.value?.writeKeyPrefix + '...' || 'fa_YOUR_KEY'}" defer><\\/script>`)
watch([selectedId, days], load); onMounted(() => { window.addEventListener('project-changed', onProjectChange); load() }); onBeforeUnmount(() => window.removeEventListener('project-changed', onProjectChange))
</script>

<style scoped>
.stats-grid {
  --stat-card-min-width: 13rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.stats-grid > * {
  flex: 1 1 min(100%, var(--stat-card-min-width));
}
</style>
