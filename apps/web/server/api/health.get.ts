/**
 * Health Check Endpoint
 * Used by Railway and other services to monitor application health
 */
import { defineEventHandler, setResponseStatus } from 'h3'
import { prisma } from '@tamarindo/db'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  const health: {
    status: 'healthy' | 'unhealthy'
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

  // Check database connection
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    health.checks.database = {
      status: 'connected',
      latency: Date.now() - dbStart,
    }
  } catch (error) {
    health.status = 'unhealthy'
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

  // Set appropriate status code
  setResponseStatus(event, health.status === 'healthy' ? 200 : 503)

  return health
})
