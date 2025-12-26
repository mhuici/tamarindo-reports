import { PrismaClient, Plan, Role, DataSourceType, ReportStatus, ReportType } from '@prisma/client'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

// Simple password hash for demo (in production use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('🌱 Seeding database...')

  // ============================================
  // TENANT: Demo Agency
  // ============================================
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Agency',
      slug: 'demo',
      plan: Plan.AGENCY,
      branding: {
        primaryColor: '#d17a5a',
        secondaryColor: '#a14e33',
        font: 'Inter',
      },
      settings: {
        timezone: 'America/Mexico_City',
        language: 'es',
        emailNotifications: true,
      },
    },
  })
  console.log('✅ Created tenant:', demoTenant.name)

  // ============================================
  // USERS
  // ============================================
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.agency' },
    update: {},
    create: {
      email: 'admin@demo.agency',
      name: 'Admin User',
      role: Role.OWNER,
      tenantId: demoTenant.id,
      passwordHash: hashPassword('demo123'),
    },
  })

  const memberUser = await prisma.user.upsert({
    where: { email: 'member@demo.agency' },
    update: {},
    create: {
      email: 'member@demo.agency',
      name: 'Team Member',
      role: Role.MEMBER,
      tenantId: demoTenant.id,
      passwordHash: hashPassword('demo123'),
    },
  })

  console.log('✅ Created users:', [adminUser.email, memberUser.email].join(', '))

  // ============================================
  // CLIENTS
  // ============================================
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: 'client-acme' },
      update: {},
      create: {
        id: 'client-acme',
        name: 'Acme Corp',
        email: 'marketing@acme.com',
        phone: '+52 55 1234 5678',
        company: 'Acme Corporation',
        notes: 'Main client - e-commerce focus',
        tenantId: demoTenant.id,
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-techstart' },
      update: {},
      create: {
        id: 'client-techstart',
        name: 'TechStart',
        email: 'growth@techstart.io',
        phone: '+52 55 9876 5432',
        company: 'TechStart Inc',
        notes: 'SaaS startup - lead generation campaigns',
        tenantId: demoTenant.id,
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-growthco' },
      update: {},
      create: {
        id: 'client-growthco',
        name: 'GrowthCo',
        email: 'ads@growthco.com',
        company: 'GrowthCo LLC',
        notes: 'Consulting firm - brand awareness',
        tenantId: demoTenant.id,
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-foodie' },
      update: {},
      create: {
        id: 'client-foodie',
        name: 'Foodie Express',
        email: 'marketing@foodie.mx',
        company: 'Foodie Express SA de CV',
        notes: 'Food delivery app - local campaigns',
        tenantId: demoTenant.id,
      },
    }),
  ])
  console.log('✅ Created clients:', clients.length)

  // ============================================
  // REPORT TEMPLATES
  // ============================================
  const monthlyTemplate = await prisma.reportTemplate.upsert({
    where: { id: 'template-monthly' },
    update: {},
    create: {
      id: 'template-monthly',
      name: 'Monthly Performance Report',
      description: 'Comprehensive monthly report with all key metrics and AI insights',
      isDefault: true,
      tenantId: demoTenant.id,
      widgets: [
        { id: 'w1', type: 'metric-card', title: 'Impressions', metric: 'impressions', position: { x: 0, y: 0, w: 3, h: 1 } },
        { id: 'w2', type: 'metric-card', title: 'Clicks', metric: 'clicks', position: { x: 3, y: 0, w: 3, h: 1 } },
        { id: 'w3', type: 'metric-card', title: 'Cost', metric: 'cost', format: 'currency', position: { x: 6, y: 0, w: 3, h: 1 } },
        { id: 'w4', type: 'metric-card', title: 'Conversions', metric: 'conversions', position: { x: 9, y: 0, w: 3, h: 1 } },
        { id: 'w5', type: 'line-chart', title: 'Performance Trend', metrics: ['impressions', 'clicks'], position: { x: 0, y: 1, w: 6, h: 2 } },
        { id: 'w6', type: 'bar-chart', title: 'Cost by Campaign', metric: 'cost', dimension: 'campaign', position: { x: 6, y: 1, w: 6, h: 2 } },
        { id: 'w7', type: 'ai-insights', title: 'AI Insights', position: { x: 0, y: 3, w: 12, h: 2 } },
      ],
    },
  })

  const weeklyTemplate = await prisma.reportTemplate.upsert({
    where: { id: 'template-weekly' },
    update: {},
    create: {
      id: 'template-weekly',
      name: 'Weekly Quick Report',
      description: 'Quick weekly overview with key metrics',
      isDefault: false,
      tenantId: demoTenant.id,
      widgets: [
        { id: 'w1', type: 'metric-card', title: 'Impressions', metric: 'impressions', position: { x: 0, y: 0, w: 4, h: 1 } },
        { id: 'w2', type: 'metric-card', title: 'Clicks', metric: 'clicks', position: { x: 4, y: 0, w: 4, h: 1 } },
        { id: 'w3', type: 'metric-card', title: 'CTR', metric: 'ctr', format: 'percentage', position: { x: 8, y: 0, w: 4, h: 1 } },
        { id: 'w4', type: 'line-chart', title: 'Daily Performance', metrics: ['clicks', 'conversions'], position: { x: 0, y: 1, w: 12, h: 2 } },
      ],
    },
  })

  console.log('✅ Created templates:', [monthlyTemplate.name, weeklyTemplate.name].join(', '))

  // ============================================
  // SAMPLE REPORTS
  // ============================================
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const reports = await Promise.all([
    prisma.report.upsert({
      where: { id: 'report-acme-dec' },
      update: {},
      create: {
        id: 'report-acme-dec',
        name: 'December 2024 Report',
        type: ReportType.MONTHLY,
        status: ReportStatus.COMPLETED,
        clientId: 'client-acme',
        tenantId: demoTenant.id,
        templateId: monthlyTemplate.id,
        dateRange: {
          start: lastMonth.toISOString(),
          end: lastMonthEnd.toISOString(),
        },
        widgets: monthlyTemplate.widgets,
        aiInsights: 'Your campaigns performed 15% better than last month. Facebook Ads showed the best ROI with a 2.3x return. Consider increasing budget for evening hours (7-10 PM) where conversion rates are highest.',
      },
    }),
    prisma.report.upsert({
      where: { id: 'report-techstart-weekly' },
      update: {},
      create: {
        id: 'report-techstart-weekly',
        name: 'Week 51 Report',
        type: ReportType.WEEKLY,
        status: ReportStatus.COMPLETED,
        clientId: 'client-techstart',
        tenantId: demoTenant.id,
        templateId: weeklyTemplate.id,
        dateRange: {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: now.toISOString(),
        },
        widgets: weeklyTemplate.widgets,
      },
    }),
    prisma.report.upsert({
      where: { id: 'report-growthco-pending' },
      update: {},
      create: {
        id: 'report-growthco-pending',
        name: 'Q4 Campaign Analysis',
        type: ReportType.CAMPAIGN,
        status: ReportStatus.DRAFT,
        clientId: 'client-growthco',
        tenantId: demoTenant.id,
        dateRange: {
          start: new Date(now.getFullYear(), 9, 1).toISOString(), // Oct 1
          end: new Date(now.getFullYear(), 11, 31).toISOString(), // Dec 31
        },
        widgets: [],
      },
    }),
  ])

  console.log('✅ Created reports:', reports.length)

  // ============================================
  // SAMPLE DASHBOARDS
  // ============================================
  const dashboards = await Promise.all([
    prisma.dashboard.upsert({
      where: { slug: 'acme-live' },
      update: {},
      create: {
        name: 'Acme Live Dashboard',
        slug: 'acme-live',
        clientId: 'client-acme',
        tenantId: demoTenant.id,
        isPublic: true,
        password: 'acme2024', // In production, this should be hashed
        widgets: [
          { id: 'd1', type: 'metric-card', title: 'Today Spend', metric: 'cost', format: 'currency', position: { x: 0, y: 0, w: 4, h: 1 } },
          { id: 'd2', type: 'metric-card', title: 'Today Clicks', metric: 'clicks', position: { x: 4, y: 0, w: 4, h: 1 } },
          { id: 'd3', type: 'metric-card', title: 'Today Conv.', metric: 'conversions', position: { x: 8, y: 0, w: 4, h: 1 } },
          { id: 'd4', type: 'line-chart', title: 'Last 7 Days', metrics: ['clicks', 'conversions'], position: { x: 0, y: 1, w: 12, h: 2 } },
        ],
      },
    }),
    prisma.dashboard.upsert({
      where: { slug: 'techstart-metrics' },
      update: {},
      create: {
        name: 'TechStart Metrics',
        slug: 'techstart-metrics',
        clientId: 'client-techstart',
        tenantId: demoTenant.id,
        isPublic: true,
        widgets: [
          { id: 'd1', type: 'metric-card', title: 'Leads', metric: 'conversions', position: { x: 0, y: 0, w: 6, h: 1 } },
          { id: 'd2', type: 'metric-card', title: 'Cost per Lead', metric: 'cpa', format: 'currency', position: { x: 6, y: 0, w: 6, h: 1 } },
        ],
      },
    }),
  ])

  console.log('✅ Created dashboards:', dashboards.length)

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n🎉 Seeding completed!')
  console.log('─'.repeat(40))
  console.log('📊 Summary:')
  console.log(`   • 1 tenant (${demoTenant.slug})`)
  console.log(`   • 2 users`)
  console.log(`   • ${clients.length} clients`)
  console.log(`   • 2 templates`)
  console.log(`   • ${reports.length} reports`)
  console.log(`   • ${dashboards.length} dashboards`)
  console.log('─'.repeat(40))
  console.log('\n🔑 Login credentials:')
  console.log('   Email: admin@demo.agency')
  console.log('   Password: demo123')
  console.log(`   URL: http://localhost:3000/${demoTenant.slug}`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
