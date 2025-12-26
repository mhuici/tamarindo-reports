import { PrismaClient, Plan, Role, DataSourceType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Agency',
      slug: 'demo',
      plan: Plan.AGENCY,
      branding: {
        primaryColor: '#d17a5a',
        secondaryColor: '#a14e33',
      },
      settings: {
        timezone: 'America/Mexico_City',
        language: 'es',
      },
    },
  })

  console.log('✅ Created tenant:', tenant.name)

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@tamarindo.reports' },
    update: {},
    create: {
      email: 'demo@tamarindo.reports',
      name: 'Demo User',
      role: Role.OWNER,
      tenantId: tenant.id,
      passwordHash: '$2a$10$demo.hash.placeholder', // Replace with real hash
    },
  })

  console.log('✅ Created user:', user.email)

  // Create demo clients
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: 'client-acme' },
      update: {},
      create: {
        id: 'client-acme',
        name: 'Acme Corp',
        email: 'marketing@acme.com',
        company: 'Acme Corporation',
        tenantId: tenant.id,
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-techstart' },
      update: {},
      create: {
        id: 'client-techstart',
        name: 'TechStart',
        email: 'hello@techstart.io',
        company: 'TechStart Inc',
        tenantId: tenant.id,
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-growthco' },
      update: {},
      create: {
        id: 'client-growthco',
        name: 'GrowthCo',
        email: 'team@growthco.com',
        company: 'GrowthCo LLC',
        tenantId: tenant.id,
      },
    }),
  ])

  console.log('✅ Created clients:', clients.length)

  // Create demo report templates
  const template = await prisma.reportTemplate.upsert({
    where: { id: 'template-monthly' },
    update: {},
    create: {
      id: 'template-monthly',
      name: 'Monthly Performance Report',
      description: 'Standard monthly report with key metrics and insights',
      isDefault: true,
      tenantId: tenant.id,
      widgets: [
        {
          type: 'metric-card',
          title: 'Total Impressions',
          metric: 'impressions',
          position: { x: 0, y: 0, w: 3, h: 1 },
        },
        {
          type: 'metric-card',
          title: 'Total Clicks',
          metric: 'clicks',
          position: { x: 3, y: 0, w: 3, h: 1 },
        },
        {
          type: 'metric-card',
          title: 'Total Cost',
          metric: 'cost',
          format: 'currency',
          position: { x: 6, y: 0, w: 3, h: 1 },
        },
        {
          type: 'metric-card',
          title: 'Conversions',
          metric: 'conversions',
          position: { x: 9, y: 0, w: 3, h: 1 },
        },
        {
          type: 'line-chart',
          title: 'Performance Over Time',
          metrics: ['impressions', 'clicks'],
          position: { x: 0, y: 1, w: 6, h: 2 },
        },
        {
          type: 'bar-chart',
          title: 'Cost by Campaign',
          metric: 'cost',
          dimension: 'campaign',
          position: { x: 6, y: 1, w: 6, h: 2 },
        },
      ],
    },
  })

  console.log('✅ Created template:', template.name)

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
