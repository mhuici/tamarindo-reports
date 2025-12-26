<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Clients',
  middleware: ['tenant'],
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)

const { clients, isLoading, fetchClients, createClient, updateClient, deleteClient } = useClients()

// Fetch clients on mount
onMounted(() => {
  fetchClients()
})

const searchQuery = ref('')
const isModalOpen = ref(false)
const editingClient = ref<any>(null)
const isSubmitting = ref(false)
const formError = ref('')

const form = reactive({
  name: '',
  email: '',
  phone: '',
  website: '',
  industry: '',
  notes: '',
})

const filteredClients = computed(() => {
  if (!searchQuery.value) return clients.value
  const query = searchQuery.value.toLowerCase()
  return clients.value.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.email?.toLowerCase().includes(query),
  )
})

function openCreateModal() {
  editingClient.value = null
  Object.assign(form, { name: '', email: '', phone: '', website: '', industry: '', notes: '' })
  formError.value = ''
  isModalOpen.value = true
}

function openEditModal(client: any) {
  editingClient.value = client
  Object.assign(form, {
    name: client.name,
    email: client.email || '',
    phone: client.phone || '',
    website: client.website || '',
    industry: client.industry || '',
    notes: client.notes || '',
  })
  formError.value = ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingClient.value = null
}

async function handleSubmit() {
  if (!form.name.trim()) {
    formError.value = 'Client name is required'
    return
  }

  isSubmitting.value = true
  formError.value = ''

  const data = {
    name: form.name.trim(),
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    website: form.website.trim() || undefined,
    industry: form.industry.trim() || undefined,
    notes: form.notes.trim() || undefined,
  }

  let result
  if (editingClient.value) {
    result = await updateClient(editingClient.value.id, data)
  }
  else {
    result = await createClient(data)
  }

  isSubmitting.value = false

  if (result.success) {
    closeModal()
  }
  else {
    formError.value = result.error || 'An error occurred'
  }
}

async function handleDelete(client: any) {
  if (!confirm(`Are you sure you want to delete "${client.name}"? This action cannot be undone.`)) {
    return
  }

  const result = await deleteClient(client.id)
  if (!result.success) {
    alert(result.error || 'Failed to delete client')
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
          Clients
        </h1>
        <p class="text-gray-600">
          Manage your agency clients and their reports.
        </p>
      </div>
      <button
        class="btn-primary"
        @click="openCreateModal"
      >
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
        Loading clients...
      </p>
    </div>

    <!-- Clients table -->
    <div
      v-else
      class="card overflow-hidden"
    >
      <table
        v-if="filteredClients.length > 0"
        class="min-w-full divide-y divide-gray-200"
      >
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Industry
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reports
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
                <div class="w-10 h-10 rounded-full bg-tamarindo-100 flex items-center justify-center">
                  <span class="text-sm font-medium text-tamarindo-700">
                    {{ client.name.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div class="ml-4">
                  <div class="font-medium text-gray-900">
                    {{ client.name }}
                  </div>
                  <div
                    v-if="client.email"
                    class="text-sm text-gray-500"
                  >
                    {{ client.email }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ client.industry || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ client._count?.reports || 0 }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  'badge',
                  client.isActive ? 'badge-success' : 'badge-warning',
                ]"
              >
                {{ client.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
              <button
                class="text-gray-600 hover:text-gray-900"
                title="Edit"
                @click="openEditModal(client)"
              >
                <Icon
                  name="heroicons:pencil-square"
                  class="w-5 h-5"
                />
              </button>
              <button
                class="text-red-600 hover:text-red-900"
                title="Delete"
                @click="handleDelete(client)"
              >
                <Icon
                  name="heroicons:trash"
                  class="w-5 h-5"
                />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div
        v-else
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
        <button
          class="btn-primary mt-4"
          @click="openCreateModal"
        >
          <Icon
            name="heroicons:plus"
            class="w-5 h-5 mr-2"
          />
          Add Client
        </button>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 transition-opacity"
          @click="closeModal"
        />

        <!-- Modal content -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              {{ editingClient ? 'Edit Client' : 'Add New Client' }}
            </h2>

            <!-- Error -->
            <div
              v-if="formError"
              class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {{ formError }}
            </div>

            <form
              class="space-y-4"
              @submit.prevent="handleSubmit"
            >
              <div>
                <label class="label">Name *</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="input"
                  placeholder="Client name"
                  required
                >
              </div>

              <div>
                <label class="label">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="input"
                  placeholder="contact@client.com"
                >
              </div>

              <div>
                <label class="label">Phone</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  class="input"
                  placeholder="+1 234 567 8900"
                >
              </div>

              <div>
                <label class="label">Website</label>
                <input
                  v-model="form.website"
                  type="url"
                  class="input"
                  placeholder="https://client.com"
                >
              </div>

              <div>
                <label class="label">Industry</label>
                <input
                  v-model="form.industry"
                  type="text"
                  class="input"
                  placeholder="e.g., E-commerce, SaaS, Real Estate"
                >
              </div>

              <div>
                <label class="label">Notes</label>
                <textarea
                  v-model="form.notes"
                  class="input"
                  rows="3"
                  placeholder="Additional notes about the client..."
                />
              </div>

              <div class="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  class="btn-outline"
                  @click="closeModal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn-primary"
                  :disabled="isSubmitting"
                >
                  <Icon
                    v-if="isSubmitting"
                    name="heroicons:arrow-path"
                    class="w-5 h-5 mr-2 animate-spin"
                  />
                  {{ editingClient ? 'Save Changes' : 'Create Client' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
