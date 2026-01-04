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
  fetchPlatformAccounts()
})

const searchQuery = ref('')
const isModalOpen = ref(false)
const editingClient = ref<any>(null)
const isSubmitting = ref(false)
const formError = ref('')

// Account linking state
const isAccountModalOpen = ref(false)
const selectedClient = ref<any>(null)
const platformAccounts = ref<any[]>([])
const isLoadingAccounts = ref(false)
const isLinkingAccount = ref(false)

const form = reactive({
  name: '',
  email: '',
  phone: '',
  website: '',
  industry: '',
  notes: '',
})

// Fetch all platform accounts
async function fetchPlatformAccounts() {
  try {
    const response = await $fetch('/api/platform-accounts')
    platformAccounts.value = response as any[]
  }
  catch (error) {
    console.error('Failed to fetch platform accounts:', error)
  }
}

// Get linked accounts for a client
function getClientLinkedAccounts(clientId: string) {
  return platformAccounts.value.filter(account =>
    account.linkedClients.some((c: any) => c.id === clientId),
  )
}

// Get available (not linked) accounts for a client
function getAvailableAccounts(clientId: string) {
  return platformAccounts.value.filter(account =>
    !account.linkedClients.some((c: any) => c.id === clientId),
  )
}

// Open account linking modal
function openAccountModal(client: any) {
  selectedClient.value = client
  isAccountModalOpen.value = true
}

function closeAccountModal() {
  isAccountModalOpen.value = false
  selectedClient.value = null
}

// Link an account to the selected client
async function linkAccount(accountId: string) {
  if (!selectedClient.value) return

  isLinkingAccount.value = true
  try {
    await $fetch(`/api/clients/${selectedClient.value.id}/accounts`, {
      method: 'POST',
      body: { platformAccountId: accountId },
    })
    // Refresh data
    await fetchPlatformAccounts()
  }
  catch (error: any) {
    alert(error.data?.message || 'Failed to link account')
  }
  finally {
    isLinkingAccount.value = false
  }
}

// Unlink an account from the selected client
async function unlinkAccount(accountId: string) {
  if (!selectedClient.value) return

  if (!confirm('Are you sure you want to unlink this account?')) return

  try {
    await $fetch(`/api/clients/${selectedClient.value.id}/accounts/${accountId}`, {
      method: 'DELETE',
    })
    // Refresh data
    await fetchPlatformAccounts()
  }
  catch (error: any) {
    alert(error.data?.message || 'Failed to unlink account')
  }
}

// Get platform icon
function getPlatformIcon(platform: string) {
  const icons: Record<string, string> = {
    FACEBOOK_ADS: 'logos:facebook',
    GOOGLE_ADS: 'logos:google-ads',
  }
  return icons[platform] || 'heroicons:globe-alt'
}

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
              Ad Accounts
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
              <NuxtLink
                :to="`/${tenant}/clients/${client.id}`"
                class="flex items-center"
              >
                <div class="w-10 h-10 rounded-full bg-tamarindo-100 flex items-center justify-center">
                  <span class="text-sm font-medium text-tamarindo-700">
                    {{ client.name.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div class="ml-4">
                  <div class="font-medium text-gray-900 hover:text-tamarindo-600">
                    {{ client.name }}
                  </div>
                  <div
                    v-if="client.email"
                    class="text-sm text-gray-500"
                  >
                    {{ client.email }}
                  </div>
                </div>
              </NuxtLink>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <div
                  v-if="getClientLinkedAccounts(client.id).length > 0"
                  class="flex -space-x-1"
                >
                  <div
                    v-for="account in getClientLinkedAccounts(client.id).slice(0, 3)"
                    :key="account.id"
                    class="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center"
                    :title="account.name"
                  >
                    <Icon
                      :name="getPlatformIcon(account.platform)"
                      class="w-3 h-3"
                    />
                  </div>
                  <div
                    v-if="getClientLinkedAccounts(client.id).length > 3"
                    class="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600"
                  >
                    +{{ getClientLinkedAccounts(client.id).length - 3 }}
                  </div>
                </div>
                <span
                  v-else
                  class="text-sm text-gray-400"
                >
                  No accounts
                </span>
                <button
                  class="ml-1 text-tamarindo-600 hover:text-tamarindo-800 text-sm font-medium"
                  @click="openAccountModal(client)"
                >
                  {{ getClientLinkedAccounts(client.id).length > 0 ? 'Manage' : 'Link' }}
                </button>
              </div>
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
              <NuxtLink
                :to="`/${tenant}/clients/${client.id}`"
                class="text-tamarindo-600 hover:text-tamarindo-900"
                title="View"
              >
                <Icon
                  name="heroicons:eye"
                  class="w-5 h-5"
                />
              </NuxtLink>
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

    <!-- Account Linking Modal -->
    <Teleport to="body">
      <div
        v-if="isAccountModalOpen && selectedClient"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 transition-opacity"
          @click="closeAccountModal"
        />

        <!-- Modal content -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-2">
              Manage Ad Accounts
            </h2>
            <p class="text-gray-500 text-sm mb-6">
              Link advertising accounts to <strong>{{ selectedClient.name }}</strong>
            </p>

            <!-- Linked accounts -->
            <div class="mb-6">
              <h3 class="text-sm font-medium text-gray-700 mb-3">
                Linked Accounts
              </h3>
              <div
                v-if="getClientLinkedAccounts(selectedClient.id).length > 0"
                class="space-y-2"
              >
                <div
                  v-for="account in getClientLinkedAccounts(selectedClient.id)"
                  :key="account.id"
                  class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div class="flex items-center gap-3">
                    <Icon
                      :name="getPlatformIcon(account.platform)"
                      class="w-5 h-5"
                    />
                    <div>
                      <div class="font-medium text-gray-900">
                        {{ account.name }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ account.platformId }} · {{ account.currency }}
                      </div>
                    </div>
                  </div>
                  <button
                    class="text-red-600 hover:text-red-800 text-sm font-medium"
                    @click="unlinkAccount(account.id)"
                  >
                    Unlink
                  </button>
                </div>
              </div>
              <p
                v-else
                class="text-gray-400 text-sm italic"
              >
                No accounts linked yet
              </p>
            </div>

            <!-- Available accounts -->
            <div>
              <h3 class="text-sm font-medium text-gray-700 mb-3">
                Available Accounts
              </h3>
              <div
                v-if="getAvailableAccounts(selectedClient.id).length > 0"
                class="space-y-2"
              >
                <div
                  v-for="account in getAvailableAccounts(selectedClient.id)"
                  :key="account.id"
                  class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div class="flex items-center gap-3">
                    <Icon
                      :name="getPlatformIcon(account.platform)"
                      class="w-5 h-5"
                    />
                    <div>
                      <div class="font-medium text-gray-900">
                        {{ account.name }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ account.platformId }} · {{ account.currency }}
                        <span
                          v-if="account.linkedClients.length > 0"
                          class="text-amber-600"
                        >
                          · Used by {{ account.linkedClients.map((c: any) => c.name).join(', ') }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    class="text-tamarindo-600 hover:text-tamarindo-800 text-sm font-medium"
                    :disabled="isLinkingAccount"
                    @click="linkAccount(account.id)"
                  >
                    {{ isLinkingAccount ? 'Linking...' : 'Link' }}
                  </button>
                </div>
              </div>
              <div
                v-else
                class="text-center py-6 bg-gray-50 rounded-lg"
              >
                <Icon
                  name="heroicons:link-slash"
                  class="w-8 h-8 text-gray-300 mx-auto mb-2"
                />
                <p class="text-gray-500 text-sm">
                  No accounts available
                </p>
                <p class="text-gray-400 text-xs mt-1">
                  Connect an ad platform in Integrations first
                </p>
              </div>
            </div>

            <div class="flex justify-end mt-6">
              <button
                class="btn-outline"
                @click="closeAccountModal"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
