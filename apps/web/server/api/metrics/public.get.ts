import { defineEventHandler, getQuery, createError } from 'h3'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../../utils/db'
import { getMetricsForClient, transformToWidgetData } from '../../utils/metrics/service'

const querySchema = z.object({
  slug: z.string().min(1),
  password: z.string().optional(),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

/**
 * GET /api/metrics/public
 * Get metrics for a public dashboard (no auth required)
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const result = querySchema.safeParse(query)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid query parameters',
    })
  }

  const { slug, password: providedPassword, start, end } = result.data

  // Get dashboard
  const dashboard = await prisma.dashboard.findUnique({
    where: { slug },
    select: {
      id: true,
      isPublic: true,
      expiresAt: true,
      password: true,
      clientId: true,
      widgets: true,
    },
  })

  if (!dashboard) {
    throw createError({
      statusCode: 404,
      message: 'Dashboard not found',
    })
  }

  if (!dashboard.isPublic) {
    throw createError({
      statusCode: 403,
      message: 'This dashboard is not public',
    })
  }

  if (dashboard.expiresAt && new Date(dashboard.expiresAt) < new Date()) {
    throw createError({
      statusCode: 410,
      message: 'This dashboard link has expired',
    })
  }

  // Check password if required
  if (dashboard.password) {
    if (!providedPassword || hashPassword(providedPassword) !== dashboard.password) {
      throw createError({
        statusCode: 401,
        message: 'Password required or incorrect',
      })
    }
  }

  // Default date range: last 30 days
  const endDate = end || new Date().toISOString().split('T')[0]
  const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  try {
    // Get metrics for the client
    const metrics = await getMetricsForClient(
      dashboard.clientId,
      { start: startDate, end: endDate },
    )

    // Transform metrics for each widget
    const widgets = (dashboard.widgets as any[]) || []
    const widgetData: Record<string, any> = {}

    for (const widget of widgets) {
      widgetData[widget.id] = transformToWidgetData(metrics, {
        type: widget.type,
        metric: widget.config?.metric || widget.metric,
        metrics: widget.config?.metrics || widget.metrics,
        dimension: widget.config?.dimension || widget.dimension,
      })
    }

    return {
      success: true,
      dateRange: { start: startDate, end: endDate },
      totals: metrics.totals,
      previousTotals: metrics.previousTotals,
      widgetData,
      hasData: metrics.byDate.length > 0,
    }
  }
  catch (error) {
    console.error('Error fetching public metrics:', error)

    // Return empty data instead of error for public dashboards
    return {
      success: true,
      dateRange: { start: startDate, end: endDate },
      totals: {},
      previousTotals: {},
      widgetData: {},
      hasData: false,
    }
  }
})
