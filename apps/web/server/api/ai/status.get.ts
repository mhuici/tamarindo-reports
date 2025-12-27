import { defineEventHandler } from 'h3'
import { requireAuth } from '../../utils/auth'
import { isOpenAIConfigured } from '../../utils/ai/openai'

/**
 * GET /api/ai/status
 * Check AI service status
 */
export default defineEventHandler(async (event) => {
  requireAuth(event)

  return {
    configured: isOpenAIConfigured(),
    model: 'gpt-4o-mini',
    features: {
      insights: true,
      recommendations: true,
    },
  }
})
