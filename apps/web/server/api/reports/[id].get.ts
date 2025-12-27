import { defineEventHandler, createError } from 'h3'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

/**
 * GET /api/reports/:id
 * Get a specific report
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Missing report ID',
    })
  }

  const report = await prisma.report.findFirst({
    where: {
      id,
      tenantId: user.tenantId,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      template: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!report) {
    throw createError({
      statusCode: 404,
      message: 'Report not found',
    })
  }

  return {
    report: {
      id: report.id,
      name: report.name,
      type: report.type,
      status: report.status,
      widgets: report.widgets,
      dateRange: report.dateRange,
      aiInsights: report.aiInsights,
      pdfUrl: report.pdfUrl,
      error: report.error,
      scheduledAt: report.scheduledAt,
      scheduleCron: report.scheduleCron,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      client: report.client,
      template: report.template,
    },
  }
})
