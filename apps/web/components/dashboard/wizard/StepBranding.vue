<script setup lang="ts">
import { ref } from 'vue'
import type { BrandingConfig } from '../../../types/dashboard-wizard'

interface Client {
  id: string
  name: string
}

interface ColorPalette {
  name: string
  primary: string
  secondary: string
}

interface Props {
  branding: BrandingConfig
  dashboardName: string
  isPublic: boolean
  password?: string
  clients: Client[]
  colorPalettes: ColorPalette[]
  isLoadingClients?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectClient: [clientId: string, clientName: string]
  setColors: [primary: string, secondary: string]
  setLogoUrl: [url: string]
  setDashboardName: [name: string]
  setPublic: [isPublic: boolean]
  setPassword: [password: string | undefined]
  extractColors: [file: File]
}>()

const logoInputRef = ref<HTMLInputElement | null>(null)
const isExtractingColors = ref(false)
const showCustomColors = ref(false)

function handleClientChange(event: Event) {
  const select = event.target as HTMLSelectElement
  const client = props.clients.find(c => c.id === select.value)
  if (client) {
    emit('selectClient', client.id, client.name)
  }
}

function handlePaletteSelect(palette: ColorPalette) {
  emit('setColors', palette.primary, palette.secondary)
  showCustomColors.value = false
}

function handleCustomColorChange(type: 'primary' | 'secondary', event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (type === 'primary') {
    emit('setColors', value, props.branding.secondaryColor)
  }
  else {
    emit('setColors', props.branding.primaryColor, value)
  }
}

function handleLogoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    isExtractingColors.value = true
    emit('extractColors', file)

    // Create preview URL
    const url = URL.createObjectURL(file)
    emit('setLogoUrl', url)

    // Reset extracting state after a delay (actual extraction happens in parent)
    setTimeout(() => {
      isExtractingColors.value = false
    }, 1500)
  }
}

function triggerLogoUpload() {
  logoInputRef.value?.click()
}

function clearLogo() {
  emit('setLogoUrl', '')
  if (logoInputRef.value) {
    logoInputRef.value.value = ''
  }
}

const isPaletteSelected = (palette: ColorPalette) =>
  props.branding.primaryColor === palette.primary
  && props.branding.secondaryColor === palette.secondary
</script>

<template>
  <div class="space-y-8">
    <div class="text-center max-w-xl mx-auto">
      <h2 class="text-xl font-semibold text-gray-900">
        Personalize your dashboard
      </h2>
      <p class="mt-2 text-gray-600">
        Select a client and customize the visual appearance to match their brand.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Left Column: Form -->
      <div class="space-y-6">
        <!-- Client Selection -->
        <div>
          <label
            for="client"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            Client
          </label>
          <select
            id="client"
            class="select w-full"
            :value="branding.clientId"
            @change="handleClientChange"
          >
            <option
              value=""
              disabled
            >
              Select a client
            </option>
            <option
              v-for="client in clients"
              :key="client.id"
              :value="client.id"
            >
              {{ client.name }}
            </option>
          </select>
          <p
            v-if="isLoadingClients"
            class="mt-1 text-sm text-gray-500"
          >
            Loading clients...
          </p>
        </div>

        <!-- Dashboard Name -->
        <div>
          <label
            for="dashboardName"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            Dashboard Name
          </label>
          <input
            id="dashboardName"
            type="text"
            class="input w-full"
            :value="dashboardName"
            placeholder="e.g., Q1 Performance Report"
            @input="emit('setDashboardName', ($event.target as HTMLInputElement).value)"
          >
        </div>

        <!-- Logo Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Client Logo (Optional)
          </label>
          <div class="flex items-center gap-4">
            <div
              v-if="branding.logoUrl"
              class="relative w-16 h-16 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden"
            >
              <img
                :src="branding.logoUrl"
                alt="Logo"
                class="max-w-full max-h-full object-contain"
              >
              <button
                type="button"
                class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700"
                @click="clearLogo"
              >
                <Icon
                  name="heroicons:x-mark"
                  class="w-3 h-3"
                />
              </button>
            </div>

            <button
              type="button"
              class="btn-secondary"
              @click="triggerLogoUpload"
            >
              <Icon
                v-if="isExtractingColors"
                name="heroicons:arrow-path"
                class="w-4 h-4 mr-2 animate-spin"
              />
              <Icon
                v-else
                name="heroicons:arrow-up-tray"
                class="w-4 h-4 mr-2"
              />
              {{ branding.logoUrl ? 'Change Logo' : 'Upload Logo' }}
            </button>
            <input
              ref="logoInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleLogoUpload"
            >
          </div>
          <p class="mt-1 text-xs text-gray-500">
            Upload a logo to automatically extract brand colors
          </p>
        </div>

        <!-- Color Palettes -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700">
              Color Theme
            </label>
            <button
              type="button"
              class="text-sm text-gray-600 hover:text-gray-900"
              @click="showCustomColors = !showCustomColors"
            >
              {{ showCustomColors ? 'Use preset' : 'Custom colors' }}
            </button>
          </div>

          <!-- Preset Palettes -->
          <div
            v-if="!showCustomColors"
            class="grid grid-cols-3 gap-2"
          >
            <button
              v-for="palette in colorPalettes"
              :key="palette.name"
              type="button"
              class="p-3 rounded-lg border-2 transition-all duration-150"
              :class="[
                isPaletteSelected(palette)
                  ? 'border-gray-900 ring-1 ring-gray-900'
                  : 'border-gray-200 hover:border-gray-300',
              ]"
              @click="handlePaletteSelect(palette)"
            >
              <div class="flex items-center gap-2 mb-2">
                <div
                  class="w-5 h-5 rounded-full"
                  :style="{ backgroundColor: palette.primary }"
                />
                <div
                  class="w-5 h-5 rounded-full"
                  :style="{ backgroundColor: palette.secondary }"
                />
              </div>
              <p class="text-xs font-medium text-gray-700 text-left">
                {{ palette.name }}
              </p>
            </button>
          </div>

          <!-- Custom Colors -->
          <div
            v-else
            class="grid grid-cols-2 gap-4"
          >
            <div>
              <label class="block text-xs text-gray-500 mb-1">Primary</label>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  :value="branding.primaryColor"
                  class="w-10 h-10 rounded cursor-pointer"
                  @input="handleCustomColorChange('primary', $event)"
                >
                <input
                  type="text"
                  :value="branding.primaryColor"
                  class="input flex-1 text-sm font-mono"
                  @input="handleCustomColorChange('primary', $event)"
                >
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Secondary</label>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  :value="branding.secondaryColor"
                  class="w-10 h-10 rounded cursor-pointer"
                  @input="handleCustomColorChange('secondary', $event)"
                >
                <input
                  type="text"
                  :value="branding.secondaryColor"
                  class="input flex-1 text-sm font-mono"
                  @input="handleCustomColorChange('secondary', $event)"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Visibility Settings -->
        <div class="pt-4 border-t border-gray-200">
          <div class="flex items-center gap-3">
            <input
              id="isPublic"
              type="checkbox"
              :checked="isPublic"
              class="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              @change="emit('setPublic', ($event.target as HTMLInputElement).checked)"
            >
            <label
              for="isPublic"
              class="text-sm text-gray-700"
            >
              Make dashboard publicly accessible
            </label>
          </div>

          <div
            v-if="isPublic"
            class="mt-4"
          >
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Password Protection (Optional)
            </label>
            <input
              id="password"
              type="password"
              class="input w-full"
              :value="password"
              placeholder="Leave empty for no password"
              @input="emit('setPassword', ($event.target as HTMLInputElement).value || undefined)"
            >
          </div>
        </div>
      </div>

      <!-- Right Column: Preview Card -->
      <div class="lg:sticky lg:top-4">
        <div class="bg-gray-50 rounded-xl p-6">
          <h3 class="text-sm font-medium text-gray-500 mb-4">
            Preview
          </h3>

          <!-- Mini Dashboard Preview -->
          <div
            class="bg-white rounded-lg border border-gray-200 overflow-hidden"
            :style="{ '--preview-primary': branding.primaryColor, '--preview-secondary': branding.secondaryColor } as any"
          >
            <!-- Header -->
            <div
              class="px-4 py-3 border-b border-gray-100"
              :style="{ backgroundColor: branding.secondaryColor }"
            >
              <div class="flex items-center gap-3">
                <div
                  v-if="branding.logoUrl"
                  class="w-8 h-8 rounded bg-white/20 flex items-center justify-center overflow-hidden"
                >
                  <img
                    :src="branding.logoUrl"
                    alt=""
                    class="max-w-full max-h-full object-contain"
                  >
                </div>
                <div
                  v-else
                  class="w-8 h-8 rounded bg-white/20"
                />
                <div>
                  <p class="text-sm font-medium text-white truncate">
                    {{ dashboardName || 'Dashboard Name' }}
                  </p>
                  <p class="text-xs text-white/70">
                    {{ branding.clientName || 'Client Name' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Content Preview -->
            <div class="p-4 space-y-3">
              <!-- Metric Cards -->
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="n in 3"
                  :key="n"
                  class="p-3 rounded-lg"
                  :style="{ backgroundColor: `${branding.primaryColor}10` }"
                >
                  <div class="h-2 w-8 rounded bg-gray-200 mb-2" />
                  <div
                    class="h-4 w-12 rounded"
                    :style="{ backgroundColor: branding.primaryColor }"
                  />
                </div>
              </div>

              <!-- Chart placeholder -->
              <div class="h-24 rounded-lg bg-gray-50 border border-gray-100 flex items-end justify-center gap-1 p-3">
                <div
                  v-for="(height, i) in [40, 60, 45, 80, 55, 70, 50]"
                  :key="i"
                  class="w-4 rounded-t"
                  :style="{
                    height: `${height}%`,
                    backgroundColor: i % 2 === 0 ? branding.primaryColor : `${branding.primaryColor}60`,
                  }"
                />
              </div>
            </div>
          </div>

          <p class="mt-4 text-xs text-gray-500 text-center">
            This is a simplified preview. The actual dashboard will include your selected metrics.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
