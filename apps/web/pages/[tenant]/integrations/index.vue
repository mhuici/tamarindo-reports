<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Integrations',
  middleware: ['tenant'],
})

const integrations = [
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Connect your Google Ads accounts to pull campaign data.',
    icon: 'logos:google-ads',
    status: 'connected',
    accounts: 2,
  },
  {
    id: 'facebook-ads',
    name: 'Facebook Ads',
    description: 'Connect your Meta Business accounts for Facebook & Instagram ads.',
    icon: 'logos:facebook',
    status: 'not_connected',
    accounts: 0,
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    description: 'Pull website traffic and conversion data from GA4.',
    icon: 'logos:google-analytics',
    status: 'coming_soon',
    accounts: 0,
  },
  {
    id: 'tiktok-ads',
    name: 'TikTok Ads',
    description: 'Connect TikTok Ads Manager for campaign metrics.',
    icon: 'logos:tiktok-icon',
    status: 'coming_soon',
    accounts: 0,
  },
]

function handleConnect(integrationId: string) {
  console.log('Connecting:', integrationId)
  // TODO: Implement OAuth flow
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

    <!-- Integrations grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              v-if="integration.status === 'connected'"
              class="mt-3 text-sm text-gray-600"
            >
              {{ integration.accounts }} account(s) connected
            </div>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-3">
          <template v-if="integration.status === 'connected'">
            <button class="btn-outline text-sm">
              Manage
            </button>
            <button class="btn-secondary text-sm">
              <Icon
                name="heroicons:plus"
                class="w-4 h-4 mr-1"
              />
              Add Account
            </button>
          </template>
          <template v-else-if="integration.status === 'not_connected'">
            <button
              class="btn-primary text-sm"
              @click="handleConnect(integration.id)"
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

    <!-- Help section -->
    <div class="mt-8 card card-body bg-gray-50 border-dashed">
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
