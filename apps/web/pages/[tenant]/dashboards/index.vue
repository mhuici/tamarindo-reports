<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  middleware: ['tenant'],
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)

const { dashboards, isLoading, fetchDashboards, deleteDashboard, copyPublicUrl, getPublicUrl } = useDashboards()
const { clients, fetchClients } = useClients()

// Modal state
const showCreateModal = ref(false)
const isCreating = ref(false)
const createForm = reactive({
  name: '',
  clientId: '',
  isPublic: true,
  password: '',
})

// Fetch on mount
onMounted(() => {
  fetchDashboards()
  fetchClients()
})

async function handleCreate() {
  if (!createForm.name || !createForm.clientId) return

  isCreating.value = true
  const { createDashboard } = useDashboards()

  const result = await createDashboard({
    name: createForm.name,
    clientId: createForm.clientId,
    isPublic: createForm.isPublic,
    password: createForm.password || undefined,
    widgets: [],
  })

  if (result.success) {
    showCreateModal.value = false
    createForm.name = ''
    createForm.clientId = ''
    createForm.password = ''
  }
  else {
    alert(result.error || 'Failed to create dashboard')
  }

  isCreating.value = false
}

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
      <button
        class="btn-primary"
        @click="showCreateModal = true"
      >
        <Icon
          name="heroicons:plus"
          class="w-5 h-5 mr-2"
        />
        Create Dashboard
      </button>
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
        <button
          class="btn-primary mt-4 inline-flex"
          @click="showCreateModal = true"
        >
          <Icon
            name="heroicons:plus"
            class="w-5 h-5 mr-2"
          />
          Create Dashboard
        </button>
      </div>
    </div>

    <!-- Create Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-black/50"
        @click="showCreateModal = false"
      />
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Create Dashboard
        </h2>

        <form
          class="space-y-4"
          @submit.prevent="handleCreate"
        >
          <div>
            <label
              for="name"
              class="label"
            >Dashboard Name</label>
            <input
              id="name"
              v-model="createForm.name"
              type="text"
              class="input"
              placeholder="e.g., Monthly Performance"
              required
            >
          </div>

          <div>
            <label
              for="client"
              class="label"
            >Client</label>
            <select
              id="client"
              v-model="createForm.clientId"
              class="select"
              required
            >
              <option
                value=""
                disabled
              >
                Select a client
              </option>
              <option
                v-for="client in clients"
                :key="client.id"
                :value="client.id"
              >
                {{ client.name }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-3">
            <input
              id="isPublic"
              v-model="createForm.isPublic"
              type="checkbox"
              class="w-4 h-4 rounded border-gray-300 text-tamarindo-600 focus:ring-tamarindo-500"
            >
            <label
              for="isPublic"
              class="text-sm text-gray-700"
            >
              Make this dashboard publicly accessible
            </label>
          </div>

          <div v-if="createForm.isPublic">
            <label
              for="password"
              class="label"
            >Password Protection (Optional)</label>
            <input
              id="password"
              v-model="createForm.password"
              type="password"
              class="input"
              placeholder="Leave empty for no password"
            >
            <p class="text-xs text-gray-500 mt-1">
              Viewers will need this password to access the dashboard.
            </p>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              class="btn-secondary"
              @click="showCreateModal = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="isCreating || !createForm.name || !createForm.clientId"
            >
              <Icon
                v-if="isCreating"
                name="heroicons:arrow-path"
                class="w-4 h-4 mr-2 animate-spin"
              />
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
