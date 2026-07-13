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
        <div v-if="loading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="i in 4" :key="i" class="card h-28 animate-pulse p-6"><div class="h-3 w-20 rounded bg-gray-700"></div><div class="mt-4 h-7 w-16 rounded bg-gray-700"></div></div>
        </div>

          <section v-else-if="summary?.configured" class="space-y-8">
          <section class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div v-for="metric in metrics" :key="metric.label" class="card p-6">
              <div class="flex items-center">
                <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg" :class="metric.iconClass">
                  <component :is="metric.icon" class="h-6 w-6" />
                </div>
                <div class="ml-4 min-w-0">
                  <p class="text-sm font-medium text-gray-400">{{ metric.label }}</p>
                  <p class="mt-1 text-2xl font-semibold tabular-nums text-white">{{ metric.formatted || formatNumber(metric.value) }}</p>
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

          <section class="grid gap-6 lg:grid-cols-2">
            <RankingTable title="Top countries" empty="No country data yet" :rows="summary.topCountries" :is-country="true" />
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
import { ArrowTopRightOnSquareIcon, ChartBarIcon, ChevronDownIcon, ClipboardIcon, ClockIcon, CodeBracketIcon, CursorArrowRaysIcon, EyeIcon, SignalIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import { useToast } from 'vue-toastification'
import api from '@/services/api'
import { useProjectStore } from '@/stores/projects'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)
type Row = { label: string; value: number; avgDuration?: number; visitors?: number }
type Summary = { configured: boolean; totals: { events: number; pageViews: number; visitors: number; sessions: number }; series: Array<{ date: string; views: number; visitors: number }>; topPages: Row[]; topReferrers: Row[]; topEvents: Row[]; topCountries: Row[]; avgTimeOnPage: number }
type Property = { configured: boolean; writeKeyPrefix?: string; allowedOrigins: string[] }

function countryFlag(code: string) { return String.fromCodePoint(...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) }
function formatDuration(ms: number) { if (!ms) return '0s'; return ms >= 60000 ? `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s` : `${Math.round(ms / 1000)}s` }

const RankingTable = defineComponent({
  props: { title: { type: String, required: true }, empty: { type: String, required: true }, rows: { type: Array as () => Row[], required: true }, showDuration: { type: Boolean, default: false }, isCountry: { type: Boolean, default: false } },
  setup(props) { return () => h('div', { class: 'card min-w-0 p-6' }, [h('h2', { class: 'mb-3 text-sm font-semibold text-white' }, props.title), props.rows.length ? h('div', { class: 'divide-y divide-gray-700 border-t border-gray-700' }, props.rows.map((row, index) => h('div', { class: 'flex items-center gap-3 py-3 text-sm' }, [h('span', { class: 'w-5 text-xs tabular-nums text-gray-500' }, String(index + 1).padStart(2, '0')), props.isCountry ? h('span', { class: 'text-lg' }, countryFlag(row.label)) : null, h('span', { class: 'min-w-0 flex-1 truncate text-gray-300', title: row.label }, row.label), props.showDuration && row.avgDuration ? h('span', { class: 'text-xs text-gray-500' }, formatDuration(row.avgDuration)) : null, h('span', { class: 'tabular-nums text-white' }, row.value.toLocaleString())]))) : h('p', { class: 'border-t border-gray-700 py-8 text-center text-sm text-gray-500' }, props.empty)]) }
})

const toast = useToast(); const projectStore = useProjectStore()
const days = ref(30); const loading = ref(false); const saving = ref(false); const showSetup = ref(false)
const summary = ref<Summary | null>(null); const property = ref<Property | null>(null); const originsText = ref(''); const revealedKey = ref('')
const ranges = [{ label: '7D', days: 7 }, { label: '30D', days: 30 }, { label: '90D', days: 90 }]
const selectedId = ref((window as any).selectedProjectId || '')
const selectedProject = computed(() => projectStore.projects.find(project => project.id === selectedId.value))
const metrics = computed(() => [
  { label: 'Page views', value: summary.value?.totals.pageViews || 0, icon: EyeIcon, iconClass: 'bg-primary-100 text-primary-600' },
  { label: 'Visitors', value: summary.value?.totals.visitors || 0, icon: UserGroupIcon, iconClass: 'bg-green-100 text-green-600' },
  { label: 'Sessions', value: summary.value?.totals.sessions || 0, icon: ChartBarIcon, iconClass: 'bg-purple-100 text-purple-600' },
  { label: 'All events', value: summary.value?.totals.events || 0, icon: CursorArrowRaysIcon, iconClass: 'bg-yellow-100 text-yellow-600' },
  { label: 'Avg. time on page', value: summary.value?.avgTimeOnPage || 0, formatted: formatDuration(summary.value?.avgTimeOnPage || 0), icon: ClockIcon, iconClass: 'bg-indigo-100 text-indigo-600' }
])
const filledSeries = computed(() => { const map = new Map((summary.value?.series || []).map(row => [row.date, row])); const rows = []; const cursor = new Date(); cursor.setUTCHours(0, 0, 0, 0); cursor.setUTCDate(cursor.getUTCDate() - days.value + 1); for (let i = 0; i < days.value; i++) { const date = cursor.toISOString().slice(0, 10); rows.push(map.get(date) || { date, views: 0, visitors: 0 }); cursor.setUTCDate(cursor.getUTCDate() + 1) } return rows })
const chartData = computed(() => ({ labels: filledSeries.value.map(row => new Date(`${row.date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })), datasets: [{ data: filledSeries.value.map(row => row.views), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.10)', fill: true, tension: .3, pointRadius: 0, borderWidth: 2 }, { data: filledSeries.value.map(row => row.visitors), borderColor: '#a855f7', tension: .3, pointRadius: 0, borderWidth: 2 }] }))
const chartOptions = { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' as const }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#111827', borderColor: '#374151', borderWidth: 1 } }, scales: { x: { grid: { display: false }, ticks: { color: '#6b7280', maxTicksLimit: 8 } }, y: { beginAtZero: true, grid: { color: '#1f2937' }, ticks: { color: '#6b7280', precision: 0 } } } }

async function load() { if (!selectedId.value) return; loading.value = true; try { const [summaryResponse, propertyResponse] = await Promise.all([api.get(`/analytics/projects/${selectedId.value}/summary`, { params: { days: days.value } }), api.get(`/analytics/projects/${selectedId.value}/property`)]); summary.value = summaryResponse.data; property.value = propertyResponse.data; originsText.value = propertyResponse.data.allowedOrigins.join('\n') } catch { toast.error('Unable to load analytics') } finally { loading.value = false } }
async function saveProperty(rotateKey: boolean) { saving.value = true; try { const response = await api.put(`/analytics/projects/${selectedId.value}/property`, { allowedOrigins: originsText.value.split('\n').map(value => value.trim()).filter(Boolean), rotateKey }); property.value = response.data; revealedKey.value = response.data.writeKey || ''; toast.success(rotateKey ? 'Write key rotated' : 'Analytics settings saved'); await load() } catch (error: any) { toast.error(error.response?.data?.error || 'Unable to save analytics settings') } finally { saving.value = false } }
function openSetup() { showSetup.value = true }
async function copy(value: string) { await navigator.clipboard.writeText(value); toast.success('Write key copied') }
function onProjectChange(event: Event) { selectedId.value = (event as CustomEvent).detail.projectId; revealedKey.value = '' }
function formatNumber(value: number) { return new Intl.NumberFormat(undefined, { notation: value >= 10000 ? 'compact' : 'standard' }).format(value) }
watch([selectedId, days], load); onMounted(() => { window.addEventListener('project-changed', onProjectChange); load() }); onBeforeUnmount(() => window.removeEventListener('project-changed', onProjectChange))
</script>
