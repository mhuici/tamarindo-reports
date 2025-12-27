import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

const updateReportSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(['DRAFT', 'GENERATING', 'COMPLETED', 'SCHEDULED', 'FAILED']).optional(),
  widgets: z.array(z.any()).optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  aiInsights: z.string().optional(),
  scheduledAt: z.string().nullable().optional(),
  scheduleCron: z.string().nullable().optional(),
})

/**
 * PUT /api/reports/:id
 * Update a report
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Missing report ID',
    })
  }

  const result = updateReportSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid report data',
      data: result.error.flatten(),
    })
  }

  // Verify report belongs to tenant
  const existingReport = await prisma.report.findFirst({
    where: {
      id,
      tenantId: user.tenantId,
    },
  })

  if (!existingReport) {
    throw createError({
      statusCode: 404,
      message: 'Report not found',
    })
  }

  const report = await prisma.report.update({
    where: { id },
    data: result.data,
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
      widgets: report.widgets,
      dateRange: report.dateRange,
      updatedAt: report.updatedAt,
      client: report.client,
    },
  }
})
