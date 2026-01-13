<script setup lang="ts">
const isOpen = ref(false)
const isSubmitting = ref(false)
const isSubmitted = ref(false)

const form = reactive({
  type: 'feedback' as 'feedback' | 'bug' | 'feature',
  message: '',
  email: '',
})

const { user } = useAuth()

// Pre-fill email if user is logged in
watchEffect(() => {
  if (user.value?.email) {
    form.email = user.value.email
  }
})

async function handleSubmit() {
  if (!form.message.trim()) return

  isSubmitting.value = true

  try {
    await $fetch('/api/feedback', {
      method: 'POST',
      body: {
        type: form.type,
        message: form.message,
        email: form.email,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    })

    isSubmitted.value = true
    setTimeout(() => {
      isOpen.value = false
      // Reset after close animation
      setTimeout(() => {
        isSubmitted.value = false
        form.message = ''
        form.type = 'feedback'
      }, 300)
    }, 2000)
  }
  catch (e) {
    console.error('Failed to submit feedback:', e)
  }
  finally {
    isSubmitting.value = false
  }
}

const typeOptions = [
  { value: 'feedback', label: 'Feedback', icon: 'heroicons:chat-bubble-left-ellipsis' },
  { value: 'bug', label: 'Bug', icon: 'heroicons:bug-ant' },
  { value: 'feature', label: 'Feature', icon: 'heroicons:light-bulb' },
]
</script>

<template>
  <!-- Floating Button -->
  <button
    type="button"
    class="fixed bottom-6 right-6 z-40 w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
    title="Enviar feedback"
    @click="isOpen = true"
  >
    <Icon name="heroicons:chat-bubble-bottom-center-text" class="w-6 h-6" />
  </button>

  <!-- Modal -->
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
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm"
          @click="isOpen = false"
        />

        <!-- Modal -->
        <div class="flex min-h-full items-end sm:items-center justify-center p-4">
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-4"
          >
            <div
              v-if="isOpen"
              class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl"
            >
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Icon name="heroicons:chat-bubble-bottom-center-text" class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900">
                      Enviar Feedback
                    </h2>
                    <p class="text-sm text-gray-500">
                      Tu opinion nos ayuda a mejorar
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  @click="isOpen = false"
                >
                  <Icon name="heroicons:x-mark" class="w-5 h-5" />
                </button>
              </div>

              <!-- Content -->
              <div class="px-6 py-5">
                <!-- Success State -->
                <div
                  v-if="isSubmitted"
                  class="py-8 text-center"
                >
                  <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <Icon name="heroicons:check" class="w-8 h-8 text-green-600" />
                  </div>
                  <p class="text-lg font-semibold text-gray-900">Gracias!</p>
                  <p class="text-gray-500 mt-1">Recibimos tu feedback</p>
                </div>

                <!-- Form -->
                <form
                  v-else
                  class="space-y-4"
                  @submit.prevent="handleSubmit"
                >
                  <!-- Type selector -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Tipo
                    </label>
                    <div class="flex gap-2">
                      <button
                        v-for="option in typeOptions"
                        :key="option.value"
                        type="button"
                        :class="[
                          'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                          form.type === option.value
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300',
                        ]"
                        @click="form.type = option.value as typeof form.type"
                      >
                        <Icon :name="option.icon" class="w-4 h-4" />
                        {{ option.label }}
                      </button>
                    </div>
                  </div>

                  <!-- Message -->
                  <div>
                    <label
                      for="feedback-message"
                      class="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Mensaje
                    </label>
                    <textarea
                      id="feedback-message"
                      v-model="form.message"
                      rows="4"
                      required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                      placeholder="Cuentanos que piensas..."
                    />
                  </div>

                  <!-- Email (optional if not logged in) -->
                  <div v-if="!user">
                    <label
                      for="feedback-email"
                      class="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email (opcional)
                    </label>
                    <input
                      id="feedback-email"
                      v-model="form.email"
                      type="email"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="tu@email.com"
                    >
                    <p class="text-xs text-gray-500 mt-1">
                      Para que podamos responderte
                    </p>
                  </div>

                  <!-- Submit -->
                  <button
                    type="submit"
                    :disabled="isSubmitting || !form.message.trim()"
                    class="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span v-if="isSubmitting">Enviando...</span>
                    <span v-else>Enviar feedback</span>
                  </button>
                </form>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
