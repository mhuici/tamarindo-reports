import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100),
})

/**
 * PUT /api/auth/profile
 * Update current user's profile
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)

  const result = updateProfileSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid profile data',
      data: result.error.flatten(),
    })
  }

  const { name } = result.data

  const updatedUser = await prisma.user.update({
    where: { id: user.userId },
    data: { name },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  return {
    success: true,
    user: updatedUser,
  }
})
