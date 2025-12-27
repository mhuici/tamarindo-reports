// ============================================
// Metric Definitions Registry
// ============================================
// Definiciones de todas las métricas canónicas
// con metadata para UI, formateo y documentación.

/**
 * Formato de visualización de una métrica
 */
export type MetricFormat = 'number' | 'currency' | 'percentage' | 'decimal'

/**
 * Definición completa de una métrica
 */
export interface MetricDefinition {
  /** Identificador único (nombre canónico) */
  id: string

  /** Nombre para mostrar en UI (español) */
  label: string

  /** Nombre corto para espacios reducidos */
  shortLabel: string

  /** Descripción de la métrica */
  description: string

  /** Formato de visualización */
  format: MetricFormat

  /** Número de decimales (para format: decimal/percentage) */
  precision?: number

  /** ¿Es una métrica core (siempre disponible)? */
  isCore: boolean

  /** ¿Es calculada a partir de otras métricas? */
  isDerived: boolean

  /** Fórmula si es derivada (para documentación) */
  formula?: string

  /** Icono para UI (iconify) */
  icon?: string

  /** Color sugerido (tailwind) */
  color?: string

  /** ¿Valor más alto es mejor? (para indicadores de tendencia) */
  higherIsBetter: boolean
}

/**
 * Registry de todas las métricas canónicas
 */
export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  // === MÉTRICAS CORE ===

  impressions: {
    id: 'impressions',
    label: 'Impresiones',
    shortLabel: 'Impr.',
    description: 'Número de veces que se mostró el anuncio',
    format: 'number',
    isCore: true,
    isDerived: false,
    icon: 'heroicons:eye',
    color: 'blue',
    higherIsBetter: true,
  },

  clicks: {
    id: 'clicks',
    label: 'Clics',
    shortLabel: 'Clics',
    description: 'Número de clics en el anuncio',
    format: 'number',
    isCore: true,
    isDerived: false,
    icon: 'heroicons:cursor-arrow-rays',
    color: 'green',
    higherIsBetter: true,
  },

  spend: {
    id: 'spend',
    label: 'Gasto',
    shortLabel: 'Gasto',
    description: 'Cantidad total gastada en publicidad',
    format: 'currency',
    precision: 2,
    isCore: true,
    isDerived: false,
    icon: 'heroicons:currency-dollar',
    color: 'red',
    higherIsBetter: false, // Depende del contexto, pero generalmente queremos gastar menos
  },

  ctr: {
    id: 'ctr',
    label: 'CTR',
    shortLabel: 'CTR',
    description: 'Click-through rate - porcentaje de impresiones que generaron clic',
    format: 'percentage',
    precision: 2,
    isCore: true,
    isDerived: true,
    formula: '(clicks / impressions) × 100',
    icon: 'heroicons:arrow-trending-up',
    color: 'purple',
    higherIsBetter: true,
  },

  cpc: {
    id: 'cpc',
    label: 'CPC',
    shortLabel: 'CPC',
    description: 'Costo por clic promedio',
    format: 'currency',
    precision: 2,
    isCore: true,
    isDerived: true,
    formula: 'spend / clicks',
    icon: 'heroicons:banknotes',
    color: 'orange',
    higherIsBetter: false,
  },

  cpm: {
    id: 'cpm',
    label: 'CPM',
    shortLabel: 'CPM',
    description: 'Costo por mil impresiones',
    format: 'currency',
    precision: 2,
    isCore: true,
    isDerived: true,
    formula: '(spend / impressions) × 1000',
    icon: 'heroicons:presentation-chart-bar',
    color: 'yellow',
    higherIsBetter: false,
  },

  // === MÉTRICAS DE CONVERSIÓN ===

  conversions: {
    id: 'conversions',
    label: 'Conversiones',
    shortLabel: 'Conv.',
    description: 'Número de acciones completadas (compras, leads, registros)',
    format: 'number',
    isCore: false,
    isDerived: false,
    icon: 'heroicons:check-badge',
    color: 'emerald',
    higherIsBetter: true,
  },

  conversionValue: {
    id: 'conversionValue',
    label: 'Valor de Conversiones',
    shortLabel: 'Valor',
    description: 'Valor monetario total de las conversiones',
    format: 'currency',
    precision: 2,
    isCore: false,
    isDerived: false,
    icon: 'heroicons:shopping-bag',
    color: 'teal',
    higherIsBetter: true,
  },

  costPerConversion: {
    id: 'costPerConversion',
    label: 'Costo por Conversión',
    shortLabel: 'CPA',
    description: 'Costo promedio por cada conversión',
    format: 'currency',
    precision: 2,
    isCore: false,
    isDerived: true,
    formula: 'spend / conversions',
    icon: 'heroicons:receipt-percent',
    color: 'rose',
    higherIsBetter: false,
  },

  conversionRate: {
    id: 'conversionRate',
    label: 'Tasa de Conversión',
    shortLabel: 'CVR',
    description: 'Porcentaje de clics que generaron conversión',
    format: 'percentage',
    precision: 2,
    isCore: false,
    isDerived: true,
    formula: '(conversions / clicks) × 100',
    icon: 'heroicons:chart-pie',
    color: 'indigo',
    higherIsBetter: true,
  },

  roas: {
    id: 'roas',
    label: 'ROAS',
    shortLabel: 'ROAS',
    description: 'Return on Ad Spend - retorno por cada peso invertido',
    format: 'decimal',
    precision: 2,
    isCore: false,
    isDerived: true,
    formula: 'conversionValue / spend',
    icon: 'heroicons:arrow-path',
    color: 'cyan',
    higherIsBetter: true,
  },

  // === MÉTRICAS DE PLATAFORMA ===

  reach: {
    id: 'reach',
    label: 'Alcance',
    shortLabel: 'Alcance',
    description: 'Número de usuarios únicos que vieron el anuncio',
    format: 'number',
    isCore: false,
    isDerived: false,
    icon: 'heroicons:user-group',
    color: 'sky',
    higherIsBetter: true,
  },

  frequency: {
    id: 'frequency',
    label: 'Frecuencia',
    shortLabel: 'Freq.',
    description: 'Promedio de veces que cada usuario vio el anuncio',
    format: 'decimal',
    precision: 2,
    isCore: false,
    isDerived: true,
    formula: 'impressions / reach',
    icon: 'heroicons:arrow-path-rounded-square',
    color: 'violet',
    higherIsBetter: false, // Alta frecuencia puede indicar fatiga
  },

  videoViews: {
    id: 'videoViews',
    label: 'Reproducciones',
    shortLabel: 'Views',
    description: 'Número de reproducciones de video',
    format: 'number',
    isCore: false,
    isDerived: false,
    icon: 'heroicons:play-circle',
    color: 'fuchsia',
    higherIsBetter: true,
  },

  videoViewRate: {
    id: 'videoViewRate',
    label: 'Tasa de Reproducción',
    shortLabel: 'VVR',
    description: 'Porcentaje de impresiones que generaron reproducción',
    format: 'percentage',
    precision: 2,
    isCore: false,
    isDerived: true,
    formula: '(videoViews / impressions) × 100',
    icon: 'heroicons:play-pause',
    color: 'pink',
    higherIsBetter: true,
  },
}

/**
 * Obtiene la definición de una métrica por ID
 */
export function getMetricDefinition(metricId: string): MetricDefinition | undefined {
  return METRIC_DEFINITIONS[metricId]
}

/**
 * Obtiene todas las métricas core
 */
export function getCoreMetrics(): MetricDefinition[] {
  return Object.values(METRIC_DEFINITIONS).filter(m => m.isCore)
}

/**
 * Obtiene todas las métricas de conversión
 */
export function getConversionMetrics(): MetricDefinition[] {
  return Object.values(METRIC_DEFINITIONS).filter(m =>
    ['conversions', 'conversionValue', 'costPerConversion', 'conversionRate', 'roas'].includes(m.id),
  )
}

/**
 * Formatea un valor según la definición de la métrica
 */
export function formatMetricValue(
  metricId: string,
  value: number,
  currency = 'USD',
  locale = 'es-AR',
): string {
  const definition = METRIC_DEFINITIONS[metricId]
  if (!definition) {
    return value.toLocaleString(locale)
  }

  switch (definition.format) {
    case 'number':
      return value.toLocaleString(locale, { maximumFractionDigits: 0 })

    case 'currency':
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: definition.precision ?? 2,
        maximumFractionDigits: definition.precision ?? 2,
      }).format(value)

    case 'percentage':
      return `${value.toFixed(definition.precision ?? 2)}%`

    case 'decimal':
      return value.toFixed(definition.precision ?? 2)

    default:
      return value.toString()
  }
}

/**
 * Calcula el cambio porcentual entre dos valores
 */
export function calculateChange(current: number, previous: number): {
  change: number
  percentage: number
  direction: 'up' | 'down' | 'neutral'
} {
  if (previous === 0) {
    return {
      change: current,
      percentage: current > 0 ? 100 : 0,
      direction: current > 0 ? 'up' : 'neutral',
    }
  }

  const change = current - previous
  const percentage = (change / previous) * 100

  return {
    change,
    percentage,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
  }
}
