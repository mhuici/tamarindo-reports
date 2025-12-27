import { getOpenAIClient, isOpenAIConfigured } from './openai'
import { INSIGHTS_SYSTEM_PROMPT, buildInsightsPrompt } from './prompts'

interface GenerateInsightsParams {
  clientName: string
  reportType: string
  dateRange: { start: string; end: string }
  metrics?: Record<string, any>
  previousMetrics?: Record<string, any>
}

interface InsightsResult {
  success: boolean
  insights?: string
  error?: string
  tokensUsed?: number
}

/**
 * Generate AI insights for a report
 */
export async function generateInsights(params: GenerateInsightsParams): Promise<InsightsResult> {
  if (!isOpenAIConfigured()) {
    return {
      success: false,
      error: 'OpenAI API key not configured',
    }
  }

  try {
    const client = getOpenAIClient()

    const userPrompt = buildInsightsPrompt(params)

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: INSIGHTS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const insights = response.choices[0]?.message?.content

    if (!insights) {
      return {
        success: false,
        error: 'No response from AI model',
      }
    }

    return {
      success: true,
      insights,
      tokensUsed: response.usage?.total_tokens,
    }
  }
  catch (error: any) {
    console.error('Failed to generate insights:', error)

    // Handle specific OpenAI errors
    if (error?.status === 401) {
      return {
        success: false,
        error: 'Invalid OpenAI API key',
      }
    }

    if (error?.status === 429) {
      return {
        success: false,
        error: 'OpenAI rate limit exceeded. Please try again later.',
      }
    }

    return {
      success: false,
      error: error?.message || 'Failed to generate insights',
    }
  }
}

/**
 * Generate mock insights for testing without API key
 */
export function generateMockInsights(params: GenerateInsightsParams): string {
  const { clientName, reportType, dateRange } = params

  return `## Resumen Ejecutivo

El período analizado (${dateRange.start} a ${dateRange.end}) muestra un rendimiento estable para ${clientName}. Las campañas de ${reportType.toLowerCase()} mantienen buenos niveles de engagement, con oportunidades claras de optimización en segmentación y creativos.

## Puntos Destacados

- **CTR por encima del promedio**: Las campañas principales superan el benchmark de la industria
- **Costo por conversión optimizado**: Se logró reducir el CPA en comparación con períodos anteriores
- **Alcance expandido**: El número de impresiones creció de manera sostenida
- **Engagement positivo**: Los anuncios con video muestran mejor rendimiento

## Áreas de Mejora

- **Segmentación de audiencia**: Considerar crear audiencias lookalike basadas en conversores
- **Creativos**: Rotar creativos cada 2 semanas para evitar fatiga publicitaria
- **Horarios de publicación**: Concentrar presupuesto en horarios de mayor conversión (10-14h)

## Próximos Pasos

1. Implementar A/B testing en los 3 anuncios principales
2. Revisar y optimizar keywords negativas en campañas de búsqueda
3. Preparar creativos frescos para el próximo período`
}
