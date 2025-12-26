import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireRole } from '../../utils/auth'
import { createClient } from '../../utils/db'

const createClientSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})

/**
 * POST /api/clients
 * Create a new client (requires MEMBER role or higher)
 */
export default defineEventHandler(async (event) => {
  const user = requireRole(event, 'MEMBER')
  const body = await readBody(event)

  // Validate input
  const result = createClientSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid client data',
      data: result.error.flatten(),
    })
  }

  const client = await createClient({
    ...result.data,
    tenantId: user.tenantId,
  })

  return { client }
})
