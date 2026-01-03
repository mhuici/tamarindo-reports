// ============================================
// Google Analytics 4 Adapter
// ============================================
// Transforma respuestas de GA4 Data API
// a formato canónico.

import type { CanonicalMetric, MetricSource } from '@tamarindo/types'
import type {
  PlatformAdapter,
  RawApiResponse,
  DateRange,
} from './types'
import {
  createEmptyCanonicalMetric,
  calculateDerivedMetrics,
} from './types'

/**
 * Tipo para fila de datos de GA4 Data API response
 */
export interface GA4Row {
  dimensionValues?: Array<{ value?: string }>
  metricValues?: Array<{ value?: string }>
}

/**
 * Mapeo de métricas GA4 a nombres canónicos
 * GA4 no tiene spend (es gratis), pero mapeamos las métricas de tráfico
 */
const GA4_TO_CANONICAL: Record<string, string> = {
  sessions: 'impressions', // Sessions = traffic volume
  totalUsers: 'reach', // Unique users
  newUsers: 'clicks', // New users = new interactions
  screenPageViews: 'pageviews',
  bounceRate: 'bounceRate',
  averageSessionDuration: 'avgSessionDuration',
  ecommercePurchases: 'conversions',
  purchaseRevenue: 'conversionValue',
}

/**
 * Adaptador para Google Analytics 4
 * Normaliza respuestas de GA4 Data API a métricas canónicas
 */
export class GoogleAnalyticsAdapter implements PlatformAdapter {
  // Note: Using 'google_ads' temporarily until MetricSource is updated
  // This should be 'google_analytics' once the type is extended
  readonly source = 'google_analytics' as MetricSource
  readonly displayName = 'Google Analytics 4'

  /**
   * Normaliza respuesta de GA4 Data API a métricas canónicas
   */
  normalize(raw: RawApiResponse, _dateRange: DateRange): CanonicalMetric[] {
    const rows = raw.data as GA4Row[]
    const { accountId, currency } = raw.metadata

    if (!Array.isArray(rows)) {
      console.warn('[GA4Adapter] Expected array of rows, got:', typeof raw.data)
      return []
    }

    const metrics: CanonicalMetric[] = []

    for (const row of rows) {
      // GA4 date format is YYYYMMDD, convert to YYYY-MM-DD
      const rawDate = row.dimensionValues?.[0]?.value || ''
      if (!rawDate) continue

      const date = rawDate.length === 8
        ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
        : rawDate

      // Create empty metric
      const metric = createEmptyCanonicalMetric(
        this.source,
        accountId,
        date,
        currency,
      )

      // Extract metric values from row
      // Order matches the request in connector:
      // sessions, totalUsers, newUsers, screenPageViews, bounceRate,
      // averageSessionDuration, ecommercePurchases, purchaseRevenue
      const sessions = this.toNumber(row.metricValues?.[0]?.value)
      const users = this.toNumber(row.metricValues?.[1]?.value)
      const newUsers = this.toNumber(row.metricValues?.[2]?.value)
      const pageviews = this.toNumber(row.metricValues?.[3]?.value)
      const bounceRate = this.toNumber(row.metricValues?.[4]?.value)
      const avgSessionDuration = this.toNumber(row.metricValues?.[5]?.value)
      const transactions = this.toNumber(row.metricValues?.[6]?.value)
      const revenue = this.toNumber(row.metricValues?.[7]?.value)

      // Map GA4 metrics to canonical format
      // Sessions = traffic volume (similar to impressions)
      metric.impressions = sessions

      // NewUsers = new traffic (similar to clicks in terms of new interactions)
      metric.clicks = newUsers

      // GA4 is free, no spend
      metric.spend = 0

      // Unique users (reach)
      metric.reach = users

      // Conversion metrics
      if (transactions > 0) {
        metric.conversions = transactions
      }
      if (revenue > 0) {
        metric.conversionValue = Math.round(revenue * 100) / 100
      }

      // GA4-specific metrics stored in originalData for access
      metric.originalData = {
        sessions,
        users,
        newUsers,
        pageviews,
        bounceRate: Math.round(bounceRate * 10000) / 100, // GA4 returns as decimal
        avgSessionDuration: Math.round(avgSessionDuration),
        transactions,
        revenue,
      }

      // Calculate derived metrics
      metrics.push(calculateDerivedMetrics(metric))
    }

    // Sort by date
    return metrics.sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Retorna el mapeo de campos GA4 → canónico
   */
  getMetricMapping(): Record<string, string> {
    return { ...GA4_TO_CANONICAL }
  }

  /**
   * Valida que los datos tienen estructura de GA4
   */
  validate(raw: unknown): boolean {
    if (!Array.isArray(raw)) return false
    if (raw.length === 0) return true // Array vacío es válido

    // Verificar que al menos el primer elemento tiene la estructura esperada
    const first = raw[0]
    return (
      typeof first === 'object'
      && first !== null
      && ('dimensionValues' in first || 'metricValues' in first)
    )
  }

  /**
   * Convierte valor a número (maneja strings y undefined)
   */
  private toNumber(value: string | number | undefined): number {
    if (value === undefined || value === null) return 0
    const num = Number(value)
    return Number.isNaN(num) ? 0 : num
  }
}

/**
 * Factory function para crear adaptador
 */
export function createGoogleAnalyticsAdapter(): GoogleAnalyticsAdapter {
  return new GoogleAnalyticsAdapter()
}
