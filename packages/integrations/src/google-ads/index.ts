import type { Account, DataConnector, DateRange, MetricDataPoint, NormalizedMetrics, OAuthTokens } from '@tamarindo/types'
import { GoogleAdsApi } from 'google-ads-api'

// Google OAuth configuration
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_ADS_SCOPES = [
  'https://www.googleapis.com/auth/adwords',
].join(' ')

// Mapping from normalized metric names to GAQL fields
const METRIC_MAPPING: Record<string, string> = {
  impressions: 'metrics.impressions',
  clicks: 'metrics.clicks',
  cost: 'metrics.cost_micros',
  conversions: 'metrics.conversions',
  conversionValue: 'metrics.conversions_value',
  ctr: 'metrics.ctr',
  cpc: 'metrics.average_cpc',
  conversionRate: 'metrics.conversions_from_interactions_rate',
  costPerConversion: 'metrics.cost_per_conversion',
  reach: 'metrics.reach',
  videoViews: 'metrics.video_views',
}

export class GoogleAdsConnector implements DataConnector {
  readonly id = 'google-ads'
  readonly displayName = 'Google Ads'
  readonly icon = 'logos:google-ads'

  private clientId: string
  private clientSecret: string
  private client: GoogleAdsApi

  constructor(clientId: string, clientSecret: string, developerToken: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret

    this.client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
    })
  }

  async getAuthUrl(tenantId: string, redirectUri: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_ADS_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state: tenantId,
    })

    return `${GOOGLE_AUTH_URL}?${params.toString()}`
  }

  async handleCallback(code: string, redirectUri: string): Promise<OAuthTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to exchange code for tokens: ${error}`)
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope,
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to refresh tokens: ${error}`)
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken,
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope,
    }
  }

  async getAccounts(refreshToken: string): Promise<Account[]> {
    try {
      // List all accessible customer IDs
      const response = await this.client.listAccessibleCustomers(refreshToken)
      const resourceNames = response?.resource_names || []

      if (resourceNames.length === 0) {
        return []
      }

      // Extract customer IDs from resource names (format: customers/123456)
      const customerIds = resourceNames.map((name: string) => name.replace('customers/', ''))

      const accounts: Account[] = []

      // Get details for each customer
      for (const customerId of customerIds) {
        try {
          const customer = this.client.Customer({
            customer_id: customerId,
            refresh_token: refreshToken,
          })

          // Query customer details
          const results = await customer.query(`
            SELECT
              customer.id,
              customer.descriptive_name,
              customer.currency_code,
              customer.time_zone
            FROM customer
            LIMIT 1
          `)

          if (results && results.length > 0) {
            const customerData = results[0]?.customer
            accounts.push({
              id: customerData?.id?.toString() || customerId,
              name: customerData?.descriptive_name || `Account ${customerId}`,
              currency: customerData?.currency_code || 'USD',
              timezone: customerData?.time_zone || 'UTC',
            })
          }
        }
        catch (customerError) {
          // Skip accounts that can't be accessed (e.g., MCC accounts without direct access)
          console.warn(`Could not access customer ${customerId}:`, customerError)
        }
      }

      return accounts
    }
    catch (error) {
      console.error('Error fetching Google Ads accounts:', error)
      throw new Error(`Failed to get Google Ads accounts: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getMetrics(
    refreshToken: string,
    accountId: string,
    dateRange: DateRange,
    metrics: string[] = ['impressions', 'clicks', 'cost', 'conversions'],
  ): Promise<NormalizedMetrics> {
    try {
      const customer = this.client.Customer({
        customer_id: accountId,
        refresh_token: refreshToken,
      })

      // Build GAQL metrics selection
      const gaqlMetrics = metrics
        .map(m => METRIC_MAPPING[m] || `metrics.${m}`)
        .filter(Boolean)

      // Query metrics grouped by date
      const query = `
        SELECT
          segments.date,
          ${gaqlMetrics.join(',\n          ')}
        FROM campaign
        WHERE segments.date >= '${dateRange.start}'
          AND segments.date <= '${dateRange.end}'
        ORDER BY segments.date ASC
      `

      const results = await customer.query(query)

      // Aggregate metrics by date (sum across all campaigns)
      const byDate = new Map<string, Record<string, number>>()

      for (const row of results) {
        const date = row.segments?.date
        if (!date)
          continue

        const current = byDate.get(date) || {}

        // Sum metrics
        current.impressions = (current.impressions || 0) + Number(row.metrics?.impressions || 0)
        current.clicks = (current.clicks || 0) + Number(row.metrics?.clicks || 0)
        // cost_micros needs to be divided by 1,000,000 to get actual currency
        current.cost = (current.cost || 0) + (Number(row.metrics?.cost_micros || 0) / 1_000_000)
        current.conversions = (current.conversions || 0) + Number(row.metrics?.conversions || 0)
        current.conversionValue = (current.conversionValue || 0) + Number(row.metrics?.conversions_value || 0)

        byDate.set(date, current)
      }

      // Convert to normalized format and calculate derived metrics
      const data: MetricDataPoint[] = Array.from(byDate.entries()).map(([date, m]) => {
        const impressions = m.impressions ?? 0
        const clicks = m.clicks ?? 0
        const cost = m.cost ?? 0
        const conversions = m.conversions ?? 0
        const conversionValue = m.conversionValue ?? 0

        return {
          date,
          metrics: {
            impressions: Math.round(impressions),
            clicks: Math.round(clicks),
            cost: Math.round(cost * 100) / 100, // Round to 2 decimals
            conversions: Math.round(conversions * 100) / 100,
            conversionValue: Math.round(conversionValue * 100) / 100,
            // Calculated metrics
            ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
            cpc: clicks > 0 ? Math.round((cost / clicks) * 100) / 100 : 0,
            conversionRate: clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0,
            costPerConversion: conversions > 0 ? Math.round((cost / conversions) * 100) / 100 : 0,
          },
        }
      })

      return {
        source: 'google-ads',
        accountId,
        dateRange,
        data,
      }
    }
    catch (error) {
      console.error('Error fetching Google Ads metrics:', error)
      throw new Error(`Failed to get Google Ads metrics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Factory function
export function createGoogleAdsConnector(
  clientId: string,
  clientSecret: string,
  developerToken: string,
): GoogleAdsConnector {
  return new GoogleAdsConnector(clientId, clientSecret, developerToken)
}
