import { defineEventHandler, readBody, setCookie, createError } from 'h3'
import { z } from 'zod'
import { createTenant, createUser, generateUniqueSlug, hashPassword, findUserByEmail } from '../../utils/db'
import { createAuthToken } from '../../utils/auth'
import { prisma } from '../../utils/db'

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  agencyName: z.string().min(2).max(100),
})

/**
 * POST /api/auth/register
 * Register a new user and create their agency (tenant)
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate input
  const result = registerSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid registration data',
      data: result.error.flatten(),
    })
  }

  const { name, email, password, agencyName } = result.data

  // Check if email already exists
  const existingUser = await findUserByEmail(email)
  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: 'Email already registered',
    })
  }

  // Generate unique slug for tenant
  const slug = await generateUniqueSlug(agencyName)

  // Create tenant
  const tenant = await createTenant({
    name: agencyName,
    slug,
    plan: 'FREE',
    branding: {
      primaryColor: '#d17a5a',
      secondaryColor: '#a14e33',
    },
    settings: {
      timezone: 'America/Mexico_City',
      language: 'es',
    },
  })

  // Create user as owner
  const passwordHash = hashPassword(password)
  const user = await createUser({
    email,
    name,
    passwordHash,
    role: 'OWNER',
    tenantId: tenant.id,
  })

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
