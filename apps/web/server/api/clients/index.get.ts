import { defineEventHandler, getQuery } from 'h3'
import { requireAuth } from '../../utils/auth'
import { getClientsByTenant, searchClients } from '../../utils/db'

/**
 * GET /api/clients
 * Get all clients for the authenticated user's tenant
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const query = getQuery(event)
  const search = query.search as string | undefined

  let clients

  if (search && search.length > 0) {
    clients = await searchClients(user.tenantId, search)
  }
  else {
    clients = await getClientsByTenant(user.tenantId)
  }

  return { clients }
})
