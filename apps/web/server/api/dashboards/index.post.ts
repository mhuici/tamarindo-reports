import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import crypto from 'crypto'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

const createDashboardSchema = z.object({
  name: z.string().min(1).max(200),
  clientId: z.string().min(1),
  widgets: z.array(z.any()).default([]),
  isPublic: z.boolean().default(false),
  password: z.string().optional(),
  expiresAt: z.string().optional(),
})

function generateSlug(): string {
  return crypto.randomBytes(8).toString('base64url')
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

/**
 * POST /api/dashboards
 * Create a new dashboard
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)

  const result = createDashboardSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid dashboard data',
      data: result.error.flatten(),
    })
  }

  // Verify client belongs to tenant
  const client = await prisma.client.findFirst({
    where: {
      id: result.data.clientId,
      tenantId: user.tenantId,
    },
  })

  if (!client) {
    throw createError({
      statusCode: 404,
      message: 'Client not found',
    })
  }

  // Generate unique slug
  let slug = generateSlug()
  let attempts = 0
  while (attempts < 5) {
    const existing = await prisma.dashboard.findUnique({ where: { slug } })
    if (!existing) break
    slug = generateSlug()
    attempts++
  }

  const dashboard = await prisma.dashboard.create({
    data: {
      name: result.data.name,
      slug,
      widgets: result.data.widgets,
      isPublic: result.data.isPublic,
      password: result.data.password ? hashPassword(result.data.password) : null,
      expiresAt: result.data.expiresAt ? new Date(result.data.expiresAt) : null,
      tenantId: user.tenantId,
      clientId: result.data.clientId,
    },
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
      isPublic: dashboard.isPublic,
      hasPassword: !!dashboard.password,
      expiresAt: dashboard.expiresAt,
      createdAt: dashboard.createdAt,
      client: dashboard.client,
    },
  }
})
