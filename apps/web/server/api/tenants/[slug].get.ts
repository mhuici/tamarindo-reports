import { defineEventHandler, getRouterParam, createError } from 'h3'
import { findTenantBySlug } from '../../utils/db'

/**
 * GET /api/tenants/:slug
 * Get tenant by slug (public info for branding)
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Tenant slug is required',
    })
  }

  const tenant = await findTenantBySlug(slug)

  if (!tenant) {
    throw createError({
      statusCode: 404,
      message: 'Tenant not found',
    })
  }

  // Return public info wrapped in tenant object
  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      branding: tenant.branding,
    },
  }
})
