import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import crypto from 'crypto'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

const updateDashboardSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  widgets: z.array(z.any()).optional(),
  isPublic: z.boolean().optional(),
  password: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
})

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

/**
 * PUT /api/dashboards/:id
 * Update a dashboard
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Missing dashboard ID',
    })
  }

  const result = updateDashboardSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid dashboard data',
      data: result.error.flatten(),
    })
  }

  // Verify dashboard belongs to tenant
  const existingDashboard = await prisma.dashboard.findFirst({
    where: {
      id,
      tenantId: user.tenantId,
    },
  })

  if (!existingDashboard) {
    throw createError({
      statusCode: 404,
      message: 'Dashboard not found',
    })
  }

  // Build update data
  const updateData: any = {}

  if (result.data.name !== undefined) {
    updateData.name = result.data.name
  }

  if (result.data.widgets !== undefined) {
    updateData.widgets = result.data.widgets
  }

  if (result.data.isPublic !== undefined) {
    updateData.isPublic = result.data.isPublic
  }

  if (result.data.password !== undefined) {
    updateData.password = result.data.password ? hashPassword(result.data.password) : null
  }

  if (result.data.expiresAt !== undefined) {
    updateData.expiresAt = result.data.expiresAt ? new Date(result.data.expiresAt) : null
  }

  const dashboard = await prisma.dashboard.update({
    where: { id },
    data: updateData,
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
    success: true,
    dashboard: {
      id: dashboard.id,
      name: dashboard.name,
      slug: dashboard.slug,
      widgets: dashboard.widgets,
      isPublic: dashboard.isPublic,
      hasPassword: !!dashboard.password,
      expiresAt: dashboard.expiresAt,
      updatedAt: dashboard.updatedAt,
      client: dashboard.client,
    },
  }
})
