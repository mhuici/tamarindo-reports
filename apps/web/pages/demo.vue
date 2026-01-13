<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: 'Demo - TamarindoReports',
  description: 'Explora TamarindoReports con datos de ejemplo. Prueba el análisis de causa, narrativas AI y forecasting.',
})

// Mock client data
const mockClient = {
  name: 'Acme E-commerce',
  industry: 'E-commerce',
}

// Mock metrics with significant changes
const mockMetrics = ref([
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

// RCA Modal state
const showInsightModal = ref(false)
const selectedMetric = ref<typeof mockMetrics.value[0] | null>(null)
const isAnalyzing = ref(false)
const rcaResult = ref<any>(null)

// Executive Summary Modal state
const showSummaryModal = ref(false)
const isGeneratingSummary = ref(false)
const summaryResult = ref<any>(null)
const summaryConfig = ref({
  tone: 'professional' as 'professional' | 'casual' | 'technical',
  language: 'es' as 'es' | 'en',
})

// Format helpers
function formatValue(metric: typeof mockMetrics.value[0]): string {
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

function getChangeColor(change: number): string {
  // For CPC and CPA, negative is good
  const metric = selectedMetric.value
  const invertedMetrics = ['cpc', 'cpa']
  const isInverted = metric && invertedMetrics.includes(metric.id)

  if (isInverted) {
    return change <= 0 ? 'text-green-600' : 'text-red-600'
  }
  return change >= 0 ? 'text-green-600' : 'text-red-600'
}

// Analyze metric with RCA
async function analyzeMetric(metric: typeof mockMetrics.value[0]) {
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
function generateMockRCA(metric: typeof mockMetrics.value[0]) {
  const isNegative = metric.changePercent < 0

  const mockCauses: Record<string, any[]> = {
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
    summary: `${metric.label} ${isNegative ? 'bajó' : 'subió'} ${Math.abs(metric.changePercent).toFixed(1)}% esta semana. ${causes[0].explanation}`,
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

function generateMockSummary() {
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
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/"
              class="flex items-center gap-3"
            >
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <span class="text-white font-bold text-sm">T</span>
              </div>
              <span class="font-semibold text-gray-900">TamarindoReports</span>
            </NuxtLink>
            <span class="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              Demo
            </span>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/register"
              class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              Crear cuenta gratis
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Demo Banner -->
    <div class="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p class="text-sm">
          <Icon name="heroicons:sparkles" class="w-4 h-4 inline mr-1" />
          Esto es una demo con datos de ejemplo.
          <NuxtLink to="/register" class="underline font-medium hover:no-underline">
            Crea tu cuenta gratis
          </NuxtLink>
          para conectar tus datos reales.
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Client Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ mockClient.name }}</h1>
          <p class="text-gray-500">{{ dateRange.start }} - {{ dateRange.end }}</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25"
          @click="showSummaryModal = true; generateSummary()"
        >
          <Icon name="heroicons:document-text" class="w-5 h-5" />
          Resumen Ejecutivo
        </button>
      </div>

      <!-- Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div
          v-for="metric in mockMetrics"
          :key="metric.id"
          class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
        >
          <div class="flex items-start justify-between mb-4">
            <p class="text-sm font-medium text-gray-500">{{ metric.label }}</p>
            <span
              class="text-sm font-semibold"
              :class="getChangeColor(metric.changePercent)"
            >
              {{ metric.changePercent >= 0 ? '+' : '' }}{{ metric.changePercent.toFixed(1) }}%
            </span>
          </div>

          <p class="text-3xl font-bold text-gray-900 mb-4">
            {{ formatValue(metric) }}
          </p>

          <!-- Insight button for significant changes -->
          <button
            v-if="Math.abs(metric.changePercent) >= 10"
            type="button"
            class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 font-medium rounded-lg hover:bg-amber-100 transition-colors"
            @click="analyzeMetric(metric)"
          >
            <Icon name="heroicons:light-bulb" class="w-4 h-4" />
            ¿Por qué cambió?
          </button>
        </div>
      </div>

      <!-- Features Callout -->
      <div class="grid md:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
            <Icon name="heroicons:light-bulb" class="w-6 h-6 text-amber-600" />
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Análisis de Causa</h3>
          <p class="text-sm text-gray-600">
            Haz click en "¿Por qué cambió?" en cualquier métrica con cambio significativo para ver el análisis de IA.
          </p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
            <Icon name="heroicons:document-text" class="w-6 h-6 text-amber-600" />
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Resumen Ejecutivo</h3>
          <p class="text-sm text-gray-600">
            Genera un resumen completo listo para enviar a tu cliente con un solo click.
          </p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
            <Icon name="heroicons:chart-bar-square" class="w-6 h-6 text-amber-600" />
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Forecasting</h3>
          <p class="text-sm text-gray-600">
            Predicciones de spend y métricas incluidas automáticamente en el resumen ejecutivo.
          </p>
        </div>
      </div>
    </main>

    <!-- RCA Insight Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showInsightModal"
          class="fixed inset-0 z-50 overflow-y-auto"
        >
          <div
            class="fixed inset-0 bg-black/50 backdrop-blur-sm"
            @click="showInsightModal = false"
          />
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl">
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Icon name="heroicons:light-bulb" class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900">Análisis de Causa</h2>
                    <p class="text-sm text-gray-500">{{ selectedMetric?.label }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  @click="showInsightModal = false"
                >
                  <Icon name="heroicons:x-mark" class="w-5 h-5" />
                </button>
              </div>

              <!-- Content -->
              <div class="px-6 py-5">
                <!-- Loading -->
                <div v-if="isAnalyzing" class="py-12 text-center">
                  <Icon name="heroicons:arrow-path" class="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
                  <p class="text-gray-600">Analizando con IA...</p>
                </div>

                <!-- Result -->
                <template v-else-if="rcaResult">
                  <!-- Change badge -->
                  <div class="flex items-center gap-2 mb-4">
                    <span
                      class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
                      :class="rcaResult.change.direction === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                    >
                      <Icon
                        :name="rcaResult.change.direction === 'up' ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'"
                        class="w-4 h-4"
                      />
                      {{ rcaResult.change.percentage >= 0 ? '+' : '' }}{{ rcaResult.change.percentage.toFixed(1) }}%
                    </span>
                  </div>

                  <!-- Demo badge -->
                  <div v-if="rcaResult.isFallback" class="mb-4 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                    <Icon name="heroicons:information-circle" class="w-4 h-4" />
                    <span>Demo - Crea tu cuenta para análisis con tus datos reales</span>
                  </div>

                  <!-- Summary -->
                  <div class="bg-gray-50 rounded-xl p-4 mb-5">
                    <p class="text-gray-700">{{ rcaResult.summary }}</p>
                  </div>

                  <!-- Causes -->
                  <div class="space-y-3">
                    <h3 class="text-sm font-semibold text-gray-900">Causas identificadas</h3>
                    <div
                      v-for="(cause, i) in rcaResult.causes"
                      :key="i"
                      class="border border-gray-200 rounded-xl p-4"
                    >
                      <div class="flex items-start justify-between gap-3 mb-2">
                        <div class="flex items-center gap-2">
                          <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                            {{ i + 1 }}
                          </span>
                          <span class="font-medium text-gray-900">{{ cause.factor }}</span>
                        </div>
                        <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          {{ Math.round(cause.confidence * 100) }}%
                        </span>
                      </div>
                      <p class="text-sm text-gray-600 ml-8 mb-2">{{ cause.explanation }}</p>
                      <div v-if="cause.action" class="ml-8 flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                        <Icon name="heroicons:check-circle" class="w-4 h-4 text-green-600 mt-0.5" />
                        <span class="text-sm text-green-800">{{ cause.action }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Executive Summary Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showSummaryModal"
          class="fixed inset-0 z-50 overflow-y-auto"
        >
          <div
            class="fixed inset-0 bg-black/50 backdrop-blur-sm"
            @click="showSummaryModal = false"
          />
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Icon name="heroicons:document-text" class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900">Resumen Ejecutivo</h2>
                    <p class="text-sm text-gray-500">{{ mockClient.name }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  @click="showSummaryModal = false"
                >
                  <Icon name="heroicons:x-mark" class="w-5 h-5" />
                </button>
              </div>

              <!-- Content -->
              <div class="px-6 py-5 overflow-y-auto flex-1">
                <!-- Loading -->
                <div v-if="isGeneratingSummary" class="py-12 text-center">
                  <Icon name="heroicons:arrow-path" class="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
                  <p class="text-gray-600">Generando resumen...</p>
                </div>

                <!-- Result -->
                <template v-else-if="summaryResult">
                  <!-- Demo badge -->
                  <div v-if="summaryResult.isFallback" class="mb-4 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                    <Icon name="heroicons:information-circle" class="w-4 h-4" />
                    <span>Demo - Crea tu cuenta para resúmenes con tus datos reales</span>
                  </div>

                  <!-- Markdown preview -->
                  <div class="prose prose-sm max-w-none bg-gray-50 rounded-xl p-6 overflow-x-auto">
                    <pre class="whitespace-pre-wrap text-sm text-gray-700 font-sans">{{ summaryResult.markdown }}</pre>
                  </div>
                </template>
              </div>

              <!-- Footer -->
              <div v-if="summaryResult && !isGeneratingSummary" class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                <p class="text-xs text-gray-500">Listo para copiar y enviar</p>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors"
                  @click="copySummary"
                >
                  <Icon :name="copied ? 'heroicons:check' : 'heroicons:clipboard-document'" class="w-4 h-4" />
                  {{ copied ? 'Copiado!' : 'Copiar resumen' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
