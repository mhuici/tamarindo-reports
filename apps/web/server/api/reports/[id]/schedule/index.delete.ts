import { defineEventHandler, createError } from 'h3'
import { requireAuth } from '../../../../utils/auth'
import { prisma } from '../../../../utils/db'

/**
 * DELETE /api/reports/:id/schedule
 * Delete report schedule
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
      schedule: true,
    },
  })

  if (!report) {
    throw createError({
      statusCode: 404,
      message: 'Report not found',
    })
  }

  if (!report.schedule) {
    throw createError({
      statusCode: 404,
      message: 'No schedule found for this report',
    })
  }

  // Delete schedule
  await prisma.reportSchedule.delete({
    where: { reportId },
  })

  return {
    success: true,
    message: 'Schedule deleted',
  }
})
