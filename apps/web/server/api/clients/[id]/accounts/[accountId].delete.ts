import { defineEventHandler, createError } from 'h3'
import { prisma } from '../../../../utils/db'
import { requireAuth } from '../../../../utils/auth'

/**
 * DELETE /api/clients/[id]/accounts/[accountId]
 * Unlink a platform account from a client
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const clientId = event.context.params?.id
  const accountId = event.context.params?.accountId

  if (!clientId || !accountId) {
    throw createError({
      statusCode: 400,
      message: 'Client ID and Account ID are required',
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

  // Find and delete the link
  const clientAccount = await prisma.clientAccount.findFirst({
    where: {
      clientId,
      platformAccountId: accountId,
    },
  })

  if (!clientAccount) {
    throw createError({
      statusCode: 404,
      message: 'Account link not found',
    })
  }

  await prisma.clientAccount.delete({
    where: {
      id: clientAccount.id,
    },
  })

  return {
    success: true,
    message: 'Account unlinked successfully',
  }
})
