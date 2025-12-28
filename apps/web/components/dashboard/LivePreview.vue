<script setup lang="ts">
import { computed } from 'vue'

interface Widget {
  id: string
  type: string
  title: string
  config: {
    metric?: string
    comparison?: string
    format?: 'number' | 'currency' | 'percent'
  }
  size: 'small' | 'medium' | 'large'
  slot?: 'hero' | 'alerts' | 'insight' | 'recommendation'
}

interface Branding {
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  clientName?: string
}

interface Props {
  widgets: Widget[]
  branding: Branding
  dashboardName: string
  editable?: boolean
  showHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
  showHeader: true,
})

const emit = defineEmits<{
  removeWidget: [widgetId: string]
  reorderWidgets: [fromIndex: number, toIndex: number]
  selectWidget: [widgetId: string]
}>()

// Drag state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function getWidgetIcon(type: string): string {
  const icons: Record<string, string> = {
    'metric': 'heroicons:presentation-chart-bar',
    'line-chart': 'heroicons:chart-bar',
    'bar-chart': 'heroicons:chart-bar-square',
    'pie-chart': 'heroicons:chart-pie',
    'table': 'heroicons:table-cells',
    'text': 'heroicons:document-text',
  }
  return icons[type] || 'heroicons:square-3-stack-3d'
}

function getWidgetGridClass(size: string): string {
  switch (size) {
    case 'large':
      return 'col-span-2'
    case 'small':
      return 'col-span-1'
    default:
      return 'col-span-1'
  }
}

// Seeded random for consistent mock values
function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash % 100) / 100
}

function getMockValue(widget: Widget): string {
  const seed = widget.id
  const rand = seededRandom(seed)
  const format = widget.config?.format

  if (format === 'currency') {
    const value = Math.floor(rand * 50000) + 1000
    return '$' + value.toLocaleString()
  }
  if (format === 'percent') {
    const value = (rand * 20 + 1).toFixed(1)
    return rand > 0.5 ? `${value}x` : `${value}%`
  }
  return Math.floor(rand * 10000).toLocaleString()
}

function getMockChange(widget: Widget): { value: number; isPositive: boolean } {
  const rand = seededRandom(widget.id + 'change')
  const value = Math.floor(rand * 25) + 1
  return { value, isPositive: rand > 0.4 }
}

const heroWidget = computed(() => props.widgets.find(w => w.slot === 'hero'))
const regularWidgets = computed(() => props.widgets.filter(w => w.slot !== 'hero'))

// Drag and drop handlers
function handleDragStart(index: number) {
  if (!props.editable) return
  draggedIndex.value = index
}

function handleDragOver(event: DragEvent, index: number) {
  if (!props.editable) return
  event.preventDefault()
  dragOverIndex.value = index
}

function handleDragLeave() {
  dragOverIndex.value = null
}

function handleDrop(index: number) {
  if (!props.editable || draggedIndex.value === null) return
  if (draggedIndex.value !== index) {
    emit('reorderWidgets', draggedIndex.value, index)
  }
  draggedIndex.value = null
  dragOverIndex.value = null
}

function handleDragEnd() {
  draggedIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div class="bg-gray-50 rounded-xl overflow-hidden h-full flex flex-col">
    <!-- Preview Header -->
    <div
      v-if="showHeader"
      class="px-4 py-3 border-b flex-shrink-0"
      :style="{ backgroundColor: branding.secondaryColor, borderColor: `${branding.secondaryColor}80` }"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            v-if="branding.logoUrl"
            class="w-8 h-8 rounded bg-white/20 flex items-center justify-center overflow-hidden"
          >
            <img
              :src="branding.logoUrl"
              alt=""
              class="max-w-full max-h-full object-contain"
            >
          </div>
          <div
            v-else
            class="w-8 h-8 rounded bg-white/20"
          />
          <div>
            <p class="text-sm font-medium text-white">
              {{ dashboardName || 'Untitled Dashboard' }}
            </p>
            <p class="text-xs text-white/70">
              {{ branding.clientName || 'Client' }}
            </p>
          </div>
        </div>
        <span class="text-xs text-white/50 px-2 py-1 rounded bg-white/10">
          Preview
        </span>
      </div>
    </div>

    <!-- Preview Content -->
    <div class="p-4 overflow-y-auto flex-1">
      <!-- Empty State -->
      <div
        v-if="widgets.length === 0"
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <Icon
          name="heroicons:chart-bar"
          class="w-12 h-12 text-gray-300 mb-3"
        />
        <p class="text-sm text-gray-500">
          No widgets yet
        </p>
        <p class="text-xs text-gray-400 mt-1">
          Add widgets to see the preview
        </p>
      </div>

      <template v-else>
        <!-- Hero Widget -->
        <div
          v-if="heroWidget"
          class="mb-4"
        >
          <div
            class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm transition-all"
            :class="{ 'ring-2 ring-blue-500': editable }"
            :style="{ borderLeftColor: branding.primaryColor, borderLeftWidth: '4px' }"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm text-gray-500 mb-1">
                  {{ heroWidget.title }}
                </p>
                <p
                  class="text-3xl font-bold"
                  :style="{ color: branding.secondaryColor }"
                >
                  {{ getMockValue(heroWidget) }}
                </p>
                <div class="flex items-center gap-1 mt-2">
                  <Icon
                    :name="getMockChange(heroWidget).isPositive ? 'heroicons:arrow-up' : 'heroicons:arrow-down'"
                    class="w-4 h-4"
                    :class="getMockChange(heroWidget).isPositive ? 'text-green-500' : 'text-red-500'"
                  />
                  <span
                    class="text-sm font-medium"
                    :class="getMockChange(heroWidget).isPositive ? 'text-green-600' : 'text-red-600'"
                  >
                    {{ getMockChange(heroWidget).value }}%
                  </span>
                  <span class="text-sm text-gray-500">vs last period</span>
                </div>
              </div>
              <button
                v-if="editable"
                type="button"
                class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove widget"
                @click="emit('removeWidget', heroWidget.id)"
              >
                <Icon
                  name="heroicons:x-mark"
                  class="w-4 h-4"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Regular Widgets Grid -->
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="(widget, index) in regularWidgets"
            :key="widget.id"
            class="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm group transition-all"
            :class="[
              getWidgetGridClass(widget.size),
              {
                'opacity-50': draggedIndex === index,
                'ring-2 ring-blue-400': dragOverIndex === index,
                'cursor-move': editable,
              },
            ]"
            :draggable="editable"
            @dragstart="handleDragStart(index)"
            @dragover="handleDragOver($event, index)"
            @dragleave="handleDragLeave"
            @drop="handleDrop(index)"
            @dragend="handleDragEnd"
          >
            <!-- Widget Header -->
            <div class="px-3 py-2 border-b border-gray-50 flex items-center justify-between">
              <div class="flex items-center gap-2 min-w-0">
                <Icon
                  v-if="editable"
                  name="heroicons:bars-2"
                  class="w-3 h-3 text-gray-300 flex-shrink-0"
                />
                <Icon
                  :name="getWidgetIcon(widget.type)"
                  class="w-4 h-4 text-gray-400 flex-shrink-0"
                />
                <span class="text-xs font-medium text-gray-600 truncate">
                  {{ widget.title }}
                </span>
              </div>
              <button
                v-if="editable"
                type="button"
                class="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                title="Remove"
                @click="emit('removeWidget', widget.id)"
              >
                <Icon
                  name="heroicons:x-mark"
                  class="w-3 h-3"
                />
              </button>
            </div>

            <!-- Widget Content -->
            <div class="p-3">
              <!-- Metric Widget -->
              <template v-if="widget.type === 'metric'">
                <p
                  class="text-xl font-bold"
                  :style="{ color: branding.secondaryColor }"
                >
                  {{ getMockValue(widget) }}
                </p>
                <div class="flex items-center gap-1 mt-1">
                  <span
                    class="text-xs font-medium"
                    :class="getMockChange(widget).isPositive ? 'text-green-600' : 'text-red-600'"
                  >
                    {{ getMockChange(widget).isPositive ? '+' : '-' }}{{ getMockChange(widget).value }}%
                  </span>
                </div>
              </template>

              <!-- Line Chart Widget -->
              <template v-else-if="widget.type === 'line-chart'">
                <div class="h-16 flex items-end gap-0.5">
                  <svg
                    class="w-full h-full"
                    viewBox="0 0 100 40"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,30 Q10,25 20,28 T40,20 T60,25 T80,15 T100,10"
                      fill="none"
                      :stroke="branding.primaryColor"
                      stroke-width="2"
                    />
                    <path
                      d="M0,30 Q10,25 20,28 T40,20 T60,25 T80,15 T100,10 L100,40 L0,40 Z"
                      :fill="`${branding.primaryColor}20`"
                    />
                  </svg>
                </div>
              </template>

              <!-- Bar Chart Widget -->
              <template v-else-if="widget.type === 'bar-chart'">
                <div class="h-16 flex items-end justify-around gap-1">
                  <div
                    v-for="(height, i) in [60, 80, 45, 90, 70]"
                    :key="i"
                    class="flex-1 rounded-t transition-all"
                    :style="{
                      height: `${height}%`,
                      backgroundColor: i === 3 ? branding.primaryColor : `${branding.primaryColor}40`,
                    }"
                  />
                </div>
              </template>

              <!-- Pie Chart Widget -->
              <template v-else-if="widget.type === 'pie-chart'">
                <div class="h-16 flex items-center justify-center">
                  <svg
                    class="w-14 h-14"
                    viewBox="0 0 32 32"
                  >
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      :stroke="`${branding.primaryColor}30`"
                      stroke-width="4"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      :stroke="branding.primaryColor"
                      stroke-width="4"
                      stroke-dasharray="55 88"
                      stroke-linecap="round"
                      transform="rotate(-90 16 16)"
                    />
                  </svg>
                </div>
              </template>

              <!-- Table Widget -->
              <template v-else-if="widget.type === 'table'">
                <div class="space-y-1.5">
                  <div
                    v-for="i in 3"
                    :key="i"
                    class="flex items-center justify-between"
                  >
                    <div
                      class="h-2 rounded"
                      :style="{
                        width: `${40 + seededRandom(widget.id + i) * 30}%`,
                        backgroundColor: branding.primaryColor + '30',
                      }"
                    />
                    <div class="h-2 w-8 rounded bg-gray-200" />
                  </div>
                </div>
              </template>

              <!-- Text Widget -->
              <template v-else>
                <div class="space-y-1">
                  <div class="h-2 w-full rounded bg-gray-200" />
                  <div class="h-2 w-3/4 rounded bg-gray-100" />
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Widget Count -->
        <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>{{ widgets.length }} widget{{ widgets.length !== 1 ? 's' : '' }}</span>
          <span v-if="editable">Drag to reorder</span>
        </div>
      </template>
    </div>
  </div>
</template>
