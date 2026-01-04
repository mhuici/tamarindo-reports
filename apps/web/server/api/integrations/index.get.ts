import { defineEventHandler, getQuery } from 'h3'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

/**
 * GET /api/integrations
 * List all data sources for the current tenant
 * ?includeAccounts=true to include platform accounts
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const query = getQuery(event)
  const includeAccounts = query.includeAccounts === 'true'

  const dataSources = await prisma.dataSource.findMany({
    where: {
      tenantId: user.tenantId,
    },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      isActive: true,
      lastSyncAt: true,
      syncError: true,
      authError: true,
      createdAt: true,
      _count: {
        select: {
          platformAccounts: true,
        },
      },
      platformAccounts: includeAccounts
        ? {
            select: {
              id: true,
              platformId: true,
              name: true,
              currency: true,
              timezone: true,
              isActive: true,
              lastSyncAt: true,
              _count: {
                select: {
                  clientAccounts: true,
                },
              },
              clientAccounts: {
                select: {
                  client: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              name: 'asc',
            },
          }
        : false,
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
      isActive: ds.isActive,
      lastSyncAt: ds.lastSyncAt,
      syncError: ds.syncError,
      authError: ds.authError,
      createdAt: ds.createdAt,
      accountsCount: ds._count.platformAccounts,
      platformAccounts: includeAccounts
        ? ds.platformAccounts.map(pa => ({
            id: pa.id,
            platformId: pa.platformId,
            name: pa.name,
            currency: pa.currency,
            timezone: pa.timezone,
            isActive: pa.isActive,
            lastSyncAt: pa.lastSyncAt,
            assignedClientsCount: pa._count.clientAccounts,
            assignedClients: pa.clientAccounts.map(ca => ca.client),
          }))
        : undefined,
    })),
  }
})
