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
      status: true,
      lastSync: true,
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
      status: ds.status,
      lastSync: ds.lastSync,
      createdAt: ds.createdAt,
      accountsCount: ds._count.platformAccounts,
    })),
  }
})
