/**
 * Retry utility with exponential backoff for production error handling
 * Session 17: Error Handling Produccion
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number
  /** Jitter factor 0-1 to add randomness (default: 0.1) */
  jitterFactor?: number
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean
  /** Callback on each retry attempt */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalTimeMs: number
}

// Default retryable errors: rate limits, server errors, network errors
const DEFAULT_RETRYABLE_CODES = new Set([429, 500, 502, 503, 504])
const NON_RETRYABLE_CODES = new Set([400, 401, 403, 404])

/**
 * Determines if an error should trigger a retry
 */
export function isRetryableError(error: unknown): boolean {
  if (!error) return false

  // Check for status code in error object
  const statusCode = getErrorStatusCode(error)
  if (statusCode) {
    if (NON_RETRYABLE_CODES.has(statusCode)) return false
    if (DEFAULT_RETRYABLE_CODES.has(statusCode)) return true
  }

  // Check for common retryable error messages
  const message = getErrorMessage(error).toLowerCase()
  const retryablePatterns = [
    'rate limit',
    'too many requests',
    'timeout',
    'econnreset',
    'econnrefused',
    'socket hang up',
    'network error',
    'temporarily unavailable',
    'service unavailable',
    'internal server error',
    'overloaded',
  ]

  return retryablePatterns.some((pattern) => message.includes(pattern))
}

/**
 * Extracts status code from various error formats
 */
export function getErrorStatusCode(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null

  const err = error as Record<string, unknown>

  // Direct status code
  if (typeof err.status === 'number') return err.status
  if (typeof err.statusCode === 'number') return err.statusCode

  // Nested in response
  if (err.response && typeof err.response === 'object') {
    const response = err.response as Record<string, unknown>
    if (typeof response.status === 'number') return response.status
  }

  // Anthropic SDK error format
  if (err.error && typeof err.error === 'object') {
    const innerError = err.error as Record<string, unknown>
    if (typeof innerError.status === 'number') return innerError.status
  }

  return null
}

/**
 * Extracts error message from various error formats
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message

  const err = error as Record<string, unknown>
  if (typeof err.message === 'string') return err.message
  if (typeof err.error === 'string') return err.error

  return JSON.stringify(error)
}

/**
 * Calculates delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number,
  jitterFactor: number,
): number {
  // Exponential backoff: initialDelay * multiplier^attempt
  const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt)

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs)

  // Add jitter: random factor between (1-jitter) and (1+jitter)
  const jitter = 1 + (Math.random() * 2 - 1) * jitterFactor

  return Math.floor(cappedDelay * jitter)
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Executes a function with retry logic and exponential backoff
 *
 * @example
 * const result = await withRetry(
 *   () => callExternalAPI(),
 *   {
 *     maxRetries: 3,
 *     onRetry: (attempt, error) => console.log(`Retry ${attempt}:`, error)
 *   }
 * )
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    jitterFactor = 0.1,
    isRetryable = isRetryableError,
    onRetry,
  } = options

  const startTime = Date.now()
  let lastError: Error | undefined
  let attempts = 0

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts = attempt + 1

    try {
      const data = await fn()
      return {
        success: true,
        data,
        attempts,
        totalTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(getErrorMessage(error))

      // Check if we should retry
      const shouldRetry = attempt < maxRetries && isRetryable(error)

      if (!shouldRetry) {
        break
      }

      // Calculate delay for next attempt
      const delayMs = calculateDelay(
        attempt,
        initialDelayMs,
        maxDelayMs,
        backoffMultiplier,
        jitterFactor,
      )

      // Notify about retry
      if (onRetry) {
        onRetry(attempt + 1, error, delayMs)
      }

      await sleep(delayMs)
    }
  }

  return {
    success: false,
    error: lastError,
    attempts,
    totalTimeMs: Date.now() - startTime,
  }
}

/**
 * Creates a retryable version of an async function
 *
 * @example
 * const retryableFetch = createRetryable(fetchData, { maxRetries: 3 })
 * const result = await retryableFetch(params)
 */
export function createRetryable<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {},
): (...args: TArgs) => Promise<RetryResult<TResult>> {
  return async (...args: TArgs) => {
    return withRetry(() => fn(...args), options)
  }
}

/**
 * Rate limit aware retry configuration for AI APIs
 */
export const AI_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 2000, // Start with 2s for rate limits
  maxDelayMs: 60000, // Max 1 minute
  backoffMultiplier: 2,
  jitterFactor: 0.2,
  onRetry: (attempt, error, delayMs) => {
    const statusCode = getErrorStatusCode(error)
    console.warn(
      `[AI Retry] Attempt ${attempt} failed (status: ${statusCode || 'unknown'}), ` +
        `retrying in ${delayMs}ms...`,
    )
  },
}

/**
 * Integration API retry configuration (Google, Facebook)
 */
export const INTEGRATION_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 2,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  isRetryable: (error) => {
    const statusCode = getErrorStatusCode(error)
    // Don't retry auth errors for integrations
    if (statusCode === 401 || statusCode === 403) return false
    return isRetryableError(error)
  },
  onRetry: (attempt, error, delayMs) => {
    console.warn(
      `[Integration Retry] Attempt ${attempt} failed, retrying in ${delayMs}ms...`,
    )
  },
}
