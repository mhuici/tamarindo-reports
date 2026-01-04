import { computed, readonly } from 'vue'
import { useState } from '#imports'

type DataSourceType = 'GOOGLE_ADS' | 'FACEBOOK_ADS' | 'GOOGLE_ANALYTICS' | 'TIKTOK_ADS' | 'LINKEDIN_ADS'
type DataSourceStatus = 'ACTIVE' | 'SYNCING' | 'ERROR' | 'NEEDS_REAUTH'

interface PlatformAccount {
  id: string
  platformId: string
  name: string
  currency: string | null
  timezone: string | null
  isActive: boolean
  lastSyncAt: string | null
  assignedClientsCount: number
  assignedClients: Array<{ id: string; name: string }>
}

interface DataSource {
  id: string
  name: string
  type: DataSourceType
  status: DataSourceStatus
  isActive: boolean
  lastSyncAt: string | null
  syncError: string | null
  authError: string | null
  createdAt: string
  accountsCount: number
  platformAccounts?: PlatformAccount[]
}

interface Integration {
  id: string
  name: string
  description: string
  icon: string
  type: DataSource['type']
  connectUrl: string
  status: 'connected' | 'not_connected' | 'coming_soon' | 'error'
  dataSource?: DataSource
}

export function useIntegrations() {
  const dataSources = useState<DataSource[]>('data-sources', () => [])
  const isLoading = useState<boolean>('integrations-loading', () => false)

  // Available integrations with their metadata
  const availableIntegrations: Omit<Integration, 'status' | 'dataSource'>[] = [
    {
      id: 'google-ads',
      name: 'Google Ads',
      description: 'Connect your Google Ads accounts to pull campaign data.',
      icon: 'logos:google-ads',
      type: 'GOOGLE_ADS',
      connectUrl: '/api/integrations/google-ads/connect',
    },
    {
      id: 'facebook-ads',
      name: 'Facebook Ads',
      description: 'Connect your Meta Business accounts for Facebook & Instagram ads.',
      icon: 'logos:facebook',
      type: 'FACEBOOK_ADS',
      connectUrl: '/api/integrations/facebook-ads/connect',
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics 4',
      description: 'Pull website traffic and conversion data from GA4.',
      icon: 'logos:google-analytics',
      type: 'GOOGLE_ANALYTICS',
      connectUrl: '/api/integrations/google-analytics/connect',
    },
    {
      id: 'tiktok-ads',
      name: 'TikTok Ads',
      description: 'Connect TikTok Ads Manager for campaign metrics.',
      icon: 'logos:tiktok-icon',
      type: 'TIKTOK_ADS',
      connectUrl: '',
    },
  ]

  // Combine available integrations with connected data sources
  const integrations = computed<Integration[]>(() => {
    return availableIntegrations.map((integration) => {
      const dataSource = dataSources.value.find(ds => ds.type === integration.type)

      let status: Integration['status'] = 'not_connected'

      if (dataSource) {
        if (dataSource.status === 'NEEDS_REAUTH') {
          status = 'error' // Show as error, needs reconnection
        }
        else if (dataSource.status === 'ERROR') {
          status = 'error'
        }
        else {
          status = 'connected'
        }
      }
      else if (!integration.connectUrl) {
        status = 'coming_soon'
      }

      return {
        ...integration,
        status,
        dataSource,
      }
    })
  })

  /**
   * Fetch data sources from API
   */
  async function fetchDataSources(includeAccounts = false): Promise<DataSource[]> {
    isLoading.value = true

    try {
      const url = includeAccounts ? '/api/integrations?includeAccounts=true' : '/api/integrations'
      const response = await $fetch<{ dataSources: DataSource[] }>(url)
      dataSources.value = response.dataSources
      return dataSources.value
    }
    catch (e) {
      console.error('Failed to fetch data sources:', e)
      return []
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Sync accounts for a data source
   */
  async function syncAccounts(dataSourceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await $fetch<{
        success: boolean
        accountsFound: number
        accountsSynced: number
      }>(`/api/integrations/${dataSourceId}/sync`, {
        method: 'POST',
      })

      // Refresh data sources to get updated accounts
      await fetchDataSources(true)

      return { success: true }
    }
    catch (e: any) {
      return { success: false, error: e?.data?.message || 'Sync failed' }
    }
  }

  /**
   * Connect an integration (redirects to OAuth)
   */
  function connect(integration: Integration) {
    if (integration.connectUrl) {
      window.location.href = integration.connectUrl
    }
  }

  /**
   * Disconnect an integration
   */
  async function disconnect(dataSourceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await $fetch(`/api/integrations/${dataSourceId}`, {
        method: 'DELETE',
      })

      dataSources.value = dataSources.value.filter(ds => ds.id !== dataSourceId)
      return { success: true }
    }
    catch (e: any) {
      return { success: false, error: e?.data?.message || 'Failed to disconnect' }
    }
  }

  return {
    integrations,
    dataSources: readonly(dataSources),
    isLoading: readonly(isLoading),
    fetchDataSources,
    syncAccounts,
    connect,
    disconnect,
  }
}
