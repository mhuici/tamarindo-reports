import { prisma } from '@tamarindo/db'

export default defineEventHandler(async (event) => {
  const { user } = event.context

  if (!user?.tenantId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const tenantId = user.tenantId

  // Get current settings
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  })

  const currentSettings = (tenant?.settings as Record<string, unknown>) || {}

  // Update settings with onboardingInsightSeen flag
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      settings: {
        ...currentSettings,
        onboardingInsightSeen: true,
        onboardingInsightSeenAt: new Date().toISOString(),
      },
    },
  })

  return {
    success: true,
  }
})
