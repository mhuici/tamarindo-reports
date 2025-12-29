/**
 * Composable for AI-powered narrative generation
 */

import { useState } from '#imports'

type NarrativeType = 'executive-summary' | 'widget-insight' | 'recommendation' | 'alert'
type NarrativeTone = 'professional' | 'casual' | 'technical' | 'bold'
type NarrativeLanguage = 'es' | 'en' | 'pt'

interface MetricData {
  name: string
  label: string
  value: number
  previousValue?: number
  changePercent?: number
  format?: 'number' | 'currency' | 'percent'
}

interface NarrativeContext {
  clientName: string
  industry?: string
  platform?: string
  period?: string
  goals?: Array<{ metric: string; target: number; achieved?: boolean }>
}

interface NarrativeResult {
  type: NarrativeType
  narrative: string
  tokensUsed?: number
  cached?: boolean
  /** True if this result was generated from mock data (no AI API call) */
  isFallback?: boolean
}

interface DashboardNarratives {
  executiveSummary: NarrativeResult
  recommendations: NarrativeResult
  alerts: NarrativeResult[]
}

export function useNarrative() {
  const cache = useState<Map<string, NarrativeResult>>('narrative-cache', () => new Map())
  const loading = useState<Map<string, boolean>>('narrative-loading', () => new Map())
  const errors = useState<Map<string, string>>('narrative-errors', () => new Map())

  /**
   * Generate cache key
   */
  function getCacheKey(type: NarrativeType, context: NarrativeContext, metrics?: MetricData[]): string {
    const metricsHash = metrics ? metrics.map(m => `${m.name}:${m.value}`).join(',') : ''
    return `${type}-${context.clientName}-${metricsHash}`
  }

  /**
   * Generate executive summary
   */
  async function generateExecutiveSummary(
    metrics: MetricData[],
    context: NarrativeContext,
    options: { tone?: NarrativeTone; language?: NarrativeLanguage } = {},
  ): Promise<NarrativeResult | null> {
    const cacheKey = getCacheKey('executive-summary', context, metrics)

    if (cache.value.has(cacheKey)) {
      return cache.value.get(cacheKey)!
    }

    loading.value.set(cacheKey, true)
    errors.value.delete(cacheKey)

    try {
      const response = await $fetch<{ success: boolean; result: NarrativeResult }>('/api/ai/narrative', {
        method: 'POST',
        body: {
          type: 'executive-summary',
          metrics,
          context,
          tone: options.tone || 'professional',
          language: options.language || 'es',
        },
      })

      if (response.success && response.result) {
        cache.value.set(cacheKey, response.result)
        return response.result
      }

      return null
    }
    catch (error: any) {
      console.error('Executive summary generation failed:', error)
      errors.value.set(cacheKey, error?.message || 'Failed to generate summary')
      return null
    }
    finally {
      loading.value.set(cacheKey, false)
    }
  }

  /**
   * Generate widget insight
   */
  async function generateWidgetInsight(
    metric: MetricData,
    context: NarrativeContext,
    correlatedMetrics?: MetricData[],
    options: { tone?: NarrativeTone; language?: NarrativeLanguage } = {},
  ): Promise<NarrativeResult | null> {
    const cacheKey = getCacheKey('widget-insight', context, [metric])

    if (cache.value.has(cacheKey)) {
      return cache.value.get(cacheKey)!
    }

    loading.value.set(cacheKey, true)

    try {
      const response = await $fetch<{ success: boolean; result: NarrativeResult }>('/api/ai/narrative', {
        method: 'POST',
        body: {
          type: 'widget-insight',
          metric,
          correlatedMetrics,
          context,
          tone: options.tone || 'professional',
          language: options.language || 'es',
        },
      })

      if (response.success && response.result) {
        cache.value.set(cacheKey, response.result)
        return response.result
      }

      return null
    }
    catch (error: any) {
      console.error('Widget insight generation failed:', error)
      return null
    }
    finally {
      loading.value.set(cacheKey, false)
    }
  }

  /**
   * Generate recommendation
   */
  async function generateRecommendation(
    metrics: MetricData[],
    issues: string[],
    context: NarrativeContext,
    options: { tone?: NarrativeTone; language?: NarrativeLanguage } = {},
  ): Promise<NarrativeResult | null> {
    const cacheKey = getCacheKey('recommendation', context, metrics)

    if (cache.value.has(cacheKey)) {
      return cache.value.get(cacheKey)!
    }

    loading.value.set(cacheKey, true)

    try {
      const response = await $fetch<{ success: boolean; result: NarrativeResult }>('/api/ai/narrative', {
        method: 'POST',
        body: {
          type: 'recommendation',
          metrics,
          issues,
          context,
          tone: options.tone || 'professional',
          language: options.language || 'es',
        },
      })

      if (response.success && response.result) {
        cache.value.set(cacheKey, response.result)
        return response.result
      }

      return null
    }
    catch (error: any) {
      console.error('Recommendation generation failed:', error)
      return null
    }
    finally {
      loading.value.set(cacheKey, false)
    }
  }

  /**
   * Generate alert
   */
  async function generateAlert(
    metric: MetricData,
    context: NarrativeContext,
    options: { tone?: NarrativeTone; language?: NarrativeLanguage; severity?: 'low' | 'medium' | 'high' | 'critical' } = {},
  ): Promise<NarrativeResult | null> {
    const cacheKey = getCacheKey('alert', context, [metric])

    loading.value.set(cacheKey, true)

    try {
      const response = await $fetch<{ success: boolean; result: NarrativeResult }>('/api/ai/narrative', {
        method: 'POST',
        body: {
          type: 'alert',
          metric,
          context,
          tone: options.tone || 'professional',
          language: options.language || 'es',
          severity: options.severity,
        },
      })

      if (response.success && response.result) {
        return response.result
      }

      return null
    }
    catch (error: any) {
      console.error('Alert generation failed:', error)
      return null
    }
    finally {
      loading.value.set(cacheKey, false)
    }
  }

  /**
   * Generate all narratives for a dashboard
   */
  async function generateDashboardNarratives(
    metrics: MetricData[],
    context: NarrativeContext,
    options: { tone?: NarrativeTone; language?: NarrativeLanguage } = {},
  ): Promise<DashboardNarratives | null> {
    const cacheKey = `dashboard-${context.clientName}`

    loading.value.set(cacheKey, true)

    try {
      const response = await $fetch<{
        success: boolean
        executiveSummary: NarrativeResult
        recommendations: NarrativeResult
        alerts: NarrativeResult[]
      }>('/api/ai/narrative', {
        method: 'POST',
        body: {
          mode: 'dashboard',
          metrics,
          context,
          tone: options.tone || 'professional',
          language: options.language || 'es',
        },
      })

      if (response.success) {
        return {
          executiveSummary: response.executiveSummary,
          recommendations: response.recommendations,
          alerts: response.alerts,
        }
      }

      return null
    }
    catch (error: any) {
      console.error('Dashboard narratives generation failed:', error)
      return null
    }
    finally {
      loading.value.set(cacheKey, false)
    }
  }

  /**
   * Check if loading
   */
  function isLoading(key: string): boolean {
    return loading.value.get(key) || false
  }

  /**
   * Get error
   */
  function getError(key: string): string | undefined {
    return errors.value.get(key)
  }

  /**
   * Clear cache
   */
  function clearCache(): void {
    cache.value.clear()
    loading.value.clear()
    errors.value.clear()
  }

  return {
    generateExecutiveSummary,
    generateWidgetInsight,
    generateRecommendation,
    generateAlert,
    generateDashboardNarratives,
    isLoading,
    getError,
    clearCache,
  }
}
