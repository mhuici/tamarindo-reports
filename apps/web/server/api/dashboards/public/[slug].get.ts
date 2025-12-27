import { defineEventHandler, createError, getQuery } from 'h3'
import crypto from 'crypto'
import { prisma } from '../../../utils/db'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

/**
 * GET /api/dashboards/public/:slug
 * Get a public dashboard by slug (no auth required)
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Missing dashboard slug',
    })
  }

  const dashboard = await prisma.dashboard.findUnique({
    where: { slug },
    include: {
      client: {
        select: {
          name: true,
        },
      },
      tenant: {
        select: {
          name: true,
          branding: true,
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

  // Check if public
  if (!dashboard.isPublic) {
    throw createError({
      statusCode: 403,
      message: 'This dashboard is not public',
    })
  }

  // Check expiration
  if (dashboard.expiresAt && new Date(dashboard.expiresAt) < new Date()) {
    throw createError({
      statusCode: 410,
      message: 'This dashboard link has expired',
    })
  }

  // Check password if required
  if (dashboard.password) {
    const providedPassword = query.password as string

    if (!providedPassword) {
      return {
        requiresPassword: true,
        dashboard: {
          name: dashboard.name,
          clientName: dashboard.client.name,
          tenantName: dashboard.tenant.name,
        },
      }
    }

    if (hashPassword(providedPassword) !== dashboard.password) {
      throw createError({
        statusCode: 401,
        message: 'Incorrect password',
      })
    }
  }

  // Return dashboard data
  return {
    requiresPassword: false,
    dashboard: {
      name: dashboard.name,
      widgets: dashboard.widgets,
      clientName: dashboard.client.name,
      tenantName: dashboard.tenant.name,
      branding: dashboard.tenant.branding,
      createdAt: dashboard.createdAt,
      updatedAt: dashboard.updatedAt,
    },
  }
})
