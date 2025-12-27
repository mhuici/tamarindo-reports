<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Report Editor',
  middleware: ['tenant'],
})

const route = useRoute()
const router = useRouter()
const tenant = computed(() => route.params.tenant as string)
const reportId = computed(() => route.params.id as string)

const { currentReport, isLoading, fetchReport, updateReport } = useReports()

// Widget state
const widgets = ref<any[]>([])
const isSaving = ref(false)
const saveMessage = ref('')

// AI Insights state
const isGeneratingInsights = ref(false)
const insightsError = ref('')

// Fetch report on mount
onMounted(async () => {
  const report = await fetchReport(reportId.value)
  if (report) {
    widgets.value = report.widgets || []
  }
})

// Available widget types
const widgetTypes = [
  { type: 'metric', label: 'Metric Card', icon: 'heroicons:presentation-chart-bar', description: 'Single KPI value' },
  { type: 'line-chart', label: 'Line Chart', icon: 'heroicons:chart-bar', description: 'Trend over time' },
  { type: 'bar-chart', label: 'Bar Chart', icon: 'heroicons:chart-bar-square', description: 'Comparison data' },
  { type: 'pie-chart', label: 'Pie Chart', icon: 'heroicons:chart-pie', description: 'Distribution data' },
  { type: 'table', label: 'Data Table', icon: 'heroicons:table-cells', description: 'Detailed breakdown' },
  { type: 'text', label: 'Text Block', icon: 'heroicons:document-text', description: 'Custom text/notes' },
]

function addWidget(type: string) {
  const widgetType = widgetTypes.find(w => w.type === type)
  widgets.value.push({
    id: crypto.randomUUID(),
    type,
    title: widgetType?.label || 'Widget',
    config: {},
    size: 'medium', // small, medium, large
  })
}

function removeWidget(id: string) {
  widgets.value = widgets.value.filter(w => w.id !== id)
}

function moveWidget(index: number, direction: 'up' | 'down') {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= widgets.value.length) return

  const temp = widgets.value[index]
  widgets.value[index] = widgets.value[newIndex]
  widgets.value[newIndex] = temp
}

async function saveReport() {
  if (isSaving.value) return

  isSaving.value = true
  saveMessage.value = ''

  try {
    const result = await updateReport(reportId.value, {
      widgets: widgets.value,
    })

    if (result.success) {
      saveMessage.value = 'Saved!'
      setTimeout(() => {
        saveMessage.value = ''
      }, 2000)
    }
    else {
      saveMessage.value = result.error || 'Failed to save'
    }
  }
  catch (e) {
    saveMessage.value = 'Failed to save'
  }
  finally {
    isSaving.value = false
  }
}

async function generateReport() {
  isSaving.value = true

  try {
    const result = await updateReport(reportId.value, {
      status: 'GENERATING',
      widgets: widgets.value,
    })

    if (result.success) {
      // In a real app, this would trigger a background job
      // For now, we'll simulate completion
      setTimeout(async () => {
        await updateReport(reportId.value, { status: 'COMPLETED' })
        await fetchReport(reportId.value)
      }, 2000)
    }
  }
  finally {
    isSaving.value = false
  }
}

async function generateAIInsights() {
  if (isGeneratingInsights.value) return

  isGeneratingInsights.value = true
  insightsError.value = ''

  try {
    const response = await $fetch<{ success: boolean; insights: string; isMock: boolean; error?: string }>('/api/ai/insights', {
      method: 'POST',
      body: {
        reportId: reportId.value,
        useMock: false, // Will fallback to mock if no API key
      },
    })

    if (response.success) {
      // Refresh report to get updated insights
      await fetchReport(reportId.value)
    }
    else {
      insightsError.value = response.error || 'Failed to generate insights'
    }
  }
  catch (e: any) {
    insightsError.value = e?.data?.message || 'Failed to generate insights'
  }
  finally {
    isGeneratingInsights.value = false
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED': return 'badge-success'
    case 'GENERATING': return 'badge-warning'
    case 'SCHEDULED': return 'badge-info'
    case 'FAILED': return 'badge-error'
    default: return ''
  }
}

function getWidgetIcon(type: string) {
  return widgetTypes.find(w => w.type === type)?.icon || 'heroicons:square-3-stack-3d'
}
</script>

<template>
  <div>
    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-12"
    >
      <Icon
        name="heroicons:arrow-path"
        class="w-8 h-8 animate-spin text-gray-400"
      />
    </div>

    <!-- Report not found -->
    <div
      v-else-if="!currentReport"
      class="text-center py-12"
    >
      <Icon
        name="heroicons:document-magnifying-glass"
        class="mx-auto h-12 w-12 text-gray-400"
      />
      <h3 class="mt-2 text-sm font-medium text-gray-900">
        Report not found
      </h3>
      <NuxtLink
        :to="`/${tenant}/reports`"
        class="btn-primary mt-4 inline-flex"
      >
        Back to Reports
      </NuxtLink>
    </div>

    <!-- Report editor -->
    <div v-else>
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <NuxtLink
            :to="`/${tenant}/reports`"
            class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            <Icon
              name="heroicons:arrow-left"
              class="w-4 h-4"
            />
            Back to Reports
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ currentReport.name }}
          </h1>
          <div class="flex items-center gap-3 mt-1">
            <span class="text-gray-500">{{ currentReport.client.name }}</span>
            <span :class="['badge', getStatusColor(currentReport.status)]">
              {{ currentReport.status.toLowerCase() }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span
            v-if="saveMessage"
            class="text-sm text-green-600"
          >
            {{ saveMessage }}
          </span>
          <button
            class="btn-secondary"
            :disabled="isSaving"
            @click="saveReport"
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
            Save Draft
          </button>
          <button
            v-if="currentReport.status === 'DRAFT'"
            class="btn-primary"
            :disabled="isSaving || widgets.length === 0"
            @click="generateReport"
          >
            <Icon
              name="heroicons:sparkles"
              class="w-4 h-4 mr-2"
            />
            Generate Report
          </button>
        </div>
      </div>

      <!-- Report info bar -->
      <div class="card card-body mb-6">
        <div class="flex flex-wrap gap-6">
          <div>
            <p class="text-xs text-gray-500 uppercase tracking-wide">
              Date Range
            </p>
            <p class="font-medium text-gray-900">
              {{ formatDate(currentReport.dateRange.start) }} - {{ formatDate(currentReport.dateRange.end) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase tracking-wide">
              Type
            </p>
            <p class="font-medium text-gray-900 capitalize">
              {{ currentReport.type.toLowerCase() }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase tracking-wide">
              Created
            </p>
            <p class="font-medium text-gray-900">
              {{ formatDate(currentReport.createdAt) }}
            </p>
          </div>
          <div v-if="currentReport.pdfUrl">
            <p class="text-xs text-gray-500 uppercase tracking-wide">
              PDF
            </p>
            <a
              :href="currentReport.pdfUrl"
              target="_blank"
              class="font-medium text-tamarindo-600 hover:underline"
            >
              Download
            </a>
          </div>
        </div>
      </div>

      <!-- Main content area -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Widget palette (sidebar) -->
        <div class="lg:col-span-1">
          <div class="card card-body sticky top-4">
            <h3 class="font-semibold text-gray-900 mb-4">
              Add Widgets
            </h3>
            <div class="space-y-2">
              <button
                v-for="widget in widgetTypes"
                :key="widget.type"
                class="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-tamarindo-300 hover:bg-tamarindo-50 transition-colors"
                @click="addWidget(widget.type)"
              >
                <div class="flex items-center gap-3">
                  <Icon
                    :name="widget.icon"
                    class="w-5 h-5 text-gray-500"
                  />
                  <div>
                    <p class="font-medium text-gray-900 text-sm">
                      {{ widget.label }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ widget.description }}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Canvas area -->
        <div class="lg:col-span-3">
          <!-- Empty state -->
          <div
            v-if="widgets.length === 0"
            class="card card-body border-dashed text-center py-16"
          >
            <Icon
              name="heroicons:squares-plus"
              class="mx-auto h-12 w-12 text-gray-400"
            />
            <h3 class="mt-2 text-sm font-medium text-gray-900">
              No widgets yet
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              Click on a widget type from the sidebar to add it to your report.
            </p>
          </div>

          <!-- Widgets list -->
          <div
            v-else
            class="space-y-4"
          >
            <div
              v-for="(widget, index) in widgets"
              :key="widget.id"
              class="card hover:shadow-md transition-shadow"
            >
              <div class="card-body">
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <Icon
                      :name="getWidgetIcon(widget.type)"
                      class="w-5 h-5 text-gray-500"
                    />
                    <div>
                      <input
                        v-model="widget.title"
                        type="text"
                        class="font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                      >
                      <p class="text-xs text-gray-500 capitalize">
                        {{ widget.type.replace('-', ' ') }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-1">
                    <button
                      class="p-1 text-gray-400 hover:text-gray-600"
                      title="Move up"
                      :disabled="index === 0"
                      @click="moveWidget(index, 'up')"
                    >
                      <Icon
                        name="heroicons:chevron-up"
                        class="w-4 h-4"
                      />
                    </button>
                    <button
                      class="p-1 text-gray-400 hover:text-gray-600"
                      title="Move down"
                      :disabled="index === widgets.length - 1"
                      @click="moveWidget(index, 'down')"
                    >
                      <Icon
                        name="heroicons:chevron-down"
                        class="w-4 h-4"
                      />
                    </button>
                    <button
                      class="p-1 text-gray-400 hover:text-red-600"
                      title="Remove"
                      @click="removeWidget(widget.id)"
                    >
                      <Icon
                        name="heroicons:trash"
                        class="w-4 h-4"
                      />
                    </button>
                  </div>
                </div>

                <!-- Widget preview placeholder -->
                <div class="mt-4 bg-gray-50 rounded-lg p-8 text-center">
                  <Icon
                    :name="getWidgetIcon(widget.type)"
                    class="mx-auto h-8 w-8 text-gray-300"
                  />
                  <p class="mt-2 text-sm text-gray-400">
                    Widget preview will appear here
                  </p>
                  <p class="text-xs text-gray-400">
                    (Configure data source to see real data)
                  </p>
                </div>

                <!-- Size selector -->
                <div class="mt-4 flex items-center gap-2">
                  <span class="text-xs text-gray-500">Size:</span>
                  <button
                    v-for="size in ['small', 'medium', 'large']"
                    :key="size"
                    :class="[
                      'px-2 py-1 text-xs rounded',
                      widget.size === size
                        ? 'bg-tamarindo-100 text-tamarindo-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    ]"
                    @click="widget.size = size"
                  >
                    {{ size }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Insights section -->
          <div class="card card-body mt-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <Icon
                  name="heroicons:sparkles"
                  class="w-5 h-5 text-purple-500"
                />
                <h3 class="font-semibold text-gray-900">
                  AI Insights
                </h3>
              </div>
              <button
                class="btn-secondary text-sm"
                :disabled="isGeneratingInsights"
                @click="generateAIInsights"
              >
                <Icon
                  v-if="isGeneratingInsights"
                  name="heroicons:arrow-path"
                  class="w-4 h-4 mr-2 animate-spin"
                />
                <Icon
                  v-else
                  name="heroicons:sparkles"
                  class="w-4 h-4 mr-2"
                />
                {{ currentReport.aiInsights ? 'Regenerate' : 'Generate Insights' }}
              </button>
            </div>

            <!-- Error message -->
            <div
              v-if="insightsError"
              class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {{ insightsError }}
            </div>

            <!-- Loading state -->
            <div
              v-if="isGeneratingInsights"
              class="py-8 text-center"
            >
              <Icon
                name="heroicons:sparkles"
                class="mx-auto h-8 w-8 text-purple-400 animate-pulse"
              />
              <p class="mt-2 text-sm text-gray-500">
                Generating insights with AI...
              </p>
            </div>

            <!-- Empty state -->
            <div
              v-else-if="!currentReport.aiInsights"
              class="py-8 text-center bg-gray-50 rounded-lg"
            >
              <Icon
                name="heroicons:light-bulb"
                class="mx-auto h-8 w-8 text-gray-300"
              />
              <p class="mt-2 text-sm text-gray-500">
                Click "Generate Insights" to get AI-powered analysis of your report data.
              </p>
            </div>

            <!-- Insights content -->
            <div
              v-else
              class="prose prose-sm max-w-none text-gray-700"
            >
              <div
                class="whitespace-pre-wrap"
                v-html="currentReport.aiInsights.replace(/## /g, '<h4 class=\'text-lg font-semibold text-gray-900 mt-4 mb-2\'>').replace(/\n- /g, '<br>• ').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
