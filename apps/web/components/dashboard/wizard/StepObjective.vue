<script setup lang="ts">
import type { DashboardObjective, ObjectiveConfig } from '../../../types/dashboard-wizard'

interface Props {
  selectedObjective: DashboardObjective | null
  objectives: ObjectiveConfig[]
}

defineProps<Props>()
const emit = defineEmits<{
  select: [objective: DashboardObjective]
}>()

function handleSelect(objective: DashboardObjective) {
  emit('select', objective)
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center max-w-xl mx-auto">
      <h2 class="text-xl font-semibold text-gray-900">
        What's your primary goal?
      </h2>
      <p class="mt-2 text-gray-600">
        Select the objective that best describes what you want to track. This will customize the metrics and layout for your needs.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
      <button
        v-for="objective in objectives"
        :key="objective.id"
        type="button"
        class="relative p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
        :class="[
          selectedObjective === objective.id
            ? 'border-current shadow-lg scale-[1.02]'
            : 'border-gray-200 hover:border-gray-300',
        ]"
        :style="selectedObjective === objective.id ? { borderColor: objective.color, '--ring-color': objective.color } : {}"
        @click="handleSelect(objective.id)"
      >
        <!-- Selection indicator -->
        <div
          v-if="selectedObjective === objective.id"
          class="absolute top-3 right-3"
        >
          <div
            class="w-6 h-6 rounded-full flex items-center justify-center"
            :style="{ backgroundColor: objective.color }"
          >
            <Icon
              name="heroicons:check"
              class="w-4 h-4 text-white"
            />
          </div>
        </div>

        <!-- Icon -->
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          :style="{ backgroundColor: `${objective.color}15` }"
        >
          <Icon
            :name="objective.icon"
            class="w-6 h-6"
            :style="{ color: objective.color }"
          />
        </div>

        <!-- Content -->
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          {{ objective.label }}
        </h3>
        <p class="text-sm text-gray-600 leading-relaxed">
          {{ objective.description }}
        </p>

        <!-- Metrics preview -->
        <div class="mt-4 flex flex-wrap gap-1.5">
          <span
            v-for="metric in objective.metrics.slice(0, 3)"
            :key="metric"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
          >
            {{ metric }}
          </span>
          <span
            v-if="objective.metrics.length > 3"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500"
          >
            +{{ objective.metrics.length - 3 }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>
