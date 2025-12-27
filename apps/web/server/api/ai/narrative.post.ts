import {
  generateNarrative,
  generateDashboardNarratives,
  type NarrativeRequest,
  type MetricData,
  type NarrativeContext,
} from '~/server/utils/ai/narrative-engine'
import type { NarrativeTone, NarrativeLanguage } from '~/server/utils/ai/prompts/narrative'

interface SingleNarrativeBody extends NarrativeRequest {
  mode?: 'single'
}

interface DashboardNarrativesBody {
  mode: 'dashboard'
  metrics: MetricData[]
  context: NarrativeContext
  tone?: NarrativeTone
  language?: NarrativeLanguage
}

type RequestBody = SingleNarrativeBody | DashboardNarrativesBody

export default defineEventHandler(async (event) => {
  const body = await readBody<RequestBody>(event)

  // Dashboard mode - generate all narratives
  if (body.mode === 'dashboard') {
    const dashboardBody = body as DashboardNarrativesBody

    if (!dashboardBody.metrics || dashboardBody.metrics.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Se requiere al menos una métrica para generar narrativas',
      })
    }

    if (!dashboardBody.context?.clientName) {
      throw createError({
        statusCode: 400,
        message: 'Se requiere el nombre del cliente en el contexto',
      })
    }

    const results = await generateDashboardNarratives(
      dashboardBody.metrics,
      dashboardBody.context,
      {
        tone: dashboardBody.tone,
        language: dashboardBody.language,
      },
    )

    return {
      success: true,
      mode: 'dashboard',
      ...results,
    }
  }

  // Single narrative mode
  const singleBody = body as SingleNarrativeBody

  if (!singleBody.type) {
    throw createError({
      statusCode: 400,
      message: 'Se requiere el tipo de narrativa (executive-summary, widget-insight, recommendation, alert)',
    })
  }

  if (!singleBody.context?.clientName) {
    throw createError({
      statusCode: 400,
      message: 'Se requiere el nombre del cliente en el contexto',
    })
  }

  // Type-specific validation
  switch (singleBody.type) {
    case 'executive-summary':
      if (!('metrics' in singleBody) || !singleBody.metrics?.length) {
        throw createError({
          statusCode: 400,
          message: 'Executive summary requiere métricas',
        })
      }
      break

    case 'widget-insight':
      if (!('metric' in singleBody) || !singleBody.metric) {
        throw createError({
          statusCode: 400,
          message: 'Widget insight requiere una métrica',
        })
      }
      break

    case 'recommendation':
      if (!('metrics' in singleBody) || !singleBody.metrics?.length) {
        throw createError({
          statusCode: 400,
          message: 'Recommendation requiere métricas',
        })
      }
      break

    case 'alert':
      if (!('metric' in singleBody) || !singleBody.metric) {
        throw createError({
          statusCode: 400,
          message: 'Alert requiere una métrica',
        })
      }
      break
  }

  const result = await generateNarrative(singleBody)

  return {
    success: true,
    mode: 'single',
    result,
  }
})
