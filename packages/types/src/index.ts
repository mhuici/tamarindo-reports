// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================
// Auth Types
// ============================================

export interface AuthUser {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  tenantId: string
  tenantSlug: string
}

export interface Session {
  user: AuthUser
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

// ============================================
// Integration Types
// ============================================

export interface OAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  scope?: string
}

export interface DateRange {
  start: string // ISO date string
  end: string // ISO date string
}

export interface Account {
  id: string
  name: string
  currency?: string
  timezone?: string
}

export interface MetricDataPoint {
  date: string // ISO date string
  metrics: Record<string, number>
  dimensions?: Record<string, string>
}

export interface NormalizedMetrics {
  source: 'google-ads' | 'facebook-ads' | 'ga4' | string
  accountId: string
  dateRange: DateRange
  data: MetricDataPoint[]
}

// ============================================
// Data Connector Interface
// ============================================

export interface DataConnector {
  readonly id: string
  readonly displayName: string
  readonly icon: string

  getAuthUrl(tenantId: string, redirectUri: string): Promise<string>
  handleCallback(code: string, tenantId: string): Promise<OAuthTokens>
  refreshTokens(refreshToken: string): Promise<OAuthTokens>
  getAccounts(accessToken: string): Promise<Account[]>
  getMetrics(
    accessToken: string,
    accountId: string,
    dateRange: DateRange,
    metrics: string[]
  ): Promise<NormalizedMetrics>
}

// ============================================
// Report Types
// ============================================

export type WidgetType =
  | 'metric-card'
  | 'line-chart'
  | 'bar-chart'
  | 'pie-chart'
  | 'table'
  | 'text'
  | 'ai-insights'

export interface WidgetPosition {
  x: number
  y: number
  w: number
  h: number
}

export interface BaseWidget {
  id: string
  type: WidgetType
  title?: string
  position: WidgetPosition
}

export interface MetricCardWidget extends BaseWidget {
  type: 'metric-card'
  metric: string
  format?: 'number' | 'currency' | 'percentage'
  comparison?: 'previous_period' | 'previous_year'
}

export interface ChartWidget extends BaseWidget {
  type: 'line-chart' | 'bar-chart' | 'pie-chart'
  metrics: string[]
  dimension?: string
}

export interface TableWidget extends BaseWidget {
  type: 'table'
  columns: string[]
  dimension: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface TextWidget extends BaseWidget {
  type: 'text'
  content: string
}

export interface AIInsightsWidget extends BaseWidget {
  type: 'ai-insights'
  prompt?: string
}

export type Widget =
  | MetricCardWidget
  | ChartWidget
  | TableWidget
  | TextWidget
  | AIInsightsWidget

// ============================================
// Branding Types
// ============================================

export interface TenantBranding {
  logo?: string
  primaryColor: string
  secondaryColor?: string
  font?: string
  emailHeader?: string
  emailFooter?: string
}

// ============================================
// AI Types
// ============================================

export interface AIInsight {
  summary: string
  highlights: string[]
  recommendations: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
}

// ============================================
// Canonical Metrics (Session 14)
// ============================================

export * from './canonical-metrics'
export * from './metric-definitions'
