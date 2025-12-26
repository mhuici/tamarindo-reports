<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Dashboard',
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)
const { user } = useAuth()

// Mock data for demo
const stats = [
  { name: 'Total Clients', value: '12', change: '+2', changeType: 'positive' },
  { name: 'Reports Generated', value: '48', change: '+12', changeType: 'positive' },
  { name: 'Active Integrations', value: '3', change: '0', changeType: 'neutral' },
  { name: 'AI Insights', value: '156', change: '+34', changeType: 'positive' },
]

const recentReports = [
  { id: '1', client: 'Acme Corp', type: 'Monthly Report', date: '2024-12-20', status: 'completed' },
  { id: '2', client: 'TechStart', type: 'Weekly Report', date: '2024-12-19', status: 'completed' },
  { id: '3', client: 'GrowthCo', type: 'Campaign Report', date: '2024-12-18', status: 'pending' },
]
</script>

<template>
  <div>
    <!-- Welcome header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Welcome back, {{ user?.name?.split(' ')[0] || 'User' }}!
      </h1>
      <p class="text-gray-600">
        Here's what's happening with your agency today.
      </p>
    </div>

    <!-- Stats grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div
        v-for="stat in stats"
        :key="stat.name"
        class="card card-body"
      >
        <p class="text-sm font-medium text-gray-500">
          {{ stat.name }}
        </p>
        <div class="flex items-baseline gap-2 mt-1">
          <p class="text-3xl font-semibold text-gray-900">
            {{ stat.value }}
          </p>
          <span
            :class="[
              'text-sm font-medium',
              stat.changeType === 'positive' ? 'text-green-600' : '',
              stat.changeType === 'negative' ? 'text-red-600' : '',
              stat.changeType === 'neutral' ? 'text-gray-500' : '',
            ]"
          >
            {{ stat.change }}
          </span>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <NuxtLink
        :to="`/${tenant}/reports/new`"
        class="card card-body hover:border-tamarindo-300 transition-colors group"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-tamarindo-100 flex items-center justify-center group-hover:bg-tamarindo-200 transition-colors">
            <Icon
              name="heroicons:document-plus"
              class="w-6 h-6 text-tamarindo-600"
            />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">
              Create Report
            </h3>
            <p class="text-sm text-gray-500">
              Generate a new report
            </p>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink
        :to="`/${tenant}/clients`"
        class="card card-body hover:border-tamarindo-300 transition-colors group"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <Icon
              name="heroicons:user-plus"
              class="w-6 h-6 text-blue-600"
            />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">
              Add Client
            </h3>
            <p class="text-sm text-gray-500">
              Add a new client
            </p>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink
        :to="`/${tenant}/integrations`"
        class="card card-body hover:border-tamarindo-300 transition-colors group"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
            <Icon
              name="heroicons:puzzle-piece"
              class="w-6 h-6 text-purple-600"
            />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">
              Connect Platform
            </h3>
            <p class="text-sm text-gray-500">
              Add Google or Facebook Ads
            </p>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Recent reports -->
    <div class="card">
      <div class="card-header flex items-center justify-between">
        <h2 class="font-semibold text-gray-900">
          Recent Reports
        </h2>
        <NuxtLink
          :to="`/${tenant}/reports`"
          class="text-sm text-tamarindo-600 hover:text-tamarindo-500"
        >
          View all
        </NuxtLink>
      </div>
      <div class="divide-y divide-gray-200">
        <div
          v-for="report in recentReports"
          :key="report.id"
          class="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Icon
                name="heroicons:document-chart-bar"
                class="w-5 h-5 text-gray-500"
              />
            </div>
            <div>
              <p class="font-medium text-gray-900">
                {{ report.client }}
              </p>
              <p class="text-sm text-gray-500">
                {{ report.type }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-500">{{ report.date }}</span>
            <span
              :class="[
                'badge',
                report.status === 'completed' ? 'badge-success' : 'badge-warning',
              ]"
            >
              {{ report.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
