<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: 'TamarindoReports - Marketing Reports Made Easy',
  description: 'Create beautiful marketing reports with AI-powered insights. Connect Google Ads, Facebook Ads, and more.',
})

const features = [
  {
    icon: 'heroicons:chart-bar',
    title: 'Multi-Platform Reports',
    description: 'Connect Google Ads, Facebook Ads, and more. Get all your metrics in one place.',
  },
  {
    icon: 'heroicons:sparkles',
    title: 'AI-Powered Insights',
    description: 'Let AI analyze your data and provide actionable recommendations.',
  },
  {
    icon: 'heroicons:share',
    title: 'Shareable Dashboards',
    description: 'Create beautiful micro-dashboards with password protection for your clients.',
  },
  {
    icon: 'heroicons:paint-brush',
    title: 'White Label',
    description: 'Customize reports with your agency\'s branding. Your logo, your colors.',
  },
]
</script>

<template>
  <div>
    <!-- Header -->
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-tamarindo-500 flex items-center justify-center">
              <span class="text-white font-bold text-sm">T</span>
            </div>
            <span class="font-semibold text-gray-900">TamarindoReports</span>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/login"
              class="text-gray-600 hover:text-gray-900"
            >
              Login
            </NuxtLink>
            <NuxtLink
              to="/register"
              class="btn-primary"
            >
              Start Free Trial
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="bg-gradient-to-b from-white to-gray-50 py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
          Marketing Reports
          <span class="text-tamarindo-500">Made Easy</span>
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Stop wasting hours on spreadsheets. Create beautiful, automated reports with AI-powered insights your clients will love.
        </p>
        <div class="flex items-center justify-center gap-4">
          <NuxtLink
            to="/register"
            class="btn-primary text-lg px-8 py-3"
          >
            Start Free Trial
          </NuxtLink>
          <NuxtLink
            to="#features"
            class="btn-outline text-lg px-8 py-3"
          >
            See Features
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section
      id="features"
      class="py-20"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">
            Everything you need to impress your clients
          </h2>
          <p class="text-lg text-gray-600">
            Built by agencies, for agencies. We know what you need.
          </p>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="card card-body text-center"
          >
            <div class="w-12 h-12 rounded-lg bg-tamarindo-100 flex items-center justify-center mx-auto mb-4">
              <Icon
                :name="feature.icon"
                class="w-6 h-6 text-tamarindo-600"
              />
            </div>
            <h3 class="font-semibold text-gray-900 mb-2">
              {{ feature.title }}
            </h3>
            <p class="text-gray-600 text-sm">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-tamarindo-500 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold text-white mb-4">
          Ready to save hours every week?
        </h2>
        <p class="text-tamarindo-100 text-lg mb-8">
          Start your 14-day free trial. No credit card required.
        </p>
        <NuxtLink
          to="/register"
          class="inline-flex items-center justify-center px-8 py-3 bg-white text-tamarindo-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Get Started Free
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-tamarindo-500 flex items-center justify-center">
              <span class="text-white font-bold text-sm">T</span>
            </div>
            <span class="font-semibold text-white">TamarindoReports</span>
          </div>
          <p class="text-sm">
            &copy; {{ new Date().getFullYear() }} TamarindoReports. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
