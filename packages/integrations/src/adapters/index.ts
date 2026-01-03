// ============================================
// Platform Adapters Registry
// ============================================
// Registry central de adaptadores para normalizar
// datos de diferentes plataformas publicitarias.

import type { MetricSource } from '@tamarindo/types'
import type { PlatformAdapter } from './types'
import { GoogleAdsAdapter } from './google-ads.adapter'
import { FacebookAdsAdapter } from './facebook-ads.adapter'
import { TikTokAdsAdapter } from './tiktok-ads.adapter'
import { GoogleAnalyticsAdapter } from './google-analytics.adapter'

// Instancias singleton de adaptadores
const googleAdsAdapter = new GoogleAdsAdapter()
const facebookAdsAdapter = new FacebookAdsAdapter()
const tiktokAdsAdapter = new TikTokAdsAdapter()
const googleAnalyticsAdapter = new GoogleAnalyticsAdapter()

/**
 * Registry de adaptadores indexado por source
 * Soporta tanto el formato canónico (google_ads) como el de DB (GOOGLE_ADS)
 */
const adapters: Record<string, PlatformAdapter> = {
  // Formato canónico (snake_case)
  google_ads: googleAdsAdapter,
  facebook_ads: facebookAdsAdapter,
  tiktok_ads: tiktokAdsAdapter,
  google_analytics: googleAnalyticsAdapter,

  // Formato de DB (UPPER_SNAKE_CASE)
  GOOGLE_ADS: googleAdsAdapter,
  FACEBOOK_ADS: facebookAdsAdapter,
  TIKTOK_ADS: tiktokAdsAdapter,
  GOOGLE_ANALYTICS: googleAnalyticsAdapter,
}

/**
 * Obtiene el adaptador para una plataforma
 * @param source - Identificador de la plataforma (google_ads, GOOGLE_ADS, etc.)
 * @throws Error si no existe adaptador para la plataforma
 */
export function getAdapter(source: string): PlatformAdapter {
  const adapter = adapters[source]
  if (!adapter) {
    const available = Object.keys(adapters).filter(k => k === k.toLowerCase()).join(', ')
    throw new Error(`No adapter found for source: ${source}. Available: ${available}`)
  }
  return adapter
}

/**
 * Verifica si existe un adaptador para una plataforma
 */
export function hasAdapter(source: string): boolean {
  return source in adapters
}

/**
 * Lista de todas las plataformas soportadas
 */
export function getSupportedSources(): MetricSource[] {
  return ['google_ads', 'facebook_ads', 'tiktok_ads', 'google_analytics']
}

/**
 * Registra un nuevo adaptador (útil para extensiones)
 */
export function registerAdapter(source: string, adapter: PlatformAdapter): void {
  adapters[source] = adapter
  // También registrar en formato UPPER_SNAKE_CASE
  adapters[source.toUpperCase()] = adapter
}

// Re-export types and adapters
export * from './types'
export { GoogleAdsAdapter, createGoogleAdsAdapter } from './google-ads.adapter'
export { FacebookAdsAdapter, createFacebookAdsAdapter } from './facebook-ads.adapter'
export { TikTokAdsAdapter, createTikTokAdsAdapter } from './tiktok-ads.adapter'
export { GoogleAnalyticsAdapter, createGoogleAnalyticsAdapter } from './google-analytics.adapter'
