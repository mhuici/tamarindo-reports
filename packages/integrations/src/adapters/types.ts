// ============================================
// Platform Adapter Types
// ============================================
// Interface que deben implementar todos los adaptadores
// para transformar datos de APIs a formato canónico.

import type { CanonicalMetric, MetricSource } from '@tamarindo/types'

/**
 * Metadata de la cuenta de publicidad
 */
export interface AccountMetadata {
  /** ID de la cuenta en la plataforma */
  accountId: string

  /** Nombre de la cuenta (para UI) */
  accountName: string

  /** Moneda de la cuenta (ISO 4217) */
  currency: string

  /** Zona horaria de la cuenta */
  timezone?: string
}

/**
 * Respuesta cruda de una API antes de normalizar
 */
export interface RawApiResponse {
  /** Datos crudos de la API */
  data: unknown

  /** Metadata de la cuenta */
  metadata: AccountMetadata
}

/**
 * Rango de fechas para consultas
 */
export interface DateRange {
  /** Fecha inicio (YYYY-MM-DD) */
  start: string

  /** Fecha fin (YYYY-MM-DD) */
  end: string
}

/**
 * Interface que debe implementar cada adaptador de plataforma
 */
export interface PlatformAdapter {
  /** Identificador de la plataforma */
  readonly source: MetricSource

  /** Nombre para mostrar */
  readonly displayName: string

  /**
   * Transforma respuesta cruda de API a métricas canónicas
   * @param raw - Respuesta cruda de la API con metadata
   * @param dateRange - Rango de fechas solicitado
   * @returns Array de métricas canónicas (una por día)
   */
  normalize(raw: RawApiResponse, dateRange: DateRange): CanonicalMetric[]

  /**
   * Retorna el mapeo de nombres de campos API → canónicos
   */
  getMetricMapping(): Record<string, string>

  /**
   * Valida que los datos crudos tienen la estructura esperada
   * @param raw - Datos crudos a validar
   * @returns true si la estructura es válida
   */
  validate(raw: unknown): boolean
}

/**
 * Tipo para filas de datos de Google Ads (GAQL response)
 */
export interface GoogleAdsRow {
  segments?: {
    date?: string
  }
  metrics?: {
    impressions?: string | number
    clicks?: string | number
    cost_micros?: string | number
    conversions?: string | number
    conversions_value?: string | number
    video_views?: string | number
    ctr?: string | number
    average_cpc?: string | number
  }
  campaign?: {
    id?: string
    name?: string
  }
}

/**
 * Tipo para datos de insights de Facebook Ads
 */
export interface FacebookAdsInsight {
  date_start: string
  date_stop: string
  impressions?: string | number
  clicks?: string | number
  spend?: string | number
  reach?: string | number
  frequency?: string | number
  ctr?: string | number
  cpc?: string | number
  cpm?: string | number
  actions?: Array<{
    action_type: string
    value: string | number
  }>
  action_values?: Array<{
    action_type: string
    value: string | number
  }>
}

/**
 * Helper para crear una métrica canónica vacía
 */
export function createEmptyCanonicalMetric(
  source: MetricSource,
  accountId: string,
  date: string,
  currency: string,
): CanonicalMetric {
  return {
    source,
    accountId,
    date,
    currency,
    impressions: 0,
    clicks: 0,
    spend: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
  }
}

/**
 * Calcula las métricas derivadas a partir de las métricas base
 */
export function calculateDerivedMetrics(metric: CanonicalMetric): CanonicalMetric {
  // CTR: Click-through rate
  metric.ctr = metric.impressions > 0
    ? Math.round((metric.clicks / metric.impressions) * 10000) / 100
    : 0

  // CPC: Cost per click
  metric.cpc = metric.clicks > 0
    ? Math.round((metric.spend / metric.clicks) * 100) / 100
    : 0

  // CPM: Cost per mille
  metric.cpm = metric.impressions > 0
    ? Math.round((metric.spend / metric.impressions) * 100000) / 100
    : 0

  // Conversion rate
  if (metric.conversions !== undefined && metric.conversions > 0) {
    metric.conversionRate = metric.clicks > 0
      ? Math.round((metric.conversions / metric.clicks) * 10000) / 100
      : 0
  }

  // Cost per conversion
  if (metric.conversions !== undefined && metric.conversions > 0) {
    metric.costPerConversion = Math.round((metric.spend / metric.conversions) * 100) / 100
  }

  // ROAS
  if (metric.conversionValue !== undefined && metric.spend > 0) {
    metric.roas = Math.round((metric.conversionValue / metric.spend) * 100) / 100
  }

  // Video view rate
  if (metric.videoViews !== undefined && metric.impressions > 0) {
    metric.videoViewRate = Math.round((metric.videoViews / metric.impressions) * 10000) / 100
  }

  // Frequency (Facebook)
  if (metric.reach !== undefined && metric.reach > 0) {
    metric.frequency = Math.round((metric.impressions / metric.reach) * 100) / 100
  }

  return metric
}
