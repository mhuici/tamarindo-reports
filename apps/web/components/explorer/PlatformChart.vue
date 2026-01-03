<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  data: Record<string, Record<string, number>>
  labels: Record<string, string>
  icons: Record<string, string>
}

const props = defineProps<Props>()

const platforms = computed(() => Object.keys(props.data))

const maxSpend = computed(() => {
  const spends = platforms.value.map((p: string) => props.data[p]?.spend || 0)
  return Math.max(...spends, 1)
})

const chartData = computed(() => {
  return platforms.value.map((platform: string) => ({
    platform,
    label: props.labels[platform] || platform,
    icon: props.icons[platform] || 'heroicons:globe-alt',
    spend: props.data[platform]?.spend || 0,
    clicks: props.data[platform]?.clicks || 0,
    conversions: props.data[platform]?.conversions || 0,
    percentage: ((props.data[platform]?.spend || 0) / maxSpend.value) * 100,
  }))
})

const colors = ['bg-blue-500', 'bg-orange-500', 'bg-green-500', 'bg-purple-500']

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
  <div class="space-y-4">
    <div
      v-for="(item, index) in chartData"
      :key="item.platform"
      class="flex items-center gap-4"
    >
      <div class="w-32 flex items-center gap-2">
        <Icon
          :name="item.icon"
          class="w-5 h-5"
        />
        <span class="text-sm font-medium text-gray-700 truncate">{{ item.label }}</span>
      </div>
      <div class="flex-1">
        <div class="h-8 bg-gray-100 rounded-lg overflow-hidden">
          <div
            :class="[colors[index % colors.length], 'h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2']"
            :style="{ width: `${item.percentage}%` }"
          >
            <span
              v-if="item.percentage > 20"
              class="text-xs text-white font-medium"
            >
              {{ formatCurrency(item.spend) }}
            </span>
          </div>
        </div>
      </div>
      <div class="w-24 text-right">
        <span
          v-if="item.percentage <= 20"
          class="text-sm font-medium text-gray-900"
        >
          {{ formatCurrency(item.spend) }}
        </span>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-center gap-6 pt-4 border-t border-gray-100">
      <div
        v-for="(item, index) in chartData"
        :key="item.platform"
        class="flex items-center gap-2"
      >
        <div
          :class="[colors[index % colors.length], 'w-3 h-3 rounded']"
        />
        <span class="text-xs text-gray-600">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>
