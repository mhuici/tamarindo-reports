<script setup lang="ts">
import { ref, computed } from 'vue'

interface RCACause {
  factor: string
  explanation: string
  confidence: number
  action?: string
}

interface Props {
  id: string
  title: string
  value: number
  previousValue?: number
  format?: 'number' | 'currency' | 'percent'
  colorClass?: string
  icon?: string
  hasRealData?: boolean
  insight?: {
    summary: string
    causes?: RCACause[]
  }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  format: 'number',
  colorClass: 'from-blue-500 to-blue-600',
  icon: 'heroicons:presentation-chart-bar',
  hasRealData: false,
  loading: false,
})

// Calculate percentage change
const changePercent = computed(() => {
  if (!props.previousValue || props.previousValue === 0) {
    return props.value > 0 ? 100 : 0
  }
  return Math.round(((props.value - props.previousValue) / props.previousValue) * 100)
})

const isPositive = computed(() => changePercent.value >= 0)

// Format number based on type
function formatValue(num: number): string {
  if (props.format === 'currency') {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(num)
  }
  if (props.format === 'percent') {
    return `${num.toFixed(1)}%`
  }
  // Humanize large numbers
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return new Intl.NumberFormat('es-MX').format(num)
}

// Show insight toggle
const showInsight = ref(false)
</script>

<template>
  <div
    class="flex-shrink-0 w-[280px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden snap-center touch-manipulation"
  >
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-100">
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0"
          :class="colorClass"
        >
          <Icon
            :name="icon"
            class="w-4 h-4 text-white"
          />
        </div>
        <h3 class="font-medium text-gray-900 truncate text-sm">
          {{ title }}
        </h3>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Value -->
      <div class="text-center">
        <p class="text-3xl font-bold text-gray-900">
          {{ formatValue(value) }}
        </p>

        <!-- Change indicator -->
        <div
          v-if="hasRealData && previousValue !== undefined"
          class="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium"
          :class="isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
        >
          <Icon
            :name="isPositive ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'"
            class="w-4 h-4"
          />
          {{ Math.abs(changePercent) }}%
        </div>

        <!-- No data indicator -->
        <p
          v-else-if="!hasRealData"
          class="mt-2 text-sm text-gray-400"
        >
          Sin datos
        </p>
      </div>

      <!-- AI Insight (compact) -->
      <div v-if="insight || loading" class="mt-4">
        <!-- Loading state -->
        <div
          v-if="loading"
          class="flex items-center gap-2 text-sm text-gray-500"
        >
          <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
          <span>Analizando...</span>
        </div>

        <!-- Insight preview -->
        <button
          v-else-if="insight"
          class="w-full text-left bg-amber-50 rounded-xl p-3 border border-amber-100 hover:bg-amber-100 transition-colors"
          @click="showInsight = !showInsight"
        >
          <div class="flex items-start gap-2">
            <Icon name="heroicons:light-bulb" class="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div class="flex-1 min-w-0">
              <p
                class="text-sm text-gray-700"
                :class="{ 'line-clamp-2': !showInsight }"
              >
                {{ insight.summary }}
              </p>
              <span
                v-if="!showInsight && insight.summary.length > 80"
                class="text-xs text-amber-600 font-medium mt-1 inline-block"
              >
                Toca para ver más
              </span>
            </div>
          </div>

          <!-- Expanded causes -->
          <div
            v-if="showInsight && insight.causes?.length"
            class="mt-3 pt-3 border-t border-amber-200 space-y-2"
          >
            <div
              v-for="(cause, i) in insight.causes"
              :key="i"
              class="text-xs text-gray-600"
            >
              <span class="font-medium">{{ cause.factor }}:</span>
              {{ cause.explanation }}
              <span
                v-if="cause.action"
                class="block mt-1 text-amber-700 font-medium"
              >
                → {{ cause.action }}
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
