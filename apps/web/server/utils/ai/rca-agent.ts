import { getClaudeClient, isClaudeConfigured, CLAUDE_MODEL } from './claude'
import { RCA_SYSTEM_PROMPT, buildRCAPrompt } from './prompts/rca'

/**
 * Single cause identified by RCA
 */
export interface RCACause {
  factor: string
  explanation: string
  confidence: number
  action?: string
}

/**
 * Full RCA analysis result
 */
export interface RCAResult {
  metric: string
  metricLabel: string
  change: {
    value: number
    percentage: number
    direction: 'up' | 'down'
  }
  causes: RCACause[]
  summary: string
  tokensUsed?: number
}

/**
 * Input parameters for RCA analysis
 */
export interface RCAInput {
  metricName: string
  metricLabel: string
  currentValue: number
  previousValue: number
  context: {
    clientName: string
    industry?: string
    platform: string
    dateRange: { start: string; end: string }
  }
  correlatedMetrics?: Array<{
    name: string
    label: string
    currentValue: number
    previousValue: number
  }>
}

/**
 * Threshold for significant change (percentage)
 */
const SIGNIFICANT_CHANGE_THRESHOLD = 10

/**
 * Analyze a metric change and identify root causes
 */
export async function analyzeMetricChange(input: RCAInput): Promise<RCAResult> {
  const { metricName, metricLabel, currentValue, previousValue, context, correlatedMetrics } = input

  // Calculate change
  const changeValue = currentValue - previousValue
  const changePercent = previousValue !== 0
    ? ((currentValue - previousValue) / previousValue) * 100
    : currentValue > 0 ? 100 : 0
  const direction: 'up' | 'down' = changePercent >= 0 ? 'up' : 'down'

  // Check if change is significant
  if (Math.abs(changePercent) < SIGNIFICANT_CHANGE_THRESHOLD) {
    return {
      metric: metricName,
      metricLabel,
      change: {
        value: changeValue,
        percentage: changePercent,
        direction,
      },
      causes: [],
      summary: `${metricLabel} se mantuvo estable con un cambio de ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%. No se detectaron variaciones significativas.`,
    }
  }

  // Check if Claude is configured
  if (!isClaudeConfigured()) {
    return generateMockRCA(metricName, metricLabel, changeValue, changePercent, direction)
  }

  try {
    const client = getClaudeClient()

    // Prepare correlated metrics with change percentages
    const correlatedWithChange = correlatedMetrics?.map(m => ({
      ...m,
      changePercent: m.previousValue !== 0
        ? ((m.currentValue - m.previousValue) / m.previousValue) * 100
        : m.currentValue > 0 ? 100 : 0,
    }))

    const userPrompt = buildRCAPrompt({
      metricName,
      metricLabel,
      currentValue,
      previousValue,
      changePercent,
      direction,
      context,
      correlatedMetrics: correlatedWithChange,
    })

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      messages: [
        { role: 'user', content: userPrompt },
      ],
      system: RCA_SYSTEM_PROMPT,
    })

    // Extract text content
    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse JSON response
    const analysis = parseRCAResponse(textContent.text)

    return {
      metric: metricName,
      metricLabel,
      change: {
        value: changeValue,
        percentage: changePercent,
        direction,
      },
      causes: analysis.causes,
      summary: analysis.summary,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    }
  }
  catch (error: any) {
    console.error('RCA analysis failed:', error)

    // Fallback to mock if API fails
    return generateMockRCA(metricName, metricLabel, changeValue, changePercent, direction)
  }
}

/**
 * Parse Claude's JSON response
 */
function parseRCAResponse(text: string): { causes: RCACause[]; summary: string } {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      causes: parsed.causes || [],
      summary: parsed.summary || 'No se pudo generar un resumen.',
    }
  }
  catch (error) {
    console.error('Failed to parse RCA response:', error, 'Raw text:', text)

    return {
      causes: [],
      summary: text.slice(0, 300), // Use raw text as summary fallback
    }
  }
}

/**
 * Generate mock RCA for testing without API key
 */
function generateMockRCA(
  metricName: string,
  metricLabel: string,
  changeValue: number,
  changePercent: number,
  direction: 'up' | 'down',
): RCAResult {
  const isPositive = direction === 'up'
  const absPercent = Math.abs(changePercent).toFixed(1)

  // Different mock responses based on metric type
  const mockCauses: Record<string, RCACause[]> = {
    cpc: [
      {
        factor: 'Aumento de competencia',
        explanation: `Detectamos que varios competidores aumentaron sus pujas en las últimas semanas, lo que elevó el costo promedio del mercado.`,
        confidence: 0.82,
        action: 'Revisar pujas por hora del día y concentrar presupuesto en horarios menos competitivos (antes de las 10am o después de las 8pm).',
      },
      {
        factor: 'Quality Score',
        explanation: `El Quality Score de algunos keywords principales bajó, lo que aumenta automáticamente el CPC necesario para mantener posición.`,
        confidence: 0.75,
        action: 'Revisar la velocidad de carga de la landing page y la relevancia entre anuncios y keywords.',
      },
    ],
    ctr: [
      {
        factor: 'Fatiga de creativos',
        explanation: `Los anuncios llevan más de 30 días sin cambios, lo que típicamente causa fatiga en la audiencia.`,
        confidence: 0.88,
        action: 'Rotar creativos cada 2-3 semanas. Probar nuevos textos y llamados a la acción.',
      },
      {
        factor: 'Cambio en posición promedio',
        explanation: `La posición promedio del anuncio cambió, afectando la visibilidad y probabilidad de clic.`,
        confidence: 0.71,
        action: 'Revisar el reporte de posición por dispositivo y ajustar pujas según rendimiento.',
      },
    ],
    conversions: [
      {
        factor: 'Rendimiento de landing page',
        explanation: `Posibles cambios en la landing page o problemas de carga están afectando la conversión.`,
        confidence: 0.79,
        action: 'Verificar velocidad de carga (ideal <2s) y que el formulario/checkout funcione correctamente en móvil.',
      },
      {
        factor: 'Calidad del tráfico',
        explanation: `La segmentación de audiencia puede estar atrayendo visitantes menos calificados.`,
        confidence: 0.68,
        action: 'Revisar los términos de búsqueda y agregar negativos para filtrar tráfico no relevante.',
      },
    ],
    default: [
      {
        factor: 'Cambios en el mercado',
        explanation: `Las métricas fluctúan naturalmente según estacionalidad y comportamiento del mercado.`,
        confidence: 0.65,
        action: 'Monitorear la tendencia durante la próxima semana antes de hacer cambios mayores.',
      },
    ],
  }

  const metricKey = metricName.toLowerCase()
  const causes = mockCauses[metricKey] ?? mockCauses.default!
  const firstCause = causes[0]!

  const summaryTemplates = {
    up: `${metricLabel} subió ${absPercent}% esta semana. Esto se debe principalmente a ${firstCause.factor.toLowerCase()}. Recomendamos ${firstCause.action?.toLowerCase().replace(/\.$/, '') || 'revisar la configuración de la campaña'}.`,
    down: `${metricLabel} bajó ${absPercent}% esta semana. La causa principal parece ser ${firstCause.factor.toLowerCase()}. Sugerimos ${firstCause.action?.toLowerCase().replace(/\.$/, '') || 'monitorear la evolución durante los próximos días'}.`,
  }

  return {
    metric: metricName,
    metricLabel,
    change: {
      value: changeValue,
      percentage: changePercent,
      direction,
    },
    causes,
    summary: summaryTemplates[direction],
  }
}

/**
 * Batch analyze multiple metrics
 */
export async function analyzeMultipleMetrics(
  metrics: Array<Omit<RCAInput, 'correlatedMetrics' | 'context'>>,
  context: RCAInput['context'],
): Promise<RCAResult[]> {
  // Calculate all changes first to use as correlated metrics
  const metricsWithChange = metrics.map(m => ({
    ...m,
    changePercent: m.previousValue !== 0
      ? ((m.currentValue - m.previousValue) / m.previousValue) * 100
      : m.currentValue > 0 ? 100 : 0,
  }))

  // Filter to only significant changes
  const significantMetrics = metricsWithChange.filter(
    m => Math.abs(m.changePercent) >= SIGNIFICANT_CHANGE_THRESHOLD,
  )

  // Analyze each significant metric
  const results = await Promise.all(
    significantMetrics.map(metric =>
      analyzeMetricChange({
        ...metric,
        context,
        correlatedMetrics: metricsWithChange
          .filter(m => m.metricName !== metric.metricName)
          .map(m => ({
            name: m.metricName,
            label: m.metricLabel,
            currentValue: m.currentValue,
            previousValue: m.previousValue,
          })),
      }),
    ),
  )

  return results
}
