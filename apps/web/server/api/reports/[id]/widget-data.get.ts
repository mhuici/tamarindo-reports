import { defineEventHandler, getQuery, createError } from 'h3'
import { prisma } from '@tamarindo/db'
import { requireAuth } from '../../../utils/auth'
import { getMetricsForClient, transformToWidgetData } from '../../../utils/metrics/service'

/**
 * GET /api/reports/[id]/widget-data
 * Fetches real metrics data for widget preview in the editor
 *
 * Query params:
 * - widgetType: Type of widget (metric, line-chart, bar-chart, etc.)
 * - metric: Primary metric to display
 * - metrics: Comma-separated list of metrics (for tables)
 */
export default defineEventHandler(async (event) => {
  requireAuth(event)

  const reportId = event.context.params?.id
  if (!reportId) {
    throw createError({
      statusCode: 400,
      message: 'Report ID is required',
    })
  }

  const query = getQuery(event)
  const widgetType = query.widgetType as string || 'metric'
  const metric = query.metric as string || 'impressions'
  const metrics = query.metrics ? (query.metrics as string).split(',') : undefined

  // Get report with client info
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      client: true,
    },
  })

  if (!report) {
    throw createError({
      statusCode: 404,
      message: 'Report not found',
    })
  }

  try {
    // Get metrics for the client using report's date range
    const dateRange = report.dateRange as { start: string; end: string }

    const aggregatedMetrics = await getMetricsForClient(
      report.clientId,
      dateRange,
      false, // Don't force sync for preview
    )

    // Transform to widget-specific format
    const widgetData = transformToWidgetData(aggregatedMetrics, {
      type: widgetType,
      metric,
      metrics,
    })

    return {
      success: true,
      data: widgetData,
      dateRange,
      clientName: report.client.name,
    }
  }
  catch (error) {
    console.error('[WidgetData] Failed to fetch metrics:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch widget data',
    })
  }
})
