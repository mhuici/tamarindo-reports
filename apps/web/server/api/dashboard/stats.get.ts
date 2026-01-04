import { defineEventHandler } from 'h3'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for the tenant
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const tenantId = user.tenantId

  // Date ranges
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  // Run all queries in parallel
  const [
    totalClients,
    clientsLastMonth,
    reportsThisMonth,
    reportsLastMonth,
    totalReports,
    activeIntegrations,
    reportsWithPDF,
    scheduledReports,
    emailsSent,
    publicReports,
    monthlyReportTrend,
    clientsWithReports,
  ] = await Promise.all([
    // Total clients
    prisma.client.count({
      where: { tenantId },
    }),

    // Clients added last month
    prisma.client.count({
      where: {
        tenantId,
        createdAt: { lt: startOfMonth },
      },
    }),

    // Reports this month
    prisma.report.count({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
      },
    }),

    // Reports last month
    prisma.report.count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    }),

    // Total reports
    prisma.report.count({
      where: { tenantId },
    }),

    // Active integrations
    prisma.dataSource.count({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
    }),

    // Reports with PDF generated
    prisma.report.count({
      where: {
        tenantId,
        pdfUrl: { not: null },
      },
    }),

    // Scheduled reports (active)
    prisma.reportSchedule.count({
      where: {
        report: { tenantId },
        isActive: true,
      },
    }),

    // Emails sent this month
    prisma.scheduleSendLog.count({
      where: {
        schedule: {
          report: { tenantId },
        },
        status: 'success',
        sentAt: { gte: startOfMonth },
      },
    }),

    // Public (shared) reports
    prisma.report.count({
      where: {
        tenantId,
        isPublic: true,
      },
    }),

    // Monthly report trend (last 6 months)
    prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        COUNT(*)::bigint as count
      FROM "Report"
      WHERE "tenantId" = ${tenantId}
        AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `,

    // Clients with at least one report
    prisma.client.count({
      where: {
        tenantId,
        reports: { some: {} },
      },
    }),
  ])

  // Calculate changes
  const clientsChange = totalClients - clientsLastMonth
  const reportsChange = reportsThisMonth - reportsLastMonth
  const reportsChangePercent = reportsLastMonth > 0
    ? Math.round(((reportsThisMonth - reportsLastMonth) / reportsLastMonth) * 100)
    : reportsThisMonth > 0 ? 100 : 0

  // Format monthly trend for charts
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const trendData = []

  // Fill in the last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const found = monthlyReportTrend.find(m => m.month === monthKey)
    trendData.push({
      month: monthNames[date.getMonth()],
      reports: found ? Number(found.count) : 0,
    })
  }

  return {
    success: true,
    stats: {
      // Main KPIs
      totalClients,
      clientsChange,
      clientsWithReports,

      reportsThisMonth,
      reportsLastMonth,
      reportsChange,
      reportsChangePercent,
      totalReports,

      activeIntegrations,
      reportsWithPDF,
      scheduledReports,
      emailsSent,
      publicReports,

      // Trend data for charts
      monthlyTrend: trendData,
    },
  }
})
