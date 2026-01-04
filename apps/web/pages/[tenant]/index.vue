<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Dashboard',
  middleware: ['tenant'],
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)
const { user } = useAuth()

// State
const isLoading = ref(true)
const stats = ref<any>(null)
const activities = ref<any[]>([])
const clientsOverview = ref<any[]>([])

// Fetch all dashboard data
async function fetchDashboardData() {
  isLoading.value = true

  try {
    const [statsRes, activityRes, clientsRes] = await Promise.all([
      $fetch<{ success: boolean; stats: any }>('/api/dashboard/stats'),
      $fetch<{ success: boolean; activities: any[] }>('/api/dashboard/activity?limit=8'),
      $fetch<{ success: boolean; clients: any[] }>('/api/dashboard/clients-overview?limit=10'),
    ])

    if (statsRes.success) stats.value = statsRes.stats
    if (activityRes.success) activities.value = activityRes.activities
    if (clientsRes.success) clientsOverview.value = clientsRes.clients
  }
  catch (e) {
    console.error('Failed to fetch dashboard data:', e)
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})

// Activity icons and colors
function getActivityIcon(type: string) {
  switch (type) {
    case 'report_created': return 'heroicons:document-plus'
    case 'report_shared': return 'heroicons:share'
    case 'email_sent': return 'heroicons:envelope'
    case 'pdf_generated': return 'heroicons:document-arrow-down'
    case 'client_added': return 'heroicons:user-plus'
    default: return 'heroicons:bell'
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'report_created': return 'bg-tamarindo-100 text-tamarindo-600'
    case 'report_shared': return 'bg-blue-100 text-blue-600'
    case 'email_sent': return 'bg-green-100 text-green-600'
    case 'pdf_generated': return 'bg-purple-100 text-purple-600'
    case 'client_added': return 'bg-yellow-100 text-yellow-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function formatTimeAgo(date: string) {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Chart max value for scaling
const chartMaxValue = computed(() => {
  if (!stats.value?.monthlyTrend) return 10
  const max = Math.max(...stats.value.monthlyTrend.map((d: any) => d.reports))
  return Math.max(max, 1)
})
</script>

<template>
  <div>
    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-20"
    >
      <Icon
        name="heroicons:arrow-path"
        class="w-8 h-8 animate-spin text-gray-400"
      />
    </div>

    <template v-else>
      <!-- Welcome header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">
          Welcome back, {{ user?.name?.split(' ')[0] || 'User' }}!
        </h1>
        <p class="text-gray-600">
          Here's what's happening with your agency today.
        </p>
      </div>

      <!-- Main KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total Clients -->
        <div class="card card-body">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">
                Total Clients
              </p>
              <p class="text-3xl font-semibold text-gray-900 mt-1">
                {{ stats?.totalClients || 0 }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Icon
                name="heroicons:users"
                class="w-6 h-6 text-blue-600"
              />
            </div>
          </div>
          <div class="mt-3 flex items-center text-sm">
            <span
              :class="[
                'font-medium',
                (stats?.clientsChange || 0) > 0 ? 'text-green-600' : (stats?.clientsChange || 0) < 0 ? 'text-red-600' : 'text-gray-500',
              ]"
            >
              {{ (stats?.clientsChange || 0) > 0 ? '+' : '' }}{{ stats?.clientsChange || 0 }}
            </span>
            <span class="text-gray-400 ml-1">this month</span>
          </div>
        </div>

        <!-- Reports This Month -->
        <div class="card card-body">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">
                Reports This Month
              </p>
              <p class="text-3xl font-semibold text-gray-900 mt-1">
                {{ stats?.reportsThisMonth || 0 }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-full bg-tamarindo-100 flex items-center justify-center">
              <Icon
                name="heroicons:document-chart-bar"
                class="w-6 h-6 text-tamarindo-600"
              />
            </div>
          </div>
          <div class="mt-3 flex items-center text-sm">
            <span
              :class="[
                'font-medium',
                (stats?.reportsChangePercent || 0) > 0 ? 'text-green-600' : (stats?.reportsChangePercent || 0) < 0 ? 'text-red-600' : 'text-gray-500',
              ]"
            >
              {{ (stats?.reportsChangePercent || 0) > 0 ? '+' : '' }}{{ stats?.reportsChangePercent || 0 }}%
            </span>
            <span class="text-gray-400 ml-1">vs last month</span>
          </div>
        </div>

        <!-- Emails Sent -->
        <div class="card card-body">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">
                Emails Sent
              </p>
              <p class="text-3xl font-semibold text-gray-900 mt-1">
                {{ stats?.emailsSent || 0 }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Icon
                name="heroicons:envelope"
                class="w-6 h-6 text-green-600"
              />
            </div>
          </div>
          <div class="mt-3 flex items-center text-sm">
            <span class="font-medium text-gray-600">{{ stats?.scheduledReports || 0 }}</span>
            <span class="text-gray-400 ml-1">scheduled active</span>
          </div>
        </div>

        <!-- Integrations -->
        <div class="card card-body">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">
                Integrations
              </p>
              <p class="text-3xl font-semibold text-gray-900 mt-1">
                {{ stats?.activeIntegrations || 0 }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Icon
                name="heroicons:puzzle-piece"
                class="w-6 h-6 text-purple-600"
              />
            </div>
          </div>
          <div class="mt-3 flex items-center text-sm">
            <span class="font-medium text-gray-600">{{ stats?.publicReports || 0 }}</span>
            <span class="text-gray-400 ml-1">reports shared</span>
          </div>
        </div>
      </div>

      <!-- Two column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Reports Trend Chart -->
        <div class="lg:col-span-2 card">
          <div class="card-header">
            <h2 class="font-semibold text-gray-900">
              Reports Created
            </h2>
            <p class="text-sm text-gray-500">
              Last 6 months
            </p>
          </div>
          <div class="card-body">
            <div
              v-if="stats?.monthlyTrend?.length"
              class="h-48"
            >
              <!-- Simple bar chart -->
              <div class="flex items-end justify-between h-full gap-4 pb-8 relative">
                <!-- Y-axis labels -->
                <div class="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-400">
                  <span>{{ chartMaxValue }}</span>
                  <span>{{ Math.floor(chartMaxValue / 2) }}</span>
                  <span>0</span>
                </div>

                <!-- Bars -->
                <div class="flex items-end justify-around flex-1 h-full ml-10 gap-2">
                  <div
                    v-for="(item, index) in stats.monthlyTrend"
                    :key="index"
                    class="flex-1 flex flex-col items-center"
                  >
                    <div
                      class="w-full bg-tamarindo-500 rounded-t-lg transition-all hover:bg-tamarindo-600"
                      :style="{
                        height: `${Math.max((item.reports / chartMaxValue) * 100, 2)}%`,
                        minHeight: item.reports > 0 ? '8px' : '2px',
                      }"
                    />
                    <span class="text-xs text-gray-500 mt-2">{{ item.month }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else
              class="h-48 flex items-center justify-center text-gray-400"
            >
              <div class="text-center">
                <Icon
                  name="heroicons:chart-bar"
                  class="w-12 h-12 mx-auto mb-2"
                />
                <p>No data yet</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card">
          <div class="card-header flex items-center justify-between">
            <h2 class="font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div class="divide-y divide-gray-100 max-h-[280px] overflow-y-auto">
            <div
              v-for="activity in activities"
              :key="activity.id"
              class="px-4 py-3 flex items-start gap-3"
            >
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  getActivityColor(activity.type),
                ]"
              >
                <Icon
                  :name="getActivityIcon(activity.type)"
                  class="w-4 h-4"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ activity.title }}
                </p>
                <p class="text-xs text-gray-500 truncate">
                  {{ activity.description }}
                </p>
              </div>
              <span class="text-xs text-gray-400 flex-shrink-0">
                {{ formatTimeAgo(activity.timestamp) }}
              </span>
            </div>
            <div
              v-if="activities.length === 0"
              class="px-4 py-8 text-center text-gray-400"
            >
              <Icon
                name="heroicons:clock"
                class="w-8 h-8 mx-auto mb-2"
              />
              <p class="text-sm">No recent activity</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                Add Google or Meta Ads
              </p>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Clients Overview -->
      <div class="card">
        <div class="card-header flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-gray-900">
              Clients Overview
            </h2>
            <p class="text-sm text-gray-500">
              {{ stats?.clientsWithReports || 0 }} of {{ stats?.totalClients || 0 }} clients have reports
            </p>
          </div>
          <NuxtLink
            :to="`/${tenant}/clients`"
            class="text-sm text-tamarindo-600 hover:text-tamarindo-500"
          >
            View all
          </NuxtLink>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Reports
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  This Month
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Report
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="client in clientsOverview"
                :key="client.id"
                class="hover:bg-gray-50"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span class="text-sm font-medium text-gray-600">
                        {{ client.name.charAt(0).toUpperCase() }}
                      </span>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{{ client.name }}</p>
                      <p class="text-sm text-gray-500">{{ client.email || 'No email' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-gray-900 font-medium">{{ client.totalReports }}</span>
                </td>
                <td class="px-6 py-4">
                  <span
                    :class="[
                      'font-medium',
                      client.reportsThisMonth > 0 ? 'text-green-600' : 'text-gray-400',
                    ]"
                  >
                    {{ client.reportsThisMonth }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <template v-if="client.lastReport">
                    <p class="text-sm text-gray-900">{{ client.lastReport.name }}</p>
                    <p class="text-xs text-gray-500">{{ formatDate(client.lastReport.createdAt) }}</p>
                  </template>
                  <span
                    v-else
                    class="text-sm text-gray-400"
                  >No reports yet</span>
                </td>
                <td class="px-6 py-4">
                  <span
                    :class="[
                      'badge',
                      client.status === 'active' ? 'badge-success' : 'badge-warning',
                    ]"
                  >
                    {{ client.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <NuxtLink
                    :to="`/${tenant}/reports/new?client=${client.id}`"
                    class="text-tamarindo-600 hover:text-tamarindo-500 text-sm font-medium"
                  >
                    New Report
                  </NuxtLink>
                </td>
              </tr>
              <tr v-if="clientsOverview.length === 0">
                <td
                  colspan="6"
                  class="px-6 py-12 text-center text-gray-400"
                >
                  <Icon
                    name="heroicons:users"
                    class="w-12 h-12 mx-auto mb-2"
                  />
                  <p>No clients yet</p>
                  <NuxtLink
                    :to="`/${tenant}/clients`"
                    class="text-tamarindo-600 hover:text-tamarindo-500 text-sm mt-2 inline-block"
                  >
                    Add your first client
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Secondary Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div class="bg-gray-50 rounded-lg p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">{{ stats?.totalReports || 0 }}</p>
          <p class="text-sm text-gray-500">Total Reports</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">{{ stats?.reportsWithPDF || 0 }}</p>
          <p class="text-sm text-gray-500">PDFs Generated</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">{{ stats?.publicReports || 0 }}</p>
          <p class="text-sm text-gray-500">Shared Reports</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">{{ stats?.scheduledReports || 0 }}</p>
          <p class="text-sm text-gray-500">Scheduled</p>
        </div>
      </div>
    </template>
  </div>
</template>
