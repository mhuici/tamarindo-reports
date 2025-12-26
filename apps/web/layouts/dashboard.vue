<script setup lang="ts">
const route = useRoute()
const tenant = computed(() => route.params.tenant as string)
const { user, logout } = useAuth()

const navigation = computed(() => [
  { name: 'Dashboard', href: `/${tenant.value}`, icon: 'heroicons:home' },
  { name: 'Clients', href: `/${tenant.value}/clients`, icon: 'heroicons:users' },
  { name: 'Reports', href: `/${tenant.value}/reports`, icon: 'heroicons:document-chart-bar' },
  { name: 'Integrations', href: `/${tenant.value}/integrations`, icon: 'heroicons:puzzle-piece' },
  { name: 'Settings', href: `/${tenant.value}/settings`, icon: 'heroicons:cog-6-tooth' },
])

const isSidebarOpen = ref(true)
const isUserMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

// Close menu when clicking outside
onClickOutside(userMenuRef, () => {
  isUserMenuOpen.value = false
})

async function handleLogout() {
  await logout()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
        isSidebarOpen ? 'w-64' : 'w-20',
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center h-16 px-4 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-tamarindo-500 flex items-center justify-center">
            <span class="text-white font-bold text-sm">T</span>
          </div>
          <span
            v-if="isSidebarOpen"
            class="font-semibold text-gray-900"
          >
            TamarindoReports
          </span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          active-class="bg-tamarindo-50 text-tamarindo-700 hover:bg-tamarindo-50"
        >
          <Icon
            :name="item.icon"
            class="w-5 h-5 flex-shrink-0"
          />
          <span
            v-if="isSidebarOpen"
            class="truncate"
          >
            {{ item.name }}
          </span>
        </NuxtLink>
      </nav>

      <!-- Toggle button -->
      <button
        class="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
        @click="isSidebarOpen = !isSidebarOpen"
      >
        <Icon
          :name="isSidebarOpen ? 'heroicons:chevron-left' : 'heroicons:chevron-right'"
          class="w-4 h-4 text-gray-500"
        />
      </button>
    </aside>

    <!-- Main content -->
    <div
      :class="[
        'transition-all duration-300',
        isSidebarOpen ? 'ml-64' : 'ml-20',
      ]"
    >
      <!-- Top bar -->
      <header class="sticky top-0 z-40 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div class="flex items-center gap-4">
          <h1 class="text-lg font-semibold text-gray-900">
            {{ $route.meta.title || 'Dashboard' }}
          </h1>
        </div>
        <div class="flex items-center gap-4">
          <!-- User menu -->
          <div
            ref="userMenuRef"
            class="relative"
          >
            <button
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100"
              @click="isUserMenuOpen = !isUserMenuOpen"
            >
              <div class="w-8 h-8 rounded-full bg-tamarindo-100 flex items-center justify-center">
                <span class="text-sm font-medium text-tamarindo-700">
                  {{ user?.name?.charAt(0)?.toUpperCase() || 'U' }}
                </span>
              </div>
              <span class="text-sm text-gray-700 hidden sm:block">{{ user?.name || 'User' }}</span>
              <Icon
                name="heroicons:chevron-down"
                class="w-4 h-4 text-gray-500"
              />
            </button>

            <!-- Dropdown menu -->
            <div
              v-if="isUserMenuOpen"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
            >
              <div class="px-4 py-2 border-b border-gray-100">
                <p class="text-sm font-medium text-gray-900">{{ user?.name }}</p>
                <p class="text-xs text-gray-500">{{ user?.email }}</p>
              </div>
              <NuxtLink
                :to="`/${tenant}/settings`"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                @click="isUserMenuOpen = false"
              >
                <Icon
                  name="heroicons:cog-6-tooth"
                  class="w-4 h-4 inline mr-2"
                />
                Settings
              </NuxtLink>
              <button
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                @click="handleLogout"
              >
                <Icon
                  name="heroicons:arrow-right-on-rectangle"
                  class="w-4 h-4 inline mr-2"
                />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
