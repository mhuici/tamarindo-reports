<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Primeros pasos',
  middleware: ['tenant'],
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)

const {
  steps,
  currentStep,
  currentStepIndex,
  progress,
  isComplete,
  isLoading,
  fetchOnboardingState,
} = useOnboarding()

// Fetch state on mount
onMounted(() => {
  fetchOnboardingState()
})

// Navigate to step route
function goToStep(step: typeof steps.value[0]) {
  if (step.route) {
    navigateTo(step.route)
  }
}

// Skip onboarding
function skipOnboarding() {
  navigateTo(`/${tenant.value}`)
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-12">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-6">
        <Icon name="heroicons:rocket-launch" class="w-4 h-4" />
        <span>Primeros pasos</span>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        Bienvenido a TamarindoReports
      </h1>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Sigue estos 4 pasos para configurar tu cuenta y empezar a generar reportes con inteligencia artificial.
      </p>
    </div>

    <!-- Progress bar -->
    <div class="mb-12">
      <div class="flex items-center justify-between text-sm text-gray-500 mb-2">
        <span>Progreso de configuracion</span>
        <span class="font-medium">{{ progress }}% completado</span>
      </div>
      <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-20"
    >
      <Icon
        name="heroicons:arrow-path"
        class="w-8 h-8 animate-spin text-amber-500"
      />
    </div>

    <!-- Steps -->
    <div
      v-else
      class="space-y-4"
    >
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        :class="[
          'relative p-6 rounded-2xl border-2 transition-all cursor-pointer group',
          step.completed
            ? 'bg-green-50 border-green-200'
            : index === currentStepIndex
              ? 'bg-amber-50 border-amber-300 shadow-lg shadow-amber-500/10'
              : 'bg-white border-gray-200 hover:border-gray-300',
        ]"
        @click="goToStep(step)"
      >
        <div class="flex items-start gap-4">
          <!-- Step number or check -->
          <div
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold transition-colors',
              step.completed
                ? 'bg-green-500 text-white'
                : index === currentStepIndex
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300',
            ]"
          >
            <Icon
              v-if="step.completed"
              name="heroicons:check"
              class="w-5 h-5"
            />
            <span v-else>{{ index + 1 }}</span>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3">
              <h3
                :class="[
                  'text-lg font-semibold',
                  step.completed
                    ? 'text-green-700'
                    : index === currentStepIndex
                      ? 'text-amber-900'
                      : 'text-gray-700',
                ]"
              >
                {{ step.title }}
              </h3>
              <span
                v-if="step.completed"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"
              >
                Completado
              </span>
              <span
                v-else-if="index === currentStepIndex"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700"
              >
                Paso actual
              </span>
            </div>
            <p
              :class="[
                'mt-1',
                step.completed
                  ? 'text-green-600'
                  : index === currentStepIndex
                    ? 'text-amber-700'
                    : 'text-gray-500',
              ]"
            >
              {{ step.description }}
            </p>
          </div>

          <!-- Icon -->
          <div
            :class="[
              'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
              step.completed
                ? 'bg-green-100'
                : index === currentStepIndex
                  ? 'bg-amber-100'
                  : 'bg-gray-100 group-hover:bg-gray-200',
            ]"
          >
            <Icon
              :name="step.icon"
              :class="[
                'w-6 h-6',
                step.completed
                  ? 'text-green-600'
                  : index === currentStepIndex
                    ? 'text-amber-600'
                    : 'text-gray-400',
              ]"
            />
          </div>

          <!-- Arrow for clickable steps -->
          <div
            v-if="step.route && !step.completed"
            class="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <Icon
              name="heroicons:chevron-right"
              :class="[
                'w-5 h-5 transition-transform group-hover:translate-x-1',
                index === currentStepIndex ? 'text-amber-500' : 'text-gray-300',
              ]"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Completion state -->
    <Transition
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
    >
      <div
        v-if="isComplete"
        class="mt-8 p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 text-center"
      >
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <Icon name="heroicons:check-badge" class="w-8 h-8 text-green-600" />
        </div>
        <h3 class="text-xl font-semibold text-green-800 mb-2">
          Felicitaciones! Tu cuenta esta lista
        </h3>
        <p class="text-green-600 mb-6">
          Completaste todos los pasos. Ahora puedes aprovechar todo el poder de TamarindoReports.
        </p>
        <NuxtLink
          :to="`/${tenant}`"
          class="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
        >
          Ir al dashboard
          <Icon name="heroicons:arrow-right" class="w-5 h-5 ml-2" />
        </NuxtLink>
      </div>
    </Transition>

    <!-- Current step CTA -->
    <div
      v-if="!isComplete && currentStep"
      class="mt-8 flex items-center justify-between"
    >
      <button
        type="button"
        class="text-gray-500 hover:text-gray-700 text-sm"
        @click="skipOnboarding"
      >
        Saltar por ahora
      </button>
      <button
        v-if="currentStep.route"
        type="button"
        class="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25"
        @click="goToStep(currentStep)"
      >
        {{ currentStep.title }}
        <Icon name="heroicons:arrow-right" class="w-5 h-5 ml-2" />
      </button>
    </div>

    <!-- Help section -->
    <div class="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Icon name="heroicons:question-mark-circle" class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 class="font-semibold text-gray-900 mb-1">
            Necesitas ayuda?
          </h4>
          <p class="text-sm text-gray-600 mb-3">
            Nuestro equipo esta aqui para ayudarte a configurar tu cuenta. Agenda una llamada o envianos un email.
          </p>
          <div class="flex gap-3">
            <a
              href="mailto:support@tamarindoreports.com"
              class="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              <Icon name="heroicons:envelope" class="w-4 h-4 mr-1" />
              support@tamarindoreports.com
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
