import { ref, computed } from 'vue'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: string
  completed: boolean
  action?: () => void | Promise<void>
  route?: string
}

export interface OnboardingState {
  hasIntegration: boolean
  hasClient: boolean
  hasClientWithAccount: boolean
  hasDashboard: boolean
  hasSeenInsight: boolean
}

const onboardingState = ref<OnboardingState>({
  hasIntegration: false,
  hasClient: false,
  hasClientWithAccount: false,
  hasDashboard: false,
  hasSeenInsight: false,
})

const isLoading = ref(false)
const isOnboardingDismissed = ref(false)

export function useOnboarding() {
  const route = useRoute()
  const tenant = computed(() => route.params.tenant as string)

  // Calculate steps based on state
  const steps = computed<OnboardingStep[]>(() => [
    {
      id: 'integration',
      title: 'Conectar plataforma',
      description: 'Conecta Google Ads, Meta Ads u otra plataforma para importar tus datos.',
      icon: 'heroicons:puzzle-piece',
      completed: onboardingState.value.hasIntegration,
      route: `/${tenant.value}/integrations`,
    },
    {
      id: 'client',
      title: 'Crear tu primer cliente',
      description: 'Agrega un cliente y asignale una cuenta de la plataforma conectada.',
      icon: 'heroicons:user-plus',
      completed: onboardingState.value.hasClientWithAccount,
      route: `/${tenant.value}/clients`,
    },
    {
      id: 'dashboard',
      title: 'Crear dashboard',
      description: 'Crea un dashboard con metricas clave para tu cliente.',
      icon: 'heroicons:chart-bar-square',
      completed: onboardingState.value.hasDashboard,
      route: `/${tenant.value}/dashboards/new`,
    },
    {
      id: 'insight',
      title: 'Ver tu primer insight AI',
      description: 'Descubre por que cambiaron tus metricas con nuestro analisis de IA.',
      icon: 'heroicons:light-bulb',
      completed: onboardingState.value.hasSeenInsight,
    },
  ])

  // Current step (first incomplete)
  const currentStepIndex = computed(() => {
    const index = steps.value.findIndex(s => !s.completed)
    return index === -1 ? steps.value.length - 1 : index
  })

  const currentStep = computed(() => steps.value[currentStepIndex.value])

  // Progress percentage
  const progress = computed(() => {
    const completed = steps.value.filter(s => s.completed).length
    return Math.round((completed / steps.value.length) * 100)
  })

  // Is onboarding complete?
  const isComplete = computed(() => steps.value.every(s => s.completed))

  // Should show onboarding?
  const shouldShowOnboarding = computed(() => {
    return !isComplete.value && !isOnboardingDismissed.value
  })

  // Fetch current onboarding state from API
  async function fetchOnboardingState() {
    isLoading.value = true

    try {
      const response = await $fetch<{
        success: boolean
        state: OnboardingState
      }>('/api/onboarding/status')

      if (response.success) {
        onboardingState.value = response.state
      }
    }
    catch (e) {
      console.error('Failed to fetch onboarding state:', e)
    }
    finally {
      isLoading.value = false
    }
  }

  // Mark insight as seen
  async function markInsightSeen() {
    try {
      await $fetch('/api/onboarding/mark-insight-seen', {
        method: 'POST',
      })
      onboardingState.value.hasSeenInsight = true
    }
    catch (e) {
      console.error('Failed to mark insight as seen:', e)
    }
  }

  // Dismiss onboarding banner (persists in localStorage)
  function dismissOnboarding() {
    isOnboardingDismissed.value = true
    if (import.meta.client) {
      localStorage.setItem('onboarding_dismissed', 'true')
    }
  }

  // Check if dismissed on mount
  function checkDismissed() {
    if (import.meta.client) {
      isOnboardingDismissed.value = localStorage.getItem('onboarding_dismissed') === 'true'
    }
  }

  // Reset dismissed state
  function resetDismissed() {
    isOnboardingDismissed.value = false
    if (import.meta.client) {
      localStorage.removeItem('onboarding_dismissed')
    }
  }

  return {
    // State
    onboardingState,
    steps,
    currentStep,
    currentStepIndex,
    progress,
    isComplete,
    isLoading,
    shouldShowOnboarding,

    // Actions
    fetchOnboardingState,
    markInsightSeen,
    dismissOnboarding,
    checkDismissed,
    resetDismissed,
  }
}
