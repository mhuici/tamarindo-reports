import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireAuth } from '../../utils/auth'
import { getClientWithDetails } from '../../utils/db'

/**
 * GET /api/clients/:id
 * Get a single client with details
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Client ID is required',
    })
  }

  const client = await getClientWithDetails(id, user.tenantId)

  if (!client) {
    throw createError({
      statusCode: 404,
      message: 'Client not found',
    })
  }

  return { client }
})
