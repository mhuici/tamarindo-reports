<script setup lang="ts">
const features = [
  {
    name: 'Analisis de causa automatico',
    description: 'IA que explica POR QUE cambiaron tus metricas',
    tamarindo: true,
    supermetrics: false,
    agencyAnalytics: false,
    highlight: true,
  },
  {
    name: 'Narrativas AI para clientes',
    description: 'Resumenes ejecutivos generados automaticamente',
    tamarindo: true,
    supermetrics: false,
    agencyAnalytics: false,
    highlight: true,
  },
  {
    name: 'Precio flat (sin cobro por conector)',
    description: 'Un precio, todas las integraciones incluidas',
    tamarindo: true,
    supermetrics: false,
    agencyAnalytics: true,
  },
  {
    name: 'Dashboards compartibles',
    description: 'Links publicos con password opcional',
    tamarindo: true,
    supermetrics: true,
    agencyAnalytics: true,
  },
  {
    name: 'White-label completo',
    description: 'Tu logo y colores en reportes y dashboards',
    tamarindo: true,
    supermetrics: false,
    agencyAnalytics: true,
  },
  {
    name: 'Alertas inteligentes',
    description: 'Notificaciones cuando metricas cambian significativamente',
    tamarindo: true,
    supermetrics: false,
    agencyAnalytics: true,
  },
  {
    name: 'Forecasting integrado',
    description: 'Predicciones de spend y metricas',
    tamarindo: true,
    supermetrics: false,
    agencyAnalytics: false,
    highlight: true,
  },
  {
    name: 'Google Ads / Meta Ads',
    description: 'Integraciones principales',
    tamarindo: true,
    supermetrics: true,
    agencyAnalytics: true,
  },
]

const competitors = [
  { key: 'tamarindo', name: 'TamarindoReports', price: 'Desde $49/mes', highlight: true },
  { key: 'supermetrics', name: 'Supermetrics', price: '$39-99/conector' },
  { key: 'agencyAnalytics', name: 'AgencyAnalytics', price: '$149-449/mes' },
]
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr class="border-b border-gray-200">
          <th class="text-left py-4 px-4 font-medium text-gray-500 w-1/3">
            Funcionalidad
          </th>
          <th
            v-for="competitor in competitors"
            :key="competitor.key"
            class="text-center py-4 px-4"
          >
            <div
              :class="[
                'inline-flex flex-col items-center',
                competitor.highlight ? 'text-amber-600' : 'text-gray-700',
              ]"
            >
              <span
                :class="[
                  'font-semibold',
                  competitor.highlight ? 'text-lg' : 'text-sm',
                ]"
              >
                {{ competitor.name }}
              </span>
              <span
                :class="[
                  'text-xs mt-0.5',
                  competitor.highlight ? 'text-amber-500' : 'text-gray-400',
                ]"
              >
                {{ competitor.price }}
              </span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="feature in features"
          :key="feature.name"
          :class="[
            'border-b border-gray-100 transition-colors',
            feature.highlight ? 'bg-amber-50/50' : 'hover:bg-gray-50',
          ]"
        >
          <td class="py-4 px-4">
            <div class="flex items-start gap-2">
              <div>
                <p
                  :class="[
                    'font-medium',
                    feature.highlight ? 'text-amber-900' : 'text-gray-900',
                  ]"
                >
                  {{ feature.name }}
                  <span
                    v-if="feature.highlight"
                    class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700"
                  >
                    Unico
                  </span>
                </p>
                <p class="text-sm text-gray-500 mt-0.5">{{ feature.description }}</p>
              </div>
            </div>
          </td>
          <td class="text-center py-4 px-4">
            <div
              v-if="feature.tamarindo"
              class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100"
            >
              <Icon name="heroicons:check" class="w-5 h-5 text-green-600" />
            </div>
            <div
              v-else
              class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5 text-gray-400" />
            </div>
          </td>
          <td class="text-center py-4 px-4">
            <div
              v-if="feature.supermetrics"
              class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100"
            >
              <Icon name="heroicons:check" class="w-5 h-5 text-green-600" />
            </div>
            <div
              v-else
              class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5 text-gray-400" />
            </div>
          </td>
          <td class="text-center py-4 px-4">
            <div
              v-if="feature.agencyAnalytics"
              class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100"
            >
              <Icon name="heroicons:check" class="w-5 h-5 text-green-600" />
            </div>
            <div
              v-else
              class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5 text-gray-400" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
