import { defineEventHandler, createError } from 'h3'
import { requireAuth } from '../../../utils/auth'
import { prisma } from '../../../utils/db'

/**
 * GET /api/clients/:id/data-sources
 * Get all data sources assigned to a client
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const clientId = getRouterParam(event, 'id')

  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: 'Client ID is required',
    })
  }

  // Verify client belongs to tenant
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      tenantId: user.tenantId,
    },
    select: {
      id: true,
      name: true,
      clientAccounts: {
        select: {
          id: true,
          createdAt: true,
          platformAccount: {
            select: {
              id: true,
              platformId: true,
              name: true,
              currency: true,
              timezone: true,
              isActive: true,
              lastSyncAt: true,
              dataSource: {
                select: {
                  id: true,
                  type: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!client) {
    throw createError({
      statusCode: 404,
      message: 'Client not found',
    })
  }

  // Also get available (unassigned) platform accounts
  const availableAccounts = await prisma.platformAccount.findMany({
    where: {
      dataSource: {
        tenantId: user.tenantId,
        isActive: true,
      },
      isActive: true,
      clientAccounts: {
        none: {
          clientId,
        },
      },
    },
    select: {
      id: true,
      platformId: true,
      name: true,
      currency: true,
      timezone: true,
      dataSource: {
        select: {
          id: true,
          type: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return {
    success: true,
    assignedAccounts: client.clientAccounts.map(ca => ({
      assignmentId: ca.id,
      assignedAt: ca.createdAt,
      id: ca.platformAccount.id,
      platformId: ca.platformAccount.platformId,
      name: ca.platformAccount.name,
      currency: ca.platformAccount.currency,
      timezone: ca.platformAccount.timezone,
      isActive: ca.platformAccount.isActive,
      lastSyncAt: ca.platformAccount.lastSyncAt,
      dataSource: ca.platformAccount.dataSource,
    })),
    availableAccounts: availableAccounts.map(pa => ({
      id: pa.id,
      platformId: pa.platformId,
      name: pa.name,
      currency: pa.currency,
      timezone: pa.timezone,
      dataSource: pa.dataSource,
    })),
  }
})
