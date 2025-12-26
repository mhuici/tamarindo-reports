import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireRole } from '../../utils/auth'
import { deleteClient } from '../../utils/db'

/**
 * DELETE /api/clients/:id
 * Delete a client (requires ADMIN role or higher)
 */
export default defineEventHandler(async (event) => {
  const user = requireRole(event, 'ADMIN')
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Client ID is required',
    })
  }

  const deleted = await deleteClient(id, user.tenantId)

  if (!deleted) {
    throw createError({
      statusCode: 404,
      message: 'Client not found',
    })
  }

  return { success: true }
})
