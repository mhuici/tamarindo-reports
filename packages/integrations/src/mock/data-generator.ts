import type { Account, DateRange, MetricDataPoint, NormalizedMetrics } from '@tamarindo/types'

/**
 * Realistic mock data generator for Google Ads and Facebook Ads
 * Based on typical e-commerce/lead gen campaign patterns
 */

// Realistic baseline metrics (daily averages)
const CAMPAIGN_PROFILES = {
  ecommerce: {
    impressions: { min: 8000, max: 25000 },
    clicks: { min: 200, max: 800 },
    cost: { min: 50, max: 300 },
    conversions: { min: 5, max: 40 },
    conversionValue: { min: 200, max: 2000 },
  },
  leadgen: {
    impressions: { min: 5000, max: 15000 },
    clicks: { min: 150, max: 500 },
    cost: { min: 30, max: 150 },
    conversions: { min: 3, max: 25 },
    conversionValue: { min: 50, max: 500 },
  },
  awareness: {
    impressions: { min: 20000, max: 100000 },
    clicks: { min: 500, max: 2000 },
    cost: { min: 100, max: 500 },
    conversions: { min: 1, max: 10 },
    conversionValue: { min: 0, max: 100 },
  },
}

// Day of week multipliers (Mon=0, Sun=6)
const DAY_MULTIPLIERS = [0.9, 1.0, 1.05, 1.1, 1.15, 0.85, 0.75]

// Hour multipliers for intraday patterns (optional)
const TREND_PATTERNS = {
  growing: (dayIndex: number, totalDays: number) => 0.8 + (0.4 * dayIndex / totalDays),
  declining: (dayIndex: number, totalDays: number) => 1.2 - (0.4 * dayIndex / totalDays),
  stable: () => 1.0,
  seasonal: (dayIndex: number) => 1 + 0.2 * Math.sin(dayIndex / 7 * Math.PI),
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function addNoise(value: number, noisePercent = 0.15): number {
  const noise = value * noisePercent * (Math.random() - 0.5) * 2
  return Math.max(0, value + noise)
}

function generateDailyMetrics(
  profile: keyof typeof CAMPAIGN_PROFILES,
  date: Date,
  dayIndex: number,
  totalDays: number,
  trend: keyof typeof TREND_PATTERNS = 'stable',
): Record<string, number> {
  const baseMetrics = CAMPAIGN_PROFILES[profile]
  const dayOfWeek = date.getDay()
  const dayMultiplier = DAY_MULTIPLIERS[dayOfWeek === 0 ? 6 : dayOfWeek - 1]
  const trendMultiplier = TREND_PATTERNS[trend](dayIndex, totalDays)

  const impressions = Math.round(
    addNoise(randomInRange(baseMetrics.impressions.min, baseMetrics.impressions.max))
    * dayMultiplier
    * trendMultiplier,
  )

  const clicks = Math.round(
    addNoise(randomInRange(baseMetrics.clicks.min, baseMetrics.clicks.max))
    * dayMultiplier
    * trendMultiplier,
  )

  const cost = Math.round(
    addNoise(randomInRange(baseMetrics.cost.min, baseMetrics.cost.max))
    * dayMultiplier
    * trendMultiplier
    * 100,
  ) / 100

  const conversions = Math.round(
    addNoise(randomInRange(baseMetrics.conversions.min, baseMetrics.conversions.max))
    * dayMultiplier
    * trendMultiplier
    * 10,
  ) / 10

  const conversionValue = Math.round(
    addNoise(randomInRange(baseMetrics.conversionValue.min, baseMetrics.conversionValue.max))
    * dayMultiplier
    * trendMultiplier
    * 100,
  ) / 100

  // Calculated metrics
  const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0
  const cpc = clicks > 0 ? Math.round((cost / clicks) * 100) / 100 : 0
  const conversionRate = clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0
  const costPerConversion = conversions > 0 ? Math.round((cost / conversions) * 100) / 100 : 0
  const roas = cost > 0 ? Math.round((conversionValue / cost) * 100) / 100 : 0

  return {
    impressions,
    clicks,
    cost,
    conversions,
    conversionValue,
    ctr,
    cpc,
    conversionRate,
    costPerConversion,
    roas,
    // Facebook-specific
    reach: Math.round(impressions * 0.7),
    frequency: Math.round((impressions / (impressions * 0.7)) * 100) / 100,
  }
}

export function generateMockMetrics(
  source: 'google-ads' | 'facebook-ads',
  accountId: string,
  dateRange: DateRange,
  options: {
    profile?: keyof typeof CAMPAIGN_PROFILES
    trend?: keyof typeof TREND_PATTERNS
  } = {},
): NormalizedMetrics {
  const { profile = 'ecommerce', trend = 'stable' } = options

  const startDate = new Date(dateRange.start)
  const endDate = new Date(dateRange.end)
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const data: MetricDataPoint[] = []

  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() + i)

    data.push({
      date: currentDate.toISOString().split('T')[0],
      metrics: generateDailyMetrics(profile, currentDate, i, totalDays, trend),
    })
  }

  return {
    source,
    accountId,
    dateRange,
    data,
  }
}

export function generateMockAccounts(source: 'google-ads' | 'facebook-ads'): Account[] {
  if (source === 'google-ads') {
    return [
      {
        id: '1234567890',
        name: 'Demo - Tienda Principal',
        currency: 'MXN',
        timezone: 'America/Mexico_City',
      },
      {
        id: '0987654321',
        name: 'Demo - Campañas Branding',
        currency: 'MXN',
        timezone: 'America/Mexico_City',
      },
    ]
  }

  // Facebook Ads
  return [
    {
      id: 'act_123456789',
      name: 'Demo - Facebook Ads Principal',
      currency: 'MXN',
      timezone: 'America/Mexico_City',
    },
    {
      id: 'act_987654321',
      name: 'Demo - Instagram Ads',
      currency: 'MXN',
      timezone: 'America/Mexico_City',
    },
  ]
}

// Pre-generated realistic campaign names
export const MOCK_CAMPAIGN_NAMES = {
  'google-ads': [
    'Search - Brand Terms',
    'Search - Generic Keywords',
    'Shopping - All Products',
    'Display - Remarketing',
    'YouTube - Video Views',
    'Performance Max - Conversions',
  ],
  'facebook-ads': [
    'Conversions - Lookalike 1%',
    'Conversions - Retargeting 7 days',
    'Traffic - Interest Targeting',
    'Engagement - Page Likes',
    'Video Views - Brand Awareness',
    'Lead Gen - Form Submissions',
  ],
}

/**
 * Check if we should use mock data (no real credentials)
 */
export function shouldUseMockData(): boolean {
  const googleConfigured = !!(
    process.env.GOOGLE_CLIENT_ID
    && process.env.GOOGLE_CLIENT_SECRET
    && process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  )

  const facebookConfigured = !!(
    process.env.FACEBOOK_APP_ID
    && process.env.FACEBOOK_APP_SECRET
  )

  // Use mock if neither is configured
  return !googleConfigured && !facebookConfigured
}

export function getMockDataMessage(): string {
  return 'Using demo data. Configure API credentials for real metrics.'
}
