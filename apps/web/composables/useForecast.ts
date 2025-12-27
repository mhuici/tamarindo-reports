/**
 * Composable for metric forecasting
 */

import { useState } from '#imports'
import { forecast as hwForecast, generateDates, type ForecastResult, type ForecastOptions } from '../utils/forecasting/holt-winters'

interface ForecastInput {
  data: number[]
  dates?: string[]
  metricName?: string
  metricLabel?: string
  options?: ForecastOptions
}

export function useForecast() {
  const cache = useState<Map<string, ForecastResult>>('forecast-cache', () => new Map())
  const loading = useState<Map<string, boolean>>('forecast-loading', () => new Map())

  /**
   * Generate cache key
   */
  function getCacheKey(input: ForecastInput): string {
    return `${input.metricName || 'metric'}-${input.data.slice(-7).join(',')}`
  }

  /**
   * Generate forecast locally (no API call needed)
   */
  function forecastLocal(input: ForecastInput): ForecastResult {
    const dates = input.dates || generateDates(input.data.length)
    return hwForecast(input.data, dates, input.options)
  }

  /**
   * Generate forecast via API (useful for server-side generation)
   */
  async function forecastAPI(input: ForecastInput): Promise<ForecastResult | null> {
    const cacheKey = getCacheKey(input)

    // Return cached result if available
    if (cache.value.has(cacheKey)) {
      return cache.value.get(cacheKey)!
    }

    loading.value.set(cacheKey, true)

    try {
      const response = await $fetch<{ success: boolean; forecast: ForecastResult }>('/api/ai/forecast', {
        method: 'POST',
        body: input,
      })

      if (response.success && response.forecast) {
        cache.value.set(cacheKey, response.forecast)
        return response.forecast
      }

      return null
    }
    catch (error) {
      console.error('Forecast API error:', error)
      // Fallback to local calculation
      return forecastLocal(input)
    }
    finally {
      loading.value.set(cacheKey, false)
    }
  }

  /**
   * Check if a forecast is loading
   */
  function isLoading(input: ForecastInput): boolean {
    const cacheKey = getCacheKey(input)
    return loading.value.get(cacheKey) || false
  }

  /**
   * Get cached forecast
   */
  function getCached(input: ForecastInput): ForecastResult | undefined {
    const cacheKey = getCacheKey(input)
    return cache.value.get(cacheKey)
  }

  /**
   * Clear cache
   */
  function clearCache(): void {
    cache.value.clear()
    loading.value.clear()
  }

  /**
   * Generate sample data for testing
   */
  function generateSampleData(days: number = 30, baseValue: number = 1000, trend: number = 10, noise: number = 100): { data: number[]; dates: string[] } {
    const data: number[] = []
    const dates = generateDates(days)

    for (let i = 0; i < days; i++) {
      // Base value + linear trend + weekly seasonality + random noise
      const trendComponent = (i / days) * trend * baseValue / 100
      const seasonality = Math.sin((i % 7) * Math.PI / 3.5) * baseValue * 0.1
      const randomNoise = (Math.random() - 0.5) * noise

      data.push(Math.max(0, baseValue + trendComponent + seasonality + randomNoise))
    }

    return { data, dates }
  }

  return {
    forecastLocal,
    forecastAPI,
    isLoading,
    getCached,
    clearCache,
    generateSampleData,
    generateDates,
  }
}
