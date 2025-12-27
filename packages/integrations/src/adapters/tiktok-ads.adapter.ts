// ============================================
// TikTok Ads Adapter
// ============================================
// Transforma respuestas de TikTok Marketing API
// a formato canónico.

import type { CanonicalMetric } from '@tamarindo/types'
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
 * Tipo para datos de TikTok Ads API
 * Basado en: https://business-api.tiktok.com/portal/docs?id=1738864915188737
 */
export interface TikTokAdsMetrics {
  stat_time_day: string // YYYY-MM-DD
  metrics: {
    spend?: string | number
    impressions?: string | number
    clicks?: string | number
    conversion?: string | number
    total_purchase_value?: string | number
    video_views_p100?: string | number // Video completions
    reach?: string | number
    frequency?: string | number
    ctr?: string | number
    cpc?: string | number
    cpm?: string | number
    cost_per_conversion?: string | number
  }
  dimensions?: {
    ad_id?: string
    campaign_id?: string
    adgroup_id?: string
  }
}

/**
 * Mapeo de campos TikTok a nombres canónicos
 */
const TIKTOK_TO_CANONICAL: Record<string, string> = {
  spend: 'spend',
  impressions: 'impressions',
  clicks: 'clicks',
  conversion: 'conversions',
  total_purchase_value: 'conversionValue',
  video_views_p100: 'videoViews',
  reach: 'reach',
  frequency: 'frequency',
  ctr: 'ctr',
  cpc: 'cpc',
  cpm: 'cpm',
  cost_per_conversion: 'costPerConversion',
}

/**
 * Adaptador para TikTok Ads
 * Normaliza respuestas de TikTok Marketing API a métricas canónicas
 */
export class TikTokAdsAdapter implements PlatformAdapter {
  readonly source = 'tiktok_ads' as const
  readonly displayName = 'TikTok Ads'

  /**
   * Normaliza respuesta de TikTok Ads API a métricas canónicas
   */
  normalize(raw: RawApiResponse, _dateRange: DateRange): CanonicalMetric[] {
    const data = raw.data as TikTokAdsMetrics[]
    const { accountId, currency } = raw.metadata

    if (!Array.isArray(data)) {
      console.warn('[TikTokAdsAdapter] Expected array of metrics, got:', typeof raw.data)
      return []
    }

    // Agrupar por fecha (suma de todos los anuncios/campañas)
    const byDate = new Map<string, CanonicalMetric>()

    for (const row of data) {
      const date = row.stat_time_day
      if (!date) continue

      // Obtener o crear métrica para esta fecha
      const existing = byDate.get(date) || createEmptyCanonicalMetric(
        'tiktok_ads',
        accountId,
        date,
        currency,
      )

      const m = row.metrics

      // Métricas base - TikTok usa spend directamente (no micros)
      existing.impressions += this.toNumber(m.impressions)
      existing.clicks += this.toNumber(m.clicks)
      existing.spend += this.toNumber(m.spend)

      // Conversiones
      const conversions = this.toNumber(m.conversion)
      if (conversions > 0) {
        existing.conversions = (existing.conversions || 0) + conversions
      }

      const conversionValue = this.toNumber(m.total_purchase_value)
      if (conversionValue > 0) {
        existing.conversionValue = (existing.conversionValue || 0) + conversionValue
      }

      // Video completions (TikTok es video-first)
      const videoViews = this.toNumber(m.video_views_p100)
      if (videoViews > 0) {
        existing.videoViews = (existing.videoViews || 0) + videoViews
      }

      // Reach (usuarios únicos)
      const reach = this.toNumber(m.reach)
      if (reach > 0) {
        // Para reach, tomamos el máximo ya que no se suma
        existing.reach = Math.max(existing.reach || 0, reach)
      }

      // Guardar datos originales para debug
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
   * Retorna el mapeo de campos TikTok → canónico
   */
  getMetricMapping(): Record<string, string> {
    return { ...TIKTOK_TO_CANONICAL }
  }

  /**
   * Valida que los datos tienen estructura de TikTok Ads
   */
  validate(raw: unknown): boolean {
    if (!Array.isArray(raw)) return false
    if (raw.length === 0) return true // Array vacío es válido

    // Verificar que al menos el primer elemento tiene la estructura esperada
    const first = raw[0]
    return (
      typeof first === 'object'
      && first !== null
      && ('stat_time_day' in first || 'metrics' in first)
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
export function createTikTokAdsAdapter(): TikTokAdsAdapter {
  return new TikTokAdsAdapter()
}
