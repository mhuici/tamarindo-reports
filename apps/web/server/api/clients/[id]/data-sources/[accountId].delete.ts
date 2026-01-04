import { defineEventHandler, createError } from 'h3'
import { requireAuth } from '../../../../utils/auth'
import { prisma } from '../../../../utils/db'

/**
 * DELETE /api/clients/:id/data-sources/:accountId
 * Remove a platform account assignment from a client
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const clientId = getRouterParam(event, 'id')
  const accountId = getRouterParam(event, 'accountId')

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

  // Find and delete the assignment
  const clientAccount = await prisma.clientAccount.findFirst({
    where: {
      clientId,
      platformAccountId: accountId,
    },
  })

  if (!clientAccount) {
    throw createError({
      statusCode: 404,
      message: 'Account assignment not found',
    })
  }

  await prisma.clientAccount.delete({
    where: {
      id: clientAccount.id,
    },
  })

  return {
    success: true,
    message: 'Account removed from client',
  }
})
