<script setup lang="ts">
import { formatMetricValue } from '~/composables/useWidgetPreview'
import { useEditorHistory } from '~/composables/useEditorHistory'

definePageMeta({
  layout: 'dashboard',
  title: 'Report Editor',
  middleware: ['tenant'],
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)
const reportId = computed(() => route.params.id as string)

const { currentReport, isLoading, fetchReport, updateReport } = useReports()
const { fetchPreviewData, isLoading: isPreviewLoading } = useWidgetPreview(reportId.value)

// Widget state
const widgets = ref<any[]>([])
const isSaving = ref(false)
const saveMessage = ref('')

// Editor history for undo/redo
const {
  canUndo,
  canRedo,
  initHistory,
  saveState,
  undo,
  redo,
  setupKeyboardShortcuts,
  cleanupKeyboardShortcuts,
} = useEditorHistory(widgets)

// Editor mode: 'edit' or 'preview'
const editorMode = ref<'edit' | 'preview'>('edit')

// Selected widget for configuration sidebar
const selectedWidgetId = ref<string | null>(null)
const selectedWidget = computed(() => widgets.value.find(w => w.id === selectedWidgetId.value))

// Drag and drop state
const draggedWidgetType = ref<string | null>(null)
const dragOverIndex = ref<number | null>(null)
const isDraggingExisting = ref(false)
const draggedWidgetIndex = ref<number | null>(null)

// Resize state
const isResizing = ref(false)
const resizingWidgetId = ref<string | null>(null)
const resizeStartX = ref(0)
const resizeStartSize = ref('')

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
    initHistory()
    await loadAllWidgetPreviews()
  }
  setupKeyboardShortcuts()
})

onUnmounted(() => {
  cleanupKeyboardShortcuts()
})

// Watch for widget changes and save to history (debounced)
let saveTimeout: ReturnType<typeof setTimeout> | null = null
watch(widgets, () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveState()
  }, 500)
}, { deep: true })

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

// Select widget for configuration
function selectWidget(widgetId: string) {
  selectedWidgetId.value = selectedWidgetId.value === widgetId ? null : widgetId
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
    const widget = widgets.value[draggedWidgetIndex.value]
    widgets.value.splice(draggedWidgetIndex.value, 1)
    widgets.value.splice(index, 0, widget)
  }
  else if (draggedWidgetType.value) {
    addWidgetAtIndex(draggedWidgetType.value, index)
  }

  draggedWidgetType.value = null
  draggedWidgetIndex.value = null
  dragOverIndex.value = null
  isDraggingExisting.value = false
}

function handleCanvasDrop(event: DragEvent) {
  event.preventDefault()

  if (draggedWidgetType.value && !isDraggingExisting.value) {
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

// Resize handlers
function startResize(event: MouseEvent, widgetId: string, currentSize: string) {
  event.preventDefault()
  event.stopPropagation()
  isResizing.value = true
  resizingWidgetId.value = widgetId
  resizeStartX.value = event.clientX
  resizeStartSize.value = currentSize

  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', handleResizeEnd)
}

function handleResizeMove(event: MouseEvent) {
  if (!isResizing.value || !resizingWidgetId.value) return

  const deltaX = event.clientX - resizeStartX.value
  const widget = widgets.value.find(w => w.id === resizingWidgetId.value)
  if (!widget) return

  // Determine new size based on drag distance
  const threshold = 80
  let newSize = resizeStartSize.value

  if (resizeStartSize.value === 'small') {
    if (deltaX > threshold) newSize = 'medium'
    if (deltaX > threshold * 2.5) newSize = 'large'
  }
  else if (resizeStartSize.value === 'medium') {
    if (deltaX < -threshold) newSize = 'small'
    if (deltaX > threshold) newSize = 'large'
  }
  else if (resizeStartSize.value === 'large') {
    if (deltaX < -threshold) newSize = 'medium'
    if (deltaX < -threshold * 2.5) newSize = 'small'
  }

  if (widget.size !== newSize) {
    widget.size = newSize
  }
}

function handleResizeEnd() {
  isResizing.value = false
  resizingWidgetId.value = null
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
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
  selectedWidgetId.value = newWidget.id

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
  selectedWidgetId.value = newWidget.id

  await loadWidgetPreview(newWidget)
}

function removeWidget(id: string) {
  widgets.value = widgets.value.filter(w => w.id !== id)
  delete widgetPreviews.value[id]
  if (selectedWidgetId.value === id) {
    selectedWidgetId.value = null
  }
}

function duplicateWidget(widget: any) {
  const index = widgets.value.findIndex(w => w.id === widget.id)
  const newWidget = {
    ...JSON.parse(JSON.stringify(widget)),
    id: crypto.randomUUID(),
    title: `${widget.title} (copy)`,
  }
  widgets.value.splice(index + 1, 0, newWidget)
  selectedWidgetId.value = newWidget.id
  loadWidgetPreview(newWidget)
}

async function updateWidgetMetric(widget: any, metric: string) {
  widget.config.metric = metric
  await loadWidgetPreview(widget)
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
      body: { reportId: reportId.value },
    })

    if (response.success) {
      pdfSuccess.value = 'PDF generated!'
      await fetchReport(reportId.value)
      setTimeout(() => { pdfSuccess.value = '' }, 3000)
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

function getPreviewValue(widget: any) {
  const preview = widgetPreviews.value[widget.id]
  return preview?.value ?? null
}

function getPreviewPreviousValue(widget: any) {
  const preview = widgetPreviews.value[widget.id]
  return preview?.previousValue ?? null
}

function getPreviewChartData(widget: any) {
  const preview = widgetPreviews.value[widget.id]
  return preview?.data ?? []
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
      <div class="flex items-start justify-between mb-4">
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

        <div class="flex items-center gap-2">
          <!-- Undo/Redo buttons -->
          <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden mr-2">
            <button
              class="p-2 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="!canUndo"
              title="Undo (Ctrl+Z)"
              @click="undo"
            >
              <Icon
                name="heroicons:arrow-uturn-left"
                class="w-4 h-4"
              />
            </button>
            <button
              class="p-2 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed border-l border-gray-200"
              :disabled="!canRedo"
              title="Redo (Ctrl+Shift+Z)"
              @click="redo"
            >
              <Icon
                name="heroicons:arrow-uturn-right"
                class="w-4 h-4"
              />
            </button>
          </div>

          <!-- Edit/Preview toggle -->
          <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden mr-2">
            <button
              :class="[
                'px-3 py-2 text-sm flex items-center gap-1',
                editorMode === 'edit' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100',
              ]"
              @click="editorMode = 'edit'"
            >
              <Icon
                name="heroicons:pencil-square"
                class="w-4 h-4"
              />
              Edit
            </button>
            <button
              :class="[
                'px-3 py-2 text-sm flex items-center gap-1 border-l border-gray-200',
                editorMode === 'preview' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100',
              ]"
              @click="editorMode = 'preview'"
            >
              <Icon
                name="heroicons:eye"
                class="w-4 h-4"
              />
              Preview
            </button>
          </div>

          <span
            v-if="saveMessage"
            class="text-sm text-green-600 mr-2"
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
            Save
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
            PDF
          </button>
        </div>
      </div>

      <!-- Report info bar -->
      <div class="bg-white border border-gray-200 rounded-lg px-4 py-2 mb-4 flex items-center gap-6 text-sm">
        <div>
          <span class="text-gray-500">Date:</span>
          <span class="ml-1 font-medium">{{ formatDate(currentReport.dateRange.start) }} - {{ formatDate(currentReport.dateRange.end) }}</span>
        </div>
        <div>
          <span class="text-gray-500">Type:</span>
          <span class="ml-1 font-medium capitalize">{{ currentReport.type.toLowerCase() }}</span>
        </div>
        <div
          v-if="currentReport.pdfUrl"
          class="flex items-center gap-1"
        >
          <Icon
            name="heroicons:check-circle"
            class="w-4 h-4 text-green-500"
          />
          <a
            :href="currentReport.pdfUrl"
            target="_blank"
            class="text-tamarindo-600 hover:underline"
          >
            View PDF
          </a>
        </div>
      </div>

      <!-- Main content area -->
      <div class="flex gap-4">
        <!-- Left sidebar: Widget palette -->
        <div
          v-if="editorMode === 'edit'"
          class="w-56 flex-shrink-0"
        >
          <div class="bg-white border border-gray-200 rounded-lg p-3 sticky top-4">
            <h3 class="font-semibold text-gray-900 mb-2 text-sm">
              Widgets
            </h3>
            <div class="space-y-1">
              <button
                v-for="widget in widgetTypes"
                :key="widget.type"
                draggable="true"
                class="w-full p-2 text-left rounded-lg border border-gray-100 hover:border-tamarindo-300 hover:bg-tamarindo-50 transition-colors cursor-grab active:cursor-grabbing"
                @click="addWidget(widget.type)"
                @dragstart="handlePaletteDragStart($event, widget.type)"
                @dragend="handleDragEnd"
              >
                <div class="flex items-center gap-2">
                  <Icon
                    :name="widget.icon"
                    class="w-4 h-4 text-gray-500"
                  />
                  <span class="text-sm text-gray-900">{{ widget.label }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Center: Canvas -->
        <div class="flex-1 min-w-0">
          <!-- EDIT MODE -->
          <div
            v-if="editorMode === 'edit'"
            class="bg-gray-100 rounded-xl p-4 min-h-[600px]"
            @dragover.prevent
            @drop="handleCanvasDrop"
          >
            <!-- Empty state -->
            <div
              v-if="widgets.length === 0"
              class="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl"
            >
              <div class="text-center">
                <Icon
                  name="heroicons:squares-plus"
                  class="mx-auto h-12 w-12 text-gray-400"
                />
                <p class="mt-2 text-sm text-gray-500">
                  Drag widgets here or click to add
                </p>
              </div>
            </div>

            <!-- Grid Canvas -->
            <div
              v-else
              class="grid grid-cols-4 gap-3 auto-rows-min"
            >
              <template
                v-for="(widget, index) in widgets"
                :key="widget.id"
              >
                <!-- Drop zone indicator -->
                <div
                  v-if="dragOverIndex === index"
                  class="col-span-4 h-1 bg-tamarindo-400 rounded-full"
                />

                <!-- Widget Card -->
                <div
                  :class="[
                    'bg-white rounded-lg border-2 transition-all overflow-hidden relative group',
                    getWidgetGridClass(widget.size),
                    selectedWidgetId === widget.id ? 'border-tamarindo-500 shadow-lg' : 'border-gray-200 hover:border-gray-300',
                    draggedWidgetIndex === index ? 'opacity-50' : '',
                  ]"
                  draggable="true"
                  @click="selectWidget(widget.id)"
                  @dragstart="handleWidgetDragStart($event, index)"
                  @dragover="handleDragOver($event, index)"
                  @dragleave="handleDragLeave"
                  @drop="handleDrop($event, index)"
                  @dragend="handleDragEnd"
                >
                  <!-- Widget Header (minimal) -->
                  <div class="px-3 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div class="flex items-center gap-2 min-w-0">
                      <Icon
                        name="heroicons:bars-2"
                        class="w-3 h-3 text-gray-300 cursor-grab"
                      />
                      <Icon
                        :name="getWidgetIcon(widget.type)"
                        class="w-3 h-3 text-gray-400"
                      />
                      <span class="text-xs font-medium text-gray-700 truncate">{{ widget.title }}</span>
                    </div>
                    <button
                      class="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-opacity"
                      @click.stop="removeWidget(widget.id)"
                    >
                      <Icon
                        name="heroicons:x-mark"
                        class="w-3 h-3 text-gray-400 hover:text-red-600"
                      />
                    </button>
                  </div>

                  <!-- Widget Preview -->
                  <div class="p-3">
                    <!-- Metric Card -->
                    <div
                      v-if="widget.type === 'metric'"
                      class="text-center py-2"
                    >
                      <p class="text-xs text-gray-500 mb-1">
                        {{ getMetricLabel(widget.config?.metric || 'impressions') }}
                      </p>
                      <p
                        class="text-2xl font-bold"
                        :style="{ color: widget.config?.color || '#f97316' }"
                      >
                        {{ formatMetricValue(getPreviewValue(widget), getMetricFormatByValue(widget.config?.metric || 'impressions')) }}
                      </p>
                      <div
                        v-if="widget.config?.showComparison && getPreviewPreviousValue(widget)"
                        class="flex items-center justify-center gap-1 mt-1"
                      >
                        <Icon
                          :name="(getPreviewValue(widget) || 0) >= (getPreviewPreviousValue(widget) || 0) ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'"
                          :class="['w-3 h-3', (getPreviewValue(widget) || 0) >= (getPreviewPreviousValue(widget) || 0) ? 'text-green-500' : 'text-red-500']"
                        />
                        <span
                          :class="['text-xs', (getPreviewValue(widget) || 0) >= (getPreviewPreviousValue(widget) || 0) ? 'text-green-600' : 'text-red-600']"
                        >
                          {{ Math.abs(Math.round(((getPreviewValue(widget) || 0) - (getPreviewPreviousValue(widget) || 1)) / (getPreviewPreviousValue(widget) || 1) * 100)) }}%
                        </span>
                      </div>
                    </div>

                    <!-- Chart Preview -->
                    <div
                      v-else-if="['line-chart', 'bar-chart'].includes(widget.type)"
                      class="h-24"
                    >
                      <div
                        v-if="getPreviewChartData(widget).length > 0"
                        class="h-full"
                      >
                        <div
                          v-if="widget.type === 'bar-chart'"
                          class="flex items-end justify-around h-full gap-1 pb-4"
                        >
                          <div
                            v-for="(point, i) in getPreviewChartData(widget).slice(0, 7)"
                            :key="i"
                            class="flex-1 flex flex-col items-center"
                          >
                            <div
                              class="w-full rounded-t"
                              :style="{
                                backgroundColor: widget.config?.color || '#f97316',
                                height: `${Math.max(10, (point.value / Math.max(...getPreviewChartData(widget).map((p: any) => p.value))) * 100)}%`,
                              }"
                            />
                          </div>
                        </div>
                        <div
                          v-else
                          class="h-full"
                        >
                          <svg
                            class="w-full h-full"
                            viewBox="0 0 100 40"
                            preserveAspectRatio="none"
                          >
                            <polyline
                              fill="none"
                              :stroke="widget.config?.color || '#f97316'"
                              stroke-width="2"
                              :points="getPreviewChartData(widget).slice(0, 7).map((p: any, i: number) => {
                                const maxVal = Math.max(...getPreviewChartData(widget).map((d: any) => d.value))
                                const x = (i / Math.max(getPreviewChartData(widget).length - 1, 1)) * 100
                                const y = 40 - (p.value / maxVal) * 35
                                return `${x},${y}`
                              }).join(' ')"
                            />
                          </svg>
                        </div>
                      </div>
                      <div
                        v-else
                        class="h-full flex items-center justify-center"
                      >
                        <Icon
                          :name="getWidgetIcon(widget.type)"
                          class="w-6 h-6 text-gray-300"
                        />
                      </div>
                    </div>

                    <!-- Pie Chart -->
                    <div
                      v-else-if="widget.type === 'pie-chart'"
                      class="h-24 flex items-center justify-center"
                    >
                      <div
                        class="w-16 h-16 rounded-full"
                        :style="{ background: `conic-gradient(${widget.config?.color || '#f97316'} 0% 60%, #e5e7eb 60% 100%)` }"
                      />
                    </div>

                    <!-- Table -->
                    <div
                      v-else-if="widget.type === 'table'"
                      class="text-center py-4"
                    >
                      <Icon
                        name="heroicons:table-cells"
                        class="w-6 h-6 mx-auto text-gray-300"
                      />
                      <p class="text-xs text-gray-400 mt-1">
                        Data Table
                      </p>
                    </div>

                    <!-- Text -->
                    <div
                      v-else-if="widget.type === 'text'"
                      class="text-xs text-gray-600 line-clamp-3"
                    >
                      {{ widget.config?.content || 'Text content...' }}
                    </div>
                  </div>

                  <!-- Resize Handle -->
                  <div
                    class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
                    @mousedown="startResize($event, widget.id, widget.size)"
                  >
                    <svg
                      class="w-4 h-4 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
                    </svg>
                  </div>
                </div>
              </template>

              <!-- Drop zone at end -->
              <div
                v-if="draggedWidgetType || isDraggingExisting"
                class="col-span-4 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 transition-colors"
                :class="{ 'border-tamarindo-400 bg-tamarindo-50': dragOverIndex === widgets.length }"
                @dragover="handleDragOver($event, widgets.length)"
                @dragleave="handleDragLeave"
                @drop="handleDrop($event, widgets.length)"
              >
                <span class="text-sm">Drop here</span>
              </div>
            </div>
          </div>

          <!-- PREVIEW MODE -->
          <div
            v-else
            class="bg-white border border-gray-200 rounded-xl p-8 min-h-[600px]"
          >
            <div class="max-w-4xl mx-auto">
              <!-- Report Header -->
              <div class="text-center mb-8 pb-6 border-b border-gray-200">
                <h1 class="text-3xl font-bold text-gray-900">
                  {{ currentReport.name }}
                </h1>
                <p class="text-gray-500 mt-2">
                  {{ currentReport.client.name }} | {{ formatDate(currentReport.dateRange.start) }} - {{ formatDate(currentReport.dateRange.end) }}
                </p>
              </div>

              <!-- Widgets Grid -->
              <div class="grid grid-cols-4 gap-6">
                <div
                  v-for="widget in widgets"
                  :key="widget.id"
                  :class="[getWidgetGridClass(widget.size)]"
                >
                  <!-- Metric Card -->
                  <div
                    v-if="widget.type === 'metric'"
                    class="bg-gray-50 rounded-xl p-6 text-center"
                  >
                    <p class="text-sm text-gray-500 mb-2">
                      {{ widget.title }}
                    </p>
                    <p
                      class="text-4xl font-bold"
                      :style="{ color: widget.config?.color || '#f97316' }"
                    >
                      {{ formatMetricValue(getPreviewValue(widget), getMetricFormatByValue(widget.config?.metric || 'impressions')) }}
                    </p>
                    <div
                      v-if="widget.config?.showComparison && getPreviewPreviousValue(widget)"
                      class="flex items-center justify-center gap-2 mt-3"
                    >
                      <Icon
                        :name="(getPreviewValue(widget) || 0) >= (getPreviewPreviousValue(widget) || 0) ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'"
                        :class="['w-5 h-5', (getPreviewValue(widget) || 0) >= (getPreviewPreviousValue(widget) || 0) ? 'text-green-500' : 'text-red-500']"
                      />
                      <span
                        :class="['text-lg font-medium', (getPreviewValue(widget) || 0) >= (getPreviewPreviousValue(widget) || 0) ? 'text-green-600' : 'text-red-600']"
                      >
                        {{ Math.abs(Math.round(((getPreviewValue(widget) || 0) - (getPreviewPreviousValue(widget) || 1)) / (getPreviewPreviousValue(widget) || 1) * 100)) }}%
                      </span>
                      <span class="text-gray-400">vs previous period</span>
                    </div>
                  </div>

                  <!-- Charts -->
                  <div
                    v-else-if="['line-chart', 'bar-chart', 'pie-chart'].includes(widget.type)"
                    class="bg-gray-50 rounded-xl p-6"
                  >
                    <p class="text-sm font-medium text-gray-700 mb-4">
                      {{ widget.title }}
                    </p>
                    <div class="h-48">
                      <!-- Add full chart rendering here -->
                      <div
                        v-if="widget.type === 'bar-chart' && getPreviewChartData(widget).length > 0"
                        class="flex items-end justify-around h-full gap-2 pb-8"
                      >
                        <div
                          v-for="(point, i) in getPreviewChartData(widget)"
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
                          <span class="text-xs text-gray-500 mt-2">{{ point.label }}</span>
                        </div>
                      </div>
                      <div
                        v-else-if="widget.type === 'line-chart'"
                        class="h-full relative"
                      >
                        <svg
                          class="w-full h-full"
                          viewBox="0 0 100 60"
                          preserveAspectRatio="none"
                        >
                          <polyline
                            fill="none"
                            :stroke="widget.config?.color || '#f97316'"
                            stroke-width="2"
                            :points="getPreviewChartData(widget).map((p: any, i: number) => {
                              const maxVal = Math.max(...getPreviewChartData(widget).map((d: any) => d.value), 1)
                              const x = (i / Math.max(getPreviewChartData(widget).length - 1, 1)) * 100
                              const y = 55 - (p.value / maxVal) * 50
                              return `${x},${y}`
                            }).join(' ')"
                          />
                        </svg>
                      </div>
                      <div
                        v-else-if="widget.type === 'pie-chart'"
                        class="h-full flex items-center justify-center"
                      >
                        <div
                          class="w-32 h-32 rounded-full"
                          :style="{ background: `conic-gradient(${widget.config?.color || '#f97316'} 0% 60%, #e5e7eb 60% 100%)` }"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Table -->
                  <div
                    v-else-if="widget.type === 'table'"
                    class="bg-gray-50 rounded-xl p-6"
                  >
                    <p class="text-sm font-medium text-gray-700 mb-4">
                      {{ widget.title }}
                    </p>
                    <div class="text-center py-8 text-gray-400">
                      <Icon
                        name="heroicons:table-cells"
                        class="w-8 h-8 mx-auto mb-2"
                      />
                      <p class="text-sm">
                        Data table
                      </p>
                    </div>
                  </div>

                  <!-- Text -->
                  <div
                    v-else-if="widget.type === 'text'"
                    class="bg-gray-50 rounded-xl p-6"
                  >
                    <p class="text-gray-700 whitespace-pre-wrap">
                      {{ widget.config?.content || 'No content' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right sidebar: Configuration panel -->
        <div
          v-if="editorMode === 'edit' && selectedWidget"
          class="w-72 flex-shrink-0"
        >
          <div class="bg-white border border-gray-200 rounded-lg sticky top-4">
            <!-- Panel Header -->
            <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 class="font-semibold text-gray-900 text-sm">
                Configure Widget
              </h3>
              <button
                class="p-1 hover:bg-gray-100 rounded"
                @click="selectedWidgetId = null"
              >
                <Icon
                  name="heroicons:x-mark"
                  class="w-4 h-4 text-gray-400"
                />
              </button>
            </div>

            <div class="p-4 space-y-4">
              <!-- Title -->
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input
                  v-model="selectedWidget.title"
                  type="text"
                  class="input input-sm"
                >
              </div>

              <!-- Metric selector -->
              <div v-if="selectedWidget.type !== 'table' && selectedWidget.type !== 'text'">
                <label class="block text-xs font-medium text-gray-600 mb-1">Metric</label>
                <select
                  :value="selectedWidget.config.metric"
                  class="input input-sm"
                  @change="updateWidgetMetric(selectedWidget, ($event.target as HTMLSelectElement).value)"
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
              <div v-if="selectedWidget.type === 'text'">
                <label class="block text-xs font-medium text-gray-600 mb-1">Content</label>
                <textarea
                  v-model="selectedWidget.config.content"
                  class="input input-sm"
                  rows="4"
                  placeholder="Enter your text..."
                />
              </div>

              <!-- Size -->
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Size</label>
                <div class="grid grid-cols-3 gap-1">
                  <button
                    v-for="size in [{ value: 'small', label: '1 col' }, { value: 'medium', label: '2 col' }, { value: 'large', label: '4 col' }]"
                    :key="size.value"
                    :class="[
                      'px-2 py-1.5 text-xs rounded transition-colors',
                      selectedWidget.size === size.value
                        ? 'bg-tamarindo-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    ]"
                    @click="selectedWidget.size = size.value"
                  >
                    {{ size.label }}
                  </button>
                </div>
              </div>

              <!-- Color -->
              <div v-if="selectedWidget.type !== 'text' && selectedWidget.type !== 'table'">
                <label class="block text-xs font-medium text-gray-600 mb-1">Color</label>
                <div class="flex gap-2">
                  <button
                    v-for="color in ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b']"
                    :key="color"
                    :class="[
                      'w-7 h-7 rounded-full border-2 transition-all',
                      selectedWidget.config.color === color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105',
                    ]"
                    :style="{ backgroundColor: color }"
                    @click="selectedWidget.config.color = color"
                  />
                </div>
              </div>

              <!-- Comparison toggle -->
              <div v-if="selectedWidget.type === 'metric'">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="selectedWidget.config.showComparison"
                    type="checkbox"
                    class="rounded border-gray-300 text-tamarindo-600"
                  >
                  <span class="text-xs text-gray-600">Show comparison with previous period</span>
                </label>
              </div>

              <!-- Actions -->
              <div class="pt-4 border-t border-gray-200 space-y-2">
                <button
                  class="w-full btn-secondary text-sm justify-center"
                  @click="duplicateWidget(selectedWidget)"
                >
                  <Icon
                    name="heroicons:document-duplicate"
                    class="w-4 h-4 mr-2"
                  />
                  Duplicate
                </button>
                <button
                  class="w-full text-sm py-2 px-3 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center"
                  @click="removeWidget(selectedWidget.id)"
                >
                  <Icon
                    name="heroicons:trash"
                    class="w-4 h-4 mr-2"
                  />
                  Delete Widget
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
