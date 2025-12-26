import { defineEventHandler } from 'h3'
import { getUser } from '../../utils/auth'
import { findUserById } from '../../utils/db'
import { prisma } from '../../utils/db'

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export default defineEventHandler(async (event) => {
  const session = getUser(event)

  if (!session) {
    return { user: null }
  }

  const user = await findUserById(session.userId)

  if (!user) {
    return { user: null }
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { slug: true, name: true, branding: true },
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      tenantId: user.tenantId,
      tenantSlug: tenant?.slug,
      tenantName: tenant?.name,
    },
  }
})
