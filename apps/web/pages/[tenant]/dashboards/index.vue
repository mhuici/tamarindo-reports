<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  middleware: ['tenant'],
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)

const { dashboards, isLoading, fetchDashboards, deleteDashboard, copyPublicUrl, getPublicUrl } = useDashboards()

// Fetch on mount
onMounted(() => {
  fetchDashboards()
})

async function handleDelete(dashboard: any) {
  if (!confirm(`Are you sure you want to delete "${dashboard.name}"?`)) {
    return
  }

  const result = await deleteDashboard(dashboard.id)
  if (!result.success) {
    alert(result.error || 'Failed to delete dashboard')
  }
}

async function handleCopyLink(slug: string) {
  const success = await copyPublicUrl(slug)
  if (success) {
    alert('Link copied to clipboard!')
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Dashboards
        </h1>
        <p class="text-gray-600">
          Create shareable dashboards for your clients.
        </p>
      </div>
      <NuxtLink
        :to="`/${tenant}/dashboards/new`"
        class="btn-primary"
      >
        <Icon
          name="heroicons:plus"
          class="w-5 h-5 mr-2"
        />
        Create Dashboard
      </NuxtLink>
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

    <!-- Dashboards grid -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="dashboard in dashboards"
        :key="dashboard.id"
        class="card hover:border-tamarindo-300 transition-colors group"
      >
        <div class="card-body">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Icon
                name="heroicons:presentation-chart-line"
                class="w-5 h-5 text-gray-500"
              />
            </div>
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'badge',
                  dashboard.isPublic ? 'badge-success' : 'badge-warning',
                ]"
              >
                {{ dashboard.isPublic ? 'Public' : 'Private' }}
              </span>
              <span
                v-if="dashboard.hasPassword"
                class="badge"
              >
                <Icon
                  name="heroicons:lock-closed"
                  class="w-3 h-3"
                />
              </span>
            </div>
          </div>

          <h3 class="font-semibold text-gray-900 mb-1">
            {{ dashboard.name }}
          </h3>
          <p class="text-sm text-gray-500 mb-3">
            {{ dashboard.client.name }}
          </p>

          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">{{ formatDate(dashboard.createdAt) }}</span>
            <div class="flex items-center gap-2">
              <button
                v-if="dashboard.isPublic"
                class="text-tamarindo-600 hover:text-tamarindo-500"
                title="Copy link"
                @click="handleCopyLink(dashboard.slug)"
              >
                <Icon
                  name="heroicons:link"
                  class="w-4 h-4"
                />
              </button>
              <a
                v-if="dashboard.isPublic"
                :href="getPublicUrl(dashboard.slug)"
                target="_blank"
                class="text-tamarindo-600 hover:text-tamarindo-500"
                title="View"
              >
                <Icon
                  name="heroicons:arrow-top-right-on-square"
                  class="w-4 h-4"
                />
              </a>
              <NuxtLink
                :to="`/${tenant}/dashboards/${dashboard.id}`"
                class="text-tamarindo-600 hover:text-tamarindo-500"
                title="Edit"
              >
                <Icon
                  name="heroicons:pencil"
                  class="w-4 h-4"
                />
              </NuxtLink>
              <button
                class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
                title="Delete"
                @click="handleDelete(dashboard)"
              >
                <Icon
                  name="heroicons:trash"
                  class="w-4 h-4"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="dashboards.length === 0 && !isLoading"
        class="col-span-full text-center py-12"
      >
        <Icon
          name="heroicons:presentation-chart-line"
          class="mx-auto h-12 w-12 text-gray-400"
        />
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          No dashboards yet
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          Create a dashboard to share insights with your clients.
        </p>
        <NuxtLink
          :to="`/${tenant}/dashboards/new`"
          class="btn-primary mt-4 inline-flex"
        >
          <Icon
            name="heroicons:plus"
            class="w-5 h-5 mr-2"
          />
          Create Dashboard
        </NuxtLink>
      </div>
    </div>

  </div>
</template>
