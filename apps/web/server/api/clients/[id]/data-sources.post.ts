import { defineEventHandler, createError, readBody } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { prisma } from '../../../utils/db'

const assignSchema = z.object({
  platformAccountId: z.string(),
})

/**
 * POST /api/clients/:id/data-sources
 * Assign a platform account to a client
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const clientId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: 'Client ID is required',
    })
  }

  // Validate input
  const result = assignSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
    })
  }

  const { platformAccountId } = result.data

  // Verify client belongs to tenant
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      tenantId: user.tenantId,
    },
  })

  if (!client) {
    throw createError({
      statusCode: 404,
      message: 'Client not found',
    })
  }

  // Verify platform account belongs to tenant (via data source)
  const platformAccount = await prisma.platformAccount.findFirst({
    where: {
      id: platformAccountId,
      dataSource: {
        tenantId: user.tenantId,
      },
    },
    include: {
      dataSource: {
        select: {
          type: true,
          name: true,
        },
      },
    },
  })

  if (!platformAccount) {
    throw createError({
      statusCode: 404,
      message: 'Platform account not found',
    })
  }

  // Check if already assigned
  const existingAssignment = await prisma.clientAccount.findUnique({
    where: {
      clientId_platformAccountId: {
        clientId,
        platformAccountId,
      },
    },
  })

  if (existingAssignment) {
    throw createError({
      statusCode: 400,
      message: 'Account already assigned to this client',
    })
  }

  // Create assignment
  const clientAccount = await prisma.clientAccount.create({
    data: {
      clientId,
      platformAccountId,
    },
    include: {
      platformAccount: {
        select: {
          id: true,
          name: true,
          platformId: true,
          currency: true,
          timezone: true,
          dataSource: {
            select: {
              type: true,
            },
          },
        },
      },
    },
  })

  return {
    success: true,
    clientAccount: {
      id: clientAccount.id,
      platformAccount: {
        id: clientAccount.platformAccount.id,
        name: clientAccount.platformAccount.name,
        platformId: clientAccount.platformAccount.platformId,
        currency: clientAccount.platformAccount.currency,
        timezone: clientAccount.platformAccount.timezone,
        type: clientAccount.platformAccount.dataSource.type,
      },
    },
  }
})
