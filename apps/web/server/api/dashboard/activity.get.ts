import { defineEventHandler, getQuery } from 'h3'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/db'

interface Activity {
  id: string
  type: 'report_created' | 'report_shared' | 'email_sent' | 'pdf_generated' | 'client_added'
  title: string
  description: string
  timestamp: Date
  meta?: Record<string, any>
}

/**
 * GET /api/dashboard/activity
 * Get recent activity for the tenant
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const tenantId = user.tenantId
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 10, 50)

  // Get recent data from multiple sources
  const [recentReports, recentClients, recentEmails] = await Promise.all([
    // Recent reports (includes created, shared, PDF status)
    prisma.report.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      take: limit * 2, // Get more to merge
      select: {
        id: true,
        name: true,
        status: true,
        isPublic: true,
        pdfUrl: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: { name: true },
        },
      },
    }),

    // Recent clients
    prisma.client.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    }),

    // Recent email sends
    prisma.scheduleSendLog.findMany({
      where: {
        schedule: {
          report: { tenantId },
        },
      },
      orderBy: { sentAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        recipients: true,
        sentAt: true,
        schedule: {
          select: {
            report: {
              select: {
                name: true,
                client: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
  ])

  // Build unified activity feed
  const activities: Activity[] = []

  // Add report activities
  for (const report of recentReports) {
    // Report created
    activities.push({
      id: `report-created-${report.id}`,
      type: 'report_created',
      title: 'Report created',
      description: `${report.name} for ${report.client.name}`,
      timestamp: report.createdAt,
      meta: { reportId: report.id },
    })

    // Report shared (if public)
    if (report.isPublic) {
      activities.push({
        id: `report-shared-${report.id}`,
        type: 'report_shared',
        title: 'Report shared',
        description: `${report.name} is now public`,
        timestamp: report.updatedAt,
        meta: { reportId: report.id },
      })
    }

    // PDF generated
    if (report.pdfUrl) {
      activities.push({
        id: `pdf-${report.id}`,
        type: 'pdf_generated',
        title: 'PDF generated',
        description: `${report.name}`,
        timestamp: report.updatedAt,
        meta: { reportId: report.id },
      })
    }
  }

  // Add client activities
  for (const client of recentClients) {
    activities.push({
      id: `client-${client.id}`,
      type: 'client_added',
      title: 'Client added',
      description: client.name,
      timestamp: client.createdAt,
      meta: { clientId: client.id },
    })
  }

  // Add email activities
  for (const email of recentEmails) {
    if (email.status === 'success') {
      activities.push({
        id: `email-${email.id}`,
        type: 'email_sent',
        title: 'Report emailed',
        description: `${email.schedule.report.name} sent to ${email.recipients.length} recipient${email.recipients.length > 1 ? 's' : ''}`,
        timestamp: email.sentAt,
        meta: { recipients: email.recipients },
      })
    }
  }

  // Sort by timestamp and limit
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  const limitedActivities = activities.slice(0, limit)

  return {
    success: true,
    activities: limitedActivities,
  }
})
