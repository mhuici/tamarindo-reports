import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import crypto from 'crypto'
import { nanoid } from 'nanoid'
import { requireAuth } from '../../../utils/auth'
import { prisma } from '../../../utils/db'

const shareSchema = z.object({
  isPublic: z.boolean(),
  password: z.string().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
})

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function generateSlug(): string {
  return nanoid(10) // 10 character URL-safe slug
}

/**
 * POST /api/reports/:id/share
 * Create or update share settings for a report
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Missing report ID',
    })
  }

  const result = shareSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid share settings',
      data: result.error.flatten(),
    })
  }

  const { isPublic, password, expiresAt } = result.data

  // Verify report exists and belongs to tenant
  const report = await prisma.report.findFirst({
    where: {
      id,
      tenantId: user.tenantId,
    },
  })

  if (!report) {
    throw createError({
      statusCode: 404,
      message: 'Report not found',
    })
  }

  // Generate slug if making public for the first time
  let slug = report.slug
  if (isPublic && !slug) {
    slug = generateSlug()
    // Ensure uniqueness
    let attempts = 0
    while (attempts < 5) {
      const existing = await prisma.report.findUnique({ where: { slug } })
      if (!existing) break
      slug = generateSlug()
      attempts++
    }
  }

  // Hash password if provided
  let hashedPassword: string | null = null
  if (password) {
    hashedPassword = hashPassword(password)
  }
  else if (password === null) {
    // Explicitly clearing password
    hashedPassword = null
  }
  else {
    // Keep existing password
    hashedPassword = report.sharePassword
  }

  // Update report
  const updatedReport = await prisma.report.update({
    where: { id },
    data: {
      slug,
      isPublic,
      sharePassword: hashedPassword,
      shareExpiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })

  // Generate the share URL
  const baseUrl = process.env.NUXT_PUBLIC_APP_URL || 'https://tamarindo.app'
  const shareUrl = isPublic && slug ? `${baseUrl}/r/${slug}` : null

  return {
    success: true,
    share: {
      isPublic: updatedReport.isPublic,
      slug: updatedReport.slug,
      hasPassword: !!updatedReport.sharePassword,
      expiresAt: updatedReport.shareExpiresAt,
      shareUrl,
    },
  }
})
