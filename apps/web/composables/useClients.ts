interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  website: string | null
  industry: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  _count?: {
    reports: number
    dashboards: number
  }
}

interface CreateClientData {
  name: string
  email?: string
  phone?: string
  website?: string
  industry?: string
  notes?: string
}

interface UpdateClientData extends Partial<CreateClientData> {
  isActive?: boolean
}

export function useClients() {
  const clients = useState<Client[]>('clients', () => [])
  const isLoading = useState<boolean>('clients-loading', () => false)
  const error = useState<string | null>('clients-error', () => null)

  /**
   * Fetch all clients for the current tenant
   */
  async function fetchClients(): Promise<Client[]> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ clients: Client[] }>('/api/clients')
      clients.value = response.clients
      return clients.value
    }
    catch (e: any) {
      error.value = e?.data?.message || 'Failed to fetch clients'
      return []
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new client
   */
  async function createClient(data: CreateClientData): Promise<{ success: boolean; client?: Client; error?: string }> {
    try {
      const response = await $fetch<{ client: Client }>('/api/clients', {
        method: 'POST',
        body: data,
      })

      clients.value = [...clients.value, response.client]
      return { success: true, client: response.client }
    }
    catch (e: any) {
      const message = e?.data?.message || 'Failed to create client'
      return { success: false, error: message }
    }
  }

  /**
   * Update a client
   */
  async function updateClient(id: string, data: UpdateClientData): Promise<{ success: boolean; client?: Client; error?: string }> {
    try {
      const response = await $fetch<{ client: Client }>(`/api/clients/${id}`, {
        method: 'PUT',
        body: data,
      })

      const index = clients.value.findIndex(c => c.id === id)
      if (index !== -1) {
        clients.value[index] = response.client
      }
      return { success: true, client: response.client }
    }
    catch (e: any) {
      const message = e?.data?.message || 'Failed to update client'
      return { success: false, error: message }
    }
  }

  /**
   * Delete a client
   */
  async function deleteClient(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await $fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      })

      clients.value = clients.value.filter(c => c.id !== id)
      return { success: true }
    }
    catch (e: any) {
      const message = e?.data?.message || 'Failed to delete client'
      return { success: false, error: message }
    }
  }

  return {
    clients: readonly(clients),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  }
}
