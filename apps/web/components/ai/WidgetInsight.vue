<script setup lang="ts">
import { ref } from 'vue'

interface RCACause {
  factor: string
  explanation: string
  confidence: number
  action?: string
}

interface Props {
  summary?: string
  causes?: RCACause[]
  loading?: boolean
  expanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  expanded: false,
})

const isExpanded = ref(props.expanded)

// Confidence level styling
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600 bg-green-50'
  if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50'
  return 'text-gray-600 bg-gray-50'
}

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}
</script>

<template>
  <div class="mt-4 border-t border-gray-100 pt-4">
    <!-- Loading state -->
    <div
      v-if="loading"
      class="flex items-center gap-2 text-gray-500 text-sm"
    >
      <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
      <span>Analizando cambios...</span>
    </div>

    <!-- Content -->
    <template v-else-if="summary || (causes && causes.length > 0)">
      <!-- Summary (always visible) -->
      <div
        v-if="summary"
        class="flex items-start gap-2"
      >
        <div class="mt-0.5 shrink-0">
          <Icon
            name="heroicons:light-bulb"
            class="w-4 h-4 text-amber-500"
          />
        </div>
        <p class="text-sm text-gray-600 leading-relaxed">
          {{ summary }}
        </p>
      </div>

      <!-- Expandable causes -->
      <div
        v-if="causes && causes.length > 0"
        class="mt-3"
      >
        <button
          type="button"
          class="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          @click="isExpanded = !isExpanded"
        >
          <Icon
            :name="isExpanded ? 'heroicons:chevron-down' : 'heroicons:chevron-right'"
            class="w-3 h-3"
          />
          {{ isExpanded ? 'Ocultar detalles' : 'Ver análisis detallado' }}
        </button>

        <!-- Causes list -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div
            v-if="isExpanded"
            class="mt-3 space-y-3"
          >
            <div
              v-for="(cause, index) in causes"
              :key="index"
              class="bg-gray-50 rounded-lg p-3"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs font-medium flex items-center justify-center shrink-0">
                    {{ index + 1 }}
                  </span>
                  <span class="text-sm font-medium text-gray-900">
                    {{ cause.factor }}
                  </span>
                </div>
                <span
                  class="text-xs font-medium px-1.5 py-0.5 rounded"
                  :class="getConfidenceColor(cause.confidence)"
                >
                  {{ formatConfidence(cause.confidence) }}
                </span>
              </div>

              <p class="mt-2 text-sm text-gray-600 ml-7">
                {{ cause.explanation }}
              </p>

              <div
                v-if="cause.action"
                class="mt-2 ml-7 flex items-start gap-2 text-sm"
              >
                <Icon
                  name="heroicons:arrow-right-circle"
                  class="w-4 h-4 text-blue-500 shrink-0 mt-0.5"
                />
                <span class="text-blue-700">{{ cause.action }}</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </template>
  </div>
</template>
