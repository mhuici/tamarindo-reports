import { defineEventHandler, readBody, setCookie, createError } from 'h3'
import { z } from 'zod'
import { findUserByEmail, verifyPassword } from '../../utils/db'
import { createAuthToken } from '../../utils/auth'
import { prisma } from '../../utils/db'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate input
  const result = loginSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid email or password format',
    })
  }

  const { email, password } = result.data

  // Find user
  const user = await findUserByEmail(email)

  if (!user || !user.passwordHash) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password',
    })
  }

  // Verify password
  const isValid = verifyPassword(password, user.passwordHash)

  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password',
    })
  }

  // Get tenant for slug
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { slug: true },
  })

  if (!tenant) {
    throw createError({
      statusCode: 500,
      message: 'User tenant not found',
    })
  }

  // Create token
  const token = createAuthToken({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    tenantId: user.tenantId,
    tenantSlug: tenant.slug,
  })

  // Set cookie
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantSlug: tenant.slug,
    },
  }
})
