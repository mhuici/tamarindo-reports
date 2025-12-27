<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const route = useRoute()
const slug = computed(() => route.params.slug as string)

// RCA composable for AI insights
const { analyzeMetric, isSignificantChange, isLoading: isRCALoading, getCachedResult } = useRCA()

// Forecast composable
const { forecastLocal, generateSampleData } = useForecast()

// State
const dashboard = ref<any>(null)
const isLoading = ref(true)
const error = ref('')
const requiresPassword = ref(false)
const password = ref('')
const isCheckingPassword = ref(false)
const passwordError = ref('')

// Metrics state
const metricsData = ref<any>(null)
const isLoadingMetrics = ref(false)

// RCA insights state
const rcaInsights = ref<Map<string, any>>(new Map())
const isAnalyzingRCA = ref(false)

// Forecast state
const forecasts = ref<Map<string, any>>(new Map())
const isGeneratingForecasts = ref(false)

// Fetch dashboard
async function fetchDashboard(pwd?: string) {
  isLoading.value = true
  error.value = ''
  passwordError.value = ''

  try {
    const url = pwd
      ? `/api/dashboards/public/${slug.value}?password=${encodeURIComponent(pwd)}`
      : `/api/dashboards/public/${slug.value}`

    const response = await $fetch<any>(url)

    if (response.requiresPassword) {
      requiresPassword.value = true
      dashboard.value = response.dashboard
    }
    else {
      requiresPassword.value = false
      dashboard.value = response.dashboard
      // Fetch metrics after dashboard loads
      await fetchMetrics(pwd)
    }
  }
  catch (e: any) {
    const statusCode = e?.response?.status || e?.statusCode
    const message = e?.data?.message || e?.message || 'Failed to load dashboard'

    if (statusCode === 401) {
      passwordError.value = 'Incorrect password'
    }
    else if (statusCode === 403) {
      error.value = 'This dashboard is not public'
    }
    else if (statusCode === 404) {
      error.value = 'Dashboard not found'
    }
    else if (statusCode === 410) {
      error.value = 'This dashboard link has expired'
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

// Fetch metrics for the dashboard
async function fetchMetrics(pwd?: string) {
  isLoadingMetrics.value = true

  try {
    const params = new URLSearchParams({ slug: slug.value })
    if (pwd)
      params.append('password', pwd)

    const response = await $fetch<any>(`/api/metrics/public?${params.toString()}`)
    metricsData.value = response

    // Analyze metrics with RCA and generate forecasts after loading
    if (response?.hasData) {
      analyzeMetricsWithRCA()
      generateForecasts()
    }
  }
  catch (e) {
    console.error('Failed to load metrics:', e)
    // Don't show error, just use fallback data
    metricsData.value = null
  }
  finally {
    isLoadingMetrics.value = false
  }
}

// Analyze metrics with significant changes using RCA
async function analyzeMetricsWithRCA() {
  if (!dashboard.value?.widgets || !metricsData.value?.widgetData) return

  isAnalyzingRCA.value = true

  const context = {
    clientName: dashboard.value.clientName || 'Cliente',
    platform: 'mixed', // Could be determined from integrations
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  }

  // Find metric widgets with significant changes
  const metricWidgets = dashboard.value.widgets.filter((w: any) =>
    (w.type === 'metric' || w.type === 'metric-card') && metricsData.value.widgetData[w.id],
  )

  // Analyze each metric widget
  for (const widget of metricWidgets) {
    const data = metricsData.value.widgetData[widget.id]
    if (!data?.value || !data?.previousValue) continue

    const currentValue = data.value
    const previousValue = data.previousValue

    if (isSignificantChange(currentValue, previousValue)) {
      try {
        const result = await analyzeMetric(
          {
            metricName: widget.config?.metricKey || widget.id,
            metricLabel: widget.title,
            currentValue,
            previousValue,
          },
          context,
        )

        if (result) {
          rcaInsights.value.set(widget.id, result)
        }
      }
      catch (e) {
        console.error('RCA analysis failed for widget:', widget.id, e)
      }
    }
  }

  isAnalyzingRCA.value = false
}

// Get RCA insight for a widget
function getWidgetInsight(widgetId: string) {
  return rcaInsights.value.get(widgetId)
}

// Check if widget has significant change
function widgetHasSignificantChange(widget: any): boolean {
  const data = metricsData.value?.widgetData?.[widget.id]
  if (!data?.value || !data?.previousValue) return false
  return isSignificantChange(data.value, data.previousValue)
}

// Generate forecasts for line chart widgets
function generateForecasts() {
  if (!dashboard.value?.widgets || !metricsData.value?.widgetData) return

  isGeneratingForecasts.value = true

  const chartWidgets = dashboard.value.widgets.filter((w: any) =>
    w.type === 'line-chart' && metricsData.value.widgetData[w.id]?.data?.length >= 7,
  )

  for (const widget of chartWidgets) {
    const widgetData = metricsData.value.widgetData[widget.id]
    if (!widgetData?.data) continue

    // Extract values from chart data
    const values = widgetData.data.map((d: any) => d.value || 0)
    const dates = widgetData.data.map((d: any) => d.label || d.date)

    try {
      const result = forecastLocal({
        data: values,
        dates,
        metricName: widget.config?.metricKey || widget.id,
        metricLabel: widget.title,
      })

      forecasts.value.set(widget.id, result)
    }
    catch (e) {
      console.error('Forecast failed for widget:', widget.id, e)
    }
  }

  isGeneratingForecasts.value = false
}

// Get forecast for a widget
function getWidgetForecast(widgetId: string) {
  return forecasts.value.get(widgetId)
}

// Check if widget has enough data for forecast
function canForecast(widget: any): boolean {
  const data = metricsData.value?.widgetData?.[widget.id]?.data
  return data && data.length >= 7
}

async function handlePasswordSubmit() {
  if (!password.value)
    return

  isCheckingPassword.value = true
  await fetchDashboard(password.value)
}

// Fetch on mount
onMounted(() => {
  fetchDashboard()
})

// Get branding
const branding = computed(() => {
  const b = dashboard.value?.branding as any
  return {
    primaryColor: b?.primaryColor || '#f97316',
    secondaryColor: b?.secondaryColor || '#1f2937',
    logoUrl: b?.logoUrl || '',
    companyName: b?.companyName || dashboard.value?.tenantName || 'TamarindoReports',
  }
})

// Current date formatted
const currentDate = computed(() => {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// Get widget data (real or fallback)
function getWidgetData(widget: any) {
  // Try to get real data first
  if (metricsData.value?.widgetData?.[widget.id]) {
    return metricsData.value.widgetData[widget.id]
  }

  // Fallback to mock data if no real data available
  return getWidgetMockData(widget)
}

// Check if widget has real data
function hasRealData(widget: any): boolean {
  const data = metricsData.value?.widgetData?.[widget.id]
  if (!data)
    return false

  // Check if data has actual values
  if (data.value !== undefined && data.value > 0)
    return true
  if (data.data?.length > 0 && data.data.some((d: any) => d.value > 0))
    return true
  if (data.rows?.length > 0)
    return true

  return false
}

// Fallback mock data for widgets without integrations
function getWidgetMockData(widget: any) {
  const type = widget.type
  if (type === 'metric' || type === 'metric-card') {
    return {
      value: 0,
      previousValue: 0,
    }
  }
  if (type === 'line-chart') {
    return {
      data: [],
    }
  }
  if (type === 'bar-chart') {
    return {
      data: [],
    }
  }
  return null
}

// Calculate percentage change
function calculateChange(current: number, previous: number): number {
  if (previous === 0)
    return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function formatNumber(num: number, format?: string) {
  if (format === 'currency') {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num)
  }
  if (format === 'percent') {
    return `${num.toFixed(1)}%`
  }
  return new Intl.NumberFormat('es-MX').format(num)
}

function getWidgetIcon(type: string) {
  const icons: Record<string, string> = {
    'metric': 'heroicons:presentation-chart-bar',
    'metric-card': 'heroicons:presentation-chart-bar',
    'line-chart': 'heroicons:chart-bar',
    'bar-chart': 'heroicons:chart-bar-square',
    'pie-chart': 'heroicons:chart-pie',
    'table': 'heroicons:table-cells',
    'text': 'heroicons:document-text',
  }
  return icons[type] || 'heroicons:square-3-stack-3d'
}

function getWidgetColorClass(index: number) {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-violet-500 to-violet-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
    'from-cyan-500 to-cyan-600',
  ]
  return colors[index % colors.length]
}

// Normalize chart data height for visualization
function normalizeChartData(data: Array<{ label: string, value: number }>) {
  if (!data || data.length === 0)
    return []

  const maxValue = Math.max(...data.map(d => d.value), 1)
  return data.map(d => ({
    ...d,
    height: Math.max((d.value / maxValue) * 100, 5), // Minimum 5% height
  }))
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
          <div class="absolute top-0 left-0 w-16 h-16 border-4 border-t-blue-500 rounded-full animate-spin" />
        </div>
        <p class="mt-4 text-gray-500 font-medium">
          Cargando dashboard...
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
          El dashboard que buscas no está disponible o el enlace ha expirado.
        </p>
        <a
          href="/"
          class="mt-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          Volver al inicio
        </a>
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
            <div class="w-16 h-16 mx-auto bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
              <Icon
                name="heroicons:lock-closed"
                class="h-8 w-8 text-white"
              />
            </div>
            <h1 class="mt-6 text-2xl font-bold text-gray-900">
              {{ dashboard?.name || 'Dashboard Protegido' }}
            </h1>
            <p class="mt-2 text-gray-500">
              Este dashboard requiere contraseña para acceder.
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
              >Contraseña</label>
              <input
                id="password"
                v-model="password"
                type="password"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ingresa la contraseña"
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
              class="w-full py-3 px-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-medium rounded-xl hover:from-gray-700 hover:to-gray-800 focus:ring-4 focus:ring-gray-300 transition-all flex items-center justify-center gap-2"
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
              {{ isCheckingPassword ? 'Verificando...' : 'Acceder al Dashboard' }}
            </button>
          </form>

          <div class="mt-8 pt-6 border-t border-gray-100 text-center">
            <p class="text-xs text-gray-400">
              {{ dashboard?.clientName }} • {{ dashboard?.tenantName }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard content -->
    <div v-else-if="dashboard">
      <!-- Header minimalista -->
      <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <!-- Branding y título -->
            <div class="flex items-center gap-4">
              <img
                v-if="branding.logoUrl"
                :src="branding.logoUrl"
                :alt="branding.companyName"
                class="h-10 object-contain"
              >
              <div
                v-else
                class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                :style="{ backgroundColor: branding.primaryColor }"
              >
                {{ branding.companyName.charAt(0) }}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <span class="truncate">{{ branding.companyName }}</span>
                  <span class="text-gray-300">/</span>
                  <span class="truncate">{{ dashboard.clientName }}</span>
                </div>
                <h1 class="text-xl font-bold text-gray-900 truncate">
                  {{ dashboard.name }}
                </h1>
              </div>
            </div>
            <!-- Fecha y estado -->
            <div class="hidden sm:flex items-center gap-4">
              <div class="flex items-center gap-2 text-sm text-gray-500">
                <span
                  class="w-2 h-2 rounded-full"
                  :class="metricsData?.hasData ? 'bg-green-500' : 'bg-yellow-500'"
                />
                <span>{{ metricsData?.hasData ? 'En vivo' : 'Sin datos' }}</span>
              </div>
              <div class="h-4 w-px bg-gray-200" />
              <div class="flex items-center gap-2 text-sm text-gray-500">
                <Icon name="heroicons:calendar" class="w-4 h-4" />
                <span class="capitalize">{{ currentDate }}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Widgets -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Loading metrics -->
        <div
          v-if="isLoadingMetrics"
          class="text-center py-8"
        >
          <div class="inline-flex items-center gap-2 text-gray-500">
            <Icon name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
            <span>Cargando métricas...</span>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!dashboard.widgets || dashboard.widgets.length === 0"
          class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center"
        >
          <div class="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <Icon
              name="heroicons:chart-bar"
              class="h-10 w-10 text-gray-400"
            />
          </div>
          <h3 class="mt-6 text-lg font-semibold text-gray-900">
            Sin datos todavía
          </h3>
          <p class="mt-2 text-gray-500 max-w-sm mx-auto">
            Este dashboard aún no tiene widgets configurados. Los datos aparecerán aquí cuando estén disponibles.
          </p>
        </div>

        <!-- Widget grid -->
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div
            v-for="(widget, index) in dashboard.widgets"
            :key="widget.id"
            :class="[
              'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md',
              widget.size === 'large' ? 'md:col-span-2' : '',
            ]"
          >
            <!-- Widget header -->
            <div class="px-6 py-4 border-b border-gray-100">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0"
                  :class="getWidgetColorClass(index)"
                >
                  <Icon
                    :name="getWidgetIcon(widget.type)"
                    class="w-4 h-4 text-white"
                  />
                </div>
                <h3 class="font-medium text-gray-900 truncate">
                  {{ widget.title }}
                </h3>
              </div>
            </div>

            <!-- Widget content -->
            <div class="p-6">
              <!-- Metric widget -->
              <template v-if="widget.type === 'metric' || widget.type === 'metric-card'">
                <div class="text-center py-4">
                  <p class="text-4xl font-bold text-gray-900">
                    {{ formatNumber(getWidgetData(widget)?.value || 0, widget.config?.format || widget.format) }}
                  </p>
                  <div
                    v-if="hasRealData(widget)"
                    class="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium"
                    :class="calculateChange(getWidgetData(widget)?.value || 0, getWidgetData(widget)?.previousValue || 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                  >
                    <Icon
                      :name="calculateChange(getWidgetData(widget)?.value || 0, getWidgetData(widget)?.previousValue || 0) >= 0 ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'"
                      class="w-4 h-4"
                    />
                    {{ Math.abs(calculateChange(getWidgetData(widget)?.value || 0, getWidgetData(widget)?.previousValue || 0)) }}% vs período anterior
                  </div>
                  <p
                    v-else
                    class="mt-2 text-sm text-gray-400"
                  >
                    Sin datos de integración
                  </p>
                </div>

                <!-- AI Insight for significant changes -->
                <AiWidgetInsight
                  v-if="widgetHasSignificantChange(widget) || getWidgetInsight(widget.id)"
                  :summary="getWidgetInsight(widget.id)?.summary"
                  :causes="getWidgetInsight(widget.id)?.causes"
                  :loading="isAnalyzingRCA && !getWidgetInsight(widget.id)"
                />
              </template>

              <!-- Line chart widget -->
              <template v-else-if="widget.type === 'line-chart'">
                <!-- With forecast -->
                <AiForecastChart
                  v-if="getWidgetForecast(widget.id)"
                  :title="'Proyección: ' + widget.title"
                  :data="getWidgetForecast(widget.id)"
                  :loading="isGeneratingForecasts"
                  :height="180"
                />
                <!-- Without forecast (basic chart) -->
                <template v-else>
                  <div
                    v-if="getWidgetData(widget)?.data?.length > 0"
                    class="h-40 flex items-end justify-between gap-2 px-2"
                  >
                    <div
                      v-for="(item, i) in normalizeChartData(getWidgetData(widget)?.data || [])"
                      :key="i"
                      class="flex-1 flex flex-col items-center gap-2"
                    >
                      <div
                        class="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500"
                        :style="{ height: `${item.height}%` }"
                      />
                      <span class="text-xs text-gray-500">{{ item.label }}</span>
                    </div>
                  </div>
                  <div
                    v-else
                    class="h-40 flex items-center justify-center"
                  >
                    <p class="text-sm text-gray-400">Sin datos disponibles</p>
                  </div>
                </template>
              </template>

              <!-- Bar chart widget -->
              <template v-else-if="widget.type === 'bar-chart'">
                <div
                  v-if="getWidgetData(widget)?.data?.length > 0"
                  class="space-y-3"
                >
                  <div
                    v-for="(item, i) in getWidgetData(widget)?.data || []"
                    :key="i"
                    class="flex items-center gap-3"
                  >
                    <span class="text-sm text-gray-600 w-24 truncate">{{ item.label }}</span>
                    <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all"
                        :style="{ width: `${Math.min((item.value / Math.max(...(getWidgetData(widget)?.data || []).map((d: any) => d.value), 1)) * 100, 100)}%` }"
                      />
                    </div>
                    <span class="text-sm font-medium text-gray-900 w-16 text-right">{{ formatNumber(item.value) }}</span>
                  </div>
                </div>
                <div
                  v-else
                  class="h-32 flex items-center justify-center"
                >
                  <p class="text-sm text-gray-400">Sin datos disponibles</p>
                </div>
              </template>

              <!-- Default/other widgets -->
              <template v-else>
                <div class="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                  <div class="text-center">
                    <Icon
                      :name="getWidgetIcon(widget.type)"
                      class="mx-auto h-8 w-8 text-gray-400"
                    />
                    <p class="mt-2 text-sm text-gray-500 capitalize">
                      {{ widget.type.replace('-', ' ') }}
                    </p>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-t border-gray-100 mt-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span>Powered by</span>
            <span class="font-medium text-gray-500">TamarindoReports</span>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>
