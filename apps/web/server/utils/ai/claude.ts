import Anthropic from '@anthropic-ai/sdk'
import type { MessageCreateParams } from '@anthropic-ai/sdk/resources/messages'
import { withRetry, AI_RETRY_OPTIONS, getErrorStatusCode, getErrorMessage } from '../retry'

let claudeClient: Anthropic | null = null

/**
 * Get Anthropic Claude client instance (singleton)
 */
export function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }

    claudeClient = new Anthropic({
      apiKey,
    })
  }

  return claudeClient
}

/**
 * Check if Claude is configured
 */
export function isClaudeConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

/**
 * Default model for RCA and narrative generation
 */
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

/**
 * Error types for Claude API calls
 */
export type ClaudeErrorType = 'rate_limit' | 'auth_error' | 'server_error' | 'unknown'

export interface ClaudeCallResult<T> {
  success: boolean
  data?: T
  error?: {
    type: ClaudeErrorType
    message: string
    statusCode?: number
    retryable: boolean
  }
  attempts: number
  isFallback: boolean
}

/**
 * Categorize error type from Claude API response
 */
function categorizeClaudeError(error: unknown): ClaudeErrorType {
  const statusCode = getErrorStatusCode(error)

  if (statusCode === 429) return 'rate_limit'
  if (statusCode === 401 || statusCode === 403) return 'auth_error'
  if (statusCode && statusCode >= 500) return 'server_error'

  const message = getErrorMessage(error).toLowerCase()
  if (message.includes('rate limit') || message.includes('too many')) return 'rate_limit'
  if (message.includes('auth') || message.includes('api key')) return 'auth_error'

  return 'unknown'
}

/**
 * Call Claude API with automatic retry and error handling
 *
 * @example
 * const result = await callClaudeWithRetry({
 *   model: CLAUDE_MODEL,
 *   max_tokens: 1000,
 *   messages: [{ role: 'user', content: 'Hello' }]
 * })
 *
 * if (result.success) {
 *   console.log(result.data)
 * } else {
 *   console.error(result.error)
 * }
 */
export async function callClaudeWithRetry(
  params: MessageCreateParams,
): Promise<ClaudeCallResult<Anthropic.Message>> {
  if (!isClaudeConfigured()) {
    return {
      success: false,
      error: {
        type: 'auth_error',
        message: 'ANTHROPIC_API_KEY is not configured',
        retryable: false,
      },
      attempts: 0,
      isFallback: true,
    }
  }

  const client = getClaudeClient()

  const result = await withRetry(
    () => client.messages.create(params),
    {
      ...AI_RETRY_OPTIONS,
      onRetry: (attempt, error, delayMs) => {
        const errorType = categorizeClaudeError(error)
        const statusCode = getErrorStatusCode(error)
        console.warn(
          `[Claude Retry] Attempt ${attempt} failed ` +
            `(type: ${errorType}, status: ${statusCode || 'unknown'}), ` +
            `retrying in ${delayMs}ms...`,
        )
      },
    },
  )

  if (result.success && result.data) {
    return {
      success: true,
      data: result.data,
      attempts: result.attempts,
      isFallback: false,
    }
  }

  const errorType = categorizeClaudeError(result.error)
  const statusCode = getErrorStatusCode(result.error)

  return {
    success: false,
    error: {
      type: errorType,
      message: result.error?.message || 'Unknown Claude API error',
      statusCode: statusCode || undefined,
      retryable: errorType === 'rate_limit' || errorType === 'server_error',
    },
    attempts: result.attempts,
    isFallback: true,
  }
}
