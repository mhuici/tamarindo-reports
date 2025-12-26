import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireRole } from '../../utils/auth'
import { updateClient } from '../../utils/db'

const updateClientSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})

/**
 * PUT /api/clients/:id
 * Update a client (requires MEMBER role or higher)
 */
export default defineEventHandler(async (event) => {
  const user = requireRole(event, 'MEMBER')
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Client ID is required',
    })
  }

  const body = await readBody(event)

  // Validate input
  const result = updateClientSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid client data',
      data: result.error.flatten(),
    })
  }

  const client = await updateClient(id, user.tenantId, result.data)

  if (!client) {
    throw createError({
      statusCode: 404,
      message: 'Client not found',
    })
  }

  return { client }
})
