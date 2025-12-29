/**
 * Integration Error Handling
 * Session 17: Production Error Handling
 */

import { withRetry, INTEGRATION_RETRY_OPTIONS, getErrorStatusCode, getErrorMessage } from './retry'

/**
 * Types of integration errors
 */
export type IntegrationErrorCode =
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_REFRESH_FAILED'
  | 'RATE_LIMITED'
  | 'PERMISSION_DENIED'
  | 'ACCOUNT_NOT_FOUND'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

/**
 * Action the user should take to resolve the error
 */
export type IntegrationErrorAction =
  | 'reconnect'      // User needs to re-authenticate
  | 'wait_and_retry' // Temporary issue, retry later
  | 'check_permissions' // User needs to verify permissions
  | 'contact_support'   // Unknown error, needs investigation
  | 'none'             // Handled automatically

export interface IntegrationError {
  code: IntegrationErrorCode
  message: string
  action: IntegrationErrorAction
  platform: 'google_ads' | 'facebook_ads' | 'unknown'
  retryable: boolean
  retryAfterMs?: number
}

/**
 * Categorize error from Google Ads API
 */
export function categorizeGoogleAdsError(error: unknown): IntegrationError {
  const statusCode = getErrorStatusCode(error)
  const message = getErrorMessage(error).toLowerCase()

  // Token/Auth errors
  if (statusCode === 401 || message.includes('invalid_grant') || message.includes('token has been expired')) {
    return {
      code: 'TOKEN_EXPIRED',
      message: 'Tu conexión con Google Ads ha expirado. Por favor, reconecta la integración.',
      action: 'reconnect',
      platform: 'google_ads',
      retryable: false,
    }
  }

  if (statusCode === 403 || message.includes('permission') || message.includes('access denied')) {
    return {
      code: 'PERMISSION_DENIED',
      message: 'No tienes permisos suficientes para acceder a esta cuenta de Google Ads.',
      action: 'check_permissions',
      platform: 'google_ads',
      retryable: false,
    }
  }

  // Rate limiting
  if (statusCode === 429 || message.includes('rate limit') || message.includes('quota')) {
    return {
      code: 'RATE_LIMITED',
      message: 'Se ha alcanzado el límite de solicitudes de Google Ads. Intenta de nuevo en unos minutos.',
      action: 'wait_and_retry',
      platform: 'google_ads',
      retryable: true,
      retryAfterMs: 60000, // 1 minute
    }
  }

  // Server errors
  if (statusCode && statusCode >= 500) {
    return {
      code: 'API_ERROR',
      message: 'Google Ads está experimentando problemas. Intenta de nuevo más tarde.',
      action: 'wait_and_retry',
      platform: 'google_ads',
      retryable: true,
      retryAfterMs: 30000,
    }
  }

  // Network errors
  if (message.includes('network') || message.includes('econnrefused') || message.includes('timeout')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con Google Ads. Verifica tu conexión a internet.',
      action: 'wait_and_retry',
      platform: 'google_ads',
      retryable: true,
    }
  }

  // Unknown
  return {
    code: 'UNKNOWN',
    message: `Error al conectar con Google Ads: ${getErrorMessage(error)}`,
    action: 'contact_support',
    platform: 'google_ads',
    retryable: false,
  }
}

/**
 * Categorize error from Facebook Ads API
 */
export function categorizeFacebookAdsError(error: unknown): IntegrationError {
  const statusCode = getErrorStatusCode(error)
  const message = getErrorMessage(error).toLowerCase()

  // Facebook specific error codes (from error response body)
  const fbErrorCode = extractFacebookErrorCode(error)

  // Token expired (Facebook code 190)
  if (fbErrorCode === 190 || message.includes('access token') || message.includes('session has expired')) {
    return {
      code: 'TOKEN_EXPIRED',
      message: 'Tu conexión con Facebook Ads ha expirado. Por favor, reconecta la integración.',
      action: 'reconnect',
      platform: 'facebook_ads',
      retryable: false,
    }
  }

  // Permission errors (Facebook code 10, 200, 294)
  if ([10, 200, 294].includes(fbErrorCode ?? 0) || statusCode === 403) {
    return {
      code: 'PERMISSION_DENIED',
      message: 'No tienes permisos suficientes para acceder a esta cuenta de Facebook Ads.',
      action: 'check_permissions',
      platform: 'facebook_ads',
      retryable: false,
    }
  }

  // Rate limiting (Facebook code 4, 17, 32, 613)
  if ([4, 17, 32, 613].includes(fbErrorCode ?? 0) || statusCode === 429) {
    return {
      code: 'RATE_LIMITED',
      message: 'Se ha alcanzado el límite de solicitudes de Facebook Ads. Intenta de nuevo en unos minutos.',
      action: 'wait_and_retry',
      platform: 'facebook_ads',
      retryable: true,
      retryAfterMs: 60000,
    }
  }

  // Server errors
  if (statusCode && statusCode >= 500) {
    return {
      code: 'API_ERROR',
      message: 'Facebook Ads está experimentando problemas. Intenta de nuevo más tarde.',
      action: 'wait_and_retry',
      platform: 'facebook_ads',
      retryable: true,
      retryAfterMs: 30000,
    }
  }

  // Unknown
  return {
    code: 'UNKNOWN',
    message: `Error al conectar con Facebook Ads: ${getErrorMessage(error)}`,
    action: 'contact_support',
    platform: 'facebook_ads',
    retryable: false,
  }
}

/**
 * Extract Facebook-specific error code from response
 */
function extractFacebookErrorCode(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null

  const err = error as Record<string, unknown>

  // Facebook error format: { error: { code: 190, ... } }
  if (err.error && typeof err.error === 'object') {
    const fbError = err.error as Record<string, unknown>
    if (typeof fbError.code === 'number') return fbError.code
  }

  // Alternative format in response body
  if (err.response && typeof err.response === 'object') {
    const response = err.response as Record<string, unknown>
    if (response.data && typeof response.data === 'object') {
      const data = response.data as Record<string, unknown>
      if (data.error && typeof data.error === 'object') {
        const fbError = data.error as Record<string, unknown>
        if (typeof fbError.code === 'number') return fbError.code
      }
    }
  }

  return null
}

/**
 * Generic categorizer based on platform
 */
export function categorizeIntegrationError(
  error: unknown,
  platform: 'google_ads' | 'facebook_ads',
): IntegrationError {
  if (platform === 'google_ads') {
    return categorizeGoogleAdsError(error)
  }
  return categorizeFacebookAdsError(error)
}

/**
 * Call integration API with retry and proper error handling
 */
export async function callIntegrationWithRetry<T>(
  fn: () => Promise<T>,
  platform: 'google_ads' | 'facebook_ads',
): Promise<{ success: true, data: T } | { success: false, error: IntegrationError }> {
  const result = await withRetry(fn, {
    ...INTEGRATION_RETRY_OPTIONS,
    isRetryable: (error) => {
      const integrationError = categorizeIntegrationError(error, platform)
      return integrationError.retryable
    },
    onRetry: (attempt, error, delayMs) => {
      const integrationError = categorizeIntegrationError(error, platform)
      console.warn(
        `[Integration ${platform}] Retry ${attempt} (${integrationError.code}), waiting ${delayMs}ms`,
      )
    },
  })

  if (result.success && result.data) {
    return { success: true, data: result.data }
  }

  const integrationError = categorizeIntegrationError(result.error, platform)
  return { success: false, error: integrationError }
}

/**
 * Check if an integration needs reconnection based on error
 */
export function needsReconnection(error: IntegrationError): boolean {
  return error.action === 'reconnect' ||
    error.code === 'TOKEN_EXPIRED' ||
    error.code === 'TOKEN_INVALID' ||
    error.code === 'TOKEN_REFRESH_FAILED'
}

/**
 * Format error message for user display
 */
export function formatIntegrationErrorForUser(error: IntegrationError): {
  title: string
  message: string
  actionLabel?: string
  actionType?: 'reconnect' | 'retry' | 'none'
} {
  switch (error.action) {
    case 'reconnect':
      return {
        title: 'Conexión Expirada',
        message: error.message,
        actionLabel: 'Reconectar',
        actionType: 'reconnect',
      }
    case 'wait_and_retry':
      return {
        title: 'Error Temporal',
        message: error.message,
        actionLabel: 'Reintentar',
        actionType: 'retry',
      }
    case 'check_permissions':
      return {
        title: 'Permisos Insuficientes',
        message: error.message,
        actionLabel: 'Reconectar',
        actionType: 'reconnect',
      }
    default:
      return {
        title: 'Error de Integración',
        message: error.message,
        actionType: 'none',
      }
  }
}
