import { defineEventHandler, createError } from 'h3'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

/**
 * DELETE /api/reports/:id
 * Delete a report
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

  // Verify report belongs to tenant
  const report = await prisma.report.findFirst({
    where: {
      id,
      tenantId: user.tenantId,
    },
  })

  if (!report) {
    throw createError({
      statusCode: 404,
      message: 'Report not found',
    })
  }

  await prisma.report.delete({
    where: { id },
  })

  return {
    success: true,
    message: 'Report deleted successfully',
  }
})
