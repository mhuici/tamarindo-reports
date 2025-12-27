import { defineEventHandler } from 'h3'
import { requireAuth } from '../../utils/auth'
import { isPDFServiceAvailable } from '../../utils/pdf/generator'

/**
 * GET /api/pdf/status
 * Check PDF service status
 */
export default defineEventHandler(async (event) => {
  requireAuth(event)

  return {
    available: isPDFServiceAvailable(),
    method: process.env.PDF_SERVICE_URL ? 'external' : process.env.PUPPETEER_ENABLED === 'true' ? 'puppeteer' : 'none',
    mockAvailable: true,
  }
})
