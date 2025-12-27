import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'
import { syncMetrics } from '../../utils/metrics/service'

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
        results.push({
          accountId: account.id,
          accountName: account.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return {
      success: true,
      message: `Synced ${results.filter(r => r.success).length}/${results.length} accounts`,
      results,
    }
  }
  catch (error) {
    console.error('Error syncing metrics:', error)

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
      message: error instanceof Error ? error.message : 'Failed to sync metrics',
    })
  }
})
