<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Integrations',
  middleware: ['tenant'],
})

const route = useRoute()
const { integrations, isLoading, fetchDataSources, connect, disconnect } = useIntegrations()

// Check for success/error from OAuth callback
const connectedParam = route.query.connected as string
const errorParam = route.query.error as string

const successMessage = ref('')
const errorMessage = ref('')

if (connectedParam) {
  successMessage.value = `Successfully connected ${connectedParam.replace('-', ' ')}!`
  // Clean URL
  navigateTo(route.path, { replace: true })
}

if (errorParam) {
  errorMessage.value = errorParam === 'oauth_denied'
    ? 'Authorization was denied. Please try again.'
    : 'An error occurred during connection.'
  navigateTo(route.path, { replace: true })
}

// Fetch data sources on mount
onMounted(() => {
  fetchDataSources()
})

async function handleDisconnect(integration: any) {
  if (!integration.dataSource) return

  if (!confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
    return
  }

  const result = await disconnect(integration.dataSource.id)
  if (result.success) {
    successMessage.value = `${integration.name} disconnected successfully.`
  }
  else {
    errorMessage.value = result.error || 'Failed to disconnect.'
  }
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
      class="grid grid-cols-1 md:grid-cols-2 gap-6"
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
      class="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      <div
        v-for="integration in integrations"
        :key="integration.id"
        class="card card-body"
      >
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Icon
              :name="integration.icon"
              class="w-8 h-8"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-gray-900">
                {{ integration.name }}
              </h3>
              <span
                v-if="integration.status === 'connected'"
                class="badge badge-success"
              >
                Connected
              </span>
              <span
                v-else-if="integration.status === 'error'"
                class="badge badge-error"
              >
                Error
              </span>
              <span
                v-else-if="integration.status === 'coming_soon'"
                class="badge badge-info"
              >
                Coming Soon
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              {{ integration.description }}
            </p>
            <div
              v-if="integration.dataSource"
              class="mt-3 text-xs text-gray-500 space-y-1"
            >
              <p>
                <span class="font-medium">Account:</span> {{ integration.dataSource.name }}
              </p>
              <p>
                <span class="font-medium">Last sync:</span> {{ formatDate(integration.dataSource.lastSync) }}
              </p>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-3">
          <template v-if="integration.status === 'connected'">
            <button
              class="btn-outline text-sm text-red-600 border-red-300 hover:bg-red-50"
              @click="handleDisconnect(integration)"
            >
              Disconnect
            </button>
            <button
              class="btn-primary text-sm"
              @click="connect(integration)"
            >
              <Icon
                name="heroicons:arrow-path"
                class="w-4 h-4 mr-1"
              />
              Reconnect
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
              <code class="bg-amber-100 px-1 rounded">GOOGLE_CLIENT_ID</code> and <code class="bg-amber-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code> for Google Ads
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
            Need help connecting?
          </h3>
          <p class="text-sm text-gray-600 mt-1">
            Check out our integration guides or contact support for assistance.
          </p>
          <div class="mt-3 flex gap-3">
            <button class="text-sm text-tamarindo-600 hover:text-tamarindo-500 font-medium">
              View Guides
            </button>
            <button class="text-sm text-tamarindo-600 hover:text-tamarindo-500 font-medium">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
