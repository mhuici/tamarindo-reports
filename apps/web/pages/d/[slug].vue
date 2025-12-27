<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const route = useRoute()
const slug = computed(() => route.params.slug as string)

// State
const dashboard = ref<any>(null)
const isLoading = ref(true)
const error = ref('')
const requiresPassword = ref(false)
const password = ref('')
const isCheckingPassword = ref(false)
const passwordError = ref('')

// Fetch dashboard
async function fetchDashboard(pwd?: string) {
  isLoading.value = true
  error.value = ''
  passwordError.value = ''

  try {
    const url = pwd
      ? `/api/dashboards/public/${slug.value}?password=${encodeURIComponent(pwd)}`
      : `/api/dashboards/public/${slug.value}`

    const response = await $fetch<any>(url)

    if (response.requiresPassword) {
      requiresPassword.value = true
      dashboard.value = response.dashboard
    }
    else {
      requiresPassword.value = false
      dashboard.value = response.dashboard
    }
  }
  catch (e: any) {
    const statusCode = e?.response?.status || e?.statusCode
    const message = e?.data?.message || e?.message || 'Failed to load dashboard'

    if (statusCode === 401) {
      passwordError.value = 'Incorrect password'
    }
    else if (statusCode === 403) {
      error.value = 'This dashboard is not public'
    }
    else if (statusCode === 404) {
      error.value = 'Dashboard not found'
    }
    else if (statusCode === 410) {
      error.value = 'This dashboard link has expired'
    }
    else {
      error.value = message
    }
  }
  finally {
    isLoading.value = false
    isCheckingPassword.value = false
  }
}

async function handlePasswordSubmit() {
  if (!password.value) return

  isCheckingPassword.value = true
  await fetchDashboard(password.value)
}

// Fetch on mount
onMounted(() => {
  fetchDashboard()
})

// Get branding
const branding = computed(() => {
  const b = dashboard.value?.branding as any
  return {
    primaryColor: b?.primaryColor || '#f97316',
    secondaryColor: b?.secondaryColor || '#1f2937',
    logoUrl: b?.logoUrl || '',
    companyName: b?.companyName || dashboard.value?.tenantName || 'TamarindoReports',
  }
})

// Dynamic styles based on branding
const brandStyles = computed(() => ({
  '--brand-primary': branding.value.primaryColor,
  '--brand-secondary': branding.value.secondaryColor,
}))

function getWidgetIcon(type: string) {
  const icons: Record<string, string> = {
    'metric': 'heroicons:presentation-chart-bar',
    'line-chart': 'heroicons:chart-bar',
    'bar-chart': 'heroicons:chart-bar-square',
    'pie-chart': 'heroicons:chart-pie',
    'table': 'heroicons:table-cells',
    'text': 'heroicons:document-text',
  }
  return icons[type] || 'heroicons:square-3-stack-3d'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center min-h-screen"
    >
      <Icon
        name="heroicons:arrow-path"
        class="w-10 h-10 animate-spin text-gray-400"
      />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center">
        <Icon
          name="heroicons:exclamation-triangle"
          class="mx-auto h-16 w-16 text-gray-400"
        />
        <h1 class="mt-4 text-xl font-semibold text-gray-900">
          {{ error }}
        </h1>
        <p class="mt-2 text-gray-500">
          The dashboard you're looking for is not available.
        </p>
      </div>
    </div>

    <!-- Password form -->
    <div
      v-else-if="requiresPassword"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="w-full max-w-md mx-4">
        <div class="bg-white rounded-xl shadow-lg p-8">
          <div class="text-center mb-6">
            <Icon
              name="heroicons:lock-closed"
              class="mx-auto h-12 w-12 text-gray-400"
            />
            <h1 class="mt-4 text-xl font-semibold text-gray-900">
              {{ dashboard?.name || 'Protected Dashboard' }}
            </h1>
            <p class="mt-2 text-sm text-gray-500">
              This dashboard is password protected.
            </p>
          </div>

          <form
            class="space-y-4"
            @submit.prevent="handlePasswordSubmit"
          >
            <div>
              <label
                for="password"
                class="sr-only"
              >Password</label>
              <input
                id="password"
                v-model="password"
                type="password"
                class="input"
                placeholder="Enter password"
                required
              >
              <p
                v-if="passwordError"
                class="mt-2 text-sm text-red-600"
              >
                {{ passwordError }}
              </p>
            </div>

            <button
              type="submit"
              class="w-full btn-primary"
              :disabled="isCheckingPassword"
            >
              <Icon
                v-if="isCheckingPassword"
                name="heroicons:arrow-path"
                class="w-5 h-5 mr-2 animate-spin"
              />
              View Dashboard
            </button>
          </form>

          <p class="mt-6 text-center text-xs text-gray-500">
            {{ dashboard?.clientName }} &bull; {{ dashboard?.tenantName }}
          </p>
        </div>
      </div>
    </div>

    <!-- Dashboard content -->
    <div
      v-else-if="dashboard"
      :style="brandStyles"
    >
      <!-- Header with branding -->
      <header
        class="border-b"
        :style="{ backgroundColor: branding.secondaryColor, borderColor: branding.secondaryColor }"
      >
        <div class="max-w-7xl mx-auto px-4 py-6">
          <div class="flex items-center gap-4">
            <!-- Logo or company name -->
            <img
              v-if="branding.logoUrl"
              :src="branding.logoUrl"
              :alt="branding.companyName"
              class="h-8 object-contain"
            >
            <span
              v-else
              class="text-lg font-bold text-white"
            >
              {{ branding.companyName }}
            </span>
          </div>

          <h1 class="text-2xl font-bold text-white mt-4">
            {{ dashboard.name }}
          </h1>
          <div class="flex items-center gap-4 mt-2 text-sm text-white/70">
            <span>{{ dashboard.clientName }}</span>
          </div>
        </div>
      </header>

      <!-- Widgets -->
      <main class="max-w-7xl mx-auto px-4 py-8">
        <!-- Empty state -->
        <div
          v-if="!dashboard.widgets || dashboard.widgets.length === 0"
          class="text-center py-16"
        >
          <Icon
            name="heroicons:chart-bar"
            class="mx-auto h-16 w-16 text-gray-300"
          />
          <p class="mt-4 text-gray-500">
            No data to display yet.
          </p>
        </div>

        <!-- Widget grid -->
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div
            v-for="widget in dashboard.widgets"
            :key="widget.id"
            :class="[
              'bg-white rounded-xl shadow-sm border border-gray-200 p-6',
              widget.size === 'small' ? 'col-span-1' : '',
              widget.size === 'medium' ? 'md:col-span-1 lg:col-span-1' : '',
              widget.size === 'large' ? 'md:col-span-2 lg:col-span-2' : '',
            ]"
          >
            <div class="flex items-center gap-3 mb-4">
              <Icon
                :name="getWidgetIcon(widget.type)"
                class="w-5 h-5 text-gray-400"
              />
              <h3 class="font-medium text-gray-900">
                {{ widget.title }}
              </h3>
            </div>

            <!-- Widget content placeholder -->
            <div class="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
              <div class="text-center text-gray-400">
                <Icon
                  :name="getWidgetIcon(widget.type)"
                  class="mx-auto h-8 w-8"
                />
                <p class="mt-2 text-sm">
                  {{ widget.type.replace('-', ' ') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-t border-gray-200 mt-8">
        <div class="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img
              v-if="branding.logoUrl"
              :src="branding.logoUrl"
              :alt="branding.companyName"
              class="h-6 object-contain opacity-50"
            >
            <span
              v-else
              class="text-sm font-medium"
              :style="{ color: branding.primaryColor }"
            >
              {{ branding.companyName }}
            </span>
          </div>
          <span class="text-sm text-gray-400">
            Powered by TamarindoReports
          </span>
        </div>
      </footer>
    </div>
  </div>
</template>
