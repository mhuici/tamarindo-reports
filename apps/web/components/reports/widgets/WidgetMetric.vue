<script setup lang="ts">
import { computed, ref } from 'vue'

interface RCAContext {
  clientName: string
  industry?: string
  platform: string
  dateRange: { start: string; end: string }
}

interface Props {
  title: string
  value?: number | string
  previousValue?: number
  format?: 'number' | 'currency' | 'percent'
  loading?: boolean
  /** Metric key for RCA (e.g., 'cpc', 'ctr', 'roas') */
  metricKey?: string
  /** Context for RCA analysis */
  rcaContext?: RCAContext
  /** Enable the "Why?" insight button */
  showInsightButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  format: 'number',
  loading: false,
  metricKey: '',
  showInsightButton: true,
})

// RCA composable
const { analyzeMetric, isLoading: isRCALoading, getError: getRCAError, getCachedResult } = useRCA()

// Modal state
const showInsightModal = ref(false)
const rcaResult = ref<any>(null)
const rcaError = ref<string | null>(null)
const rcaLoading = ref(false)

// Threshold for showing insight button (10%)
const INSIGHT_THRESHOLD = 10

const formattedValue = computed(() => {
  if (props.value === undefined || props.value === null) return '-'

  const numValue = typeof props.value === 'string' ? parseFloat(props.value) : props.value

  switch (props.format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numValue)
    case 'percent':
      return `${numValue.toFixed(1)}%`
    default:
      return new Intl.NumberFormat('en-US').format(numValue)
  }
})

const change = computed(() => {
  if (!props.previousValue || props.value === undefined) return null
  const current = typeof props.value === 'string' ? parseFloat(props.value) : props.value
  const diff = current - props.previousValue
  const percent = (diff / props.previousValue) * 100
  return {
    value: percent,
    isPositive: diff >= 0,
  }
})

// Check if change is significant enough for insight button
const showInsight = computed(() => {
  if (!props.showInsightButton) return false
  if (!props.metricKey || !props.rcaContext) return false
  if (!change.value) return false
  return Math.abs(change.value.value) >= INSIGHT_THRESHOLD
})

// Date range formatted for display
const periodDisplay = computed(() => {
  if (!props.rcaContext?.dateRange) return ''
  const { start, end } = props.rcaContext.dateRange
  return `${start} - ${end}`
})

async function openInsightModal() {
  if (!props.metricKey || !props.rcaContext || props.value === undefined || !props.previousValue) {
    return
  }

  showInsightModal.value = true
  rcaLoading.value = true
  rcaError.value = null

  try {
    const currentValue = typeof props.value === 'string' ? parseFloat(props.value) : props.value

    const result = await analyzeMetric(
      {
        metricName: props.metricKey,
        metricLabel: props.title,
        currentValue,
        previousValue: props.previousValue,
      },
      props.rcaContext,
    )

    rcaResult.value = result
  }
  catch (err: any) {
    rcaError.value = err?.message || 'Error al analizar la métrica'
  }
  finally {
    rcaLoading.value = false
  }
}

function closeInsightModal() {
  showInsightModal.value = false
}

function retryAnalysis() {
  openInsightModal()
}
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4">
    <p class="text-sm font-medium text-gray-500 mb-1">
      {{ title }}
    </p>

    <div
      v-if="loading"
      class="animate-pulse"
    >
      <div class="h-8 bg-gray-200 rounded w-24" />
    </div>

    <template v-else>
      <p class="text-2xl font-bold text-gray-900">
        {{ formattedValue }}
      </p>

      <div
        v-if="change"
        class="flex items-center gap-1 mt-1"
      >
        <Icon
          :name="change.isPositive ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'"
          :class="[
            'w-4 h-4',
            change.isPositive ? 'text-green-500' : 'text-red-500',
          ]"
        />
        <span
          :class="[
            'text-sm font-medium',
            change.isPositive ? 'text-green-600' : 'text-red-600',
          ]"
        >
          {{ change.isPositive ? '+' : '' }}{{ change.value.toFixed(1) }}%
        </span>
        <span class="text-sm text-gray-500">vs previous</span>
      </div>

      <!-- Insight Button -->
      <button
        v-if="showInsight"
        type="button"
        class="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
        @click="openInsightModal"
      >
        <Icon name="heroicons:light-bulb" class="w-4 h-4" />
        <span>¿Por qué cambió?</span>
      </button>
    </template>

    <!-- Insight Modal -->
    <AIInsightModal
      :open="showInsightModal"
      :loading="rcaLoading"
      :error="rcaError"
      :result="rcaResult"
      :client-name="rcaContext?.clientName"
      :period="periodDisplay"
      @close="closeInsightModal"
      @retry="retryAnalysis"
    />
  </div>
</template>
