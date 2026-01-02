import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '../../../utils/db'
import { requireAuth } from '../../../utils/auth'

/**
 * POST /api/clients/[id]/accounts
 * Link a platform account to a client
 * Body: { platformAccountId: string }
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const clientId = event.context.params?.id

  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: 'Client ID is required',
    })
  }

  const body = await readBody(event)
  const { platformAccountId } = body

  if (!platformAccountId) {
    throw createError({
      statusCode: 400,
      message: 'platformAccountId is required',
    })
  }

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

  // Verify platform account belongs to tenant
  const platformAccount = await prisma.platformAccount.findFirst({
    where: {
      id: platformAccountId,
      dataSource: {
        tenantId: user.tenantId,
      },
    },
  })

  if (!platformAccount) {
    throw createError({
      statusCode: 404,
      message: 'Platform account not found',
    })
  }

  // Check if already linked
  const existingLink = await prisma.clientAccount.findFirst({
    where: {
      clientId,
      platformAccountId,
    },
  })

  if (existingLink) {
    throw createError({
      statusCode: 400,
      message: 'Account is already linked to this client',
    })
  }

  // Create the link
  const clientAccount = await prisma.clientAccount.create({
    data: {
      clientId,
      platformAccountId,
    },
    include: {
      platformAccount: {
        include: {
          dataSource: {
            select: {
              type: true,
              name: true,
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
        platform: clientAccount.platformAccount.dataSource.type,
      },
    },
  }
})
