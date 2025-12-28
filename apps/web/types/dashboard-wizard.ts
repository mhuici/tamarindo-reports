/**
 * Dashboard Creation Wizard Types
 * Professional guided dashboard creation experience
 */

// ============================================
// STEP 1: Dashboard Objective (Business Goal)
// ============================================

export type DashboardObjective = 'ecommerce' | 'branding' | 'leadgen'

export interface ObjectiveConfig {
  id: DashboardObjective
  label: string
  description: string
  icon: string
  color: string
  metrics: MetricCategory[]
}

// ============================================
// STEP 2: Metrics Configuration
// ============================================

export type MetricCategory = 'sales' | 'efficiency' | 'retention' | 'traffic' | 'engagement' | 'leads'

export interface MetricOption {
  id: string
  label: string
  description: string
  category: MetricCategory
  widgetType: WidgetType
  defaultSize: WidgetSize
  priority: 'hero' | 'primary' | 'secondary'
}

export interface MetricPriority {
  category: MetricCategory
  weight: number // 0-100
  selectedMetrics: string[]
}

// ============================================
// STEP 3: Branding & Visual
// ============================================

export interface BrandingConfig {
  clientId: string
  clientName: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  extractedColors?: ExtractedColors
}

export interface ExtractedColors {
  vibrant?: string
  muted?: string
  darkVibrant?: string
  darkMuted?: string
  lightVibrant?: string
  lightMuted?: string
}

// ============================================
// Widget System
// ============================================

export type WidgetType = 'metric' | 'line-chart' | 'bar-chart' | 'pie-chart' | 'table' | 'text'
export type WidgetSize = 'small' | 'medium' | 'large'
export type WidgetSlot = 'hero' | 'alerts' | 'insight' | 'recommendation'

export interface GeneratedWidget {
  id: string
  type: WidgetType
  title: string
  config: WidgetConfig
  size: WidgetSize
  slot?: WidgetSlot
  metricId?: string
}

export interface WidgetConfig {
  metric?: string
  comparison?: 'previous_period' | 'previous_year' | 'target'
  format?: 'number' | 'currency' | 'percent'
  chartType?: 'line' | 'bar' | 'pie'
  dateRange?: string
}

// ============================================
// Wizard State
// ============================================

export interface WizardState {
  currentStep: number
  objective: DashboardObjective | null
  metrics: MetricPriority[]
  branding: BrandingConfig
  generatedWidgets: GeneratedWidget[]
  dashboardName: string
  isPublic: boolean
  password?: string
}

export interface WizardStep {
  id: number
  name: string
  description: string
  isComplete: boolean
  isActive: boolean
}

// ============================================
// Objective Presets
// ============================================

export const OBJECTIVE_CONFIGS: ObjectiveConfig[] = [
  {
    id: 'ecommerce',
    label: 'E-commerce & Sales',
    description: 'Track revenue, ROAS, and conversion metrics for online stores',
    icon: 'heroicons:shopping-cart',
    color: '#10b981',
    metrics: ['sales', 'efficiency', 'retention', 'traffic'],
  },
  {
    id: 'branding',
    label: 'Brand Awareness',
    description: 'Measure reach, engagement, and brand sentiment across channels',
    icon: 'heroicons:megaphone',
    color: '#8b5cf6',
    metrics: ['engagement', 'traffic', 'efficiency'],
  },
  {
    id: 'leadgen',
    label: 'Lead Generation',
    description: 'Monitor lead quality, CPA, and conversion funnel performance',
    icon: 'heroicons:user-plus',
    color: '#f59e0b',
    metrics: ['leads', 'efficiency', 'traffic'],
  },
]

// ============================================
// Metric Definitions by Category
// ============================================

export const METRIC_DEFINITIONS: Record<MetricCategory, MetricOption[]> = {
  sales: [
    { id: 'revenue', label: 'Revenue', description: 'Total sales revenue', category: 'sales', widgetType: 'metric', defaultSize: 'large', priority: 'hero' },
    { id: 'transactions', label: 'Transactions', description: 'Number of completed orders', category: 'sales', widgetType: 'metric', defaultSize: 'medium', priority: 'primary' },
    { id: 'aov', label: 'Avg Order Value', description: 'Average revenue per transaction', category: 'sales', widgetType: 'metric', defaultSize: 'medium', priority: 'primary' },
    { id: 'revenue_trend', label: 'Revenue Trend', description: 'Revenue over time', category: 'sales', widgetType: 'line-chart', defaultSize: 'large', priority: 'primary' },
    { id: 'top_products', label: 'Top Products', description: 'Best selling products', category: 'sales', widgetType: 'bar-chart', defaultSize: 'medium', priority: 'secondary' },
  ],
  efficiency: [
    { id: 'roas', label: 'ROAS', description: 'Return on ad spend', category: 'efficiency', widgetType: 'metric', defaultSize: 'large', priority: 'hero' },
    { id: 'cpa', label: 'CPA', description: 'Cost per acquisition', category: 'efficiency', widgetType: 'metric', defaultSize: 'medium', priority: 'primary' },
    { id: 'cpc', label: 'CPC', description: 'Cost per click', category: 'efficiency', widgetType: 'metric', defaultSize: 'small', priority: 'secondary' },
    { id: 'cpm', label: 'CPM', description: 'Cost per 1000 impressions', category: 'efficiency', widgetType: 'metric', defaultSize: 'small', priority: 'secondary' },
    { id: 'spend', label: 'Ad Spend', description: 'Total advertising spend', category: 'efficiency', widgetType: 'metric', defaultSize: 'medium', priority: 'primary' },
    { id: 'spend_by_channel', label: 'Spend by Channel', description: 'Distribution of spend', category: 'efficiency', widgetType: 'pie-chart', defaultSize: 'medium', priority: 'secondary' },
  ],
  retention: [
    { id: 'ltv', label: 'LTV', description: 'Customer lifetime value', category: 'retention', widgetType: 'metric', defaultSize: 'large', priority: 'hero' },
    { id: 'repeat_rate', label: 'Repeat Rate', description: 'Percentage of returning customers', category: 'retention', widgetType: 'metric', defaultSize: 'medium', priority: 'primary' },
    { id: 'churn', label: 'Churn Rate', description: 'Customer churn percentage', category: 'retention', widgetType: 'metric', defaultSize: 'medium', priority: 'primary' },
    { id: 'cohort_retention', label: 'Cohort Retention', description: 'Retention by cohort', category: 'retention', widgetType: 'table', defaultSize: 'large', priority: 'secondary' },
  ],
  traffic: [
    { id: 'sessions', label: 'Sessions', description: 'Total website sessions', category: 'traffic', widgetType: 'metric', defaultSize: 'medium', priority: 'primary' },
    { id: 'users', label: 'Users', description: 'Unique visitors', category: 'traffic', widgetType: 'metric', defaultSize: 'medium', priority: 'primary' },
    { id: 'bounce_rate', label: 'Bounce Rate', description: 'Single-page session rate', category: 'traffic', widgetType: 'metric', defaultSize: 'small', priority: 'secondary' },
    { id: 'traffic_sources', label: 'Traffic Sources', description: 'Sessions by source', category: 'traffic', widgetType: 'pie-chart', defaultSize: 'medium', priority: 'secondary' },
    { id: 'traffic_trend', label: 'Traffic Trend', description: 'Sessions over time', category: 'traffic', widgetType: 'line-chart', defaultSize: 'large', priority: 'primary' },
  ],
  engagement: [
    { id: 'reach', label: 'Reach', description: 'Total audience reached', category: 'engagement', widgetType: 'metric', defaultSize: 'large', priority: 'hero' },
    { id: 'impressions', label: 'Impressions', description: 'Total ad impressions', category: 'engagement', widgetType: 'metric', defaultSize: 'medium', priority: 'primary' },
    { id: 'ctr', label: 'CTR', description: 'Click-through rate', category: 'engagement', widgetType: 'metric', defaultSize: 'medium', priority: 'primary' },
    { id: 'engagement_rate', label: 'Engagement Rate', description: 'Interactions per impression', category: 'engagement', widgetType: 'metric', defaultSize: 'medium', priority: 'primary' },
    { id: 'engagement_by_platform', label: 'By Platform', description: 'Engagement breakdown', category: 'engagement', widgetType: 'bar-chart', defaultSize: 'medium', priority: 'secondary' },
  ],
  leads: [
    { id: 'total_leads', label: 'Total Leads', description: 'Number of leads generated', category: 'leads', widgetType: 'metric', defaultSize: 'large', priority: 'hero' },
    { id: 'qualified_leads', label: 'Qualified Leads', description: 'MQL/SQL count', category: 'leads', widgetType: 'metric', defaultSize: 'medium', priority: 'primary' },
    { id: 'lead_quality', label: 'Lead Quality Score', description: 'Average lead quality', category: 'leads', widgetType: 'metric', defaultSize: 'medium', priority: 'primary' },
    { id: 'cost_per_lead', label: 'Cost per Lead', description: 'Average acquisition cost', category: 'leads', widgetType: 'metric', defaultSize: 'medium', priority: 'primary' },
    { id: 'lead_funnel', label: 'Lead Funnel', description: 'Conversion stages', category: 'leads', widgetType: 'bar-chart', defaultSize: 'large', priority: 'secondary' },
    { id: 'leads_by_source', label: 'Leads by Source', description: 'Lead source breakdown', category: 'leads', widgetType: 'pie-chart', defaultSize: 'medium', priority: 'secondary' },
  ],
}

// ============================================
// Category Labels
// ============================================

export const CATEGORY_LABELS: Record<MetricCategory, { label: string; icon: string; description: string }> = {
  sales: { label: 'Sales', icon: 'heroicons:banknotes', description: 'Revenue and transaction metrics' },
  efficiency: { label: 'Efficiency', icon: 'heroicons:bolt', description: 'Cost and performance metrics' },
  retention: { label: 'Retention', icon: 'heroicons:arrow-path', description: 'Customer loyalty metrics' },
  traffic: { label: 'Traffic', icon: 'heroicons:cursor-arrow-rays', description: 'Website visitor metrics' },
  engagement: { label: 'Engagement', icon: 'heroicons:heart', description: 'Social and content metrics' },
  leads: { label: 'Leads', icon: 'heroicons:user-plus', description: 'Lead generation metrics' },
}

// ============================================
// Color Palettes
// ============================================

export const COLOR_PALETTES = [
  { name: 'Professional', primary: '#1e40af', secondary: '#1f2937' },
  { name: 'Modern', primary: '#0ea5e9', secondary: '#0f172a' },
  { name: 'Growth', primary: '#10b981', secondary: '#064e3b' },
  { name: 'Energy', primary: '#f59e0b', secondary: '#78350f' },
  { name: 'Bold', primary: '#ef4444', secondary: '#7f1d1d' },
  { name: 'Premium', primary: '#8b5cf6', secondary: '#2e1065' },
]
