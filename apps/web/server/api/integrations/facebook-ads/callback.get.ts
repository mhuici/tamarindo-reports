import { defineEventHandler, getQuery, sendRedirect, createError } from 'h3'
import { prisma, encrypt } from '../../../utils/db'

const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'
const FACEBOOK_ME_URL = 'https://graph.facebook.com/v18.0/me'
const FACEBOOK_AD_ACCOUNTS_URL = 'https://graph.facebook.com/v18.0/me/adaccounts'

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

  let dataSourceId: string

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
    dataSourceId = existingDataSource.id
  }
  else {
    // Create new data source
    const newDataSource = await prisma.dataSource.create({
      data: {
        name: fbUserInfo.name || fbUserInfo.email || 'Facebook Ads',
        type: 'FACEBOOK_ADS',
        tenantId: stateData.tenantId,
        credentials: encryptedCredentials,
        isActive: true,
      },
    })
    dataSourceId = newDataSource.id
  }

  // Fetch Ad Accounts from Facebook and create PlatformAccounts
  try {
    const adAccountsResponse = await fetch(
      `${FACEBOOK_AD_ACCOUNTS_URL}?fields=id,name,currency,timezone_name&access_token=${tokenData.access_token}`,
    )

    if (adAccountsResponse.ok) {
      const adAccountsData = await adAccountsResponse.json()
      const adAccounts = adAccountsData.data || []

      console.log(`[Facebook] Found ${adAccounts.length} ad accounts`)

      for (const account of adAccounts) {
        // Check if PlatformAccount already exists
        const existingAccount = await prisma.platformAccount.findFirst({
          where: {
            dataSourceId,
            platformId: account.id,
          },
        })

        if (existingAccount) {
          // Update existing account
          await prisma.platformAccount.update({
            where: { id: existingAccount.id },
            data: {
              name: account.name || `Account ${account.id}`,
              currency: account.currency || 'USD',
              timezone: account.timezone_name || 'UTC',
            },
          })
        }
        else {
          // Create new PlatformAccount
          await prisma.platformAccount.create({
            data: {
              dataSourceId,
              platformId: account.id,
              name: account.name || `Account ${account.id}`,
              currency: account.currency || 'USD',
              timezone: account.timezone_name || 'UTC',
            },
          })
        }
      }
    }
    else {
      console.error('[Facebook] Failed to fetch ad accounts:', await adAccountsResponse.text())
    }
  }
  catch (error) {
    console.error('[Facebook] Error fetching ad accounts:', error)
    // Don't fail the whole flow, just log the error
  }

  // Redirect back to integrations page with success
  return sendRedirect(event, `/${tenant.slug}/integrations?connected=facebook-ads`)
})
