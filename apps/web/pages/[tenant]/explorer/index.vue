<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Metrics Explorer',
  middleware: ['tenant'],
})

const route = useRoute()
const tenant = computed(() => route.params.tenant as string)

const {
  metrics,
  isLoading,
  error,
  dateRange,
  selectedPlatforms,
  selectedPreset,
  compareEnabled,
  hasData,
  totalSpend,
  totalClicks,
  totalConversions,
  totalRoas,
  previousSpend,
  previousClicks,
  previousConversions,
  previousRoas,
  fetchMetrics,
  setDatePreset,
  exportCSV,
  togglePlatform,
  clearFilters,
  calculateChange,
} = useExplorer()

const { clients, fetchClients } = useClients()
const selectedClientId = useState<string | null>('explorer-client', () => null)

// Fetch on mount
onMounted(async () => {
  await Promise.all([fetchMetrics(), fetchClients()])
})

// Refetch when filters change
watch([dateRange, selectedPlatforms, selectedClientId, compareEnabled], () => {
  fetchMetrics()
}, { deep: true })

// Format helpers
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value}%`
}

function formatRoas(value: number): string {
  return `${value.toFixed(2)}x`
}

// Platform icons
const platformIcons: Record<string, string> = {
  google_ads: 'logos:google-ads',
  facebook_ads: 'logos:facebook',
  google_analytics: 'logos:google-analytics',
}

// Platform labels
const platformLabels: Record<string, string> = {
  google_ads: 'Google Ads',
  facebook_ads: 'Facebook Ads',
  google_analytics: 'Google Analytics',
}

// KPI cards configuration
const kpiCards = computed(() => [
  {
    label: 'Total Spend',
    value: formatCurrency(totalSpend.value),
    change: calculateChange(totalSpend.value, previousSpend.value),
    icon: 'heroicons:currency-dollar',
    color: 'blue',
  },
  {
    label: 'Total Clicks',
    value: formatNumber(totalClicks.value),
    change: calculateChange(totalClicks.value, previousClicks.value),
    icon: 'heroicons:cursor-arrow-rays',
    color: 'green',
  },
  {
    label: 'Conversions',
    value: formatNumber(totalConversions.value),
    change: calculateChange(totalConversions.value, previousConversions.value),
    icon: 'heroicons:shopping-cart',
    color: 'purple',
  },
  {
    label: 'ROAS',
    value: formatRoas(totalRoas.value),
    change: calculateChange(totalRoas.value, previousRoas.value),
    icon: 'heroicons:arrow-trending-up',
    color: 'orange',
  },
])

// Chart data
const chartData = computed(() => {
  if (!metrics.value?.byDate) return []
  return metrics.value.byDate.map(d => ({
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d.metrics.spend || 0,
  }))
})

// View mode for table
const tableViewMode = ref<'table' | 'chart'>('table')
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Metrics Explorer
        </h1>
        <p class="text-gray-600 mt-1">
          Explore aggregated metrics across all your connected platforms
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          class="btn-secondary flex items-center gap-2"
          :disabled="!hasData"
          @click="exportCSV"
        >
          <Icon
            name="heroicons:arrow-down-tray"
            class="w-5 h-5"
          />
          Export CSV
        </button>
        <NuxtLink
          :to="`/${tenant}/reports/new`"
          class="btn-primary flex items-center gap-2"
        >
          <Icon
            name="heroicons:document-plus"
            class="w-5 h-5"
          />
          Create Report
        </NuxtLink>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="card card-body">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Platform filter -->
        <div class="flex-1 min-w-[200px]">
          <label class="label text-xs mb-1">Platforms</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="platform in ['google_ads', 'facebook_ads', 'google_analytics']"
              :key="platform"
              :class="[
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-all',
                selectedPlatforms.includes(platform)
                  ? 'border-tamarindo-500 bg-tamarindo-50 text-tamarindo-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600',
              ]"
              @click="togglePlatform(platform)"
            >
              <Icon
                :name="platformIcons[platform]"
                class="w-4 h-4"
              />
              {{ platformLabels[platform] }}
            </button>
          </div>
        </div>

        <!-- Client filter -->
        <div class="w-48">
          <label class="label text-xs mb-1">Client</label>
          <select
            v-model="selectedClientId"
            class="select select-sm"
          >
            <option :value="null">
              All Clients
            </option>
            <option
              v-for="client in clients"
              :key="client.id"
              :value="client.id"
            >
              {{ client.name }}
            </option>
          </select>
        </div>

        <!-- Date presets -->
        <div class="w-40">
          <label class="label text-xs mb-1">Date Range</label>
          <select
            v-model="selectedPreset"
            class="select select-sm"
            @change="setDatePreset(selectedPreset)"
          >
            <option value="today">
              Today
            </option>
            <option value="yesterday">
              Yesterday
            </option>
            <option value="last7">
              Last 7 days
            </option>
            <option value="last30">
              Last 30 days
            </option>
            <option value="thisMonth">
              This month
            </option>
            <option value="lastMonth">
              Last month
            </option>
          </select>
        </div>

        <!-- Compare toggle -->
        <div class="flex items-center gap-2">
          <label class="label text-xs">Compare</label>
          <button
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              compareEnabled ? 'bg-tamarindo-500' : 'bg-gray-200',
            ]"
            @click="compareEnabled = !compareEnabled"
          >
            <span
              :class="[
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                compareEnabled ? 'translate-x-6' : 'translate-x-1',
              ]"
            />
          </button>
        </div>

        <!-- Clear filters -->
        <button
          class="text-sm text-gray-500 hover:text-gray-700 underline"
          @click="clearFilters"
        >
          Clear filters
        </button>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="error"
      class="alert alert-error"
    >
      <Icon
        name="heroicons:exclamation-circle"
        class="w-5 h-5"
      />
      <span>{{ error }}</span>
      <button
        class="btn-sm"
        @click="fetchMetrics"
      >
        Retry
      </button>
    </div>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="space-y-6"
    >
      <!-- KPI skeletons -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="i in 4"
          :key="i"
          class="card card-body animate-pulse"
        >
          <div class="h-4 bg-gray-200 rounded w-24 mb-2" />
          <div class="h-8 bg-gray-200 rounded w-32 mb-1" />
          <div class="h-3 bg-gray-200 rounded w-16" />
        </div>
      </div>
      <!-- Table skeleton -->
      <div class="card card-body animate-pulse">
        <div class="h-6 bg-gray-200 rounded w-48 mb-4" />
        <div class="space-y-3">
          <div
            v-for="i in 3"
            :key="i"
            class="h-12 bg-gray-200 rounded"
          />
        </div>
      </div>
    </div>

    <!-- Data view -->
    <template v-else-if="hasData">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="kpi in kpiCards"
          :key="kpi.label"
          class="card card-body"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-500">{{ kpi.label }}</span>
            <div
              :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center',
                kpi.color === 'blue' ? 'bg-blue-100' : '',
                kpi.color === 'green' ? 'bg-green-100' : '',
                kpi.color === 'purple' ? 'bg-purple-100' : '',
                kpi.color === 'orange' ? 'bg-orange-100' : '',
              ]"
            >
              <Icon
                :name="kpi.icon"
                :class="[
                  'w-5 h-5',
                  kpi.color === 'blue' ? 'text-blue-600' : '',
                  kpi.color === 'green' ? 'text-green-600' : '',
                  kpi.color === 'purple' ? 'text-purple-600' : '',
                  kpi.color === 'orange' ? 'text-orange-600' : '',
                ]"
              />
            </div>
          </div>
          <p class="text-2xl font-bold text-gray-900">
            {{ kpi.value }}
          </p>
          <p
            v-if="compareEnabled"
            :class="[
              'text-sm flex items-center gap-1',
              kpi.change > 0 ? 'text-green-600' : kpi.change < 0 ? 'text-red-600' : 'text-gray-500',
            ]"
          >
            <Icon
              :name="kpi.change > 0 ? 'heroicons:arrow-up' : kpi.change < 0 ? 'heroicons:arrow-down' : 'heroicons:minus'"
              class="w-4 h-4"
            />
            {{ formatPercent(kpi.change) }} vs previous period
          </p>
        </div>
      </div>

      <!-- Platform Breakdown -->
      <div class="card card-body">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">
            Platform Breakdown
          </h2>
          <div class="flex items-center gap-2">
            <button
              :class="[
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                tableViewMode === 'table'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ]"
              @click="tableViewMode = 'table'"
            >
              <Icon
                name="heroicons:table-cells"
                class="w-4 h-4"
              />
            </button>
            <button
              :class="[
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                tableViewMode === 'chart'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ]"
              @click="tableViewMode = 'chart'"
            >
              <Icon
                name="heroicons:chart-bar"
                class="w-4 h-4"
              />
            </button>
          </div>
        </div>

        <!-- Table view -->
        <div
          v-if="tableViewMode === 'table'"
          class="overflow-x-auto"
        >
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Platform
                </th>
                <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  Spend
                </th>
                <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  Impressions
                </th>
                <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  Clicks
                </th>
                <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  CTR
                </th>
                <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  Conversions
                </th>
                <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  CPA
                </th>
                <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  ROAS
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="platform in metrics?.platforms || []"
                :key="platform"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <Icon
                      :name="platformIcons[platform] || 'heroicons:globe-alt'"
                      class="w-5 h-5"
                    />
                    <span class="font-medium text-gray-900">{{ platformLabels[platform] || platform }}</span>
                  </div>
                </td>
                <td class="text-right py-3 px-4 text-gray-900">
                  {{ formatCurrency(metrics?.byPlatform[platform]?.spend || 0) }}
                </td>
                <td class="text-right py-3 px-4 text-gray-600">
                  {{ formatNumber(metrics?.byPlatform[platform]?.impressions || 0) }}
                </td>
                <td class="text-right py-3 px-4 text-gray-600">
                  {{ formatNumber(metrics?.byPlatform[platform]?.clicks || 0) }}
                </td>
                <td class="text-right py-3 px-4 text-gray-600">
                  {{ ((metrics?.byPlatform[platform]?.ctr || 0) * 100).toFixed(2) }}%
                </td>
                <td class="text-right py-3 px-4 text-gray-600">
                  {{ formatNumber(metrics?.byPlatform[platform]?.conversions || 0) }}
                </td>
                <td class="text-right py-3 px-4 text-gray-600">
                  {{ formatCurrency(metrics?.byPlatform[platform]?.costPerConversion || 0) }}
                </td>
                <td class="text-right py-3 px-4 font-medium text-gray-900">
                  {{ formatRoas(metrics?.byPlatform[platform]?.roas || 0) }}
                </td>
              </tr>
              <!-- Totals row -->
              <tr class="bg-gray-50 font-semibold">
                <td class="py-3 px-4 text-gray-900">
                  Total
                </td>
                <td class="text-right py-3 px-4 text-gray-900">
                  {{ formatCurrency(metrics?.totals.spend || 0) }}
                </td>
                <td class="text-right py-3 px-4 text-gray-900">
                  {{ formatNumber(metrics?.totals.impressions || 0) }}
                </td>
                <td class="text-right py-3 px-4 text-gray-900">
                  {{ formatNumber(metrics?.totals.clicks || 0) }}
                </td>
                <td class="text-right py-3 px-4 text-gray-900">
                  {{ ((metrics?.totals.ctr || 0) * 100).toFixed(2) }}%
                </td>
                <td class="text-right py-3 px-4 text-gray-900">
                  {{ formatNumber(metrics?.totals.conversions || 0) }}
                </td>
                <td class="text-right py-3 px-4 text-gray-900">
                  {{ formatCurrency(metrics?.totals.costPerConversion || 0) }}
                </td>
                <td class="text-right py-3 px-4 text-gray-900">
                  {{ formatRoas(metrics?.totals.roas || 0) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Chart view -->
        <div
          v-else
          class="h-64"
        >
          <ExplorerPlatformChart
            :data="metrics?.byPlatform || {}"
            :labels="platformLabels"
            :icons="platformIcons"
          />
        </div>
      </div>

      <!-- Trend Chart -->
      <div class="card card-body">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">
            Daily Trend
          </h2>
          <span class="text-sm text-gray-500">
            {{ dateRange.start }} - {{ dateRange.end }}
          </span>
        </div>
        <ExplorerTrendChart
          :data="chartData"
          :compare-enabled="compareEnabled"
        />
      </div>
    </template>

    <!-- Empty state -->
    <div
      v-else
      class="card card-body text-center py-12"
    >
      <Icon
        name="heroicons:chart-bar"
        class="w-12 h-12 text-gray-400 mx-auto mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        No metrics data available
      </h3>
      <p class="text-gray-600 mb-4">
        Connect your advertising platforms to start exploring your metrics
      </p>
      <NuxtLink
        :to="`/${tenant}/integrations`"
        class="btn-primary inline-flex items-center gap-2"
      >
        <Icon
          name="heroicons:puzzle-piece"
          class="w-5 h-5"
        />
        Connect Platforms
      </NuxtLink>
    </div>
  </div>
</template>
