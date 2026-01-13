<script setup lang="ts">
import { ref, computed, watch } from 'vue'

type NarrativeTone = 'professional' | 'casual' | 'technical' | 'bold'
type NarrativeLanguage = 'es' | 'en'

interface MetricData {
  name: string
  label: string
  value: number
  previousValue?: number
  changePercent?: number
  format?: 'number' | 'currency' | 'percent'
}

interface Props {
  open: boolean
  clientName: string
  clientId?: string
  metrics: MetricData[]
  dateRange: {
    start: string
    end: string
  }
  historicalData?: Array<{ date: string; spend: number }>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// State
const step = ref<'config' | 'preview'>('config')
const isLoading = ref(false)
const error = ref<string | null>(null)

// Config options
const selectedTone = ref<NarrativeTone>('professional')
const selectedLanguage = ref<NarrativeLanguage>('es')
const includeRCA = ref(true)
const includeForecast = ref(true)
const selectedMetrics = ref<Set<string>>(new Set())

// Generated content
const generatedMarkdown = ref('')
const isFallback = ref(false)
const copied = ref(false)

// Tone options
const toneOptions: Array<{ value: NarrativeTone; label: string; description: string }> = [
  { value: 'professional', label: 'Profesional', description: 'Formal y directo, ideal para corporativos' },
  { value: 'casual', label: 'Casual', description: 'Amigable y conversacional' },
  { value: 'technical', label: 'Tecnico', description: 'Detallado con terminologia de marketing' },
  { value: 'bold', label: 'Audaz', description: 'Optimista y orientado a la accion' },
]

// Initialize selected metrics when modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    step.value = 'config'
    selectedMetrics.value = new Set(props.metrics.map(m => m.name))
    generatedMarkdown.value = ''
    error.value = null
    copied.value = false
  }
})

// Filtered metrics based on selection
const filteredMetrics = computed(() => {
  return props.metrics.filter(m => selectedMetrics.value.has(m.name))
})

// Toggle metric selection
function toggleMetric(name: string) {
  if (selectedMetrics.value.has(name)) {
    selectedMetrics.value.delete(name)
  }
  else {
    selectedMetrics.value.add(name)
  }
  selectedMetrics.value = new Set(selectedMetrics.value)
}

// Generate the summary
async function generateSummary() {
  if (filteredMetrics.value.length === 0) {
    error.value = 'Selecciona al menos una metrica'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const response = await $fetch<{
      success: boolean
      summary: {
        markdown: string
        isFallback: boolean
      }
    }>('/api/ai/executive-summary', {
      method: 'POST',
      body: {
        clientName: props.clientName,
        clientId: props.clientId,
        metrics: filteredMetrics.value,
        dateRange: props.dateRange,
        historicalData: props.historicalData,
        tone: selectedTone.value,
        language: selectedLanguage.value,
        includeRCA: includeRCA.value,
        includeForecast: includeForecast.value,
      },
    })

    if (response.success) {
      generatedMarkdown.value = response.summary.markdown
      isFallback.value = response.summary.isFallback
      step.value = 'preview'
    }
    else {
      throw new Error('Failed to generate summary')
    }
  }
  catch (e: any) {
    error.value = e?.message || 'Error al generar el resumen'
  }
  finally {
    isLoading.value = false
  }
}

// Copy to clipboard
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(generatedMarkdown.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
  catch (e) {
    console.error('Failed to copy:', e)
  }
}

// Go back to config
function goBack() {
  step.value = 'config'
}

// Close modal
function close() {
  emit('close')
}

// Format metric change for display
function formatChange(metric: MetricData): string {
  if (metric.changePercent === undefined) return ''
  const sign = metric.changePercent >= 0 ? '+' : ''
  return `${sign}${metric.changePercent.toFixed(1)}%`
}

function formatValue(value: number, format?: string): string {
  if (format === 'currency') {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
  }
  if (format === 'percent') {
    return `${value.toFixed(1)}%`
  }
  return new Intl.NumberFormat('es-MX').format(value)
}
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
          @click="close"
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
              class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl"
            >
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Icon name="heroicons:document-text" class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900">
                      Resumen Ejecutivo
                    </h2>
                    <p class="text-sm text-gray-500">
                      {{ clientName }}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  @click="close"
                >
                  <Icon name="heroicons:x-mark" class="w-5 h-5" />
                </button>
              </div>

              <!-- Step indicator -->
              <div class="px-6 py-3 bg-gray-50 border-b border-gray-100">
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <div
                      :class="[
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                        step === 'config' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white',
                      ]"
                    >
                      {{ step === 'config' ? '1' : '' }}
                      <Icon v-if="step !== 'config'" name="heroicons:check" class="w-4 h-4" />
                    </div>
                    <span :class="step === 'config' ? 'text-gray-900 font-medium' : 'text-gray-500'">
                      Configurar
                    </span>
                  </div>
                  <div class="flex-1 h-px bg-gray-300" />
                  <div class="flex items-center gap-2">
                    <div
                      :class="[
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                        step === 'preview' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500',
                      ]"
                    >
                      2
                    </div>
                    <span :class="step === 'preview' ? 'text-gray-900 font-medium' : 'text-gray-500'">
                      Vista previa
                    </span>
                  </div>
                </div>
              </div>

              <!-- Content -->
              <div class="px-6 py-5 max-h-[60vh] overflow-y-auto">
                <!-- Step 1: Configuration -->
                <template v-if="step === 'config'">
                  <!-- Metrics selection -->
                  <div class="mb-6">
                    <h3 class="text-sm font-semibold text-gray-900 mb-3">
                      Metricas a incluir
                    </h3>
                    <div class="grid grid-cols-2 gap-2">
                      <button
                        v-for="metric in metrics"
                        :key="metric.name"
                        type="button"
                        :class="[
                          'flex items-center justify-between p-3 rounded-lg border text-left transition-all',
                          selectedMetrics.has(metric.name)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300',
                        ]"
                        @click="toggleMetric(metric.name)"
                      >
                        <div>
                          <p class="text-sm font-medium text-gray-900">{{ metric.label }}</p>
                          <p class="text-xs text-gray-500">
                            {{ formatValue(metric.value, metric.format) }}
                            <span
                              v-if="metric.changePercent !== undefined"
                              :class="metric.changePercent >= 0 ? 'text-green-600' : 'text-red-600'"
                            >
                              ({{ formatChange(metric) }})
                            </span>
                          </p>
                        </div>
                        <Icon
                          :name="selectedMetrics.has(metric.name) ? 'heroicons:check-circle-solid' : 'heroicons:plus-circle'"
                          :class="[
                            'w-5 h-5',
                            selectedMetrics.has(metric.name) ? 'text-blue-500' : 'text-gray-400',
                          ]"
                        />
                      </button>
                    </div>
                  </div>

                  <!-- Tone selection -->
                  <div class="mb-6">
                    <h3 class="text-sm font-semibold text-gray-900 mb-3">
                      Tono del resumen
                    </h3>
                    <div class="grid grid-cols-2 gap-2">
                      <button
                        v-for="tone in toneOptions"
                        :key="tone.value"
                        type="button"
                        :class="[
                          'p-3 rounded-lg border text-left transition-all',
                          selectedTone === tone.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300',
                        ]"
                        @click="selectedTone = tone.value"
                      >
                        <p class="text-sm font-medium text-gray-900">{{ tone.label }}</p>
                        <p class="text-xs text-gray-500">{{ tone.description }}</p>
                      </button>
                    </div>
                  </div>

                  <!-- Options -->
                  <div class="mb-6">
                    <h3 class="text-sm font-semibold text-gray-900 mb-3">
                      Opciones
                    </h3>
                    <div class="space-y-3">
                      <label class="flex items-center gap-3">
                        <input
                          v-model="includeRCA"
                          type="checkbox"
                          class="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        >
                        <div>
                          <span class="text-sm text-gray-900">Incluir analisis de causa</span>
                          <p class="text-xs text-gray-500">Explica por que cambiaron las metricas</p>
                        </div>
                      </label>
                      <label class="flex items-center gap-3">
                        <input
                          v-model="includeForecast"
                          type="checkbox"
                          class="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        >
                        <div>
                          <span class="text-sm text-gray-900">Incluir proyeccion</span>
                          <p class="text-xs text-gray-500">Proyecta el spend de la proxima semana</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- Language -->
                  <div>
                    <h3 class="text-sm font-semibold text-gray-900 mb-3">
                      Idioma
                    </h3>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        :class="[
                          'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                          selectedLanguage === 'es'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300',
                        ]"
                        @click="selectedLanguage = 'es'"
                      >
                        Espanol
                      </button>
                      <button
                        type="button"
                        :class="[
                          'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                          selectedLanguage === 'en'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300',
                        ]"
                        @click="selectedLanguage = 'en'"
                      >
                        English
                      </button>
                    </div>
                  </div>

                  <!-- Error -->
                  <div
                    v-if="error"
                    class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
                  >
                    {{ error }}
                  </div>
                </template>

                <!-- Step 2: Preview -->
                <template v-else>
                  <!-- Fallback badge -->
                  <div
                    v-if="isFallback"
                    class="mb-4 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700"
                  >
                    <Icon name="heroicons:information-circle" class="w-4 h-4 shrink-0" />
                    <span>Contenido de demostracion. Conecta la API de Claude para contenido real.</span>
                  </div>

                  <!-- Markdown preview -->
                  <div class="bg-gray-50 rounded-xl p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed text-gray-800">
                    {{ generatedMarkdown }}
                  </div>
                </template>
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <template v-if="step === 'config'">
                  <p class="text-xs text-gray-500">
                    {{ selectedMetrics.size }} metricas seleccionadas
                  </p>
                  <button
                    type="button"
                    :disabled="isLoading || selectedMetrics.size === 0"
                    class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                    @click="generateSummary"
                  >
                    <Icon
                      v-if="isLoading"
                      name="heroicons:arrow-path"
                      class="w-4 h-4 animate-spin"
                    />
                    <Icon
                      v-else
                      name="heroicons:sparkles"
                      class="w-4 h-4"
                    />
                    {{ isLoading ? 'Generando...' : 'Generar resumen' }}
                  </button>
                </template>

                <template v-else>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    @click="goBack"
                  >
                    <Icon name="heroicons:arrow-left" class="w-4 h-4" />
                    Volver
                  </button>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                      @click="generateSummary"
                    >
                      <Icon name="heroicons:arrow-path" class="w-4 h-4" />
                      Regenerar
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                      @click="copyToClipboard"
                    >
                      <Icon
                        :name="copied ? 'heroicons:check' : 'heroicons:clipboard-document'"
                        class="w-4 h-4"
                      />
                      {{ copied ? 'Copiado!' : 'Copiar resumen' }}
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
