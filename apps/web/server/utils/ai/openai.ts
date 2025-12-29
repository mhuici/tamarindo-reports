import OpenAI from 'openai'
import type { ChatCompletionCreateParams } from 'openai/resources/chat/completions'
import { withRetry, AI_RETRY_OPTIONS, getErrorStatusCode, getErrorMessage } from '../retry'

let openaiClient: OpenAI | null = null

/**
 * Get OpenAI client instance (singleton)
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    openaiClient = new OpenAI({
      apiKey,
    })
  }

  return openaiClient
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}

/**
 * Error types for OpenAI API calls
 */
export type OpenAIErrorType = 'rate_limit' | 'auth_error' | 'server_error' | 'quota_exceeded' | 'unknown'

export interface OpenAICallResult<T> {
  success: boolean
  data?: T
  error?: {
    type: OpenAIErrorType
    message: string
    statusCode?: number
    retryable: boolean
  }
  attempts: number
  isFallback: boolean
}

/**
 * Categorize error type from OpenAI API response
 */
function categorizeOpenAIError(error: unknown): OpenAIErrorType {
  const statusCode = getErrorStatusCode(error)

  if (statusCode === 429) {
    const message = getErrorMessage(error).toLowerCase()
    if (message.includes('quota') || message.includes('billing')) return 'quota_exceeded'
    return 'rate_limit'
  }
  if (statusCode === 401 || statusCode === 403) return 'auth_error'
  if (statusCode && statusCode >= 500) return 'server_error'

  return 'unknown'
}

/**
 * Call OpenAI API with automatic retry and error handling
 */
export async function callOpenAIWithRetry(
  params: ChatCompletionCreateParams,
): Promise<OpenAICallResult<OpenAI.Chat.Completions.ChatCompletion>> {
  if (!isOpenAIConfigured()) {
    return {
      success: false,
      error: {
        type: 'auth_error',
        message: 'OPENAI_API_KEY is not configured',
        retryable: false,
      },
      attempts: 0,
      isFallback: true,
    }
  }

  const client = getOpenAIClient()

  const result = await withRetry(
    () => client.chat.completions.create(params),
    {
      ...AI_RETRY_OPTIONS,
      isRetryable: (error) => {
        const errorType = categorizeOpenAIError(error)
        // Don't retry auth or quota errors
        return errorType === 'rate_limit' || errorType === 'server_error'
      },
      onRetry: (attempt, error, delayMs) => {
        const errorType = categorizeOpenAIError(error)
        const statusCode = getErrorStatusCode(error)
        console.warn(
          `[OpenAI Retry] Attempt ${attempt} failed ` +
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

  const errorType = categorizeOpenAIError(result.error)
  const statusCode = getErrorStatusCode(result.error)

  return {
    success: false,
    error: {
      type: errorType,
      message: result.error?.message || 'Unknown OpenAI API error',
      statusCode: statusCode || undefined,
      retryable: errorType === 'rate_limit' || errorType === 'server_error',
    },
    attempts: result.attempts,
    isFallback: true,
  }
}
