<script setup lang="ts">
import { ref } from 'vue'
import { useColorExtraction } from '../../composables/useColorExtraction'

interface ColorPalette {
  name: string
  primary: string
  secondary: string
}

interface Props {
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  colorPalettes: ColorPalette[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:logoUrl': [url: string]
  'update:primaryColor': [color: string]
  'update:secondaryColor': [color: string]
  'update:colors': [primary: string, secondary: string]
}>()

const { isExtracting, extractFromFile } = useColorExtraction()
const logoInputRef = ref<HTMLInputElement | null>(null)
const showCustomColors = ref(false)
const isCollapsed = ref(false)

async function handleLogoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Create preview URL immediately
  const url = URL.createObjectURL(file)
  emit('update:logoUrl', url)

  // Extract colors from the logo
  const colors = await extractFromFile(file)
  if (colors) {
    emit('update:colors', colors.primary, colors.secondary)
  }
}

function triggerLogoUpload() {
  logoInputRef.value?.click()
}

function clearLogo() {
  emit('update:logoUrl', '')
  if (logoInputRef.value) {
    logoInputRef.value.value = ''
  }
}

function handlePaletteSelect(palette: ColorPalette) {
  emit('update:colors', palette.primary, palette.secondary)
  showCustomColors.value = false
}

function handleCustomColorChange(type: 'primary' | 'secondary', event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (type === 'primary') {
    emit('update:primaryColor', value)
  } else {
    emit('update:secondaryColor', value)
  }
}

const isPaletteSelected = (palette: ColorPalette) =>
  props.primaryColor === palette.primary && props.secondaryColor === palette.secondary
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Panel Header -->
    <button
      type="button"
      class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      @click="isCollapsed = !isCollapsed"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center"
          :style="{ backgroundColor: `${primaryColor}15` }"
        >
          <Icon
            name="heroicons:paint-brush"
            class="w-4 h-4"
            :style="{ color: primaryColor }"
          />
        </div>
        <div class="text-left">
          <h3 class="text-sm font-medium text-gray-900">
            Branding
          </h3>
          <p class="text-xs text-gray-500">
            Logo and colors
          </p>
        </div>
      </div>
      <Icon
        :name="isCollapsed ? 'heroicons:chevron-down' : 'heroicons:chevron-up'"
        class="w-5 h-5 text-gray-400"
      />
    </button>

    <!-- Panel Content -->
    <div
      v-show="!isCollapsed"
      class="px-4 pb-4 space-y-5 border-t border-gray-100"
    >
      <!-- Logo Upload -->
      <div class="pt-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Logo
        </label>
        <div class="flex items-center gap-4">
          <div
            v-if="logoUrl"
            class="relative w-14 h-14 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden"
          >
            <img
              :src="logoUrl"
              alt="Logo"
              class="max-w-full max-h-full object-contain"
            >
            <button
              type="button"
              class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors"
              title="Remove logo"
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
            class="btn-secondary text-sm"
            :disabled="isExtracting"
            @click="triggerLogoUpload"
          >
            <Icon
              v-if="isExtracting"
              name="heroicons:arrow-path"
              class="w-4 h-4 mr-2 animate-spin"
            />
            <Icon
              v-else
              name="heroicons:arrow-up-tray"
              class="w-4 h-4 mr-2"
            />
            {{ logoUrl ? 'Change' : 'Upload' }}
          </button>
          <input
            ref="logoInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleLogoUpload"
          >
        </div>
        <p class="mt-1.5 text-xs text-gray-500">
          Colors will be auto-extracted from the logo
        </p>
      </div>

      <!-- Color Theme -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-gray-700">
            Colors
          </label>
          <button
            type="button"
            class="text-xs text-gray-500 hover:text-gray-700"
            @click="showCustomColors = !showCustomColors"
          >
            {{ showCustomColors ? 'Presets' : 'Custom' }}
          </button>
        </div>

        <!-- Preset Palettes -->
        <div
          v-if="!showCustomColors"
          class="grid grid-cols-3 gap-1.5"
        >
          <button
            v-for="palette in colorPalettes"
            :key="palette.name"
            type="button"
            class="p-2 rounded-lg border transition-all duration-150"
            :class="[
              isPaletteSelected(palette)
                ? 'border-gray-900 ring-1 ring-gray-900'
                : 'border-gray-200 hover:border-gray-300',
            ]"
            :title="palette.name"
            @click="handlePaletteSelect(palette)"
          >
            <div class="flex items-center justify-center gap-1.5">
              <div
                class="w-5 h-5 rounded-full border border-black/5"
                :style="{ backgroundColor: palette.primary }"
              />
              <div
                class="w-5 h-5 rounded-full border border-black/5"
                :style="{ backgroundColor: palette.secondary }"
              />
            </div>
          </button>
        </div>

        <!-- Custom Colors -->
        <div
          v-else
          class="space-y-3"
        >
          <div class="flex items-center gap-3">
            <input
              type="color"
              :value="primaryColor"
              class="w-9 h-9 rounded cursor-pointer border border-gray-200"
              @input="handleCustomColorChange('primary', $event)"
            >
            <div class="flex-1">
              <label class="block text-xs text-gray-500 mb-0.5">Primary</label>
              <input
                type="text"
                :value="primaryColor"
                class="input w-full text-sm font-mono py-1"
                @input="handleCustomColorChange('primary', $event)"
              >
            </div>
          </div>
          <div class="flex items-center gap-3">
            <input
              type="color"
              :value="secondaryColor"
              class="w-9 h-9 rounded cursor-pointer border border-gray-200"
              @input="handleCustomColorChange('secondary', $event)"
            >
            <div class="flex-1">
              <label class="block text-xs text-gray-500 mb-0.5">Secondary</label>
              <input
                type="text"
                :value="secondaryColor"
                class="input w-full text-sm font-mono py-1"
                @input="handleCustomColorChange('secondary', $event)"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Color Preview -->
      <div class="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
        <div
          class="flex-1 h-8 rounded"
          :style="{ backgroundColor: primaryColor }"
        />
        <div
          class="flex-1 h-8 rounded"
          :style="{ backgroundColor: secondaryColor }"
        />
      </div>
    </div>
  </div>
</template>
