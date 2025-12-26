import type { H3Event } from 'h3'
import { getCookie, createError } from 'h3'
import jwt from 'jsonwebtoken'
import type { AuthUser } from '@tamarindo/types'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production-min-32-chars'

export interface JWTPayload {
  userId: string
  email: string
  tenantId: string
  tenantSlug: string
  role: string
}

/**
 * Create a JWT token for a user
 */
export function createAuthToken(user: AuthUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    tenantId: user.tenantId,
    tenantSlug: user.tenantSlug,
    role: user.role,
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Verify and decode a JWT token
 */
export function verifyAuthToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

/**
 * Get the current user from the request
 * Returns null if not authenticated
 */
export function getUser(event: H3Event): JWTPayload | null {
  const token = getCookie(event, 'auth_token')

  if (!token) {
    return null
  }

  try {
    return verifyAuthToken(token)
  }
  catch {
    return null
  }
}

/**
 * Require authentication - throws 401 if not authenticated
 */
export function requireAuth(event: H3Event): JWTPayload {
  const user = getUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    })
  }

  return user
}

/**
 * Require specific role - throws 403 if insufficient permissions
 */
export function requireRole(event: H3Event, requiredRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'): JWTPayload {
  const user = requireAuth(event)

  const roleHierarchy: Record<string, number> = {
    VIEWER: 0,
    MEMBER: 1,
    ADMIN: 2,
    OWNER: 3,
  }

  if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: `This action requires ${requiredRole} role or higher`,
    })
  }

  return user
}

/**
 * Require tenant access - validates user has access to the specified tenant
 */
export function requireTenantAccess(event: H3Event, tenantSlug: string): JWTPayload {
  const user = requireAuth(event)

  if (user.tenantSlug !== tenantSlug) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'You do not have access to this tenant',
    })
  }

  return user
}
