import { ref, computed } from 'vue'
import { useState } from '#imports'

export interface WidgetPreviewData {
  value?: number
  previousValue?: number
  data?: Array<{ label: string; value: number }>
  columns?: Array<{ key: string; label: string; format?: string }>
  rows?: Array<Record<string, any>>
}

interface CachedPreview {
  data: WidgetPreviewData
  timestamp: number
}

// Cache TTL: 30 seconds for preview data
const CACHE_TTL = 30 * 1000

export function useWidgetPreview(reportId: string) {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Use useState for SSR-safe caching
  const previewCache = useState<Record<string, CachedPreview>>(`widget-preview-${reportId}`, () => ({}))

  // Generate cache key from widget config
  function getCacheKey(widgetType: string, metric: string | string[]): string {
    const metricStr = Array.isArray(metric) ? metric.join(',') : metric
    return `${widgetType}-${metricStr}`
  }

  // Check if cache is still valid
  function isCacheValid(key: string): boolean {
    const cached = previewCache.value[key]
    if (!cached) return false
    return Date.now() - cached.timestamp < CACHE_TTL
  }

  // Fetch preview data for a widget
  async function fetchPreviewData(
    widgetType: string,
    metric: string | string[],
  ): Promise<WidgetPreviewData | null> {
    const cacheKey = getCacheKey(widgetType, metric)

    // Return cached data if valid
    if (isCacheValid(cacheKey)) {
      return previewCache.value[cacheKey].data
    }

    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({
        widgetType,
      })

      if (Array.isArray(metric)) {
        params.append('metrics', metric.join(','))
      }
      else {
        params.append('metric', metric)
      }

      const response = await $fetch<{
        success: boolean
        data: WidgetPreviewData
        dateRange: { start: string; end: string }
        clientName: string
      }>(`/api/reports/${reportId}/widget-data?${params.toString()}`)

      if (response.success && response.data) {
        // Cache the result
        previewCache.value[cacheKey] = {
          data: response.data,
          timestamp: Date.now(),
        }
        return response.data
      }

      return null
    }
    catch (e: any) {
      console.error('[WidgetPreview] Failed to fetch:', e)
      error.value = e?.data?.message || 'Failed to load preview data'
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  // Clear cache (useful when date range changes)
  function clearCache() {
    previewCache.value = {}
  }

  // Get cached data without fetching
  function getCachedData(widgetType: string, metric: string | string[]): WidgetPreviewData | null {
    const cacheKey = getCacheKey(widgetType, metric)
    if (isCacheValid(cacheKey)) {
      return previewCache.value[cacheKey].data
    }
    return null
  }

  return {
    isLoading,
    error,
    fetchPreviewData,
    getCachedData,
    clearCache,
  }
}

// Format helpers for widget display
export function formatMetricValue(value: number | undefined, format: string = 'number'): string {
  if (value === undefined || value === null) return '--'

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    default:
      return new Intl.NumberFormat('en-US').format(Math.round(value))
  }
}

export function getMetricFormat(metricKey: string): string {
  const currencyMetrics = ['spend', 'cost', 'cpc', 'cpm', 'costPerConversion', 'conversionValue']
  const percentMetrics = ['ctr', 'conversionRate', 'roas']

  if (currencyMetrics.includes(metricKey)) return 'currency'
  if (percentMetrics.includes(metricKey)) return 'percent'
  return 'number'
}
