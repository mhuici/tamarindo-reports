<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: 'TamarindoReports - Reportes con IA que explican POR QUE cambian tus metricas',
  description: 'La unica plataforma de reporting que te dice POR QUE cambiaron tus metricas, no solo QUE cambio. Analisis de causa automatico, narrativas AI y forecasting para agencias.',
  ogTitle: 'TamarindoReports - Reportes con Inteligencia de Verdad',
  ogDescription: 'Deja de explicar numeros. Empieza a explicar razones. IA que analiza tus campanas y te dice por que subio o bajo cada metrica.',
})

const problems = [
  {
    before: 'Dashboards que muestran numeros sin contexto',
    after: 'Analisis automatico que explica POR QUE cambio cada metrica',
  },
  {
    before: 'Horas escribiendo resumenes para clientes',
    after: 'Resumen ejecutivo en 1 click, listo para enviar',
  },
  {
    before: 'Clientes preguntando "¿por que bajo el ROAS?"',
    after: 'Respuesta automatica con causas y acciones sugeridas',
  },
  {
    before: 'Herramientas que cobran por conector',
    after: 'Precio flat con todas las integraciones incluidas',
  },
]

const features = [
  {
    icon: 'heroicons:light-bulb',
    title: 'Analisis de Causa (RCA)',
    description: 'IA que identifica automaticamente las causas de cambios en tus metricas y sugiere acciones concretas.',
    tag: 'Unico',
  },
  {
    icon: 'heroicons:document-text',
    title: 'Narrativas AI',
    description: 'Resumenes ejecutivos generados automaticamente en el tono que prefieras. Listos para copiar y enviar.',
    tag: 'Unico',
  },
  {
    icon: 'heroicons:chart-bar-square',
    title: 'Forecasting',
    description: 'Predicciones de spend y metricas clave usando algoritmos probados. Anticipa antes de que pase.',
    tag: 'Unico',
  },
  {
    icon: 'heroicons:share',
    title: 'Dashboards Compartibles',
    description: 'Links publicos con password opcional. Tus clientes ven sus metricas cuando quieran.',
  },
  {
    icon: 'heroicons:paint-brush',
    title: 'White-label Completo',
    description: 'Tu logo, tus colores, tu dominio. Tus clientes nunca saben que usas TamarindoReports.',
  },
  {
    icon: 'heroicons:bell-alert',
    title: 'Alertas Inteligentes',
    description: 'Notificaciones automaticas cuando una metrica cambia mas del umbral que configures.',
  },
]

const testimonials = [
  {
    quote: 'Antes pasaba 2 horas por cliente escribiendo reportes. Ahora en 5 minutos tengo un resumen ejecutivo mejor que el mio.',
    author: 'Maria G.',
    role: 'Fundadora',
    company: 'Digital Growth MX',
  },
  {
    quote: 'El analisis de causa es un game-changer. Mis clientes ya no me preguntan "por que bajo", porque el reporte ya lo explica.',
    author: 'Carlos R.',
    role: 'Director de Cuentas',
    company: 'Performance Lab',
  },
  {
    quote: 'Probamos Supermetrics y AgencyAnalytics. TamarindoReports es el unico que realmente entiende las metricas.',
    author: 'Ana L.',
    role: 'CEO',
    company: 'Agencia Rocket',
  },
]
</script>

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <span class="text-white font-bold text-sm">T</span>
            </div>
            <span class="font-semibold text-gray-900">TamarindoReports</span>
          </div>
          <nav class="hidden md:flex items-center gap-8">
            <NuxtLink
              to="/demo"
              class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Demo
            </NuxtLink>
            <a
              href="#features"
              class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Funcionalidades
            </a>
            <a
              href="#comparison"
              class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Comparativa
            </a>
            <a
              href="#pricing"
              class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Precios
            </a>
          </nav>
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/login"
              class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Iniciar sesion
            </NuxtLink>
            <NuxtLink
              to="/register"
              class="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25"
            >
              Empezar gratis
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="pt-32 pb-20 bg-gradient-to-b from-amber-50/50 to-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <!-- Left: Copy -->
          <div class="text-center lg:text-left">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full mb-6">
              <Icon name="heroicons:sparkles" class="w-4 h-4" />
              <span>Potenciado por IA</span>
            </div>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Deja de explicar
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">QUE</span>
              paso.
              <br>
              Muestra
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">POR QUE</span>
              paso.
            </h1>
            <p class="text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
              La unica plataforma de reporting que analiza automaticamente las causas de los cambios en tus metricas y genera resumenes ejecutivos listos para enviar.
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <NuxtLink
                to="/register"
                class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
              >
                Empezar gratis - 14 dias
                <Icon name="heroicons:arrow-right" class="w-5 h-5 ml-2" />
              </NuxtLink>
              <NuxtLink
                to="/demo"
                class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 text-lg font-medium rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                Ver demo en vivo
              </NuxtLink>
            </div>
            <p class="mt-4 text-sm text-gray-500">
              Sin tarjeta de credito. Cancela cuando quieras.
            </p>
          </div>

          <!-- Right: Interactive Demo -->
          <div
            id="demo"
            class="lg:pl-8"
          >
            <LandingInteractiveDemo />
          </div>
        </div>
      </div>
    </section>

    <!-- Social Proof Bar -->
    <section class="py-8 bg-gray-50 border-y border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          <div class="flex items-center gap-2">
            <Icon name="heroicons:check-badge" class="w-5 h-5 text-green-500" />
            <span class="text-sm text-gray-600">+50 agencias activas</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="heroicons:clock" class="w-5 h-5 text-amber-500" />
            <span class="text-sm text-gray-600">Ahorro promedio: 4h/semana</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="heroicons:star" class="w-5 h-5 text-amber-500" />
            <span class="text-sm text-gray-600">4.9/5 satisfaccion</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="heroicons:shield-check" class="w-5 h-5 text-blue-500" />
            <span class="text-sm text-gray-600">SOC 2 en proceso</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Problem/Solution Section -->
    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            El problema con los dashboards tradicionales
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Muestran numeros, pero no explican nada. Tu cliente ve que el ROAS bajo, pero no sabe por que. Y tu tampoco. Hasta ahora.
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-6 lg:gap-8">
          <div
            v-for="(problem, i) in problems"
            :key="i"
            class="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-200 hover:border-amber-200 hover:shadow-lg transition-all"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-3">
                <Icon name="heroicons:x-circle" class="w-5 h-5 text-red-400" />
                <span class="text-sm font-medium text-red-600">Antes</span>
              </div>
              <p class="text-gray-500 line-through mb-4">{{ problem.before }}</p>
              <div class="flex items-center gap-2 mb-3">
                <Icon name="heroicons:check-circle" class="w-5 h-5 text-green-500" />
                <span class="text-sm font-medium text-green-600">Con TamarindoReports</span>
              </div>
              <p class="text-gray-900 font-medium">{{ problem.after }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section
      id="features"
      class="py-20 bg-gray-50"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Funcionalidades que ninguna otra herramienta tiene
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Construido por marketers, para marketers. Cada funcion resuelve un problema real.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="relative p-6 bg-white rounded-2xl border border-gray-200 hover:border-amber-200 hover:shadow-xl transition-all group"
          >
            <div
              v-if="feature.tag"
              class="absolute -top-2.5 right-4 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold rounded-full"
            >
              {{ feature.tag }}
            </div>
            <div class="w-12 h-12 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center mb-4 transition-colors">
              <Icon
                :name="feature.icon"
                class="w-6 h-6 text-amber-600"
              />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              {{ feature.title }}
            </h3>
            <p class="text-gray-600">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Comparison Section -->
    <section
      id="comparison"
      class="py-20"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Comparanos con la competencia
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            No solo integramos datos. Los entendemos, los analizamos, y te decimos que hacer.
          </p>
        </div>

        <LandingComparisonTable />
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Lo que dicen las agencias
          </h2>
          <p class="text-lg text-gray-600">
            Agencias reales, resultados reales.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6 lg:gap-8">
          <div
            v-for="(testimonial, i) in testimonials"
            :key="i"
            class="p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all"
          >
            <div class="flex items-center gap-1 mb-4">
              <Icon
                v-for="n in 5"
                :key="n"
                name="heroicons:star-solid"
                class="w-5 h-5 text-amber-400"
              />
            </div>
            <blockquote class="text-gray-700 mb-6">
              "{{ testimonial.quote }}"
            </blockquote>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <span class="text-white font-semibold text-sm">{{ testimonial.author.charAt(0) }}</span>
              </div>
              <div>
                <p class="font-semibold text-gray-900">{{ testimonial.author }}</p>
                <p class="text-sm text-gray-500">{{ testimonial.role }}, {{ testimonial.company }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section
      id="pricing"
      class="py-20"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Precios simples y transparentes
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Sin costos por conector. Sin sorpresas. Un precio, todas las funcionalidades.
          </p>
        </div>

        <LandingPricingSection />
      </div>
    </section>

    <!-- Final CTA Section -->
    <section class="py-20 bg-gradient-to-r from-amber-500 to-orange-500">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-6">
          Deja de reportar numeros.
          <br>
          Empieza a reportar inteligencia.
        </h2>
        <p class="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
          14 dias gratis. Sin tarjeta de credito. Setup en 5 minutos.
        </p>
        <NuxtLink
          to="/register"
          class="inline-flex items-center justify-center px-8 py-4 bg-white text-amber-600 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
        >
          Crear mi cuenta gratis
          <Icon name="heroicons:arrow-right" class="w-5 h-5 ml-2" />
        </NuxtLink>
        <p class="mt-6 text-amber-200 text-sm">
          Mas de 50 agencias ya usan TamarindoReports
        </p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-4 gap-8 mb-8">
          <!-- Brand -->
          <div class="md:col-span-2">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <span class="text-white font-bold text-sm">T</span>
              </div>
              <span class="font-semibold text-white">TamarindoReports</span>
            </div>
            <p class="text-sm max-w-xs">
              La plataforma de reporting con IA que te dice POR QUE cambian tus metricas, no solo QUE cambio.
            </p>
          </div>

          <!-- Links -->
          <div>
            <h4 class="text-white font-semibold mb-4">Producto</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="#features" class="hover:text-white transition-colors">Funcionalidades</a></li>
              <li><a href="#pricing" class="hover:text-white transition-colors">Precios</a></li>
              <li><a href="#comparison" class="hover:text-white transition-colors">Comparativa</a></li>
              <li><NuxtLink to="/login" class="hover:text-white transition-colors">Iniciar sesion</NuxtLink></li>
            </ul>
          </div>

          <div>
            <h4 class="text-white font-semibold mb-4">Legal</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="hover:text-white transition-colors">Terminos de uso</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Politica de privacidad</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div class="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-sm">
            &copy; {{ new Date().getFullYear() }} TamarindoReports. Todos los derechos reservados.
          </p>
          <div class="flex items-center gap-4">
            <a href="#" class="hover:text-white transition-colors">
              <Icon name="simple-icons:twitter" class="w-5 h-5" />
            </a>
            <a href="#" class="hover:text-white transition-colors">
              <Icon name="simple-icons:linkedin" class="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
