import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

const updateBrandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logoUrl: z.string().url().or(z.literal('')).optional(),
  companyName: z.string().min(1).max(200).optional(),
  tagline: z.string().max(500).optional(),
  favicon: z.string().url().or(z.literal('')).optional(),
  // White-label expanded
  reportFooterText: z.string().max(200).optional(), // e.g. "Prepared by [Agency]"
  hideFooterBranding: z.boolean().optional(), // Hide "Powered by Tamarindo"
  emailFromName: z.string().max(100).optional(), // e.g. "Agency Reports"
})

/**
 * PUT /api/tenants/branding
 * Update tenant branding settings
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)

  // Only OWNER or ADMIN can update branding
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Only owners and admins can update branding',
    })
  }

  const result = updateBrandingSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid branding data',
      data: result.error.flatten(),
    })
  }

  // Get current tenant branding
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { branding: true },
  })

  // Merge with existing branding
  const currentBranding = (tenant?.branding as Record<string, any>) || {}
  const newBranding = {
    ...currentBranding,
    ...result.data,
  }

  // Remove empty strings
  Object.keys(newBranding).forEach((key) => {
    if (newBranding[key] === '') {
      delete newBranding[key]
    }
  })

  // Update tenant
  const updatedTenant = await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      branding: newBranding,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      branding: true,
    },
  })

  return {
    success: true,
    tenant: updatedTenant,
  }
})
