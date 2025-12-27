import type { DataConnector } from '@tamarindo/types'

// Re-export types
export type { DataConnector, OAuthTokens, Account, NormalizedMetrics, DateRange } from '@tamarindo/types'

// Re-export mock utilities
export { shouldUseMockData, getMockDataMessage, generateMockMetrics, generateMockAccounts } from './mock/data-generator'
export { createMockGoogleAdsConnector, createMockFacebookAdsConnector } from './mock'

// Connector registry
const connectors = new Map<string, DataConnector>()

export function registerConnector(connector: DataConnector): void {
  connectors.set(connector.id, connector)
}

export function getConnector(id: string): DataConnector | undefined {
  return connectors.get(id)
}

export function getAllConnectors(): DataConnector[] {
  return Array.from(connectors.values())
}

// Available connector IDs
export const CONNECTOR_IDS = {
  GOOGLE_ADS: 'google-ads',
  FACEBOOK_ADS: 'facebook-ads',
} as const

export type ConnectorId = typeof CONNECTOR_IDS[keyof typeof CONNECTOR_IDS]
