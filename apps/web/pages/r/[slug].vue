<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const route = useRoute()
const slug = computed(() => route.params.slug as string)

// State
const report = ref<any>(null)
const metrics = ref<any>(null)
const isLoading = ref(true)
const error = ref('')
const requiresPassword = ref(false)
const password = ref('')
const isCheckingPassword = ref(false)
const passwordError = ref('')

// Fetch report
async function fetchReport(pwd?: string) {
  isLoading.value = true
  error.value = ''
  passwordError.value = ''

  try {
    const url = pwd
      ? `/api/reports/public/${slug.value}?password=${encodeURIComponent(pwd)}`
      : `/api/reports/public/${slug.value}`

    const response = await $fetch<any>(url)

    if (response.requiresPassword) {
      requiresPassword.value = true
      report.value = response.report
    }
    else {
      requiresPassword.value = false
      report.value = response.report
      metrics.value = response.metrics
    }
  }
  catch (e: any) {
    const statusCode = e?.response?.status || e?.statusCode
    const message = e?.data?.message || e?.message || 'Failed to load report'

    if (statusCode === 401) {
      passwordError.value = 'Incorrect password'
    }
    else if (statusCode === 403) {
      error.value = 'This report is not public'
    }
    else if (statusCode === 404) {
      error.value = 'Report not found'
    }
    else if (statusCode === 410) {
      error.value = 'This report link has expired'
    }
    else {
      error.value = message
    }
  }
  finally {
    isLoading.value = false
    isCheckingPassword.value = false
  }
}

async function handlePasswordSubmit() {
  if (!password.value) return

  isCheckingPassword.value = true
  await fetchReport(password.value)
}

// Fetch on mount
onMounted(() => {
  fetchReport()
})

// Get branding
const branding = computed(() => {
  const b = report.value?.branding as any
  return {
    primaryColor: b?.primaryColor || '#f97316',
    secondaryColor: b?.secondaryColor || '#1f2937',
    logoUrl: b?.logoUrl || '',
    companyName: b?.companyName || report.value?.tenantName || 'TamarindoReports',
  }
})

// Date range formatted
const dateRangeFormatted = computed(() => {
  const dr = report.value?.dateRange
  if (!dr?.start || !dr?.end) return ''

  const start = new Date(dr.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const end = new Date(dr.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${start} - ${end}`
})

// Widget helpers
function getWidgetGridClass(size: string) {
  switch (size) {
    case 'small': return 'col-span-1'
    case 'medium': return 'col-span-2'
    case 'large': return 'col-span-4'
    default: return 'col-span-2'
  }
}

function getMetricValue(widget: any) {
  const metricKey = widget.config?.metric
  if (!metrics.value?.totals || !metricKey) return null
  return metrics.value.totals[metricKey]
}

function getPreviousValue(widget: any) {
  const metricKey = widget.config?.metric
  if (!metrics.value?.previousTotals || !metricKey) return null
  return metrics.value.previousTotals[metricKey]
}

function getChartData(widget: any) {
  const metricKey = widget.config?.metric
  if (!metrics.value?.byDate || !metricKey) return []

  return metrics.value.byDate.map((d: any) => ({
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d[metricKey] || 0,
  }))
}

function formatMetricValue(value: number | null, metric: string): string {
  if (value === null || value === undefined) return '--'

  const currencyMetrics = ['spend', 'cost', 'cpc', 'cpm', 'costPerConversion', 'conversionValue']
  const percentMetrics = ['ctr', 'conversionRate', 'roas', 'bounceRate']

  if (currencyMetrics.includes(metric)) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)
  }
  if (percentMetrics.includes(metric)) {
    return `${value.toFixed(1)}%`
  }
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

function calculateChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Loading -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center">
        <div class="relative">
          <div class="w-16 h-16 border-4 border-gray-200 rounded-full" />
          <div class="absolute top-0 left-0 w-16 h-16 border-4 border-t-orange-500 rounded-full animate-spin" />
        </div>
        <p class="mt-4 text-gray-500 font-medium">
          Loading report...
        </p>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="flex items-center justify-center min-h-screen px-4"
    >
      <div class="text-center max-w-md">
        <div class="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <Icon
            name="heroicons:exclamation-triangle"
            class="h-10 w-10 text-red-500"
          />
        </div>
        <h1 class="mt-6 text-2xl font-bold text-gray-900">
          {{ error }}
        </h1>
        <p class="mt-3 text-gray-500">
          The report you're looking for is not available or the link has expired.
        </p>
      </div>
    </div>

    <!-- Password form -->
    <div
      v-else-if="requiresPassword"
      class="flex items-center justify-center min-h-screen px-4"
    >
      <div class="w-full max-w-md">
        <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div class="text-center mb-8">
            <div
              class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg"
              :style="{ backgroundColor: branding.primaryColor }"
            >
              <Icon
                name="heroicons:lock-closed"
                class="h-8 w-8 text-white"
              />
            </div>
            <h1 class="mt-6 text-2xl font-bold text-gray-900">
              {{ report?.name || 'Protected Report' }}
            </h1>
            <p class="mt-2 text-gray-500">
              This report requires a password to access.
            </p>
          </div>

          <form
            class="space-y-5"
            @submit.prevent="handlePasswordSubmit"
          >
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700 mb-2"
              >Password</label>
              <input
                id="password"
                v-model="password"
                type="password"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Enter the password"
                required
              >
              <p
                v-if="passwordError"
                class="mt-2 text-sm text-red-600 flex items-center gap-1"
              >
                <Icon name="heroicons:exclamation-circle" class="w-4 h-4" />
                {{ passwordError }}
              </p>
            </div>

            <button
              type="submit"
              class="w-full py-3 px-4 text-white font-medium rounded-xl focus:ring-4 focus:ring-orange-300 transition-all flex items-center justify-center gap-2"
              :style="{ backgroundColor: branding.primaryColor }"
              :disabled="isCheckingPassword"
            >
              <Icon
                v-if="isCheckingPassword"
                name="heroicons:arrow-path"
                class="w-5 h-5 animate-spin"
              />
              <Icon
                v-else
                name="heroicons:lock-open"
                class="w-5 h-5"
              />
              {{ isCheckingPassword ? 'Verifying...' : 'Access Report' }}
            </button>
          </form>

          <div class="mt-8 pt-6 border-t border-gray-100 text-center">
            <p class="text-xs text-gray-400">
              {{ report?.clientName }} • {{ report?.tenantName }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Report content -->
    <div v-else-if="report">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div class="max-w-6xl mx-auto px-4 py-4">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <img
                v-if="branding.logoUrl"
                :src="branding.logoUrl"
                :alt="branding.companyName"
                class="h-10 object-contain shrink-0"
              >
              <div
                v-else
                class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                :style="{ backgroundColor: branding.primaryColor }"
              >
                {{ branding.companyName.charAt(0) }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <span>{{ branding.companyName }}</span>
                  <span class="text-gray-300">•</span>
                  <span>{{ report.clientName }}</span>
                </div>
                <h1 class="text-xl font-bold text-gray-900 truncate">
                  {{ report.name }}
                </h1>
              </div>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-500 shrink-0">
              <Icon name="heroicons:calendar" class="w-4 h-4" />
              <span>{{ dateRangeFormatted }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Widgets Grid -->
      <main class="max-w-6xl mx-auto px-4 py-8">
        <div
          v-if="report.widgets && report.widgets.length > 0"
          class="grid grid-cols-4 gap-4"
        >
          <div
            v-for="widget in report.widgets"
            :key="widget.id"
            :class="getWidgetGridClass(widget.size)"
          >
            <!-- Metric Card -->
            <div
              v-if="widget.type === 'metric'"
              class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center h-full"
            >
              <p class="text-sm text-gray-500 mb-2">
                {{ widget.title }}
              </p>
              <p
                class="text-3xl font-bold"
                :style="{ color: widget.config?.color || branding.primaryColor }"
              >
                {{ formatMetricValue(getMetricValue(widget), widget.config?.metric || 'impressions') }}
              </p>
              <div
                v-if="widget.config?.showComparison && getPreviousValue(widget)"
                class="flex items-center justify-center gap-2 mt-3"
              >
                <Icon
                  :name="(getMetricValue(widget) || 0) >= (getPreviousValue(widget) || 0) ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'"
                  :class="['w-4 h-4', (getMetricValue(widget) || 0) >= (getPreviousValue(widget) || 0) ? 'text-green-500' : 'text-red-500']"
                />
                <span
                  :class="['text-sm font-medium', (getMetricValue(widget) || 0) >= (getPreviousValue(widget) || 0) ? 'text-green-600' : 'text-red-600']"
                >
                  {{ Math.abs(calculateChange(getMetricValue(widget), getPreviousValue(widget)) || 0) }}%
                </span>
                <span class="text-gray-400 text-sm">vs previous</span>
              </div>
            </div>

            <!-- Line Chart -->
            <div
              v-else-if="widget.type === 'line-chart'"
              class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full"
            >
              <div class="flex items-center justify-between mb-4">
                <p class="text-sm font-medium text-gray-700">
                  {{ widget.title }}
                </p>
                <div
                  v-if="widget.config?.showLegend"
                  class="flex items-center gap-2"
                >
                  <div
                    class="w-3 h-3 rounded-sm"
                    :style="{ backgroundColor: widget.config?.color || branding.primaryColor }"
                  />
                  <span class="text-xs text-gray-500">{{ widget.config?.metric }}</span>
                </div>
              </div>
              <div class="h-40 relative">
                <svg
                  v-if="widget.config?.showGrid !== false"
                  class="absolute inset-0 w-full h-full"
                >
                  <line
                    v-for="i in 4"
                    :key="i"
                    x1="0"
                    :y1="`${i * 25}%`"
                    x2="100%"
                    :y2="`${i * 25}%`"
                    stroke="#e5e7eb"
                    stroke-width="1"
                  />
                </svg>
                <svg
                  v-if="getChartData(widget).length > 0"
                  class="w-full h-full"
                  viewBox="0 0 100 50"
                  preserveAspectRatio="none"
                >
                  <polygon
                    v-if="widget.config?.fillArea"
                    :fill="widget.config?.color || branding.primaryColor"
                    fill-opacity="0.15"
                    :points="`0,50 ${getChartData(widget).map((p: any, i: number) => {
                      const maxVal = Math.max(...getChartData(widget).map((d: any) => d.value), 1)
                      const x = (i / Math.max(getChartData(widget).length - 1, 1)) * 100
                      const y = 50 - (p.value / maxVal) * 45
                      return `${x},${y}`
                    }).join(' ')} 100,50`"
                  />
                  <polyline
                    fill="none"
                    :stroke="widget.config?.color || branding.primaryColor"
                    stroke-width="2"
                    :stroke-dasharray="widget.config?.lineStyle === 'dashed' ? '4,2' : 'none'"
                    stroke-linecap="round"
                    :points="getChartData(widget).map((p: any, i: number) => {
                      const maxVal = Math.max(...getChartData(widget).map((d: any) => d.value), 1)
                      const x = (i / Math.max(getChartData(widget).length - 1, 1)) * 100
                      const y = 50 - (p.value / maxVal) * 45
                      return `${x},${y}`
                    }).join(' ')"
                  />
                </svg>
                <div
                  v-else
                  class="h-full flex items-center justify-center text-gray-400"
                >
                  No data available
                </div>
              </div>
            </div>

            <!-- Bar Chart -->
            <div
              v-else-if="widget.type === 'bar-chart'"
              class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full"
            >
              <p class="text-sm font-medium text-gray-700 mb-4">
                {{ widget.title }}
              </p>
              <div
                v-if="getChartData(widget).length > 0"
                class="h-40 flex items-end justify-around gap-2"
              >
                <div
                  v-for="(point, i) in getChartData(widget)"
                  :key="i"
                  class="flex-1 flex flex-col items-center"
                >
                  <div
                    class="w-full transition-all"
                    :style="{
                      backgroundColor: widget.config?.color || branding.primaryColor,
                      height: `${Math.max(5, (point.value / Math.max(...getChartData(widget).map((p: any) => p.value), 1)) * 100)}%`,
                      borderRadius: `${widget.config?.barRadius || 0}px ${widget.config?.barRadius || 0}px 0 0`,
                    }"
                  />
                  <span
                    v-if="widget.config?.showXAxis !== false"
                    class="text-[10px] text-gray-400 mt-1"
                  >
                    {{ point.label }}
                  </span>
                </div>
              </div>
              <div
                v-else
                class="h-40 flex items-center justify-center text-gray-400"
              >
                No data available
              </div>
            </div>

            <!-- Pie Chart -->
            <div
              v-else-if="widget.type === 'pie-chart'"
              class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full"
            >
              <p class="text-sm font-medium text-gray-700 mb-4">
                {{ widget.title }}
              </p>
              <div class="h-32 flex items-center justify-center">
                <div
                  class="w-24 h-24 rounded-full"
                  :style="{ background: `conic-gradient(${widget.config?.color || branding.primaryColor} 0% 65%, #e5e7eb 65% 100%)` }"
                />
              </div>
            </div>

            <!-- Text -->
            <div
              v-else-if="widget.type === 'text'"
              class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full"
            >
              <p class="text-sm font-medium text-gray-700 mb-2">
                {{ widget.title }}
              </p>
              <p class="text-gray-600 whitespace-pre-wrap text-sm">
                {{ widget.config?.content || 'No content' }}
              </p>
            </div>

            <!-- Table -->
            <div
              v-else-if="widget.type === 'table'"
              class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full"
            >
              <p class="text-sm font-medium text-gray-700 mb-4">
                {{ widget.title }}
              </p>
              <div class="text-center py-8 text-gray-400">
                <Icon name="heroicons:table-cells" class="w-8 h-8 mx-auto mb-2" />
                <p class="text-sm">Data table</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else
          class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center"
        >
          <div class="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <Icon name="heroicons:document-chart-bar" class="h-10 w-10 text-gray-400" />
          </div>
          <h3 class="mt-6 text-lg font-semibold text-gray-900">
            No widgets configured
          </h3>
          <p class="mt-2 text-gray-500">
            This report doesn't have any widgets yet.
          </p>
        </div>

        <!-- AI Insights -->
        <div
          v-if="report.aiInsights"
          class="mt-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100"
        >
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Icon name="heroicons:sparkles" class="w-5 h-5 text-white" />
            </div>
            <h3 class="font-semibold text-gray-900">AI Insights</h3>
          </div>
          <p class="text-gray-700 whitespace-pre-wrap">
            {{ report.aiInsights }}
          </p>
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-t border-gray-100 mt-12">
        <div class="max-w-6xl mx-auto px-4 py-6">
          <div class="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span>Powered by</span>
            <span class="font-medium text-gray-500">TamarindoReports</span>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>
