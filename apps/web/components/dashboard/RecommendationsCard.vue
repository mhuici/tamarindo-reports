<script setup lang="ts">
import { computed } from 'vue'

interface Recommendation {
  title?: string
  narrative: string
  priority?: 'low' | 'medium' | 'high'
  action?: string
}

interface Props {
  recommendations: Recommendation | Recommendation[] | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Normalize to array
const items = computed(() => {
  if (!props.recommendations) return []
  if (Array.isArray(props.recommendations)) return props.recommendations
  return [props.recommendations]
})

// Priority styling
function getPriorityStyles(priority?: string) {
  switch (priority) {
    case 'high':
      return 'border-l-green-500 bg-green-50/50'
    case 'medium':
      return 'border-l-blue-500 bg-blue-50/50'
    default:
      return 'border-l-gray-300 bg-gray-50/50'
  }
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-100 bg-green-50/30">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shrink-0">
          <Icon name="heroicons:arrow-trending-up" class="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">
            Recomendaciones
          </h3>
          <p class="text-xs text-gray-500">
            Basadas en el análisis de tus métricas
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Loading state -->
      <div
        v-if="loading"
        class="flex items-center gap-3 py-4"
      >
        <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
          <Icon name="heroicons:arrow-path" class="w-4 h-4 text-green-600 animate-spin" />
        </div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div class="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      </div>

      <!-- Recommendations list -->
      <div
        v-else-if="items.length > 0"
        class="space-y-3"
      >
        <div
          v-for="(item, index) in items"
          :key="index"
          :class="[
            'p-4 rounded-xl border-l-4 transition-colors',
            getPriorityStyles(item.priority),
          ]"
        >
          <!-- Title if present -->
          <p
            v-if="item.title"
            class="text-sm font-semibold text-gray-900 mb-1"
          >
            {{ item.title }}
          </p>

          <!-- Narrative -->
          <p class="text-sm text-gray-700 leading-relaxed">
            {{ item.narrative }}
          </p>

          <!-- Action button if present -->
          <button
            v-if="item.action"
            class="mt-3 text-sm font-medium text-green-600 hover:text-green-700 inline-flex items-center gap-1"
          >
            {{ item.action }}
            <Icon name="heroicons:arrow-right" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else
        class="py-6 text-center text-gray-500"
      >
        <Icon name="heroicons:check-circle" class="w-8 h-8 mx-auto text-gray-300 mb-2" />
        <p class="text-sm">Todo está en orden. Sin recomendaciones por ahora.</p>
      </div>
    </div>
  </div>
</template>
