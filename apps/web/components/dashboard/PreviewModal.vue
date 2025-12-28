<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  modelValue: boolean
  previewUrl: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Vista Previa del Dashboard',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const viewMode = ref<'desktop' | 'mobile'>('desktop')
const iframeRef = ref<HTMLIFrameElement | null>(null)
const isLoading = ref(true)

function close() {
  emit('cancel')
  isOpen.value = false
}

function confirm() {
  emit('confirm')
  isOpen.value = false
}

function handleIframeLoad() {
  isLoading.value = false
}

// Reset loading state when modal opens
watch(isOpen, (val: boolean) => {
  if (val) {
    isLoading.value = true
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="close"
        />

        <!-- Modal -->
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 class="text-lg font-semibold text-gray-900">
              {{ title }}
            </h2>

            <!-- View mode toggle -->
            <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                :class="[
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                ]"
                @click="viewMode = 'desktop'"
              >
                <Icon name="heroicons:computer-desktop" class="w-4 h-4" />
                Desktop
              </button>
              <button
                type="button"
                :class="[
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                ]"
                @click="viewMode = 'mobile'"
              >
                <Icon name="heroicons:device-phone-mobile" class="w-4 h-4" />
                Mobile
              </button>
            </div>

            <!-- Close button -->
            <button
              type="button"
              class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              @click="close"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>

          <!-- Preview iframe container -->
          <div
            class="flex-1 p-6 bg-gray-100 overflow-auto"
            style="min-height: 500px;"
          >
            <div
              :class="[
                'mx-auto bg-white rounded-lg shadow-lg transition-all duration-300 overflow-hidden',
                viewMode === 'mobile' ? 'w-[375px]' : 'w-full',
              ]"
            >
              <!-- Loading indicator -->
              <div
                v-if="isLoading"
                class="flex items-center justify-center py-20"
              >
                <Icon
                  name="heroicons:arrow-path"
                  class="w-8 h-8 text-gray-400 animate-spin"
                />
              </div>

              <!-- Preview iframe -->
              <iframe
                ref="iframeRef"
                :src="previewUrl"
                class="w-full border-0 transition-opacity"
                :class="isLoading ? 'opacity-0 h-0' : 'opacity-100'"
                :style="{ height: viewMode === 'mobile' ? '667px' : '600px' }"
                @load="handleIframeLoad"
              />
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p class="text-sm text-gray-500">
              Así verán tus clientes este dashboard
            </p>

            <div class="flex items-center gap-3">
              <button
                type="button"
                class="btn-secondary"
                @click="close"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-primary"
                @click="confirm"
              >
                <Icon name="heroicons:check" class="w-4 h-4 mr-2" />
                Publicar Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
