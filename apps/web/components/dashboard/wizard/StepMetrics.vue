<script setup lang="ts">
import type { MetricCategory, MetricPriority, MetricOption } from '../../../types/dashboard-wizard'

interface Props {
  categories: MetricCategory[]
  metrics: MetricPriority[]
  getCategoryInfo: (category: MetricCategory) => { label: string; icon: string; description: string }
  getMetricsForCategory: (category: MetricCategory) => MetricOption[]
  isMetricSelected: (category: MetricCategory, metricId: string) => boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  updatePriority: [category: MetricCategory, weight: number]
  toggleMetric: [category: MetricCategory, metricId: string]
}>()

function getMetricWeight(category: MetricCategory): number {
  return props.metrics.find(m => m.category === category)?.weight ?? 50
}

function handlePriorityChange(category: MetricCategory, event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value)
  emit('updatePriority', category, value)
}

function handleToggleMetric(category: MetricCategory, metricId: string) {
  emit('toggleMetric', category, metricId)
}

function getPriorityLabel(weight: number): string {
  if (weight >= 80) return 'High'
  if (weight >= 40) return 'Medium'
  return 'Low'
}

function getPriorityColor(weight: number): string {
  if (weight >= 80) return 'text-green-600'
  if (weight >= 40) return 'text-amber-600'
  return 'text-gray-500'
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center max-w-xl mx-auto">
      <h2 class="text-xl font-semibold text-gray-900">
        Configure your metrics
      </h2>
      <p class="mt-2 text-gray-600">
        Adjust the priority of each category and select the specific metrics you want to display.
      </p>
    </div>

    <div class="space-y-6 mt-8">
      <div
        v-for="category in categories"
        :key="category"
        class="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        <!-- Category Header -->
        <div class="p-4 bg-gray-50 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                <Icon
                  :name="getCategoryInfo(category).icon"
                  class="w-5 h-5 text-gray-600"
                />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">
                  {{ getCategoryInfo(category).label }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ getCategoryInfo(category).description }}
                </p>
              </div>
            </div>

            <!-- Priority Slider -->
            <div class="flex items-center gap-4">
              <span
                class="text-sm font-medium min-w-[60px] text-right"
                :class="getPriorityColor(getMetricWeight(category))"
              >
                {{ getPriorityLabel(getMetricWeight(category)) }}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                :value="getMetricWeight(category)"
                class="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-800"
                @input="handlePriorityChange(category, $event)"
              >
            </div>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="p-4">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <button
              v-for="metric in getMetricsForCategory(category)"
              :key="metric.id"
              type="button"
              class="p-3 rounded-lg border text-left transition-all duration-150"
              :class="[
                isMetricSelected(category, metric.id)
                  ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
              ]"
              @click="handleToggleMetric(category, metric.id)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <p
                    class="text-sm font-medium truncate"
                    :class="isMetricSelected(category, metric.id) ? 'text-gray-900' : 'text-gray-700'"
                  >
                    {{ metric.label }}
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {{ metric.description }}
                  </p>
                </div>
                <div
                  v-if="isMetricSelected(category, metric.id)"
                  class="ml-2 flex-shrink-0"
                >
                  <Icon
                    name="heroicons:check-circle-solid"
                    class="w-5 h-5 text-gray-900"
                  />
                </div>
              </div>

              <!-- Widget type indicator -->
              <div class="mt-2 flex items-center gap-1.5">
                <span
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-xs"
                  :class="[
                    metric.priority === 'hero'
                      ? 'bg-amber-100 text-amber-700'
                      : metric.priority === 'primary'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600',
                  ]"
                >
                  {{ metric.priority }}
                </span>
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                  {{ metric.widgetType.replace('-', ' ') }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1f2937;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1f2937;
  cursor: pointer;
  border: none;
}
</style>
