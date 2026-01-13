<script setup lang="ts">
const route = useRoute()
const tenant = computed(() => route.params.tenant as string)

const {
  currentStep,
  progress,
  isComplete,
  isLoading,
  shouldShowOnboarding,
  fetchOnboardingState,
  dismissOnboarding,
  checkDismissed,
} = useOnboarding()

// Check state on mount
onMounted(() => {
  checkDismissed()
  fetchOnboardingState()
})

function handleDismiss() {
  dismissOnboarding()
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="!isLoading && shouldShowOnboarding && currentStep"
      class="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200"
    >
      <div class="flex items-center justify-between gap-4">
        <!-- Progress info -->
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Icon :name="currentStep.icon" class="w-5 h-5 text-amber-600" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium text-amber-800">
                Siguiente paso:
              </span>
              <span class="text-sm font-semibold text-amber-900">
                {{ currentStep.title }}
              </span>
            </div>
            <!-- Progress bar -->
            <div class="flex items-center gap-3">
              <div class="flex-1 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  :style="{ width: `${progress}%` }"
                />
              </div>
              <span class="text-xs text-amber-600 font-medium">{{ progress }}%</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <NuxtLink
            :to="`/${tenant}/onboarding`"
            class="inline-flex items-center px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
          >
            Continuar
            <Icon name="heroicons:arrow-right" class="w-4 h-4 ml-1" />
          </NuxtLink>
          <button
            type="button"
            class="p-2 text-amber-400 hover:text-amber-600 transition-colors"
            title="Ocultar"
            @click="handleDismiss"
          >
            <Icon name="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
