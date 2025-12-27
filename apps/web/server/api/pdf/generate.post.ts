import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'
import { generateReportPDF, isPDFServiceAvailable, generateMockPDFUrl } from '../../utils/pdf/generator'

const generatePDFSchema = z.object({
  reportId: z.string().min(1),
  useMock: z.boolean().optional().default(false),
})

/**
 * POST /api/pdf/generate
 * Generate PDF for a report
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)

  const result = generatePDFSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request data',
      data: result.error.flatten(),
    })
  }

  const { reportId, useMock } = result.data

  // Fetch report
  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      tenantId: user.tenantId,
    },
    include: {
      client: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!report) {
    throw createError({
      statusCode: 404,
      message: 'Report not found',
    })
  }

  const dateRange = report.dateRange as { start: string; end: string }

  let pdfUrl: string

  // Use mock if requested or if PDF service is not available
  if (useMock || !isPDFServiceAvailable()) {
    pdfUrl = generateMockPDFUrl(reportId)
  }
  else {
    const pdfResult = await generateReportPDF({
      reportId: report.id,
      reportName: report.name,
      clientName: report.client.name,
      tenantId: user.tenantId,
      dateRange,
      widgets: report.widgets as any[],
      aiInsights: report.aiInsights || undefined,
    })

    if (!pdfResult.success) {
      throw createError({
        statusCode: 500,
        message: pdfResult.error || 'Failed to generate PDF',
      })
    }

    pdfUrl = pdfResult.pdfUrl!
  }

  // Update report with PDF URL and mark as completed
  await prisma.report.update({
    where: { id: reportId },
    data: {
      pdfUrl,
      status: 'COMPLETED',
    },
  })

  return {
    success: true,
    pdfUrl,
    isMock: useMock || !isPDFServiceAvailable(),
  }
})
