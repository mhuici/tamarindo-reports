<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: 'Login - TamarindoReports',
})

const { login, isAuthenticated } = useAuth()

// Redirect if already authenticated
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    const redirect = useRoute().query.redirect as string
    navigateTo(redirect || '/demo')
  }
}, { immediate: true })

const form = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)
const error = ref('')

async function handleSubmit() {
  isLoading.value = true
  error.value = ''

  const result = await login({
    email: form.email,
    password: form.password,
  })

  if (result.success) {
    // Fetch user to get tenant slug
    const { user } = useAuth()
    const tenantSlug = user.value?.tenantSlug || 'demo'
    await navigateTo(`/${tenantSlug}`)
  }
  else {
    error.value = result.error || 'Invalid email or password'
  }

  isLoading.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-3"
        >
          <div class="w-10 h-10 rounded-lg bg-tamarindo-500 flex items-center justify-center">
            <span class="text-white font-bold">T</span>
          </div>
          <span class="text-xl font-semibold text-gray-900">TamarindoReports</span>
        </NuxtLink>
      </div>

      <!-- Card -->
      <div class="card">
        <div class="card-body">
          <h1 class="text-2xl font-bold text-gray-900 text-center mb-6">
            Sign in to your account
          </h1>

          <!-- Error message -->
          <div
            v-if="error"
            class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          >
            {{ error }}
          </div>

          <!-- Demo credentials hint -->
          <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            <strong>Demo:</strong> admin@demo.agency / demo123
          </div>

          <form
            class="space-y-4"
            @submit.prevent="handleSubmit"
          >
            <div>
              <label
                for="email"
                class="label"
              >Email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                class="input"
                placeholder="you@example.com"
              >
            </div>

            <div>
              <label
                for="password"
                class="label"
              >Password</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                required
                class="input"
                placeholder="••••••••"
              >
            </div>

            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  class="rounded border-gray-300 text-tamarindo-500 focus:ring-tamarindo-500"
                >
                <span class="text-gray-600">Remember me</span>
              </label>
              <NuxtLink
                to="/forgot-password"
                class="text-sm text-tamarindo-600 hover:text-tamarindo-500"
              >
                Forgot password?
              </NuxtLink>
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="btn-primary w-full"
            >
              <Icon
                v-if="isLoading"
                name="heroicons:arrow-path"
                class="w-5 h-5 mr-2 animate-spin"
              />
              <span v-if="isLoading">Signing in...</span>
              <span v-else>Sign in</span>
            </button>
          </form>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <!-- Social login -->
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="btn-outline"
              disabled
            >
              <Icon
                name="logos:google-icon"
                class="w-5 h-5 mr-2"
              />
              Google
            </button>
            <button
              type="button"
              class="btn-outline"
              disabled
            >
              <Icon
                name="logos:facebook"
                class="w-5 h-5 mr-2"
              />
              Facebook
            </button>
          </div>
        </div>
      </div>

      <!-- Register link -->
      <p class="mt-4 text-center text-sm text-gray-600">
        Don't have an account?
        <NuxtLink
          to="/register"
          class="text-tamarindo-600 hover:text-tamarindo-500 font-medium"
        >
          Start free trial
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
