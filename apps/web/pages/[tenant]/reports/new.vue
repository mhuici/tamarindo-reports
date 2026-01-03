<script setup lang="ts">
import { REPORT_TEMPLATES, TEMPLATE_CATEGORIES, getTemplateById } from '~/data/report-templates'
import type { ReportTemplate } from '~/data/report-templates'

definePageMeta({
  layout: 'dashboard',
  title: 'New Report',
  middleware: ['tenant'],
})

const route = useRoute()
const router = useRouter()
const tenant = computed(() => route.params.tenant as string)

const { clients, fetchClients } = useClients()
const { createReport } = useReports()

// Current step: 1 = template, 2 = details
const currentStep = ref(1)

// Selected template
const selectedTemplateId = ref<string | null>(null)
const selectedTemplate = computed(() =>
  selectedTemplateId.value ? getTemplateById(selectedTemplateId.value) : null
)

// Filter templates
const selectedCategory = ref<string | null>(null)
const searchQuery = ref('')

const filteredTemplates = computed(() => {
  let templates = REPORT_TEMPLATES

  if (selectedCategory.value) {
    templates = templates.filter(t => t.category === selectedCategory.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    templates = templates.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  return templates
})

// Form state
const form = reactive({
  name: '',
  clientId: '',
  type: 'CUSTOM' as 'MONTHLY' | 'WEEKLY' | 'CAMPAIGN' | 'CUSTOM',
  dateRange: {
    start: '',
    end: '',
  },
})

const isSubmitting = ref(false)
const errorMessage = ref('')

// Fetch clients on mount
onMounted(async () => {
  await fetchClients()

  // Set default date range (last 30 days)
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  form.dateRange.start = start.toISOString().split('T')[0] || ''
  form.dateRange.end = end.toISOString().split('T')[0] || ''
})

// Select template and go to step 2
function selectTemplate(template: ReportTemplate) {
  selectedTemplateId.value = template.id

  // Pre-fill name based on template
  if (!form.name && template.id !== 'blank') {
    form.name = `${template.name} - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
  }

  // Map template category to report type
  if (template.category === 'campaign') {
    form.type = 'CAMPAIGN'
  } else if (template.id === 'monthly-overview') {
    form.type = 'MONTHLY'
  } else {
    form.type = 'CUSTOM'
  }

  currentStep.value = 2
}

// Go back to template selection
function goBackToTemplates() {
  currentStep.value = 1
}

// Validation
const isValid = computed(() => {
  return (
    form.name.trim() !== ''
    && form.clientId !== ''
    && form.dateRange.start !== ''
    && form.dateRange.end !== ''
    && selectedTemplateId.value !== null
  )
})

async function handleSubmit() {
  if (!isValid.value || isSubmitting.value || !selectedTemplate.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    // Generate widget IDs for the template widgets
    const widgets = selectedTemplate.value.widgets.map(w => ({
      ...w,
      id: crypto.randomUUID(),
      config: { ...w.config },
    }))

    const result = await createReport({
      name: form.name,
      clientId: form.clientId,
      type: form.type,
      dateRange: form.dateRange,
      widgets,
    })

    if (result.success && result.report) {
      router.push(`/${tenant.value}/reports/${result.report.id}`)
    }
    else {
      errorMessage.value = result.error || 'Failed to create report'
    }
  }
  catch (e) {
    errorMessage.value = 'An unexpected error occurred'
  }
  finally {
    isSubmitting.value = false
  }
}

// Quick date range presets
function setDatePreset(preset: string) {
  const end = new Date()
  const start = new Date()

  switch (preset) {
    case 'last7':
      start.setDate(start.getDate() - 7)
      break
    case 'last30':
      start.setDate(start.getDate() - 30)
      break
    case 'last90':
      start.setDate(start.getDate() - 90)
      break
    case 'thisMonth':
      start.setDate(1)
      break
    case 'lastMonth':
      start.setMonth(start.getMonth() - 1)
      start.setDate(1)
      end.setDate(0)
      break
  }

  form.dateRange.start = start.toISOString().split('T')[0] || ''
  form.dateRange.end = end.toISOString().split('T')[0] || ''
}

function getCategoryIcon(categoryId: string) {
  return TEMPLATE_CATEGORIES.find(c => c.id === categoryId)?.icon || 'heroicons:squares-plus'
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
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
        Create New Report
      </h1>
      <p class="text-gray-600 mt-1">
        {{ currentStep === 1 ? 'Choose a template to get started quickly' : 'Configure your report details' }}
      </p>
    </div>

    <!-- Step indicator -->
    <div class="flex items-center gap-4 mb-8">
      <div class="flex items-center gap-2">
        <div
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
            currentStep >= 1 ? 'bg-tamarindo-500 text-white' : 'bg-gray-200 text-gray-500',
          ]"
        >
          1
        </div>
        <span :class="currentStep >= 1 ? 'text-gray-900 font-medium' : 'text-gray-500'">
          Choose Template
        </span>
      </div>
      <div class="flex-1 h-0.5 bg-gray-200">
        <div
          class="h-full bg-tamarindo-500 transition-all"
          :style="{ width: currentStep >= 2 ? '100%' : '0%' }"
        />
      </div>
      <div class="flex items-center gap-2">
        <div
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
            currentStep >= 2 ? 'bg-tamarindo-500 text-white' : 'bg-gray-200 text-gray-500',
          ]"
        >
          2
        </div>
        <span :class="currentStep >= 2 ? 'text-gray-900 font-medium' : 'text-gray-500'">
          Configure
        </span>
      </div>
    </div>

    <!-- Error message -->
    <div
      v-if="errorMessage"
      class="alert alert-error mb-6"
    >
      <Icon
        name="heroicons:exclamation-circle"
        class="w-5 h-5"
      />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- STEP 1: Template Selection -->
    <div v-if="currentStep === 1">
      <!-- Search and filters -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="flex-1">
          <div class="relative">
            <Icon
              name="heroicons:magnifying-glass"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search templates..."
              class="input pl-10"
            >
          </div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button
            :class="[
              'px-3 py-2 text-sm rounded-lg transition-colors',
              selectedCategory === null
                ? 'bg-tamarindo-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ]"
            @click="selectedCategory = null"
          >
            All
          </button>
          <button
            v-for="category in TEMPLATE_CATEGORIES"
            :key="category.id"
            :class="[
              'px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-1',
              selectedCategory === category.id
                ? 'bg-tamarindo-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ]"
            @click="selectedCategory = category.id"
          >
            <Icon
              :name="category.icon"
              class="w-4 h-4"
            />
            {{ category.label }}
          </button>
        </div>
      </div>

      <!-- Template grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          v-for="template in filteredTemplates"
          :key="template.id"
          class="card p-4 text-left hover:border-tamarindo-300 hover:shadow-md transition-all group"
          @click="selectTemplate(template)"
        >
          <div class="flex items-start gap-3">
            <div
              :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                template.id === 'blank' ? 'bg-gray-100' : 'bg-tamarindo-100',
              ]"
            >
              <Icon
                :name="template.icon"
                :class="[
                  'w-5 h-5',
                  template.id === 'blank' ? 'text-gray-500' : 'text-tamarindo-600',
                ]"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 group-hover:text-tamarindo-600 transition-colors">
                {{ template.name }}
              </h3>
              <p class="text-sm text-gray-500 mt-1 line-clamp-2">
                {{ template.description }}
              </p>
              <div class="flex items-center gap-2 mt-3">
                <span class="text-xs text-gray-400">
                  {{ template.widgets.length }} widget{{ template.widgets.length !== 1 ? 's' : '' }}
                </span>
                <span class="text-gray-300">|</span>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="tag in template.tags.slice(0, 2)"
                    :key="tag"
                    class="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>

      <!-- No results -->
      <div
        v-if="filteredTemplates.length === 0"
        class="text-center py-12"
      >
        <Icon
          name="heroicons:document-magnifying-glass"
          class="w-12 h-12 text-gray-300 mx-auto"
        />
        <p class="text-gray-500 mt-2">
          No templates found
        </p>
        <button
          class="text-tamarindo-600 hover:underline mt-1"
          @click="searchQuery = ''; selectedCategory = null"
        >
          Clear filters
        </button>
      </div>
    </div>

    <!-- STEP 2: Report Details -->
    <div v-else>
      <!-- Selected template preview -->
      <div
        v-if="selectedTemplate"
        class="card card-body mb-6"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-tamarindo-100 flex items-center justify-center">
              <Icon
                :name="selectedTemplate.icon"
                class="w-5 h-5 text-tamarindo-600"
              />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">
                {{ selectedTemplate.name }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ selectedTemplate.widgets.length }} pre-configured widgets
              </p>
            </div>
          </div>
          <button
            class="text-sm text-tamarindo-600 hover:underline"
            @click="goBackToTemplates"
          >
            Change template
          </button>
        </div>

        <!-- Widget preview -->
        <div
          v-if="selectedTemplate.widgets.length > 0"
          class="mt-4 pt-4 border-t border-gray-100"
        >
          <p class="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Included Widgets
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(widget, index) in selectedTemplate.widgets.slice(0, 6)"
              :key="index"
              class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded flex items-center gap-1"
            >
              <Icon
                :name="widget.type === 'metric' ? 'heroicons:presentation-chart-bar' :
                       widget.type === 'line-chart' ? 'heroicons:chart-bar' :
                       widget.type === 'bar-chart' ? 'heroicons:chart-bar-square' :
                       widget.type === 'pie-chart' ? 'heroicons:chart-pie' :
                       widget.type === 'table' ? 'heroicons:table-cells' :
                       'heroicons:document-text'"
                class="w-3 h-3"
              />
              {{ widget.title }}
            </span>
            <span
              v-if="selectedTemplate.widgets.length > 6"
              class="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded"
            >
              +{{ selectedTemplate.widgets.length - 6 }} more
            </span>
          </div>
        </div>
      </div>

      <form
        class="space-y-6"
        @submit.prevent="handleSubmit"
      >
        <!-- Report Details -->
        <div class="card card-body">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            Report Details
          </h2>

          <div class="space-y-4">
            <div>
              <label
                for="name"
                class="label"
              >Report Name</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                class="input"
                placeholder="e.g., December 2024 Performance Report"
                required
              >
            </div>

            <div>
              <label
                for="client"
                class="label"
              >Client</label>
              <select
                id="client"
                v-model="form.clientId"
                class="select"
                required
              >
                <option
                  value=""
                  disabled
                >
                  Select a client
                </option>
                <option
                  v-for="client in clients"
                  :key="client.id"
                  :value="client.id"
                >
                  {{ client.name }}
                </option>
              </select>
              <p
                v-if="clients.length === 0"
                class="text-sm text-gray-500 mt-1"
              >
                No clients found.
                <NuxtLink
                  :to="`/${tenant}/clients`"
                  class="text-tamarindo-600 hover:underline"
                >
                  Create a client first
                </NuxtLink>
              </p>
            </div>
          </div>
        </div>

        <!-- Date Range -->
        <div class="card card-body">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            Date Range
          </h2>

          <!-- Quick presets -->
          <div class="flex flex-wrap gap-2 mb-4">
            <button
              v-for="preset in [
                { id: 'last7', label: 'Last 7 days' },
                { id: 'last30', label: 'Last 30 days' },
                { id: 'last90', label: 'Last 90 days' },
                { id: 'thisMonth', label: 'This month' },
                { id: 'lastMonth', label: 'Last month' },
              ]"
              :key="preset.id"
              type="button"
              class="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              @click="setDatePreset(preset.id)"
            >
              {{ preset.label }}
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                for="start"
                class="label"
              >Start Date</label>
              <input
                id="start"
                v-model="form.dateRange.start"
                type="date"
                class="input"
                required
              >
            </div>
            <div>
              <label
                for="end"
                class="label"
              >End Date</label>
              <input
                id="end"
                v-model="form.dateRange.end"
                type="date"
                class="input"
                required
              >
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between">
          <button
            type="button"
            class="btn-secondary"
            @click="goBackToTemplates"
          >
            <Icon
              name="heroicons:arrow-left"
              class="w-4 h-4 mr-2"
            />
            Back
          </button>
          <div class="flex items-center gap-3">
            <NuxtLink
              :to="`/${tenant}/reports`"
              class="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </NuxtLink>
            <button
              type="submit"
              :disabled="!isValid || isSubmitting"
              class="btn-primary"
            >
              <Icon
                v-if="isSubmitting"
                name="heroicons:arrow-path"
                class="w-5 h-5 mr-2 animate-spin"
              />
              <Icon
                v-else
                name="heroicons:plus"
                class="w-5 h-5 mr-2"
              />
              {{ isSubmitting ? 'Creating...' : 'Create Report' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
