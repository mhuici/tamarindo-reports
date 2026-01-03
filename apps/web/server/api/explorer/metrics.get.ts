import { defineEventHandler, getQuery, createError } from 'h3'
import { requireAuth } from '../../utils/auth'
import { getMetricsForTenant } from '../../utils/metrics/service'

/**
 * GET /api/explorer/metrics
 * Fetches aggregated metrics for the tenant's data sources
 *
 * Query params:
 * - start: Start date (YYYY-MM-DD)
 * - end: End date (YYYY-MM-DD)
 * - platforms: Comma-separated list of platforms (google_ads,facebook_ads,google_analytics)
 * - clientId: Optional client ID to filter by
 * - compare: Whether to include comparison period (true/false)
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const query = getQuery(event)

  // Parse query params
  const start = query.start as string
  const end = query.end as string
  const platforms = query.platforms
    ? (query.platforms as string).split(',')
    : undefined
  const clientId = query.clientId as string | undefined
  const compare = query.compare === 'true'

  // Validate dates
  if (!start || !end) {
    throw createError({
      statusCode: 400,
      message: 'Missing required date range parameters (start, end)',
    })
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(start) || !dateRegex.test(end)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid date format. Use YYYY-MM-DD',
    })
  }

  try {
    const metrics = await getMetricsForTenant(
      user.tenantId,
      { start, end },
      {
        platforms,
        clientId,
        includeComparison: compare,
      },
    )

    return metrics
  }
  catch (error) {
    console.error('[Explorer] Failed to fetch metrics:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch metrics',
    })
  }
})
