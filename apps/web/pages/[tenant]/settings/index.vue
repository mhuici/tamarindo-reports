<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Settings',
  middleware: ['tenant'],
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)
const { user } = useAuth()

const settingsNav = computed(() => [
  { name: 'Profile', href: `/${tenant.value}/settings`, icon: 'heroicons:user-circle', current: true },
  { name: 'Agency', href: `/${tenant.value}/settings/agency`, icon: 'heroicons:building-office', current: false },
  { name: 'Branding', href: `/${tenant.value}/settings/branding`, icon: 'heroicons:paint-brush', current: false },
  { name: 'Team', href: `/${tenant.value}/settings/team`, icon: 'heroicons:users', current: false },
  { name: 'Billing', href: `/${tenant.value}/settings/billing`, icon: 'heroicons:credit-card', current: false },
])

const profileForm = reactive({
  name: user.value?.name || '',
  email: user.value?.email || '',
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const isSavingProfile = ref(false)
const isSavingPassword = ref(false)
const profileSuccess = ref(false)
const passwordSuccess = ref(false)
const profileError = ref('')
const passwordError = ref('')

async function handleSaveProfile() {
  isSavingProfile.value = true
  profileError.value = ''
  profileSuccess.value = false

  try {
    await $fetch('/api/auth/profile', {
      method: 'PUT',
      body: {
        name: profileForm.name,
      },
    })
    profileSuccess.value = true
    setTimeout(() => profileSuccess.value = false, 3000)
  }
  catch (e: any) {
    profileError.value = e?.data?.message || 'Failed to update profile'
  }
  finally {
    isSavingProfile.value = false
  }
}

async function handleChangePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'Passwords do not match'
    return
  }

  if (passwordForm.newPassword.length < 8) {
    passwordError.value = 'Password must be at least 8 characters'
    return
  }

  isSavingPassword.value = true
  passwordError.value = ''
  passwordSuccess.value = false

  try {
    await $fetch('/api/auth/password', {
      method: 'PUT',
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      },
    })
    passwordSuccess.value = true
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    setTimeout(() => passwordSuccess.value = false, 3000)
  }
  catch (e: any) {
    passwordError.value = e?.data?.message || 'Failed to change password'
  }
  finally {
    isSavingPassword.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Settings
      </h1>
      <p class="text-gray-600">
        Manage your account and agency settings.
      </p>
    </div>

    <div class="flex gap-8">
      <!-- Sidebar -->
      <nav class="w-48 flex-shrink-0">
        <ul class="space-y-1">
          <li
            v-for="item in settingsNav"
            :key="item.name"
          >
            <NuxtLink
              :to="item.href"
              :class="[
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                item.current
                  ? 'bg-tamarindo-50 text-tamarindo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              ]"
            >
              <Icon
                :name="item.icon"
                class="w-5 h-5"
              />
              {{ item.name }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- Content -->
      <div class="flex-1 space-y-6">
        <!-- Profile Card -->
        <div class="card">
          <div class="card-header">
            <h2 class="font-semibold text-gray-900">
              Profile Information
            </h2>
          </div>
          <div class="card-body">
            <!-- Success message -->
            <div
              v-if="profileSuccess"
              class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
            >
              Profile updated successfully!
            </div>

            <!-- Error message -->
            <div
              v-if="profileError"
              class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {{ profileError }}
            </div>

            <form
              class="space-y-4"
              @submit.prevent="handleSaveProfile"
            >
              <!-- Avatar -->
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-full bg-tamarindo-100 flex items-center justify-center">
                  <span class="text-2xl font-semibold text-tamarindo-700">
                    {{ user?.name?.charAt(0)?.toUpperCase() || 'U' }}
                  </span>
                </div>
                <div>
                  <p class="font-medium text-gray-900">
                    {{ user?.name }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ user?.role }}
                  </p>
                </div>
              </div>

              <div>
                <label
                  for="name"
                  class="label"
                >Full Name</label>
                <input
                  id="name"
                  v-model="profileForm.name"
                  type="text"
                  class="input"
                  required
                >
              </div>

              <div>
                <label
                  for="email"
                  class="label"
                >Email</label>
                <input
                  id="email"
                  v-model="profileForm.email"
                  type="email"
                  class="input bg-gray-50"
                  disabled
                >
                <p class="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              <div class="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  :disabled="isSavingProfile"
                  class="btn-primary"
                >
                  <Icon
                    v-if="isSavingProfile"
                    name="heroicons:arrow-path"
                    class="w-5 h-5 mr-2 animate-spin"
                  />
                  {{ isSavingProfile ? 'Saving...' : 'Save Profile' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Password Card -->
        <div class="card">
          <div class="card-header">
            <h2 class="font-semibold text-gray-900">
              Change Password
            </h2>
          </div>
          <div class="card-body">
            <!-- Success message -->
            <div
              v-if="passwordSuccess"
              class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
            >
              Password changed successfully!
            </div>

            <!-- Error message -->
            <div
              v-if="passwordError"
              class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {{ passwordError }}
            </div>

            <form
              class="space-y-4"
              @submit.prevent="handleChangePassword"
            >
              <div>
                <label
                  for="currentPassword"
                  class="label"
                >Current Password</label>
                <input
                  id="currentPassword"
                  v-model="passwordForm.currentPassword"
                  type="password"
                  class="input"
                  required
                >
              </div>

              <div>
                <label
                  for="newPassword"
                  class="label"
                >New Password</label>
                <input
                  id="newPassword"
                  v-model="passwordForm.newPassword"
                  type="password"
                  class="input"
                  required
                  minlength="8"
                >
              </div>

              <div>
                <label
                  for="confirmPassword"
                  class="label"
                >Confirm New Password</label>
                <input
                  id="confirmPassword"
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  class="input"
                  required
                >
              </div>

              <div class="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  :disabled="isSavingPassword"
                  class="btn-primary"
                >
                  <Icon
                    v-if="isSavingPassword"
                    name="heroicons:arrow-path"
                    class="w-5 h-5 mr-2 animate-spin"
                  />
                  {{ isSavingPassword ? 'Changing...' : 'Change Password' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
