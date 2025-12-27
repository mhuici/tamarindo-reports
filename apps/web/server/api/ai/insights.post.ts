import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'
import { generateInsights, generateMockInsights } from '../../utils/ai/insights'
import { isOpenAIConfigured } from '../../utils/ai/openai'

const generateInsightsSchema = z.object({
  reportId: z.string().min(1),
  useMock: z.boolean().optional().default(false),
})

/**
 * POST /api/ai/insights
 * Generate AI insights for a report
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)

  const result = generateInsightsSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request data',
      data: result.error.flatten(),
    })
  }

  const { reportId, useMock } = result.data

  // Fetch report with client data
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

  // Prepare params
  const insightParams = {
    clientName: report.client.name,
    reportType: report.type,
    dateRange,
    metrics: {}, // TODO: Fetch real metrics from integrations
  }

  let insights: string

  // Use mock if requested or if OpenAI is not configured
  if (useMock || !isOpenAIConfigured()) {
    insights = generateMockInsights(insightParams)
  }
  else {
    const aiResult = await generateInsights(insightParams)

    if (!aiResult.success) {
      throw createError({
        statusCode: 500,
        message: aiResult.error || 'Failed to generate insights',
      })
    }

    insights = aiResult.insights!
  }

  // Save insights to report
  await prisma.report.update({
    where: { id: reportId },
    data: { aiInsights: insights },
  })

  return {
    success: true,
    insights,
    isMock: useMock || !isOpenAIConfigured(),
  }
})
