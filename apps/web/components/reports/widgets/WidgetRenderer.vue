<script setup lang="ts">
import { computed } from 'vue'

interface Widget {
  id: string
  type: string
  title: string
  config: Record<string, any>
  size: 'small' | 'medium' | 'large'
  data?: any
}

interface RCAContext {
  clientName: string
  industry?: string
  platform: string
  dateRange: { start: string; end: string }
}

interface Props {
  widget: Widget
  editable?: boolean
  loading?: boolean
  /** Context for RCA analysis on metric widgets */
  rcaContext?: RCAContext
  /** Show insight button on metric widgets */
  showInsightButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
  loading: false,
  showInsightButton: true,
})

const emit = defineEmits<{
  (e: 'update', widget: Widget): void
}>()

const sizeClasses = computed(() => {
  switch (props.widget.size) {
    case 'small': return 'col-span-1'
    case 'large': return 'col-span-3'
    default: return 'col-span-2'
  }
})

function updateWidget(updates: Partial<Widget>) {
  emit('update', { ...props.widget, ...updates })
}
</script>

<template>
  <div :class="sizeClasses">
    <!-- Metric widget -->
    <WidgetMetric
      v-if="widget.type === 'metric'"
      :title="widget.title"
      :value="widget.data?.value"
      :previous-value="widget.data?.previousValue"
      :format="widget.config.format"
      :loading="loading"
      :metric-key="widget.config.metric"
      :rca-context="rcaContext"
      :show-insight-button="showInsightButton"
    />

    <!-- Line chart -->
    <WidgetChart
      v-else-if="widget.type === 'line-chart'"
      :title="widget.title"
      type="line"
      :data="widget.data"
      :loading="loading"
    />

    <!-- Bar chart -->
    <WidgetChart
      v-else-if="widget.type === 'bar-chart'"
      :title="widget.title"
      type="bar"
      :data="widget.data"
      :loading="loading"
    />

    <!-- Pie chart -->
    <WidgetChart
      v-else-if="widget.type === 'pie-chart'"
      :title="widget.title"
      type="pie"
      :data="widget.data"
      :loading="loading"
    />

    <!-- Table -->
    <WidgetTable
      v-else-if="widget.type === 'table'"
      :title="widget.title"
      :columns="widget.config.columns"
      :rows="widget.data"
      :loading="loading"
    />

    <!-- Text -->
    <WidgetText
      v-else-if="widget.type === 'text'"
      :title="widget.title"
      :content="widget.config.content"
      :editable="editable"
      @update:content="updateWidget({ config: { ...widget.config, content: $event } })"
    />

    <!-- Unknown widget type -->
    <div
      v-else
      class="bg-gray-100 rounded-lg p-4 text-center text-gray-500"
    >
      Unknown widget type: {{ widget.type }}
    </div>
  </div>
</template>
