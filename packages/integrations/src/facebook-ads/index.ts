import type { Account, DataConnector, DateRange, MetricDataPoint, NormalizedMetrics, OAuthTokens } from '@tamarindo/types'

// Facebook OAuth configuration
const FACEBOOK_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth'
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'
const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/v18.0'
const FACEBOOK_ADS_SCOPES = [
  'ads_read',
  'read_insights',
  'business_management',
].join(',')

// Mapping from normalized metric names to Facebook fields
const METRIC_MAPPING: Record<string, string> = {
  impressions: 'impressions',
  clicks: 'clicks',
  cost: 'spend',
  reach: 'reach',
  frequency: 'frequency',
  ctr: 'ctr',
  cpc: 'cpc',
  cpm: 'cpm',
  cpp: 'cpp',
}

export class FacebookAdsConnector implements DataConnector {
  readonly id = 'facebook-ads'
  readonly displayName = 'Facebook Ads'
  readonly icon = 'logos:facebook'

  private appId: string
  private appSecret: string

  constructor(appId: string, appSecret: string) {
    this.appId = appId
    this.appSecret = appSecret
  }

  async getAuthUrl(tenantId: string, redirectUri: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      scope: FACEBOOK_ADS_SCOPES,
      response_type: 'code',
      state: tenantId,
    })

    return `${FACEBOOK_AUTH_URL}?${params.toString()}`
  }

  async handleCallback(code: string, redirectUri: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      code,
      redirect_uri: redirectUri,
    })

    const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to exchange code for tokens: ${error}`)
    }

    const data = await response.json()

    // Exchange for long-lived token
    const longLivedToken = await this.exchangeForLongLivedToken(data.access_token)

    return longLivedToken
  }

  private async exchangeForLongLivedToken(shortLivedToken: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: shortLivedToken,
    })

    const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`)

    if (!response.ok) {
      // If exchange fails, return the short-lived token
      return {
        accessToken: shortLivedToken,
        expiresAt: Date.now() + (3600 * 1000), // 1 hour default
      }
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      // Long-lived tokens last ~60 days
      expiresAt: Date.now() + (data.expires_in ? data.expires_in * 1000 : 60 * 24 * 3600 * 1000),
    }
  }

  async refreshTokens(accessToken: string): Promise<OAuthTokens> {
    // Facebook uses long-lived tokens that can be exchanged for new ones
    return this.exchangeForLongLivedToken(accessToken)
  }

  async getAccounts(accessToken: string): Promise<Account[]> {
    const response = await fetch(
      `${FACEBOOK_GRAPH_URL}/me/adaccounts?fields=id,name,currency,timezone_name&access_token=${accessToken}`,
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to get Facebook ad accounts: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()

    return (data.data || []).map((account: any) => ({
      id: account.id,
      name: account.name || `Account ${account.id}`,
      currency: account.currency || 'USD',
      timezone: account.timezone_name || 'UTC',
    }))
  }

  async getMetrics(
    accessToken: string,
    accountId: string,
    dateRange: DateRange,
    metrics: string[] = ['impressions', 'clicks', 'cost', 'reach'],
  ): Promise<NormalizedMetrics> {
    try {
      // Map metrics to Facebook field names
      const fbFields = metrics
        .map(m => METRIC_MAPPING[m] || m)
        .filter(Boolean)

      // Always include date fields and actions for conversions
      const fields = [
        'date_start',
        'date_stop',
        ...fbFields,
        'actions',
        'action_values',
      ].join(',')

      const params = new URLSearchParams({
        access_token: accessToken,
        fields,
        time_range: JSON.stringify({
          since: dateRange.start,
          until: dateRange.end,
        }),
        time_increment: '1', // Daily breakdown
        level: 'account',
      })

      const response = await fetch(
        `${FACEBOOK_GRAPH_URL}/${accountId}/insights?${params.toString()}`,
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Facebook API error: ${error.error?.message || 'Unknown error'}`)
      }

      const responseData = await response.json()
      const insights = responseData.data || []

      // Parse insights into normalized format
      const data: MetricDataPoint[] = insights.map((insight: any) => {
        // Extract conversions from actions array
        const conversions = this.extractConversions(insight.actions || [])
        const conversionValue = this.extractConversionValue(insight.action_values || [])

        const metricsData: Record<string, number> = {
          impressions: Number(insight.impressions) || 0,
          clicks: Number(insight.clicks) || 0,
          cost: Number(insight.spend) || 0,
          reach: Number(insight.reach) || 0,
          frequency: Number(insight.frequency) || 0,
          conversions,
          conversionValue,
          // Facebook provides these as strings with percentage
          ctr: Number(insight.ctr) || 0,
          cpc: Number(insight.cpc) || 0,
          cpm: Number(insight.cpm) || 0,
        }

        // Calculate derived metrics
        const clicks = metricsData.clicks ?? 0
        const cost = metricsData.cost ?? 0

        if (clicks > 0) {
          metricsData.conversionRate = Math.round((conversions / clicks) * 10000) / 100
        }
        else {
          metricsData.conversionRate = 0
        }

        if (conversions > 0) {
          metricsData.costPerConversion = Math.round((cost / conversions) * 100) / 100
        }
        else {
          metricsData.costPerConversion = 0
        }

        return {
          date: insight.date_start,
          metrics: metricsData,
        }
      })

      return {
        source: 'facebook-ads',
        accountId,
        dateRange,
        data,
      }
    }
    catch (error) {
      console.error('Error fetching Facebook Ads metrics:', error)
      throw new Error(`Failed to get Facebook Ads metrics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private extractConversions(actions: any[]): number {
    // Common conversion action types
    const conversionTypes = [
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

    return actions
      .filter((action: any) => conversionTypes.includes(action.action_type))
      .reduce((sum: number, action: any) => sum + Number(action.value || 0), 0)
  }

  private extractConversionValue(actionValues: any[]): number {
    // Common conversion value action types
    const valueTypes = [
      'purchase',
      'omni_purchase',
    ]

    return actionValues
      .filter((av: any) => valueTypes.includes(av.action_type))
      .reduce((sum: number, av: any) => sum + Number(av.value || 0), 0)
  }
}

// Factory function
export function createFacebookAdsConnector(appId: string, appSecret: string): FacebookAdsConnector {
  return new FacebookAdsConnector(appId, appSecret)
}
