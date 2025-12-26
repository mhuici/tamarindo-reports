import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { prisma, verifyPassword, hashPassword } from '../../utils/db'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

/**
 * PUT /api/auth/password
 * Change current user's password
 */
export default defineEventHandler(async (event) => {
  const authUser = requireAuth(event)
  const body = await readBody(event)

  const result = changePasswordSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid password data',
      data: result.error.flatten(),
    })
  }

  const { currentPassword, newPassword } = result.data

  // Get user with password hash
  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { passwordHash: true },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    })
  }

  // Verify current password
  const isValid = verifyPassword(currentPassword, user.passwordHash)
  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: 'Current password is incorrect',
    })
  }

  // Update password
  const newPasswordHash = hashPassword(newPassword)
  await prisma.user.update({
    where: { id: authUser.userId },
    data: { passwordHash: newPasswordHash },
  })

  return {
    success: true,
    message: 'Password changed successfully',
  }
})
