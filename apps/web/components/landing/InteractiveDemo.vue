<script setup lang="ts">
import { ref, computed } from 'vue'

// Mock data for demo
const mockMetrics = [
  {
    id: 'roas',
    label: 'ROAS',
    value: 2.3,
    previousValue: 2.8,
    format: 'number' as const,
    suffix: 'x',
  },
  {
    id: 'cpc',
    label: 'CPC',
    value: 0.58,
    previousValue: 0.45,
    format: 'currency' as const,
  },
  {
    id: 'ctr',
    label: 'CTR',
    value: 1.7,
    previousValue: 2.1,
    format: 'percent' as const,
  },
]

const selectedMetric = ref(mockMetrics[0])
const showInsight = ref(false)
const isAnalyzing = ref(false)
const analysisResult = ref<any>(null)

// Calculate change percentage
function getChange(metric: typeof mockMetrics[0]) {
  const change = ((metric.value - metric.previousValue) / metric.previousValue) * 100
  return {
    value: change,
    isPositive: change >= 0,
  }
}

// Format value based on type
function formatValue(metric: typeof mockMetrics[0]): string {
  if (metric.format === 'currency') {
    return `$${metric.value.toFixed(2)}`
  }
  if (metric.format === 'percent') {
    return `${metric.value.toFixed(1)}%`
  }
  return `${metric.value.toFixed(1)}${metric.suffix || ''}`
}

// Analyze metric (calls real API with mock context)
async function analyzeMetric() {
  isAnalyzing.value = true
  showInsight.value = true

  try {
    const metric = selectedMetric.value
    const response = await $fetch<any>('/api/ai/rca', {
      method: 'POST',
      body: {
        metricName: metric.id,
        metricLabel: metric.label,
        currentValue: metric.value,
        previousValue: metric.previousValue,
        context: {
          clientName: 'Demo Agency',
          industry: 'E-commerce',
          platform: 'google_ads',
          dateRange: {
            start: '2026-01-06',
            end: '2026-01-13',
          },
        },
      },
    })

    if (response.success) {
      analysisResult.value = response.analysis
    }
  }
  catch (e) {
    // Use fallback mock result
    analysisResult.value = {
      metric: selectedMetric.value.id,
      metricLabel: selectedMetric.value.label,
      change: {
        percentage: getChange(selectedMetric.value).value,
        direction: getChange(selectedMetric.value).isPositive ? 'up' : 'down',
      },
      causes: [
        {
          factor: 'Fatiga de audiencia',
          explanation: 'Tu audiencia principal ha visto los anuncios 4.2 veces en promedio. El CTR baja cuando la frecuencia supera 3.',
          confidence: 0.85,
          action: 'Expande tu audiencia o rota los creativos.',
        },
        {
          factor: 'Mayor competencia',
          explanation: 'Se detectaron 3 nuevos competidores activos en tu segmento esta semana.',
          confidence: 0.72,
          action: 'Revisa Auction Insights y ajusta tu estrategia de puja.',
        },
      ],
      summary: 'El ROAS bajó principalmente por fatiga de audiencia y mayor competencia en el segmento. Recomendamos rotar creativos y expandir targeting.',
      isFallback: true,
    }
  }
  finally {
    isAnalyzing.value = false
  }
}

// Reset demo
function resetDemo() {
  showInsight.value = false
  analysisResult.value = null
}

// Select different metric
function selectMetric(metric: typeof mockMetrics[0]) {
  selectedMetric.value = metric
  resetDemo()
}
</script>

<template>
  <div class="relative">
    <!-- Demo Container -->
    <div class="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-w-md mx-auto">
      <!-- Demo Header -->
      <div class="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
        <div class="flex items-center gap-2">
          <div class="flex gap-1.5">
            <div class="w-3 h-3 rounded-full bg-red-400" />
            <div class="w-3 h-3 rounded-full bg-yellow-400" />
            <div class="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span class="text-xs text-gray-500 ml-2">Dashboard - Demo Agency</span>
        </div>
      </div>

      <!-- Metric Tabs -->
      <div class="flex border-b border-gray-100">
        <button
          v-for="metric in mockMetrics"
          :key="metric.id"
          type="button"
          :class="[
            'flex-1 px-4 py-2.5 text-sm font-medium transition-colors',
            selectedMetric.id === metric.id
              ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
          ]"
          @click="selectMetric(metric)"
        >
          {{ metric.label }}
        </button>
      </div>

      <!-- Main Content -->
      <div class="p-6">
        <!-- Metric Display -->
        <div class="text-center mb-6">
          <p class="text-sm text-gray-500 mb-1">{{ selectedMetric.label }}</p>
          <p class="text-4xl font-bold text-gray-900">
            {{ formatValue(selectedMetric) }}
          </p>
          <div class="flex items-center justify-center gap-1 mt-2">
            <Icon
              :name="getChange(selectedMetric).isPositive
                ? 'heroicons:arrow-trending-up'
                : 'heroicons:arrow-trending-down'"
              :class="[
                'w-5 h-5',
                getChange(selectedMetric).isPositive ? 'text-green-500' : 'text-red-500',
              ]"
            />
            <span
              :class="[
                'text-sm font-semibold',
                getChange(selectedMetric).isPositive ? 'text-green-600' : 'text-red-600',
              ]"
            >
              {{ getChange(selectedMetric).isPositive ? '+' : '' }}{{ getChange(selectedMetric).value.toFixed(1) }}%
            </span>
            <span class="text-sm text-gray-400">vs semana anterior</span>
          </div>
        </div>

        <!-- Insight Button or Result -->
        <Transition
          mode="out-in"
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <!-- Button -->
          <button
            v-if="!showInsight"
            type="button"
            class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
            @click="analyzeMetric"
          >
            <Icon name="heroicons:light-bulb" class="w-5 h-5" />
            <span>¿Por qué cambió?</span>
          </button>

          <!-- Loading -->
          <div
            v-else-if="isAnalyzing"
            class="text-center py-4"
          >
            <Icon name="heroicons:arrow-path" class="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p class="text-sm text-gray-500 mt-2">Analizando con IA...</p>
          </div>

          <!-- Result -->
          <div
            v-else-if="analysisResult"
            class="space-y-4"
          >
            <!-- Summary -->
            <div class="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Icon name="heroicons:light-bulb" class="w-4 h-4 text-amber-600" />
                </div>
                <p class="text-sm text-gray-700 leading-relaxed">
                  {{ analysisResult.summary }}
                </p>
              </div>
            </div>

            <!-- Causes -->
            <div class="space-y-2">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Causas identificadas</p>
              <div
                v-for="(cause, i) in analysisResult.causes?.slice(0, 2)"
                :key="i"
                class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <span class="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {{ i + 1 }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{{ cause.factor }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ cause.explanation }}</p>
                  <p
                    v-if="cause.action"
                    class="text-xs text-amber-700 font-medium mt-1"
                  >
                    → {{ cause.action }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Demo badge -->
            <div
              v-if="analysisResult.isFallback"
              class="flex items-center justify-center gap-1.5 text-xs text-blue-600 bg-blue-50 py-2 rounded-lg"
            >
              <Icon name="heroicons:information-circle" class="w-4 h-4" />
              <span>Demo - Crea tu cuenta para analisis reales</span>
            </div>

            <!-- Reset button -->
            <button
              type="button"
              class="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
              @click="resetDemo"
            >
              ← Probar otra metrica
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Decorative elements -->
    <div class="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-amber-100/50 via-orange-100/50 to-amber-100/50 rounded-full blur-3xl" />
  </div>
</template>
