<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Clients',
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)

// Mock data
const clients = ref([
  { id: '1', name: 'Acme Corp', email: 'contact@acme.com', reports: 12, lastReport: '2024-12-20', status: 'active' },
  { id: '2', name: 'TechStart', email: 'hello@techstart.io', reports: 8, lastReport: '2024-12-19', status: 'active' },
  { id: '3', name: 'GrowthCo', email: 'team@growthco.com', reports: 5, lastReport: '2024-12-15', status: 'active' },
  { id: '4', name: 'StartupXYZ', email: 'info@startupxyz.com', reports: 3, lastReport: '2024-12-10', status: 'inactive' },
])

const searchQuery = ref('')

const filteredClients = computed(() => {
  if (!searchQuery.value)
    return clients.value
  const query = searchQuery.value.toLowerCase()
  return clients.value.filter(c =>
    c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query),
  )
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Clients
        </h1>
        <p class="text-gray-600">
          Manage your agency clients and their reports.
        </p>
      </div>
      <button class="btn-primary">
        <Icon
          name="heroicons:plus"
          class="w-5 h-5 mr-2"
        />
        Add Client
      </button>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <Icon
          name="heroicons:magnifying-glass"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search clients..."
          class="input pl-10"
        >
      </div>
    </div>

    <!-- Clients table -->
    <div class="card overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reports
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
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="client in filteredClients"
            :key="client.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span class="text-sm font-medium text-gray-600">
                    {{ client.name.charAt(0) }}
                  </span>
                </div>
                <div class="ml-4">
                  <div class="font-medium text-gray-900">
                    {{ client.name }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ client.email }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ client.reports }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ client.lastReport }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  'badge',
                  client.status === 'active' ? 'badge-success' : 'badge-warning',
                ]"
              >
                {{ client.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
              <NuxtLink
                :to="`/${tenant}/clients/${client.id}`"
                class="text-tamarindo-600 hover:text-tamarindo-900 font-medium"
              >
                View
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div
        v-if="filteredClients.length === 0"
        class="text-center py-12"
      >
        <Icon
          name="heroicons:users"
          class="mx-auto h-12 w-12 text-gray-400"
        />
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          No clients found
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          Get started by adding your first client.
        </p>
      </div>
    </div>
  </div>
</template>
