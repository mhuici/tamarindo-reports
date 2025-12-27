import { defineEventHandler, getQuery, createError } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'
import { getMetricsForClient, transformToWidgetData } from '../../utils/metrics/service'

const querySchema = z.object({
  dashboardId: z.string().min(1).optional(),
  reportId: z.string().min(1).optional(),
  widgetId: z.string().min(1),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export default defineEventHandler(async (event) => {
  // Require authentication
  const user = requireAuth(event)

  // Validate query params
  const query = getQuery(event)
  const result = querySchema.safeParse(query)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid query parameters',
      data: result.error.flatten(),
    })
  }

  const { dashboardId, reportId, widgetId, start, end } = result.data

  if (!dashboardId && !reportId) {
    throw createError({
      statusCode: 400,
      message: 'Either dashboardId or reportId is required',
    })
  }

  try {
    let clientId: string
    let widgets: any[]

    if (dashboardId) {
      const dashboard = await prisma.dashboard.findFirst({
        where: {
          id: dashboardId,
          client: { tenantId: user.tenantId },
        },
        include: { client: true },
      })

      if (!dashboard) {
        throw createError({
          statusCode: 404,
          message: 'Dashboard not found',
        })
      }

      clientId = dashboard.clientId
      widgets = (dashboard.widgets as any[]) || []
    }
    else {
      const report = await prisma.report.findFirst({
        where: {
          id: reportId,
          client: { tenantId: user.tenantId },
        },
        include: { client: true },
      })

      if (!report) {
        throw createError({
          statusCode: 404,
          message: 'Report not found',
        })
      }

      clientId = report.clientId
      widgets = (report.widgets as any[]) || []
    }

    // Find the widget
    const widget = widgets.find((w: any) => w.id === widgetId)

    if (!widget) {
      throw createError({
        statusCode: 404,
        message: 'Widget not found',
      })
    }

    // Get metrics for the client
    const metrics = await getMetricsForClient(clientId, { start, end })

    // Transform to widget format
    const widgetData = transformToWidgetData(metrics, {
      type: widget.type,
      metric: widget.config?.metric || widget.metric,
      metrics: widget.config?.metrics || widget.metrics,
      dimension: widget.config?.dimension || widget.dimension,
    })

    return {
      success: true,
      widgetId,
      data: widgetData,
    }
  }
  catch (error) {
    console.error('Error fetching widget data:', error)

    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch widget data',
    })
  }
})
