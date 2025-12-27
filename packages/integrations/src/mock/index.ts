import type { Account, DataConnector, DateRange, NormalizedMetrics, OAuthTokens } from '@tamarindo/types'
import { generateMockAccounts, generateMockMetrics } from './data-generator'

/**
 * Mock Google Ads Connector
 * Returns realistic demo data without requiring API credentials
 */
export class MockGoogleAdsConnector implements DataConnector {
  readonly id = 'google-ads'
  readonly displayName = 'Google Ads (Demo)'
  readonly icon = 'logos:google-ads'

  async getAuthUrl(_tenantId: string, redirectUri: string): Promise<string> {
    // Simulate OAuth - redirect back with mock code
    return `${redirectUri}?code=mock_google_code&state=${_tenantId}`
  }

  async handleCallback(_code: string, _redirectUri: string): Promise<OAuthTokens> {
    // Return mock tokens
    return {
      accessToken: 'mock_google_access_token',
      refreshToken: 'mock_google_refresh_token',
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      scope: 'https://www.googleapis.com/auth/adwords',
    }
  }

  async refreshTokens(_refreshToken: string): Promise<OAuthTokens> {
    return {
      accessToken: 'mock_google_access_token_refreshed',
      refreshToken: 'mock_google_refresh_token',
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    }
  }

  async getAccounts(_accessToken: string): Promise<Account[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return generateMockAccounts('google-ads')
  }

  async getMetrics(
    _accessToken: string,
    accountId: string,
    dateRange: DateRange,
    _metrics: string[],
  ): Promise<NormalizedMetrics> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Use different profiles for different accounts
    const profile = accountId.includes('Brand') ? 'awareness' : 'ecommerce'
    const trend = Math.random() > 0.5 ? 'growing' : 'stable'

    return generateMockMetrics('google-ads', accountId, dateRange, {
      profile: profile as any,
      trend: trend as any,
    })
  }
}

/**
 * Mock Facebook Ads Connector
 * Returns realistic demo data without requiring API credentials
 */
export class MockFacebookAdsConnector implements DataConnector {
  readonly id = 'facebook-ads'
  readonly displayName = 'Facebook Ads (Demo)'
  readonly icon = 'logos:facebook'

  async getAuthUrl(_tenantId: string, redirectUri: string): Promise<string> {
    return `${redirectUri}?code=mock_facebook_code&state=${_tenantId}`
  }

  async handleCallback(_code: string, _redirectUri: string): Promise<OAuthTokens> {
    return {
      accessToken: 'mock_facebook_access_token',
      expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
    }
  }

  async refreshTokens(_accessToken: string): Promise<OAuthTokens> {
    return {
      accessToken: 'mock_facebook_access_token_refreshed',
      expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000,
    }
  }

  async getAccounts(_accessToken: string): Promise<Account[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return generateMockAccounts('facebook-ads')
  }

  async getMetrics(
    _accessToken: string,
    accountId: string,
    dateRange: DateRange,
    _metrics: string[],
  ): Promise<NormalizedMetrics> {
    await new Promise(resolve => setTimeout(resolve, 800))

    const profile = accountId.includes('Instagram') ? 'awareness' : 'leadgen'
    const trend = Math.random() > 0.7 ? 'seasonal' : 'growing'

    return generateMockMetrics('facebook-ads', accountId, dateRange, {
      profile: profile as any,
      trend: trend as any,
    })
  }
}

// Factory functions
export function createMockGoogleAdsConnector(): MockGoogleAdsConnector {
  return new MockGoogleAdsConnector()
}

export function createMockFacebookAdsConnector(): MockFacebookAdsConnector {
  return new MockFacebookAdsConnector()
}
