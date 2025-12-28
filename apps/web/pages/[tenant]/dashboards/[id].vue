<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { COLOR_PALETTES } from '../../../types/dashboard-wizard'

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboard Editor',
  middleware: ['tenant'],
})

const route = useRoute()
const router = useRouter()
const tenant = computed(() => route.params.tenant as string)
const dashboardId = computed(() => route.params.id as string)

const { currentDashboard, isLoading, fetchDashboard, updateDashboard, getPublicUrl, copyPublicUrl } = useDashboards()

// Widget state
const widgets = ref<any[]>([])
const isSaving = ref(false)
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const lastSavedAt = ref<Date | null>(null)

// Branding state
const branding = reactive({
  logoUrl: '',
  primaryColor: COLOR_PALETTES[0]?.primary ?? '#1e40af',
  secondaryColor: COLOR_PALETTES[0]?.secondary ?? '#1f2937',
})

// Settings state
const dashboardName = ref('')
const isPublic = ref(true)
const hasPassword = ref(false)

// Available widget types
const widgetTypes = [
  { type: 'metric', label: 'Metric Card', icon: 'heroicons:presentation-chart-bar', description: 'Single KPI value' },
  { type: 'line-chart', label: 'Line Chart', icon: 'heroicons:chart-bar', description: 'Trend over time' },
  { type: 'bar-chart', label: 'Bar Chart', icon: 'heroicons:chart-bar-square', description: 'Comparison data' },
  { type: 'pie-chart', label: 'Pie Chart', icon: 'heroicons:chart-pie', description: 'Distribution data' },
  { type: 'table', label: 'Data Table', icon: 'heroicons:table-cells', description: 'Detailed breakdown' },
  { type: 'text', label: 'Text Block', icon: 'heroicons:document-text', description: 'Custom text/notes' },
]

// Fetch dashboard on mount
onMounted(async () => {
  const dashboard = await fetchDashboard(dashboardId.value)
  if (dashboard) {
    widgets.value = dashboard.widgets || []
    dashboardName.value = dashboard.name
    isPublic.value = dashboard.isPublic
    hasPassword.value = dashboard.hasPassword || false

    // Load branding if available (dashboard may have branding as extra data)
    const dashboardData = dashboard as any
    if (dashboardData.branding) {
      branding.logoUrl = dashboardData.branding.logoUrl || ''
      branding.primaryColor = dashboardData.branding.primaryColor || COLOR_PALETTES[0]?.primary || '#1e40af'
      branding.secondaryColor = dashboardData.branding.secondaryColor || COLOR_PALETTES[0]?.secondary || '#1f2937'
    }
  }
})

// Computed branding for preview
const previewBranding = computed(() => ({
  logoUrl: branding.logoUrl,
  primaryColor: branding.primaryColor,
  secondaryColor: branding.secondaryColor,
  clientName: currentDashboard.value?.client?.name || '',
}))

// Widget handlers
function addWidget(type: string) {
  const widgetType = widgetTypes.find(w => w.type === type)
  widgets.value.push({
    id: crypto.randomUUID(),
    type,
    title: widgetType?.label || 'Widget',
    config: {},
    size: 'medium',
  })
  triggerAutoSave()
}

function removeWidget(id: string) {
  widgets.value = widgets.value.filter(w => w.id !== id)
  triggerAutoSave()
}

function updateWidget(updatedWidget: any) {
  const index = widgets.value.findIndex(w => w.id === updatedWidget.id)
  if (index !== -1) {
    widgets.value[index] = updatedWidget
    triggerAutoSave()
  }
}

function reorderWidgets(fromIndex: number, toIndex: number) {
  const widget = widgets.value.splice(fromIndex, 1)[0]
  widgets.value.splice(toIndex, 0, widget)
  triggerAutoSave()
}

// Branding handlers
function handleColorsUpdate(primary: string, secondary: string) {
  branding.primaryColor = primary
  branding.secondaryColor = secondary
  triggerAutoSave()
}

function handleLogoUpdate(url: string) {
  branding.logoUrl = url
  triggerAutoSave()
}

// Settings handlers
function handleNameUpdate(name: string) {
  dashboardName.value = name
  triggerAutoSave()
}

function handlePublicUpdate(value: boolean) {
  isPublic.value = value
  triggerAutoSave()
}

async function handlePasswordUpdate(password: string | undefined) {
  await saveDashboard({ password })
  hasPassword.value = !!password
}

async function handleClearPassword() {
  await saveDashboard({ password: null })
  hasPassword.value = false
}

// Auto-save with debounce
let saveTimeout: ReturnType<typeof setTimeout> | null = null

function triggerAutoSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(() => {
    saveDashboard()
  }, 1500)
}

async function saveDashboard(additionalData: Record<string, any> = {}) {
  if (isSaving.value) return

  isSaving.value = true
  saveStatus.value = 'saving'

  try {
    const data = {
      name: dashboardName.value,
      widgets: widgets.value,
      isPublic: isPublic.value,
      branding: {
        logoUrl: branding.logoUrl,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
      },
      ...additionalData,
    }

    const result = await updateDashboard(dashboardId.value, data)

    if (result.success) {
      saveStatus.value = 'saved'
      lastSavedAt.value = new Date()
      setTimeout(() => {
        if (saveStatus.value === 'saved') {
          saveStatus.value = 'idle'
        }
      }, 2000)
    } else {
      saveStatus.value = 'error'
    }
  } finally {
    isSaving.value = false
  }
}

async function handleCopyLink() {
  if (!currentDashboard.value) return
  await copyPublicUrl(currentDashboard.value.slug)
}

// Format time for display
function formatSaveTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="min-h-[calc(100vh-120px)]">
    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-24"
    >
      <Icon
        name="heroicons:arrow-path"
        class="w-8 h-8 animate-spin text-gray-400"
      />
    </div>

    <!-- Dashboard not found -->
    <div
      v-else-if="!currentDashboard"
      class="text-center py-24"
    >
      <Icon
        name="heroicons:presentation-chart-line"
        class="mx-auto h-12 w-12 text-gray-400"
      />
      <h3 class="mt-2 text-sm font-medium text-gray-900">
        Dashboard not found
      </h3>
      <NuxtLink
        :to="`/${tenant}/dashboards`"
        class="btn-primary mt-4 inline-flex"
      >
        Back to Dashboards
      </NuxtLink>
    </div>

    <!-- Dashboard editor -->
    <div v-else>
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <NuxtLink
              :to="`/${tenant}/dashboards`"
              class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
            >
              <Icon
                name="heroicons:arrow-left"
                class="w-4 h-4"
              />
              Back to Dashboards
            </NuxtLink>
            <h1 class="text-2xl font-bold text-gray-900">
              Edit Dashboard
            </h1>
          </div>

          <div class="flex items-center gap-3">
            <!-- Save Status -->
            <div class="flex items-center gap-2 text-sm">
              <template v-if="saveStatus === 'saving'">
                <Icon
                  name="heroicons:arrow-path"
                  class="w-4 h-4 animate-spin text-gray-400"
                />
                <span class="text-gray-500">Saving...</span>
              </template>
              <template v-else-if="saveStatus === 'saved'">
                <Icon
                  name="heroicons:check-circle"
                  class="w-4 h-4 text-green-500"
                />
                <span class="text-green-600">Saved</span>
              </template>
              <template v-else-if="saveStatus === 'error'">
                <Icon
                  name="heroicons:exclamation-circle"
                  class="w-4 h-4 text-red-500"
                />
                <span class="text-red-600">Error saving</span>
              </template>
              <template v-else-if="lastSavedAt">
                <span class="text-gray-400">
                  Last saved {{ formatSaveTime(lastSavedAt) }}
                </span>
              </template>
            </div>

            <!-- Copy Link -->
            <button
              v-if="isPublic"
              type="button"
              class="btn-secondary"
              @click="handleCopyLink"
            >
              <Icon
                name="heroicons:link"
                class="w-4 h-4 mr-2"
              />
              Copy Link
            </button>

            <!-- Manual Save -->
            <button
              type="button"
              class="btn-primary"
              :disabled="isSaving"
              @click="saveDashboard()"
            >
              <Icon
                v-if="isSaving"
                name="heroicons:arrow-path"
                class="w-4 h-4 mr-2 animate-spin"
              />
              <Icon
                v-else
                name="heroicons:cloud-arrow-up"
                class="w-4 h-4 mr-2"
              />
              Save
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content: 2-column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Configuration Panels -->
        <div class="lg:col-span-1 space-y-4">
          <!-- Dashboard Info Panel -->
          <DashboardEditorInfoPanel
            :name="dashboardName"
            :client-name="currentDashboard.client?.name || 'Unknown Client'"
            :is-public="isPublic"
            :has-password="hasPassword"
            @update:name="handleNameUpdate"
            @update:is-public="handlePublicUpdate"
            @update:password="handlePasswordUpdate"
            @clear-password="handleClearPassword"
          />

          <!-- Branding Panel -->
          <DashboardEditorBrandingPanel
            :logo-url="branding.logoUrl"
            :primary-color="branding.primaryColor"
            :secondary-color="branding.secondaryColor"
            :color-palettes="COLOR_PALETTES"
            @update:logo-url="handleLogoUpdate"
            @update:primary-color="(c) => handleColorsUpdate(c, branding.secondaryColor)"
            @update:secondary-color="(c) => handleColorsUpdate(branding.primaryColor, c)"
            @update:colors="handleColorsUpdate"
          />

          <!-- Widgets Panel -->
          <DashboardEditorWidgetList
            :widgets="widgets"
            :widget-types="widgetTypes"
            @add="addWidget"
            @remove="removeWidget"
            @update="updateWidget"
            @reorder="reorderWidgets"
          />
        </div>

        <!-- Right Column: Live Preview -->
        <div class="lg:col-span-2">
          <div class="sticky top-4">
            <h3 class="text-sm font-medium text-gray-500 mb-3">
              Live Preview
            </h3>
            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[600px]">
              <DashboardLivePreview
                :widgets="widgets"
                :branding="previewBranding"
                :dashboard-name="dashboardName"
                :editable="true"
                :show-header="true"
                @remove-widget="removeWidget"
                @reorder-widgets="reorderWidgets"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
