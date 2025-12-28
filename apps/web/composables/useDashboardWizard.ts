import { reactive, computed, readonly, ref } from 'vue'
import { $fetch } from 'ofetch'
import type {
  WizardState,
  WizardStep,
  DashboardObjective,
  MetricCategory,
  GeneratedWidget,
  MetricOption,
  MetricPriority,
} from '../types/dashboard-wizard'
import {
  OBJECTIVE_CONFIGS,
  METRIC_DEFINITIONS,
  CATEGORY_LABELS,
  COLOR_PALETTES,
} from '../types/dashboard-wizard'

const TOTAL_STEPS = 3

export function useDashboardWizard() {
  // Core state
  const state: WizardState = reactive({
    currentStep: 1,
    objective: null,
    metrics: [],
    branding: {
      clientId: '',
      clientName: '',
      primaryColor: COLOR_PALETTES[0]?.primary ?? '#1e40af',
      secondaryColor: COLOR_PALETTES[0]?.secondary ?? '#1f2937',
    },
    generatedWidgets: [],
    dashboardName: '',
    isPublic: true,
    password: undefined,
  })

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ============================================
  // Computed Properties
  // ============================================

  const steps = computed<WizardStep[]>(() => [
    {
      id: 1,
      name: 'Objective',
      description: 'Choose your dashboard goal',
      isComplete: state.objective !== null,
      isActive: state.currentStep === 1,
    },
    {
      id: 2,
      name: 'Metrics',
      description: 'Configure your key metrics',
      isComplete: state.metrics.length > 0 && state.metrics.some((m: MetricPriority) => m.selectedMetrics.length > 0),
      isActive: state.currentStep === 2,
    },
    {
      id: 3,
      name: 'Branding',
      description: 'Personalize the look',
      isComplete: !!state.branding.clientId,
      isActive: state.currentStep === 3,
    },
  ])

  const currentStepData = computed(() => steps.value.find((s: WizardStep) => s.id === state.currentStep))

  const canProceed = computed(() => {
    const step = steps.value.find((s: WizardStep) => s.id === state.currentStep)
    return step?.isComplete ?? false
  })

  const canGoBack = computed(() => state.currentStep > 1)

  const isLastStep = computed(() => state.currentStep === TOTAL_STEPS)

  const selectedObjectiveConfig = computed(() =>
    OBJECTIVE_CONFIGS.find((o) => o.id === state.objective),
  )

  const availableCategories = computed<MetricCategory[]>(() =>
    selectedObjectiveConfig.value?.metrics ?? [],
  )

  const progress = computed(() => Math.round((state.currentStep / TOTAL_STEPS) * 100))

  // ============================================
  // Step 1: Objective Selection
  // ============================================

  function selectObjective(objective: DashboardObjective) {
    state.objective = objective

    // Initialize metrics for this objective
    const config = OBJECTIVE_CONFIGS.find((o) => o.id === objective)
    if (config) {
      state.metrics = config.metrics.map((category: MetricCategory, index: number) => ({
        category,
        weight: index === 0 ? 100 : 50, // First category gets higher weight
        selectedMetrics: getDefaultMetricsForCategory(category),
      }))
    }

    // Generate initial widgets
    regenerateWidgets()
  }

  function getDefaultMetricsForCategory(category: MetricCategory): string[] {
    const metrics = METRIC_DEFINITIONS[category] || []
    // Select hero and primary metrics by default
    return metrics
      .filter((m: MetricOption) => m.priority === 'hero' || m.priority === 'primary')
      .slice(0, 3)
      .map((m: MetricOption) => m.id)
  }

  // ============================================
  // Step 2: Metrics Configuration
  // ============================================

  function updateMetricPriority(category: MetricCategory, weight: number) {
    const metric = state.metrics.find((m: MetricPriority) => m.category === category)
    if (metric) {
      metric.weight = Math.max(0, Math.min(100, weight))
      regenerateWidgets()
    }
  }

  function toggleMetric(category: MetricCategory, metricId: string) {
    const metricPriority = state.metrics.find((m: MetricPriority) => m.category === category)
    if (!metricPriority) return

    const index = metricPriority.selectedMetrics.indexOf(metricId)
    if (index === -1) {
      metricPriority.selectedMetrics.push(metricId)
    }
    else {
      metricPriority.selectedMetrics.splice(index, 1)
    }

    regenerateWidgets()
  }

  function isMetricSelected(category: MetricCategory, metricId: string): boolean {
    const metricPriority = state.metrics.find((m: MetricPriority) => m.category === category)
    return metricPriority?.selectedMetrics.includes(metricId) ?? false
  }

  function getMetricsForCategory(category: MetricCategory): MetricOption[] {
    return METRIC_DEFINITIONS[category] || []
  }

  function getCategoryInfo(category: MetricCategory) {
    return CATEGORY_LABELS[category]
  }

  // ============================================
  // Step 3: Branding Configuration
  // ============================================

  function selectClient(clientId: string, clientName: string) {
    state.branding.clientId = clientId
    state.branding.clientName = clientName

    // Auto-generate dashboard name if empty
    if (!state.dashboardName) {
      const objectiveLabel = selectedObjectiveConfig.value?.label || 'Dashboard'
      state.dashboardName = `${clientName} - ${objectiveLabel}`
    }
  }

  function setColors(primary: string, secondary: string) {
    state.branding.primaryColor = primary
    state.branding.secondaryColor = secondary
  }

  function setLogoUrl(url: string) {
    state.branding.logoUrl = url
  }

  function applyExtractedColors(colors: { primary: string; secondary: string }) {
    state.branding.primaryColor = colors.primary
    state.branding.secondaryColor = colors.secondary
  }

  function setDashboardName(name: string) {
    state.dashboardName = name
  }

  function setPublic(isPublic: boolean) {
    state.isPublic = isPublic
  }

  function setPassword(password: string | undefined) {
    state.password = password
  }

  // ============================================
  // Widget Generation
  // ============================================

  function regenerateWidgets() {
    const widgets: GeneratedWidget[] = []

    // Sort metrics by weight (descending)
    const sortedMetrics = [...state.metrics].sort((a, b) => b.weight - a.weight)

    let widgetOrder = 0

    for (const metricPriority of sortedMetrics) {
      const categoryMetrics = METRIC_DEFINITIONS[metricPriority.category] || []

      for (const metricId of metricPriority.selectedMetrics) {
        const metricDef = categoryMetrics.find((m: MetricOption) => m.id === metricId)
        if (!metricDef) continue

        // Determine slot based on priority and weight
        let slot: GeneratedWidget['slot']
        if (widgetOrder === 0 && metricDef.priority === 'hero') {
          slot = 'hero'
        }

        // Adjust size based on weight
        let size = metricDef.defaultSize
        if (metricPriority.weight >= 80 && size === 'medium') {
          size = 'large'
        }
        else if (metricPriority.weight < 30 && size === 'large') {
          size = 'medium'
        }

        widgets.push({
          id: crypto.randomUUID(),
          type: metricDef.widgetType,
          title: metricDef.label,
          config: {
            metric: metricDef.id,
            comparison: 'previous_period',
            format: getFormatForMetric(metricDef.id),
          },
          size,
          slot,
          metricId: metricDef.id,
        })

        widgetOrder++
      }
    }

    state.generatedWidgets = widgets
  }

  function getFormatForMetric(metricId: string): 'number' | 'currency' | 'percent' {
    const currencyMetrics = ['revenue', 'aov', 'ltv', 'spend', 'cpa', 'cpc', 'cpm', 'cost_per_lead']
    const percentMetrics = ['roas', 'ctr', 'bounce_rate', 'churn', 'repeat_rate', 'engagement_rate']

    if (currencyMetrics.includes(metricId)) return 'currency'
    if (percentMetrics.includes(metricId)) return 'percent'
    return 'number'
  }

  function removeWidget(widgetId: string) {
    state.generatedWidgets = state.generatedWidgets.filter((w: GeneratedWidget) => w.id !== widgetId)
  }

  function reorderWidgets(fromIndex: number, toIndex: number) {
    const widgets = [...state.generatedWidgets]
    const removed = widgets.splice(fromIndex, 1)[0]
    if (removed) {
      widgets.splice(toIndex, 0, removed)
      state.generatedWidgets = widgets
    }
  }

  // ============================================
  // Navigation
  // ============================================

  function nextStep() {
    if (canProceed.value && state.currentStep < TOTAL_STEPS) {
      state.currentStep++
    }
  }

  function prevStep() {
    if (state.currentStep > 1) {
      state.currentStep--
    }
  }

  function goToStep(step: number) {
    if (step >= 1 && step <= TOTAL_STEPS) {
      // Only allow going to a step if all previous steps are complete
      const canGo = steps.value
        .filter((s: WizardStep) => s.id < step)
        .every((s: WizardStep) => s.isComplete)

      if (canGo || step < state.currentStep) {
        state.currentStep = step
      }
    }
  }

  // ============================================
  // Dashboard Creation
  // ============================================

  async function createDashboard(): Promise<{ success: boolean; dashboardId?: string; slug?: string; error?: string }> {
    if (!state.branding.clientId || !state.dashboardName) {
      return { success: false, error: 'Client and dashboard name are required' }
    }

    isLoading.value = true
    error.value = null

    try {
      // Prepare widgets for API
      const widgetsForApi = state.generatedWidgets.map((w: GeneratedWidget) => ({
        id: w.id,
        type: w.type,
        title: w.title,
        config: w.config,
        size: w.size,
      }))

      const response = await $fetch<{ success: boolean; dashboard: { id: string } }>('/api/dashboards', {
        method: 'POST',
        body: {
          name: state.dashboardName,
          clientId: state.branding.clientId,
          widgets: widgetsForApi,
          isPublic: state.isPublic,
          password: state.password || undefined,
        },
      })

      if (response.success) {
        return { success: true, dashboardId: response.dashboard.id }
      }

      return { success: false, error: 'Failed to create dashboard' }
    }
    catch (e: any) {
      const errorMessage = e?.data?.message || 'An error occurred while creating the dashboard'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    }
    finally {
      isLoading.value = false
    }
  }

  // ============================================
  // Reset
  // ============================================

  function reset() {
    state.currentStep = 1
    state.objective = null
    state.metrics = []
    state.branding = {
      clientId: '',
      clientName: '',
      primaryColor: COLOR_PALETTES[0]?.primary ?? '#1e40af',
      secondaryColor: COLOR_PALETTES[0]?.secondary ?? '#1f2937',
    }
    state.generatedWidgets = []
    state.dashboardName = ''
    state.isPublic = true
    state.password = undefined
    error.value = null
  }

  // ============================================
  // Exports
  // ============================================

  return {
    // State (readonly)
    state: readonly(state),
    steps,
    currentStepData,
    progress,
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    canProceed,
    canGoBack,
    isLastStep,
    selectedObjectiveConfig,
    availableCategories,

    // Step 1: Objective
    selectObjective,
    objectiveConfigs: OBJECTIVE_CONFIGS,

    // Step 2: Metrics
    updateMetricPriority,
    toggleMetric,
    isMetricSelected,
    getMetricsForCategory,
    getCategoryInfo,

    // Step 3: Branding
    selectClient,
    setColors,
    setLogoUrl,
    applyExtractedColors,
    setDashboardName,
    setPublic,
    setPassword,
    colorPalettes: COLOR_PALETTES,

    // Widgets
    regenerateWidgets,
    removeWidget,
    reorderWidgets,

    // Navigation
    nextStep,
    prevStep,
    goToStep,

    // Actions
    createDashboard,
    reset,
  }
}
