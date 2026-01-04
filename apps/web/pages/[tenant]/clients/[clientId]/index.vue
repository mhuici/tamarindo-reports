<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Client Details',
  middleware: ['tenant'],
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)
const clientId = computed(() => route.params.clientId as string)

// Tabs
const tabs = [
  { id: 'overview', label: 'Overview', icon: 'heroicons:building-office' },
  { id: 'data-sources', label: 'Data Sources', icon: 'heroicons:server-stack' },
  { id: 'reports', label: 'Reports', icon: 'heroicons:document-chart-bar' },
]
const activeTab = ref('overview')

// Client data
const client = ref<any>(null)
const isLoading = ref(true)
const error = ref('')

// Data sources
const assignedAccounts = ref<any[]>([])
const availableAccounts = ref<any[]>([])
const isLoadingDataSources = ref(false)
const isAssigning = ref(false)

// Reports
const reports = ref<any[]>([])
const isLoadingReports = ref(false)

// Fetch client details
async function fetchClient() {
  isLoading.value = true
  error.value = ''

  try {
    const response = await $fetch<{ client: any }>(`/api/clients/${clientId.value}`)
    client.value = response.client
  }
  catch (e: any) {
    error.value = e.data?.message || 'Failed to load client'
  }
  finally {
    isLoading.value = false
  }
}

// Fetch data sources
async function fetchDataSources() {
  isLoadingDataSources.value = true

  try {
    const response = await $fetch<{
      assignedAccounts: any[]
      availableAccounts: any[]
    }>(`/api/clients/${clientId.value}/data-sources`)

    assignedAccounts.value = response.assignedAccounts
    availableAccounts.value = response.availableAccounts
  }
  catch (e: any) {
    console.error('Failed to fetch data sources:', e)
  }
  finally {
    isLoadingDataSources.value = false
  }
}

// Fetch client reports
async function fetchReports() {
  isLoadingReports.value = true

  try {
    const response = await $fetch<{ reports: any[] }>(`/api/reports?clientId=${clientId.value}`)
    reports.value = response.reports
  }
  catch (e: any) {
    console.error('Failed to fetch reports:', e)
  }
  finally {
    isLoadingReports.value = false
  }
}

// Assign account to client
async function assignAccount(platformAccountId: string) {
  isAssigning.value = true

  try {
    await $fetch(`/api/clients/${clientId.value}/data-sources`, {
      method: 'POST',
      body: { platformAccountId },
    })
    await fetchDataSources()
  }
  catch (e: any) {
    alert(e.data?.message || 'Failed to assign account')
  }
  finally {
    isAssigning.value = false
  }
}

// Remove account from client
async function removeAccount(accountId: string) {
  if (!confirm('Remove this data source from the client?')) return

  try {
    await $fetch(`/api/clients/${clientId.value}/data-sources/${accountId}`, {
      method: 'DELETE',
    })
    await fetchDataSources()
  }
  catch (e: any) {
    alert(e.data?.message || 'Failed to remove account')
  }
}

// Get platform icon
function getPlatformIcon(type: string) {
  const icons: Record<string, string> = {
    FACEBOOK_ADS: 'logos:facebook',
    GOOGLE_ADS: 'logos:google-ads',
    GOOGLE_ANALYTICS: 'logos:google-analytics',
    TIKTOK_ADS: 'logos:tiktok-icon',
    LINKEDIN_ADS: 'logos:linkedin-icon',
  }
  return icons[type] || 'heroicons:globe-alt'
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatRelativeTime(dateString: string | null) {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// Initialize
onMounted(() => {
  fetchClient()
  fetchDataSources()
  fetchReports()
})

// Watch tab changes to refresh data
watch(activeTab, (tab: string) => {
  if (tab === 'data-sources') {
    fetchDataSources()
  }
  else if (tab === 'reports') {
    fetchReports()
  }
})
</script>

<template>
  <div>
    <!-- Back link -->
    <NuxtLink
      :to="`/${tenant}/clients`"
      class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
    >
      <Icon name="heroicons:arrow-left" class="w-4 h-4 mr-1" />
      Back to Clients
    </NuxtLink>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="card p-12 text-center"
    >
      <Icon
        name="heroicons:arrow-path"
        class="w-8 h-8 text-gray-400 animate-spin mx-auto"
      />
      <p class="mt-2 text-gray-500">
        Loading client...
      </p>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="card p-12 text-center"
    >
      <Icon
        name="heroicons:exclamation-circle"
        class="w-12 h-12 text-red-400 mx-auto"
      />
      <h3 class="mt-2 text-lg font-medium text-gray-900">
        Client not found
      </h3>
      <p class="mt-1 text-gray-500">
        {{ error }}
      </p>
      <NuxtLink
        :to="`/${tenant}/clients`"
        class="btn-primary mt-4 inline-flex"
      >
        Back to Clients
      </NuxtLink>
    </div>

    <!-- Client details -->
    <template v-else-if="client">
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-xl bg-tamarindo-100 flex items-center justify-center">
            <span class="text-2xl font-bold text-tamarindo-700">
              {{ client.name.charAt(0).toUpperCase() }}
            </span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ client.name }}
            </h1>
            <div class="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span v-if="client.industry">
                <Icon name="heroicons:building-storefront" class="w-4 h-4 inline mr-1" />
                {{ client.industry }}
              </span>
              <span v-if="client.email">
                <Icon name="heroicons:envelope" class="w-4 h-4 inline mr-1" />
                {{ client.email }}
              </span>
            </div>
          </div>
        </div>
        <span
          :class="[
            'badge',
            client.isActive ? 'badge-success' : 'badge-warning',
          ]"
        >
          {{ client.isActive ? 'Active' : 'Inactive' }}
        </span>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="[
              'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === tab.id
                ? 'border-tamarindo-500 text-tamarindo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
            @click="activeTab = tab.id"
          >
            <Icon
              :name="tab.icon"
              :class="[
                'w-5 h-5 mr-2',
                activeTab === tab.id ? 'text-tamarindo-500' : 'text-gray-400 group-hover:text-gray-500'
              ]"
            />
            {{ tab.label }}
            <span
              v-if="tab.id === 'data-sources' && assignedAccounts.length > 0"
              class="ml-2 px-2 py-0.5 rounded-full text-xs bg-tamarindo-100 text-tamarindo-700"
            >
              {{ assignedAccounts.length }}
            </span>
            <span
              v-if="tab.id === 'reports' && reports.length > 0"
              class="ml-2 px-2 py-0.5 rounded-full text-xs bg-tamarindo-100 text-tamarindo-700"
            >
              {{ reports.length }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Client Info -->
        <div class="lg:col-span-2 card card-body">
          <h3 class="font-semibold text-gray-900 mb-4">
            Client Information
          </h3>
          <dl class="grid grid-cols-2 gap-4">
            <div>
              <dt class="text-sm text-gray-500">Name</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ client.name }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Industry</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ client.industry || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Email</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ client.email || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Phone</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ client.phone || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Website</dt>
              <dd class="mt-1 text-sm text-gray-900">
                <a
                  v-if="client.website"
                  :href="client.website"
                  target="_blank"
                  class="text-tamarindo-600 hover:underline"
                >
                  {{ client.website }}
                </a>
                <span v-else>-</span>
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Created</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ formatDate(client.createdAt) }}</dd>
            </div>
            <div class="col-span-2">
              <dt class="text-sm text-gray-500">Notes</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ client.notes || 'No notes' }}</dd>
            </div>
          </dl>
        </div>

        <!-- Quick Stats -->
        <div class="space-y-4">
          <div class="card card-body">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Icon name="heroicons:server-stack" class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ assignedAccounts.length }}</p>
                <p class="text-sm text-gray-500">Data Sources</p>
              </div>
            </div>
          </div>
          <div class="card card-body">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Icon name="heroicons:document-chart-bar" class="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ reports.length }}</p>
                <p class="text-sm text-gray-500">Reports</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Sources Tab -->
      <div v-else-if="activeTab === 'data-sources'">
        <!-- Loading -->
        <div
          v-if="isLoadingDataSources"
          class="card p-12 text-center"
        >
          <Icon
            name="heroicons:arrow-path"
            class="w-8 h-8 text-gray-400 animate-spin mx-auto"
          />
          <p class="mt-2 text-gray-500">
            Loading data sources...
          </p>
        </div>

        <template v-else>
          <!-- Assigned Accounts -->
          <div class="mb-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Assigned Data Sources
            </h3>
            <div
              v-if="assignedAccounts.length > 0"
              class="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div
                v-for="account in assignedAccounts"
                :key="account.id"
                class="card card-body"
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Icon :name="getPlatformIcon(account.dataSource.type)" class="w-6 h-6" />
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{{ account.name }}</p>
                      <p class="text-xs text-gray-500">
                        {{ account.dataSource.name }} &middot; ID: {{ account.platformId }}
                      </p>
                    </div>
                  </div>
                  <button
                    class="text-red-600 hover:text-red-800"
                    title="Remove"
                    @click="removeAccount(account.id)"
                  >
                    <Icon name="heroicons:x-mark" class="w-5 h-5" />
                  </button>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-4 text-gray-500">
                    <span v-if="account.currency">
                      <Icon name="heroicons:currency-dollar" class="w-3 h-3 inline mr-1" />
                      {{ account.currency }}
                    </span>
                    <span v-if="account.timezone">
                      <Icon name="heroicons:clock" class="w-3 h-3 inline mr-1" />
                      {{ account.timezone }}
                    </span>
                  </div>
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      account.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    ]"
                  >
                    {{ account.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <p
                  v-if="account.lastSyncAt"
                  class="mt-2 text-xs text-gray-400"
                >
                  Last synced: {{ formatRelativeTime(account.lastSyncAt) }}
                </p>
              </div>
            </div>
            <div
              v-else
              class="card card-body text-center py-8"
            >
              <Icon name="heroicons:server-stack" class="w-12 h-12 text-gray-300 mx-auto" />
              <h4 class="mt-2 font-medium text-gray-900">No data sources assigned</h4>
              <p class="text-sm text-gray-500 mt-1">
                Assign ad accounts to start pulling data for this client
              </p>
            </div>
          </div>

          <!-- Available Accounts -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Available Data Sources
            </h3>
            <div
              v-if="availableAccounts.length > 0"
              class="card overflow-hidden"
            >
              <div class="divide-y divide-gray-100">
                <div
                  v-for="account in availableAccounts"
                  :key="account.id"
                  class="p-4 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Icon :name="getPlatformIcon(account.dataSource.type)" class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="font-medium text-gray-900 text-sm">{{ account.name }}</p>
                      <p class="text-xs text-gray-500">
                        {{ account.dataSource.name }} &middot; ID: {{ account.platformId }}
                        <span v-if="account.currency" class="ml-1">&middot; {{ account.currency }}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    class="btn-primary text-sm"
                    :disabled="isAssigning"
                    @click="assignAccount(account.id)"
                  >
                    <Icon
                      v-if="isAssigning"
                      name="heroicons:arrow-path"
                      class="w-4 h-4 mr-1 animate-spin"
                    />
                    Assign
                  </button>
                </div>
              </div>
            </div>
            <div
              v-else
              class="card card-body text-center py-8 bg-gray-50"
            >
              <Icon name="heroicons:check-circle" class="w-12 h-12 text-green-400 mx-auto" />
              <h4 class="mt-2 font-medium text-gray-900">All accounts assigned</h4>
              <p class="text-sm text-gray-500 mt-1">
                All available ad accounts have been assigned to this client
              </p>
              <NuxtLink
                :to="`/${tenant}/integrations`"
                class="text-tamarindo-600 hover:text-tamarindo-700 text-sm font-medium mt-2 inline-block"
              >
                Connect more platforms
              </NuxtLink>
            </div>
          </div>
        </template>
      </div>

      <!-- Reports Tab -->
      <div v-else-if="activeTab === 'reports'">
        <!-- Loading -->
        <div
          v-if="isLoadingReports"
          class="card p-12 text-center"
        >
          <Icon
            name="heroicons:arrow-path"
            class="w-8 h-8 text-gray-400 animate-spin mx-auto"
          />
          <p class="mt-2 text-gray-500">
            Loading reports...
          </p>
        </div>

        <template v-else>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
              Client Reports
            </h3>
            <NuxtLink
              :to="`/${tenant}/reports/new?clientId=${clientId}`"
              class="btn-primary text-sm"
            >
              <Icon name="heroicons:plus" class="w-4 h-4 mr-1" />
              New Report
            </NuxtLink>
          </div>

          <div
            v-if="reports.length > 0"
            class="card overflow-hidden"
          >
            <div class="divide-y divide-gray-100">
              <NuxtLink
                v-for="report in reports"
                :key="report.id"
                :to="`/${tenant}/reports/${report.id}`"
                class="p-4 hover:bg-gray-50 flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-tamarindo-100 flex items-center justify-center">
                    <Icon name="heroicons:document-chart-bar" class="w-5 h-5 text-tamarindo-600" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ report.title }}</p>
                    <p class="text-xs text-gray-500">
                      {{ report.dateRange?.start }} - {{ report.dateRange?.end }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span
                    :class="[
                      'badge',
                      report.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'
                    ]"
                  >
                    {{ report.status }}
                  </span>
                  <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
                </div>
              </NuxtLink>
            </div>
          </div>
          <div
            v-else
            class="card card-body text-center py-8"
          >
            <Icon name="heroicons:document-chart-bar" class="w-12 h-12 text-gray-300 mx-auto" />
            <h4 class="mt-2 font-medium text-gray-900">No reports yet</h4>
            <p class="text-sm text-gray-500 mt-1">
              Create your first report for this client
            </p>
            <NuxtLink
              :to="`/${tenant}/reports/new?clientId=${clientId}`"
              class="btn-primary mt-4 inline-flex"
            >
              <Icon name="heroicons:plus" class="w-4 h-4 mr-1" />
              Create Report
            </NuxtLink>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
