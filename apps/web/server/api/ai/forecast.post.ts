import { forecast, generateDates, type ForecastOptions } from '~/utils/forecasting/holt-winters'

interface ForecastRequest {
  data: number[]
  dates?: string[]
  metricName?: string
  metricLabel?: string
  options?: ForecastOptions
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ForecastRequest>(event)

  // Validate data
  if (!body.data || !Array.isArray(body.data) || body.data.length < 7) {
    throw createError({
      statusCode: 400,
      message: 'Se requieren al menos 7 puntos de datos para el forecasting',
    })
  }

  // Validate all values are numbers
  if (!body.data.every(d => typeof d === 'number' && !isNaN(d))) {
    throw createError({
      statusCode: 400,
      message: 'Todos los valores de data deben ser números válidos',
    })
  }

  // Generate dates if not provided
  const dates = body.dates && body.dates.length === body.data.length
    ? body.dates
    : generateDates(body.data.length)

  try {
    const result = forecast(body.data, dates, body.options)

    return {
      success: true,
      metric: body.metricName || 'metric',
      metricLabel: body.metricLabel || 'Métrica',
      forecast: result,
    }
  }
  catch (error: any) {
    console.error('Forecast error:', error)
    throw createError({
      statusCode: 500,
      message: error?.message || 'Error al generar el forecast',
    })
  }
})
