<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Settings',
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)

const settingsNav = [
  { name: 'General', href: `/${tenant.value}/settings`, icon: 'heroicons:cog-6-tooth', current: true },
  { name: 'Branding', href: `/${tenant.value}/settings/branding`, icon: 'heroicons:paint-brush', current: false },
  { name: 'Team', href: `/${tenant.value}/settings/team`, icon: 'heroicons:users', current: false },
  { name: 'Billing', href: `/${tenant.value}/settings/billing`, icon: 'heroicons:credit-card', current: false },
]

const form = reactive({
  agencyName: 'Demo Agency',
  email: 'admin@demo.agency',
  timezone: 'America/Mexico_City',
  language: 'es',
})

const isSaving = ref(false)

async function handleSave() {
  isSaving.value = true
  // TODO: Implement save
  await new Promise(resolve => setTimeout(resolve, 1000))
  isSaving.value = false
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
        Manage your agency settings and preferences.
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
      <div class="flex-1">
        <div class="card">
          <div class="card-header">
            <h2 class="font-semibold text-gray-900">
              General Settings
            </h2>
          </div>
          <div class="card-body">
            <form
              class="space-y-6"
              @submit.prevent="handleSave"
            >
              <div>
                <label
                  for="agencyName"
                  class="label"
                >Agency Name</label>
                <input
                  id="agencyName"
                  v-model="form.agencyName"
                  type="text"
                  class="input"
                >
              </div>

              <div>
                <label
                  for="email"
                  class="label"
                >Contact Email</label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  class="input"
                >
              </div>

              <div>
                <label
                  for="timezone"
                  class="label"
                >Timezone</label>
                <select
                  id="timezone"
                  v-model="form.timezone"
                  class="input"
                >
                  <option value="America/Mexico_City">
                    America/Mexico_City (GMT-6)
                  </option>
                  <option value="America/New_York">
                    America/New_York (GMT-5)
                  </option>
                  <option value="America/Los_Angeles">
                    America/Los_Angeles (GMT-8)
                  </option>
                  <option value="Europe/Madrid">
                    Europe/Madrid (GMT+1)
                  </option>
                </select>
              </div>

              <div>
                <label
                  for="language"
                  class="label"
                >Language</label>
                <select
                  id="language"
                  v-model="form.language"
                  class="input"
                >
                  <option value="es">
                    Español
                  </option>
                  <option value="en">
                    English
                  </option>
                  <option value="pt">
                    Português
                  </option>
                </select>
              </div>

              <div class="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  :disabled="isSaving"
                  class="btn-primary"
                >
                  <span v-if="isSaving">Saving...</span>
                  <span v-else>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Danger zone -->
        <div class="card mt-6 border-red-200">
          <div class="card-header bg-red-50">
            <h2 class="font-semibold text-red-700">
              Danger Zone
            </h2>
          </div>
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">
                  Delete Agency
                </p>
                <p class="text-sm text-gray-500">
                  Permanently delete this agency and all its data.
                </p>
              </div>
              <button class="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm font-medium">
                Delete Agency
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
