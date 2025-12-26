<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Reports',
  middleware: ['tenant'],
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)

// Mock data
const reports = ref([
  { id: '1', name: 'December Monthly Report', client: 'Acme Corp', type: 'monthly', createdAt: '2024-12-20', status: 'completed' },
  { id: '2', name: 'Week 51 Report', client: 'TechStart', type: 'weekly', createdAt: '2024-12-19', status: 'completed' },
  { id: '3', name: 'Campaign Analysis', client: 'GrowthCo', type: 'campaign', createdAt: '2024-12-18', status: 'generating' },
  { id: '4', name: 'Q4 Overview', client: 'Acme Corp', type: 'quarterly', createdAt: '2024-12-15', status: 'scheduled' },
])

const filterType = ref('all')

const filteredReports = computed(() => {
  if (filterType.value === 'all')
    return reports.value
  return reports.value.filter(r => r.type === filterType.value)
})
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
    <div class="flex gap-2 mb-6">
      <button
        :class="['px-4 py-2 rounded-lg text-sm font-medium transition-colors', filterType === 'all' ? 'bg-tamarindo-100 text-tamarindo-700' : 'bg-white text-gray-600 hover:bg-gray-100']"
        @click="filterType = 'all'"
      >
        All
      </button>
      <button
        :class="['px-4 py-2 rounded-lg text-sm font-medium transition-colors', filterType === 'monthly' ? 'bg-tamarindo-100 text-tamarindo-700' : 'bg-white text-gray-600 hover:bg-gray-100']"
        @click="filterType = 'monthly'"
      >
        Monthly
      </button>
      <button
        :class="['px-4 py-2 rounded-lg text-sm font-medium transition-colors', filterType === 'weekly' ? 'bg-tamarindo-100 text-tamarindo-700' : 'bg-white text-gray-600 hover:bg-gray-100']"
        @click="filterType = 'weekly'"
      >
        Weekly
      </button>
      <button
        :class="['px-4 py-2 rounded-lg text-sm font-medium transition-colors', filterType === 'campaign' ? 'bg-tamarindo-100 text-tamarindo-700' : 'bg-white text-gray-600 hover:bg-gray-100']"
        @click="filterType = 'campaign'"
      >
        Campaign
      </button>
    </div>

    <!-- Reports grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="report in filteredReports"
        :key="report.id"
        class="card hover:border-tamarindo-300 transition-colors"
      >
        <div class="card-body">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Icon
                name="heroicons:document-chart-bar"
                class="w-5 h-5 text-gray-500"
              />
            </div>
            <span
              :class="[
                'badge',
                report.status === 'completed' ? 'badge-success' : '',
                report.status === 'generating' ? 'badge-warning' : '',
                report.status === 'scheduled' ? 'badge-info' : '',
              ]"
            >
              {{ report.status }}
            </span>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1">
            {{ report.name }}
          </h3>
          <p class="text-sm text-gray-500 mb-3">
            {{ report.client }}
          </p>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">{{ report.createdAt }}</span>
            <NuxtLink
              :to="`/${tenant}/reports/${report.id}`"
              class="text-tamarindo-600 hover:text-tamarindo-500 font-medium"
            >
              View →
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Create new card -->
      <NuxtLink
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
