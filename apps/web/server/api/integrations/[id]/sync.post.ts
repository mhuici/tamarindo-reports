import { defineEventHandler, createError } from 'h3'
import { requireAuth } from '../../../utils/auth'
import { prisma } from '../../../utils/db'
import { syncPlatformAccounts } from '../../../utils/integrations/sync-accounts'

/**
 * POST /api/integrations/:id/sync
 * Manually trigger sync of platform accounts
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const dataSourceId = getRouterParam(event, 'id')

  if (!dataSourceId) {
    throw createError({
      statusCode: 400,
      message: 'DataSource ID is required',
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
      message: 'DataSource not found',
    })
  }

  // Sync accounts
  const result = await syncPlatformAccounts(dataSourceId)

  if (!result.success) {
    throw createError({
      statusCode: 500,
      message: result.error || 'Sync failed',
    })
  }

  return {
    success: true,
    accountsFound: result.accountsFound,
    accountsSynced: result.accountsSynced,
  }
})
