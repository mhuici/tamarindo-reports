import { defineEventHandler, getQuery } from 'h3'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

/**
 * GET /api/dashboards
 * List all dashboards for the current tenant
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const query = getQuery(event)

  const where: any = {
    tenantId: user.tenantId,
  }

  // Filter by client
  if (query.clientId) {
    where.clientId = query.clientId
  }

  // Filter by public status
  if (query.isPublic !== undefined) {
    where.isPublic = query.isPublic === 'true'
  }

  const dashboards = await prisma.dashboard.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return {
    dashboards: dashboards.map(d => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      isPublic: d.isPublic,
      hasPassword: !!d.password,
      expiresAt: d.expiresAt,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      client: d.client,
    })),
  }
})
