<script setup lang="ts">
import { ref, computed } from 'vue'

type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

interface Alert {
  narrative: string
  severity?: AlertSeverity
  metric?: string
  timestamp?: string
}

interface Props {
  alerts: Alert[]
  loading?: boolean
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  maxVisible: 5,
})

// Show all toggle
const showAll = ref(false)

// Visible alerts
const visibleAlerts = computed(() => {
  if (showAll.value || props.alerts.length <= props.maxVisible) {
    return props.alerts
  }
  return props.alerts.slice(0, props.maxVisible)
})

// Hidden count
const hiddenCount = computed(() => {
  if (showAll.value) return 0
  return Math.max(0, props.alerts.length - props.maxVisible)
})

// Severity config
function getSeverityConfig(severity?: AlertSeverity) {
  switch (severity) {
    case 'critical':
      return {
        icon: 'heroicons:exclamation-circle',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        textColor: 'text-red-700',
        label: 'Crítico',
      }
    case 'high':
      return {
        icon: 'heroicons:exclamation-triangle',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        textColor: 'text-orange-700',
        label: 'Alto',
      }
    case 'medium':
      return {
        icon: 'heroicons:information-circle',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        textColor: 'text-yellow-700',
        label: 'Medio',
      }
    default:
      return {
        icon: 'heroicons:bell',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        textColor: 'text-gray-700',
        label: 'Bajo',
      }
  }
}

// Sort by severity (critical first)
const sortedAlerts = computed(() => {
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  return [...props.alerts].sort((a, b) => {
    const aOrder = severityOrder[a.severity || 'low'] ?? 4
    const bOrder = severityOrder[b.severity || 'low'] ?? 4
    return aOrder - bOrder
  })
})
</script>

<template>
  <div
    v-if="alerts.length > 0 || loading"
    class="space-y-3"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
          <Icon name="heroicons:bell-alert" class="w-4 h-4 text-red-600" />
        </div>
        <h3 class="font-semibold text-gray-900">
          Alertas
        </h3>
        <span
          v-if="alerts.length > 0"
          class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium"
        >
          {{ alerts.length }}
        </span>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="loading"
      class="bg-gray-50 rounded-xl border border-gray-100 p-4"
    >
      <div class="flex items-center gap-3">
        <Icon name="heroicons:arrow-path" class="w-5 h-5 text-gray-400 animate-spin" />
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div class="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      </div>
    </div>

    <!-- Alerts list -->
    <div
      v-else
      class="space-y-2"
    >
      <TransitionGroup name="alert">
        <div
          v-for="(alert, index) in visibleAlerts"
          :key="index"
          :class="[
            'rounded-xl border p-4 transition-all',
            getSeverityConfig(alert.severity).bgColor,
            getSeverityConfig(alert.severity).borderColor,
          ]"
        >
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div
              :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                getSeverityConfig(alert.severity).iconBg,
              ]"
            >
              <Icon
                :name="getSeverityConfig(alert.severity).icon"
                :class="['w-5 h-5', getSeverityConfig(alert.severity).iconColor]"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <!-- Severity badge -->
              <div class="flex items-center gap-2 mb-1">
                <span
                  :class="[
                    'text-xs font-semibold uppercase tracking-wide',
                    getSeverityConfig(alert.severity).textColor,
                  ]"
                >
                  {{ getSeverityConfig(alert.severity).label }}
                </span>
                <span
                  v-if="alert.metric"
                  class="text-xs text-gray-500"
                >
                  • {{ alert.metric }}
                </span>
              </div>

              <!-- Narrative -->
              <p class="text-sm text-gray-700 leading-relaxed">
                {{ alert.narrative }}
              </p>

              <!-- Timestamp -->
              <p
                v-if="alert.timestamp"
                class="mt-2 text-xs text-gray-400"
              >
                {{ alert.timestamp }}
              </p>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <!-- Show more button -->
      <button
        v-if="hiddenCount > 0"
        class="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center gap-1"
        @click="showAll = true"
      >
        Ver {{ hiddenCount }} alertas más
        <Icon name="heroicons:chevron-down" class="w-4 h-4" />
      </button>

      <!-- Show less button -->
      <button
        v-else-if="showAll && alerts.length > maxVisible"
        class="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center gap-1"
        @click="showAll = false"
      >
        Mostrar menos
        <Icon name="heroicons:chevron-up" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.alert-enter-active,
.alert-leave-active {
  transition: all 0.3s ease;
}

.alert-enter-from,
.alert-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
