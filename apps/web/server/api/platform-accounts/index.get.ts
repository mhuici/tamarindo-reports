import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/db'
import { requireAuth } from '../../utils/auth'

/**
 * GET /api/platform-accounts
 * List all platform accounts for the current tenant
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const platformAccounts = await prisma.platformAccount.findMany({
    where: {
      dataSource: {
        tenantId: user.tenantId,
        isActive: true,
      },
    },
    include: {
      dataSource: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      clientAccounts: {
        include: {
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
  })

  // Transform to a cleaner format
  return platformAccounts.map(account => ({
    id: account.id,
    platformId: account.platformId,
    name: account.name,
    currency: account.currency,
    timezone: account.timezone,
    platform: account.dataSource.type,
    dataSource: {
      id: account.dataSource.id,
      name: account.dataSource.name,
    },
    linkedClients: account.clientAccounts.map(ca => ({
      id: ca.client.id,
      name: ca.client.name,
    })),
  }))
})
