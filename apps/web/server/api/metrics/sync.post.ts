import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'
import { syncMetrics } from '../../utils/metrics/service'
import {
  categorizeIntegrationError,
  formatIntegrationErrorForUser,
  needsReconnection,
  type IntegrationError,
} from '../../utils/integration-errors'

const bodySchema = z.object({
  dataSourceId: z.string().min(1),
  platformAccountId: z.string().min(1).optional(),
  dateRange: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
})

export default defineEventHandler(async (event) => {
  // Require authentication
  const user = requireAuth(event)

  // Validate body
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten(),
    })
  }

  const { dataSourceId, platformAccountId, dateRange } = result.data

  try {
    // Verify data source belongs to user's tenant
    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id: dataSourceId,
        tenantId: user.tenantId,
      },
      include: {
        platformAccounts: true,
      },
    })

    if (!dataSource) {
      throw createError({
        statusCode: 404,
        message: 'Data source not found',
      })
    }

    // If no specific account, sync all accounts
    const accountsToSync = platformAccountId
      ? dataSource.platformAccounts.filter(a => a.id === platformAccountId)
      : dataSource.platformAccounts

    if (accountsToSync.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'No platform accounts found to sync',
      })
    }

    const results = []
    let hasAuthError = false
    let authError: IntegrationError | null = null

    // Determine platform type
    const platform = dataSource.type === 'GOOGLE_ADS' ? 'google_ads' : 'facebook_ads'

    for (const account of accountsToSync) {
      try {
        const metrics = await syncMetrics(dataSourceId, account.id, dateRange)
        results.push({
          accountId: account.id,
          accountName: account.name,
          success: true,
          dataPoints: metrics.data.length,
        })
      }
      catch (error) {
        // Categorize the error properly
        const integrationError = categorizeIntegrationError(error, platform)

        // Track if we have an auth error that requires reconnection
        if (needsReconnection(integrationError)) {
          hasAuthError = true
          authError = integrationError
        }

        results.push({
          accountId: account.id,
          accountName: account.name,
          success: false,
          error: integrationError.message,
          errorCode: integrationError.code,
          action: integrationError.action,
        })
      }
    }

    // If all accounts failed with auth error, throw to trigger reconnection flow
    const allFailed = results.every(r => !r.success)
    if (allFailed && hasAuthError && authError) {
      const formatted = formatIntegrationErrorForUser(authError)
      throw createError({
        statusCode: 401,
        message: formatted.message,
        data: {
          code: authError.code,
          action: authError.action,
          platform: authError.platform,
          actionLabel: formatted.actionLabel,
        },
      })
    }

    return {
      success: true,
      message: `Synced ${results.filter(r => r.success).length}/${results.length} accounts`,
      results,
      hasErrors: results.some(r => !r.success),
    }
  }
  catch (error) {
    // If it's already an H3 error, rethrow it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error syncing metrics:', error)

    // Categorize unknown errors
    const platform = 'google_ads' // Default, actual platform already handled above
    const integrationError = categorizeIntegrationError(error, platform)
    const formatted = formatIntegrationErrorForUser(integrationError)

    throw createError({
      statusCode: integrationError.code === 'TOKEN_EXPIRED' ? 401 : 500,
      message: formatted.message,
      data: {
        code: integrationError.code,
        action: integrationError.action,
        actionLabel: formatted.actionLabel,
      },
    })
  }
})
