/**
 * Holt-Winters Triple Exponential Smoothing
 *
 * Predicts future values based on:
 * - Level (alpha): Base value smoothing
 * - Trend (beta): Growth/decline smoothing
 * - Seasonality (gamma): Periodic pattern smoothing
 */

export interface ForecastPoint {
  date: string
  value: number
  isHistorical: boolean
}

export interface ConfidenceInterval {
  upper80: number[]
  lower80: number[]
  upper95: number[]
  lower95: number[]
}

export interface ForecastResult {
  historical: ForecastPoint[]
  predictions: ForecastPoint[]
  confidence: ConfidenceInterval
  trend: 'up' | 'down' | 'stable'
  trendPercent: number
  summary: string
}

export interface ForecastOptions {
  periods?: number // Number of periods to forecast (default: 30)
  seasonality?: number // Length of seasonal cycle (default: 7 for weekly)
  alpha?: number // Level smoothing (default: 0.3)
  beta?: number // Trend smoothing (default: 0.1)
  gamma?: number // Seasonal smoothing (default: 0.3)
}

const DEFAULT_OPTIONS: Required<ForecastOptions> = {
  periods: 30,
  seasonality: 7,
  alpha: 0.3,
  beta: 0.1,
  gamma: 0.3,
}

/**
 * Generate forecast using Holt-Winters triple exponential smoothing
 */
export function forecast(
  data: number[],
  dates: string[],
  options: ForecastOptions = {},
): ForecastResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { periods, seasonality, alpha, beta, gamma } = opts

  // Need at least 2 full seasons of data
  if (data.length < seasonality * 2) {
    return generateSimpleForecast(data, dates, periods)
  }

  // Initialize components
  const { level, trend, seasonal } = initializeComponents(data, seasonality)

  // Apply Holt-Winters
  const smoothed = applyHoltWinters(data, level, trend, seasonal, alpha, beta, gamma, seasonality)

  // Generate predictions
  const predictions = generatePredictions(
    smoothed.level,
    smoothed.trend,
    smoothed.seasonal,
    periods,
    seasonality,
    dates[dates.length - 1],
  )

  // Calculate confidence intervals
  const residuals = calculateResiduals(data, smoothed.fitted)
  const confidence = calculateConfidenceIntervals(predictions.map(p => p.value), residuals)

  // Determine trend direction
  const trendPercent = calculateTrendPercent(data[data.length - 1], predictions[predictions.length - 1].value)
  const trendDirection = determineTrend(trendPercent)

  // Build historical points
  const historical: ForecastPoint[] = data.map((value, i) => ({
    date: dates[i],
    value,
    isHistorical: true,
  }))

  return {
    historical,
    predictions,
    confidence,
    trend: trendDirection,
    trendPercent,
    summary: generateSummary(trendDirection, trendPercent, periods),
  }
}

/**
 * Initialize Holt-Winters components
 */
function initializeComponents(data: number[], seasonality: number) {
  // Initial level: average of first season
  const level = data.slice(0, seasonality).reduce((a, b) => a + b, 0) / seasonality

  // Initial trend: average difference between seasons
  let trendSum = 0
  for (let i = 0; i < seasonality; i++) {
    trendSum += (data[seasonality + i] - data[i]) / seasonality
  }
  const trend = trendSum / seasonality

  // Initial seasonal indices
  const seasonal: number[] = []
  for (let i = 0; i < seasonality; i++) {
    const seasonAvg = data.slice(i, data.length).filter((_, idx) => idx % seasonality === 0)
    const avg = seasonAvg.reduce((a, b) => a + b, 0) / seasonAvg.length
    seasonal.push(data[i] / (level || 1))
  }

  // Normalize seasonal factors
  const seasonalSum = seasonal.reduce((a, b) => a + b, 0)
  const normalizedSeasonal = seasonal.map(s => (s * seasonality) / seasonalSum)

  return { level, trend, seasonal: normalizedSeasonal }
}

/**
 * Apply Holt-Winters smoothing to data
 */
function applyHoltWinters(
  data: number[],
  initialLevel: number,
  initialTrend: number,
  initialSeasonal: number[],
  alpha: number,
  beta: number,
  gamma: number,
  seasonality: number,
) {
  const n = data.length
  const level: number[] = [initialLevel]
  const trend: number[] = [initialTrend]
  const seasonal: number[] = [...initialSeasonal]
  const fitted: number[] = []

  for (let t = 0; t < n; t++) {
    const seasonIdx = t % seasonality

    if (t === 0) {
      fitted.push(level[0] * seasonal[seasonIdx])
      continue
    }

    // Update level
    const newLevel = alpha * (data[t] / seasonal[seasonIdx]) + (1 - alpha) * (level[t - 1] + trend[t - 1])
    level.push(newLevel)

    // Update trend
    const newTrend = beta * (newLevel - level[t - 1]) + (1 - beta) * trend[t - 1]
    trend.push(newTrend)

    // Update seasonal
    const newSeasonal = gamma * (data[t] / newLevel) + (1 - gamma) * seasonal[seasonIdx]
    seasonal[seasonIdx] = newSeasonal

    // Fitted value
    fitted.push((level[t - 1] + trend[t - 1]) * seasonal[seasonIdx])
  }

  return { level, trend, seasonal, fitted }
}

/**
 * Generate future predictions
 */
function generatePredictions(
  levels: number[],
  trends: number[],
  seasonal: number[],
  periods: number,
  seasonality: number,
  lastDate: string,
): ForecastPoint[] {
  const predictions: ForecastPoint[] = []
  const lastLevel = levels[levels.length - 1]
  const lastTrend = trends[trends.length - 1]
  const startDate = new Date(lastDate)

  for (let h = 1; h <= periods; h++) {
    const seasonIdx = (levels.length - 1 + h) % seasonality
    const value = (lastLevel + h * lastTrend) * seasonal[seasonIdx]

    const date = new Date(startDate)
    date.setDate(date.getDate() + h)

    predictions.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0, value), // Ensure non-negative
      isHistorical: false,
    })
  }

  return predictions
}

/**
 * Calculate residuals (errors) for confidence intervals
 */
function calculateResiduals(actual: number[], fitted: number[]): number[] {
  const residuals: number[] = []
  const minLen = Math.min(actual.length, fitted.length)

  for (let i = 0; i < minLen; i++) {
    residuals.push(actual[i] - fitted[i])
  }

  return residuals
}

/**
 * Calculate confidence intervals based on residual standard error
 */
function calculateConfidenceIntervals(predictions: number[], residuals: number[]): ConfidenceInterval {
  // Calculate standard error of residuals
  const mean = residuals.reduce((a, b) => a + b, 0) / residuals.length
  const squaredDiffs = residuals.map(r => Math.pow(r - mean, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (residuals.length - 1)
  const stdError = Math.sqrt(variance)

  // Z-scores for confidence levels
  const z80 = 1.28 // 80% confidence
  const z95 = 1.96 // 95% confidence

  const upper80: number[] = []
  const lower80: number[] = []
  const upper95: number[] = []
  const lower95: number[] = []

  predictions.forEach((pred, h) => {
    // Error grows with forecast horizon
    const horizonFactor = Math.sqrt(1 + h * 0.1)
    const error = stdError * horizonFactor

    upper80.push(Math.max(0, pred + z80 * error))
    lower80.push(Math.max(0, pred - z80 * error))
    upper95.push(Math.max(0, pred + z95 * error))
    lower95.push(Math.max(0, pred - z95 * error))
  })

  return { upper80, lower80, upper95, lower95 }
}

/**
 * Calculate trend percentage
 */
function calculateTrendPercent(currentValue: number, futureValue: number): number {
  if (currentValue === 0) return futureValue > 0 ? 100 : 0
  return ((futureValue - currentValue) / currentValue) * 100
}

/**
 * Determine trend direction
 */
function determineTrend(trendPercent: number): 'up' | 'down' | 'stable' {
  if (trendPercent > 5) return 'up'
  if (trendPercent < -5) return 'down'
  return 'stable'
}

/**
 * Generate human-readable summary
 */
function generateSummary(trend: 'up' | 'down' | 'stable', trendPercent: number, periods: number): string {
  const absPercent = Math.abs(trendPercent).toFixed(0)

  switch (trend) {
    case 'up':
      return `Se espera un aumento de ~${absPercent}% en los próximos ${periods} días, basado en la tendencia histórica.`
    case 'down':
      return `Se proyecta una disminución de ~${absPercent}% en los próximos ${periods} días, según los patrones observados.`
    case 'stable':
      return `Se espera que los valores se mantengan estables (±${absPercent}%) en los próximos ${periods} días.`
  }
}

/**
 * Simple forecast fallback when not enough data for Holt-Winters
 */
function generateSimpleForecast(
  data: number[],
  dates: string[],
  periods: number,
): ForecastResult {
  // Use simple moving average and linear trend
  const avg = data.reduce((a, b) => a + b, 0) / data.length
  const lastValue = data[data.length - 1]

  // Simple linear regression for trend
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  const n = data.length

  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += data[i]
    sumXY += i * data[i]
    sumX2 += i * i
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Generate predictions
  const predictions: ForecastPoint[] = []
  const startDate = new Date(dates[dates.length - 1])

  for (let h = 1; h <= periods; h++) {
    const value = intercept + slope * (n - 1 + h)
    const date = new Date(startDate)
    date.setDate(date.getDate() + h)

    predictions.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0, value),
      isHistorical: false,
    })
  }

  // Simple confidence intervals
  const stdDev = Math.sqrt(data.map(d => Math.pow(d - avg, 2)).reduce((a, b) => a + b, 0) / n)
  const confidence: ConfidenceInterval = {
    upper80: predictions.map(p => Math.max(0, p.value + 1.28 * stdDev)),
    lower80: predictions.map(p => Math.max(0, p.value - 1.28 * stdDev)),
    upper95: predictions.map(p => Math.max(0, p.value + 1.96 * stdDev)),
    lower95: predictions.map(p => Math.max(0, p.value - 1.96 * stdDev)),
  }

  const trendPercent = calculateTrendPercent(lastValue, predictions[periods - 1].value)
  const trend = determineTrend(trendPercent)

  const historical: ForecastPoint[] = data.map((value, i) => ({
    date: dates[i],
    value,
    isHistorical: true,
  }))

  return {
    historical,
    predictions,
    confidence,
    trend,
    trendPercent,
    summary: generateSummary(trend, trendPercent, periods),
  }
}

/**
 * Generate sample dates for testing
 */
export function generateDates(count: number, endDate: Date = new Date()): string[] {
  const dates: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(endDate)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}
