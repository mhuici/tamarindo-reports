import { defineEventHandler, getHeader, createError } from 'h3'
import { runGlobalHealingSync } from '../../utils/integrations/healing-sync'

/**
 * POST /api/cron/healing-sync
 * Cron job endpoint to run healing sync for all data sources
 * Re-syncs the last 7 days of metrics to catch corrections
 *
 * Should be called daily, ideally early morning (e.g., 6 AM UTC)
 * Configure in your cron service (Railway, Vercel, etc.)
 */
export default defineEventHandler(async (event) => {
  // Verify cron secret to prevent unauthorized access
  const authHeader = getHeader(event, 'authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  console.log('[Healing Sync] Starting global healing sync...')
  const startTime = Date.now()

  const result = await runGlobalHealingSync()

  const duration = Date.now() - startTime
  console.log(`[Healing Sync] Completed in ${duration}ms:`, {
    tenantsProcessed: result.tenantsProcessed,
    totalMetricsUpdated: result.totalMetricsUpdated,
    errors: result.errors.length,
  })

  if (!result.success) {
    console.error('[Healing Sync] Errors:', result.errors)
  }

  return {
    success: result.success,
    tenantsProcessed: result.tenantsProcessed,
    totalMetricsUpdated: result.totalMetricsUpdated,
    errorsCount: result.errors.length,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
  }
})
