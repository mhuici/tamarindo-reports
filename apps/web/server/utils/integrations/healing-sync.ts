import { prisma } from '../db'
import { getValidAccessToken } from './tokens'

const HEALING_DAYS = 7

interface HealingSyncResult {
  success: boolean
  accountsProcessed: number
  metricsUpdated: number
  errors: string[]
}

/**
 * Perform healing sync for a data source
 * Re-fetches the last 7 days of metrics to catch any corrections
 */
export async function healingSync(dataSourceId: string): Promise<HealingSyncResult> {
  const result: HealingSyncResult = {
    success: true,
    accountsProcessed: 0,
    metricsUpdated: 0,
    errors: [],
  }

  try {
    // Get data source with platform accounts
    const dataSource = await prisma.dataSource.findUnique({
      where: { id: dataSourceId },
      include: {
        platformAccounts: {
          where: { isActive: true },
        },
      },
    })

    if (!dataSource) {
      return { ...result, success: false, errors: ['Data source not found'] }
    }

    // Get valid access token
    const tokenResult = await getValidAccessToken(dataSourceId)
    if (!tokenResult.success || !tokenResult.accessToken) {
      return {
        ...result,
        success: false,
        errors: [tokenResult.error || 'Failed to get access token'],
      }
    }

    // Calculate date range (last 7 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - HEALING_DAYS)

    // Sync each platform account
    for (const account of dataSource.platformAccounts) {
      try {
        const metrics = await fetchAccountMetrics(
          dataSource.type,
          account.platformId,
          tokenResult.accessToken,
          startDate,
          endDate,
          dataSource.credentials as any,
        )

        if (metrics.length > 0) {
          // Upsert metrics - this will update existing records
          for (const metric of metrics) {
            await prisma.metric.upsert({
              where: {
                platformAccountId_date: {
                  platformAccountId: account.id,
                  date: metric.date,
                },
              },
              create: {
                platformAccountId: account.id,
                date: metric.date,
                data: metric.data,
                syncedAt: new Date(),
              },
              update: {
                data: metric.data,
                syncedAt: new Date(),
              },
            })
            result.metricsUpdated++
          }
        }

        // Update last healing sync timestamp
        await prisma.platformAccount.update({
          where: { id: account.id },
          data: { lastHealingSyncAt: new Date() },
        })

        result.accountsProcessed++
      }
      catch (e: any) {
        result.errors.push(`Account ${account.name}: ${e.message}`)
      }
    }

    // Update data source last sync
    await prisma.dataSource.update({
      where: { id: dataSourceId },
      data: { lastSyncAt: new Date() },
    })

    result.success = result.errors.length === 0
  }
  catch (e: any) {
    result.success = false
    result.errors.push(e.message)
  }

  return result
}

/**
 * Fetch metrics from a platform for a date range
 */
async function fetchAccountMetrics(
  type: string,
  platformId: string,
  accessToken: string,
  startDate: Date,
  endDate: Date,
  credentials: { managerId?: string },
): Promise<Array<{ date: Date; data: Record<string, any> }>> {
  switch (type) {
    case 'GOOGLE_ADS':
      return await fetchGoogleAdsMetrics(platformId, accessToken, startDate, endDate, credentials.managerId)

    case 'FACEBOOK_ADS':
      return await fetchFacebookAdsMetrics(platformId, accessToken, startDate, endDate)

    case 'GOOGLE_ANALYTICS':
      return await fetchGoogleAnalyticsMetrics(platformId, accessToken, startDate, endDate)

    default:
      console.warn(`Unsupported platform type for metrics: ${type}`)
      return []
  }
}

/**
 * Fetch Google Ads metrics
 */
async function fetchGoogleAdsMetrics(
  customerId: string,
  accessToken: string,
  startDate: Date,
  endDate: Date,
  managerId?: string,
): Promise<Array<{ date: Date; data: Record<string, any> }>> {
  const metrics: Array<{ date: Date; data: Record<string, any> }> = []

  try {
    const cleanCustomerId = customerId.replace(/-/g, '')
    const startStr = formatDateForGoogle(startDate)
    const endStr = formatDateForGoogle(endDate)

    // Google Ads API query for daily metrics
    const query = `
      SELECT
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.video_views,
        metrics.average_cpc,
        metrics.ctr
      FROM customer
      WHERE segments.date BETWEEN '${startStr}' AND '${endStr}'
    `

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
      'Content-Type': 'application/json',
    }

    if (managerId) {
      headers['login-customer-id'] = managerId.replace(/-/g, '')
    }

    const response = await fetch(
      `https://googleads.googleapis.com/v18/customers/${cleanCustomerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Ads API error:', errorText)
      return metrics
    }

    const data = await response.json()

    // Process results
    if (data && Array.isArray(data)) {
      for (const batch of data) {
        if (batch.results) {
          for (const row of batch.results) {
            const date = parseGoogleDate(row.segments?.date)
            if (date) {
              metrics.push({
                date,
                data: {
                  impressions: Number(row.metrics?.impressions || 0),
                  clicks: Number(row.metrics?.clicks || 0),
                  cost: Number(row.metrics?.costMicros || 0) / 1000000,
                  conversions: Number(row.metrics?.conversions || 0),
                  conversionsValue: Number(row.metrics?.conversionsValue || 0),
                  videoViews: Number(row.metrics?.videoViews || 0),
                  ctr: Number(row.metrics?.ctr || 0),
                  cpc: Number(row.metrics?.averageCpc || 0) / 1000000,
                },
              })
            }
          }
        }
      }
    }
  }
  catch (e: any) {
    console.error('Error fetching Google Ads metrics:', e.message)
  }

  return metrics
}

/**
 * Fetch Facebook Ads metrics
 */
async function fetchFacebookAdsMetrics(
  adAccountId: string,
  accessToken: string,
  startDate: Date,
  endDate: Date,
): Promise<Array<{ date: Date; data: Record<string, any> }>> {
  const metrics: Array<{ date: Date; data: Record<string, any> }> = []

  try {
    const cleanAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`
    const startStr = formatDateISO(startDate)
    const endStr = formatDateISO(endDate)

    const url = new URL(`https://graph.facebook.com/v21.0/${cleanAccountId}/insights`)
    url.searchParams.set('access_token', accessToken)
    url.searchParams.set('time_range', JSON.stringify({ since: startStr, until: endStr }))
    url.searchParams.set('time_increment', '1') // Daily breakdown
    url.searchParams.set('fields', 'date_start,impressions,clicks,spend,actions,action_values,cpc,ctr,cpp')
    url.searchParams.set('level', 'account')

    const response = await fetch(url.toString())

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Facebook Ads API error:', errorData)
      return metrics
    }

    const data = await response.json()

    if (data.data) {
      for (const row of data.data) {
        const date = new Date(row.date_start)
        const conversions = row.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0
        const conversionsValue = row.action_values?.find((a: any) => a.action_type === 'purchase')?.value || 0

        metrics.push({
          date,
          data: {
            impressions: Number(row.impressions || 0),
            clicks: Number(row.clicks || 0),
            cost: Number(row.spend || 0),
            conversions: Number(conversions),
            conversionsValue: Number(conversionsValue),
            ctr: Number(row.ctr || 0),
            cpc: Number(row.cpc || 0),
          },
        })
      }
    }
  }
  catch (e: any) {
    console.error('Error fetching Facebook Ads metrics:', e.message)
  }

  return metrics
}

/**
 * Fetch Google Analytics 4 metrics
 */
async function fetchGoogleAnalyticsMetrics(
  propertyId: string,
  accessToken: string,
  startDate: Date,
  endDate: Date,
): Promise<Array<{ date: Date; data: Record<string, any> }>> {
  const metrics: Array<{ date: Date; data: Record<string, any> }> = []

  try {
    const startStr = formatDateForGoogle(startDate)
    const endStr = formatDateForGoogle(endDate)

    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: startStr, endDate: endStr }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' },
            { name: 'totalRevenue' },
          ],
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Analytics API error:', errorText)
      return metrics
    }

    const data = await response.json()

    if (data.rows) {
      for (const row of data.rows) {
        const dateStr = row.dimensionValues[0].value
        const date = parseGoogleDate(dateStr)
        if (date) {
          metrics.push({
            date,
            data: {
              sessions: Number(row.metricValues[0]?.value || 0),
              users: Number(row.metricValues[1]?.value || 0),
              newUsers: Number(row.metricValues[2]?.value || 0),
              pageViews: Number(row.metricValues[3]?.value || 0),
              bounceRate: Number(row.metricValues[4]?.value || 0),
              avgSessionDuration: Number(row.metricValues[5]?.value || 0),
              conversions: Number(row.metricValues[6]?.value || 0),
              revenue: Number(row.metricValues[7]?.value || 0),
            },
          })
        }
      }
    }
  }
  catch (e: any) {
    console.error('Error fetching Google Analytics metrics:', e.message)
  }

  return metrics
}

// Helper functions
function formatDateForGoogle(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

function parseGoogleDate(dateStr: string): Date | null {
  if (!dateStr) return null
  // Format: YYYY-MM-DD or YYYYMMDD
  if (dateStr.includes('-')) {
    return new Date(dateStr)
  }
  // YYYYMMDD format
  const year = dateStr.slice(0, 4)
  const month = dateStr.slice(4, 6)
  const day = dateStr.slice(6, 8)
  return new Date(`${year}-${month}-${day}`)
}

/**
 * Run healing sync for all active data sources of a tenant
 */
export async function runTenantHealingSync(tenantId: string): Promise<{
  success: boolean
  dataSourcesProcessed: number
  totalMetricsUpdated: number
  errors: string[]
}> {
  const result = {
    success: true,
    dataSourcesProcessed: 0,
    totalMetricsUpdated: 0,
    errors: [] as string[],
  }

  try {
    // Get all active data sources for tenant
    const dataSources = await prisma.dataSource.findMany({
      where: {
        tenantId,
        isActive: true,
        status: 'ACTIVE',
      },
    })

    for (const ds of dataSources) {
      const syncResult = await healingSync(ds.id)
      result.dataSourcesProcessed++
      result.totalMetricsUpdated += syncResult.metricsUpdated

      if (!syncResult.success) {
        result.errors.push(...syncResult.errors.map(e => `${ds.name}: ${e}`))
      }
    }

    result.success = result.errors.length === 0
  }
  catch (e: any) {
    result.success = false
    result.errors.push(e.message)
  }

  return result
}

/**
 * Run healing sync for all tenants (cron job)
 */
export async function runGlobalHealingSync(): Promise<{
  success: boolean
  tenantsProcessed: number
  totalMetricsUpdated: number
  errors: string[]
}> {
  const result = {
    success: true,
    tenantsProcessed: 0,
    totalMetricsUpdated: 0,
    errors: [] as string[],
  }

  try {
    // Get all tenants with active data sources
    const tenants = await prisma.tenant.findMany({
      where: {
        dataSources: {
          some: {
            isActive: true,
            status: 'ACTIVE',
          },
        },
      },
      select: { id: true, name: true },
    })

    for (const tenant of tenants) {
      const tenantResult = await runTenantHealingSync(tenant.id)
      result.tenantsProcessed++
      result.totalMetricsUpdated += tenantResult.totalMetricsUpdated

      if (!tenantResult.success) {
        result.errors.push(...tenantResult.errors.map(e => `${tenant.name}: ${e}`))
      }
    }

    result.success = result.errors.length === 0
  }
  catch (e: any) {
    result.success = false
    result.errors.push(e.message)
  }

  return result
}
