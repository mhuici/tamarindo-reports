// ============================================
// Canonical Metrics Schema
// ============================================
// Sistema de métricas unificado que normaliza datos
// de múltiples plataformas (Google Ads, Facebook Ads, etc.)
// a un formato canónico fuertemente tipado.

/**
 * Plataformas de publicidad soportadas
 */
export type MetricSource =
  | 'google_ads'
  | 'facebook_ads'
  | 'google_analytics'
  | 'tiktok_ads'
  | 'linkedin_ads'

/**
 * Métricas core - siempre presentes en cualquier plataforma
 */
export interface CanonicalCoreMetrics {
  /** Número de veces que se mostró el anuncio */
  impressions: number

  /** Número de clics en el anuncio */
  clicks: number

  /** Gasto total en la moneda de la cuenta */
  spend: number

  /** Click-through rate: (clicks / impressions) * 100 */
  ctr: number

  /** Costo por clic: spend / clicks */
  cpc: number

  /** Costo por mil impresiones: (spend / impressions) * 1000 */
  cpm: number
}

/**
 * Métricas de conversión - opcionales, dependen de la configuración
 */
export interface CanonicalConversionMetrics {
  /** Número de conversiones (compras, leads, etc.) */
  conversions?: number

  /** Valor monetario de las conversiones */
  conversionValue?: number

  /** Costo por conversión: spend / conversions */
  costPerConversion?: number

  /** Tasa de conversión: (conversions / clicks) * 100 */
  conversionRate?: number

  /** Return on Ad Spend: conversionValue / spend */
  roas?: number
}

/**
 * Métricas específicas de plataforma - no todas las plataformas las tienen
 */
export interface CanonicalPlatformMetrics {
  /** Usuarios únicos alcanzados (Facebook) */
  reach?: number

  /** Promedio de veces que cada usuario vio el anuncio (Facebook) */
  frequency?: number

  /** Reproducciones de video */
  videoViews?: number

  /** Tasa de reproducción de video (videoViews / impressions) * 100 */
  videoViewRate?: number
}

/**
 * Métrica canónica completa
 * Combina identificación + métricas core + opcionales + metadata
 */
export interface CanonicalMetric extends
  CanonicalCoreMetrics,
  CanonicalConversionMetrics,
  CanonicalPlatformMetrics {
  // === Identificación ===

  /** Plataforma de origen */
  source: MetricSource

  /** ID de la cuenta de publicidad */
  accountId: string

  /** Fecha en formato ISO 8601 (YYYY-MM-DD) */
  date: string

  // === Metadata ===

  /** Código de moneda ISO 4217 (USD, EUR, ARS, etc.) */
  currency: string

  /** Datos originales de la API para debug */
  originalData?: unknown
}

/**
 * Resultado de una sincronización de métricas
 */
export interface CanonicalMetricsResult {
  /** Plataforma de origen */
  source: MetricSource

  /** ID de la cuenta */
  accountId: string

  /** Nombre de la cuenta (para UI) */
  accountName: string

  /** Moneda de la cuenta */
  currency: string

  /** Rango de fechas solicitado */
  dateRange: {
    start: string
    end: string
  }

  /** Métricas normalizadas por día */
  metrics: CanonicalMetric[]

  /** Timestamp de sincronización */
  syncedAt: string
}

/**
 * Métricas agregadas para un cliente (suma de todas sus cuentas)
 */
export interface AggregatedCanonicalMetrics {
  /** ID del cliente */
  clientId: string

  /** Rango de fechas */
  dateRange: {
    start: string
    end: string
  }

  /** Totales del período actual */
  totals: CanonicalCoreMetrics & Partial<CanonicalConversionMetrics>

  /** Totales del período anterior (para comparación) */
  previousTotals: CanonicalCoreMetrics & Partial<CanonicalConversionMetrics>

  /** Métricas desglosadas por fecha */
  byDate: Array<{
    date: string
    metrics: CanonicalCoreMetrics & Partial<CanonicalConversionMetrics>
  }>

  /** Métricas desglosadas por fuente/plataforma */
  bySource: Record<MetricSource, CanonicalCoreMetrics & Partial<CanonicalConversionMetrics>>
}

/**
 * Helper type para métricas parciales (útil para agregaciones)
 */
export type PartialCanonicalMetrics = Partial<CanonicalCoreMetrics & CanonicalConversionMetrics & CanonicalPlatformMetrics>

/**
 * Lista de nombres de métricas core (para iteración)
 */
export const CORE_METRIC_NAMES: (keyof CanonicalCoreMetrics)[] = [
  'impressions',
  'clicks',
  'spend',
  'ctr',
  'cpc',
  'cpm',
]

/**
 * Lista de nombres de métricas de conversión
 */
export const CONVERSION_METRIC_NAMES: (keyof CanonicalConversionMetrics)[] = [
  'conversions',
  'conversionValue',
  'costPerConversion',
  'conversionRate',
  'roas',
]

/**
 * Lista de nombres de métricas de plataforma
 */
export const PLATFORM_METRIC_NAMES: (keyof CanonicalPlatformMetrics)[] = [
  'reach',
  'frequency',
  'videoViews',
  'videoViewRate',
]
