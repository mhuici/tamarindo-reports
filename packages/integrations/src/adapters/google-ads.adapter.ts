// ============================================
// Google Ads Adapter
// ============================================
// Transforma respuestas de Google Ads API (GAQL)
// a formato canónico.

import type { CanonicalMetric } from '@tamarindo/types'
import type {
  PlatformAdapter,
  RawApiResponse,
  DateRange,
  GoogleAdsRow,
} from './types'
import {
  createEmptyCanonicalMetric,
  calculateDerivedMetrics,
} from './types'

/**
 * Mapeo de campos GAQL a nombres canónicos
 */
const GOOGLE_TO_CANONICAL: Record<string, string> = {
  'metrics.impressions': 'impressions',
  'metrics.clicks': 'clicks',
  'metrics.cost_micros': 'spend',
  'metrics.conversions': 'conversions',
  'metrics.conversions_value': 'conversionValue',
  'metrics.video_views': 'videoViews',
  'metrics.ctr': 'ctr',
  'metrics.average_cpc': 'cpc',
}

/**
 * Adaptador para Google Ads
 * Normaliza respuestas GAQL a métricas canónicas
 */
export class GoogleAdsAdapter implements PlatformAdapter {
  readonly source = 'google_ads' as const
  readonly displayName = 'Google Ads'

  /**
   * Normaliza respuesta de Google Ads API a métricas canónicas
   */
  normalize(raw: RawApiResponse, _dateRange: DateRange): CanonicalMetric[] {
    const rows = raw.data as GoogleAdsRow[]
    const { accountId, currency } = raw.metadata

    if (!Array.isArray(rows)) {
      console.warn('[GoogleAdsAdapter] Expected array of rows, got:', typeof raw.data)
      return []
    }

    // Agrupar por fecha (suma de todas las campañas)
    const byDate = new Map<string, CanonicalMetric>()

    for (const row of rows) {
      const date = row.segments?.date
      if (!date) continue

      // Obtener o crear métrica para esta fecha
      const existing = byDate.get(date) || createEmptyCanonicalMetric(
        'google_ads',
        accountId,
        date,
        currency,
      )

      // Sumar métricas base
      existing.impressions += this.toNumber(row.metrics?.impressions)
      existing.clicks += this.toNumber(row.metrics?.clicks)

      // Google retorna cost en micros (millonésimas de unidad monetaria)
      existing.spend += this.toNumber(row.metrics?.cost_micros) / 1_000_000

      // Conversiones
      const conversions = this.toNumber(row.metrics?.conversions)
      if (conversions > 0) {
        existing.conversions = (existing.conversions || 0) + conversions
      }

      const conversionValue = this.toNumber(row.metrics?.conversions_value)
      if (conversionValue > 0) {
        existing.conversionValue = (existing.conversionValue || 0) + conversionValue
      }

      // Video views
      const videoViews = this.toNumber(row.metrics?.video_views)
      if (videoViews > 0) {
        existing.videoViews = (existing.videoViews || 0) + videoViews
      }

      // Guardar datos originales para debug (último row)
      existing.originalData = row

      byDate.set(date, existing)
    }

    // Calcular métricas derivadas y ordenar por fecha
    const metrics = Array.from(byDate.values())
      .map(m => calculateDerivedMetrics(m))
      .sort((a, b) => a.date.localeCompare(b.date))

    return metrics
  }

  /**
   * Retorna el mapeo de campos Google → canónico
   */
  getMetricMapping(): Record<string, string> {
    return { ...GOOGLE_TO_CANONICAL }
  }

  /**
   * Valida que los datos tienen estructura de Google Ads
   */
  validate(raw: unknown): boolean {
    if (!Array.isArray(raw)) return false
    if (raw.length === 0) return true // Array vacío es válido

    // Verificar que al menos el primer elemento tiene la estructura esperada
    const first = raw[0]
    return (
      typeof first === 'object'
      && first !== null
      && ('segments' in first || 'metrics' in first)
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
export function createGoogleAdsAdapter(): GoogleAdsAdapter {
  return new GoogleAdsAdapter()
}
