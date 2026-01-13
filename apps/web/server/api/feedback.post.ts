interface FeedbackRequest {
  type: 'feedback' | 'bug' | 'feature'
  message: string
  email?: string
  url?: string
  userAgent?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<FeedbackRequest>(event)

  if (!body.message?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Message is required',
    })
  }

  // Get user info if authenticated
  const { user } = event.context
  const userId = user?.id
  const userEmail = user?.email || body.email

  // Log feedback (in production, you could send to Slack, email, or store in DB)
  const feedback = {
    type: body.type,
    message: body.message,
    email: userEmail,
    userId,
    url: body.url,
    userAgent: body.userAgent,
    timestamp: new Date().toISOString(),
  }

  // Log to console (visible in Railway logs)
  console.log('📬 New Feedback:', JSON.stringify(feedback, null, 2))

  // Optional: Send to Slack webhook if configured
  const slackWebhook = process.env.SLACK_FEEDBACK_WEBHOOK
  if (slackWebhook) {
    try {
      const typeEmoji = body.type === 'bug' ? '🐛' : body.type === 'feature' ? '💡' : '💬'
      await $fetch(slackWebhook, {
        method: 'POST',
        body: {
          text: `${typeEmoji} *New ${body.type}* from ${userEmail || 'Anonymous'}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `${typeEmoji} *New ${body.type.charAt(0).toUpperCase() + body.type.slice(1)}*`,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*From:*\n${userEmail || 'Anonymous'}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Page:*\n${body.url || 'N/A'}`,
                },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Message:*\n${body.message}`,
              },
            },
          ],
        },
      })
    }
    catch (e) {
      console.error('Failed to send feedback to Slack:', e)
    }
  }

  return {
    success: true,
    message: 'Feedback received',
  }
})
