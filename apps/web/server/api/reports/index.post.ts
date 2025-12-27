import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

const createReportSchema = z.object({
  name: z.string().min(1).max(200),
  clientId: z.string().min(1),
  type: z.enum(['MONTHLY', 'WEEKLY', 'CAMPAIGN', 'CUSTOM']).default('CUSTOM'),
  templateId: z.string().optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  widgets: z.array(z.any()).default([]),
})

/**
 * POST /api/reports
 * Create a new report
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)

  const result = createReportSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid report data',
      data: result.error.flatten(),
    })
  }

  const { name, clientId, type, templateId, dateRange, widgets } = result.data

  // Verify client belongs to tenant
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      tenantId: user.tenantId,
    },
  })

  if (!client) {
    throw createError({
      statusCode: 404,
      message: 'Client not found',
    })
  }

  // If template provided, verify it exists
  if (templateId) {
    const template = await prisma.reportTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { tenantId: user.tenantId },
          { tenantId: null }, // Global templates
        ],
      },
    })

    if (!template) {
      throw createError({
        statusCode: 404,
        message: 'Template not found',
      })
    }
  }

  const report = await prisma.report.create({
    data: {
      name,
      type,
      status: 'DRAFT',
      dateRange,
      widgets,
      tenantId: user.tenantId,
      clientId,
      templateId,
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
    report: {
      id: report.id,
      name: report.name,
      type: report.type,
      status: report.status,
      dateRange: report.dateRange,
      createdAt: report.createdAt,
      client: report.client,
    },
  }
})
