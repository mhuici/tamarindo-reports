import { getClaudeClient, isClaudeConfigured, CLAUDE_MODEL } from './claude'
import {
  NARRATIVE_SYSTEM_PROMPT,
  getNarrativePrompt,
  determineAlertSeverity,
  type NarrativeType,
  type NarrativeTone,
  type NarrativeLanguage,
  type AlertSeverity,
} from './prompts/narrative'

/**
 * Metric data structure
 */
export interface MetricData {
  name: string
  label: string
  value: number
  previousValue?: number
  changePercent?: number
  format?: 'number' | 'currency' | 'percent'
}

/**
 * Goal/objective structure
 */
export interface Goal {
  metric: string
  target: number
  achieved?: boolean
}

/**
 * Context for narrative generation
 */
export interface NarrativeContext {
  clientName: string
  industry?: string
  platform?: string
  period?: string
  goals?: Goal[]
}

/**
 * Executive Summary request
 */
export interface ExecutiveSummaryRequest {
  type: 'executive-summary'
  metrics: MetricData[]
  previousMetrics?: MetricData[]
  context: NarrativeContext
  tone?: NarrativeTone
  language?: NarrativeLanguage
}

/**
 * Widget Insight request
 */
export interface WidgetInsightRequest {
  type: 'widget-insight'
  metric: MetricData
  correlatedMetrics?: MetricData[]
  context: NarrativeContext
  tone?: NarrativeTone
  language?: NarrativeLanguage
}

/**
 * Recommendation request
 */
export interface RecommendationRequest {
  type: 'recommendation'
  metrics: MetricData[]
  issues: string[]
  context: NarrativeContext
  tone?: NarrativeTone
  language?: NarrativeLanguage
}

/**
 * Alert request
 */
export interface AlertRequest {
  type: 'alert'
  metric: MetricData
  expectedValue?: number
  severity?: AlertSeverity
  isCritical?: boolean
  context: NarrativeContext
  tone?: NarrativeTone
  language?: NarrativeLanguage
}

export type NarrativeRequest =
  | ExecutiveSummaryRequest
  | WidgetInsightRequest
  | RecommendationRequest
  | AlertRequest

/**
 * Narrative result
 */
export interface NarrativeResult {
  type: NarrativeType
  narrative: string
  tokensUsed?: number
  cached?: boolean
  /** True if this result was generated from mock data (no AI API call) */
  isFallback: boolean
}

/**
 * Format metric value for display
 */
function formatMetricValue(value: number, format?: string): string {
  if (format === 'currency') {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toFixed(2)}`
  }
  if (format === 'percent') {
    return `${value.toFixed(1)}%`
  }
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toFixed(value % 1 === 0 ? 0 : 2)
}

/**
 * Format metrics array for prompt
 */
function formatMetricsForPrompt(metrics: MetricData[]): string {
  return metrics.map((m) => {
    const value = formatMetricValue(m.value, m.format)
    const prev = m.previousValue !== undefined ? formatMetricValue(m.previousValue, m.format) : 'N/A'
    const change = m.changePercent !== undefined ? `${m.changePercent >= 0 ? '+' : ''}${m.changePercent.toFixed(1)}%` : 'N/A'
    return `- ${m.label}: ${value} (anterior: ${prev}, cambio: ${change})`
  }).join('\n')
}

/**
 * Format goals for prompt
 */
function formatGoalsForPrompt(goals?: Goal[]): string {
  if (!goals || goals.length === 0) return 'No hay objetivos definidos'
  return goals.map((g) => {
    const status = g.achieved !== undefined ? (g.achieved ? '✓ Cumplido' : '✗ No cumplido') : 'Pendiente'
    return `- ${g.metric}: objetivo ${g.target} (${status})`
  }).join('\n')
}

/**
 * Build user prompt from request
 */
function buildUserPrompt(request: NarrativeRequest): string {
  const template = getNarrativePrompt(request.type)
  let prompt = template

  // Common replacements
  prompt = prompt.replace('{{clientName}}', request.context.clientName || 'Cliente')
  prompt = prompt.replace('{{industry}}', request.context.industry || 'General')
  prompt = prompt.replace('{{platform}}', request.context.platform || 'Mixed')
  prompt = prompt.replace('{{tone}}', request.tone || 'professional')
  prompt = prompt.replace('{{language}}', request.language || 'es')

  // Type-specific replacements
  switch (request.type) {
    case 'executive-summary': {
      const req = request as ExecutiveSummaryRequest
      prompt = prompt.replace('{{goals}}', formatGoalsForPrompt(req.context.goals))
      prompt = prompt.replace('{{metrics}}', formatMetricsForPrompt(req.metrics))
      prompt = prompt.replace('{{previousMetrics}}', req.previousMetrics ? formatMetricsForPrompt(req.previousMetrics) : 'No hay datos del período anterior')
      break
    }

    case 'widget-insight': {
      const req = request as WidgetInsightRequest
      const m = req.metric
      const changePercent = m.changePercent ?? (m.previousValue ? ((m.value - m.previousValue) / m.previousValue) * 100 : 0)
      prompt = prompt.replace('{{metricName}}', m.label || m.name)
      prompt = prompt.replace('{{currentValue}}', formatMetricValue(m.value, m.format))
      prompt = prompt.replace('{{previousValue}}', m.previousValue !== undefined ? formatMetricValue(m.previousValue, m.format) : 'N/A')
      prompt = prompt.replace('{{changePercent}}', changePercent.toFixed(1))
      prompt = prompt.replace('{{direction}}', changePercent >= 0 ? 'up' : 'down')
      prompt = prompt.replace('{{correlatedMetrics}}', req.correlatedMetrics ? formatMetricsForPrompt(req.correlatedMetrics) : 'No hay métricas correlacionadas')
      break
    }

    case 'recommendation': {
      const req = request as RecommendationRequest
      prompt = prompt.replace('{{metrics}}', formatMetricsForPrompt(req.metrics))
      prompt = prompt.replace('{{issues}}', req.issues.length > 0 ? req.issues.map(i => `- ${i}`).join('\n') : 'No se detectaron problemas específicos')
      break
    }

    case 'alert': {
      const req = request as AlertRequest
      const m = req.metric
      const changePercent = m.changePercent ?? (m.previousValue ? ((m.value - m.previousValue) / m.previousValue) * 100 : 0)
      const severity = req.severity || determineAlertSeverity(changePercent, req.isCritical)
      prompt = prompt.replace('{{metricName}}', m.label || m.name)
      prompt = prompt.replace('{{currentValue}}', formatMetricValue(m.value, m.format))
      prompt = prompt.replace('{{expectedValue}}', req.expectedValue !== undefined ? formatMetricValue(req.expectedValue, m.format) : (m.previousValue !== undefined ? formatMetricValue(m.previousValue, m.format) : 'N/A'))
      prompt = prompt.replace('{{changePercent}}', changePercent.toFixed(1))
      prompt = prompt.replace('{{severity}}', severity)
      prompt = prompt.replace('{{period}}', req.context.period || 'últimos 7 días')
      break
    }
  }

  return prompt
}

/**
 * Generate narrative using Claude
 */
export async function generateNarrative(request: NarrativeRequest): Promise<NarrativeResult> {
  // Check if Claude is configured
  if (!isClaudeConfigured()) {
    return {
      type: request.type,
      narrative: generateMockNarrative(request),
      cached: false,
      isFallback: true,
    }
  }

  try {
    const client = getClaudeClient()
    const userPrompt = buildUserPrompt(request)

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      temperature: 0.7,
      system: NARRATIVE_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    })

    // Extract text content
    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Clean up response (remove any accidental markdown or quotes)
    let narrative = textContent.text.trim()
    narrative = narrative.replace(/^["']|["']$/g, '') // Remove surrounding quotes
    narrative = narrative.replace(/^#+\s*/gm, '') // Remove markdown headers

    return {
      type: request.type,
      narrative,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      cached: false,
      isFallback: false,
    }
  }
  catch (error: any) {
    console.error('Narrative generation failed:', error)
    // Fallback to mock
    return {
      type: request.type,
      narrative: generateMockNarrative(request),
      cached: false,
      isFallback: true,
    }
  }
}

/**
 * Generate mock narrative for testing without API key
 */
function generateMockNarrative(request: NarrativeRequest): string {
  const tone = request.tone || 'professional'

  switch (request.type) {
    case 'executive-summary': {
      const req = request as ExecutiveSummaryRequest
      const topMetric = req.metrics[0]
      const templates: Record<NarrativeTone, string> = {
        professional: `La campaña de ${req.context.clientName} muestra resultados positivos este período. ${topMetric?.label || 'Las métricas principales'} se mantienen dentro de los objetivos establecidos, con oportunidades de optimización identificadas en segmentación de audiencias.`,
        casual: `¡Buen período para ${req.context.clientName}! Los números están bien y hay espacio para crecer. El equipo identificó algunas oportunidades que podemos aprovechar el próximo mes.`,
        technical: `Performance de ${req.context.clientName}: métricas core dentro de benchmarks. Se detecta headroom en optimización de audiencias lookalike y refresh de creativos para mejorar relevance score.`,
        bold: `${req.context.clientName} entregó este mes. Los objetivos se cumplieron y hay combustible para escalar. Es momento de ser agresivos.`,
      }
      return templates[tone]
    }

    case 'widget-insight': {
      const req = request as WidgetInsightRequest
      const direction = (req.metric.changePercent || 0) >= 0 ? 'subió' : 'bajó'
      const absChange = Math.abs(req.metric.changePercent || 0).toFixed(0)
      const templates: Record<NarrativeTone, string> = {
        professional: `${req.metric.label} ${direction} un ${absChange}% respecto al período anterior. Esto refleja cambios en las condiciones del mercado y la competencia.`,
        casual: `${req.metric.label} ${direction} un ${absChange}%. ${direction === 'subió' ? 'Buena señal' : 'Hay que estar atentos'}, lo monitoreamos de cerca.`,
        technical: `${req.metric.label} con delta de ${direction === 'subió' ? '+' : '-'}${absChange}%. Correlación detectada con cambios en auction dynamics y competitive pressure.`,
        bold: `${req.metric.label} ${direction === 'subió' ? 'voló' : 'cayó'} un ${absChange}%. ${direction === 'subió' ? 'Aprovechemos el momento.' : 'Acción inmediata requerida.'}`,
      }
      return templates[tone]
    }

    case 'recommendation': {
      const templates: Record<NarrativeTone, string> = {
        professional: `Recomendamos optimizar la segmentación de audiencias y realizar un refresh de creativos para maximizar el rendimiento en el próximo período.`,
        casual: `Nuestra sugerencia: renueva los anuncios y ajusta a quién le mostramos la campaña. Con eso deberías ver mejores resultados.`,
        technical: `Action item: implementar audience refresh con exclusión de converters >30d y A/B test de creativos con variantes de copy focalizadas en pain points.`,
        bold: `Una cosa: rota los creativos ya. Están quemados y están costando dinero. Hazlo esta semana.`,
      }
      return templates[tone]
    }

    case 'alert': {
      const req = request as AlertRequest
      const severity = req.severity || 'medium'
      const templates: Record<AlertSeverity, string> = {
        low: `${req.metric.label} muestra una variación menor. Continuamos monitoreando.`,
        medium: `Atención: ${req.metric.label} requiere revisión. Recomendamos analizar la causa esta semana.`,
        high: `Alerta: ${req.metric.label} muestra cambios significativos. Se requiere acción inmediata para evitar impacto en resultados.`,
        critical: `URGENTE: ${req.metric.label} en estado crítico. Intervención inmediata requerida.`,
      }
      return templates[severity]
    }

    default:
      return 'Narrativa no disponible.'
  }
}

/**
 * Generate all narratives for a dashboard/report
 */
export async function generateDashboardNarratives(
  metrics: MetricData[],
  context: NarrativeContext,
  options: { tone?: NarrativeTone; language?: NarrativeLanguage } = {},
): Promise<{
  executiveSummary: NarrativeResult
  recommendations: NarrativeResult
  alerts: NarrativeResult[]
}> {
  const { tone = 'professional', language = 'es' } = options

  // Generate executive summary
  const executiveSummary = await generateNarrative({
    type: 'executive-summary',
    metrics,
    context,
    tone,
    language,
  })

  // Detect issues for recommendations
  const issues: string[] = []
  metrics.forEach((m) => {
    if (m.changePercent && m.changePercent < -10) {
      issues.push(`${m.label} bajó ${Math.abs(m.changePercent).toFixed(0)}%`)
    }
  })

  // Generate recommendations
  const recommendations = await generateNarrative({
    type: 'recommendation',
    metrics,
    issues,
    context,
    tone,
    language,
  })

  // Generate alerts for significant changes
  const alerts: NarrativeResult[] = []
  for (const metric of metrics) {
    if (metric.changePercent && Math.abs(metric.changePercent) >= 20) {
      const alert = await generateNarrative({
        type: 'alert',
        metric,
        context,
        tone,
        language,
      })
      alerts.push(alert)
    }
  }

  return {
    executiveSummary,
    recommendations,
    alerts,
  }
}
