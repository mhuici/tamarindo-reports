<script setup lang="ts">
interface ForecastPoint {
  date: string
  value: number
  isHistorical: boolean
}

interface ConfidenceInterval {
  upper80: number[]
  lower80: number[]
  upper95: number[]
  lower95: number[]
}

interface ForecastData {
  historical: ForecastPoint[]
  predictions: ForecastPoint[]
  confidence: ConfidenceInterval
  trend: 'up' | 'down' | 'stable'
  trendPercent: number
  summary: string
}

interface Props {
  title?: string
  data?: ForecastData
  loading?: boolean
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Proyección',
  loading: false,
  height: 200,
})

// Combine all data points for scaling
const allPoints = computed(() => {
  if (!props.data) return []
  return [...props.data.historical, ...props.data.predictions]
})

// Calculate chart dimensions
const chartPadding = { top: 20, right: 20, bottom: 30, left: 50 }
const chartWidth = 600
const chartHeight = computed(() => props.height)

const innerWidth = chartWidth - chartPadding.left - chartPadding.right
const innerHeight = computed(() => chartHeight.value - chartPadding.top - chartPadding.bottom)

// Scale values to chart coordinates
const maxValue = computed(() => {
  if (!props.data) return 100
  const allValues = [
    ...props.data.historical.map(p => p.value),
    ...props.data.predictions.map(p => p.value),
    ...props.data.confidence.upper95,
  ]
  return Math.max(...allValues) * 1.1
})

const minValue = computed(() => {
  if (!props.data) return 0
  const allValues = [
    ...props.data.historical.map(p => p.value),
    ...props.data.predictions.map(p => p.value),
    ...props.data.confidence.lower95,
  ]
  return Math.min(0, Math.min(...allValues) * 0.9)
})

function scaleX(index: number): number {
  const totalPoints = allPoints.value.length
  if (totalPoints <= 1) return chartPadding.left
  return chartPadding.left + (index / (totalPoints - 1)) * innerWidth
}

function scaleY(value: number): number {
  const range = maxValue.value - minValue.value
  if (range === 0) return chartPadding.top + innerHeight.value / 2
  return chartPadding.top + innerHeight.value - ((value - minValue.value) / range) * innerHeight.value
}

// Generate SVG path for line
function generateLinePath(points: ForecastPoint[]): string {
  if (points.length === 0) return ''

  const historicalCount = props.data?.historical.length || 0

  return points.map((point, i) => {
    const x = scaleX(point.isHistorical ? i : historicalCount + i - (point.isHistorical ? 0 : 0))
    const actualIndex = point.isHistorical ? i : historicalCount + props.data!.predictions.indexOf(point)
    const xPos = scaleX(actualIndex)
    const y = scaleY(point.value)
    return `${i === 0 ? 'M' : 'L'} ${xPos} ${y}`
  }).join(' ')
}

// Generate confidence area path
function generateAreaPath(upper: number[], lower: number[]): string {
  if (!props.data || upper.length === 0) return ''

  const historicalCount = props.data.historical.length

  // Top line (upper confidence)
  const topPath = upper.map((val, i) => {
    const x = scaleX(historicalCount + i)
    const y = scaleY(val)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  // Bottom line (lower confidence, reversed)
  const bottomPath = lower.slice().reverse().map((val, i) => {
    const x = scaleX(historicalCount + lower.length - 1 - i)
    const y = scaleY(val)
    return `L ${x} ${y}`
  }).join(' ')

  return `${topPath} ${bottomPath} Z`
}

// Historical line path
const historicalPath = computed(() => {
  if (!props.data) return ''
  return generateLinePath(props.data.historical)
})

// Prediction line path
const predictionPath = computed(() => {
  if (!props.data) return ''

  const lastHistorical = props.data.historical[props.data.historical.length - 1]
  const predictions = [{ ...lastHistorical }, ...props.data.predictions]

  const historicalCount = props.data.historical.length

  return predictions.map((point, i) => {
    const x = scaleX(historicalCount - 1 + i)
    const y = scaleY(point.value)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
})

// Confidence bands
const confidence95Path = computed(() => {
  if (!props.data) return ''
  return generateAreaPath(props.data.confidence.upper95, props.data.confidence.lower95)
})

const confidence80Path = computed(() => {
  if (!props.data) return ''
  return generateAreaPath(props.data.confidence.upper80, props.data.confidence.lower80)
})

// Divider line x position
const dividerX = computed(() => {
  if (!props.data) return 0
  return scaleX(props.data.historical.length - 1)
})

// Y-axis labels
const yAxisLabels = computed(() => {
  const labels = []
  const steps = 5
  for (let i = 0; i <= steps; i++) {
    const value = minValue.value + (maxValue.value - minValue.value) * (i / steps)
    labels.push({
      value,
      y: scaleY(value),
      label: formatValue(value),
    })
  }
  return labels
})

function formatValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toFixed(0)
}

// Trend styling
const trendColor = computed(() => {
  if (!props.data) return 'text-gray-500'
  switch (props.data.trend) {
    case 'up': return 'text-green-600'
    case 'down': return 'text-red-600'
    default: return 'text-gray-600'
  }
})

const trendIcon = computed(() => {
  if (!props.data) return 'heroicons:minus'
  switch (props.data.trend) {
    case 'up': return 'heroicons:arrow-trending-up'
    case 'down': return 'heroicons:arrow-trending-down'
    default: return 'heroicons:minus'
  }
})
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-100">
      <div class="flex items-center justify-between">
        <h3 class="font-medium text-gray-900">
          {{ title }}
        </h3>
        <div
          v-if="data && !loading"
          class="flex items-center gap-1 text-sm font-medium"
          :class="trendColor"
        >
          <Icon :name="trendIcon" class="w-4 h-4" />
          <span>{{ data.trendPercent >= 0 ? '+' : '' }}{{ data.trendPercent.toFixed(1) }}%</span>
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="p-4">
      <!-- Loading state -->
      <div
        v-if="loading"
        class="flex items-center justify-center"
        :style="{ height: `${height}px` }"
      >
        <div class="flex items-center gap-2 text-gray-500">
          <Icon name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
          <span>Calculando proyección...</span>
        </div>
      </div>

      <!-- No data -->
      <div
        v-else-if="!data"
        class="flex items-center justify-center text-gray-400"
        :style="{ height: `${height}px` }"
      >
        Sin datos para proyección
      </div>

      <!-- Chart SVG -->
      <svg
        v-else
        :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
        class="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Y-axis labels -->
        <g class="text-xs fill-gray-400">
          <text
            v-for="label in yAxisLabels"
            :key="label.value"
            :x="chartPadding.left - 8"
            :y="label.y + 4"
            text-anchor="end"
          >
            {{ label.label }}
          </text>
        </g>

        <!-- Grid lines -->
        <g class="stroke-gray-100">
          <line
            v-for="label in yAxisLabels"
            :key="`grid-${label.value}`"
            :x1="chartPadding.left"
            :y1="label.y"
            :x2="chartWidth - chartPadding.right"
            :y2="label.y"
            stroke-dasharray="4 4"
          />
        </g>

        <!-- Confidence band 95% -->
        <path
          :d="confidence95Path"
          class="fill-blue-100 opacity-50"
        />

        <!-- Confidence band 80% -->
        <path
          :d="confidence80Path"
          class="fill-blue-200 opacity-50"
        />

        <!-- Divider line (today) -->
        <line
          :x1="dividerX"
          :y1="chartPadding.top"
          :x2="dividerX"
          :y2="chartHeight - chartPadding.bottom"
          class="stroke-gray-300"
          stroke-dasharray="4 4"
        />

        <!-- Historical line -->
        <path
          :d="historicalPath"
          class="stroke-gray-700 fill-none"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Prediction line -->
        <path
          :d="predictionPath"
          class="stroke-blue-500 fill-none"
          stroke-width="2"
          stroke-dasharray="6 4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Labels -->
        <text
          :x="dividerX - 8"
          :y="chartHeight - 8"
          class="text-xs fill-gray-500"
          text-anchor="end"
        >
          Histórico
        </text>
        <text
          :x="dividerX + 8"
          :y="chartHeight - 8"
          class="text-xs fill-blue-500"
          text-anchor="start"
        >
          Proyección
        </text>
      </svg>

      <!-- Summary -->
      <div
        v-if="data"
        class="mt-4 flex items-start gap-2 p-3 bg-gray-50 rounded-lg"
      >
        <Icon name="heroicons:chart-bar" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p class="text-sm text-gray-600">
          {{ data.summary }}
        </p>
      </div>

      <!-- Legend -->
      <div
        v-if="data"
        class="mt-3 flex items-center justify-center gap-6 text-xs text-gray-500"
      >
        <div class="flex items-center gap-1.5">
          <div class="w-4 h-0.5 bg-gray-700 rounded" />
          <span>Datos históricos</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-4 h-0.5 bg-blue-500 rounded" style="border-style: dashed;" />
          <span>Proyección</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 bg-blue-200 rounded opacity-50" />
          <span>Intervalo 80%</span>
        </div>
      </div>
    </div>
  </div>
</template>
