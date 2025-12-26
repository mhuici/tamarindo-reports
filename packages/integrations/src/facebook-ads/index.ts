import type { Account, DataConnector, DateRange, NormalizedMetrics, OAuthTokens } from '@tamarindo/types'

// Facebook OAuth configuration
const FACEBOOK_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth'
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'
const FACEBOOK_ADS_SCOPES = [
  'ads_read',
  'read_insights',
  'business_management',
].join(',')

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

  async handleCallback(code: string, _tenantId: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      code,
      redirect_uri: '', // Must match the one used in getAuthUrl
    })

    const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens')
    }

    const data = await response.json()

    // Facebook tokens don't have refresh tokens by default
    // We need to exchange for a long-lived token
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    // Facebook uses long-lived tokens that can be exchanged
    // for new long-lived tokens
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: refreshToken,
    })

    const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Failed to refresh tokens')
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    }
  }

  async getAccounts(accessToken: string): Promise<Account[]> {
    // Get ad accounts the user has access to
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,currency,timezone_name&access_token=${accessToken}`,
    )

    if (!response.ok) {
      throw new Error('Failed to get Facebook ad accounts')
    }

    const data = await response.json()

    return (data.data || []).map((account: any) => ({
      id: account.id,
      name: account.name,
      currency: account.currency,
      timezone: account.timezone_name,
    }))
  }

  async getMetrics(
    accessToken: string,
    accountId: string,
    dateRange: DateRange,
    _metrics: string[],
  ): Promise<NormalizedMetrics> {
    // TODO: Implement using Facebook Marketing API
    // For now, return mock data
    console.log('Getting metrics for account:', accountId, 'range:', dateRange)

    return {
      source: 'facebook-ads',
      accountId,
      dateRange,
      data: [],
    }
  }
}

// Factory function
export function createFacebookAdsConnector(appId: string, appSecret: string): DataConnector {
  return new FacebookAdsConnector(appId, appSecret)
}
