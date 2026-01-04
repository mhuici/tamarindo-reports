import { defineEventHandler, createError } from 'h3'
import { requireAuth } from '../../../../utils/auth'
import { prisma } from '../../../../utils/db'

/**
 * GET /api/reports/:id/schedule
 * Get report schedule configuration
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const reportId = getRouterParam(event, 'id')

  if (!reportId) {
    throw createError({
      statusCode: 400,
      message: 'Report ID is required',
    })
  }

  // Verify report belongs to tenant
  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      tenantId: user.tenantId,
    },
    select: {
      id: true,
      name: true,
      schedule: {
        include: {
          sendHistory: {
            take: 5,
            orderBy: { sentAt: 'desc' },
          },
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
    success: true,
    schedule: report.schedule,
  }
})
