import { defineEventHandler, createError, getHeader } from 'h3'
import { prisma } from '../../utils/db'
import { sendScheduledReport } from '../../utils/email/service'

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

/**
 * Calculate next send date based on frequency
 */
function calculateNextSendAt(
  frequency: string,
  sendTime: string,
  currentNextSendAt: Date,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null,
): Date {
  const next = new Date(currentNextSendAt)
  const [hours, minutes] = sendTime.split(':').map(Number)

  switch (frequency) {
    case 'ONCE':
      // One-time send, no next date
      return next

    case 'DAILY':
      next.setDate(next.getDate() + 1)
      break

    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      break

    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14)
      break

    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1)
      if (dayOfMonth) {
        next.setDate(dayOfMonth)
      }
      break
  }

  next.setHours(hours, minutes, 0, 0)
  return next
}

/**
 * POST /api/cron/send-reports
 * Process scheduled report sends
 * Called by cron job (e.g., every 5 minutes)
 */
export default defineEventHandler(async (event) => {
  // Verify cron secret
  const authHeader = getHeader(event, 'authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const now = new Date()

  // Find schedules that are due
  const dueSchedules = await prisma.reportSchedule.findMany({
    where: {
      isActive: true,
      nextSendAt: {
        lte: now,
      },
    },
    include: {
      report: {
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
          tenant: {
            select: {
              name: true,
              slug: true,
              branding: true,
            },
          },
        },
      },
    },
  })

  const results: Array<{
    scheduleId: string
    reportId: string
    success: boolean
    error?: string
  }> = []

  for (const schedule of dueSchedules) {
    const { report } = schedule

    // Build report URL
    const baseUrl = process.env.NUXT_PUBLIC_APP_URL || 'https://app.tamarindoreports.com'
    const reportUrl = report.slug
      ? `${baseUrl}/r/${report.slug}`
      : `${baseUrl}/${report.tenant.slug}/reports/${report.id}`

    try {
      // Send email
      const emailResult = await sendScheduledReport({
        reportId: report.id,
        reportName: report.name,
        clientName: report.client.name,
        clientEmail: report.client.email || undefined,
        recipients: schedule.recipients,
        reportUrl,
        pdfUrl: report.pdfUrl || undefined,
        tenant: {
          name: report.tenant.name,
          branding: report.tenant.branding as any,
        },
      })

      // Log the send
      await prisma.scheduleSendLog.create({
        data: {
          scheduleId: schedule.id,
          status: emailResult.success ? 'success' : 'failed',
          error: emailResult.error,
          recipients: schedule.recipients,
        },
      })

      // Update schedule with next send date
      const isOneTime = schedule.frequency === 'ONCE'
      const nextSendAt = isOneTime
        ? null
        : calculateNextSendAt(
            schedule.frequency,
            schedule.sendTime,
            schedule.nextSendAt!,
            schedule.dayOfWeek,
            schedule.dayOfMonth,
          )

      await prisma.reportSchedule.update({
        where: { id: schedule.id },
        data: {
          lastSentAt: now,
          nextSendAt,
          // Deactivate one-time schedules after sending
          isActive: isOneTime ? false : schedule.isActive,
        },
      })

      results.push({
        scheduleId: schedule.id,
        reportId: report.id,
        success: emailResult.success,
        error: emailResult.error,
      })
    }
    catch (error: any) {
      console.error(`[Cron] Failed to send report ${report.id}:`, error)

      // Log failure
      await prisma.scheduleSendLog.create({
        data: {
          scheduleId: schedule.id,
          status: 'failed',
          error: error.message,
          recipients: schedule.recipients,
        },
      })

      results.push({
        scheduleId: schedule.id,
        reportId: report.id,
        success: false,
        error: error.message,
      })
    }
  }

  return {
    success: true,
    processed: results.length,
    results,
  }
})
