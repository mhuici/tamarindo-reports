import { prisma, decrypt, encrypt } from '../db'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'

interface TokenData {
  accessToken: string
  refreshToken: string
  expiresAt: number
  scope?: string
}

interface TokenResult {
  success: boolean
  accessToken?: string
  error?: string
  needsReauth?: boolean
}

/**
 * Get a valid access token for a DataSource
 * Automatically refreshes if expired
 */
export async function getValidAccessToken(dataSourceId: string): Promise<TokenResult> {
  const dataSource = await prisma.dataSource.findUnique({
    where: { id: dataSourceId },
    select: {
      id: true,
      type: true,
      credentials: true,
      status: true,
    },
  })

  if (!dataSource) {
    return { success: false, error: 'DataSource not found' }
  }

  if (dataSource.status === 'NEEDS_REAUTH') {
    return { success: false, error: 'Reconnection required', needsReauth: true }
  }

  // Decrypt credentials
  let tokenData: TokenData
  try {
    const decrypted = decrypt(dataSource.credentials as string)
    tokenData = JSON.parse(decrypted)
  }
  catch (e) {
    await markNeedsReauth(dataSourceId, 'Failed to decrypt credentials')
    return { success: false, error: 'Invalid credentials', needsReauth: true }
  }

  // Check if token is still valid (with 5 min buffer)
  const now = Date.now()
  const bufferMs = 5 * 60 * 1000 // 5 minutes
  const isExpired = tokenData.expiresAt < (now + bufferMs)

  if (!isExpired) {
    return { success: true, accessToken: tokenData.accessToken }
  }

  // Token expired, try to refresh
  console.log(`[Tokens] Refreshing token for DataSource ${dataSourceId}`)

  if (!tokenData.refreshToken) {
    await markNeedsReauth(dataSourceId, 'No refresh token available')
    return { success: false, error: 'No refresh token', needsReauth: true }
  }

  // Refresh based on platform type
  let refreshResult: TokenResult

  switch (dataSource.type) {
    case 'GOOGLE_ADS':
    case 'GOOGLE_ANALYTICS':
      refreshResult = await refreshGoogleToken(dataSourceId, tokenData.refreshToken)
      break
    case 'FACEBOOK_ADS':
      refreshResult = await refreshFacebookToken(dataSourceId, tokenData.accessToken)
      break
    default:
      return { success: false, error: `Unsupported platform: ${dataSource.type}` }
  }

  return refreshResult
}

/**
 * Refresh Google OAuth token
 */
async function refreshGoogleToken(dataSourceId: string, refreshToken: string): Promise<TokenResult> {
  const config = useRuntimeConfig()

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`[Tokens] Google refresh failed:`, error)

      // Check if it's an auth error (revoked, password changed, etc.)
      if (response.status === 400 || response.status === 401) {
        await markNeedsReauth(dataSourceId, 'Google authorization expired or revoked')
        return { success: false, error: 'Authorization expired', needsReauth: true }
      }

      return { success: false, error: 'Token refresh failed' }
    }

    const data = await response.json()

    // Update stored credentials
    const newTokenData: TokenData = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Google may not return new refresh token
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope,
    }

    await prisma.dataSource.update({
      where: { id: dataSourceId },
      data: {
        credentials: encrypt(JSON.stringify(newTokenData)),
        status: 'ACTIVE',
        authError: null,
      },
    })

    console.log(`[Tokens] Successfully refreshed Google token for DataSource ${dataSourceId}`)
    return { success: true, accessToken: data.access_token }
  }
  catch (e: any) {
    console.error(`[Tokens] Google refresh error:`, e)
    return { success: false, error: e.message }
  }
}

/**
 * Refresh Facebook token (exchange for long-lived token)
 * Note: Facebook long-lived tokens last ~60 days and can be refreshed
 */
async function refreshFacebookToken(dataSourceId: string, currentToken: string): Promise<TokenResult> {
  const config = useRuntimeConfig()

  try {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: config.facebookAppId,
      client_secret: config.facebookAppSecret,
      fb_exchange_token: currentToken,
    })

    const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params}`)

    if (!response.ok) {
      const error = await response.json()
      console.error(`[Tokens] Facebook refresh failed:`, error)

      // Check for auth errors
      if (error.error?.code === 190 || error.error?.type === 'OAuthException') {
        await markNeedsReauth(dataSourceId, 'Facebook authorization expired')
        return { success: false, error: 'Authorization expired', needsReauth: true }
      }

      return { success: false, error: 'Token refresh failed' }
    }

    const data = await response.json()

    // Update stored credentials
    const newTokenData: TokenData = {
      accessToken: data.access_token,
      refreshToken: data.access_token, // Facebook uses same token
      expiresAt: Date.now() + (data.expires_in * 1000),
    }

    await prisma.dataSource.update({
      where: { id: dataSourceId },
      data: {
        credentials: encrypt(JSON.stringify(newTokenData)),
        status: 'ACTIVE',
        authError: null,
      },
    })

    console.log(`[Tokens] Successfully refreshed Facebook token for DataSource ${dataSourceId}`)
    return { success: true, accessToken: data.access_token }
  }
  catch (e: any) {
    console.error(`[Tokens] Facebook refresh error:`, e)
    return { success: false, error: e.message }
  }
}

/**
 * Mark a DataSource as needing re-authentication
 */
async function markNeedsReauth(dataSourceId: string, reason: string): Promise<void> {
  console.warn(`[Tokens] DataSource ${dataSourceId} needs reauth: ${reason}`)

  await prisma.dataSource.update({
    where: { id: dataSourceId },
    data: {
      status: 'NEEDS_REAUTH',
      authError: reason,
    },
  })
}

/**
 * Check if any DataSources need re-authentication
 * Returns list for notification purposes
 */
export async function getDataSourcesNeedingReauth(tenantId: string) {
  return prisma.dataSource.findMany({
    where: {
      tenantId,
      status: 'NEEDS_REAUTH',
    },
    select: {
      id: true,
      type: true,
      name: true,
      authError: true,
    },
  })
}
