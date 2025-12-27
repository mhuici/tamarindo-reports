import { defineEventHandler, getQuery } from 'h3'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

/**
 * GET /api/reports
 * List all reports for the current tenant
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const query = getQuery(event)

  const { clientId, status, type } = query

  const where: any = {
    tenantId: user.tenantId,
  }

  if (clientId) {
    where.clientId = clientId
  }

  if (status) {
    where.status = status
  }

  if (type) {
    where.type = type
  }

  const reports = await prisma.report.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
      template: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return {
    reports: reports.map(report => ({
      id: report.id,
      name: report.name,
      type: report.type,
      status: report.status,
      dateRange: report.dateRange,
      pdfUrl: report.pdfUrl,
      scheduledAt: report.scheduledAt,
      createdAt: report.createdAt,
      client: report.client,
      template: report.template,
    })),
  }
})
