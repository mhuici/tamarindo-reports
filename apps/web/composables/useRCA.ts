/**
 * Composable for Root Cause Analysis (RCA)
 * Analyzes significant metric changes and provides insights
 */

import { useState } from '#imports'

interface RCACause {
  factor: string
  explanation: string
  confidence: number
  action?: string
}

interface RCAResult {
  metric: string
  metricLabel: string
  change: {
    value: number
    percentage: number
    direction: 'up' | 'down'
  }
  causes: RCACause[]
  summary: string
  tokensUsed?: number
}

interface RCAContext {
  clientName: string
  industry?: string
  platform: string
  dateRange: { start: string; end: string }
}

interface MetricInput {
  metricName: string
  metricLabel: string
  currentValue: number
  previousValue: number
}

// Minimum change percentage to trigger RCA
const SIGNIFICANT_CHANGE_THRESHOLD = 10

export function useRCA() {
  const cache = useState<Map<string, RCAResult>>('rca-cache', () => new Map())
  const loading = useState<Map<string, boolean>>('rca-loading', () => new Map())
  const errors = useState<Map<string, string>>('rca-errors', () => new Map())

  /**
   * Check if a metric change is significant enough for RCA
   */
  function isSignificantChange(currentValue: number, previousValue: number): boolean {
    if (previousValue === 0) return currentValue > 0
    const changePercent = Math.abs(((currentValue - previousValue) / previousValue) * 100)
    return changePercent >= SIGNIFICANT_CHANGE_THRESHOLD
  }

  /**
   * Generate a cache key for a metric
   */
  function getCacheKey(metric: MetricInput, context: RCAContext): string {
    return `${context.clientName}-${metric.metricName}-${metric.currentValue}-${metric.previousValue}`
  }

  /**
   * Analyze a single metric change
   */
  async function analyzeMetric(
    metric: MetricInput,
    context: RCAContext,
    correlatedMetrics?: MetricInput[],
  ): Promise<RCAResult | null> {
    const cacheKey = getCacheKey(metric, context)

    // Return cached result if available
    if (cache.value.has(cacheKey)) {
      return cache.value.get(cacheKey)!
    }

    // Check if change is significant
    if (!isSignificantChange(metric.currentValue, metric.previousValue)) {
      return null
    }

    // Set loading state
    loading.value.set(cacheKey, true)
    errors.value.delete(cacheKey)

    try {
      const response = await $fetch<{ success: boolean; result: RCAResult }>('/api/ai/rca', {
        method: 'POST',
        body: {
          metric: metric.metricName,
          metricLabel: metric.metricLabel,
          currentValue: metric.currentValue,
          previousValue: metric.previousValue,
          context,
          correlatedMetrics: correlatedMetrics?.map(m => ({
            name: m.metricName,
            label: m.metricLabel,
            currentValue: m.currentValue,
            previousValue: m.previousValue,
          })),
        },
      })

      if (response.success && response.result) {
        cache.value.set(cacheKey, response.result)
        return response.result
      }

      return null
    }
    catch (error: any) {
      console.error('RCA analysis failed:', error)
      errors.value.set(cacheKey, error?.message || 'Failed to analyze metric')
      return null
    }
    finally {
      loading.value.set(cacheKey, false)
    }
  }

  /**
   * Analyze multiple metrics in batch
   */
  async function analyzeMetrics(
    metrics: MetricInput[],
    context: RCAContext,
  ): Promise<RCAResult[]> {
    // Filter to only significant changes
    const significantMetrics = metrics.filter(m =>
      isSignificantChange(m.currentValue, m.previousValue),
    )

    if (significantMetrics.length === 0) {
      return []
    }

    try {
      const response = await $fetch<{ success: boolean; results: RCAResult[] }>('/api/ai/rca', {
        method: 'POST',
        body: {
          mode: 'batch',
          metrics: significantMetrics,
          context,
        },
      })

      if (response.success && response.results) {
        // Cache each result
        response.results.forEach((result) => {
          const metric = significantMetrics.find(m => m.metricName === result.metric)
          if (metric) {
            const cacheKey = getCacheKey(metric, context)
            cache.value.set(cacheKey, result)
          }
        })

        return response.results
      }

      return []
    }
    catch (error: any) {
      console.error('Batch RCA analysis failed:', error)
      return []
    }
  }

  /**
   * Check if an analysis is in progress
   */
  function isLoading(metric: MetricInput, context: RCAContext): boolean {
    const cacheKey = getCacheKey(metric, context)
    return loading.value.get(cacheKey) || false
  }

  /**
   * Get error for a metric analysis
   */
  function getError(metric: MetricInput, context: RCAContext): string | undefined {
    const cacheKey = getCacheKey(metric, context)
    return errors.value.get(cacheKey)
  }

  /**
   * Get cached result for a metric
   */
  function getCachedResult(metric: MetricInput, context: RCAContext): RCAResult | undefined {
    const cacheKey = getCacheKey(metric, context)
    return cache.value.get(cacheKey)
  }

  /**
   * Clear all cached results
   */
  function clearCache(): void {
    cache.value.clear()
    loading.value.clear()
    errors.value.clear()
  }

  return {
    analyzeMetric,
    analyzeMetrics,
    isSignificantChange,
    isLoading,
    getError,
    getCachedResult,
    clearCache,
    SIGNIFICANT_CHANGE_THRESHOLD,
  }
}
