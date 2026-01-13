/**
 * Health Check Endpoint
 * Used by Railway and other services to monitor application health
 *
 * Note: Returns 200 even if database is unavailable to allow the service to start.
 * Database status is included in the response for monitoring purposes.
 */
import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const health: {
    status: 'healthy' | 'degraded'
    timestamp: string
    uptime: number
    version: string
    checks: {
      database: { status: string; latency?: number; error?: string }
      memory: { heapUsed: number; heapTotal: number; rss: number }
    }
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '0.1.0',
    checks: {
      database: { status: 'unknown' },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        rss: 0,
      },
    },
  }

  // Check database connection (non-blocking for healthcheck)
  try {
    const { prisma } = await import('@tamarindo/db')
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    health.checks.database = {
      status: 'connected',
      latency: Date.now() - dbStart,
    }
  }
  catch (error) {
    // Mark as degraded but don't fail the healthcheck
    // This allows the service to start even without database
    health.status = 'degraded'
    health.checks.database = {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Memory usage
  const memUsage = process.memoryUsage()
  health.checks.memory = {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
  }

  // Always return 200 to pass healthcheck - database status is in response body
  return health
})
