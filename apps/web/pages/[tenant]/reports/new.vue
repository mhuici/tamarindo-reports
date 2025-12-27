<script setup lang="ts">
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

// Form state
const form = reactive({
  name: '',
  clientId: '',
  type: 'MONTHLY' as 'MONTHLY' | 'WEEKLY' | 'CAMPAIGN' | 'CUSTOM',
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

  form.dateRange.start = start.toISOString().split('T')[0]
  form.dateRange.end = end.toISOString().split('T')[0]
})

// Report types
const reportTypes = [
  { value: 'MONTHLY', label: 'Monthly Report', description: 'Standard monthly performance overview' },
  { value: 'WEEKLY', label: 'Weekly Report', description: 'Quick weekly metrics summary' },
  { value: 'CAMPAIGN', label: 'Campaign Report', description: 'Focused on specific campaign results' },
  { value: 'CUSTOM', label: 'Custom Report', description: 'Build your own custom report' },
]

// Validation
const isValid = computed(() => {
  return (
    form.name.trim() !== ''
    && form.clientId !== ''
    && form.dateRange.start !== ''
    && form.dateRange.end !== ''
  )
})

async function handleSubmit() {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const result = await createReport({
      name: form.name,
      clientId: form.clientId,
      type: form.type,
      dateRange: form.dateRange,
      widgets: [], // Will be added in next step
    })

    if (result.success && result.report) {
      // Navigate to report editor
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
      end.setDate(0) // Last day of previous month
      break
  }

  form.dateRange.start = start.toISOString().split('T')[0]
  form.dateRange.end = end.toISOString().split('T')[0]
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
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
        Configure your report settings and choose the data to include.
      </p>
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

    <form
      class="space-y-8"
      @submit.prevent="handleSubmit"
    >
      <!-- Report Name -->
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

      <!-- Report Type -->
      <div class="card card-body">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Report Type
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            v-for="type in reportTypes"
            :key="type.value"
            type="button"
            :class="[
              'p-4 rounded-lg border-2 text-left transition-all',
              form.type === type.value
                ? 'border-tamarindo-500 bg-tamarindo-50'
                : 'border-gray-200 hover:border-gray-300',
            ]"
            @click="form.type = type.value as any"
          >
            <div class="flex items-start gap-3">
              <div
                :class="[
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5',
                  form.type === type.value
                    ? 'border-tamarindo-500 bg-tamarindo-500'
                    : 'border-gray-300',
                ]"
              >
                <div
                  v-if="form.type === type.value"
                  class="w-2 h-2 rounded-full bg-white"
                />
              </div>
              <div>
                <p class="font-medium text-gray-900">
                  {{ type.label }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ type.description }}
                </p>
              </div>
            </div>
          </button>
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
            type="button"
            class="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            @click="setDatePreset('last7')"
          >
            Last 7 days
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            @click="setDatePreset('last30')"
          >
            Last 30 days
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            @click="setDatePreset('last90')"
          >
            Last 90 days
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            @click="setDatePreset('thisMonth')"
          >
            This month
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            @click="setDatePreset('lastMonth')"
          >
            Last month
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
      <div class="flex items-center justify-end gap-4">
        <NuxtLink
          :to="`/${tenant}/reports`"
          class="btn-secondary"
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
    </form>
  </div>
</template>
