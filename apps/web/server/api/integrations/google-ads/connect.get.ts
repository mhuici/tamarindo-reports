import { defineEventHandler, sendRedirect } from 'h3'
import { requireAuth } from '../../../utils/auth'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_ADS_SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'openid',
  'email',
  'profile',
].join(' ')

/**
 * GET /api/integrations/google-ads/connect
 * Initiates Google Ads OAuth flow
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const config = useRuntimeConfig()
  const clientId = config.googleClientId

  if (!clientId) {
    throw createError({
      statusCode: 500,
      message: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID.',
    })
  }

  const redirectUri = `${config.public.appUrl}/api/integrations/google-ads/callback`

  // Encode state with tenant info
  const state = Buffer.from(JSON.stringify({
    tenantId: user.tenantId,
    userId: user.userId,
  })).toString('base64')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_ADS_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`

  return sendRedirect(event, authUrl)
})
