import { defineEventHandler, getQuery, createError } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { getMetricsForClient, transformToWidgetData } from '../../utils/metrics/service'

const querySchema = z.object({
  clientId: z.string().min(1),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  forceSync: z.string().optional().transform(v => v === 'true'),
})

export default defineEventHandler(async (event) => {
  // Require authentication
  requireAuth(event)

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

  const { clientId, start, end, forceSync } = result.data

  try {
    const metrics = await getMetricsForClient(
      clientId,
      { start, end },
      forceSync,
    )

    return {
      success: true,
      metrics,
    }
  }
  catch (error) {
    console.error('Error fetching metrics for client:', error)

    // Check if it's a token error
    if (error instanceof Error && error.message.includes('Token')) {
      throw createError({
        statusCode: 401,
        message: error.message,
        data: { code: 'TOKEN_EXPIRED', action: 'reconnect' },
      })
    }

    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch metrics',
    })
  }
})
