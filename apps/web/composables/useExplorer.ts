import { computed, readonly } from 'vue'
import { useState } from '#imports'

export interface ExplorerMetrics {
  tenantId: string
  dateRange: { start: string; end: string }
  totals: Record<string, number>
  previousTotals: Record<string, number>
  byPlatform: Record<string, Record<string, number>>
  byDate: Array<{ date: string; metrics: Record<string, number> }>
  platforms: string[]
}

export interface DatePreset {
  label: string
  value: string
}

export const DATE_PRESETS: DatePreset[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: 'last7' },
  { label: 'Last 30 days', value: 'last30' },
  { label: 'This month', value: 'thisMonth' },
  { label: 'Last month', value: 'lastMonth' },
]

export const PLATFORM_OPTIONS = [
  { id: 'google_ads', label: 'Google Ads', icon: 'logos:google-ads' },
  { id: 'facebook_ads', label: 'Facebook Ads', icon: 'logos:facebook' },
  { id: 'google_analytics', label: 'Google Analytics', icon: 'logos:google-analytics' },
]

export function useExplorer() {
  // State
  const metrics = useState<ExplorerMetrics | null>('explorer-metrics', () => null)
  const isLoading = useState<boolean>('explorer-loading', () => false)
  const error = useState<string | null>('explorer-error', () => null)

  // Filters
  const dateRange = useState<{ start: string; end: string }>('explorer-date-range', () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return {
      start: start.toISOString().split('T')[0] || '',
      end: end.toISOString().split('T')[0] || '',
    }
  })

  const selectedPlatforms = useState<string[]>('explorer-platforms', () => [])
  const selectedClientId = useState<string | null>('explorer-client', () => null)
  const compareEnabled = useState<boolean>('explorer-compare', () => true)
  const selectedPreset = useState<string>('explorer-preset', () => 'last7')

  // Computed
  const hasData = computed(() => {
    return metrics.value && Object.keys(metrics.value.totals).length > 0
  })

  const totalSpend = computed(() => metrics.value?.totals.spend || 0)
  const totalClicks = computed(() => metrics.value?.totals.clicks || 0)
  const totalConversions = computed(() => metrics.value?.totals.conversions || 0)
  const totalRoas = computed(() => metrics.value?.totals.roas || 0)

  const previousSpend = computed(() => metrics.value?.previousTotals.spend || 0)
  const previousClicks = computed(() => metrics.value?.previousTotals.clicks || 0)
  const previousConversions = computed(() => metrics.value?.previousTotals.conversions || 0)
  const previousRoas = computed(() => metrics.value?.previousTotals.roas || 0)

  // Actions
  function setDatePreset(preset: string) {
    selectedPreset.value = preset
    const end = new Date()
    const start = new Date()

    switch (preset) {
      case 'today':
        break
      case 'yesterday':
        end.setDate(end.getDate() - 1)
        start.setDate(start.getDate() - 1)
        break
      case 'last7':
        start.setDate(start.getDate() - 7)
        break
      case 'last30':
        start.setDate(start.getDate() - 30)
        break
      case 'thisMonth':
        start.setDate(1)
        break
      case 'lastMonth':
        start.setMonth(start.getMonth() - 1)
        start.setDate(1)
        end.setDate(0)
        break
    }

    dateRange.value = {
      start: start.toISOString().split('T')[0] || '',
      end: end.toISOString().split('T')[0] || '',
    }
  }

  async function fetchMetrics() {
    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({
        start: dateRange.value.start,
        end: dateRange.value.end,
        compare: compareEnabled.value.toString(),
      })

      if (selectedPlatforms.value.length > 0) {
        params.append('platforms', selectedPlatforms.value.join(','))
      }

      if (selectedClientId.value) {
        params.append('clientId', selectedClientId.value)
      }

      const response = await $fetch<ExplorerMetrics>(`/api/explorer/metrics?${params.toString()}`)
      metrics.value = response
    }
    catch (e: any) {
      console.error('[Explorer] Failed to fetch metrics:', e)
      error.value = e?.data?.message || 'Failed to load metrics'
    }
    finally {
      isLoading.value = false
    }
  }

  function exportCSV() {
    if (!metrics.value) return

    const rows: string[] = []

    // Header
    rows.push('Date,Platform,Spend,Impressions,Clicks,CTR,Conversions,CPA,ROAS')

    // Data rows by date (aggregated across all platforms)
    for (const { date, metrics: m } of metrics.value.byDate) {
      // Aggregate row
      rows.push([
        date,
        'All Platforms',
        (m.spend || 0).toFixed(2),
        Math.round(m.impressions || 0),
        Math.round(m.clicks || 0),
        `${(m.ctr || 0).toFixed(2)}%`,
        Math.round(m.conversions || 0),
        (m.costPerConversion || 0).toFixed(2),
        (m.roas || 0).toFixed(2),
      ].join(','))
    }

    // Create and download file
    const csvContent = rows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `metrics-export-${dateRange.value.start}-to-${dateRange.value.end}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function togglePlatform(platformId: string) {
    const index = selectedPlatforms.value.indexOf(platformId)
    if (index === -1) {
      selectedPlatforms.value.push(platformId)
    }
    else {
      selectedPlatforms.value.splice(index, 1)
    }
  }

  function clearFilters() {
    selectedPlatforms.value = []
    selectedClientId.value = null
    setDatePreset('last7')
  }

  // Calculate change percentage
  function calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  return {
    // State
    metrics: readonly(metrics),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Filters
    dateRange,
    selectedPlatforms,
    selectedClientId,
    compareEnabled,
    selectedPreset,

    // Computed
    hasData,
    totalSpend,
    totalClicks,
    totalConversions,
    totalRoas,
    previousSpend,
    previousClicks,
    previousConversions,
    previousRoas,

    // Actions
    fetchMetrics,
    setDatePreset,
    exportCSV,
    togglePlatform,
    clearFilters,
    calculateChange,
  }
}
