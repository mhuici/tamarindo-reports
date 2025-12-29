<script setup lang="ts">
/**
 * AIFallbackBadge - Shows when AI insights are from mock data
 * Session 17: Production Error Handling
 */

interface Props {
  /** Show as inline badge or tooltip */
  variant?: 'badge' | 'tooltip'
  /** Tooltip text */
  tooltipText?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'badge',
  tooltipText: 'Este análisis fue generado con datos de ejemplo. Conecta tu API key de Anthropic para obtener análisis reales con IA.',
})
</script>

<template>
  <div
    v-if="variant === 'badge'"
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
           bg-amber-100 dark:bg-amber-900/30
           text-amber-700 dark:text-amber-400
           text-xs font-medium"
    :title="tooltipText"
  >
    <span class="i-heroicons-beaker size-3" />
    <span>Demo</span>
  </div>
  <div
    v-else
    class="group relative inline-flex items-center cursor-help"
  >
    <span class="i-heroicons-information-circle size-4 text-amber-500" />
    <div
      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 w-64
             bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg
             opacity-0 invisible group-hover:opacity-100 group-hover:visible
             transition-all duration-200 z-50 shadow-lg"
    >
      {{ tooltipText }}
      <div
        class="absolute top-full left-1/2 -translate-x-1/2 -mt-1
               border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"
      />
    </div>
  </div>
</template>
