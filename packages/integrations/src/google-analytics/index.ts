import type { Account, DataConnector, DateRange, MetricDataPoint, NormalizedMetrics, OAuthTokens } from '@tamarindo/types'

// Google OAuth configuration (same endpoints as Google Ads)
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

// GA4 specific APIs
const GA4_ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta'
const GA4_DATA_API = 'https://analyticsdata.googleapis.com/v1beta'

// GA4 requires different scopes than Google Ads
const GA4_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'openid',
  'email',
  'profile',
].join(' ')

export class GoogleAnalyticsConnector implements DataConnector {
  readonly id = 'google-analytics'
  readonly displayName = 'Google Analytics 4'
  readonly icon = 'logos:google-analytics'

  private clientId: string
  private clientSecret: string

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  async getAuthUrl(tenantId: string, redirectUri: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GA4_SCOPES,
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

  async getAccounts(accessToken: string): Promise<Account[]> {
    try {
      // List all GA4 account summaries (includes properties)
      const response = await fetch(`${GA4_ADMIN_API}/accountSummaries`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to list GA4 accounts: ${error}`)
      }

      const data = await response.json()
      const accounts: Account[] = []

      // Each account summary contains multiple properties
      for (const accountSummary of data.accountSummaries || []) {
        for (const property of accountSummary.propertySummaries || []) {
          // Property name format: "properties/123456789"
          const propertyId = property.property?.replace('properties/', '') || ''

          accounts.push({
            id: propertyId,
            name: property.displayName || `Property ${propertyId}`,
            // GA4 doesn't expose currency/timezone in summaries, will be fetched from property details if needed
            currency: 'USD',
            timezone: 'UTC',
          })
        }
      }

      return accounts
    }
    catch (error) {
      console.error('Error fetching GA4 accounts:', error)
      throw new Error(`Failed to get GA4 accounts: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getMetrics(
    accessToken: string,
    accountId: string,
    dateRange: DateRange,
    _metrics: string[] = ['sessions', 'users', 'conversions'],
  ): Promise<NormalizedMetrics> {
    try {
      // GA4 Data API requires property ID in format "properties/123456789"
      const propertyId = accountId.startsWith('properties/')
        ? accountId
        : `properties/${accountId}`

      // Request body for GA4 Data API runReport
      const requestBody = {
        dateRanges: [{
          startDate: dateRange.start,
          endDate: dateRange.end,
        }],
        dimensions: [{
          name: 'date',
        }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'ecommercePurchases' },
          { name: 'purchaseRevenue' },
        ],
        orderBys: [{
          dimension: { dimensionName: 'date' },
        }],
      }

      const response = await fetch(`${GA4_DATA_API}/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to fetch GA4 metrics: ${error}`)
      }

      const data = await response.json()

      // Transform GA4 response rows to normalized format
      const dataPoints: MetricDataPoint[] = (data.rows || []).map((row: any) => {
        // GA4 date format is YYYYMMDD, convert to YYYY-MM-DD
        const rawDate = row.dimensionValues?.[0]?.value || ''
        const date = rawDate.length === 8
          ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
          : rawDate

        // Extract metric values
        const sessions = Number(row.metricValues?.[0]?.value || 0)
        const users = Number(row.metricValues?.[1]?.value || 0)
        const newUsers = Number(row.metricValues?.[2]?.value || 0)
        const pageviews = Number(row.metricValues?.[3]?.value || 0)
        const bounceRate = Number(row.metricValues?.[4]?.value || 0)
        const avgSessionDuration = Number(row.metricValues?.[5]?.value || 0)
        const transactions = Number(row.metricValues?.[6]?.value || 0)
        const revenue = Number(row.metricValues?.[7]?.value || 0)

        return {
          date,
          metrics: {
            // Core GA4 metrics
            sessions,
            users,
            newUsers,
            pageviews,
            bounceRate: Math.round(bounceRate * 100) / 100,
            avgSessionDuration: Math.round(avgSessionDuration * 100) / 100,

            // Conversion metrics (ecommerce)
            transactions,
            revenue: Math.round(revenue * 100) / 100,

            // Mapped to canonical format for compatibility
            // sessions = traffic volume (like impressions)
            impressions: sessions,
            // newUsers = new traffic (like clicks)
            clicks: newUsers,
            // transactions = conversions
            conversions: transactions,
            conversionValue: Math.round(revenue * 100) / 100,
            // GA4 is free, no spend
            cost: 0,

            // Calculated metrics
            conversionRate: sessions > 0
              ? Math.round((transactions / sessions) * 10000) / 100
              : 0,
          },
        }
      })

      return {
        source: 'ga4',
        accountId,
        dateRange,
        data: dataPoints,
      }
    }
    catch (error) {
      console.error('Error fetching GA4 metrics:', error)
      throw new Error(`Failed to get GA4 metrics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Factory function
export function createGoogleAnalyticsConnector(
  clientId: string,
  clientSecret: string,
): GoogleAnalyticsConnector {
  return new GoogleAnalyticsConnector(clientId, clientSecret)
}
