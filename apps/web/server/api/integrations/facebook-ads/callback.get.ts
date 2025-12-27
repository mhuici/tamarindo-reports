import { defineEventHandler, getQuery, sendRedirect, createError } from 'h3'
import { prisma, encrypt } from '../../../utils/db'

const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'
const FACEBOOK_ME_URL = 'https://graph.facebook.com/v18.0/me'

/**
 * GET /api/integrations/facebook-ads/callback
 * Handles OAuth callback from Facebook
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { code, state, error, error_description } = query

  if (error) {
    console.error('Facebook OAuth error:', error, error_description)
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
  const redirectUri = `${config.public.appUrl}/api/integrations/facebook-ads/callback`

  // Exchange code for access token
  const tokenParams = new URLSearchParams({
    client_id: config.facebookAppId,
    client_secret: config.facebookAppSecret,
    redirect_uri: redirectUri,
    code: code as string,
  })

  const tokenResponse = await fetch(`${FACEBOOK_TOKEN_URL}?${tokenParams.toString()}`)

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text()
    console.error('Token exchange failed:', errorData)
    throw createError({
      statusCode: 500,
      message: 'Failed to exchange authorization code',
    })
  }

  const tokenData = await tokenResponse.json()

  // Get user info from Facebook
  const meResponse = await fetch(`${FACEBOOK_ME_URL}?fields=id,name,email&access_token=${tokenData.access_token}`)

  let fbUserInfo: { id?: string; name?: string; email?: string } = {}
  if (meResponse.ok) {
    fbUserInfo = await meResponse.json()
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
      type: 'FACEBOOK_ADS',
    },
  })

  // Facebook tokens don't have refresh tokens by default
  // We get a long-lived token that expires in ~60 days
  const encryptedCredentials = encrypt(JSON.stringify({
    accessToken: tokenData.access_token,
    expiresIn: tokenData.expires_in,
    tokenType: tokenData.token_type,
    userId: fbUserInfo.id,
  }))

  if (existingDataSource) {
    // Update existing data source
    await prisma.dataSource.update({
      where: { id: existingDataSource.id },
      data: {
        name: fbUserInfo.name || fbUserInfo.email || 'Facebook Ads',
        credentials: encryptedCredentials,
        lastSyncAt: null,
        isActive: true,
      },
    })
  }
  else {
    // Create new data source
    await prisma.dataSource.create({
      data: {
        name: fbUserInfo.name || fbUserInfo.email || 'Facebook Ads',
        type: 'FACEBOOK_ADS',
        tenantId: stateData.tenantId,
        credentials: encryptedCredentials,
        isActive: true,
      },
    })
  }

  // Redirect back to integrations page with success
  return sendRedirect(event, `/${tenant.slug}/integrations?connected=facebook-ads`)
})
