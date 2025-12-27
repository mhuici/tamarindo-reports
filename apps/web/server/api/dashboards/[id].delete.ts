import { defineEventHandler, createError } from 'h3'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

/**
 * DELETE /api/dashboards/:id
 * Delete a dashboard
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Missing dashboard ID',
    })
  }

  // Verify dashboard belongs to tenant
  const dashboard = await prisma.dashboard.findFirst({
    where: {
      id,
      tenantId: user.tenantId,
    },
  })

  if (!dashboard) {
    throw createError({
      statusCode: 404,
      message: 'Dashboard not found',
    })
  }

  await prisma.dashboard.delete({
    where: { id },
  })

  return {
    success: true,
    message: 'Dashboard deleted successfully',
  }
})
