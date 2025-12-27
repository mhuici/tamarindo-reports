import { defineEventHandler, createError } from 'h3'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

/**
 * GET /api/dashboards/:id
 * Get a specific dashboard (authenticated)
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Missing dashboard ID',
    })
  }

  const dashboard = await prisma.dashboard.findFirst({
    where: {
      id,
      tenantId: user.tenantId,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!dashboard) {
    throw createError({
      statusCode: 404,
      message: 'Dashboard not found',
    })
  }

  return {
    dashboard: {
      id: dashboard.id,
      name: dashboard.name,
      slug: dashboard.slug,
      widgets: dashboard.widgets,
      isPublic: dashboard.isPublic,
      hasPassword: !!dashboard.password,
      expiresAt: dashboard.expiresAt,
      createdAt: dashboard.createdAt,
      updatedAt: dashboard.updatedAt,
      client: dashboard.client,
    },
  }
})
