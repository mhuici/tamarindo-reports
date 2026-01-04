import { defineEventHandler, createError, readBody } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../../../utils/auth'
import { prisma } from '../../../../utils/db'

const scheduleSchema = z.object({
  isActive: z.boolean().default(true),
  frequency: z.enum(['ONCE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).default('WEEKLY'),
  timezone: z.string().default('America/Mexico_City'),
  sendTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('09:00'),
  dayOfWeek: z.number().min(0).max(6).nullable().optional(),
  dayOfMonth: z.number().min(1).max(31).nullable().optional(),
  recipients: z.array(z.string().email()).min(1),
})

/**
 * Calculate next send date based on schedule configuration
 */
function calculateNextSendAt(
  frequency: string,
  sendTime: string,
  timezone: string,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null,
): Date {
  const now = new Date()
  const [hours, minutes] = sendTime.split(':').map(Number)

  // Create date in the target timezone
  const next = new Date(now)
  next.setHours(hours, minutes, 0, 0)

  // If the time has passed today, start from tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1)
  }

  switch (frequency) {
    case 'ONCE':
      // Already set to the next occurrence
      break

    case 'DAILY':
      // Already set to the next occurrence
      break

    case 'WEEKLY':
      if (dayOfWeek !== null && dayOfWeek !== undefined) {
        const currentDay = next.getDay()
        const daysUntil = (dayOfWeek - currentDay + 7) % 7
        if (daysUntil === 0 && next <= now) {
          next.setDate(next.getDate() + 7)
        }
        else {
          next.setDate(next.getDate() + daysUntil)
        }
      }
      break

    case 'BIWEEKLY':
      if (dayOfWeek !== null && dayOfWeek !== undefined) {
        const currentDay = next.getDay()
        let daysUntil = (dayOfWeek - currentDay + 7) % 7
        if (daysUntil === 0 && next <= now) {
          daysUntil = 14
        }
        next.setDate(next.getDate() + daysUntil)
      }
      break

    case 'MONTHLY':
      if (dayOfMonth !== null && dayOfMonth !== undefined) {
        next.setDate(dayOfMonth)
        if (next <= now) {
          next.setMonth(next.getMonth() + 1)
        }
      }
      break
  }

  return next
}

/**
 * POST /api/reports/:id/schedule
 * Create or update report schedule
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const reportId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!reportId) {
    throw createError({
      statusCode: 400,
      message: 'Report ID is required',
    })
  }

  // Validate input
  const result = scheduleSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid schedule data',
      data: result.error.flatten(),
    })
  }

  const data = result.data

  // Verify report belongs to tenant
  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      tenantId: user.tenantId,
    },
    select: {
      id: true,
      schedule: true,
    },
  })

  if (!report) {
    throw createError({
      statusCode: 404,
      message: 'Report not found',
    })
  }

  // Calculate next send date
  const nextSendAt = data.isActive
    ? calculateNextSendAt(
        data.frequency,
        data.sendTime,
        data.timezone,
        data.dayOfWeek,
        data.dayOfMonth,
      )
    : null

  // Upsert schedule
  const schedule = await prisma.reportSchedule.upsert({
    where: { reportId },
    create: {
      reportId,
      isActive: data.isActive,
      frequency: data.frequency,
      timezone: data.timezone,
      sendTime: data.sendTime,
      dayOfWeek: data.dayOfWeek,
      dayOfMonth: data.dayOfMonth,
      recipients: data.recipients,
      nextSendAt,
    },
    update: {
      isActive: data.isActive,
      frequency: data.frequency,
      timezone: data.timezone,
      sendTime: data.sendTime,
      dayOfWeek: data.dayOfWeek,
      dayOfMonth: data.dayOfMonth,
      recipients: data.recipients,
      nextSendAt,
    },
  })

  return {
    success: true,
    schedule,
  }
})
