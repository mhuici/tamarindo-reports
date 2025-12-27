interface Client {
  id: string
  name: string
  email?: string
}

interface Dashboard {
  id: string
  name: string
  slug: string
  widgets: any[]
  isPublic: boolean
  hasPassword: boolean
  expiresAt?: string
  createdAt: string
  updatedAt?: string
  client: Client
}

interface CreateDashboardData {
  name: string
  clientId: string
  widgets?: any[]
  isPublic?: boolean
  password?: string
  expiresAt?: string
}

interface UpdateDashboardData {
  name?: string
  widgets?: any[]
  isPublic?: boolean
  password?: string | null
  expiresAt?: string | null
}

export function useDashboards() {
  const dashboards = useState<Dashboard[]>('dashboards', () => [])
  const currentDashboard = useState<Dashboard | null>('current-dashboard', () => null)
  const isLoading = useState<boolean>('dashboards-loading', () => false)

  /**
   * Fetch all dashboards
   */
  async function fetchDashboards(filters?: { clientId?: string; isPublic?: boolean }): Promise<Dashboard[]> {
    isLoading.value = true

    try {
      const params = new URLSearchParams()
      if (filters?.clientId) params.set('clientId', filters.clientId)
      if (filters?.isPublic !== undefined) params.set('isPublic', String(filters.isPublic))

      const url = `/api/dashboards${params.toString() ? `?${params.toString()}` : ''}`
      const response = await $fetch<{ dashboards: Dashboard[] }>(url)
      dashboards.value = response.dashboards
      return dashboards.value
    }
    catch (e) {
      console.error('Failed to fetch dashboards:', e)
      return []
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single dashboard
   */
  async function fetchDashboard(id: string): Promise<Dashboard | null> {
    isLoading.value = true

    try {
      const response = await $fetch<{ dashboard: Dashboard }>(`/api/dashboards/${id}`)
      currentDashboard.value = response.dashboard
      return currentDashboard.value
    }
    catch (e) {
      console.error('Failed to fetch dashboard:', e)
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new dashboard
   */
  async function createDashboard(data: CreateDashboardData): Promise<{ success: boolean; dashboard?: Dashboard; error?: string }> {
    try {
      const response = await $fetch<{ success: boolean; dashboard: Dashboard }>('/api/dashboards', {
        method: 'POST',
        body: data,
      })

      if (response.success && response.dashboard) {
        dashboards.value = [response.dashboard, ...dashboards.value]
      }

      return { success: true, dashboard: response.dashboard }
    }
    catch (e: any) {
      return { success: false, error: e?.data?.message || 'Failed to create dashboard' }
    }
  }

  /**
   * Update a dashboard
   */
  async function updateDashboard(id: string, data: UpdateDashboardData): Promise<{ success: boolean; dashboard?: Dashboard; error?: string }> {
    try {
      const response = await $fetch<{ success: boolean; dashboard: Dashboard }>(`/api/dashboards/${id}`, {
        method: 'PUT',
        body: data,
      })

      if (response.success && response.dashboard) {
        const index = dashboards.value.findIndex(d => d.id === id)
        if (index !== -1) {
          dashboards.value[index] = { ...dashboards.value[index], ...response.dashboard }
        }
        if (currentDashboard.value?.id === id) {
          currentDashboard.value = { ...currentDashboard.value, ...response.dashboard }
        }
      }

      return { success: true, dashboard: response.dashboard }
    }
    catch (e: any) {
      return { success: false, error: e?.data?.message || 'Failed to update dashboard' }
    }
  }

  /**
   * Delete a dashboard
   */
  async function deleteDashboard(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await $fetch(`/api/dashboards/${id}`, {
        method: 'DELETE',
      })

      dashboards.value = dashboards.value.filter(d => d.id !== id)
      if (currentDashboard.value?.id === id) {
        currentDashboard.value = null
      }

      return { success: true }
    }
    catch (e: any) {
      return { success: false, error: e?.data?.message || 'Failed to delete dashboard' }
    }
  }

  /**
   * Get public dashboard URL
   */
  function getPublicUrl(slug: string): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/d/${slug}`
  }

  /**
   * Copy public URL to clipboard
   */
  async function copyPublicUrl(slug: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(getPublicUrl(slug))
      return true
    }
    catch {
      return false
    }
  }

  return {
    dashboards: readonly(dashboards),
    currentDashboard: readonly(currentDashboard),
    isLoading: readonly(isLoading),
    fetchDashboards,
    fetchDashboard,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    getPublicUrl,
    copyPublicUrl,
  }
}
