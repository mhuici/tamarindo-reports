import { prisma } from '../db'
import { getValidAccessToken } from './tokens'

// Google Ads API
const GOOGLE_ADS_API_VERSION = 'v15'
const GOOGLE_ADS_API_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`

// Facebook Marketing API
const FACEBOOK_API_VERSION = 'v18.0'
const FACEBOOK_API_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`

// Google Analytics Admin API
const GA_ADMIN_API_URL = 'https://analyticsadmin.googleapis.com/v1beta'

interface SyncResult {
  success: boolean
  accountsFound: number
  accountsSynced: number
  error?: string
}

/**
 * Sync all ad accounts for a DataSource
 * Called after OAuth and periodically to discover new accounts
 */
export async function syncPlatformAccounts(dataSourceId: string): Promise<SyncResult> {
  const dataSource = await prisma.dataSource.findUnique({
    where: { id: dataSourceId },
    select: {
      id: true,
      type: true,
      tenantId: true,
    },
  })

  if (!dataSource) {
    return { success: false, accountsFound: 0, accountsSynced: 0, error: 'DataSource not found' }
  }

  // Update status to syncing
  await prisma.dataSource.update({
    where: { id: dataSourceId },
    data: { status: 'SYNCING' },
  })

  try {
    let result: SyncResult

    switch (dataSource.type) {
      case 'GOOGLE_ADS':
        result = await syncGoogleAdsAccounts(dataSourceId)
        break
      case 'FACEBOOK_ADS':
        result = await syncFacebookAdsAccounts(dataSourceId)
        break
      case 'GOOGLE_ANALYTICS':
        result = await syncGoogleAnalyticsAccounts(dataSourceId)
        break
      default:
        result = { success: false, accountsFound: 0, accountsSynced: 0, error: `Unsupported type: ${dataSource.type}` }
    }

    // Update status back to active (or error if failed)
    await prisma.dataSource.update({
      where: { id: dataSourceId },
      data: {
        status: result.success ? 'ACTIVE' : 'ERROR',
        syncError: result.error || null,
        lastSyncAt: new Date(),
      },
    })

    return result
  }
  catch (e: any) {
    console.error(`[SyncAccounts] Error syncing ${dataSource.type}:`, e)

    await prisma.dataSource.update({
      where: { id: dataSourceId },
      data: {
        status: 'ERROR',
        syncError: e.message,
      },
    })

    return { success: false, accountsFound: 0, accountsSynced: 0, error: e.message }
  }
}

/**
 * Sync Google Ads accounts (via Customer Service)
 * Lists all accessible customer IDs from the MCC or individual account
 */
async function syncGoogleAdsAccounts(dataSourceId: string): Promise<SyncResult> {
  const tokenResult = await getValidAccessToken(dataSourceId)

  if (!tokenResult.success) {
    return { success: false, accountsFound: 0, accountsSynced: 0, error: tokenResult.error }
  }

  const config = useRuntimeConfig()

  try {
    // List accessible customers
    const response = await fetch(`${GOOGLE_ADS_API_URL}/customers:listAccessibleCustomers`, {
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        'developer-token': config.googleAdsDeveloperToken || '',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[SyncAccounts] Google Ads listAccessibleCustomers failed:', error)
      return { success: false, accountsFound: 0, accountsSynced: 0, error: 'Failed to list customers' }
    }

    const data = await response.json()
    const customerResourceNames: string[] = data.resourceNames || []

    if (customerResourceNames.length === 0) {
      return { success: true, accountsFound: 0, accountsSynced: 0 }
    }

    // Get details for each customer
    let accountsSynced = 0

    for (const resourceName of customerResourceNames) {
      const customerId = resourceName.replace('customers/', '')

      try {
        // Get customer details using GAQL
        const queryResponse = await fetch(`${GOOGLE_ADS_API_URL}/${resourceName}/googleAds:searchStream`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenResult.accessToken}`,
            'developer-token': config.googleAdsDeveloperToken || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              SELECT
                customer.id,
                customer.descriptive_name,
                customer.currency_code,
                customer.time_zone,
                customer.manager,
                customer.status
              FROM customer
              LIMIT 1
            `,
          }),
        })

        if (queryResponse.ok) {
          const queryData = await queryResponse.json()
          const results = queryData[0]?.results || []

          if (results.length > 0) {
            const customer = results[0].customer

            // Upsert platform account
            await prisma.platformAccount.upsert({
              where: {
                dataSourceId_platformId: {
                  dataSourceId,
                  platformId: customerId,
                },
              },
              create: {
                dataSourceId,
                platformId: customerId,
                name: customer.descriptiveName || `Account ${customerId}`,
                currency: customer.currencyCode,
                timezone: customer.timeZone,
                isActive: customer.status === 'ENABLED',
                metadata: {
                  isManager: customer.manager || false,
                  resourceName,
                },
              },
              update: {
                name: customer.descriptiveName || `Account ${customerId}`,
                currency: customer.currencyCode,
                timezone: customer.timeZone,
                isActive: customer.status === 'ENABLED',
                metadata: {
                  isManager: customer.manager || false,
                  resourceName,
                },
              },
            })

            accountsSynced++
          }
        }
      }
      catch (e) {
        console.error(`[SyncAccounts] Failed to get details for customer ${customerId}:`, e)
      }
    }

    console.log(`[SyncAccounts] Google Ads: synced ${accountsSynced} of ${customerResourceNames.length} accounts`)
    return { success: true, accountsFound: customerResourceNames.length, accountsSynced }
  }
  catch (e: any) {
    console.error('[SyncAccounts] Google Ads sync error:', e)
    return { success: false, accountsFound: 0, accountsSynced: 0, error: e.message }
  }
}

/**
 * Sync Facebook Ads accounts
 * Lists all ad accounts the user has access to
 */
async function syncFacebookAdsAccounts(dataSourceId: string): Promise<SyncResult> {
  const tokenResult = await getValidAccessToken(dataSourceId)

  if (!tokenResult.success) {
    return { success: false, accountsFound: 0, accountsSynced: 0, error: tokenResult.error }
  }

  try {
    // Get user's ad accounts
    const response = await fetch(
      `${FACEBOOK_API_URL}/me/adaccounts?fields=id,name,currency,timezone_name,account_status&access_token=${tokenResult.accessToken}`,
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('[SyncAccounts] Facebook Ads list failed:', error)
      return { success: false, accountsFound: 0, accountsSynced: 0, error: error.error?.message || 'Failed to list ad accounts' }
    }

    const data = await response.json()
    const adAccounts = data.data || []

    let accountsSynced = 0

    for (const account of adAccounts) {
      // Facebook account IDs come as "act_123456"
      const accountId = account.id

      await prisma.platformAccount.upsert({
        where: {
          dataSourceId_platformId: {
            dataSourceId,
            platformId: accountId,
          },
        },
        create: {
          dataSourceId,
          platformId: accountId,
          name: account.name || accountId,
          currency: account.currency,
          timezone: account.timezone_name,
          isActive: account.account_status === 1, // 1 = ACTIVE
          metadata: {
            accountStatus: account.account_status,
          },
        },
        update: {
          name: account.name || accountId,
          currency: account.currency,
          timezone: account.timezone_name,
          isActive: account.account_status === 1,
          metadata: {
            accountStatus: account.account_status,
          },
        },
      })

      accountsSynced++
    }

    console.log(`[SyncAccounts] Facebook Ads: synced ${accountsSynced} accounts`)
    return { success: true, accountsFound: adAccounts.length, accountsSynced }
  }
  catch (e: any) {
    console.error('[SyncAccounts] Facebook Ads sync error:', e)
    return { success: false, accountsFound: 0, accountsSynced: 0, error: e.message }
  }
}

/**
 * Sync Google Analytics 4 properties
 */
async function syncGoogleAnalyticsAccounts(dataSourceId: string): Promise<SyncResult> {
  const tokenResult = await getValidAccessToken(dataSourceId)

  if (!tokenResult.success) {
    return { success: false, accountsFound: 0, accountsSynced: 0, error: tokenResult.error }
  }

  try {
    // List GA4 account summaries
    const response = await fetch(`${GA_ADMIN_API_URL}/accountSummaries`, {
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[SyncAccounts] GA4 list failed:', error)
      return { success: false, accountsFound: 0, accountsSynced: 0, error: 'Failed to list GA4 properties' }
    }

    const data = await response.json()
    const accountSummaries = data.accountSummaries || []

    let accountsSynced = 0
    let totalProperties = 0

    for (const account of accountSummaries) {
      const properties = account.propertySummaries || []

      for (const property of properties) {
        totalProperties++

        // Property name is like "properties/123456"
        const propertyId = property.property.replace('properties/', '')

        await prisma.platformAccount.upsert({
          where: {
            dataSourceId_platformId: {
              dataSourceId,
              platformId: propertyId,
            },
          },
          create: {
            dataSourceId,
            platformId: propertyId,
            name: property.displayName || `Property ${propertyId}`,
            timezone: null, // GA4 doesn't return timezone in summary
            currency: null,
            isActive: true,
            metadata: {
              accountName: account.displayName,
              propertyType: property.propertyType,
              resourceName: property.property,
            },
          },
          update: {
            name: property.displayName || `Property ${propertyId}`,
            metadata: {
              accountName: account.displayName,
              propertyType: property.propertyType,
              resourceName: property.property,
            },
          },
        })

        accountsSynced++
      }
    }

    console.log(`[SyncAccounts] GA4: synced ${accountsSynced} properties`)
    return { success: true, accountsFound: totalProperties, accountsSynced }
  }
  catch (e: any) {
    console.error('[SyncAccounts] GA4 sync error:', e)
    return { success: false, accountsFound: 0, accountsSynced: 0, error: e.message }
  }
}
