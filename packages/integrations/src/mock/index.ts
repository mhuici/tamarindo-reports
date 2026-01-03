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

/**
 * Mock Google Analytics Connector
 * Returns realistic demo analytics data without requiring API credentials
 */
export class MockGoogleAnalyticsConnector implements DataConnector {
  readonly id = 'google-analytics'
  readonly displayName = 'Google Analytics 4 (Demo)'
  readonly icon = 'logos:google-analytics'

  async getAuthUrl(_tenantId: string, redirectUri: string): Promise<string> {
    return `${redirectUri}?code=mock_ga4_code&state=${_tenantId}`
  }

  async handleCallback(_code: string, _redirectUri: string): Promise<OAuthTokens> {
    return {
      accessToken: 'mock_ga4_access_token',
      refreshToken: 'mock_ga4_refresh_token',
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
    }
  }

  async refreshTokens(_refreshToken: string): Promise<OAuthTokens> {
    return {
      accessToken: 'mock_ga4_access_token_refreshed',
      refreshToken: 'mock_ga4_refresh_token',
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    }
  }

  async getAccounts(_accessToken: string): Promise<Account[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    // Return mock GA4 properties
    return [
      {
        id: '123456789',
        name: 'Main Website - GA4',
        currency: 'USD',
        timezone: 'America/New_York',
      },
      {
        id: '987654321',
        name: 'E-commerce Store - GA4',
        currency: 'USD',
        timezone: 'America/Los_Angeles',
      },
    ]
  }

  async getMetrics(
    _accessToken: string,
    accountId: string,
    dateRange: DateRange,
    _metrics: string[],
  ): Promise<NormalizedMetrics> {
    await new Promise(resolve => setTimeout(resolve, 800))

    // Generate mock GA4 analytics data
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const data = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      // Generate realistic analytics data with some variance
      const baseMultiplier = accountId.includes('ecommerce') ? 1.5 : 1
      const dayOfWeek = date.getDay()
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1

      const sessions = Math.round((1500 + Math.random() * 500) * baseMultiplier * weekendFactor)
      const users = Math.round(sessions * (0.7 + Math.random() * 0.1))
      const newUsers = Math.round(users * (0.3 + Math.random() * 0.2))
      const pageviews = Math.round(sessions * (2.5 + Math.random() * 1))
      const bounceRate = 0.4 + Math.random() * 0.2
      const avgSessionDuration = 120 + Math.random() * 60
      const transactions = Math.round(sessions * (0.02 + Math.random() * 0.01))
      const revenue = transactions * (50 + Math.random() * 100)

      data.push({
        date: dateStr,
        metrics: {
          sessions,
          users,
          newUsers,
          pageviews,
          bounceRate: Math.round(bounceRate * 100) / 100,
          avgSessionDuration: Math.round(avgSessionDuration),
          transactions,
          revenue: Math.round(revenue * 100) / 100,
          // Map to canonical format
          impressions: sessions,
          clicks: newUsers,
          conversions: transactions,
          conversionValue: Math.round(revenue * 100) / 100,
          cost: 0, // GA4 is free
          spend: 0,
        },
      })
    }

    return {
      source: 'ga4',
      accountId,
      dateRange,
      data,
    }
  }
}

// Factory functions
export function createMockGoogleAdsConnector(): MockGoogleAdsConnector {
  return new MockGoogleAdsConnector()
}

export function createMockFacebookAdsConnector(): MockFacebookAdsConnector {
  return new MockFacebookAdsConnector()
}

export function createMockGoogleAnalyticsConnector(): MockGoogleAnalyticsConnector {
  return new MockGoogleAnalyticsConnector()
}
