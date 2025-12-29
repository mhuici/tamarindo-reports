/**
 * PDF Generation Service
 *
 * Generates PDF reports using Puppeteer or external service.
 * Supports multiple generation strategies for different environments.
 */

import puppeteer, { type Browser } from 'puppeteer'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

interface GeneratePDFParams {
  reportId: string
  reportName: string
  clientName: string
  tenantName?: string
  tenantId: string
  dateRange: { start: string, end: string }
  widgets: any[]
  metrics?: {
    totals: Record<string, number>
    previousTotals: Record<string, number>
    byDate: Array<{ date: string, metrics: Record<string, number> }>
  }
  aiInsights?: string
  branding?: {
    primaryColor?: string
    secondaryColor?: string
    logoUrl?: string
    companyName?: string
  }
}

interface PDFResult {
  success: boolean
  pdfUrl?: string
  pdfPath?: string
  error?: string
}

// Browser instance singleton for reuse
let browserInstance: Browser | null = null

/**
 * Get or create browser instance (singleton pattern for efficiency)
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance
  }

  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
    ],
  })

  return browserInstance
}

/**
 * Close browser instance (call on server shutdown)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}

/**
 * Check if PDF generation is available
 */
export function isPDFServiceAvailable(): boolean {
  return !!process.env.PDF_SERVICE_URL || process.env.PUPPETEER_ENABLED === 'true' || true // Always available with local Puppeteer
}

/**
 * Generate PDF for a report
 */
export async function generateReportPDF(params: GeneratePDFParams): Promise<PDFResult> {
  try {
    // Option 1: External PDF service (if configured)
    if (process.env.PDF_SERVICE_URL) {
      return await generateWithExternalService(params)
    }

    // Option 2: Local Puppeteer (default)
    return await generateWithPuppeteer(params)
  }
  catch (error: any) {
    console.error('PDF generation failed:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate PDF',
    }
  }
}

/**
 * Generate PDF using Puppeteer with inline HTML
 */
async function generateWithPuppeteer(params: GeneratePDFParams): Promise<PDFResult> {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    // Generate HTML content
    const html = generateReportHTML(params)

    // Set content and wait for it to load
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 9px; color: #666; width: 100%; text-align: center; padding: 5px 0;">
          ${params.branding?.companyName || 'TamarindoReports'}
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; color: #666; width: 100%; text-align: center; padding: 5px 0;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    })

    // Save PDF to disk
    const pdfDir = join(process.cwd(), 'public', 'pdfs')
    if (!existsSync(pdfDir)) {
      await mkdir(pdfDir, { recursive: true })
    }

    const filename = `report-${params.reportId}-${Date.now()}.pdf`
    const pdfPath = join(pdfDir, filename)
    await writeFile(pdfPath, pdfBuffer)

    const pdfUrl = `/pdfs/${filename}`

    return {
      success: true,
      pdfUrl,
      pdfPath,
    }
  }
  finally {
    await page.close()
  }
}

/**
 * Generate PDF using external service
 */
async function generateWithExternalService(params: GeneratePDFParams): Promise<PDFResult> {
  const serviceUrl = process.env.PDF_SERVICE_URL!
  const baseUrl = process.env.APP_URL || 'http://localhost:3000'
  const reportUrl = `${baseUrl}/pdf/report/${params.reportId}`

  try {
    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PDF_SERVICE_API_KEY || ''}`,
      },
      body: JSON.stringify({
        url: reportUrl,
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      }),
    })

    if (!response.ok) {
      throw new Error(`PDF service returned ${response.status}`)
    }

    const result = await response.json()
    return {
      success: true,
      pdfUrl: result.url || result.pdfUrl,
    }
  }
  catch (error: any) {
    return {
      success: false,
      error: `External PDF service error: ${error.message}`,
    }
  }
}

/**
 * Generate HTML for the report (used by Puppeteer)
 */
function generateReportHTML(params: GeneratePDFParams): string {
  const {
    reportName,
    clientName,
    tenantName,
    dateRange,
    widgets,
    metrics,
    aiInsights,
    branding,
  } = params

  const primaryColor = branding?.primaryColor || '#f97316'
  const companyName = branding?.companyName || tenantName || 'TamarindoReports'
  const logoUrl = branding?.logoUrl

  // Format date range
  const startDate = new Date(dateRange.start).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const endDate = new Date(dateRange.end).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Generate widgets HTML
  const widgetsHTML = widgets.map((widget, index) => generateWidgetHTML(widget, metrics, index)).join('')

  // Generate AI insights HTML
  const insightsHTML = aiInsights
    ? `
    <div class="section">
      <h2>Insights de IA</h2>
      <div class="insights-box">
        ${aiInsights.split('\n').map(line => `<p>${line}</p>`).join('')}
      </div>
    </div>
  `
    : ''

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportName} - ${clientName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1f2937;
      line-height: 1.6;
      background: #fff;
    }

    .container {
      max-width: 100%;
      padding: 0;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%);
      color: white;
      padding: 30px;
      margin-bottom: 30px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .header .client-name {
      font-size: 18px;
      opacity: 0.9;
    }

    .header .date-range {
      text-align: right;
      font-size: 14px;
      opacity: 0.9;
    }

    .header .company-badge {
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      margin-top: 8px;
      display: inline-block;
    }

    .header .logo-section {
      margin-bottom: 15px;
    }

    .header .logo-img {
      max-height: 50px;
      max-width: 180px;
      object-fit: contain;
    }

    .header .logo-fallback {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: rgba(255,255,255,0.25);
      border-radius: 10px;
      font-size: 24px;
      font-weight: 700;
    }

    /* Sections */
    .section {
      margin-bottom: 30px;
      padding: 0 20px;
    }

    .section h2 {
      font-size: 18px;
      color: #374151;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${primaryColor};
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 25px;
    }

    .metric-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }

    .metric-card .label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .metric-card .value {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
    }

    .metric-card .change {
      font-size: 12px;
      margin-top: 8px;
      padding: 2px 8px;
      border-radius: 10px;
      display: inline-block;
    }

    .metric-card .change.positive {
      background: #d1fae5;
      color: #065f46;
    }

    .metric-card .change.negative {
      background: #fee2e2;
      color: #991b1b;
    }

    /* Charts */
    .chart-container {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .chart-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 15px;
    }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      height: 150px;
      padding: 10px 0;
    }

    .bar-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0 2px;
    }

    .bar {
      width: 100%;
      max-width: 40px;
      background: linear-gradient(180deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -15)} 100%);
      border-radius: 4px 4px 0 0;
      min-height: 5px;
    }

    .bar-label {
      font-size: 10px;
      color: #6b7280;
      margin-top: 8px;
    }

    /* Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .data-table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }

    .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    .data-table tr:nth-child(even) {
      background: #f9fafb;
    }

    /* Insights */
    .insights-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #fcd34d;
      border-radius: 12px;
      padding: 20px;
    }

    .insights-box p {
      margin-bottom: 10px;
      color: #78350f;
    }

    .insights-box p:last-child {
      margin-bottom: 0;
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding: 20px;
      text-align: center;
      color: #9ca3af;
      font-size: 11px;
      border-top: 1px solid #e5e7eb;
    }

    /* Page break helper */
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo-section">
            ${logoUrl
    ? `<img src="${logoUrl}" alt="${companyName}" class="logo-img" />`
    : `<div class="logo-fallback">${companyName.charAt(0).toUpperCase()}</div>`
}
          </div>
          <h1>${reportName}</h1>
          <div class="client-name">${clientName}</div>
          <div class="company-badge">${companyName}</div>
        </div>
        <div class="date-range">
          <div><strong>Período</strong></div>
          <div>${startDate}</div>
          <div>al ${endDate}</div>
        </div>
      </div>
    </div>

    <!-- Key Metrics -->
    ${metrics ? generateKeyMetricsHTML(metrics, primaryColor) : ''}

    <!-- Widgets -->
    <div class="section">
      <h2>Detalle de Métricas</h2>
      ${widgetsHTML}
    </div>

    <!-- AI Insights -->
    ${insightsHTML}

    <!-- Footer -->
    <div class="footer">
      Generado por ${companyName} | ${new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Generate key metrics section HTML
 */
function generateKeyMetricsHTML(
  metrics: { totals: Record<string, number>, previousTotals: Record<string, number> },
  primaryColor: string,
): string {
  const keyMetrics = [
    { key: 'impressions', label: 'Impresiones', format: 'number' },
    { key: 'clicks', label: 'Clicks', format: 'number' },
    { key: 'cost', label: 'Inversión', format: 'currency' },
    { key: 'conversions', label: 'Conversiones', format: 'number' },
    { key: 'ctr', label: 'CTR', format: 'percent' },
    { key: 'roas', label: 'ROAS', format: 'roas' },
  ]

  const metricsHTML = keyMetrics.map((m) => {
    const value = metrics.totals[m.key] || 0
    const previousValue = metrics.previousTotals[m.key] || 0
    const change = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0
    const changeClass = change >= 0 ? 'positive' : 'negative'
    const changeSymbol = change >= 0 ? '+' : ''

    return `
      <div class="metric-card">
        <div class="label">${m.label}</div>
        <div class="value">${formatMetricValue(value, m.format)}</div>
        ${previousValue > 0 ? `<div class="change ${changeClass}">${changeSymbol}${change.toFixed(1)}%</div>` : ''}
      </div>
    `
  }).join('')

  return `
    <div class="section">
      <h2>Resumen del Período</h2>
      <div class="metrics-grid">
        ${metricsHTML}
      </div>
    </div>
  `
}

/**
 * Generate individual widget HTML
 */
function generateWidgetHTML(
  widget: any,
  metrics: any,
  index: number,
): string {
  const type = widget.type
  const title = widget.title || `Widget ${index + 1}`

  if (type === 'metric' || type === 'metric-card') {
    const metricKey = widget.metric || widget.config?.metric || 'impressions'
    const value = metrics?.totals?.[metricKey] || 0
    const format = widget.format || widget.config?.format || 'number'

    return `
      <div class="chart-container">
        <div class="chart-title">${title}</div>
        <div style="font-size: 32px; font-weight: 700; text-align: center; padding: 20px;">
          ${formatMetricValue(value, format)}
        </div>
      </div>
    `
  }

  if (type === 'line-chart' || type === 'bar-chart') {
    const data = metrics?.byDate || []
    const metricKey = widget.metrics?.[0] || widget.config?.metrics?.[0] || 'clicks'

    if (data.length === 0) {
      return `
        <div class="chart-container">
          <div class="chart-title">${title}</div>
          <div style="text-align: center; padding: 30px; color: #9ca3af;">Sin datos disponibles</div>
        </div>
      `
    }

    const maxValue = Math.max(...data.map((d: any) => d.metrics[metricKey] || 0), 1)
    const barsHTML = data.slice(-14).map((d: any) => {
      const value = d.metrics[metricKey] || 0
      const height = Math.max((value / maxValue) * 120, 5)
      const date = new Date(d.date)
      const label = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

      return `
        <div class="bar-item">
          <div class="bar" style="height: ${height}px;"></div>
          <div class="bar-label">${label}</div>
        </div>
      `
    }).join('')

    return `
      <div class="chart-container">
        <div class="chart-title">${title}</div>
        <div class="bar-chart">
          ${barsHTML}
        </div>
      </div>
    `
  }

  if (type === 'table') {
    const data = metrics?.byDate || []

    if (data.length === 0) {
      return `
        <div class="chart-container">
          <div class="chart-title">${title}</div>
          <div style="text-align: center; padding: 30px; color: #9ca3af;">Sin datos disponibles</div>
        </div>
      `
    }

    const rowsHTML = data.slice(-10).map((d: any) => {
      const date = new Date(d.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
      return `
        <tr>
          <td>${date}</td>
          <td>${formatMetricValue(d.metrics.impressions || 0, 'number')}</td>
          <td>${formatMetricValue(d.metrics.clicks || 0, 'number')}</td>
          <td>${formatMetricValue(d.metrics.cost || 0, 'currency')}</td>
          <td>${formatMetricValue(d.metrics.conversions || 0, 'number')}</td>
        </tr>
      `
    }).join('')

    return `
      <div class="chart-container">
        <div class="chart-title">${title}</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Impresiones</th>
              <th>Clicks</th>
              <th>Costo</th>
              <th>Conversiones</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
      </div>
    `
  }

  // Default: just show title
  return `
    <div class="chart-container">
      <div class="chart-title">${title}</div>
      <div style="text-align: center; padding: 30px; color: #9ca3af;">${type}</div>
    </div>
  `
}

/**
 * Format metric value based on type
 */
function formatMetricValue(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)

    case 'percent':
      return `${value.toFixed(2)}%`

    case 'roas':
      return `${value.toFixed(2)}x`

    case 'number':
    default:
      return new Intl.NumberFormat('es-MX').format(Math.round(value))
  }
}

/**
 * Adjust color brightness
 */
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt

  return '#' + (
    0x1000000
    + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000
    + (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100
    + (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)
}

/**
 * Generate a mock PDF URL for testing
 */
export function generateMockPDFUrl(reportId: string): string {
  return `/api/pdf/mock/${reportId}`
}
