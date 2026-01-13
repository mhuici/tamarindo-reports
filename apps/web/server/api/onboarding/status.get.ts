import { prisma } from '@tamarindo/db'

export default defineEventHandler(async (event) => {
  const { user } = event.context

  if (!user?.tenantId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const tenantId = user.tenantId

  // Fetch all relevant counts in parallel
  const [
    integrationCount,
    clientCount,
    clientWithAccountCount,
    dashboardCount,
    tenant,
  ] = await Promise.all([
    // Count data sources (integrations)
    prisma.dataSource.count({
      where: { tenantId, status: 'ACTIVE' },
    }),

    // Count clients
    prisma.client.count({
      where: { tenantId },
    }),

    // Count clients that have at least one account assigned
    prisma.client.count({
      where: {
        tenantId,
        clientAccounts: { some: {} },
      },
    }),

    // Count dashboards
    prisma.dashboard.count({
      where: { tenantId },
    }),

    // Get tenant settings to check if insight was seen
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    }),
  ])

  // Check if insight has been seen (stored in tenant settings)
  const settings = (tenant?.settings as Record<string, unknown>) || {}
  const hasSeenInsight = Boolean(settings.onboardingInsightSeen)

  return {
    success: true,
    state: {
      hasIntegration: integrationCount > 0,
      hasClient: clientCount > 0,
      hasClientWithAccount: clientWithAccountCount > 0,
      hasDashboard: dashboardCount > 0,
      hasSeenInsight,
    },
  }
})
