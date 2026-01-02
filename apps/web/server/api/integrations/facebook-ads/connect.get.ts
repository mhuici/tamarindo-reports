import { defineEventHandler, sendRedirect } from 'h3'
import { requireAuth } from '../../../utils/auth'

const FACEBOOK_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth'
const FACEBOOK_SCOPES = [
  'ads_read',
  'ads_management',
  'business_management',
].join(',')

/**
 * GET /api/integrations/facebook-ads/connect
 * Initiates Facebook Ads OAuth flow
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const config = useRuntimeConfig()
  const appId = config.facebookAppId

  if (!appId) {
    throw createError({
      statusCode: 500,
      message: 'Facebook OAuth not configured. Please set FACEBOOK_APP_ID.',
    })
  }

  const redirectUri = `${config.public.appUrl}/api/integrations/facebook-ads/callback`

  // Encode state with tenant info
  const state = Buffer.from(JSON.stringify({
    tenantId: user.tenantId,
    userId: user.userId,
  })).toString('base64')

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: FACEBOOK_SCOPES,
    response_type: 'code',
    state,
  })

  const authUrl = `${FACEBOOK_AUTH_URL}?${params.toString()}`

  return sendRedirect(event, authUrl)
})
