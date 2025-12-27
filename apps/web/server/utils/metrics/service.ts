import type { DateRange, NormalizedMetrics, OAuthTokens } from '@tamarindo/types'
import { prisma, decrypt, encrypt } from '@tamarindo/db'
import { createGoogleAdsConnector } from '@tamarindo/integrations/google-ads'
import { createFacebookAdsConnector } from '@tamarindo/integrations/facebook-ads'

// Environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || ''
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || ''
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || ''

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
 * Get connector instance for a data source type
 */
function getConnector(type: string) {
  switch (type) {
    case 'GOOGLE_ADS':
      return createGoogleAdsConnector(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_ADS_DEVELOPER_TOKEN,
      )
    case 'FACEBOOK_ADS':
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

  const metrics = await connector.getMetrics(
    token,
    platformAccount.platformId,
    dateRange,
    ['impressions', 'clicks', 'cost', 'conversions'],
  )

  // Save metrics to cache (upsert by date)
  for (const dataPoint of metrics.data) {
    await prisma.metric.upsert({
      where: {
        platformAccountId_date: {
          platformAccountId,
          date: new Date(dataPoint.date),
        },
      },
      create: {
        platformAccountId,
        date: new Date(dataPoint.date),
        data: dataPoint.metrics,
      },
      update: {
        data: dataPoint.metrics,
      },
    })
  }

  // Update last sync time
  await prisma.dataSource.update({
    where: { id: dataSourceId },
    data: { lastSyncAt: new Date(), syncError: null },
  })

  return metrics
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
    // No integrations connected, return empty metrics
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
          { key: 'cost', label: 'Costo', format: 'currency' },
          { key: 'conversions', label: 'Conversiones', format: 'number' },
          { key: 'ctr', label: 'CTR', format: 'percent' },
        ],
        rows: metrics.byDate.map(d => ({
          date: formatDateLabel(d.date),
          ...d.metrics,
        })),
      }

    default:
      return {}
  }
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  return days[date.getUTCDay()]
}

function formatSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    google_ads: 'Google Ads',
    facebook_ads: 'Facebook Ads',
    google_analytics: 'Google Analytics',
  }
  return labels[source] || source
}
