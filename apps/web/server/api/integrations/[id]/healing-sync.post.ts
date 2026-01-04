import { defineEventHandler, createError, getRouterParam } from 'h3'
import { requireAuth } from '../../../utils/auth'
import { prisma } from '../../../utils/db'
import { healingSync } from '../../../utils/integrations/healing-sync'

/**
 * POST /api/integrations/:id/healing-sync
 * Manually trigger healing sync for a data source
 * Re-fetches the last 7 days of metrics
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const dataSourceId = getRouterParam(event, 'id')

  if (!dataSourceId) {
    throw createError({
      statusCode: 400,
      message: 'Data source ID is required',
    })
  }

  // Verify data source belongs to tenant
  const dataSource = await prisma.dataSource.findFirst({
    where: {
      id: dataSourceId,
      tenantId: user.tenantId,
    },
  })

  if (!dataSource) {
    throw createError({
      statusCode: 404,
      message: 'Data source not found',
    })
  }

  // Run healing sync
  const result = await healingSync(dataSourceId)

  if (!result.success) {
    throw createError({
      statusCode: 500,
      message: result.errors.join(', ') || 'Healing sync failed',
    })
  }

  return {
    success: true,
    accountsProcessed: result.accountsProcessed,
    metricsUpdated: result.metricsUpdated,
  }
})
