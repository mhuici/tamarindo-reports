<script setup lang="ts">
import { ref, computed } from 'vue'

/**
 * IntegrationErrorBanner - Shows integration errors with reconnection actions
 * Session 17: Production Error Handling
 */

interface Props {
  /** Error code from the API */
  errorCode?: string
  /** Human-readable error message */
  message: string
  /** Platform that had the error */
  platform?: 'google_ads' | 'facebook_ads' | 'unknown'
  /** Suggested action for the user */
  action?: 'reconnect' | 'wait_and_retry' | 'check_permissions' | 'contact_support' | 'none'
  /** Label for the action button */
  actionLabel?: string
  /** Whether the banner can be dismissed */
  dismissible?: boolean
  /** Variant: inline (within a card) or toast (floating) */
  variant?: 'inline' | 'toast'
}

const props = withDefaults(defineProps<Props>(), {
  platform: 'unknown',
  action: 'none',
  dismissible: true,
  variant: 'inline',
})

const emit = defineEmits<{
  dismiss: []
  reconnect: [platform: string]
  retry: []
}>()

const visible = ref(true)

const platformLabels: Record<string, string> = {
  google_ads: 'Google Ads',
  facebook_ads: 'Facebook Ads',
  unknown: 'Integración',
}

const platformLabel = computed(() => platformLabels[props.platform] || 'Integración')

const iconClass = computed(() => {
  switch (props.action) {
    case 'reconnect':
    case 'check_permissions':
      return 'i-heroicons-exclamation-triangle text-amber-500'
    case 'wait_and_retry':
      return 'i-heroicons-clock text-blue-500'
    case 'contact_support':
      return 'i-heroicons-exclamation-circle text-red-500'
    default:
      return 'i-heroicons-information-circle text-gray-500'
  }
})

const bgClass = computed(() => {
  switch (props.action) {
    case 'reconnect':
    case 'check_permissions':
      return 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
    case 'wait_and_retry':
      return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
    case 'contact_support':
      return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
    default:
      return 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
  }
})

function handleAction() {
  if (props.action === 'reconnect' || props.action === 'check_permissions') {
    emit('reconnect', props.platform)
  } else if (props.action === 'wait_and_retry') {
    emit('retry')
  }
}

function dismiss() {
  visible.value = false
  emit('dismiss')
}
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0 translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-1"
  >
    <div
      v-if="visible"
      :class="[
        'rounded-lg border p-4',
        bgClass,
        variant === 'toast' ? 'shadow-lg' : '',
      ]"
      role="alert"
    >
      <div class="flex items-start gap-3">
        <!-- Icon -->
        <div :class="['size-5 flex-shrink-0 mt-0.5', iconClass]" />

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ platformLabel }}
            </span>
            <span
              v-if="errorCode"
              class="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              {{ errorCode }}
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ message }}
          </p>

          <!-- Action Button -->
          <div v-if="action !== 'none' && actionLabel" class="mt-3">
            <button
              class="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md
                     bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                     hover:bg-gray-50 dark:hover:bg-gray-700
                     text-gray-700 dark:text-gray-200
                     transition-colors"
              @click="handleAction"
            >
              <span
                v-if="action === 'reconnect' || action === 'check_permissions'"
                class="i-heroicons-link size-4"
              />
              <span
                v-else-if="action === 'wait_and_retry'"
                class="i-heroicons-arrow-path size-4"
              />
              {{ actionLabel }}
            </button>
          </div>
        </div>

        <!-- Dismiss Button -->
        <button
          v-if="dismissible"
          class="flex-shrink-0 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Cerrar"
          @click="dismiss"
        >
          <span class="i-heroicons-x-mark size-4 text-gray-500" />
        </button>
      </div>
    </div>
  </Transition>
</template>
