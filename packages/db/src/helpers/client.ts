import { prisma } from '../client'
import type { Client } from '@prisma/client'

export interface CreateClientInput {
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
  tenantId: string
}

export interface UpdateClientInput {
  name?: string
  email?: string
  phone?: string
  company?: string
  notes?: string
}

export interface ClientWithStats extends Client {
  _count: {
    reports: number
    dashboards: number
  }
}

/**
 * Get all clients for a tenant with counts
 */
export async function getClientsByTenant(tenantId: string): Promise<ClientWithStats[]> {
  return prisma.client.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: {
          reports: true,
          dashboards: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Find client by ID (with tenant check)
 */
export async function findClientById(id: string, tenantId: string): Promise<Client | null> {
  return prisma.client.findFirst({
    where: {
      id,
      tenantId,
    },
  })
}

/**
 * Create a new client
 */
export async function createClient(input: CreateClientInput): Promise<Client> {
  return prisma.client.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      notes: input.notes,
      tenantId: input.tenantId,
    },
  })
}

/**
 * Update client (with tenant check)
 */
export async function updateClient(
  id: string,
  tenantId: string,
  input: UpdateClientInput,
): Promise<Client | null> {
  // First verify the client belongs to the tenant
  const existing = await findClientById(id, tenantId)
  if (!existing) return null

  return prisma.client.update({
    where: { id },
    data: input,
  })
}

/**
 * Delete client (with tenant check)
 */
export async function deleteClient(id: string, tenantId: string): Promise<boolean> {
  // First verify the client belongs to the tenant
  const existing = await findClientById(id, tenantId)
  if (!existing) return false

  await prisma.client.delete({
    where: { id },
  })
  return true
}

/**
 * Search clients by name or email
 */
export async function searchClients(
  tenantId: string,
  query: string,
): Promise<Client[]> {
  return prisma.client.findMany({
    where: {
      tenantId,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { name: 'asc' },
  })
}

/**
 * Get client with all related data
 */
export async function getClientWithDetails(id: string, tenantId: string) {
  return prisma.client.findFirst({
    where: {
      id,
      tenantId,
    },
    include: {
      reports: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      dashboards: {
        orderBy: { createdAt: 'desc' },
      },
      clientAccounts: {
        include: {
          platformAccount: {
            include: {
              dataSource: true,
            },
          },
        },
      },
    },
  })
}
