<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Reports',
  middleware: ['tenant'],
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)

const { reports, isLoading, fetchReports, deleteReport, duplicateReport } = useReports()

// Duplicate state
const isDuplicating = ref<string | null>(null)

// Filters
const filterType = ref('all')
const filterStatus = ref('all')

// Fetch reports on mount
onMounted(() => {
  fetchReports()
})

const filteredReports = computed(() => {
  let result = reports.value

  if (filterType.value !== 'all') {
    result = result.filter(r => r.type === filterType.value)
  }

  if (filterStatus.value !== 'all') {
    result = result.filter(r => r.status === filterStatus.value)
  }

  return result
})

async function handleDelete(report: any) {
  if (!confirm(`Are you sure you want to delete "${report.name}"?`)) {
    return
  }

  const result = await deleteReport(report.id)
  if (!result.success) {
    alert(result.error || 'Failed to delete report')
  }
}

async function handleDuplicate(report: any) {
  isDuplicating.value = report.id

  const result = await duplicateReport(report.id)

  if (result.success && result.report) {
    // Navigate to the new report
    navigateTo(`/${tenant.value}/reports/${result.report.id}`)
  }
  else {
    alert(result.error || 'Failed to duplicate report')
  }

  isDuplicating.value = null
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

function getTypeLabel(type: string) {
  switch (type) {
    case 'MONTHLY': return 'Monthly'
    case 'WEEKLY': return 'Weekly'
    case 'CAMPAIGN': return 'Campaign'
    case 'CUSTOM': return 'Custom'
    default: return type
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Reports
        </h1>
        <p class="text-gray-600">
          Create and manage reports for your clients.
        </p>
      </div>
      <NuxtLink
        :to="`/${tenant}/reports/new`"
        class="btn-primary"
      >
        <Icon
          name="heroicons:plus"
          class="w-5 h-5 mr-2"
        />
        Create Report
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <div class="flex gap-2">
        <button
          v-for="t in ['all', 'MONTHLY', 'WEEKLY', 'CAMPAIGN', 'CUSTOM']"
          :key="t"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filterType === t
              ? 'bg-tamarindo-100 text-tamarindo-700'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200',
          ]"
          @click="filterType = t"
        >
          {{ t === 'all' ? 'All Types' : getTypeLabel(t) }}
        </button>
      </div>

      <div class="flex gap-2">
        <button
          v-for="s in ['all', 'DRAFT', 'COMPLETED', 'SCHEDULED']"
          :key="s"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filterStatus === s
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200',
          ]"
          @click="filterStatus = s"
        >
          {{ s === 'all' ? 'All Status' : s.charAt(0) + s.slice(1).toLowerCase() }}
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="card card-body animate-pulse"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 rounded-lg bg-gray-200" />
          <div class="w-20 h-6 bg-gray-200 rounded" />
        </div>
        <div class="h-5 bg-gray-200 rounded w-3/4 mb-2" />
        <div class="h-4 bg-gray-100 rounded w-1/2" />
      </div>
    </div>

    <!-- Reports grid -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="report in filteredReports"
        :key="report.id"
        class="card hover:border-tamarindo-300 transition-colors group"
      >
        <div class="card-body">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Icon
                name="heroicons:document-chart-bar"
                class="w-5 h-5 text-gray-500"
              />
            </div>
            <div class="flex items-center gap-2">
              <span :class="['badge', getStatusColor(report.status)]">
                {{ report.status.toLowerCase() }}
              </span>
              <button
                class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-tamarindo-600"
                title="Duplicate"
                :disabled="isDuplicating === report.id"
                @click.stop="handleDuplicate(report)"
              >
                <Icon
                  v-if="isDuplicating === report.id"
                  name="heroicons:arrow-path"
                  class="w-4 h-4 animate-spin"
                />
                <Icon
                  v-else
                  name="heroicons:document-duplicate"
                  class="w-4 h-4"
                />
              </button>
              <button
                class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
                title="Delete"
                @click.stop="handleDelete(report)"
              >
                <Icon
                  name="heroicons:trash"
                  class="w-4 h-4"
                />
              </button>
            </div>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1">
            {{ report.name }}
          </h3>
          <p class="text-sm text-gray-500 mb-1">
            {{ report.client.name }}
          </p>
          <p class="text-xs text-gray-400 mb-3">
            {{ getTypeLabel(report.type) }}
          </p>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">{{ formatDate(report.createdAt) }}</span>
            <NuxtLink
              :to="`/${tenant}/reports/${report.id}`"
              class="text-tamarindo-600 hover:text-tamarindo-500 font-medium"
            >
              {{ report.status === 'DRAFT' ? 'Edit' : 'View' }} →
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="filteredReports.length === 0 && !isLoading"
        class="col-span-full text-center py-12"
      >
        <Icon
          name="heroicons:document-chart-bar"
          class="mx-auto h-12 w-12 text-gray-400"
        />
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          No reports found
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          Get started by creating your first report.
        </p>
        <NuxtLink
          :to="`/${tenant}/reports/new`"
          class="btn-primary mt-4 inline-flex"
        >
          <Icon
            name="heroicons:plus"
            class="w-5 h-5 mr-2"
          />
          Create Report
        </NuxtLink>
      </div>

      <!-- Create new card -->
      <NuxtLink
        v-if="filteredReports.length > 0"
        :to="`/${tenant}/reports/new`"
        class="card card-body border-dashed hover:border-tamarindo-300 hover:bg-tamarindo-50/50 transition-colors flex flex-col items-center justify-center text-center min-h-[200px]"
      >
        <div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
          <Icon
            name="heroicons:plus"
            class="w-6 h-6 text-gray-400"
          />
        </div>
        <p class="font-medium text-gray-600">
          Create New Report
        </p>
        <p class="text-sm text-gray-500 mt-1">
          Build a custom report
        </p>
      </NuxtLink>
    </div>
  </div>
</template>
