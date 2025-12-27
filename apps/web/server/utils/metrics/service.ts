import type {
  DateRange,
  NormalizedMetrics,
  OAuthTokens,
  CanonicalMetric,
  MetricSource,
} from '@tamarindo/types'
import { CORE_METRIC_NAMES, CONVERSION_METRIC_NAMES } from '@tamarindo/types'
import { prisma, decrypt, encrypt } from '@tamarindo/db'
import { createGoogleAdsConnector } from '@tamarindo/integrations/google-ads'
import { createFacebookAdsConnector } from '@tamarindo/integrations/facebook-ads'
import {
  createMockGoogleAdsConnector,
  createMockFacebookAdsConnector,
  generateMockMetrics,
  getAdapter,
  hasAdapter,
} from '@tamarindo/integrations'

// Environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || ''
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || ''
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || ''

// Check if real credentials are configured
const USE_MOCK_DATA = !GOOGLE_CLIENT_ID && !FACEBOOK_APP_ID

// Cache TTL: 1 hour for current day data
const CACHE_TTL_MS = 60 * 60 * 1000

export interface AggregatedMetrics {
  clientId: string
  dateRange: DateRange
  totals: Record<string, number>
  previousTotals: Record<string, number>
  byDate: Array<{ date: string, metrics: Record<string, number> }>
  bySource: Record<string, Record<string, number>>
}

export interface WidgetData {
  value?: number
  previousValue?: number
  data?: Array<{ label: string, value: number }>
  columns?: Array<{ key: string, label: string, format?: string }>
  rows?: Array<Record<string, any>>
}

/**
 * Convert legacy NormalizedMetrics to CanonicalMetric[]
 * Maps field names: cost → spend, etc.
 */
function toCanonicalMetrics(
  normalized: NormalizedMetrics,
  currency: string = 'USD',
): CanonicalMetric[] {
  // Map source name to canonical format
  const sourceMap: Record<string, MetricSource> = {
    'google-ads': 'google_ads',
    'facebook-ads': 'facebook_ads',
    'google_ads': 'google_ads',
    'facebook_ads': 'facebook_ads',
  }

  const source = sourceMap[normalized.source] || 'google_ads'

  return normalized.data.map((point) => {
    const m = point.metrics

    // Create canonical metric with proper field mapping
    const canonical: CanonicalMetric = {
      source,
      accountId: normalized.accountId,
      date: point.date,
      currency,

      // Core metrics (map 'cost' to 'spend')
      impressions: m.impressions || 0,
      clicks: m.clicks || 0,
      spend: m.cost || m.spend || 0,

      // Derived metrics
      ctr: m.ctr || ((m.impressions ?? 0) > 0 ? ((m.clicks ?? 0) / (m.impressions ?? 1)) * 100 : 0),
      cpc: m.cpc || ((m.clicks ?? 0) > 0 ? (m.cost || m.spend || 0) / (m.clicks ?? 1) : 0),
      cpm: m.cpm || ((m.impressions ?? 0) > 0 ? ((m.cost || m.spend || 0) / (m.impressions ?? 1)) * 1000 : 0),
    }

    // Optional conversion metrics
    if (m.conversions !== undefined && m.conversions > 0) {
      canonical.conversions = m.conversions
    }
    if (m.conversionValue !== undefined && m.conversionValue > 0) {
      canonical.conversionValue = m.conversionValue
    }
    if (m.conversionRate !== undefined) {
      canonical.conversionRate = m.conversionRate
    }
    else if (canonical.conversions && canonical.clicks > 0) {
      canonical.conversionRate = (canonical.conversions / canonical.clicks) * 100
    }
    if (m.costPerConversion !== undefined) {
      canonical.costPerConversion = m.costPerConversion
    }
    else if (canonical.conversions && canonical.conversions > 0) {
      canonical.costPerConversion = canonical.spend / canonical.conversions
    }
    if (canonical.conversionValue && canonical.spend > 0) {
      canonical.roas = canonical.conversionValue / canonical.spend
    }

    // Platform-specific metrics
    if (m.reach !== undefined) {
      canonical.reach = m.reach
    }
    if (m.frequency !== undefined) {
      canonical.frequency = m.frequency
    }
    if (m.videoViews !== undefined) {
      canonical.videoViews = m.videoViews
    }

    return canonical
  })
}

/**
 * Get connector instance for a data source type
 * Uses mock connectors when no real credentials are configured
 */
function getConnector(type: string) {
  switch (type) {
    case 'GOOGLE_ADS':
      if (USE_MOCK_DATA || !GOOGLE_CLIENT_ID) {
        console.log('[Metrics] Using mock Google Ads connector (no credentials)')
        return createMockGoogleAdsConnector()
      }
      return createGoogleAdsConnector(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_ADS_DEVELOPER_TOKEN,
      )
    case 'FACEBOOK_ADS':
      if (USE_MOCK_DATA || !FACEBOOK_APP_ID) {
        console.log('[Metrics] Using mock Facebook Ads connector (no credentials)')
        return createMockFacebookAdsConnector()
      }
      return createFacebookAdsConnector(FACEBOOK_APP_ID, FACEBOOK_APP_SECRET)
    default:
      throw new Error(`Unsupported data source type: ${type}`)
  }
}

/**
 * Decrypt OAuth credentials from database
 */
function decryptCredentials(encryptedCredentials: string): OAuthTokens {
  try {
    const decrypted = decrypt(encryptedCredentials)
    return JSON.parse(decrypted)
  }
  catch (error) {
    throw new Error('Failed to decrypt credentials')
  }
}

/**
 * Encrypt and save updated credentials
 */
async function updateCredentials(dataSourceId: string, credentials: OAuthTokens): Promise<void> {
  const encrypted = encrypt(JSON.stringify(credentials))
  await prisma.dataSource.update({
    where: { id: dataSourceId },
    data: { credentials: encrypted },
  })
}

/**
 * Ensure token is valid, refresh if expired
 */
async function ensureValidToken(
  dataSourceId: string,
  dataSourceType: string,
  credentials: OAuthTokens,
): Promise<OAuthTokens> {
  // Check if token is expired (with 5 minute buffer)
  const isExpired = credentials.expiresAt < Date.now() + 5 * 60 * 1000

  if (!isExpired) {
    return credentials
  }

  // Token expired, try to refresh
  const connector = getConnector(dataSourceType)

  try {
    const newTokens = await connector.refreshTokens(
      credentials.refreshToken || credentials.accessToken,
    )

    // Save new tokens
    await updateCredentials(dataSourceId, newTokens)

    // Clear sync error if any
    await prisma.dataSource.update({
      where: { id: dataSourceId },
      data: { syncError: null },
    })

    return newTokens
  }
  catch (error) {
    // Mark data source as having error
    await prisma.dataSource.update({
      where: { id: dataSourceId },
      data: {
        syncError: `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isActive: false,
      },
    })

    throw new Error('Token expired and refresh failed. Please reconnect the integration.')
  }
}

/**
 * Sync metrics for a specific data source and account
 */
export async function syncMetrics(
  dataSourceId: string,
  platformAccountId: string,
  dateRange: DateRange,
): Promise<NormalizedMetrics> {
  // Get data source with platform account
  const platformAccount = await prisma.platformAccount.findUnique({
    where: { id: platformAccountId },
    include: { dataSource: true },
  })

  if (!platformAccount) {
    throw new Error('Platform account not found')
  }

  const dataSource = platformAccount.dataSource

  if (!dataSource.isActive) {
    throw new Error('Data source is not active. Please reconnect the integration.')
  }

  // Decrypt and validate credentials
  const credentials = decryptCredentials(dataSource.credentials as string)
  const validCredentials = await ensureValidToken(dataSourceId, dataSource.type, credentials)

  // Get connector and fetch metrics
  const connector = getConnector(dataSource.type)
  const token = validCredentials.refreshToken || validCredentials.accessToken

  const rawMetrics = await connector.getMetrics(
    token,
    platformAccount.platformId,
    dateRange,
    ['impressions', 'clicks', 'cost', 'conversions'],
  )

  // Convert to canonical format
  const currency = platformAccount.currency || 'USD'
  const canonicalMetrics = toCanonicalMetrics(rawMetrics, currency)

  // Save canonical metrics to cache (upsert by date)
  for (const metric of canonicalMetrics) {
    await prisma.metric.upsert({
      where: {
        platformAccountId_date: {
          platformAccountId,
          date: new Date(metric.date),
        },
      },
      create: {
        platformAccountId,
        date: new Date(metric.date),
        data: JSON.parse(JSON.stringify(metric)),
      },
      update: {
        data: JSON.parse(JSON.stringify(metric)),
      },
    })
  }

  // Update last sync time
  await prisma.dataSource.update({
    where: { id: dataSourceId },
    data: { lastSyncAt: new Date(), syncError: null },
  })

  return rawMetrics
}

/**
 * Check if metrics need to be synced (older than TTL)
 */
function needsSync(lastSyncAt: Date | null): boolean {
  if (!lastSyncAt)
    return true
  return Date.now() - lastSyncAt.getTime() > CACHE_TTL_MS
}

/**
 * Generate demo metrics for clients without integrations
 */
function generateDemoMetricsForClient(
  clientId: string,
  dateRange: DateRange,
): AggregatedMetrics {
  // Generate mock data for both platforms
  const googleMetrics = generateMockMetrics('google-ads', 'demo-google', dateRange, {
    profile: 'ecommerce',
    trend: 'growing',
  })

  const facebookMetrics = generateMockMetrics('facebook-ads', 'demo-facebook', dateRange, {
    profile: 'leadgen',
    trend: 'stable',
  })

  // Aggregate totals
  const totals: Record<string, number> = {}
  const previousTotals: Record<string, number> = {}
  const byDate = new Map<string, Record<string, number>>()
  const bySource: Record<string, Record<string, number>> = {
    google_ads: {},
    facebook_ads: {},
  }

  // Process Google metrics
  for (const dataPoint of googleMetrics.data) {
    for (const [key, value] of Object.entries(dataPoint.metrics)) {
      totals[key] = (totals[key] || 0) + value
      bySource.google_ads![key] = (bySource.google_ads![key] || 0) + value

      const dateMetrics = byDate.get(dataPoint.date) || {}
      dateMetrics[key] = (dateMetrics[key] || 0) + value
      byDate.set(dataPoint.date, dateMetrics)
    }
  }

  // Process Facebook metrics
  for (const dataPoint of facebookMetrics.data) {
    for (const [key, value] of Object.entries(dataPoint.metrics)) {
      totals[key] = (totals[key] || 0) + value
      bySource.facebook_ads![key] = (bySource.facebook_ads![key] || 0) + value

      const dateMetrics = byDate.get(dataPoint.date) || {}
      dateMetrics[key] = (dateMetrics[key] || 0) + value
      byDate.set(dataPoint.date, dateMetrics)
    }
  }

  // Generate previous period (same pattern but slightly different)
  const periodLength = new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()
  const previousStart = new Date(new Date(dateRange.start).getTime() - periodLength)
  const previousEnd = new Date(new Date(dateRange.start).getTime() - 1)

  const previousGoogleMetrics = generateMockMetrics('google-ads', 'demo-google', {
    start: previousStart.toISOString().split('T')[0] ?? '',
    end: previousEnd.toISOString().split('T')[0] ?? '',
  }, { profile: 'ecommerce', trend: 'stable' })

  for (const dataPoint of previousGoogleMetrics.data) {
    for (const [key, value] of Object.entries(dataPoint.metrics)) {
      previousTotals[key] = (previousTotals[key] || 0) + value
    }
  }

  return {
    clientId,
    dateRange,
    totals,
    previousTotals,
    byDate: Array.from(byDate.entries()).map(([date, metrics]) => ({ date, metrics })),
    bySource,
  }
}

/**
 * Get metrics for a client, syncing if necessary
 */
export async function getMetricsForClient(
  clientId: string,
  dateRange: DateRange,
  forceSync = false,
): Promise<AggregatedMetrics> {
  // Get all platform accounts linked to this client
  const clientAccounts = await prisma.clientAccount.findMany({
    where: { clientId },
    include: {
      platformAccount: {
        include: {
          dataSource: true,
        },
      },
    },
  })

  if (clientAccounts.length === 0) {
    // No integrations connected - return demo data if mock mode enabled
    if (USE_MOCK_DATA) {
      console.log('[Metrics] No integrations for client, generating demo data')
      return generateDemoMetricsForClient(clientId, dateRange)
    }

    // No mock mode, return empty
    return {
      clientId,
      dateRange,
      totals: {},
      previousTotals: {},
      byDate: [],
      bySource: {},
    }
  }

  // Check if any data source needs syncing
  for (const ca of clientAccounts) {
    const dataSource = ca.platformAccount.dataSource

    if (forceSync || needsSync(dataSource.lastSyncAt)) {
      try {
        await syncMetrics(dataSource.id, ca.platformAccountId, dateRange)
      }
      catch (error) {
        console.error(`Failed to sync metrics for ${ca.platformAccountId}:`, error)
        // Continue with cached data if available
      }
    }
  }

  // Get metrics from cache
  const platformAccountIds = clientAccounts.map(ca => ca.platformAccountId)

  const cachedMetrics = await prisma.metric.findMany({
    where: {
      platformAccountId: { in: platformAccountIds },
      date: {
        gte: new Date(dateRange.start),
        lte: new Date(dateRange.end),
      },
    },
    include: {
      platformAccount: {
        include: {
          dataSource: true,
        },
      },
    },
    orderBy: { date: 'asc' },
  })

  // Aggregate metrics
  const totals: Record<string, number> = {}
  const byDate = new Map<string, Record<string, number>>()
  const bySource: Record<string, Record<string, number>> = {}

  for (const metric of cachedMetrics) {
    const data = metric.data as Record<string, number>
    const dateStr = metric.date.toISOString().split('T')[0]
    const source = metric.platformAccount.dataSource.type.toLowerCase()

    // Aggregate totals
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number') {
        totals[key] = (totals[key] || 0) + value
      }
    }

    // Aggregate by date
    const dateMetrics = byDate.get(dateStr) || {}
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number') {
        dateMetrics[key] = (dateMetrics[key] || 0) + value
      }
    }
    byDate.set(dateStr, dateMetrics)

    // Aggregate by source
    if (!bySource[source]) {
      bySource[source] = {}
    }
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number') {
        bySource[source][key] = (bySource[source][key] || 0) + value
      }
    }
  }

  // Calculate previous period for comparison
  const periodLength = new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()
  const previousStart = new Date(new Date(dateRange.start).getTime() - periodLength)
  const previousEnd = new Date(new Date(dateRange.start).getTime() - 1)

  const previousMetrics = await prisma.metric.findMany({
    where: {
      platformAccountId: { in: platformAccountIds },
      date: {
        gte: previousStart,
        lte: previousEnd,
      },
    },
  })

  const previousTotals: Record<string, number> = {}
  for (const metric of previousMetrics) {
    const data = metric.data as Record<string, number>
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number') {
        previousTotals[key] = (previousTotals[key] || 0) + value
      }
    }
  }

  return {
    clientId,
    dateRange,
    totals,
    previousTotals,
    byDate: Array.from(byDate.entries()).map(([date, metrics]) => ({ date, metrics })),
    bySource,
  }
}

/**
 * Transform aggregated metrics to widget format
 */
export function transformToWidgetData(
  metrics: AggregatedMetrics,
  widgetConfig: {
    type: string
    metric?: string
    metrics?: string[]
    dimension?: string
  },
): WidgetData {
  const primaryMetric = widgetConfig.metric || widgetConfig.metrics?.[0] || 'impressions'

  switch (widgetConfig.type) {
    case 'metric':
    case 'metric-card':
      return {
        value: Math.round(metrics.totals[primaryMetric] || 0),
        previousValue: Math.round(metrics.previousTotals[primaryMetric] || 0),
      }

    case 'line-chart':
    case 'bar-chart':
      return {
        data: metrics.byDate.map(d => ({
          label: formatDateLabel(d.date),
          value: Math.round(d.metrics[primaryMetric] || 0),
        })),
      }

    case 'pie-chart':
      // Group by source for pie charts
      return {
        data: Object.entries(metrics.bySource).map(([source, data]) => ({
          label: formatSourceLabel(source),
          value: Math.round(data[primaryMetric] || 0),
        })),
      }

    case 'table':
      return {
        columns: [
          { key: 'date', label: 'Fecha', format: 'text' },
          { key: 'impressions', label: 'Impresiones', format: 'number' },
          { key: 'clicks', label: 'Clicks', format: 'number' },
          { key: 'spend', label: 'Gasto', format: 'currency' },
          { key: 'conversions', label: 'Conversiones', format: 'number' },
          { key: 'ctr', label: 'CTR', format: 'percent' },
        ],
        rows: metrics.byDate.map(d => ({
          date: formatDateLabel(d.date),
          ...d.metrics,
          // Ensure spend is available (may come as 'cost' from legacy data)
          spend: d.metrics.spend ?? d.metrics.cost ?? 0,
        })),
      }

    default:
      return {}
  }
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  return days[date.getUTCDay()] ?? dateStr
}

function formatSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    google_ads: 'Google Ads',
    facebook_ads: 'Facebook Ads',
    google_analytics: 'Google Analytics',
  }
  return labels[source] || source
}
