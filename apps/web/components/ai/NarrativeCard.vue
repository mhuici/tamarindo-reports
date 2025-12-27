<script setup lang="ts">
type NarrativeType = 'executive-summary' | 'widget-insight' | 'recommendation' | 'alert'
type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

interface Props {
  type: NarrativeType
  content?: string
  loading?: boolean
  severity?: AlertSeverity // Only for alerts
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  compact: false,
})

// Icon and styling based on type
const typeConfig = computed(() => {
  const configs: Record<NarrativeType, { icon: string; color: string; bgColor: string; title: string }> = {
    'executive-summary': {
      icon: 'heroicons:document-chart-bar',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      title: 'Resumen Ejecutivo',
    },
    'widget-insight': {
      icon: 'heroicons:light-bulb',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      title: 'Insight',
    },
    'recommendation': {
      icon: 'heroicons:arrow-trending-up',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      title: 'Recomendación',
    },
    'alert': {
      icon: 'heroicons:exclamation-triangle',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      title: 'Alerta',
    },
  }
  return configs[props.type]
})

// Alert severity styling
const severityConfig = computed(() => {
  if (props.type !== 'alert' || !props.severity) return null

  const configs: Record<AlertSeverity, { color: string; bgColor: string; borderColor: string }> = {
    low: {
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    },
    medium: {
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    high: {
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    critical: {
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
    },
  }
  return configs[props.severity]
})

// Final styling
const cardStyles = computed(() => {
  if (severityConfig.value) {
    return {
      bg: severityConfig.value.bgColor,
      border: severityConfig.value.borderColor,
      iconColor: severityConfig.value.color,
    }
  }
  return {
    bg: typeConfig.value.bgColor,
    border: 'border-transparent',
    iconColor: typeConfig.value.color,
  }
})
</script>

<template>
  <div
    :class="[
      'rounded-xl border transition-all',
      cardStyles.bg,
      cardStyles.border,
      compact ? 'p-3' : 'p-4',
    ]"
  >
    <!-- Loading state -->
    <div
      v-if="loading"
      class="flex items-center gap-3"
    >
      <div
        :class="[
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          typeConfig.bgColor,
        ]"
      >
        <Icon
          name="heroicons:arrow-path"
          :class="['w-4 h-4 animate-spin', typeConfig.color]"
        />
      </div>
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div class="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </div>

    <!-- Content -->
    <div
      v-else-if="content"
      class="flex gap-3"
    >
      <!-- Icon -->
      <div
        :class="[
          'shrink-0 rounded-lg flex items-center justify-center',
          compact ? 'w-7 h-7' : 'w-9 h-9',
          type === 'alert' && severityConfig ? severityConfig.bgColor : 'bg-white/80',
        ]"
      >
        <Icon
          :name="typeConfig.icon"
          :class="[
            compact ? 'w-4 h-4' : 'w-5 h-5',
            cardStyles.iconColor,
          ]"
        />
      </div>

      <!-- Text -->
      <div class="flex-1 min-w-0">
        <!-- Title (only for non-compact) -->
        <p
          v-if="!compact"
          :class="['text-xs font-medium mb-1 uppercase tracking-wide', cardStyles.iconColor]"
        >
          {{ typeConfig.title }}
          <span
            v-if="severity"
            class="ml-1 normal-case"
          >
            ({{ severity }})
          </span>
        </p>

        <!-- Narrative content -->
        <p
          :class="[
            'text-gray-700 leading-relaxed',
            compact ? 'text-sm' : 'text-base',
          ]"
        >
          {{ content }}
        </p>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="flex items-center gap-3 text-gray-400"
    >
      <Icon
        :name="typeConfig.icon"
        class="w-5 h-5"
      />
      <span class="text-sm">Sin contenido disponible</span>
    </div>
  </div>
</template>
