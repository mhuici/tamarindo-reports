import { prisma } from '../client'
import type { User, Role } from '@prisma/client'

export interface CreateUserInput {
  email: string
  name?: string
  passwordHash?: string
  role?: Role
  tenantId: string
  googleId?: string
  facebookId?: string
}

export interface UpdateUserInput {
  name?: string
  avatarUrl?: string
  role?: Role
}

/**
 * Find user by email (global, across all tenants)
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  })
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  })
}

/**
 * Find user by Google ID
 */
export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { googleId },
  })
}

/**
 * Find user by Facebook ID
 */
export async function findUserByFacebookId(facebookId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { facebookId },
  })
}

/**
 * Get all users for a tenant
 */
export async function getUsersByTenant(tenantId: string): Promise<User[]> {
  return prisma.user.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      role: input.role || 'MEMBER',
      tenantId: input.tenantId,
      googleId: input.googleId,
      facebookId: input.facebookId,
    },
  })
}

/**
 * Update user
 */
export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: input,
  })
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(id: string): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { lastLoginAt: new Date() },
  })
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({
    where: { id },
  })
}

/**
 * Check if user has access to tenant
 */
export async function userHasTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
    select: { id: true },
  })
  return user !== null
}

/**
 * Check if user has specific role or higher
 */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    VIEWER: 0,
    MEMBER: 1,
    ADMIN: 2,
    OWNER: 3,
  }
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}
