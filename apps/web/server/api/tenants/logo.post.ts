import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'
import { isR2Configured, uploadToR2, deleteFromR2, validateImageFile } from '../../utils/storage/r2'

/**
 * POST /api/tenants/logo
 * Upload tenant logo to R2 storage
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  // Only OWNER or ADMIN can upload logo
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Only owners and admins can upload logo',
    })
  }

  // Check if R2 is configured
  if (!isR2Configured()) {
    throw createError({
      statusCode: 503,
      message: 'File storage is not configured. Please set R2 environment variables.',
    })
  }

  // Read multipart form data
  const formData = await readMultipartFormData(event)
  const file = formData?.find(f => f.name === 'logo')

  if (!file) {
    throw createError({
      statusCode: 400,
      message: 'No logo file provided',
    })
  }

  // Validate file
  const validation = validateImageFile(file.data, file.type)
  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      message: validation.error || 'Invalid file',
    })
  }

  // Upload to R2
  const url = await uploadToR2(
    file.data,
    file.filename || 'logo.png',
    file.type || 'image/png',
    'logos',
  )

  // Get current tenant branding to check for old logo
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { branding: true },
  })

  const currentBranding = (tenant?.branding as Record<string, any>) || {}
  const oldLogoUrl = currentBranding.logoUrl as string | undefined

  // Delete old logo from R2 if it exists
  if (oldLogoUrl) {
    try {
      await deleteFromR2(oldLogoUrl)
    }
    catch {
      // Ignore errors deleting old logo - it may be external URL
    }
  }

  // Update tenant branding with new logo URL
  const updatedTenant = await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      branding: {
        ...currentBranding,
        logoUrl: url,
      },
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
    url,
    tenant: updatedTenant,
  }
})
