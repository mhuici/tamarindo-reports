/**
 * System prompt for marketing report insights
 */
export const INSIGHTS_SYSTEM_PROMPT = `You are a senior digital marketing analyst specializing in paid advertising campaigns.
Your role is to analyze marketing metrics and provide actionable insights in Spanish.

Guidelines:
- Be concise and actionable
- Focus on what's working and what needs improvement
- Suggest specific optimizations
- Use simple language that non-technical clients can understand
- Include numbers and percentages when relevant
- Structure your response with clear sections

Response format:
1. Resumen Ejecutivo (2-3 sentences overview)
2. Puntos Destacados (3-4 bullet points of wins)
3. Áreas de Mejora (2-3 bullet points with specific recommendations)
4. Próximos Pasos (2-3 actionable items for next period)`

/**
 * Build user prompt with metrics data
 */
export function buildInsightsPrompt(data: {
  clientName: string
  reportType: string
  dateRange: { start: string; end: string }
  metrics?: Record<string, any>
  previousMetrics?: Record<string, any>
}): string {
  const { clientName, reportType, dateRange, metrics, previousMetrics } = data

  let prompt = `Analiza el rendimiento de las campañas de marketing digital para el cliente "${clientName}".

Tipo de reporte: ${reportType}
Período: ${dateRange.start} a ${dateRange.end}

`

  if (metrics && Object.keys(metrics).length > 0) {
    prompt += `Métricas del período actual:
${JSON.stringify(metrics, null, 2)}

`
  }
  else {
    prompt += `Nota: No hay datos de métricas disponibles aún. Proporciona recomendaciones generales basadas en mejores prácticas para campañas de ${reportType.toLowerCase()}.

`
  }

  if (previousMetrics && Object.keys(previousMetrics).length > 0) {
    prompt += `Métricas del período anterior (para comparación):
${JSON.stringify(previousMetrics, null, 2)}

`
  }

  prompt += `Genera un análisis completo siguiendo el formato especificado.`

  return prompt
}

/**
 * System prompt for widget recommendations
 */
export const WIDGET_RECOMMENDATIONS_PROMPT = `You are a data visualization expert for marketing dashboards.
Given the type of report and available data, recommend the best widgets to display.

Response format (JSON):
{
  "widgets": [
    {
      "type": "metric|line-chart|bar-chart|pie-chart|table",
      "title": "Widget title",
      "description": "Why this widget is useful",
      "priority": 1-5
    }
  ]
}`

/**
 * Build prompt for widget recommendations
 */
export function buildWidgetRecommendationsPrompt(data: {
  reportType: string
  dataSources: string[]
  existingWidgets: string[]
}): string {
  return `Report type: ${data.reportType}
Connected data sources: ${data.dataSources.join(', ') || 'None'}
Existing widgets: ${data.existingWidgets.join(', ') || 'None'}

Recommend 4-6 widgets that would be most valuable for this report.`
}
