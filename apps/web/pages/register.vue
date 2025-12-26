<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: 'Start Free Trial - TamarindoReports',
})

const form = reactive({
  name: '',
  email: '',
  password: '',
  agencyName: '',
})

const isLoading = ref(false)
const error = ref('')

async function handleSubmit() {
  isLoading.value = true
  error.value = ''

  try {
    // TODO: Implement registration
    console.log('Register:', form)
    await navigateTo('/demo') // Temporary redirect to demo tenant
  }
  catch (e) {
    error.value = 'Something went wrong. Please try again.'
  }
  finally {
    isLoading.value = false
  }
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
          <h1 class="text-2xl font-bold text-gray-900 text-center mb-2">
            Start your free trial
          </h1>
          <p class="text-gray-600 text-center mb-6">
            14 days free. No credit card required.
          </p>

          <!-- Error message -->
          <div
            v-if="error"
            class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          >
            {{ error }}
          </div>

          <form
            class="space-y-4"
            @submit.prevent="handleSubmit"
          >
            <div>
              <label
                for="name"
                class="label"
              >Your name</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                class="input"
                placeholder="John Doe"
              >
            </div>

            <div>
              <label
                for="agencyName"
                class="label"
              >Agency name</label>
              <input
                id="agencyName"
                v-model="form.agencyName"
                type="text"
                required
                class="input"
                placeholder="Awesome Agency"
              >
            </div>

            <div>
              <label
                for="email"
                class="label"
              >Work email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                class="input"
                placeholder="you@agency.com"
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
                minlength="8"
                class="input"
                placeholder="Min. 8 characters"
              >
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="btn-primary w-full"
            >
              <span v-if="isLoading">Creating account...</span>
              <span v-else>Create account</span>
            </button>

            <p class="text-xs text-gray-500 text-center">
              By signing up, you agree to our
              <NuxtLink
                to="/terms"
                class="text-tamarindo-600 hover:underline"
              >Terms of Service</NuxtLink>
              and
              <NuxtLink
                to="/privacy"
                class="text-tamarindo-600 hover:underline"
              >Privacy Policy</NuxtLink>.
            </p>
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
            <button class="btn-outline">
              <Icon
                name="logos:google-icon"
                class="w-5 h-5 mr-2"
              />
              Google
            </button>
            <button class="btn-outline">
              <Icon
                name="logos:facebook"
                class="w-5 h-5 mr-2"
              />
              Facebook
            </button>
          </div>
        </div>
      </div>

      <!-- Login link -->
      <p class="mt-4 text-center text-sm text-gray-600">
        Already have an account?
        <NuxtLink
          to="/login"
          class="text-tamarindo-600 hover:text-tamarindo-500 font-medium"
        >
          Sign in
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
