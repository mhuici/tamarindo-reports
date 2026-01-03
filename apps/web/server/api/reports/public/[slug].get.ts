import { defineEventHandler, createError, getQuery } from 'h3'
import crypto from 'crypto'
import { prisma } from '../../../utils/db'
import { getMetricsForClient } from '../../../utils/metrics/service'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

/**
 * GET /api/reports/public/:slug
 * Get a public report by slug (no auth required)
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Missing report slug',
    })
  }

  const report = await prisma.report.findUnique({
    where: { slug },
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

  // Check if public
  if (!report.isPublic) {
    throw createError({
      statusCode: 403,
      message: 'This report is not public',
    })
  }

  // Check expiration
  if (report.shareExpiresAt && new Date(report.shareExpiresAt) < new Date()) {
    throw createError({
      statusCode: 410,
      message: 'This report link has expired',
    })
  }

  // Check password if required
  if (report.sharePassword) {
    const providedPassword = query.password as string

    if (!providedPassword) {
      return {
        requiresPassword: true,
        report: {
          name: report.name,
          clientName: report.client.name,
          tenantName: report.tenant.name,
          branding: report.tenant.branding,
        },
      }
    }

    if (hashPassword(providedPassword) !== report.sharePassword) {
      throw createError({
        statusCode: 401,
        message: 'Incorrect password',
      })
    }
  }

  // Fetch metrics data for the report
  const dateRange = report.dateRange as { start: string; end: string }
  let metricsData = null

  try {
    metricsData = await getMetricsForClient(
      report.clientId,
      dateRange,
      false,
    )
  }
  catch (e) {
    console.error('[PublicReport] Failed to fetch metrics:', e)
    // Continue without metrics - widgets will show placeholder data
  }

  // Return report data
  return {
    requiresPassword: false,
    report: {
      id: report.id,
      name: report.name,
      type: report.type,
      status: report.status,
      widgets: report.widgets,
      dateRange: report.dateRange,
      aiInsights: report.aiInsights,
      clientName: report.client.name,
      tenantName: report.tenant.name,
      branding: report.tenant.branding,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    },
    metrics: metricsData,
  }
})
