<script setup lang="ts">
import { computed } from 'vue'

interface DataPoint {
  label: string
  value: number
}

interface Props {
  data: DataPoint[]
  compareEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compareEnabled: false,
})

const maxValue = computed(() => {
  if (!props.data.length) return 100
  return Math.max(...props.data.map(d => d.value), 1)
})

const normalizedData = computed(() => {
  return props.data.map((d: DataPoint) => ({
    ...d,
    height: (d.value / maxValue.value) * 100,
  }))
})

const chartPoints = computed(() => {
  if (!normalizedData.value.length) return ''
  return normalizedData.value
    .map((d: DataPoint & { height: number }, i: number) => {
      const x = normalizedData.value.length > 1
        ? (i / (normalizedData.value.length - 1)) * 100
        : 50
      const y = 100 - d.height
      return `${x},${y}`
    })
    .join(' ')
})

const areaPoints = computed(() => {
  if (!chartPoints.value) return ''
  return `0,100 ${chartPoints.value} 100,100`
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
</script>

<template>
  <div class="h-full">
    <!-- Empty state -->
    <div
      v-if="!data.length"
      class="h-full flex items-center justify-center text-gray-400"
    >
      <div class="text-center">
        <Icon
          name="heroicons:chart-bar"
          class="w-8 h-8 mx-auto mb-2"
        />
        <p class="text-sm">
          No trend data available
        </p>
      </div>
    </div>

    <!-- Chart -->
    <div
      v-else
      class="h-64 relative"
    >
      <!-- Y-axis labels -->
      <div class="absolute left-0 top-0 bottom-6 w-16 flex flex-col justify-between text-xs text-gray-500">
        <span>{{ formatCurrency(maxValue) }}</span>
        <span>{{ formatCurrency(maxValue * 0.5) }}</span>
        <span>$0</span>
      </div>

      <!-- Chart area -->
      <div class="ml-16 h-full pb-6">
        <svg
          class="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <!-- Grid lines -->
          <line
            x1="0"
            y1="0"
            x2="100"
            y2="0"
            stroke="#e5e7eb"
            stroke-width="0.5"
          />
          <line
            x1="0"
            y1="50"
            x2="100"
            y2="50"
            stroke="#e5e7eb"
            stroke-width="0.5"
          />
          <line
            x1="0"
            y1="100"
            x2="100"
            y2="100"
            stroke="#e5e7eb"
            stroke-width="0.5"
          />

          <!-- Area fill -->
          <polygon
            :points="areaPoints"
            fill="url(#trendGradient)"
          />

          <!-- Main line -->
          <polyline
            fill="none"
            stroke="#f97316"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :points="chartPoints"
          />

          <!-- Data points -->
          <circle
            v-for="(point, i) in normalizedData"
            :key="i"
            :cx="normalizedData.length > 1 ? (i / (normalizedData.length - 1)) * 100 : 50"
            :cy="100 - point.height"
            r="3"
            fill="#f97316"
            stroke="white"
            stroke-width="1.5"
          />

          <!-- Gradient definition -->
          <defs>
            <linearGradient
              id="trendGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stop-color="#f97316"
                stop-opacity="0.3"
              />
              <stop
                offset="100%"
                stop-color="#f97316"
                stop-opacity="0"
              />
            </linearGradient>
          </defs>
        </svg>

        <!-- X-axis labels -->
        <div class="flex justify-between mt-2 text-xs text-gray-500">
          <span>{{ normalizedData[0]?.label }}</span>
          <span v-if="normalizedData.length > 2">
            {{ normalizedData[Math.floor(normalizedData.length / 2)]?.label }}
          </span>
          <span>{{ normalizedData[normalizedData.length - 1]?.label }}</span>
        </div>
      </div>
    </div>

    <!-- Compare note -->
    <p
      v-if="compareEnabled"
      class="text-xs text-gray-500 text-center mt-2"
    >
      Comparison with previous period enabled
    </p>
  </div>
</template>
