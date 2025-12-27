/**
 * Root Cause Analysis (RCA) Prompts
 *
 * These prompts help explain WHY a metric changed significantly.
 * The goal is to sound like a senior marketing analyst, not a robot.
 */

/**
 * Main RCA system prompt
 */
export const RCA_SYSTEM_PROMPT = `Eres un analista senior de marketing digital con 10 años de experiencia en campañas de Google Ads, Facebook Ads y plataformas similares.

Tu trabajo es explicar cambios en métricas de forma clara, específica y accionable. Hablas directamente al cliente, que no necesariamente es técnico.

PRINCIPIOS:
- Sé específico, nunca genérico. Menciona números exactos cuando los tengas.
- El cliente debe sentir que un experto revisó sus datos personalmente.
- Si no hay causa clara, sé honesto: "Los datos sugieren que..." o "Una posible explicación es..."
- Siempre incluye al menos una acción concreta que el cliente pueda tomar.
- Escribe en español, tono profesional pero cercano.

FORMATO DE RESPUESTA:
Responde SOLO con JSON válido, sin markdown ni explicaciones adicionales.`

/**
 * Build the user prompt for RCA analysis
 */
export function buildRCAPrompt(data: {
  metricName: string
  metricLabel: string
  currentValue: number
  previousValue: number
  changePercent: number
  direction: 'up' | 'down'
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
    changePercent: number
  }>
}): string {
  const { metricName, metricLabel, currentValue, previousValue, changePercent, direction, context, correlatedMetrics } = data

  let prompt = `## Contexto de la Campaña
- Cliente: ${context.clientName}
${context.industry ? `- Industria: ${context.industry}` : ''}
- Plataforma: ${context.platform}
- Período: ${context.dateRange.start} a ${context.dateRange.end}

## Métrica Analizada
- Nombre: ${metricLabel} (${metricName})
- Valor actual: ${formatMetricValue(metricName, currentValue)}
- Valor anterior: ${formatMetricValue(metricName, previousValue)}
- Cambio: ${direction === 'up' ? '+' : ''}${changePercent.toFixed(1)}%

`

  if (correlatedMetrics && correlatedMetrics.length > 0) {
    prompt += `## Otras Métricas del Período (para contexto)
${correlatedMetrics.map(m => `- ${m.label}: ${formatMetricValue(m.name, m.currentValue)} (${m.changePercent >= 0 ? '+' : ''}${m.changePercent.toFixed(1)}%)`).join('\n')}

`
  }

  prompt += `## Tu Tarea
1. Identifica las 2-3 causas más probables de este cambio
2. Para cada causa, sugiere una acción concreta
3. Escribe un resumen de 2-3 frases como si hablaras directamente con el cliente

## Formato de Respuesta (JSON)
{
  "causes": [
    {
      "factor": "nombre del factor",
      "explanation": "explicación breve y específica",
      "confidence": 0.85,
      "action": "acción recomendada"
    }
  ],
  "summary": "Resumen en lenguaje natural, tono profesional pero cercano. Máximo 3 frases."
}

IMPORTANTE:
- Responde SOLO con el JSON, sin bloques de código markdown
- Las explicaciones deben ser específicas, no genéricas
- Menciona números del contexto cuando sea relevante
- El summary debe sonar como un analista experto hablando`

  return prompt
}

/**
 * Format metric value based on metric type
 */
function formatMetricValue(metricName: string, value: number): string {
  const currencyMetrics = ['cost', 'spend', 'cpc', 'cpm', 'cpa', 'cost_per_conversion', 'average_cpc']
  const percentMetrics = ['ctr', 'conversion_rate', 'bounce_rate', 'engagement_rate']
  const roasMetrics = ['roas', 'return_on_ad_spend']

  const name = metricName.toLowerCase()

  if (currencyMetrics.some(m => name.includes(m))) {
    return `$${value.toFixed(2)}`
  }

  if (percentMetrics.some(m => name.includes(m))) {
    return `${value.toFixed(2)}%`
  }

  if (roasMetrics.some(m => name.includes(m))) {
    return `${value.toFixed(2)}x`
  }

  // Large numbers with formatting
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }

  return value.toFixed(0)
}

/**
 * Common causes by metric type (for prompt hints)
 */
export const METRIC_COMMON_CAUSES: Record<string, string[]> = {
  cpc: [
    'Aumento de competencia en el mercado',
    'Quality Score más bajo',
    'Cambios en la segmentación',
    'Estacionalidad',
    'Cambios en los creativos',
  ],
  ctr: [
    'Fatiga de creativos (anuncios con >30 días)',
    'Cambios en la competencia',
    'Segmentación más/menos precisa',
    'Cambios de texto o imagen en anuncios',
    'Posición promedio del anuncio',
  ],
  cpa: [
    'Cambios en la landing page',
    'Calidad del tráfico',
    'Velocidad de carga del sitio',
    'Formularios o checkout complicados',
    'Competencia de precios',
  ],
  roas: [
    'Cambios en el valor promedio de pedido',
    'Estacionalidad de ventas',
    'Promociones o descuentos activos',
    'Mix de productos publicitados',
    'Cambios en el funnel de conversión',
  ],
  impressions: [
    'Cambios en el presupuesto',
    'Ajustes de pujas',
    'Cambios en la segmentación',
    'Competencia por inventario',
    'Problemas de aprobación de anuncios',
  ],
  conversions: [
    'Cambios en la landing page',
    'Problemas técnicos con tracking',
    'Estacionalidad',
    'Calidad del tráfico',
    'Cambios en la oferta o precios',
  ],
}
