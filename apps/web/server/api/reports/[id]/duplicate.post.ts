import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { prisma } from '../../../utils/db'

const duplicateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  clientId: z.string().optional(),
})

/**
 * POST /api/reports/:id/duplicate
 * Duplicate an existing report
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

  const result = duplicateSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request data',
    })
  }

  const { name: newName, clientId: newClientId } = result.data

  // Fetch the original report
  const originalReport = await prisma.report.findFirst({
    where: {
      id,
      tenantId: user.tenantId,
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

  if (!originalReport) {
    throw createError({
      statusCode: 404,
      message: 'Report not found',
    })
  }

  // If a new clientId is provided, verify it belongs to the tenant
  let targetClientId = originalReport.clientId
  let targetClient = originalReport.client

  if (newClientId && newClientId !== originalReport.clientId) {
    const client = await prisma.client.findFirst({
      where: {
        id: newClientId,
        tenantId: user.tenantId,
      },
      select: {
        id: true,
        name: true,
      },
    })

    if (!client) {
      throw createError({
        statusCode: 404,
        message: 'Client not found',
      })
    }

    targetClientId = client.id
    targetClient = client
  }

  // Generate the new name
  const duplicateName = newName || `${originalReport.name} (Copy)`

  // Create the duplicate report
  const duplicatedReport = await prisma.report.create({
    data: {
      name: duplicateName,
      type: originalReport.type,
      status: 'DRAFT',
      widgets: originalReport.widgets as any,
      dateRange: originalReport.dateRange as any,
      tenantId: user.tenantId,
      clientId: targetClientId,
      templateId: originalReport.templateId,
      // Reset these fields
      pdfUrl: null,
      aiInsights: null,
      error: null,
      scheduledAt: null,
      scheduleCron: null,
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
      id: duplicatedReport.id,
      name: duplicatedReport.name,
      type: duplicatedReport.type,
      status: duplicatedReport.status,
      dateRange: duplicatedReport.dateRange,
      createdAt: duplicatedReport.createdAt,
      client: duplicatedReport.client,
    },
  }
})
