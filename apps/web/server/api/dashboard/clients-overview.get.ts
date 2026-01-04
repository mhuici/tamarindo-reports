import { defineEventHandler, getQuery } from 'h3'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

/**
 * GET /api/dashboard/clients-overview
 * Get clients overview with report stats
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const tenantId = user.tenantId
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 100)

  // Get clients with their report counts and last activity
  const clients = await prisma.client.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          reports: true,
        },
      },
      reports: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          isPublic: true,
        },
      },
    },
  })

  // Get report counts by client for the current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const reportsThisMonth = await prisma.report.groupBy({
    by: ['clientId'],
    where: {
      tenantId,
      createdAt: { gte: startOfMonth },
    },
    _count: true,
  })

  const reportsThisMonthMap = new Map(
    reportsThisMonth.map(r => [r.clientId, r._count])
  )

  // Format response
  const clientsOverview = clients.map(client => ({
    id: client.id,
    name: client.name,
    email: client.email,
    totalReports: client._count.reports,
    reportsThisMonth: reportsThisMonthMap.get(client.id) || 0,
    lastReport: client.reports[0] || null,
    createdAt: client.createdAt,
    status: client._count.reports > 0 ? 'active' : 'new',
  }))

  return {
    success: true,
    clients: clientsOverview,
  }
})
