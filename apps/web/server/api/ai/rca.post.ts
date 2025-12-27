import { analyzeMetricChange, analyzeMultipleMetrics, type RCAInput, type RCAResult } from '~/server/utils/ai/rca-agent'

interface RCARequestSingle {
  mode?: 'single'
  metric: string
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

interface RCARequestBatch {
  mode: 'batch'
  metrics: Array<{
    metricName: string
    metricLabel: string
    currentValue: number
    previousValue: number
  }>
  context: {
    clientName: string
    industry?: string
    platform: string
    dateRange: { start: string; end: string }
  }
}

type RCARequest = RCARequestSingle | RCARequestBatch

export default defineEventHandler(async (event) => {
  const body = await readBody<RCARequest>(event)

  // Validate required fields
  if (!body.context?.clientName || !body.context?.platform) {
    throw createError({
      statusCode: 400,
      message: 'Missing required context fields: clientName and platform',
    })
  }

  if (!body.context?.dateRange?.start || !body.context?.dateRange?.end) {
    throw createError({
      statusCode: 400,
      message: 'Missing required dateRange fields: start and end',
    })
  }

  // Handle batch mode
  if (body.mode === 'batch') {
    const batchBody = body as RCARequestBatch

    if (!batchBody.metrics || batchBody.metrics.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Batch mode requires at least one metric',
      })
    }

    const results = await analyzeMultipleMetrics(batchBody.metrics, batchBody.context)

    return {
      success: true,
      mode: 'batch',
      results,
      count: results.length,
    }
  }

  // Handle single mode (default)
  const singleBody = body as RCARequestSingle

  if (!singleBody.metric || singleBody.currentValue === undefined || singleBody.previousValue === undefined) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: metric, currentValue, previousValue',
    })
  }

  const input: RCAInput = {
    metricName: singleBody.metric,
    metricLabel: singleBody.metricLabel || singleBody.metric,
    currentValue: singleBody.currentValue,
    previousValue: singleBody.previousValue,
    context: singleBody.context,
    correlatedMetrics: singleBody.correlatedMetrics,
  }

  const result = await analyzeMetricChange(input)

  return {
    success: true,
    mode: 'single',
    result,
  }
})
