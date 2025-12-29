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

// Logo upload state
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isUploading = ref(false)
const uploadError = ref('')
const showManualUrl = ref(false)

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

// Logo upload handlers
function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

async function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false

  const file = e.dataTransfer?.files[0]
  if (file) {
    await uploadLogo(file)
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    uploadLogo(file)
  }
  // Reset input so same file can be selected again
  input.value = ''
}

async function uploadLogo(file: File) {
  // Client-side validation
  const maxSize = 2 * 1024 * 1024 // 2MB
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']

  if (file.size > maxSize) {
    uploadError.value = 'El archivo es muy grande. Máximo 2MB.'
    return
  }

  if (!allowedTypes.includes(file.type)) {
    uploadError.value = 'Tipo de archivo no válido. Usa PNG, JPG, WebP o SVG.'
    return
  }

  uploadError.value = ''
  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('logo', file)

    const response = await $fetch<{ success: boolean, url: string }>('/api/tenants/logo', {
      method: 'POST',
      body: formData,
    })

    if (response.success && response.url) {
      branding.logoUrl = response.url
    }
  }
  catch (e: any) {
    uploadError.value = e?.data?.message || 'Error al subir el logo'
  }
  finally {
    isUploading.value = false
  }
}

function removeLogo() {
  branding.logoUrl = ''
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
              <!-- Upload error -->
              <div
                v-if="uploadError"
                class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {{ uploadError }}
              </div>

              <!-- File upload zone -->
              <div
                class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
                :class="[
                  isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400',
                  isUploading ? 'opacity-50 pointer-events-none' : '',
                ]"
                @dragover="handleDragOver"
                @dragleave="handleDragLeave"
                @drop="handleDrop"
              >
                <input
                  ref="fileInput"
                  type="file"
                  class="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  @change="handleFileSelect"
                >

                <!-- Current logo preview -->
                <div
                  v-if="branding.logoUrl"
                  class="mb-4"
                >
                  <img
                    :src="branding.logoUrl"
                    alt="Logo actual"
                    class="max-h-16 mx-auto object-contain"
                    @error="branding.logoUrl = ''"
                  >
                </div>

                <!-- Upload icon -->
                <div
                  v-else
                  class="mb-4"
                >
                  <Icon
                    name="heroicons:photo"
                    class="w-12 h-12 mx-auto text-gray-400"
                  />
                </div>

                <!-- Upload button -->
                <div class="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    class="btn-secondary"
                    :disabled="isUploading"
                    @click="fileInput?.click()"
                  >
                    <Icon
                      v-if="isUploading"
                      name="heroicons:arrow-path"
                      class="w-4 h-4 mr-2 animate-spin"
                    />
                    {{ branding.logoUrl ? 'Cambiar Logo' : 'Subir Logo' }}
                  </button>

                  <button
                    v-if="branding.logoUrl"
                    type="button"
                    class="btn-ghost text-red-600 hover:text-red-700"
                    @click="removeLogo"
                  >
                    <Icon
                      name="heroicons:trash"
                      class="w-4 h-4"
                    />
                  </button>
                </div>

                <p class="text-sm text-gray-500 mt-3">
                  Arrastra una imagen o haz clic para seleccionar
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  PNG, JPG, WebP o SVG. Máximo 2MB. Recomendado: 200x50px
                </p>
              </div>

              <!-- Manual URL option -->
              <div>
                <button
                  type="button"
                  class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  @click="showManualUrl = !showManualUrl"
                >
                  <Icon
                    :name="showManualUrl ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
                    class="w-4 h-4"
                  />
                  Usar URL externa
                </button>

                <div
                  v-if="showManualUrl"
                  class="mt-3"
                >
                  <input
                    id="logoUrl"
                    v-model="branding.logoUrl"
                    type="url"
                    class="input"
                    placeholder="https://example.com/logo.png"
                  >
                </div>
              </div>

              <!-- Favicon -->
              <div class="pt-4 border-t border-gray-100">
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
