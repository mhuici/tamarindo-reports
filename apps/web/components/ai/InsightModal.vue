<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const { markInsightSeen } = useOnboarding()

interface RCACause {
  factor: string
  explanation: string
  confidence: number
  action?: string
}

interface RCAResult {
  metric: string
  metricLabel: string
  change: {
    value: number
    percentage: number
    direction: 'up' | 'down'
  }
  causes: RCACause[]
  summary: string
  isFallback: boolean
}

interface Props {
  open: boolean
  loading?: boolean
  error?: string | null
  result?: RCAResult | null
  clientName?: string
  period?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  result: null,
  clientName: '',
  period: '',
})

const emit = defineEmits<{
  close: []
  retry: []
}>()

const copied = ref(false)

// Format the analysis for clipboard (email-ready)
const formattedAnalysis = computed(() => {
  if (!props.result) return ''

  const { metricLabel, change, summary, causes } = props.result
  const direction = change.direction === 'up' ? 'subió' : 'bajó'
  const sign = change.percentage >= 0 ? '+' : ''

  let text = `📊 Análisis de ${metricLabel}\n`
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

  if (props.clientName) {
    text += `Cliente: ${props.clientName}\n`
  }
  if (props.period) {
    text += `Período: ${props.period}\n`
  }
  text += `\n`

  text += `📈 Cambio: ${metricLabel} ${direction} ${sign}${change.percentage.toFixed(1)}%\n\n`

  text += `🔍 Análisis:\n${summary}\n\n`

  if (causes.length > 0) {
    text += `💡 Causas identificadas:\n`
    causes.forEach((cause, i) => {
      text += `\n${i + 1}. ${cause.factor} (${Math.round(cause.confidence * 100)}% confianza)\n`
      text += `   ${cause.explanation}\n`
      if (cause.action) {
        text += `   ✅ Acción: ${cause.action}\n`
      }
    })
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  text += `Generado por TamarindoReports`

  return text
})

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(formattedAnalysis.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
  catch (err) {
    console.error('Failed to copy:', err)
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-100 text-green-700'
  if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-700'
}

// Reset copied state when modal closes
watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    copied.value = false
  }
})

// Mark insight as seen for onboarding when result is shown
watch(() => props.result, (result) => {
  if (result && props.open) {
    markInsightSeen()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm"
          @click="emit('close')"
        />

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-4"
          >
            <div
              v-if="open"
              class="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl"
            >
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Icon name="heroicons:light-bulb" class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900">
                      Análisis de Causa
                    </h2>
                    <p v-if="result" class="text-sm text-gray-500">
                      {{ result.metricLabel }}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  @click="emit('close')"
                >
                  <Icon name="heroicons:x-mark" class="w-5 h-5" />
                </button>
              </div>

              <!-- Content -->
              <div class="px-6 py-5">
                <!-- Loading State -->
                <div
                  v-if="loading"
                  class="py-12 text-center"
                >
                  <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-4">
                    <Icon name="heroicons:arrow-path" class="w-8 h-8 text-amber-500 animate-spin" />
                  </div>
                  <p class="text-gray-600 font-medium">Analizando cambios...</p>
                  <p class="text-sm text-gray-400 mt-1">Esto puede tomar unos segundos</p>
                </div>

                <!-- Error State -->
                <div
                  v-else-if="error"
                  class="py-8 text-center"
                >
                  <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                    <Icon name="heroicons:exclamation-triangle" class="w-8 h-8 text-red-500" />
                  </div>
                  <p class="text-gray-900 font-medium">No se pudo completar el análisis</p>
                  <p class="text-sm text-gray-500 mt-1">{{ error }}</p>
                  <button
                    type="button"
                    class="mt-4 px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                    @click="emit('retry')"
                  >
                    Intentar de nuevo
                  </button>
                </div>

                <!-- Result -->
                <template v-else-if="result">
                  <!-- Change Badge -->
                  <div class="flex items-center gap-3 mb-5">
                    <div
                      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
                      :class="result.change.direction === 'up'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'"
                    >
                      <Icon
                        :name="result.change.direction === 'up'
                          ? 'heroicons:arrow-trending-up'
                          : 'heroicons:arrow-trending-down'"
                        class="w-4 h-4"
                      />
                      {{ result.change.percentage >= 0 ? '+' : '' }}{{ result.change.percentage.toFixed(1) }}%
                    </div>
                    <span class="text-sm text-gray-500">vs período anterior</span>
                  </div>

                  <!-- Fallback Badge -->
                  <div
                    v-if="result.isFallback"
                    class="mb-4 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700"
                  >
                    <Icon name="heroicons:information-circle" class="w-4 h-4 shrink-0" />
                    <span>Análisis de demostración. Conecta la API para análisis real.</span>
                  </div>

                  <!-- Summary -->
                  <div class="bg-gray-50 rounded-xl p-4 mb-5">
                    <p class="text-gray-700 leading-relaxed">
                      {{ result.summary }}
                    </p>
                  </div>

                  <!-- Causes -->
                  <div v-if="result.causes.length > 0" class="space-y-3">
                    <h3 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Icon name="heroicons:clipboard-document-list" class="w-4 h-4 text-gray-400" />
                      Causas identificadas
                    </h3>

                    <div
                      v-for="(cause, index) in result.causes"
                      :key="index"
                      class="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
                    >
                      <div class="flex items-start justify-between gap-3 mb-2">
                        <div class="flex items-center gap-2">
                          <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {{ index + 1 }}
                          </span>
                          <span class="font-medium text-gray-900">{{ cause.factor }}</span>
                        </div>
                        <span
                          class="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                          :class="getConfidenceColor(cause.confidence)"
                        >
                          {{ Math.round(cause.confidence * 100) }}%
                        </span>
                      </div>

                      <p class="text-sm text-gray-600 ml-8 mb-2">
                        {{ cause.explanation }}
                      </p>

                      <div
                        v-if="cause.action"
                        class="ml-8 flex items-start gap-2 p-2.5 bg-green-50 border border-green-100 rounded-lg"
                      >
                        <Icon name="heroicons:check-circle" class="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <span class="text-sm text-green-800">{{ cause.action }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Footer -->
              <div
                v-if="result && !loading && !error"
                class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl"
              >
                <p class="text-xs text-gray-500">
                  Listo para copiar y enviar a tu cliente
                </p>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors"
                  @click="copyToClipboard"
                >
                  <Icon
                    :name="copied ? 'heroicons:check' : 'heroicons:clipboard-document'"
                    class="w-4 h-4"
                  />
                  {{ copied ? 'Copiado!' : 'Copiar análisis' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
