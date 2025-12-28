<script setup lang="ts">
import { ref, computed } from 'vue'

interface Widget {
  id: string
  type: string
  title: string
  config: Record<string, any>
  size: 'small' | 'medium' | 'large'
  slot?: 'hero' | 'alerts' | 'insight' | 'recommendation'
}

interface WidgetType {
  type: string
  label: string
  icon: string
  description: string
}

interface Props {
  widgets: Widget[]
  widgetTypes: WidgetType[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'add': [type: string]
  'remove': [id: string]
  'update': [widget: Widget]
  'reorder': [fromIndex: number, toIndex: number]
}>()

const isCollapsed = ref(false)
const showAddMenu = ref(false)

// Drag state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const heroWidget = computed(() => props.widgets.find(w => w.slot === 'hero'))
const regularWidgets = computed(() => props.widgets.filter(w => w.slot !== 'hero'))

function getWidgetIcon(type: string): string {
  return props.widgetTypes.find(w => w.type === type)?.icon || 'heroicons:square-3-stack-3d'
}

function handleAddWidget(type: string) {
  emit('add', type)
  showAddMenu.value = false
}

function handleUpdateTitle(widget: Widget, event: Event) {
  const newTitle = (event.target as HTMLInputElement).value
  emit('update', { ...widget, title: newTitle })
}

function handleUpdateSize(widget: Widget, size: 'small' | 'medium' | 'large') {
  emit('update', { ...widget, size })
}

// Drag handlers
function handleDragStart(event: DragEvent, index: number) {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function handleDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverIndex.value = index
}

function handleDragLeave() {
  dragOverIndex.value = null
}

function handleDrop(index: number) {
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    emit('reorder', draggedIndex.value, index)
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
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Panel Header -->
    <button
      type="button"
      class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      @click="isCollapsed = !isCollapsed"
    >
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <Icon
            name="heroicons:squares-plus"
            class="w-4 h-4 text-gray-600"
          />
        </div>
        <div class="text-left">
          <h3 class="text-sm font-medium text-gray-900">
            Widgets
          </h3>
          <p class="text-xs text-gray-500">
            {{ widgets.length }} widget{{ widgets.length !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>
      <Icon
        :name="isCollapsed ? 'heroicons:chevron-down' : 'heroicons:chevron-up'"
        class="w-5 h-5 text-gray-400"
      />
    </button>

    <!-- Panel Content -->
    <div
      v-show="!isCollapsed"
      class="px-4 pb-4 border-t border-gray-100"
    >
      <!-- Add Widget Button -->
      <div class="pt-4 relative">
        <button
          type="button"
          class="w-full btn-secondary justify-center"
          @click="showAddMenu = !showAddMenu"
        >
          <Icon
            name="heroicons:plus"
            class="w-4 h-4 mr-2"
          />
          Add Widget
        </button>

        <!-- Add Widget Dropdown -->
        <div
          v-if="showAddMenu"
          class="absolute left-0 right-0 top-full mt-2 bg-white rounded-lg border border-gray-200 shadow-lg z-10 py-1"
        >
          <button
            v-for="widgetType in widgetTypes"
            :key="widgetType.type"
            type="button"
            class="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
            @click="handleAddWidget(widgetType.type)"
          >
            <Icon
              :name="widgetType.icon"
              class="w-4 h-4 text-gray-500"
            />
            <div>
              <p class="text-sm font-medium text-gray-900">
                {{ widgetType.label }}
              </p>
              <p class="text-xs text-gray-500">
                {{ widgetType.description }}
              </p>
            </div>
          </button>
        </div>
      </div>

      <!-- Click outside to close -->
      <div
        v-if="showAddMenu"
        class="fixed inset-0 z-0"
        @click="showAddMenu = false"
      />

      <!-- Hero Widget (if exists) -->
      <div
        v-if="heroWidget"
        class="mt-4"
      >
        <p class="text-xs text-gray-500 uppercase tracking-wide mb-2">
          Hero
        </p>
        <div class="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <Icon
                :name="getWidgetIcon(heroWidget.type)"
                class="w-4 h-4 text-blue-600 flex-shrink-0"
              />
              <input
                type="text"
                :value="heroWidget.title"
                class="text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 min-w-0 flex-1"
                @input="handleUpdateTitle(heroWidget, $event)"
              >
            </div>
            <button
              type="button"
              class="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
              title="Remove"
              @click="emit('remove', heroWidget.id)"
            >
              <Icon
                name="heroicons:x-mark"
                class="w-4 h-4"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Regular Widgets List -->
      <div
        v-if="regularWidgets.length > 0"
        class="mt-4 space-y-2"
      >
        <p class="text-xs text-gray-500 uppercase tracking-wide mb-2">
          Widgets
        </p>

        <div
          v-for="(widget, index) in regularWidgets"
          :key="widget.id"
          class="group p-3 rounded-lg border bg-white transition-all cursor-move"
          :class="[
            dragOverIndex === index ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300',
            draggedIndex === index ? 'opacity-50' : '',
          ]"
          draggable="true"
          @dragstart="handleDragStart($event, index)"
          @dragover="handleDragOver($event, index)"
          @dragleave="handleDragLeave"
          @drop="handleDrop(index)"
          @dragend="handleDragEnd"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <Icon
                name="heroicons:bars-2"
                class="w-3 h-3 text-gray-300 flex-shrink-0"
              />
              <Icon
                :name="getWidgetIcon(widget.type)"
                class="w-4 h-4 text-gray-500 flex-shrink-0"
              />
              <input
                type="text"
                :value="widget.title"
                class="text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 min-w-0 flex-1"
                @input="handleUpdateTitle(widget, $event)"
              >
            </div>
            <button
              type="button"
              class="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              title="Remove"
              @click="emit('remove', widget.id)"
            >
              <Icon
                name="heroicons:x-mark"
                class="w-4 h-4"
              />
            </button>
          </div>

          <!-- Size selector -->
          <div class="mt-2 flex items-center gap-1">
            <button
              v-for="size in (['small', 'medium', 'large'] as const)"
              :key="size"
              type="button"
              class="px-2 py-0.5 text-xs rounded transition-colors"
              :class="[
                widget.size === size
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ]"
              @click="handleUpdateSize(widget, size)"
            >
              {{ size.charAt(0).toUpperCase() }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="widgets.length === 0"
        class="mt-4 py-6 text-center"
      >
        <Icon
          name="heroicons:squares-plus"
          class="w-8 h-8 text-gray-300 mx-auto"
        />
        <p class="mt-2 text-sm text-gray-500">
          No widgets yet
        </p>
        <p class="text-xs text-gray-400">
          Click "Add Widget" to get started
        </p>
      </div>
    </div>
  </div>
</template>
