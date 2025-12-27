<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Dashboard Editor',
  middleware: ['tenant'],
})

const route = useRoute()
const router = useRouter()
const tenant = computed(() => route.params.tenant as string)
const dashboardId = computed(() => route.params.id as string)

const { currentDashboard, isLoading, fetchDashboard, updateDashboard, getPublicUrl, copyPublicUrl } = useDashboards()

// Widget state
const widgets = ref<any[]>([])
const isSaving = ref(false)
const saveMessage = ref('')

// Settings
const showSettings = ref(false)
const settings = reactive({
  name: '',
  isPublic: true,
  password: '',
  clearPassword: false,
})

// Fetch dashboard on mount
onMounted(async () => {
  const dashboard = await fetchDashboard(dashboardId.value)
  if (dashboard) {
    widgets.value = dashboard.widgets || []
    settings.name = dashboard.name
    settings.isPublic = dashboard.isPublic
  }
})

// Available widget types
const widgetTypes = [
  { type: 'metric', label: 'Metric Card', icon: 'heroicons:presentation-chart-bar', description: 'Single KPI value' },
  { type: 'line-chart', label: 'Line Chart', icon: 'heroicons:chart-bar', description: 'Trend over time' },
  { type: 'bar-chart', label: 'Bar Chart', icon: 'heroicons:chart-bar-square', description: 'Comparison data' },
  { type: 'pie-chart', label: 'Pie Chart', icon: 'heroicons:chart-pie', description: 'Distribution data' },
  { type: 'table', label: 'Data Table', icon: 'heroicons:table-cells', description: 'Detailed breakdown' },
  { type: 'text', label: 'Text Block', icon: 'heroicons:document-text', description: 'Custom text/notes' },
]

function addWidget(type: string) {
  const widgetType = widgetTypes.find(w => w.type === type)
  widgets.value.push({
    id: crypto.randomUUID(),
    type,
    title: widgetType?.label || 'Widget',
    config: {},
    size: 'medium',
  })
}

function removeWidget(id: string) {
  widgets.value = widgets.value.filter(w => w.id !== id)
}

function moveWidget(index: number, direction: 'up' | 'down') {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= widgets.value.length) return

  const temp = widgets.value[index]
  widgets.value[index] = widgets.value[newIndex]
  widgets.value[newIndex] = temp
}

async function saveDashboard() {
  if (isSaving.value) return

  isSaving.value = true
  saveMessage.value = ''

  try {
    const result = await updateDashboard(dashboardId.value, {
      widgets: widgets.value,
    })

    if (result.success) {
      saveMessage.value = 'Saved!'
      setTimeout(() => {
        saveMessage.value = ''
      }, 2000)
    }
    else {
      saveMessage.value = result.error || 'Failed to save'
    }
  }
  finally {
    isSaving.value = false
  }
}

async function saveSettings() {
  if (isSaving.value) return

  isSaving.value = true

  try {
    const data: any = {
      name: settings.name,
      isPublic: settings.isPublic,
    }

    if (settings.clearPassword) {
      data.password = null
    }
    else if (settings.password) {
      data.password = settings.password
    }

    const result = await updateDashboard(dashboardId.value, data)

    if (result.success) {
      showSettings.value = false
      settings.password = ''
      settings.clearPassword = false
    }
    else {
      alert(result.error || 'Failed to save settings')
    }
  }
  finally {
    isSaving.value = false
  }
}

async function handleCopyLink() {
  if (!currentDashboard.value) return
  const success = await copyPublicUrl(currentDashboard.value.slug)
  if (success) {
    alert('Link copied to clipboard!')
  }
}

function getWidgetIcon(type: string) {
  return widgetTypes.find(w => w.type === type)?.icon || 'heroicons:square-3-stack-3d'
}
</script>

<template>
  <div>
    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-12"
    >
      <Icon
        name="heroicons:arrow-path"
        class="w-8 h-8 animate-spin text-gray-400"
      />
    </div>

    <!-- Dashboard not found -->
    <div
      v-else-if="!currentDashboard"
      class="text-center py-12"
    >
      <Icon
        name="heroicons:presentation-chart-line"
        class="mx-auto h-12 w-12 text-gray-400"
      />
      <h3 class="mt-2 text-sm font-medium text-gray-900">
        Dashboard not found
      </h3>
      <NuxtLink
        :to="`/${tenant}/dashboards`"
        class="btn-primary mt-4 inline-flex"
      >
        Back to Dashboards
      </NuxtLink>
    </div>

    <!-- Dashboard editor -->
    <div v-else>
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <NuxtLink
            :to="`/${tenant}/dashboards`"
            class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            <Icon
              name="heroicons:arrow-left"
              class="w-4 h-4"
            />
            Back to Dashboards
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ currentDashboard.name }}
          </h1>
          <div class="flex items-center gap-3 mt-1">
            <span class="text-gray-500">{{ currentDashboard.client.name }}</span>
            <span
              :class="[
                'badge',
                currentDashboard.isPublic ? 'badge-success' : 'badge-warning',
              ]"
            >
              {{ currentDashboard.isPublic ? 'Public' : 'Private' }}
            </span>
            <span
              v-if="currentDashboard.hasPassword"
              class="badge"
            >
              <Icon
                name="heroicons:lock-closed"
                class="w-3 h-3 mr-1"
              />
              Password protected
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span
            v-if="saveMessage"
            class="text-sm text-green-600"
          >
            {{ saveMessage }}
          </span>

          <button
            v-if="currentDashboard.isPublic"
            class="btn-secondary"
            @click="handleCopyLink"
          >
            <Icon
              name="heroicons:link"
              class="w-4 h-4 mr-2"
            />
            Copy Link
          </button>

          <a
            v-if="currentDashboard.isPublic"
            :href="getPublicUrl(currentDashboard.slug)"
            target="_blank"
            class="btn-secondary"
          >
            <Icon
              name="heroicons:arrow-top-right-on-square"
              class="w-4 h-4 mr-2"
            />
            Preview
          </a>

          <button
            class="btn-secondary"
            @click="showSettings = true"
          >
            <Icon
              name="heroicons:cog-6-tooth"
              class="w-4 h-4 mr-2"
            />
            Settings
          </button>

          <button
            class="btn-primary"
            :disabled="isSaving"
            @click="saveDashboard"
          >
            <Icon
              v-if="isSaving"
              name="heroicons:arrow-path"
              class="w-4 h-4 mr-2 animate-spin"
            />
            <Icon
              v-else
              name="heroicons:cloud-arrow-up"
              class="w-4 h-4 mr-2"
            />
            Save
          </button>
        </div>
      </div>

      <!-- Main content area -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Widget palette -->
        <div class="lg:col-span-1">
          <div class="card card-body sticky top-4">
            <h3 class="font-semibold text-gray-900 mb-4">
              Add Widgets
            </h3>
            <div class="space-y-2">
              <button
                v-for="widget in widgetTypes"
                :key="widget.type"
                class="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-tamarindo-300 hover:bg-tamarindo-50 transition-colors"
                @click="addWidget(widget.type)"
              >
                <div class="flex items-center gap-3">
                  <Icon
                    :name="widget.icon"
                    class="w-5 h-5 text-gray-500"
                  />
                  <div>
                    <p class="font-medium text-gray-900 text-sm">
                      {{ widget.label }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ widget.description }}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Canvas area -->
        <div class="lg:col-span-3">
          <!-- Empty state -->
          <div
            v-if="widgets.length === 0"
            class="card card-body border-dashed text-center py-16"
          >
            <Icon
              name="heroicons:squares-plus"
              class="mx-auto h-12 w-12 text-gray-400"
            />
            <h3 class="mt-2 text-sm font-medium text-gray-900">
              No widgets yet
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              Click on a widget type from the sidebar to add it to your dashboard.
            </p>
          </div>

          <!-- Widgets list -->
          <div
            v-else
            class="space-y-4"
          >
            <div
              v-for="(widget, index) in widgets"
              :key="widget.id"
              class="card hover:shadow-md transition-shadow"
            >
              <div class="card-body">
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <Icon
                      :name="getWidgetIcon(widget.type)"
                      class="w-5 h-5 text-gray-500"
                    />
                    <div>
                      <input
                        v-model="widget.title"
                        type="text"
                        class="font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                      >
                      <p class="text-xs text-gray-500 capitalize">
                        {{ widget.type.replace('-', ' ') }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-1">
                    <button
                      class="p-1 text-gray-400 hover:text-gray-600"
                      title="Move up"
                      :disabled="index === 0"
                      @click="moveWidget(index, 'up')"
                    >
                      <Icon
                        name="heroicons:chevron-up"
                        class="w-4 h-4"
                      />
                    </button>
                    <button
                      class="p-1 text-gray-400 hover:text-gray-600"
                      title="Move down"
                      :disabled="index === widgets.length - 1"
                      @click="moveWidget(index, 'down')"
                    >
                      <Icon
                        name="heroicons:chevron-down"
                        class="w-4 h-4"
                      />
                    </button>
                    <button
                      class="p-1 text-gray-400 hover:text-red-600"
                      title="Remove"
                      @click="removeWidget(widget.id)"
                    >
                      <Icon
                        name="heroicons:trash"
                        class="w-4 h-4"
                      />
                    </button>
                  </div>
                </div>

                <!-- Widget preview placeholder -->
                <div class="mt-4 bg-gray-50 rounded-lg p-8 text-center">
                  <Icon
                    :name="getWidgetIcon(widget.type)"
                    class="mx-auto h-8 w-8 text-gray-300"
                  />
                  <p class="mt-2 text-sm text-gray-400">
                    Widget preview
                  </p>
                </div>

                <!-- Size selector -->
                <div class="mt-4 flex items-center gap-2">
                  <span class="text-xs text-gray-500">Size:</span>
                  <button
                    v-for="size in ['small', 'medium', 'large']"
                    :key="size"
                    :class="[
                      'px-2 py-1 text-xs rounded',
                      widget.size === size
                        ? 'bg-tamarindo-100 text-tamarindo-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    ]"
                    @click="widget.size = size"
                  >
                    {{ size }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div
      v-if="showSettings"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-black/50"
        @click="showSettings = false"
      />
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Dashboard Settings
        </h2>

        <form
          class="space-y-4"
          @submit.prevent="saveSettings"
        >
          <div>
            <label
              for="settingsName"
              class="label"
            >Dashboard Name</label>
            <input
              id="settingsName"
              v-model="settings.name"
              type="text"
              class="input"
              required
            >
          </div>

          <div class="flex items-center gap-3">
            <input
              id="settingsPublic"
              v-model="settings.isPublic"
              type="checkbox"
              class="w-4 h-4 rounded border-gray-300 text-tamarindo-600 focus:ring-tamarindo-500"
            >
            <label
              for="settingsPublic"
              class="text-sm text-gray-700"
            >
              Make this dashboard publicly accessible
            </label>
          </div>

          <div v-if="settings.isPublic">
            <label
              for="settingsPassword"
              class="label"
            >Change Password</label>
            <input
              id="settingsPassword"
              v-model="settings.password"
              type="password"
              class="input"
              placeholder="Enter new password"
            >

            <div
              v-if="currentDashboard?.hasPassword"
              class="mt-2 flex items-center gap-2"
            >
              <input
                id="clearPassword"
                v-model="settings.clearPassword"
                type="checkbox"
                class="w-4 h-4 rounded border-gray-300 text-tamarindo-600"
              >
              <label
                for="clearPassword"
                class="text-sm text-gray-600"
              >
                Remove password protection
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              class="btn-secondary"
              @click="showSettings = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="isSaving"
            >
              <Icon
                v-if="isSaving"
                name="heroicons:arrow-path"
                class="w-4 h-4 mr-2 animate-spin"
              />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
