// ============================================
// Facebook Ads Adapter
// ============================================
// Transforma respuestas de Facebook Marketing API
// a formato canónico.

import type { CanonicalMetric } from '@tamarindo/types'
import type {
  PlatformAdapter,
  RawApiResponse,
  DateRange,
  FacebookAdsInsight,
} from './types'
import {
  createEmptyCanonicalMetric,
  calculateDerivedMetrics,
} from './types'

/**
 * Mapeo de campos Facebook a nombres canónicos
 */
const FACEBOOK_TO_CANONICAL: Record<string, string> = {
  impressions: 'impressions',
  clicks: 'clicks',
  spend: 'spend',
  reach: 'reach',
  frequency: 'frequency',
  ctr: 'ctr',
  cpc: 'cpc',
  cpm: 'cpm',
}

/**
 * Tipos de acciones que cuentan como conversiones
 */
const CONVERSION_ACTION_TYPES = [
  'purchase',
  'lead',
  'complete_registration',
  'add_to_cart',
  'initiate_checkout',
  'subscribe',
  'contact',
  'submit_application',
  'schedule',
]

/**
 * Tipos de acciones que tienen valor monetario
 */
const VALUE_ACTION_TYPES = [
  'purchase',
  'omni_purchase',
]

/**
 * Adaptador para Facebook Ads
 * Normaliza respuestas de Marketing API a métricas canónicas
 */
export class FacebookAdsAdapter implements PlatformAdapter {
  readonly source = 'facebook_ads' as const
  readonly displayName = 'Facebook Ads'

  /**
   * Normaliza respuesta de Facebook Ads API a métricas canónicas
   */
  normalize(raw: RawApiResponse, _dateRange: DateRange): CanonicalMetric[] {
    const insights = raw.data as FacebookAdsInsight[]
    const { accountId, currency } = raw.metadata

    if (!Array.isArray(insights)) {
      console.warn('[FacebookAdsAdapter] Expected array of insights, got:', typeof raw.data)
      return []
    }

    const metrics: CanonicalMetric[] = []

    for (const insight of insights) {
      // Facebook retorna date_start como la fecha del día
      const date = insight.date_start
      if (!date) continue

      // Crear métrica base
      const metric = createEmptyCanonicalMetric(
        'facebook_ads',
        accountId,
        date,
        currency,
      )

      // Métricas base (Facebook retorna spend directamente, no en micros)
      metric.impressions = this.toNumber(insight.impressions)
      metric.clicks = this.toNumber(insight.clicks)
      metric.spend = this.toNumber(insight.spend)

      // Métricas específicas de Facebook
      const reach = this.toNumber(insight.reach)
      if (reach > 0) {
        metric.reach = reach
      }

      // Extraer conversiones del array de actions
      if (insight.actions && Array.isArray(insight.actions)) {
        metric.conversions = this.extractConversions(insight.actions)
      }

      // Extraer valor de conversiones del array de action_values
      if (insight.action_values && Array.isArray(insight.action_values)) {
        metric.conversionValue = this.extractConversionValue(insight.action_values)
      }

      // Guardar datos originales para debug
      metric.originalData = insight

      // Calcular métricas derivadas
      metrics.push(calculateDerivedMetrics(metric))
    }

    // Ordenar por fecha
    return metrics.sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Retorna el mapeo de campos Facebook → canónico
   */
  getMetricMapping(): Record<string, string> {
    return { ...FACEBOOK_TO_CANONICAL }
  }

  /**
   * Valida que los datos tienen estructura de Facebook Ads
   */
  validate(raw: unknown): boolean {
    if (!Array.isArray(raw)) return false
    if (raw.length === 0) return true // Array vacío es válido

    // Verificar que al menos el primer elemento tiene la estructura esperada
    const first = raw[0]
    return (
      typeof first === 'object'
      && first !== null
      && ('date_start' in first || 'impressions' in first)
    )
  }

  /**
   * Extrae el total de conversiones del array de actions
   */
  private extractConversions(actions: Array<{ action_type: string, value: string | number }>): number {
    return actions
      .filter(action => CONVERSION_ACTION_TYPES.includes(action.action_type))
      .reduce((sum, action) => sum + this.toNumber(action.value), 0)
  }

  /**
   * Extrae el valor total de conversiones del array de action_values
   */
  private extractConversionValue(actionValues: Array<{ action_type: string, value: string | number }>): number {
    return actionValues
      .filter(av => VALUE_ACTION_TYPES.includes(av.action_type))
      .reduce((sum, av) => sum + this.toNumber(av.value), 0)
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
export function createFacebookAdsAdapter(): FacebookAdsAdapter {
  return new FacebookAdsAdapter()
}
