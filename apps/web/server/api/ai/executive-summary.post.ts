import { generateNarrative, type MetricData, type NarrativeContext } from '~/server/utils/ai/narrative-engine'
import { analyzeMetricChange, type RCAResult } from '~/server/utils/ai/rca-agent'
import { forecast } from '~/utils/forecasting/holt-winters'

type NarrativeTone = 'professional' | 'casual' | 'technical' | 'bold'
type NarrativeLanguage = 'es' | 'en' | 'pt'

interface ExecutiveSummaryRequest {
  clientId?: string
  clientName: string
  metrics: MetricData[]
  dateRange: {
    start: string
    end: string
  }
  historicalData?: Array<{ date: string; spend: number }>
  tone?: NarrativeTone
  language?: NarrativeLanguage
  includeRCA?: boolean
  includeForecast?: boolean
}

interface ExecutiveSummaryResponse {
  success: boolean
  summary: {
    markdown: string
    sections: {
      header: string
      metrics: string
      analysis: string
      recommendation: string
      forecast: string
      footer: string
    }
    rcaResult?: RCAResult
    isFallback: boolean
  }
}

export default defineEventHandler(async (event): Promise<ExecutiveSummaryResponse> => {
  const body = await readBody<ExecutiveSummaryRequest>(event)

  // Validate required fields
  if (!body.clientName) {
    throw createError({
      statusCode: 400,
      message: 'Missing required field: clientName',
    })
  }

  if (!body.metrics || body.metrics.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Missing required field: metrics (must have at least one metric)',
    })
  }

  if (!body.dateRange?.start || !body.dateRange?.end) {
    throw createError({
      statusCode: 400,
      message: 'Missing required field: dateRange with start and end',
    })
  }

  const {
    clientName,
    metrics,
    dateRange,
    historicalData,
    tone = 'professional',
    language = 'es',
    includeRCA = true,
    includeForecast = true,
  } = body

  // Calculate change percentages if not provided
  const metricsWithChange = metrics.map((m) => {
    if (m.changePercent === undefined && m.previousValue !== undefined && m.previousValue !== 0) {
      return {
        ...m,
        changePercent: ((m.value - m.previousValue) / m.previousValue) * 100,
      }
    }
    return m
  })

  // Find metric with largest negative change for RCA
  let rcaResult: RCAResult | undefined
  if (includeRCA) {
    const negativeMetrics = metricsWithChange
      .filter(m => m.changePercent !== undefined && m.changePercent < -5)
      .sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))

    if (negativeMetrics.length > 0) {
      const worstMetric = negativeMetrics[0]!
      try {
        rcaResult = await analyzeMetricChange({
          metricName: worstMetric.name,
          metricLabel: worstMetric.label,
          currentValue: worstMetric.value,
          previousValue: worstMetric.previousValue || 0,
          context: {
            clientName,
            platform: 'mixed',
            dateRange,
          },
        })
      }
      catch (e) {
        console.error('RCA failed in executive summary:', e)
      }
    }
  }

  // Generate narrative summary
  const narrativeContext: NarrativeContext = {
    clientName,
    platform: 'mixed',
    period: `${dateRange.start} - ${dateRange.end}`,
  }

  const narrativeResult = await generateNarrative({
    type: 'executive-summary',
    metrics: metricsWithChange,
    context: narrativeContext,
    tone,
    language,
  })

  // Generate simple forecast if historical data provided
  let forecastText = ''
  if (includeForecast && historicalData && historicalData.length >= 7) {
    try {
      const values = historicalData.map(d => d.spend)
      const dates = historicalData.map(d => d.date)
      const forecastResult = forecast(values, dates, { horizon: 7 })

      if (forecastResult.predictions.length > 0) {
        const nextWeekTotal = forecastResult.predictions.reduce((sum, p) => sum + p.value, 0)
        const currentWeekTotal = values.slice(-7).reduce((sum, v) => sum + v, 0)
        const changePercent = currentWeekTotal > 0
          ? ((nextWeekTotal - currentWeekTotal) / currentWeekTotal) * 100
          : 0

        forecastText = language === 'es'
          ? `Proyectamos un spend de $${Math.round(nextWeekTotal).toLocaleString()} para la próxima semana (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(0)}% vs semana actual).`
          : `We project a spend of $${Math.round(nextWeekTotal).toLocaleString()} for next week (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(0)}% vs current week).`
      }
    }
    catch (e) {
      console.error('Forecast failed in executive summary:', e)
    }
  }

  // Build markdown document
  const sections = buildMarkdownSections({
    clientName,
    dateRange,
    metrics: metricsWithChange,
    narrative: narrativeResult.narrative,
    rcaResult,
    forecastText,
    language,
  })

  const markdown = [
    sections.header,
    sections.metrics,
    sections.analysis,
    rcaResult ? sections.recommendation : '',
    forecastText ? sections.forecast : '',
    sections.footer,
  ].filter(Boolean).join('\n\n')

  return {
    success: true,
    summary: {
      markdown,
      sections,
      rcaResult,
      isFallback: narrativeResult.isFallback,
    },
  }
})

interface MarkdownSectionsInput {
  clientName: string
  dateRange: { start: string; end: string }
  metrics: MetricData[]
  narrative: string
  rcaResult?: RCAResult
  forecastText: string
  language: NarrativeLanguage
}

function buildMarkdownSections(input: MarkdownSectionsInput) {
  const { clientName, dateRange, metrics, narrative, rcaResult, forecastText, language } = input
  const isSpanish = language === 'es'

  // Header
  const header = `# ${isSpanish ? 'Resumen Ejecutivo' : 'Executive Summary'}: ${clientName}
**${isSpanish ? 'Periodo' : 'Period'}:** ${formatDateRange(dateRange.start, dateRange.end, language)}`

  // Metrics table
  const metricsHeader = isSpanish
    ? '| Metrica | Actual | Anterior | Cambio |'
    : '| Metric | Current | Previous | Change |'
  const metricsDivider = '|---------|--------|----------|--------|'
  const metricsRows = metrics.map((m) => {
    const current = formatMetricValue(m.value, m.format)
    const previous = m.previousValue !== undefined ? formatMetricValue(m.previousValue, m.format) : '-'
    const change = m.changePercent !== undefined
      ? `${m.changePercent >= 0 ? '+' : ''}${m.changePercent.toFixed(1)}%`
      : '-'
    return `| ${m.label} | ${current} | ${previous} | ${change} |`
  }).join('\n')

  const metricsSection = `## ${isSpanish ? 'Metricas Clave' : 'Key Metrics'}
${metricsHeader}
${metricsDivider}
${metricsRows}`

  // Analysis section
  const analysisSection = `## ${isSpanish ? 'Analisis' : 'Analysis'}
${narrative}`

  // Recommendation section (from RCA)
  let recommendationSection = ''
  if (rcaResult && rcaResult.causes.length > 0) {
    const topCause = rcaResult.causes[0]!
    const direction = rcaResult.change.direction === 'up'
      ? (isSpanish ? 'subio' : 'increased')
      : (isSpanish ? 'bajo' : 'decreased')

    recommendationSection = `## ${isSpanish ? 'Recomendacion' : 'Recommendation'}
${rcaResult.metricLabel} ${direction} ${Math.abs(rcaResult.change.percentage).toFixed(1)}%.

**${isSpanish ? 'Causa principal' : 'Main cause'}:** ${topCause.factor}
${topCause.explanation}

${topCause.action ? `**${isSpanish ? 'Accion sugerida' : 'Suggested action'}:** ${topCause.action}` : ''}`
  }

  // Forecast section
  const forecastSection = forecastText
    ? `## ${isSpanish ? 'Proyeccion' : 'Forecast'}
${forecastText}`
    : ''

  // Footer
  const now = new Date()
  const footer = `---
*${isSpanish ? 'Generado por' : 'Generated by'} TamarindoReports - ${now.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}*`

  return {
    header,
    metrics: metricsSection,
    analysis: analysisSection,
    recommendation: recommendationSection,
    forecast: forecastSection,
    footer,
  }
}

function formatDateRange(start: string, end: string, language: NarrativeLanguage): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const locale = language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US'

  return `${startDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function formatMetricValue(value: number, format?: string): string {
  if (format === 'currency') {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }
  if (format === 'percent') {
    return `${value.toFixed(1)}%`
  }
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toFixed(value % 1 === 0 ? 0 : 1)
}
