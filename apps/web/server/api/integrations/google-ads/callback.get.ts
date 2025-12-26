import { defineEventHandler, getQuery, sendRedirect, createError } from 'h3'
import { prisma, encrypt } from '../../../utils/db'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

/**
 * GET /api/integrations/google-ads/callback
 * Handles OAuth callback from Google
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { code, state, error } = query

  if (error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/demo/integrations?error=oauth_denied')
  }

  if (!code || !state) {
    throw createError({
      statusCode: 400,
      message: 'Missing code or state parameter',
    })
  }

  // Decode state
  let stateData: { tenantId: string; userId: string }
  try {
    stateData = JSON.parse(Buffer.from(state as string, 'base64').toString())
  }
  catch {
    throw createError({
      statusCode: 400,
      message: 'Invalid state parameter',
    })
  }

  const config = useRuntimeConfig()
  const redirectUri = `${config.public.appUrl}/api/integrations/google-ads/callback`

  // Exchange code for tokens
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      code: code as string,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text()
    console.error('Token exchange failed:', errorData)
    throw createError({
      statusCode: 500,
      message: 'Failed to exchange authorization code',
    })
  }

  const tokenData = await tokenResponse.json()

  // Get user info from Google
  const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  })

  let googleUserInfo: { email?: string; name?: string } = {}
  if (userInfoResponse.ok) {
    googleUserInfo = await userInfoResponse.json()
  }

  // Get tenant slug for redirect
  const tenant = await prisma.tenant.findUnique({
    where: { id: stateData.tenantId },
    select: { slug: true },
  })

  if (!tenant) {
    throw createError({
      statusCode: 404,
      message: 'Tenant not found',
    })
  }

  // Check if data source already exists
  const existingDataSource = await prisma.dataSource.findFirst({
    where: {
      tenantId: stateData.tenantId,
      type: 'GOOGLE_ADS',
    },
  })

  // Encrypt tokens before storing
  const encryptedCredentials = encrypt(JSON.stringify({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + (tokenData.expires_in * 1000),
    scope: tokenData.scope,
  }))

  if (existingDataSource) {
    // Update existing data source
    await prisma.dataSource.update({
      where: { id: existingDataSource.id },
      data: {
        credentials: encryptedCredentials,
        lastSync: null,
        status: 'ACTIVE',
      },
    })
  }
  else {
    // Create new data source
    await prisma.dataSource.create({
      data: {
        name: googleUserInfo.email || 'Google Ads',
        type: 'GOOGLE_ADS',
        tenantId: stateData.tenantId,
        credentials: encryptedCredentials,
        status: 'ACTIVE',
      },
    })
  }

  // Redirect back to integrations page with success
  return sendRedirect(event, `/${tenant.slug}/integrations?connected=google-ads`)
})
