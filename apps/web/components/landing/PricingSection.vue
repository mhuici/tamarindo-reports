<script setup lang="ts">
const plans = [
  {
    name: 'Starter',
    price: 49,
    description: 'Ideal para freelancers y agencias pequenas',
    features: [
      '5 clientes',
      '3 integraciones',
      '10 dashboards',
      '50 analisis AI/mes',
      'Soporte por email',
    ],
    notIncluded: [
      'White-label',
      'Alertas automaticas',
      'Resumen ejecutivo',
    ],
    cta: 'Empezar gratis',
    highlighted: false,
  },
  {
    name: 'Agency',
    price: 99,
    description: 'Para agencias en crecimiento',
    features: [
      '25 clientes',
      'Integraciones ilimitadas',
      'Dashboards ilimitados',
      '500 analisis AI/mes',
      'White-label completo',
      'Alertas automaticas',
      'Resumen ejecutivo 1-click',
      'Soporte prioritario',
    ],
    notIncluded: [],
    cta: 'Empezar gratis',
    highlighted: true,
    badge: 'Mas popular',
  },
  {
    name: 'Enterprise',
    price: null,
    priceLabel: 'Personalizado',
    description: 'Para grandes agencias y equipos',
    features: [
      'Clientes ilimitados',
      'Todo de Agency',
      'API access',
      'SSO / SAML',
      'SLA garantizado',
      'Account manager dedicado',
      'Onboarding personalizado',
    ],
    notIncluded: [],
    cta: 'Contactar ventas',
    highlighted: false,
  },
]
</script>

<template>
  <div class="grid md:grid-cols-3 gap-6 lg:gap-8">
    <div
      v-for="plan in plans"
      :key="plan.name"
      :class="[
        'relative rounded-2xl border transition-all',
        plan.highlighted
          ? 'border-amber-500 shadow-xl shadow-amber-500/10 scale-105 bg-white'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg',
      ]"
    >
      <!-- Badge -->
      <div
        v-if="plan.badge"
        class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-full shadow-lg"
      >
        {{ plan.badge }}
      </div>

      <div class="p-6 lg:p-8">
        <!-- Header -->
        <div class="text-center mb-6">
          <h3 class="text-lg font-semibold text-gray-900">{{ plan.name }}</h3>
          <div class="mt-4">
            <template v-if="plan.price !== null">
              <span class="text-4xl font-bold text-gray-900">${{ plan.price }}</span>
              <span class="text-gray-500">/mes</span>
            </template>
            <template v-else>
              <span class="text-3xl font-bold text-gray-900">{{ plan.priceLabel }}</span>
            </template>
          </div>
          <p class="mt-2 text-sm text-gray-500">{{ plan.description }}</p>
        </div>

        <!-- CTA -->
        <NuxtLink
          to="/register"
          :class="[
            'block w-full text-center py-3 px-4 rounded-xl font-semibold transition-all',
            plan.highlighted
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
        >
          {{ plan.cta }}
        </NuxtLink>

        <!-- Features -->
        <div class="mt-6 space-y-3">
          <div
            v-for="feature in plan.features"
            :key="feature"
            class="flex items-start gap-3"
          >
            <Icon
              name="heroicons:check-circle-solid"
              :class="[
                'w-5 h-5 shrink-0',
                plan.highlighted ? 'text-amber-500' : 'text-green-500',
              ]"
            />
            <span class="text-sm text-gray-600">{{ feature }}</span>
          </div>
          <div
            v-for="feature in plan.notIncluded"
            :key="feature"
            class="flex items-start gap-3"
          >
            <Icon
              name="heroicons:x-circle-solid"
              class="w-5 h-5 shrink-0 text-gray-300"
            />
            <span class="text-sm text-gray-400">{{ feature }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
