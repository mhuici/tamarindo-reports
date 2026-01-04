import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendReportEmailOptions {
  to: string[]
  subject: string
  reportName: string
  clientName: string
  tenantName: string
  reportUrl: string
  pdfUrl?: string
  // Branding
  fromName?: string
  primaryColor?: string
  logoUrl?: string
}

export async function sendReportEmail(options: SendReportEmailOptions) {
  const {
    to,
    subject,
    reportName,
    clientName,
    tenantName,
    reportUrl,
    pdfUrl,
    fromName,
    primaryColor = '#f97316',
    logoUrl,
  } = options

  // Use custom from name if provided (white-label), otherwise default
  const fromAddress = fromName
    ? `${fromName} <reports@tamarindoreports.com>`
    : `${tenantName} Reports <reports@tamarindoreports.com>`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="background: white; border-radius: 16px 16px 0 0; padding: 32px; text-align: center; border-bottom: 4px solid ${primaryColor};">
      ${logoUrl
        ? `<img src="${logoUrl}" alt="${tenantName}" style="max-height: 48px; margin-bottom: 16px;" />`
        : `<div style="font-size: 24px; font-weight: 700; color: ${primaryColor};">${tenantName}</div>`
      }
    </div>

    <!-- Content -->
    <div style="background: white; padding: 32px;">
      <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #111827;">
        Your Report is Ready
      </h1>
      <p style="margin: 0 0 24px; color: #6b7280; font-size: 16px;">
        A new marketing report has been generated for ${clientName}.
      </p>

      <!-- Report Card -->
      <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <div style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 4px;">
          ${reportName}
        </div>
        <div style="font-size: 14px; color: #6b7280;">
          ${clientName}
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${reportUrl}" style="display: inline-block; background: ${primaryColor}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          View Report
        </a>
      </div>

      ${pdfUrl ? `
      <div style="text-align: center;">
        <a href="${pdfUrl}" style="color: ${primaryColor}; text-decoration: none; font-size: 14px; font-weight: 500;">
          📄 Download PDF Version
        </a>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; border-radius: 0 0 16px 16px; padding: 24px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        This report was sent by ${tenantName}
      </p>
      <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">
        Powered by TamarindoReports
      </p>
    </div>
  </div>
</body>
</html>
`

  const textContent = `
Your Report is Ready

A new marketing report has been generated for ${clientName}.

Report: ${reportName}
Client: ${clientName}

View Report: ${reportUrl}
${pdfUrl ? `Download PDF: ${pdfUrl}` : ''}

---
This report was sent by ${tenantName}
Powered by TamarindoReports
`

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      text: textContent,
    })

    return { success: true, messageId: result.data?.id }
  }
  catch (error: any) {
    console.error('[Email Service] Failed to send email:', error)
    return { success: false, error: error.message }
  }
}

interface SendScheduledReportOptions {
  reportId: string
  reportName: string
  clientName: string
  clientEmail?: string
  recipients: string[]
  reportUrl: string
  pdfUrl?: string
  tenant: {
    name: string
    branding?: {
      logoUrl?: string
      primaryColor?: string
      emailFromName?: string
    }
  }
}

export async function sendScheduledReport(options: SendScheduledReportOptions) {
  const {
    reportName,
    clientName,
    recipients,
    reportUrl,
    pdfUrl,
    tenant,
  } = options

  // Combine recipients with client email if provided
  const allRecipients = [...new Set(recipients)]

  if (allRecipients.length === 0) {
    return { success: false, error: 'No recipients specified' }
  }

  const branding = tenant.branding || {}

  return sendReportEmail({
    to: allRecipients,
    subject: `${reportName} - ${clientName}`,
    reportName,
    clientName,
    tenantName: tenant.name,
    reportUrl,
    pdfUrl,
    fromName: branding.emailFromName,
    primaryColor: branding.primaryColor,
    logoUrl: branding.logoUrl,
  })
}
