<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Create Dashboard',
  middleware: ['tenant'],
})

const route = useRoute()
const router = useRouter()
const tenant = computed(() => route.params.tenant as string)

// Composables
const wizard = useDashboardWizard()
const { clients, fetchClients, isLoading: isLoadingClients } = useClients()

// Computed props to convert readonly arrays to mutable for child components
const mutableMetrics = computed(() => [...wizard.state.metrics] as any[])
const mutableClients = computed(() => [...clients.value] as any[])
const mutableWidgets = computed(() => [...wizard.state.generatedWidgets] as any[])

// Fetch clients on mount
onMounted(() => {
  fetchClients()
})

// Handle color extraction from logo
async function handleExtractColors(file: File) {
  const colors = await extractColorsFromImage(file)
  if (colors) {
    wizard.applyExtractedColors(colors)
  }
}

// Simple color extraction using canvas
async function extractColorsFromImage(file: File): Promise<{ primary: string; secondary: string } | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }

      // Scale down for faster processing
      const maxSize = 50
      const scale = Math.min(maxSize / img.width, maxSize / img.height)
      canvas.width = img.width * scale
      canvas.height = img.height * scale

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const colors = analyzeColors(imageData.data)

      resolve(colors)
    }

    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}

function parseColorKey(key: string): [number, number, number] {
  const parts = key.split(',').map(Number)
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0]
}

function analyzeColors(data: Uint8ClampedArray): { primary: string; secondary: string } {
  const colorCounts: Record<string, number> = {}

  // Sample pixels
  for (let i = 0; i < data.length; i += 16) { // Skip every 4 pixels for speed
    const r = data[i] ?? 0
    const g = data[i + 1] ?? 0
    const b = data[i + 2] ?? 0
    const a = data[i + 3] ?? 0

    // Skip transparent and near-white/black pixels
    if (a < 128) continue
    if (r > 240 && g > 240 && b > 240) continue
    if (r < 15 && g < 15 && b < 15) continue

    // Quantize to reduce color space
    const qr = Math.round(r / 32) * 32
    const qg = Math.round(g / 32) * 32
    const qb = Math.round(b / 32) * 32

    const key = `${qr},${qg},${qb}`
    colorCounts[key] = (colorCounts[key] || 0) + 1
  }

  // Sort by frequency
  const sorted = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  if (sorted.length === 0) {
    return { primary: '#1e40af', secondary: '#1f2937' }
  }

  const firstEntry = sorted[0]
  if (!firstEntry) {
    return { primary: '#1e40af', secondary: '#1f2937' }
  }
  const [pr, pg, pb] = parseColorKey(firstEntry[0])
  const primary = rgbToHex(pr, pg, pb)

  // Find a contrasting secondary color
  let secondary = '#1f2937'
  const secondEntry = sorted[1]
  if (secondEntry) {
    const [sr, sg, sb] = parseColorKey(secondEntry[0])
    secondary = rgbToHex(sr, sg, sb)

    // If colors are too similar, darken the primary
    if (colorDistance(pr, pg, pb, sr, sg, sb) < 100) {
      secondary = rgbToHex(
        Math.max(0, pr - 80),
        Math.max(0, pg - 80),
        Math.max(0, pb - 80),
      )
    }
  }

  return { primary, secondary }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2)
}

// Handle dashboard creation
async function handleCreate() {
  const result = await wizard.createDashboard()

  if (result.success) {
    // Navigate to dashboards list
    await router.push(`/${tenant.value}/dashboards`)
  }
}

// Cancel and go back
function handleCancel() {
  wizard.reset()
  router.push(`/${tenant.value}/dashboards`)
}
</script>

<template>
  <div class="min-h-[calc(100vh-120px)]">
    <!-- Header -->
    <div class="mb-8">
      <button
        type="button"
        class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
        @click="handleCancel"
      >
        <Icon
          name="heroicons:arrow-left"
          class="w-4 h-4"
        />
        Back to Dashboards
      </button>

      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Create Dashboard
          </h1>
          <p class="text-gray-600 mt-1">
            Follow the steps below to build your custom dashboard
          </p>
        </div>

        <!-- Progress indicator -->
        <div class="hidden md:flex items-center gap-2">
          <template
            v-for="(step, index) in wizard.steps.value"
            :key="step.id"
          >
            <div
              class="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
              :class="[
                step.isActive
                  ? 'bg-gray-900 text-white'
                  : step.isComplete
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-400',
              ]"
            >
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                :class="[
                  step.isActive
                    ? 'bg-white text-gray-900'
                    : step.isComplete
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-500',
                ]"
              >
                <Icon
                  v-if="step.isComplete && !step.isActive"
                  name="heroicons:check"
                  class="w-4 h-4"
                />
                <span v-else>{{ step.id }}</span>
              </div>
              <span class="text-sm font-medium">{{ step.name }}</span>
            </div>

            <Icon
              v-if="index < wizard.steps.value.length - 1"
              name="heroicons:chevron-right"
              class="w-5 h-5 text-gray-300"
            />
          </template>
        </div>
      </div>

      <!-- Mobile Progress Bar -->
      <div class="md:hidden mt-4">
        <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Step {{ wizard.state.currentStep }} of 3</span>
          <span>{{ wizard.progress.value }}%</span>
        </div>
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-gray-900 rounded-full transition-all duration-300"
            :style="{ width: `${wizard.progress.value}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Step Content -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <!-- Step 1: Objective -->
          <DashboardWizardStepObjective
            v-if="wizard.state.currentStep === 1"
            :selected-objective="wizard.state.objective"
            :objectives="wizard.objectiveConfigs"
            @select="wizard.selectObjective"
          />

          <!-- Step 2: Metrics -->
          <DashboardWizardStepMetrics
            v-else-if="wizard.state.currentStep === 2"
            :categories="wizard.availableCategories.value"
            :metrics="mutableMetrics"
            :get-category-info="wizard.getCategoryInfo"
            :get-metrics-for-category="wizard.getMetricsForCategory"
            :is-metric-selected="wizard.isMetricSelected"
            @update-priority="wizard.updateMetricPriority"
            @toggle-metric="wizard.toggleMetric"
          />

          <!-- Step 3: Branding -->
          <DashboardWizardStepBranding
            v-else-if="wizard.state.currentStep === 3"
            :branding="wizard.state.branding"
            :dashboard-name="wizard.state.dashboardName"
            :is-public="wizard.state.isPublic"
            :password="wizard.state.password"
            :clients="mutableClients"
            :color-palettes="wizard.colorPalettes"
            :is-loading-clients="isLoadingClients"
            @select-client="wizard.selectClient"
            @set-colors="wizard.setColors"
            @set-logo-url="wizard.setLogoUrl"
            @set-dashboard-name="wizard.setDashboardName"
            @set-public="wizard.setPublic"
            @set-password="wizard.setPassword"
            @extract-colors="handleExtractColors"
          />

          <!-- Navigation -->
          <div class="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              v-if="wizard.canGoBack.value"
              type="button"
              class="btn-secondary"
              @click="wizard.prevStep"
            >
              <Icon
                name="heroicons:arrow-left"
                class="w-4 h-4 mr-2"
              />
              Back
            </button>
            <div
              v-else
              class="w-1"
            />

            <div class="flex items-center gap-3">
              <button
                type="button"
                class="btn-secondary"
                @click="handleCancel"
              >
                Cancel
              </button>

              <button
                v-if="!wizard.isLastStep.value"
                type="button"
                class="btn-primary"
                :disabled="!wizard.canProceed.value"
                @click="wizard.nextStep"
              >
                Continue
                <Icon
                  name="heroicons:arrow-right"
                  class="w-4 h-4 ml-2"
                />
              </button>

              <button
                v-else
                type="button"
                class="btn-primary"
                :disabled="!wizard.canProceed.value || wizard.isLoading.value"
                @click="handleCreate"
              >
                <Icon
                  v-if="wizard.isLoading.value"
                  name="heroicons:arrow-path"
                  class="w-4 h-4 mr-2 animate-spin"
                />
                <Icon
                  v-else
                  name="heroicons:rocket-launch"
                  class="w-4 h-4 mr-2"
                />
                Create Dashboard
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div
            v-if="wizard.error.value"
            class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div class="flex items-center gap-2 text-red-700">
              <Icon
                name="heroicons:exclamation-circle"
                class="w-5 h-5"
              />
              <span class="text-sm">{{ wizard.error.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Preview Sidebar -->
      <div class="lg:col-span-1">
        <div class="sticky top-4">
          <h3 class="text-sm font-medium text-gray-500 mb-3">
            Dashboard Preview
          </h3>
          <DashboardWizardLivePreview
            :widgets="mutableWidgets"
            :branding="wizard.state.branding"
            :dashboard-name="wizard.state.dashboardName"
            @remove-widget="wizard.removeWidget"
          />
        </div>
      </div>
    </div>
  </div>
</template>
