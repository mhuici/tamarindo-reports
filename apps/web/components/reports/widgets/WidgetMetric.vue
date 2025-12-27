<script setup lang="ts">
interface Props {
  title: string
  value?: number | string
  previousValue?: number
  format?: 'number' | 'currency' | 'percent'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  format: 'number',
  loading: false,
})

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
    </template>
  </div>
</template>
