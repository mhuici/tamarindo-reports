<script setup lang="ts">
interface DataPoint {
  label: string
  value: number
}

interface Props {
  title: string
  type: 'line' | 'bar' | 'pie'
  data?: DataPoint[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'line',
  loading: false,
  data: () => [],
})

// Placeholder chart rendering - in production, integrate with Chart.js
const maxValue = computed(() => {
  if (!props.data.length) return 100
  return Math.max(...props.data.map(d => d.value))
})

const normalizedData = computed(() => {
  return props.data.map(d => ({
    ...d,
    height: (d.value / maxValue.value) * 100,
  }))
})
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4">
    <p class="text-sm font-medium text-gray-500 mb-4">
      {{ title }}
    </p>

    <div
      v-if="loading"
      class="animate-pulse"
    >
      <div class="h-32 bg-gray-200 rounded" />
    </div>

    <template v-else>
      <!-- Empty state -->
      <div
        v-if="!data.length"
        class="h-32 flex items-center justify-center text-gray-400"
      >
        <div class="text-center">
          <Icon
            name="heroicons:chart-bar"
            class="w-8 h-8 mx-auto mb-2"
          />
          <p class="text-sm">
            No data available
          </p>
        </div>
      </div>

      <!-- Bar chart -->
      <div
        v-else-if="type === 'bar'"
        class="h-32"
      >
        <div class="flex items-end justify-around h-full gap-2">
          <div
            v-for="point in normalizedData"
            :key="point.label"
            class="flex-1 flex flex-col items-center"
          >
            <div
              class="w-full bg-tamarindo-500 rounded-t transition-all"
              :style="{ height: `${point.height}%` }"
            />
            <span class="text-xs text-gray-500 mt-1 truncate w-full text-center">
              {{ point.label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Line chart placeholder -->
      <div
        v-else-if="type === 'line'"
        class="h-32"
      >
        <svg
          class="w-full h-full"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          <polyline
            fill="none"
            stroke="#f97316"
            stroke-width="2"
            :points="normalizedData.map((d, i) => `${(i / (normalizedData.length - 1 || 1)) * 100},${40 - (d.height / 100 * 40)}`).join(' ')"
          />
          <polyline
            fill="url(#gradient)"
            :points="`0,40 ${normalizedData.map((d, i) => `${(i / (normalizedData.length - 1 || 1)) * 100},${40 - (d.height / 100 * 40)}`).join(' ')} 100,40`"
          />
          <defs>
            <linearGradient
              id="gradient"
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
        <div class="flex justify-between mt-1">
          <span class="text-xs text-gray-500">{{ normalizedData[0]?.label }}</span>
          <span class="text-xs text-gray-500">{{ normalizedData[normalizedData.length - 1]?.label }}</span>
        </div>
      </div>

      <!-- Pie chart placeholder -->
      <div
        v-else-if="type === 'pie'"
        class="h-32 flex items-center justify-center"
      >
        <div class="w-24 h-24 rounded-full bg-gradient-conic from-tamarindo-500 via-tamarindo-300 to-tamarindo-100" />
      </div>
    </template>
  </div>
</template>
