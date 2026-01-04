<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Integrations',
  middleware: ['tenant'],
})

const route = useRoute()
const { integrations, isLoading, fetchDataSources, syncAccounts, connect, disconnect } = useIntegrations()

// Check for success/error from OAuth callback
const connectedParam = route.query.connected as string
const errorParam = route.query.error as string

const successMessage = ref('')
const errorMessage = ref('')
const syncingIntegration = ref<string | null>(null)
const expandedIntegration = ref<string | null>(null)

if (connectedParam) {
  successMessage.value = `Successfully connected ${connectedParam.replace('-', ' ')}! Syncing accounts...`
  // Clean URL
  navigateTo(route.path, { replace: true })
}

if (errorParam) {
  errorMessage.value = errorParam === 'oauth_denied'
    ? 'Authorization was denied. Please try again.'
    : 'An error occurred during connection.'
  navigateTo(route.path, { replace: true })
}

// Fetch data sources with accounts on mount
onMounted(() => {
  fetchDataSources(true)
})

async function handleSync(integration: any) {
  if (!integration.dataSource) return

  syncingIntegration.value = integration.id
  const result = await syncAccounts(integration.dataSource.id)

  if (result.success) {
    successMessage.value = `${integration.name} accounts synced successfully.`
  }
  else {
    errorMessage.value = result.error || 'Failed to sync accounts.'
  }
  syncingIntegration.value = null
}

async function handleDisconnect(integration: any) {
  if (!integration.dataSource) return

  if (!confirm(`Are you sure you want to disconnect ${integration.name}? This will remove all linked accounts.`)) {
    return
  }

  const result = await disconnect(integration.dataSource.id)
  if (result.success) {
    successMessage.value = `${integration.name} disconnected successfully.`
    expandedIntegration.value = null
  }
  else {
    errorMessage.value = result.error || 'Failed to disconnect.'
  }
}

function toggleExpanded(integrationId: string) {
  expandedIntegration.value = expandedIntegration.value === integrationId ? null : integrationId
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeTime(dateString: string | null) {
  if (!dateString) return 'Never synced'
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'connected':
      return { class: 'badge-success', text: 'Connected' }
    case 'error':
      return { class: 'badge-error', text: 'Needs Attention' }
    case 'coming_soon':
      return { class: 'badge-info', text: 'Coming Soon' }
    default:
      return null
  }
}

function getDataSourceStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return { class: 'bg-green-100 text-green-700', text: 'Active', icon: 'heroicons:check-circle' }
    case 'SYNCING':
      return { class: 'bg-blue-100 text-blue-700', text: 'Syncing', icon: 'heroicons:arrow-path' }
    case 'ERROR':
      return { class: 'bg-red-100 text-red-700', text: 'Sync Error', icon: 'heroicons:exclamation-triangle' }
    case 'NEEDS_REAUTH':
      return { class: 'bg-amber-100 text-amber-700', text: 'Reconnect Required', icon: 'heroicons:key' }
    default:
      return { class: 'bg-gray-100 text-gray-700', text: status, icon: 'heroicons:question-mark-circle' }
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Integrations
      </h1>
      <p class="text-gray-600">
        Connect your advertising platforms to pull data automatically.
      </p>
    </div>

    <!-- Success message -->
    <div
      v-if="successMessage"
      class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <Icon
          name="heroicons:check-circle"
          class="w-5 h-5 text-green-600"
        />
        <p class="text-green-700">
          {{ successMessage }}
        </p>
      </div>
      <button
        class="text-green-600 hover:text-green-800"
        @click="successMessage = ''"
      >
        <Icon
          name="heroicons:x-mark"
          class="w-5 h-5"
        />
      </button>
    </div>

    <!-- Error message -->
    <div
      v-if="errorMessage"
      class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <Icon
          name="heroicons:exclamation-circle"
          class="w-5 h-5 text-red-600"
        />
        <p class="text-red-700">
          {{ errorMessage }}
        </p>
      </div>
      <button
        class="text-red-600 hover:text-red-800"
        @click="errorMessage = ''"
      >
        <Icon
          name="heroicons:x-mark"
          class="w-5 h-5"
        />
      </button>
    </div>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <div
        v-for="n in 4"
        :key="n"
        class="card card-body animate-pulse"
      >
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-lg bg-gray-200" />
          <div class="flex-1">
            <div class="h-5 bg-gray-200 rounded w-1/3 mb-2" />
            <div class="h-4 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      </div>
    </div>

    <!-- Integrations grid -->
    <div
      v-else
      class="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <div
        v-for="integration in integrations"
        :key="integration.id"
        class="card overflow-hidden"
      >
        <!-- Integration Header -->
        <div class="card-body">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Icon
                :name="integration.icon"
                class="w-8 h-8"
              />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-semibold text-gray-900">
                  {{ integration.name }}
                </h3>
                <span
                  v-if="getStatusBadge(integration.status)"
                  :class="['badge', getStatusBadge(integration.status)!.class]"
                >
                  {{ getStatusBadge(integration.status)!.text }}
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-1">
                {{ integration.description }}
              </p>

              <!-- Connected data source info -->
              <template v-if="integration.dataSource">
                <div class="mt-3 flex items-center gap-4 text-xs">
                  <!-- Status badge -->
                  <span
                    :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', getDataSourceStatusBadge(integration.dataSource.status).class]"
                  >
                    <Icon
                      :name="getDataSourceStatusBadge(integration.dataSource.status).icon"
                      class="w-3 h-3"
                      :class="{ 'animate-spin': integration.dataSource.status === 'SYNCING' }"
                    />
                    {{ getDataSourceStatusBadge(integration.dataSource.status).text }}
                  </span>

                  <!-- Accounts count -->
                  <span class="text-gray-500">
                    <Icon name="heroicons:building-office-2" class="w-3 h-3 inline mr-1" />
                    {{ integration.dataSource.accountsCount }} account{{ integration.dataSource.accountsCount !== 1 ? 's' : '' }}
                  </span>

                  <!-- Last sync -->
                  <span class="text-gray-500">
                    <Icon name="heroicons:clock" class="w-3 h-3 inline mr-1" />
                    {{ formatRelativeTime(integration.dataSource.lastSyncAt) }}
                  </span>
                </div>

                <!-- Auth error message -->
                <div
                  v-if="integration.dataSource.authError"
                  class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700"
                >
                  <Icon name="heroicons:exclamation-triangle" class="w-3 h-3 inline mr-1" />
                  {{ integration.dataSource.authError }}
                </div>

                <!-- Sync error message -->
                <div
                  v-if="integration.dataSource.syncError && integration.dataSource.status === 'ERROR'"
                  class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700"
                >
                  <Icon name="heroicons:exclamation-circle" class="w-3 h-3 inline mr-1" />
                  {{ integration.dataSource.syncError }}
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <div>
            <!-- Toggle accounts button -->
            <button
              v-if="integration.dataSource && integration.dataSource.accountsCount > 0"
              class="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              @click="toggleExpanded(integration.id)"
            >
              <Icon
                :name="expandedIntegration === integration.id ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
                class="w-4 h-4"
              />
              {{ expandedIntegration === integration.id ? 'Hide' : 'Show' }} accounts
            </button>
          </div>

          <div class="flex gap-2">
            <template v-if="integration.status === 'connected'">
              <button
                class="btn-outline text-sm text-red-600 border-red-300 hover:bg-red-50"
                @click="handleDisconnect(integration)"
              >
                Disconnect
              </button>
              <button
                class="btn-outline text-sm"
                :disabled="syncingIntegration === integration.id"
                @click="handleSync(integration)"
              >
                <Icon
                  name="heroicons:arrow-path"
                  class="w-4 h-4 mr-1"
                  :class="{ 'animate-spin': syncingIntegration === integration.id }"
                />
                {{ syncingIntegration === integration.id ? 'Syncing...' : 'Sync' }}
              </button>
            </template>
            <template v-else-if="integration.status === 'error'">
              <button
                class="btn-outline text-sm text-red-600 border-red-300 hover:bg-red-50"
                @click="handleDisconnect(integration)"
              >
                Remove
              </button>
              <button
                class="btn-primary text-sm"
                @click="connect(integration)"
              >
                <Icon name="heroicons:key" class="w-4 h-4 mr-1" />
                Reconnect
              </button>
            </template>
            <template v-else-if="integration.status === 'not_connected'">
              <button
                class="btn-primary text-sm"
                @click="connect(integration)"
              >
                <Icon
                  name="heroicons:link"
                  class="w-4 h-4 mr-1"
                />
                Connect
              </button>
            </template>
            <template v-else>
              <button
                disabled
                class="btn-secondary text-sm opacity-50 cursor-not-allowed"
              >
                Coming Soon
              </button>
            </template>
          </div>
        </div>

        <!-- Expanded accounts list -->
        <div
          v-if="expandedIntegration === integration.id && integration.dataSource?.platformAccounts"
          class="border-t border-gray-200"
        >
          <div class="divide-y divide-gray-100">
            <div
              v-for="account in integration.dataSource.platformAccounts"
              :key="account.id"
              class="px-6 py-3 hover:bg-gray-50"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-sm text-gray-900">
                    {{ account.name }}
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    ID: {{ account.platformId }}
                    <span v-if="account.currency" class="ml-2">{{ account.currency }}</span>
                    <span v-if="account.timezone" class="ml-2">{{ account.timezone }}</span>
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <!-- Active status -->
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      account.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    ]"
                  >
                    {{ account.isActive ? 'Active' : 'Inactive' }}
                  </span>

                  <!-- Assigned clients count -->
                  <span
                    v-if="account.assignedClientsCount > 0"
                    class="text-xs text-gray-500"
                    :title="account.assignedClients.map((c: any) => c.name).join(', ')"
                  >
                    <Icon name="heroicons:users" class="w-3 h-3 inline mr-1" />
                    {{ account.assignedClientsCount }} client{{ account.assignedClientsCount !== 1 ? 's' : '' }}
                  </span>
                  <span
                    v-else
                    class="text-xs text-amber-500"
                  >
                    <Icon name="heroicons:exclamation-circle" class="w-3 h-3 inline mr-1" />
                    Not assigned
                  </span>
                </div>
              </div>

              <!-- Assigned clients list -->
              <div
                v-if="account.assignedClients && account.assignedClients.length > 0"
                class="mt-2 flex flex-wrap gap-1"
              >
                <span
                  v-for="client in account.assignedClients"
                  :key="client.id"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-tamarindo-50 text-tamarindo-700"
                >
                  {{ client.name }}
                </span>
              </div>
            </div>
          </div>

          <!-- Accounts help text -->
          <div class="px-6 py-3 bg-blue-50 border-t border-blue-100">
            <p class="text-xs text-blue-700">
              <Icon name="heroicons:information-circle" class="w-3 h-3 inline mr-1" />
              Assign accounts to clients from the client detail page to start pulling their data.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Configuration notice -->
    <div class="mt-8 card card-body bg-amber-50 border-amber-200">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Icon
            name="heroicons:exclamation-triangle"
            class="w-5 h-5 text-amber-600"
          />
        </div>
        <div>
          <h3 class="font-semibold text-amber-800">
            OAuth Configuration Required
          </h3>
          <p class="text-sm text-amber-700 mt-1">
            To connect integrations, you need to configure OAuth credentials in your environment variables:
          </p>
          <ul class="text-sm text-amber-700 mt-2 list-disc list-inside space-y-1">
            <li>
              <code class="bg-amber-100 px-1 rounded">GOOGLE_CLIENT_ID</code> and <code class="bg-amber-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code> for Google Ads & Analytics
            </li>
            <li>
              <code class="bg-amber-100 px-1 rounded">FACEBOOK_APP_ID</code> and <code class="bg-amber-100 px-1 rounded">FACEBOOK_APP_SECRET</code> for Facebook Ads
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Help section -->
    <div class="mt-6 card card-body bg-gray-50 border-dashed">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-lg bg-tamarindo-100 flex items-center justify-center flex-shrink-0">
          <Icon
            name="heroicons:question-mark-circle"
            class="w-5 h-5 text-tamarindo-600"
          />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">
            How integrations work
          </h3>
          <ol class="text-sm text-gray-600 mt-2 space-y-1 list-decimal list-inside">
            <li>Connect your ad platform account using OAuth</li>
            <li>We'll automatically sync your ad accounts</li>
            <li>Assign accounts to clients from client detail pages</li>
            <li>Data flows into your reports automatically</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>
