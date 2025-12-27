import { defineEventHandler } from 'h3'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

/**
 * GET /api/integrations
 * List all data sources for the current tenant
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const dataSources = await prisma.dataSource.findMany({
    where: {
      tenantId: user.tenantId,
    },
    select: {
      id: true,
      name: true,
      type: true,
      isActive: true,
      lastSyncAt: true,
      syncError: true,
      createdAt: true,
      _count: {
        select: {
          platformAccounts: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return {
    dataSources: dataSources.map(ds => ({
      id: ds.id,
      name: ds.name,
      type: ds.type,
      isActive: ds.isActive,
      lastSyncAt: ds.lastSyncAt,
      syncError: ds.syncError,
      createdAt: ds.createdAt,
      accountsCount: ds._count.platformAccounts,
    })),
  }
})
