<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Branding Settings',
  middleware: ['tenant'],
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)

const settingsNav = computed(() => [
  { name: 'Profile', href: `/${tenant.value}/settings`, icon: 'heroicons:user-circle', current: false },
  { name: 'Agency', href: `/${tenant.value}/settings/agency`, icon: 'heroicons:building-office', current: false },
  { name: 'Branding', href: `/${tenant.value}/settings/branding`, icon: 'heroicons:paint-brush', current: true },
  { name: 'Team', href: `/${tenant.value}/settings/team`, icon: 'heroicons:users', current: false },
  { name: 'Billing', href: `/${tenant.value}/settings/billing`, icon: 'heroicons:credit-card', current: false },
])

// Branding state
const branding = reactive({
  primaryColor: '#f97316',
  secondaryColor: '#1f2937',
  logoUrl: '',
  companyName: '',
  tagline: '',
  favicon: '',
})

const isLoading = ref(true)
const isSaving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')

// Predefined color palettes
const colorPalettes = [
  { name: 'Tamarindo', primary: '#f97316', secondary: '#1f2937' },
  { name: 'Ocean', primary: '#0ea5e9', secondary: '#0f172a' },
  { name: 'Forest', primary: '#22c55e', secondary: '#14532d' },
  { name: 'Sunset', primary: '#f43f5e', secondary: '#881337' },
  { name: 'Purple', primary: '#a855f7', secondary: '#3b0764' },
  { name: 'Gold', primary: '#eab308', secondary: '#422006' },
]

// Fetch current branding
onMounted(async () => {
  try {
    const response = await $fetch<{ tenant: any }>(`/api/tenants/${tenant.value}`)
    const tenantData = response.tenant

    if (tenantData.branding) {
      const b = tenantData.branding as any
      branding.primaryColor = b.primaryColor || '#f97316'
      branding.secondaryColor = b.secondaryColor || '#1f2937'
      branding.logoUrl = b.logoUrl || ''
      branding.companyName = b.companyName || tenantData.name
      branding.tagline = b.tagline || ''
      branding.favicon = b.favicon || ''
    }
    else {
      branding.companyName = tenantData.name
    }
  }
  catch (e) {
    console.error('Failed to fetch branding:', e)
  }
  finally {
    isLoading.value = false
  }
})

function applyPalette(palette: typeof colorPalettes[0]) {
  branding.primaryColor = palette.primary
  branding.secondaryColor = palette.secondary
}

async function handleSave() {
  isSaving.value = true
  saveError.value = ''
  saveSuccess.value = false

  try {
    await $fetch(`/api/tenants/branding`, {
      method: 'PUT',
      body: {
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        logoUrl: branding.logoUrl,
        companyName: branding.companyName,
        tagline: branding.tagline,
        favicon: branding.favicon,
      },
    })

    saveSuccess.value = true
    setTimeout(() => saveSuccess.value = false, 3000)
  }
  catch (e: any) {
    saveError.value = e?.data?.message || 'Failed to save branding'
  }
  finally {
    isSaving.value = false
  }
}

// Preview computed styles
const previewStyles = computed(() => ({
  '--preview-primary': branding.primaryColor,
  '--preview-secondary': branding.secondaryColor,
}))
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
        <!-- Loading -->
        <div
          v-if="isLoading"
          class="flex items-center justify-center py-12"
        >
          <Icon
            name="heroicons:arrow-path"
            class="w-8 h-8 animate-spin text-gray-400"
          />
        </div>

        <template v-else>
          <!-- Success message -->
          <div
            v-if="saveSuccess"
            class="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
          >
            Branding settings saved successfully!
          </div>

          <!-- Error message -->
          <div
            v-if="saveError"
            class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            {{ saveError }}
          </div>

          <!-- Company Info -->
          <div class="card">
            <div class="card-header">
              <h2 class="font-semibold text-gray-900">
                Company Information
              </h2>
            </div>
            <div class="card-body space-y-4">
              <div>
                <label
                  for="companyName"
                  class="label"
                >Company Name</label>
                <input
                  id="companyName"
                  v-model="branding.companyName"
                  type="text"
                  class="input"
                  placeholder="Your Agency Name"
                >
              </div>

              <div>
                <label
                  for="tagline"
                  class="label"
                >Tagline</label>
                <input
                  id="tagline"
                  v-model="branding.tagline"
                  type="text"
                  class="input"
                  placeholder="Your agency's tagline"
                >
              </div>
            </div>
          </div>

          <!-- Logo -->
          <div class="card">
            <div class="card-header">
              <h2 class="font-semibold text-gray-900">
                Logo
              </h2>
            </div>
            <div class="card-body space-y-4">
              <div>
                <label
                  for="logoUrl"
                  class="label"
                >Logo URL</label>
                <input
                  id="logoUrl"
                  v-model="branding.logoUrl"
                  type="url"
                  class="input"
                  placeholder="https://example.com/logo.png"
                >
                <p class="mt-1 text-xs text-gray-500">
                  Enter a URL to your logo image. Recommended size: 200x50px
                </p>
              </div>

              <!-- Logo preview -->
              <div
                v-if="branding.logoUrl"
                class="p-4 bg-gray-50 rounded-lg"
              >
                <p class="text-xs text-gray-500 mb-2">
                  Preview:
                </p>
                <img
                  :src="branding.logoUrl"
                  alt="Logo preview"
                  class="max-h-12 object-contain"
                  @error="branding.logoUrl = ''"
                >
              </div>

              <div>
                <label
                  for="favicon"
                  class="label"
                >Favicon URL</label>
                <input
                  id="favicon"
                  v-model="branding.favicon"
                  type="url"
                  class="input"
                  placeholder="https://example.com/favicon.ico"
                >
              </div>
            </div>
          </div>

          <!-- Colors -->
          <div class="card">
            <div class="card-header">
              <h2 class="font-semibold text-gray-900">
                Brand Colors
              </h2>
            </div>
            <div class="card-body space-y-6">
              <!-- Quick palettes -->
              <div>
                <p class="text-sm text-gray-600 mb-3">
                  Quick color palettes:
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="palette in colorPalettes"
                    :key="palette.name"
                    class="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    @click="applyPalette(palette)"
                  >
                    <div class="flex">
                      <div
                        class="w-4 h-4 rounded-l"
                        :style="{ backgroundColor: palette.primary }"
                      />
                      <div
                        class="w-4 h-4 rounded-r"
                        :style="{ backgroundColor: palette.secondary }"
                      />
                    </div>
                    <span class="text-sm text-gray-700">{{ palette.name }}</span>
                  </button>
                </div>
              </div>

              <!-- Custom colors -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    for="primaryColor"
                    class="label"
                  >Primary Color</label>
                  <div class="flex gap-2">
                    <input
                      id="primaryColor"
                      v-model="branding.primaryColor"
                      type="color"
                      class="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    >
                    <input
                      v-model="branding.primaryColor"
                      type="text"
                      class="input flex-1"
                      placeholder="#f97316"
                    >
                  </div>
                </div>

                <div>
                  <label
                    for="secondaryColor"
                    class="label"
                  >Secondary Color</label>
                  <div class="flex gap-2">
                    <input
                      id="secondaryColor"
                      v-model="branding.secondaryColor"
                      type="color"
                      class="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    >
                    <input
                      v-model="branding.secondaryColor"
                      type="text"
                      class="input flex-1"
                      placeholder="#1f2937"
                    >
                  </div>
                </div>
              </div>

              <!-- Preview -->
              <div>
                <p class="text-sm text-gray-600 mb-3">
                  Preview:
                </p>
                <div
                  class="p-6 rounded-lg border border-gray-200"
                  :style="previewStyles"
                >
                  <div class="flex items-center gap-4 mb-4">
                    <div
                      v-if="branding.logoUrl"
                      class="h-8"
                    >
                      <img
                        :src="branding.logoUrl"
                        alt="Logo"
                        class="h-full object-contain"
                      >
                    </div>
                    <div v-else>
                      <p
                        class="text-xl font-bold"
                        :style="{ color: branding.primaryColor }"
                      >
                        {{ branding.companyName || 'Your Agency' }}
                      </p>
                    </div>
                  </div>

                  <div class="flex gap-3">
                    <button
                      class="px-4 py-2 rounded-lg text-white font-medium"
                      :style="{ backgroundColor: branding.primaryColor }"
                    >
                      Primary Button
                    </button>
                    <button
                      class="px-4 py-2 rounded-lg text-white font-medium"
                      :style="{ backgroundColor: branding.secondaryColor }"
                    >
                      Secondary Button
                    </button>
                  </div>

                  <p
                    v-if="branding.tagline"
                    class="mt-4 text-sm"
                    :style="{ color: branding.secondaryColor }"
                  >
                    {{ branding.tagline }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Save button -->
          <div class="flex justify-end">
            <button
              class="btn-primary"
              :disabled="isSaving"
              @click="handleSave"
            >
              <Icon
                v-if="isSaving"
                name="heroicons:arrow-path"
                class="w-5 h-5 mr-2 animate-spin"
              />
              {{ isSaving ? 'Saving...' : 'Save Branding' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
