<script setup lang="ts">
interface Column {
  key: string
  label: string
  format?: 'number' | 'currency' | 'percent' | 'text'
}

interface Props {
  title: string
  columns?: Column[]
  rows?: Record<string, any>[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  columns: () => [],
  rows: () => [],
})

function formatValue(value: any, format?: string) {
  if (value === undefined || value === null) return '-'

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
    case 'percent':
      return `${Number(value).toFixed(1)}%`
    case 'number':
      return new Intl.NumberFormat('en-US').format(value)
    default:
      return String(value)
  }
}
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4">
    <p class="text-sm font-medium text-gray-500 mb-4">
      {{ title }}
    </p>

    <div
      v-if="loading"
      class="animate-pulse space-y-2"
    >
      <div class="h-6 bg-gray-200 rounded" />
      <div class="h-6 bg-gray-100 rounded" />
      <div class="h-6 bg-gray-100 rounded" />
    </div>

    <template v-else>
      <!-- Empty state -->
      <div
        v-if="!rows.length"
        class="py-8 text-center text-gray-400"
      >
        <Icon
          name="heroicons:table-cells"
          class="w-8 h-8 mx-auto mb-2"
        />
        <p class="text-sm">
          No data available
        </p>
      </div>

      <!-- Table -->
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th
                v-for="col in columns"
                :key="col.key"
                class="text-left py-2 px-2 font-medium text-gray-600"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in rows"
              :key="i"
              class="border-b border-gray-100 last:border-0"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="py-2 px-2 text-gray-900"
              >
                {{ formatValue(row[col.key], col.format) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
