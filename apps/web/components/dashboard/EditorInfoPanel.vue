<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  name: string
  clientName: string
  isPublic: boolean
  hasPassword: boolean
  password?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:name': [name: string]
  'update:isPublic': [isPublic: boolean]
  'update:password': [password: string | undefined]
  'clearPassword': []
}>()

const isCollapsed = ref(false)
const showPasswordInput = ref(false)
const newPassword = ref('')
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
        <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <Icon
            name="heroicons:document-text"
            class="w-4 h-4 text-gray-600"
          />
        </div>
        <div class="text-left">
          <h3 class="text-sm font-medium text-gray-900">
            Dashboard Info
          </h3>
          <p class="text-xs text-gray-500">
            {{ clientName }}
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
      class="px-4 pb-4 space-y-4 border-t border-gray-100"
    >
      <!-- Dashboard Name -->
      <div class="pt-4">
        <label
          for="dashboardName"
          class="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Name
        </label>
        <input
          id="dashboardName"
          type="text"
          class="input w-full"
          :value="name"
          placeholder="Dashboard name"
          @input="emit('update:name', ($event.target as HTMLInputElement).value)"
        >
      </div>

      <!-- Client (read-only) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">
          Client
        </label>
        <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
          <Icon
            name="heroicons:building-office"
            class="w-4 h-4 text-gray-400"
          />
          {{ clientName }}
        </div>
      </div>

      <!-- Visibility -->
      <div class="pt-2 border-t border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-700">
              Public Access
            </p>
            <p class="text-xs text-gray-500">
              Anyone with the link can view
            </p>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="isPublic"
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            :class="isPublic ? 'bg-gray-900' : 'bg-gray-200'"
            @click="emit('update:isPublic', !isPublic)"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="isPublic ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>

      <!-- Password Protection -->
      <div
        v-if="isPublic"
        class="space-y-3"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-700">
              Password Protection
            </p>
            <p class="text-xs text-gray-500">
              {{ hasPassword ? 'Password required to view' : 'No password required' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span
              v-if="hasPassword"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"
            >
              <Icon
                name="heroicons:lock-closed"
                class="w-3 h-3 mr-1"
              />
              Active
            </span>
          </div>
        </div>

        <!-- Password Actions -->
        <div class="flex items-center gap-2">
          <button
            v-if="!showPasswordInput"
            type="button"
            class="text-sm text-gray-600 hover:text-gray-900"
            @click="showPasswordInput = true"
          >
            {{ hasPassword ? 'Change password' : 'Add password' }}
          </button>

          <button
            v-if="hasPassword && !showPasswordInput"
            type="button"
            class="text-sm text-red-600 hover:text-red-700"
            @click="emit('clearPassword')"
          >
            Remove password
          </button>
        </div>

        <!-- Password Input -->
        <div
          v-if="showPasswordInput"
          class="flex items-center gap-2"
        >
          <input
            v-model="newPassword"
            type="password"
            class="input flex-1"
            placeholder="Enter new password"
          >
          <button
            type="button"
            class="btn-primary py-2"
            :disabled="!newPassword"
            @click="emit('update:password', newPassword); showPasswordInput = false; newPassword = ''"
          >
            Save
          </button>
          <button
            type="button"
            class="btn-secondary py-2"
            @click="showPasswordInput = false; newPassword = ''"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
