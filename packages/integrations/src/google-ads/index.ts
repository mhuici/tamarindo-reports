import type { Account, DataConnector, DateRange, NormalizedMetrics, OAuthTokens } from '@tamarindo/types'

// Google OAuth configuration
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_ADS_SCOPES = [
  'https://www.googleapis.com/auth/adwords',
].join(' ')

export class GoogleAdsConnector implements DataConnector {
  readonly id = 'google-ads'
  readonly displayName = 'Google Ads'
  readonly icon = 'logos:google-ads'

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
      scope: GOOGLE_ADS_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state: tenantId, // Pass tenant ID for callback
    })

    return `${GOOGLE_AUTH_URL}?${params.toString()}`
  }

  async handleCallback(code: string, _tenantId: string): Promise<OAuthTokens> {
    // TODO: Implement token exchange
    // This will be called after user authorizes on Google

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: '', // Must match the one used in getAuthUrl
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens')
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
      throw new Error('Failed to refresh tokens')
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken, // Keep the same refresh token
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope,
    }
  }

  async getAccounts(accessToken: string): Promise<Account[]> {
    // TODO: Implement using Google Ads API
    // For now, return empty array
    console.log('Getting Google Ads accounts with token:', accessToken.substring(0, 10) + '...')
    return []
  }

  async getMetrics(
    accessToken: string,
    accountId: string,
    dateRange: DateRange,
    _metrics: string[],
  ): Promise<NormalizedMetrics> {
    // TODO: Implement using Google Ads API
    // For now, return mock data
    console.log('Getting metrics for account:', accountId, 'range:', dateRange)

    return {
      source: 'google-ads',
      accountId,
      dateRange,
      data: [],
    }
  }
}

// Factory function
export function createGoogleAdsConnector(clientId: string, clientSecret: string): DataConnector {
  return new GoogleAdsConnector(clientId, clientSecret)
}
