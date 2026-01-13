<script setup lang="ts">
// TypeScript interfaces
interface RCACause {
  factor: string
  explanation: string
  confidence: number
  action?: string
}

interface RCAResult {
  metric: string
  metricLabel: string
  change: {
    percentage: number
    direction: 'up' | 'down'
  }
  causes: RCACause[]
  summary: string
  isFallback?: boolean
}

interface SummaryResult {
  markdown: string
  isFallback?: boolean
}

interface Metric {
  id: string
  label: string
  value: number
  previousValue: number
  format: 'currency' | 'number' | 'percent'
  suffix?: string
  changePercent: number
}

interface Feature {
  icon: string
  title: string
  description: string
}

definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: 'Demo - TamarindoReports',
  description: 'Explora TamarindoReports con datos de ejemplo. Prueba el análisis de causa, narrativas AI y forecasting.',
  ogTitle: 'Demo - TamarindoReports',
  ogDescription: 'Explora TamarindoReports con datos de ejemplo. Prueba el análisis de causa, narrativas AI y forecasting sin crear cuenta.',
  ogImage: '/og-demo.png',
  twitterCard: 'summary_large_image',
})

// Mock client data
const mockClient = {
  name: 'Acme E-commerce',
  industry: 'E-commerce',
}

// Features data
const features: Feature[] = [
  {
    icon: 'heroicons:light-bulb',
    title: 'Análisis de Causa',
    description: 'Haz click en "¿Por qué cambió?" en cualquier métrica con cambio significativo para ver el análisis de IA.',
  },
  {
    icon: 'heroicons:document-text',
    title: 'Resumen Ejecutivo',
    description: 'Genera un resumen completo listo para enviar a tu cliente con un solo click.',
  },
  {
    icon: 'heroicons:chart-bar-square',
    title: 'Forecasting',
    description: 'Predicciones de spend y métricas incluidas automáticamente en el resumen ejecutivo.',
  },
]

// Mock metrics with significant changes
const mockMetrics = ref<Metric[]>([
  {
    id: 'spend',
    label: 'Spend',
    value: 12450,
    previousValue: 11200,
    format: 'currency',
    changePercent: 11.2,
  },
  {
    id: 'roas',
    label: 'ROAS',
    value: 2.3,
    previousValue: 2.8,
    format: 'number',
    suffix: 'x',
    changePercent: -17.9,
  },
  {
    id: 'cpc',
    label: 'CPC',
    value: 0.58,
    previousValue: 0.45,
    format: 'currency',
    changePercent: 28.9,
  },
  {
    id: 'ctr',
    label: 'CTR',
    value: 1.7,
    previousValue: 2.1,
    format: 'percent',
    changePercent: -19.0,
  },
  {
    id: 'conversions',
    label: 'Conversiones',
    value: 342,
    previousValue: 298,
    format: 'number',
    changePercent: 14.8,
  },
  {
    id: 'cpa',
    label: 'CPA',
    value: 36.40,
    previousValue: 37.58,
    format: 'currency',
    changePercent: -3.1,
  },
])

// Date range
const dateRange = {
  start: '2026-01-06',
  end: '2026-01-12',
}

// Format date range for display
function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const yearOptions: Intl.DateTimeFormatOptions = { year: 'numeric' }

  const startFormatted = startDate.toLocaleDateString('es-ES', options)
  const endFormatted = endDate.toLocaleDateString('es-ES', options)
  const year = endDate.toLocaleDateString('es-ES', yearOptions)

  return `${startFormatted} - ${endFormatted}, ${year}`
}

const formattedDateRange = computed(() => formatDateRange(dateRange.start, dateRange.end))

// RCA Modal state
const showInsightModal = ref(false)
const selectedMetric = ref<Metric | null>(null)
const isAnalyzing = ref(false)
const rcaResult = ref<RCAResult | null>(null)

// Executive Summary Modal state
const showSummaryModal = ref(false)
const isGeneratingSummary = ref(false)
const summaryResult = ref<SummaryResult | null>(null)
const summaryConfig = ref({
  tone: 'professional' as 'professional' | 'casual' | 'technical',
  language: 'es' as 'es' | 'en',
})

// Format helpers
function formatValue(metric: Metric): string {
  if (metric.format === 'currency') {
    return `$${metric.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (metric.format === 'percent') {
    return `${metric.value.toFixed(1)}%`
  }
  if (metric.suffix) {
    return `${metric.value.toFixed(1)}${metric.suffix}`
  }
  return metric.value.toLocaleString()
}

function getChangeColor(metricId: string, change: number): string {
  // For CPC and CPA, negative is good (lower cost = better)
  const invertedMetrics = ['cpc', 'cpa']
  const isInverted = invertedMetrics.includes(metricId)

  if (isInverted) {
    return change <= 0 ? 'text-green-600' : 'text-red-600'
  }
  return change >= 0 ? 'text-green-600' : 'text-red-600'
}

function getChangeBgColor(metricId: string, change: number): string {
  const invertedMetrics = ['cpc', 'cpa']
  const isInverted = invertedMetrics.includes(metricId)

  if (isInverted) {
    return change <= 0 ? 'bg-green-50' : 'bg-red-50'
  }
  return change >= 0 ? 'bg-green-50' : 'bg-red-50'
}

// Analyze metric with RCA
async function analyzeMetric(metric: Metric) {
  selectedMetric.value = metric
  showInsightModal.value = true
  isAnalyzing.value = true
  rcaResult.value = null

  try {
    const response = await $fetch<any>('/api/ai/rca', {
      method: 'POST',
      body: {
        metricName: metric.id,
        metricLabel: metric.label,
        currentValue: metric.value,
        previousValue: metric.previousValue,
        context: {
          clientName: mockClient.name,
          industry: mockClient.industry,
          platform: 'google_ads',
          dateRange,
        },
      },
    })

    if (response.success) {
      rcaResult.value = response.analysis || response.result
    }
  }
  catch (e) {
    // Use fallback mock result
    rcaResult.value = generateMockRCA(metric)
  }
  finally {
    isAnalyzing.value = false
  }
}

// Generate mock RCA if API fails
function generateMockRCA(metric: Metric): RCAResult {
  const isNegative = metric.changePercent < 0

  const mockCauses: Record<string, RCACause[]> = {
    roas: [
      {
        factor: 'Aumento en competencia',
        explanation: 'Se detectaron 3 nuevos competidores activos en las subastas de tu segmento principal.',
        confidence: 0.85,
        action: 'Revisa Auction Insights y considera ajustar tu estrategia de puja.',
      },
      {
        factor: 'Fatiga de audiencia',
        explanation: 'La frecuencia promedio subió a 4.2 impresiones por usuario. El CTR baja cuando supera 3.',
        confidence: 0.72,
        action: 'Rota creativos o expande el targeting.',
      },
    ],
    ctr: [
      {
        factor: 'Creativos desactualizados',
        explanation: 'Los anuncios principales tienen más de 30 días sin cambios.',
        confidence: 0.78,
        action: 'Actualiza los creativos con nuevas imágenes y copy.',
      },
      {
        factor: 'Saturación de audiencia',
        explanation: 'El 68% de las impresiones fueron a usuarios que ya vieron el anuncio 3+ veces.',
        confidence: 0.65,
        action: 'Implementa frequency capping o expande audiencias.',
      },
    ],
    cpc: [
      {
        factor: 'Mayor competencia en keywords',
        explanation: 'Las keywords principales aumentaron su CPC promedio un 23% en el mercado.',
        confidence: 0.82,
        action: 'Explora keywords de cola larga con menor competencia.',
      },
      {
        factor: 'Quality Score bajo',
        explanation: 'El Quality Score promedio bajó de 7 a 5 en las keywords principales.',
        confidence: 0.68,
        action: 'Mejora la relevancia de landing pages y ad copy.',
      },
    ],
  }

  const causes = mockCauses[metric.id] || [
    {
      factor: 'Variación estacional',
      explanation: 'Cambios normales basados en patrones históricos del mercado.',
      confidence: 0.6,
      action: 'Monitorea la tendencia en las próximas semanas.',
    },
  ]

  return {
    metric: metric.id,
    metricLabel: metric.label,
    change: {
      percentage: metric.changePercent,
      direction: isNegative ? 'down' : 'up',
    },
    causes,
    summary: `${metric.label} ${isNegative ? 'bajó' : 'subió'} ${Math.abs(metric.changePercent).toFixed(1)}% esta semana. ${causes[0]?.explanation ?? 'Analizando factores...'}`,
    isFallback: true,
  }
}

// Generate executive summary
async function generateSummary() {
  isGeneratingSummary.value = true
  summaryResult.value = null

  try {
    const response = await $fetch<any>('/api/ai/executive-summary', {
      method: 'POST',
      body: {
        clientName: mockClient.name,
        metrics: mockMetrics.value.map(m => ({
          name: m.id,
          label: m.label,
          value: m.value,
          previousValue: m.previousValue,
          format: m.format,
          changePercent: m.changePercent,
        })),
        dateRange,
        tone: summaryConfig.value.tone,
        language: summaryConfig.value.language,
        includeRCA: true,
        includeForecast: true,
      },
    })

    if (response.success) {
      summaryResult.value = response.summary
    }
  }
  catch (e) {
    // Use fallback mock summary
    summaryResult.value = generateMockSummary()
  }
  finally {
    isGeneratingSummary.value = false
  }
}

function generateMockSummary(): SummaryResult {
  return {
    markdown: `# Resumen Ejecutivo: ${mockClient.name}
**Periodo:** 6 Ene - 12 Ene, 2026

## Métricas Clave
| Métrica | Actual | Anterior | Cambio |
|---------|--------|----------|--------|
| Spend | $12,450 | $11,200 | +11.2% |
| ROAS | 2.3x | 2.8x | -17.9% |
| CPC | $0.58 | $0.45 | +28.9% |
| CTR | 1.7% | 2.1% | -19.0% |
| Conversiones | 342 | 298 | +14.8% |

## Análisis
Esta semana vimos un aumento significativo en spend (+11.2%) pero con una caída en eficiencia. El ROAS bajó 17.9%, principalmente por el aumento en CPC (+28.9%) y la caída en CTR (-19.0%).

A pesar de la menor eficiencia, las conversiones totales aumentaron 14.8%, lo que sugiere que el volumen adicional compensó parcialmente la pérdida de eficiencia.

## Recomendación
El ROAS bajó -17.9%. La causa principal identificada es el aumento en competencia, con 3 nuevos competidores activos en el segmento.

**Acción sugerida:** Revisa Auction Insights y considera ajustar tu estrategia de puja.

## Proyección
Proyectamos un spend de $13,200 para la próxima semana (+6% vs semana actual).

---
*Generado por TamarindoReports - 13 de enero, 2026*`,
    isFallback: true,
  }
}

// Copy summary to clipboard
const copied = ref(false)
async function copySummary() {
  if (!summaryResult.value) return
  try {
    await navigator.clipboard.writeText(summaryResult.value.markdown)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
  catch (e) {
    console.error('Failed to copy:', e)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header - Mobile First -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-14 sm:h-16">
          <!-- Logo -->
          <div class="flex items-center gap-2 sm:gap-4">
            <NuxtLink to="/" class="flex items-center gap-2 sm:gap-3">
              <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <span class="text-white font-bold text-xs sm:text-sm">T</span>
              </div>
              <span class="font-semibold text-gray-900 text-sm sm:text-base hidden sm:inline">TamarindoReports</span>
            </NuxtLink>
            <span class="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-100 text-amber-700 text-[10px] sm:text-xs font-medium rounded-full">
              Demo
            </span>
          </div>
          <!-- CTA - Touch friendly -->
          <NuxtLink
            to="/register"
            class="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 active:from-amber-700 active:to-orange-700 transition-all min-h-[44px]"
          >
            <span class="hidden sm:inline">Crear cuenta gratis</span>
            <span class="sm:hidden">Registrarse</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Demo Banner - Responsive -->
    <div class="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 sm:py-3">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p class="text-xs sm:text-sm leading-relaxed">
          <Icon name="heroicons:sparkles" class="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" aria-hidden="true" />
          <span class="hidden sm:inline">Esto es una demo con datos de ejemplo. </span>
          <span class="sm:hidden">Demo con datos de ejemplo. </span>
          <NuxtLink to="/register" class="underline font-medium hover:no-underline">
            Crea tu cuenta gratis
          </NuxtLink>
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Client Header - Stack on mobile -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 class="text-fluid-xl font-bold text-gray-900">{{ mockClient.name }}</h1>
          <p class="text-sm sm:text-base text-gray-500 mt-1">{{ formattedDateRange }}</p>
        </div>
        <!-- CTA Button - Full width on mobile -->
        <button
          type="button"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl sm:rounded-lg hover:from-amber-600 hover:to-orange-600 active:from-amber-700 active:to-orange-700 transition-all shadow-lg shadow-amber-500/25 min-h-[48px] sm:min-h-[44px]"
          @click="showSummaryModal = true; generateSummary()"
        >
          <Icon name="heroicons:document-text" class="w-5 h-5" aria-hidden="true" />
          <span>Generar Resumen Ejecutivo</span>
        </button>
      </div>

      <!-- Metrics Section -->
      <section class="mb-8 sm:mb-10">
        <!-- Section header with swipe hint -->
        <div class="flex items-center justify-between mb-3 sm:mb-4">
          <h2 class="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Métricas Clave
          </h2>
          <span class="text-xs text-gray-400 sm:hidden flex items-center gap-1">
            <Icon name="heroicons:arrow-right" class="w-3 h-3" aria-hidden="true" />
            Desliza
          </span>
        </div>

        <!-- Metrics: Horizontal scroll on mobile, Grid on desktop -->
        <div
          class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 sm:snap-none lg:grid-cols-3"
        >
          <div
            v-for="metric in mockMetrics"
            :key="metric.id"
            class="flex-shrink-0 w-[280px] sm:w-auto bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200 ease-out snap-center sm:snap-align-none touch-manipulation"
          >
            <!-- Metric header -->
            <div class="flex items-start justify-between mb-3 sm:mb-4">
              <p class="text-xs sm:text-sm font-medium text-gray-500">{{ metric.label }}</p>
              <span
                class="text-xs sm:text-sm font-semibold px-2 py-0.5 rounded-full"
                :class="[getChangeColor(metric.id, metric.changePercent), getChangeBgColor(metric.id, metric.changePercent)]"
              >
                {{ metric.changePercent >= 0 ? '+' : '' }}{{ metric.changePercent.toFixed(1) }}%
              </span>
            </div>

            <!-- Metric value -->
            <p class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              {{ formatValue(metric) }}
            </p>

            <!-- Insight button - Touch friendly -->
            <button
              v-if="Math.abs(metric.changePercent) >= 10"
              type="button"
              class="w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-amber-50 text-amber-700 font-medium rounded-lg hover:bg-amber-100 active:bg-amber-200 transition-colors min-h-[44px]"
              @click="analyzeMetric(metric)"
            >
              <Icon name="heroicons:light-bulb" class="w-4 h-4" aria-hidden="true" />
              <span class="text-sm">¿Por qué cambió?</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Features Callout - Horizontal on mobile, Grid on desktop -->
      <section>
        <div class="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 flex gap-4 sm:block transition-all duration-200 hover:shadow-md hover:border-gray-300"
          >
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 sm:mb-4">
              <Icon :name="feature.icon" class="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" aria-hidden="true" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 text-sm sm:text-base mb-1 sm:mb-2">{{ feature.title }}</h3>
              <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- RCA Insight Modal - Full screen on mobile -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showInsightModal"
          class="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rca-modal-title"
        >
          <!-- Backdrop -->
          <div
            class="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            @click="showInsightModal = false"
          />

          <!-- Modal container - Bottom sheet on mobile -->
          <div class="flex min-h-full items-end sm:items-center justify-center sm:p-4">
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="translate-y-full sm:translate-y-4 sm:scale-95 opacity-0"
              enter-to-class="translate-y-0 sm:scale-100 opacity-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="translate-y-0 sm:scale-100 opacity-100"
              leave-to-class="translate-y-full sm:translate-y-4 sm:scale-95 opacity-0"
            >
              <div
                v-if="showInsightModal"
                class="relative w-full h-[90vh] sm:h-auto sm:max-h-[85vh] max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              >
                <!-- Mobile drag handle -->
                <div class="sm:hidden flex justify-center pt-3 pb-1">
                  <div class="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                <!-- Header -->
                <div class="flex items-center justify-between px-5 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Icon name="heroicons:light-bulb" class="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 id="rca-modal-title" class="text-base sm:text-lg font-semibold text-gray-900">Análisis de Causa</h2>
                      <p class="text-xs sm:text-sm text-gray-500">{{ selectedMetric?.label }}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="p-2.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Cerrar modal"
                    @click="showInsightModal = false"
                  >
                    <Icon name="heroicons:x-mark" class="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <!-- Content - Scrollable -->
                <div class="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5">
                  <!-- Loading with skeleton -->
                  <div v-if="isAnalyzing" class="py-8 sm:py-12">
                    <div class="flex flex-col items-center">
                      <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                        <Icon name="heroicons:arrow-path" class="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 animate-spin" aria-hidden="true" />
                      </div>
                      <p class="text-gray-600 font-medium text-sm sm:text-base">Analizando con IA...</p>
                      <!-- Skeleton loader -->
                      <div class="w-full mt-6 space-y-3">
                        <div class="h-4 bg-gray-200 rounded skeleton-shimmer w-3/4 mx-auto" />
                        <div class="h-4 bg-gray-200 rounded skeleton-shimmer w-1/2 mx-auto" />
                      </div>
                    </div>
                  </div>

                  <!-- Result -->
                  <template v-else-if="rcaResult">
                    <!-- Change badge -->
                    <div class="flex items-center gap-2 mb-4">
                      <span
                        class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold"
                        :class="rcaResult.change.direction === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                      >
                        <Icon
                          :name="rcaResult.change.direction === 'up' ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'"
                          class="w-4 h-4"
                          aria-hidden="true"
                        />
                        {{ rcaResult.change.percentage >= 0 ? '+' : '' }}{{ rcaResult.change.percentage.toFixed(1) }}%
                      </span>
                    </div>

                    <!-- Demo badge -->
                    <div v-if="rcaResult.isFallback" class="mb-4 flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs sm:text-sm text-blue-700">
                      <Icon name="heroicons:information-circle" class="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Demo - Crea tu cuenta para análisis con tus datos reales</span>
                    </div>

                    <!-- Summary -->
                    <div class="bg-gray-50 rounded-xl p-4 mb-5">
                      <p class="text-sm sm:text-base text-gray-700 leading-relaxed">{{ rcaResult.summary }}</p>
                    </div>

                    <!-- Causes -->
                    <div class="space-y-3">
                      <h3 class="text-xs sm:text-sm font-semibold text-gray-900">Causas identificadas</h3>
                      <div
                        v-for="(cause, i) in rcaResult.causes"
                        :key="i"
                        class="border border-gray-200 rounded-xl p-4"
                      >
                        <div class="flex items-start justify-between gap-3 mb-2">
                          <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">
                              {{ i + 1 }}
                            </span>
                            <span class="font-medium text-gray-900 text-sm sm:text-base">{{ cause.factor }}</span>
                          </div>
                          <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
                            {{ Math.round(cause.confidence * 100) }}%
                          </span>
                        </div>
                        <p class="text-xs sm:text-sm text-gray-600 ml-8 mb-2 leading-relaxed">{{ cause.explanation }}</p>
                        <div v-if="cause.action" class="ml-8 flex items-start gap-2 p-2.5 bg-green-50 rounded-lg">
                          <Icon name="heroicons:check-circle" class="w-4 h-4 text-green-600 mt-0.5 shrink-0" aria-hidden="true" />
                          <span class="text-xs sm:text-sm text-green-800 leading-relaxed">{{ cause.action }}</span>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Executive Summary Modal - Full screen on mobile -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showSummaryModal"
          class="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-modal-title"
        >
          <!-- Backdrop -->
          <div
            class="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            @click="showSummaryModal = false"
          />

          <!-- Modal container - Bottom sheet on mobile -->
          <div class="flex min-h-full items-end sm:items-center justify-center sm:p-4">
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="translate-y-full sm:translate-y-4 sm:scale-95 opacity-0"
              enter-to-class="translate-y-0 sm:scale-100 opacity-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="translate-y-0 sm:scale-100 opacity-100"
              leave-to-class="translate-y-full sm:translate-y-4 sm:scale-95 opacity-0"
            >
              <div
                v-if="showSummaryModal"
                class="relative w-full h-[95vh] sm:h-auto sm:max-h-[90vh] max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              >
                <!-- Mobile drag handle -->
                <div class="sm:hidden flex justify-center pt-3 pb-1">
                  <div class="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                <!-- Header - Sticky -->
                <div class="flex items-center justify-between px-5 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-white">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Icon name="heroicons:document-text" class="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 id="summary-modal-title" class="text-base sm:text-lg font-semibold text-gray-900">Resumen Ejecutivo</h2>
                      <p class="text-xs sm:text-sm text-gray-500">{{ mockClient.name }}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="p-2.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Cerrar modal"
                    @click="showSummaryModal = false"
                  >
                    <Icon name="heroicons:x-mark" class="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <!-- Content - Scrollable -->
                <div class="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5">
                  <!-- Loading with skeleton -->
                  <div v-if="isGeneratingSummary" class="py-8 sm:py-12">
                    <div class="flex flex-col items-center">
                      <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                        <Icon name="heroicons:arrow-path" class="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 animate-spin" aria-hidden="true" />
                      </div>
                      <p class="text-gray-600 font-medium text-sm sm:text-base">Generando resumen...</p>
                      <!-- Skeleton loader -->
                      <div class="w-full mt-6 space-y-3">
                        <div class="h-4 bg-gray-200 rounded skeleton-shimmer w-full" />
                        <div class="h-4 bg-gray-200 rounded skeleton-shimmer w-5/6" />
                        <div class="h-4 bg-gray-200 rounded skeleton-shimmer w-4/6" />
                      </div>
                    </div>
                  </div>

                  <!-- Result -->
                  <template v-else-if="summaryResult">
                    <!-- Demo badge -->
                    <div v-if="summaryResult.isFallback" class="mb-4 flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs sm:text-sm text-blue-700">
                      <Icon name="heroicons:information-circle" class="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Demo - Crea tu cuenta para resúmenes con tus datos reales</span>
                    </div>

                    <!-- Markdown preview -->
                    <div class="prose prose-sm max-w-none bg-gray-50 rounded-xl p-4 sm:p-6 overflow-x-auto">
                      <pre class="whitespace-pre-wrap text-xs sm:text-sm text-gray-700 font-sans leading-relaxed">{{ summaryResult.markdown }}</pre>
                    </div>
                  </template>
                </div>

                <!-- Footer - Sticky -->
                <div v-if="summaryResult && !isGeneratingSummary" class="flex items-center justify-between px-5 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50">
                  <p class="text-xs text-gray-500 hidden sm:block">Listo para copiar y enviar</p>
                  <button
                    type="button"
                    class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium rounded-lg transition-colors min-h-[48px] sm:min-h-[44px]"
                    @click="copySummary"
                  >
                    <Icon :name="copied ? 'heroicons:check' : 'heroicons:clipboard-document'" class="w-4 h-4" aria-hidden="true" />
                    {{ copied ? 'Copiado!' : 'Copiar resumen' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Fluid typography */
.text-fluid-xl {
  font-size: clamp(1.25rem, 1rem + 1.5vw, 1.75rem);
}

/* Hide scrollbar */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Skeleton shimmer animation */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .transition-all,
  .transition-colors,
  .transition-transform,
  .transition-opacity {
    transition-duration: 0.01ms !important;
  }

  .animate-spin {
    animation: none !important;
  }

  .skeleton-shimmer {
    animation: none !important;
  }
}
</style>
