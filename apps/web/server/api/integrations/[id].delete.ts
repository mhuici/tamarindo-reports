import { defineEventHandler, createError } from 'h3'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

/**
 * DELETE /api/integrations/:id
 * Disconnect/delete a data source
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Missing data source ID',
    })
  }

  // Verify the data source belongs to the user's tenant
  const dataSource = await prisma.dataSource.findFirst({
    where: {
      id,
      tenantId: user.tenantId,
    },
  })

  if (!dataSource) {
    throw createError({
      statusCode: 404,
      message: 'Data source not found',
    })
  }

  // Delete the data source
  await prisma.dataSource.delete({
    where: { id },
  })

  return {
    success: true,
    message: 'Integration disconnected successfully',
  }
})
