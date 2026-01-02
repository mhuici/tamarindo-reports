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

// PDF generation state
const isGeneratingPDF = ref(false)
const pdfError = ref('')
const pdfSuccess = ref('')

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

// Available metrics for widgets
const availableMetrics = [
  { value: 'impressions', label: 'Impressions', format: 'number', category: 'Traffic' },
  { value: 'clicks', label: 'Clicks', format: 'number', category: 'Traffic' },
  { value: 'reach', label: 'Reach', format: 'number', category: 'Traffic' },
  { value: 'spend', label: 'Ad Spend', format: 'currency', category: 'Cost' },
  { value: 'cpc', label: 'Cost per Click (CPC)', format: 'currency', category: 'Cost' },
  { value: 'cpm', label: 'Cost per 1000 (CPM)', format: 'currency', category: 'Cost' },
  { value: 'ctr', label: 'Click-through Rate (CTR)', format: 'percent', category: 'Performance' },
  { value: 'conversions', label: 'Conversions', format: 'number', category: 'Conversions' },
  { value: 'conversionValue', label: 'Conversion Value', format: 'currency', category: 'Conversions' },
  { value: 'conversionRate', label: 'Conversion Rate', format: 'percent', category: 'Conversions' },
  { value: 'costPerConversion', label: 'Cost per Conversion', format: 'currency', category: 'Conversions' },
  { value: 'roas', label: 'Return on Ad Spend (ROAS)', format: 'percent', category: 'Conversions' },
]

// Track which widget is being configured
const configuringWidgetId = ref<string | null>(null)

function toggleWidgetConfig(widgetId: string) {
  if (configuringWidgetId.value === widgetId) {
    configuringWidgetId.value = null
  }
  else {
    configuringWidgetId.value = widgetId
  }
}

function getMetricLabel(metricValue: string) {
  return availableMetrics.find(m => m.value === metricValue)?.label || metricValue
}

function addWidget(type: string) {
  const widgetType = widgetTypes.find(w => w.type === type)
  const newWidget = {
    id: crypto.randomUUID(),
    type,
    title: widgetType?.label || 'Widget',
    config: {
      metric: type === 'table' ? ['impressions', 'clicks', 'spend', 'ctr'] : 'impressions',
      showComparison: true,
      color: '#f97316', // tamarindo orange
    },
    size: 'medium', // small, medium, large
  }
  widgets.value.push(newWidget)
  // Auto-open config for new widget
  configuringWidgetId.value = newWidget.id
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

async function generatePDF() {
  if (isGeneratingPDF.value) return

  isGeneratingPDF.value = true
  pdfError.value = ''
  pdfSuccess.value = ''

  try {
    const response = await $fetch<{ success: boolean; pdfUrl: string; message: string }>('/api/pdf/generate', {
      method: 'POST',
      body: {
        reportId: reportId.value,
      },
    })

    if (response.success) {
      pdfSuccess.value = 'PDF generado exitosamente'
      // Refresh report to get updated PDF URL
      await fetchReport(reportId.value)

      // Clear success message after 3 seconds
      setTimeout(() => {
        pdfSuccess.value = ''
      }, 3000)
    }
  }
  catch (e: any) {
    pdfError.value = e?.data?.message || 'Error al generar PDF'
  }
  finally {
    isGeneratingPDF.value = false
  }
}

function downloadPDF() {
  if (currentReport.value?.pdfUrl) {
    window.open(currentReport.value.pdfUrl, '_blank')
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
          <span
            v-if="pdfSuccess"
            class="text-sm text-green-600"
          >
            {{ pdfSuccess }}
          </span>
          <span
            v-if="pdfError"
            class="text-sm text-red-600"
          >
            {{ pdfError }}
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

          <!-- PDF buttons -->
          <button
            v-if="currentReport.pdfUrl"
            class="btn-secondary"
            @click="downloadPDF"
          >
            <Icon
              name="heroicons:arrow-down-tray"
              class="w-4 h-4 mr-2"
            />
            Descargar PDF
          </button>

          <button
            class="btn-primary"
            :disabled="isGeneratingPDF || widgets.length === 0"
            @click="generatePDF"
          >
            <Icon
              v-if="isGeneratingPDF"
              name="heroicons:arrow-path"
              class="w-4 h-4 mr-2 animate-spin"
            />
            <Icon
              v-else
              name="heroicons:document-arrow-down"
              class="w-4 h-4 mr-2"
            />
            {{ currentReport.pdfUrl ? 'Regenerar PDF' : 'Generar PDF' }}
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
          <div>
            <p class="text-xs text-gray-500 uppercase tracking-wide">
              PDF
            </p>
            <div
              v-if="currentReport.pdfUrl"
              class="flex items-center gap-2"
            >
              <Icon
                name="heroicons:check-circle"
                class="w-4 h-4 text-green-500"
              />
              <a
                :href="currentReport.pdfUrl"
                target="_blank"
                class="font-medium text-tamarindo-600 hover:underline"
              >
                Ver PDF
              </a>
            </div>
            <span
              v-else
              class="text-gray-400 text-sm"
            >
              No generado
            </span>
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

                <!-- Widget config toggle button -->
                <button
                  class="mt-3 w-full py-2 px-3 text-sm text-left rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-between"
                  @click="toggleWidgetConfig(widget.id)"
                >
                  <span class="flex items-center gap-2">
                    <Icon
                      name="heroicons:cog-6-tooth"
                      class="w-4 h-4 text-gray-500"
                    />
                    <span class="text-gray-700">Configure Widget</span>
                    <span
                      v-if="widget.config?.metric"
                      class="text-xs text-gray-500"
                    >
                      ({{ Array.isArray(widget.config.metric) ? widget.config.metric.length + ' metrics' : getMetricLabel(widget.config.metric) }})
                    </span>
                  </span>
                  <Icon
                    :name="configuringWidgetId === widget.id ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
                    class="w-4 h-4 text-gray-400"
                  />
                </button>

                <!-- Configuration panel -->
                <div
                  v-if="configuringWidgetId === widget.id"
                  class="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4"
                >
                  <!-- Metric selector for single metric widgets -->
                  <div v-if="widget.type !== 'table' && widget.type !== 'text'">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Select Metric
                    </label>
                    <select
                      v-model="widget.config.metric"
                      class="input"
                    >
                      <optgroup
                        v-for="category in ['Traffic', 'Cost', 'Performance', 'Conversions']"
                        :key="category"
                        :label="category"
                      >
                        <option
                          v-for="metric in availableMetrics.filter(m => m.category === category)"
                          :key="metric.value"
                          :value="metric.value"
                        >
                          {{ metric.label }}
                        </option>
                      </optgroup>
                    </select>
                  </div>

                  <!-- Multiple metric selector for tables -->
                  <div v-if="widget.type === 'table'">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Select Columns
                    </label>
                    <div class="grid grid-cols-2 gap-2">
                      <label
                        v-for="metric in availableMetrics"
                        :key="metric.value"
                        class="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          :value="metric.value"
                          :checked="widget.config.metric?.includes(metric.value)"
                          class="rounded border-gray-300 text-tamarindo-600 focus:ring-tamarindo-500"
                          @change="(e: Event) => {
                            const target = e.target as HTMLInputElement
                            if (!widget.config.metric) widget.config.metric = []
                            if (target.checked) {
                              widget.config.metric.push(metric.value)
                            } else {
                              widget.config.metric = widget.config.metric.filter((m: string) => m !== metric.value)
                            }
                          }"
                        >
                        <span class="text-sm text-gray-700">{{ metric.label }}</span>
                      </label>
                    </div>
                  </div>

                  <!-- Text content for text widgets -->
                  <div v-if="widget.type === 'text'">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <textarea
                      v-model="widget.config.content"
                      class="input"
                      rows="4"
                      placeholder="Enter your text or notes here..."
                    />
                  </div>

                  <!-- Show comparison toggle (for metric cards and charts) -->
                  <div v-if="widget.type === 'metric' || widget.type === 'line-chart' || widget.type === 'bar-chart'">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        v-model="widget.config.showComparison"
                        type="checkbox"
                        class="rounded border-gray-300 text-tamarindo-600 focus:ring-tamarindo-500"
                      >
                      <span class="text-sm text-gray-700">Show comparison with previous period</span>
                    </label>
                  </div>

                  <!-- Color picker -->
                  <div v-if="widget.type !== 'text' && widget.type !== 'table'">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <div class="flex gap-2">
                      <button
                        v-for="color in ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b']"
                        :key="color"
                        :class="[
                          'w-8 h-8 rounded-full border-2 transition-all',
                          widget.config.color === color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105',
                        ]"
                        :style="{ backgroundColor: color }"
                        @click="widget.config.color = color"
                      />
                    </div>
                  </div>

                  <!-- Size selector -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Widget Size
                    </label>
                    <div class="flex gap-2">
                      <button
                        v-for="size in ['small', 'medium', 'large']"
                        :key="size"
                        :class="[
                          'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                          widget.size === size
                            ? 'bg-tamarindo-100 border-tamarindo-300 text-tamarindo-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
                        ]"
                        @click="widget.size = size"
                      >
                        {{ size.charAt(0).toUpperCase() + size.slice(1) }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Widget preview -->
                <div
                  class="mt-4 rounded-lg p-6 text-center"
                  :style="{ backgroundColor: (widget.config?.color || '#f97316') + '10' }"
                >
                  <div
                    v-if="widget.type === 'metric'"
                    class="text-center"
                  >
                    <p class="text-sm text-gray-500 mb-1">
                      {{ getMetricLabel(widget.config?.metric || 'impressions') }}
                    </p>
                    <p
                      class="text-3xl font-bold"
                      :style="{ color: widget.config?.color || '#f97316' }"
                    >
                      --
                    </p>
                    <p
                      v-if="widget.config?.showComparison"
                      class="text-xs text-gray-400 mt-1"
                    >
                      vs previous period
                    </p>
                  </div>
                  <div
                    v-else-if="widget.type === 'text'"
                    class="text-left"
                  >
                    <p class="text-gray-700 whitespace-pre-wrap">
                      {{ widget.config?.content || 'Your text will appear here...' }}
                    </p>
                  </div>
                  <div v-else>
                    <Icon
                      :name="getWidgetIcon(widget.type)"
                      class="mx-auto h-10 w-10"
                      :style="{ color: widget.config?.color || '#f97316' }"
                    />
                    <p class="mt-2 text-sm font-medium text-gray-700">
                      {{ getMetricLabel(widget.config?.metric || 'impressions') }}
                    </p>
                    <p class="text-xs text-gray-400 mt-1">
                      {{ widget.type === 'table' ? 'Data table preview' : 'Chart preview' }}
                    </p>
                  </div>
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
