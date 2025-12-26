import { prisma } from '../client'
import type { Tenant, Plan } from '@prisma/client'

export interface CreateTenantInput {
  name: string
  slug: string
  plan?: Plan
  branding?: {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
    font?: string
  }
  settings?: {
    timezone?: string
    language?: string
  }
}

export interface UpdateTenantInput {
  name?: string
  plan?: Plan
  branding?: Record<string, unknown>
  settings?: Record<string, unknown>
}

/**
 * Find tenant by slug (used for path-based multi-tenancy)
 */
export async function findTenantBySlug(slug: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({
    where: { slug },
  })
}

/**
 * Find tenant by ID
 */
export async function findTenantById(id: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({
    where: { id },
  })
}

/**
 * Create a new tenant
 */
export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  return prisma.tenant.create({
    data: {
      name: input.name,
      slug: input.slug,
      plan: input.plan || 'FREE',
      branding: input.branding || {
        primaryColor: '#d17a5a',
        secondaryColor: '#a14e33',
      },
      settings: input.settings || {
        timezone: 'America/Mexico_City',
        language: 'es',
      },
    },
  })
}

/**
 * Update tenant
 */
export async function updateTenant(id: string, input: UpdateTenantInput): Promise<Tenant> {
  return prisma.tenant.update({
    where: { id },
    data: input,
  })
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true },
  })
  return tenant === null
}

/**
 * Generate a unique slug from name
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  let slug = baseSlug
  let counter = 1

  while (!(await isSlugAvailable(slug))) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}
