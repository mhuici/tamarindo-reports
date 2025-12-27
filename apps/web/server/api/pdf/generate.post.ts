import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'
import { generateReportPDF, isPDFServiceAvailable } from '../../utils/pdf/generator'
import { getMetricsForClient } from '../../utils/metrics/service'

const generatePDFSchema = z.object({
  reportId: z.string().min(1),
})

/**
 * POST /api/pdf/generate
 * Generate PDF for a report with real metrics
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

  const { reportId } = result.data

  // Fetch report with client and tenant info
  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      tenantId: user.tenantId,
    },
    include: {
      client: {
        select: {
          id: true,
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

  if (!report) {
    throw createError({
      statusCode: 404,
      message: 'Report not found',
    })
  }

  const dateRange = report.dateRange as { start: string, end: string }

  try {
    // Get metrics for the client
    const metrics = await getMetricsForClient(report.client.id, dateRange)

    // Extract branding
    const branding = report.tenant.branding as {
      primaryColor?: string
      secondaryColor?: string
      logoUrl?: string
      companyName?: string
    } | null

    // Generate PDF with metrics
    const pdfResult = await generateReportPDF({
      reportId: report.id,
      reportName: report.name,
      clientName: report.client.name,
      tenantName: report.tenant.name,
      tenantId: user.tenantId,
      dateRange,
      widgets: report.widgets as any[],
      metrics: {
        totals: metrics.totals,
        previousTotals: metrics.previousTotals,
        byDate: metrics.byDate,
      },
      aiInsights: report.aiInsights || undefined,
      branding: branding || undefined,
    })

    if (!pdfResult.success) {
      throw createError({
        statusCode: 500,
        message: pdfResult.error || 'Failed to generate PDF',
      })
    }

    // Update report with PDF URL and mark as completed
    await prisma.report.update({
      where: { id: reportId },
      data: {
        pdfUrl: pdfResult.pdfUrl,
        status: 'COMPLETED',
      },
    })

    return {
      success: true,
      pdfUrl: pdfResult.pdfUrl,
      message: 'PDF generated successfully',
    }
  }
  catch (error: any) {
    console.error('PDF generation error:', error)

    // Update report with error
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'FAILED',
        error: error.message || 'PDF generation failed',
      },
    })

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate PDF',
    })
  }
})
