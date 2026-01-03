<script setup lang="ts">
import { formatMetricValue, getMetricFormat } from '~/composables/useWidgetPreview'

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
const { fetchPreviewData, isLoading: isPreviewLoading } = useWidgetPreview(reportId.value)

// Widget state
const widgets = ref<any[]>([])
const isSaving = ref(false)
const saveMessage = ref('')

// Drag and drop state
const draggedWidgetType = ref<string | null>(null)
const dragOverIndex = ref<number | null>(null)
const isDraggingExisting = ref(false)
const draggedWidgetIndex = ref<number | null>(null)

// Preview data cache
const widgetPreviews = ref<Record<string, any>>({})

// PDF generation state
const isGeneratingPDF = ref(false)
const pdfError = ref('')
const pdfSuccess = ref('')

// Fetch report on mount
onMounted(async () => {
  const report = await fetchReport(reportId.value)
  if (report) {
    widgets.value = report.widgets || []
    // Fetch preview data for all widgets
    await loadAllWidgetPreviews()
  }
})

// Load preview data for all widgets
async function loadAllWidgetPreviews() {
  for (const widget of widgets.value) {
    await loadWidgetPreview(widget)
  }
}

// Load preview data for a single widget
async function loadWidgetPreview(widget: any) {
  if (widget.type === 'text') return

  const metric = widget.config?.metric || 'impressions'
  const data = await fetchPreviewData(widget.type, metric)

  if (data) {
    widgetPreviews.value[widget.id] = data
  }
}

// Available widget types
const widgetTypes = [
  { type: 'metric', label: 'Metric Card', icon: 'heroicons:presentation-chart-bar', description: 'Single KPI value', defaultSize: 'small' },
  { type: 'line-chart', label: 'Line Chart', icon: 'heroicons:chart-bar', description: 'Trend over time', defaultSize: 'large' },
  { type: 'bar-chart', label: 'Bar Chart', icon: 'heroicons:chart-bar-square', description: 'Comparison data', defaultSize: 'medium' },
  { type: 'pie-chart', label: 'Pie Chart', icon: 'heroicons:chart-pie', description: 'Distribution data', defaultSize: 'medium' },
  { type: 'table', label: 'Data Table', icon: 'heroicons:table-cells', description: 'Detailed breakdown', defaultSize: 'large' },
  { type: 'text', label: 'Text Block', icon: 'heroicons:document-text', description: 'Custom text/notes', defaultSize: 'large' },
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

function getMetricFormatByValue(metricValue: string) {
  return availableMetrics.find(m => m.value === metricValue)?.format || 'number'
}

// Grid size classes based on widget size
function getWidgetGridClass(size: string) {
  switch (size) {
    case 'small': return 'col-span-1'
    case 'medium': return 'col-span-2'
    case 'large': return 'col-span-4'
    default: return 'col-span-2'
  }
}

// Drag and drop from palette
function handlePaletteDragStart(event: DragEvent, type: string) {
  draggedWidgetType.value = type
  isDraggingExisting.value = false
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', type)
  }
}

// Drag existing widget to reorder
function handleWidgetDragStart(event: DragEvent, index: number) {
  draggedWidgetIndex.value = index
  isDraggingExisting.value = true
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function handleDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  dragOverIndex.value = index
}

function handleDragLeave() {
  dragOverIndex.value = null
}

function handleDrop(event: DragEvent, index: number) {
  event.preventDefault()

  if (isDraggingExisting.value && draggedWidgetIndex.value !== null) {
    // Reorder existing widget
    const widget = widgets.value[draggedWidgetIndex.value]
    widgets.value.splice(draggedWidgetIndex.value, 1)
    widgets.value.splice(index, 0, widget)
  }
  else if (draggedWidgetType.value) {
    // Add new widget at position
    addWidgetAtIndex(draggedWidgetType.value, index)
  }

  // Reset drag state
  draggedWidgetType.value = null
  draggedWidgetIndex.value = null
  dragOverIndex.value = null
  isDraggingExisting.value = false
}

function handleCanvasDrop(event: DragEvent) {
  event.preventDefault()

  if (draggedWidgetType.value && !isDraggingExisting.value) {
    // Add to end if dropped on canvas (not on specific position)
    addWidget(draggedWidgetType.value)
  }

  draggedWidgetType.value = null
  dragOverIndex.value = null
}

function handleDragEnd() {
  draggedWidgetType.value = null
  draggedWidgetIndex.value = null
  dragOverIndex.value = null
  isDraggingExisting.value = false
}

async function addWidget(type: string) {
  const widgetType = widgetTypes.find(w => w.type === type)
  const newWidget = {
    id: crypto.randomUUID(),
    type,
    title: widgetType?.label || 'Widget',
    config: {
      metric: type === 'table' ? ['impressions', 'clicks', 'spend', 'ctr'] : 'impressions',
      showComparison: true,
      color: '#f97316',
    },
    size: widgetType?.defaultSize || 'medium',
  }
  widgets.value.push(newWidget)
  configuringWidgetId.value = newWidget.id

  // Load preview data for new widget
  await loadWidgetPreview(newWidget)
}

async function addWidgetAtIndex(type: string, index: number) {
  const widgetType = widgetTypes.find(w => w.type === type)
  const newWidget = {
    id: crypto.randomUUID(),
    type,
    title: widgetType?.label || 'Widget',
    config: {
      metric: type === 'table' ? ['impressions', 'clicks', 'spend', 'ctr'] : 'impressions',
      showComparison: true,
      color: '#f97316',
    },
    size: widgetType?.defaultSize || 'medium',
  }
  widgets.value.splice(index, 0, newWidget)
  configuringWidgetId.value = newWidget.id

  // Load preview data
  await loadWidgetPreview(newWidget)
}

function removeWidget(id: string) {
  widgets.value = widgets.value.filter(w => w.id !== id)
  delete widgetPreviews.value[id]
}

async function updateWidgetMetric(widget: any, metric: string) {
  widget.config.metric = metric
  await loadWidgetPreview(widget)
}

async function updateWidgetSize(widget: any, size: string) {
  widget.size = size
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
      pdfSuccess.value = 'PDF generated successfully'
      await fetchReport(reportId.value)

      setTimeout(() => {
        pdfSuccess.value = ''
      }, 3000)
    }
  }
  catch (e: any) {
    pdfError.value = e?.data?.message || 'Error generating PDF'
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

// Compute preview value for a widget
function getPreviewValue(widget: any) {
  const preview = widgetPreviews.value[widget.id]
  if (!preview) return null
  return preview.value
}

function getPreviewPreviousValue(widget: any) {
  const preview = widgetPreviews.value[widget.id]
  if (!preview) return null
  return preview.previousValue
}

function getPreviewChartData(widget: any) {
  const preview = widgetPreviews.value[widget.id]
  if (!preview || !preview.data) return []
  return preview.data
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

          <button
            v-if="currentReport.pdfUrl"
            class="btn-secondary"
            @click="downloadPDF"
          >
            <Icon
              name="heroicons:arrow-down-tray"
              class="w-4 h-4 mr-2"
            />
            Download PDF
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
            {{ currentReport.pdfUrl ? 'Regenerate PDF' : 'Generate PDF' }}
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
                View PDF
              </a>
            </div>
            <span
              v-else
              class="text-gray-400 text-sm"
            >
              Not generated
            </span>
          </div>
        </div>
      </div>

      <!-- Main content area -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- Widget palette (sidebar) -->
        <div class="lg:col-span-1">
          <div class="card card-body sticky top-4">
            <h3 class="font-semibold text-gray-900 mb-4">
              Add Widgets
            </h3>
            <p class="text-xs text-gray-500 mb-3">
              Drag widgets to the canvas or click to add
            </p>
            <div class="space-y-2">
              <button
                v-for="widget in widgetTypes"
                :key="widget.type"
                draggable="true"
                class="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-tamarindo-300 hover:bg-tamarindo-50 transition-colors cursor-grab active:cursor-grabbing"
                @click="addWidget(widget.type)"
                @dragstart="handlePaletteDragStart($event, widget.type)"
                @dragend="handleDragEnd"
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

        <!-- Canvas area (Grid) -->
        <div class="lg:col-span-4">
          <!-- Empty state -->
          <div
            v-if="widgets.length === 0"
            class="card card-body border-dashed border-2 text-center py-16"
            @dragover.prevent="dragOverIndex = -1"
            @dragleave="dragOverIndex = null"
            @drop="handleCanvasDrop"
          >
            <Icon
              name="heroicons:squares-plus"
              class="mx-auto h-12 w-12 text-gray-400"
            />
            <h3 class="mt-2 text-sm font-medium text-gray-900">
              No widgets yet
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              Drag widgets from the sidebar or click to add them to your report.
            </p>
          </div>

          <!-- Grid Canvas -->
          <div
            v-else
            class="bg-gray-100 rounded-xl p-4 min-h-[600px]"
            @dragover.prevent
            @drop="handleCanvasDrop"
          >
            <div class="grid grid-cols-4 gap-4 auto-rows-min">
              <template
                v-for="(widget, index) in widgets"
                :key="widget.id"
              >
                <!-- Drop zone indicator -->
                <div
                  v-if="dragOverIndex === index"
                  class="col-span-4 h-2 bg-tamarindo-300 rounded-full transition-all"
                />

                <!-- Widget Card -->
                <div
                  :class="[
                    'bg-white rounded-xl border-2 transition-all overflow-hidden',
                    getWidgetGridClass(widget.size),
                    configuringWidgetId === widget.id ? 'border-tamarindo-500 ring-2 ring-tamarindo-200' : 'border-gray-200 hover:border-gray-300',
                    draggedWidgetIndex === index ? 'opacity-50' : '',
                  ]"
                  draggable="true"
                  @dragstart="handleWidgetDragStart($event, index)"
                  @dragover="handleDragOver($event, index)"
                  @dragleave="handleDragLeave"
                  @drop="handleDrop($event, index)"
                  @dragend="handleDragEnd"
                >
                  <!-- Widget Header -->
                  <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div class="flex items-center gap-2 min-w-0">
                      <Icon
                        name="heroicons:bars-2"
                        class="w-4 h-4 text-gray-400 cursor-grab"
                      />
                      <Icon
                        :name="getWidgetIcon(widget.type)"
                        class="w-4 h-4 text-gray-500"
                      />
                      <input
                        v-model="widget.title"
                        type="text"
                        class="text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 min-w-0 flex-1"
                      >
                    </div>

                    <div class="flex items-center gap-1">
                      <button
                        class="p-1 rounded hover:bg-gray-200"
                        title="Configure"
                        @click="toggleWidgetConfig(widget.id)"
                      >
                        <Icon
                          name="heroicons:cog-6-tooth"
                          :class="['w-4 h-4', configuringWidgetId === widget.id ? 'text-tamarindo-600' : 'text-gray-400']"
                        />
                      </button>
                      <button
                        class="p-1 rounded hover:bg-red-100"
                        title="Remove"
                        @click="removeWidget(widget.id)"
                      >
                        <Icon
                          name="heroicons:trash"
                          class="w-4 h-4 text-gray-400 hover:text-red-600"
                        />
                      </button>
                    </div>
                  </div>

                  <!-- Configuration Panel (collapsible) -->
                  <div
                    v-if="configuringWidgetId === widget.id"
                    class="px-4 py-3 bg-gray-50 border-b border-gray-200 space-y-3"
                  >
                    <!-- Metric selector -->
                    <div v-if="widget.type !== 'table' && widget.type !== 'text'">
                      <label class="block text-xs font-medium text-gray-600 mb-1">Metric</label>
                      <select
                        :value="widget.config.metric"
                        class="input input-sm"
                        @change="updateWidgetMetric(widget, ($event.target as HTMLSelectElement).value)"
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

                    <!-- Text content -->
                    <div v-if="widget.type === 'text'">
                      <label class="block text-xs font-medium text-gray-600 mb-1">Content</label>
                      <textarea
                        v-model="widget.config.content"
                        class="input input-sm"
                        rows="3"
                        placeholder="Enter your text..."
                      />
                    </div>

                    <!-- Size selector -->
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">Size</label>
                      <div class="flex gap-1">
                        <button
                          v-for="size in ['small', 'medium', 'large']"
                          :key="size"
                          :class="[
                            'flex-1 px-2 py-1 text-xs rounded transition-colors',
                            widget.size === size
                              ? 'bg-tamarindo-500 text-white'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300',
                          ]"
                          @click="updateWidgetSize(widget, size)"
                        >
                          {{ size === 'small' ? '1 col' : size === 'medium' ? '2 col' : '4 col' }}
                        </button>
                      </div>
                    </div>

                    <!-- Color picker -->
                    <div v-if="widget.type !== 'text' && widget.type !== 'table'">
                      <label class="block text-xs font-medium text-gray-600 mb-1">Color</label>
                      <div class="flex gap-1">
                        <button
                          v-for="color in ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b']"
                          :key="color"
                          :class="[
                            'w-6 h-6 rounded-full border-2 transition-all',
                            widget.config.color === color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105',
                          ]"
                          :style="{ backgroundColor: color }"
                          @click="widget.config.color = color"
                        />
                      </div>
                    </div>

                    <!-- Comparison toggle -->
                    <div v-if="widget.type === 'metric'">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          v-model="widget.config.showComparison"
                          type="checkbox"
                          class="rounded border-gray-300 text-tamarindo-600"
                        >
                        <span class="text-xs text-gray-600">Show comparison</span>
                      </label>
                    </div>
                  </div>

                  <!-- Widget Preview (with real data) -->
                  <div class="p-4">
                    <!-- Metric Card Preview -->
                    <div
                      v-if="widget.type === 'metric'"
                      class="text-center py-4"
                    >
                      <p class="text-sm text-gray-500 mb-1">
                        {{ getMetricLabel(widget.config?.metric || 'impressions') }}
                      </p>
                      <p
                        v-if="isPreviewLoading && !widgetPreviews[widget.id]"
                        class="text-3xl font-bold text-gray-300 animate-pulse"
                      >
                        Loading...
                      </p>
                      <p
                        v-else
                        class="text-3xl font-bold"
                        :style="{ color: widget.config?.color || '#f97316' }"
                      >
                        {{ formatMetricValue(getPreviewValue(widget), getMetricFormatByValue(widget.config?.metric || 'impressions')) }}
                      </p>
                      <div
                        v-if="widget.config?.showComparison && getPreviewPreviousValue(widget)"
                        class="flex items-center justify-center gap-1 mt-2"
                      >
                        <Icon
                          :name="(getPreviewValue(widget) || 0) >= (getPreviewPreviousValue(widget) || 0) ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'"
                          :class="[
                            'w-4 h-4',
                            (getPreviewValue(widget) || 0) >= (getPreviewPreviousValue(widget) || 0) ? 'text-green-500' : 'text-red-500',
                          ]"
                        />
                        <span
                          :class="[
                            'text-sm font-medium',
                            (getPreviewValue(widget) || 0) >= (getPreviewPreviousValue(widget) || 0) ? 'text-green-600' : 'text-red-600',
                          ]"
                        >
                          {{ Math.abs(Math.round(((getPreviewValue(widget) || 0) - (getPreviewPreviousValue(widget) || 1)) / (getPreviewPreviousValue(widget) || 1) * 100)) }}%
                        </span>
                        <span class="text-xs text-gray-400">vs prev</span>
                      </div>
                    </div>

                    <!-- Chart Preview -->
                    <div
                      v-else-if="['line-chart', 'bar-chart'].includes(widget.type)"
                      class="h-32"
                    >
                      <div
                        v-if="getPreviewChartData(widget).length > 0"
                        class="h-full"
                      >
                        <!-- Simple bar visualization -->
                        <div
                          v-if="widget.type === 'bar-chart'"
                          class="flex items-end justify-around h-full gap-1 pb-6"
                        >
                          <div
                            v-for="(point, i) in getPreviewChartData(widget).slice(0, 7)"
                            :key="i"
                            class="flex-1 flex flex-col items-center"
                          >
                            <div
                              class="w-full rounded-t transition-all"
                              :style="{
                                backgroundColor: widget.config?.color || '#f97316',
                                height: `${Math.max(10, (point.value / Math.max(...getPreviewChartData(widget).map((p: any) => p.value))) * 100)}%`,
                              }"
                            />
                            <span class="text-[10px] text-gray-400 mt-1 truncate w-full text-center">{{ point.label }}</span>
                          </div>
                        </div>
                        <!-- Simple line visualization -->
                        <div
                          v-else
                          class="h-full relative"
                        >
                          <svg
                            class="w-full h-full"
                            viewBox="0 0 100 50"
                            preserveAspectRatio="none"
                          >
                            <polyline
                              fill="none"
                              :stroke="widget.config?.color || '#f97316'"
                              stroke-width="2"
                              :points="getPreviewChartData(widget).slice(0, 7).map((p: any, i: number) => {
                                const maxVal = Math.max(...getPreviewChartData(widget).map((d: any) => d.value))
                                const x = (i / Math.max(getPreviewChartData(widget).length - 1, 1)) * 100
                                const y = 50 - (p.value / maxVal) * 45
                                return `${x},${y}`
                              }).join(' ')"
                            />
                          </svg>
                          <div class="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400">
                            <span>{{ getPreviewChartData(widget)[0]?.label }}</span>
                            <span>{{ getPreviewChartData(widget)[getPreviewChartData(widget).length - 1]?.label }}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        v-else
                        class="h-full flex items-center justify-center"
                      >
                        <Icon
                          :name="getWidgetIcon(widget.type)"
                          class="w-8 h-8"
                          :style="{ color: widget.config?.color || '#f97316' }"
                        />
                      </div>
                    </div>

                    <!-- Pie Chart Preview -->
                    <div
                      v-else-if="widget.type === 'pie-chart'"
                      class="h-32 flex items-center justify-center"
                    >
                      <div
                        class="w-20 h-20 rounded-full"
                        :style="{
                          background: `conic-gradient(${widget.config?.color || '#f97316'} 0% 60%, #e5e7eb 60% 100%)`,
                        }"
                      />
                    </div>

                    <!-- Table Preview -->
                    <div
                      v-else-if="widget.type === 'table'"
                      class="overflow-x-auto"
                    >
                      <div class="text-xs text-gray-500 text-center py-4">
                        <Icon
                          name="heroicons:table-cells"
                          class="w-6 h-6 mx-auto mb-1 text-gray-400"
                        />
                        Data table with {{ Array.isArray(widget.config?.metric) ? widget.config.metric.length : 4 }} columns
                      </div>
                    </div>

                    <!-- Text Preview -->
                    <div
                      v-else-if="widget.type === 'text'"
                      class="text-sm text-gray-700 whitespace-pre-wrap"
                    >
                      {{ widget.config?.content || 'Your text will appear here...' }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- Drop zone at end -->
              <div
                v-if="draggedWidgetType || isDraggingExisting"
                class="col-span-4 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 transition-colors"
                :class="{ 'border-tamarindo-400 bg-tamarindo-50': dragOverIndex === widgets.length }"
                @dragover="handleDragOver($event, widgets.length)"
                @dragleave="handleDragLeave"
                @drop="handleDrop($event, widgets.length)"
              >
                <span class="text-sm">Drop widget here</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
