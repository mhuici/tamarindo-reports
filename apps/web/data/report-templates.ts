export interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: 'performance' | 'social' | 'executive' | 'campaign' | 'custom'
  tags: string[]
  widgets: Array<{
    type: string
    title: string
    size: 'small' | 'medium' | 'large'
    config: Record<string, any>
  }>
  preview?: string // Optional preview image URL
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  // ============================================
  // PERFORMANCE TEMPLATES
  // ============================================
  {
    id: 'ppc-performance',
    name: 'PPC Performance',
    description: 'Complete paid advertising performance overview with spend, conversions, and ROI metrics.',
    icon: 'heroicons:currency-dollar',
    category: 'performance',
    tags: ['Google Ads', 'Facebook Ads', 'PPC', 'ROI'],
    widgets: [
      // Row 1: Key metrics (4 small cards)
      {
        type: 'metric',
        title: 'Total Ad Spend',
        size: 'small',
        config: { metric: 'spend', showComparison: true, color: '#3b82f6' },
      },
      {
        type: 'metric',
        title: 'Total Clicks',
        size: 'small',
        config: { metric: 'clicks', showComparison: true, color: '#10b981' },
      },
      {
        type: 'metric',
        title: 'Conversions',
        size: 'small',
        config: { metric: 'conversions', showComparison: true, color: '#8b5cf6' },
      },
      {
        type: 'metric',
        title: 'ROAS',
        size: 'small',
        config: { metric: 'roas', showComparison: true, color: '#f97316' },
      },
      // Row 2: Spend trend (full width)
      {
        type: 'line-chart',
        title: 'Daily Ad Spend',
        size: 'large',
        config: { metric: 'spend', color: '#3b82f6' },
      },
      // Row 3: CPC and CTR (2 medium)
      {
        type: 'metric',
        title: 'Avg. Cost per Click',
        size: 'medium',
        config: { metric: 'cpc', showComparison: true, color: '#ef4444' },
      },
      {
        type: 'metric',
        title: 'Click-through Rate',
        size: 'medium',
        config: { metric: 'ctr', showComparison: true, color: '#10b981' },
      },
      // Row 4: Conversions chart
      {
        type: 'bar-chart',
        title: 'Conversions by Day',
        size: 'large',
        config: { metric: 'conversions', color: '#8b5cf6' },
      },
    ],
  },

  {
    id: 'monthly-overview',
    name: 'Monthly Overview',
    description: 'Standard monthly client report with all key performance indicators.',
    icon: 'heroicons:calendar',
    category: 'performance',
    tags: ['Monthly', 'Client Report', 'Overview'],
    widgets: [
      // Header metrics
      {
        type: 'metric',
        title: 'Impressions',
        size: 'small',
        config: { metric: 'impressions', showComparison: true, color: '#6366f1' },
      },
      {
        type: 'metric',
        title: 'Clicks',
        size: 'small',
        config: { metric: 'clicks', showComparison: true, color: '#10b981' },
      },
      {
        type: 'metric',
        title: 'Ad Spend',
        size: 'small',
        config: { metric: 'spend', showComparison: true, color: '#f97316' },
      },
      {
        type: 'metric',
        title: 'Conversions',
        size: 'small',
        config: { metric: 'conversions', showComparison: true, color: '#8b5cf6' },
      },
      // Trend chart
      {
        type: 'line-chart',
        title: 'Performance Trend',
        size: 'large',
        config: { metric: 'clicks', color: '#10b981' },
      },
      // Cost metrics
      {
        type: 'metric',
        title: 'Cost per Click',
        size: 'medium',
        config: { metric: 'cpc', showComparison: true, color: '#ef4444' },
      },
      {
        type: 'metric',
        title: 'Cost per Conversion',
        size: 'medium',
        config: { metric: 'costPerConversion', showComparison: true, color: '#f59e0b' },
      },
      // Summary text
      {
        type: 'text',
        title: 'Summary',
        size: 'large',
        config: { content: 'Add your monthly summary and insights here. Highlight key wins, challenges, and recommendations for next month.' },
      },
    ],
  },

  // ============================================
  // EXECUTIVE TEMPLATES
  // ============================================
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level overview for executives with key metrics and ROI focus.',
    icon: 'heroicons:briefcase',
    category: 'executive',
    tags: ['Executive', 'Summary', 'ROI', 'C-Level'],
    widgets: [
      // Big ROI number
      {
        type: 'metric',
        title: 'Return on Ad Spend',
        size: 'medium',
        config: { metric: 'roas', showComparison: true, color: '#10b981' },
      },
      {
        type: 'metric',
        title: 'Total Investment',
        size: 'medium',
        config: { metric: 'spend', showComparison: true, color: '#3b82f6' },
      },
      // Key results
      {
        type: 'metric',
        title: 'Total Conversions',
        size: 'medium',
        config: { metric: 'conversions', showComparison: true, color: '#8b5cf6' },
      },
      {
        type: 'metric',
        title: 'Conversion Value',
        size: 'medium',
        config: { metric: 'conversionValue', showComparison: true, color: '#f97316' },
      },
      // Spend trend
      {
        type: 'bar-chart',
        title: 'Investment Over Time',
        size: 'large',
        config: { metric: 'spend', color: '#3b82f6' },
      },
      // Executive summary
      {
        type: 'text',
        title: 'Executive Summary',
        size: 'large',
        config: { content: 'Key Highlights:\n\n1. Overall Performance: [Summary]\n2. Budget Utilization: [Details]\n3. ROI Achievement: [Details]\n4. Recommendations: [Next steps]' },
      },
    ],
  },

  // ============================================
  // SOCIAL TEMPLATES
  // ============================================
  {
    id: 'social-media',
    name: 'Social Media Report',
    description: 'Social media advertising performance with reach, engagement, and cost metrics.',
    icon: 'heroicons:share',
    category: 'social',
    tags: ['Social', 'Facebook', 'Instagram', 'Engagement'],
    widgets: [
      // Reach and impressions
      {
        type: 'metric',
        title: 'Total Reach',
        size: 'small',
        config: { metric: 'reach', showComparison: true, color: '#3b82f6' },
      },
      {
        type: 'metric',
        title: 'Impressions',
        size: 'small',
        config: { metric: 'impressions', showComparison: true, color: '#6366f1' },
      },
      {
        type: 'metric',
        title: 'Clicks',
        size: 'small',
        config: { metric: 'clicks', showComparison: true, color: '#10b981' },
      },
      {
        type: 'metric',
        title: 'CTR',
        size: 'small',
        config: { metric: 'ctr', showComparison: true, color: '#f59e0b' },
      },
      // Reach trend
      {
        type: 'line-chart',
        title: 'Daily Reach',
        size: 'large',
        config: { metric: 'reach', color: '#3b82f6' },
      },
      // Cost metrics
      {
        type: 'metric',
        title: 'Ad Spend',
        size: 'medium',
        config: { metric: 'spend', showComparison: true, color: '#ef4444' },
      },
      {
        type: 'metric',
        title: 'CPM',
        size: 'medium',
        config: { metric: 'cpm', showComparison: true, color: '#8b5cf6' },
      },
      // Platform breakdown
      {
        type: 'pie-chart',
        title: 'Spend by Platform',
        size: 'medium',
        config: { metric: 'spend', color: '#f97316' },
      },
      {
        type: 'text',
        title: 'Audience Insights',
        size: 'medium',
        config: { content: 'Key audience insights and engagement patterns go here.' },
      },
    ],
  },

  // ============================================
  // CAMPAIGN TEMPLATES
  // ============================================
  {
    id: 'campaign-analysis',
    name: 'Campaign Analysis',
    description: 'Deep dive into specific campaign performance with detailed metrics.',
    icon: 'heroicons:rocket-launch',
    category: 'campaign',
    tags: ['Campaign', 'Analysis', 'Deep Dive'],
    widgets: [
      // Campaign header
      {
        type: 'text',
        title: 'Campaign Overview',
        size: 'large',
        config: { content: 'Campaign Name: [Name]\nObjective: [Objective]\nDuration: [Start] - [End]\nBudget: [Amount]' },
      },
      // Key metrics
      {
        type: 'metric',
        title: 'Budget Spent',
        size: 'small',
        config: { metric: 'spend', showComparison: false, color: '#3b82f6' },
      },
      {
        type: 'metric',
        title: 'Impressions',
        size: 'small',
        config: { metric: 'impressions', showComparison: false, color: '#6366f1' },
      },
      {
        type: 'metric',
        title: 'Clicks',
        size: 'small',
        config: { metric: 'clicks', showComparison: false, color: '#10b981' },
      },
      {
        type: 'metric',
        title: 'Conversions',
        size: 'small',
        config: { metric: 'conversions', showComparison: false, color: '#8b5cf6' },
      },
      // Performance over time
      {
        type: 'line-chart',
        title: 'Campaign Performance',
        size: 'large',
        config: { metric: 'conversions', color: '#8b5cf6' },
      },
      // Efficiency metrics
      {
        type: 'metric',
        title: 'Cost per Result',
        size: 'medium',
        config: { metric: 'costPerConversion', showComparison: false, color: '#ef4444' },
      },
      {
        type: 'metric',
        title: 'ROAS',
        size: 'medium',
        config: { metric: 'roas', showComparison: false, color: '#10b981' },
      },
      // Learnings
      {
        type: 'text',
        title: 'Key Learnings',
        size: 'large',
        config: { content: '1. What worked well:\n\n2. What could be improved:\n\n3. Recommendations for future campaigns:' },
      },
    ],
  },

  {
    id: 'ab-test-report',
    name: 'A/B Test Results',
    description: 'Compare performance between test variants with clear metrics.',
    icon: 'heroicons:beaker',
    category: 'campaign',
    tags: ['A/B Test', 'Experiment', 'Comparison'],
    widgets: [
      // Test overview
      {
        type: 'text',
        title: 'Test Overview',
        size: 'large',
        config: { content: 'Hypothesis: [What we tested]\n\nVariant A: [Description]\nVariant B: [Description]\n\nTest Duration: [Dates]\nSample Size: [Number]' },
      },
      // Variant A metrics
      {
        type: 'metric',
        title: 'Variant A - CTR',
        size: 'medium',
        config: { metric: 'ctr', showComparison: false, color: '#3b82f6' },
      },
      {
        type: 'metric',
        title: 'Variant A - Conv. Rate',
        size: 'medium',
        config: { metric: 'conversionRate', showComparison: false, color: '#3b82f6' },
      },
      // Variant B metrics
      {
        type: 'metric',
        title: 'Variant B - CTR',
        size: 'medium',
        config: { metric: 'ctr', showComparison: false, color: '#f97316' },
      },
      {
        type: 'metric',
        title: 'Variant B - Conv. Rate',
        size: 'medium',
        config: { metric: 'conversionRate', showComparison: false, color: '#f97316' },
      },
      // Comparison chart
      {
        type: 'bar-chart',
        title: 'Performance Comparison',
        size: 'large',
        config: { metric: 'conversions', color: '#8b5cf6' },
      },
      // Conclusion
      {
        type: 'text',
        title: 'Conclusion & Next Steps',
        size: 'large',
        config: { content: 'Winner: [Variant]\n\nStatistical Significance: [Yes/No]\n\nRecommendation: [Action to take]' },
      },
    ],
  },

  // ============================================
  // CUSTOM / STARTER TEMPLATES
  // ============================================
  {
    id: 'quick-metrics',
    name: 'Quick Metrics',
    description: 'Simple 4-metric overview for quick reports.',
    icon: 'heroicons:bolt',
    category: 'custom',
    tags: ['Quick', 'Simple', 'Minimal'],
    widgets: [
      {
        type: 'metric',
        title: 'Impressions',
        size: 'small',
        config: { metric: 'impressions', showComparison: true, color: '#6366f1' },
      },
      {
        type: 'metric',
        title: 'Clicks',
        size: 'small',
        config: { metric: 'clicks', showComparison: true, color: '#10b981' },
      },
      {
        type: 'metric',
        title: 'Spend',
        size: 'small',
        config: { metric: 'spend', showComparison: true, color: '#f97316' },
      },
      {
        type: 'metric',
        title: 'Conversions',
        size: 'small',
        config: { metric: 'conversions', showComparison: true, color: '#8b5cf6' },
      },
    ],
  },

  {
    id: 'blank',
    name: 'Blank Report',
    description: 'Start from scratch with an empty canvas.',
    icon: 'heroicons:document-plus',
    category: 'custom',
    tags: ['Blank', 'Custom', 'Empty'],
    widgets: [],
  },
]

// Helper to get templates by category
export function getTemplatesByCategory(category: ReportTemplate['category']) {
  return REPORT_TEMPLATES.filter(t => t.category === category)
}

// Helper to get template by ID
export function getTemplateById(id: string) {
  return REPORT_TEMPLATES.find(t => t.id === id)
}

// Categories for display
export const TEMPLATE_CATEGORIES = [
  { id: 'performance', label: 'Performance', icon: 'heroicons:chart-bar' },
  { id: 'executive', label: 'Executive', icon: 'heroicons:briefcase' },
  { id: 'social', label: 'Social Media', icon: 'heroicons:share' },
  { id: 'campaign', label: 'Campaign', icon: 'heroicons:rocket-launch' },
  { id: 'custom', label: 'Custom', icon: 'heroicons:squares-plus' },
] as const
