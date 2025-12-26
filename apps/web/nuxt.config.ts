// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Enable Nuxt 4 compatibility
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2024-12-26',

  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/icon',
  ],

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: false, // Disabled in dev, run pnpm typecheck manually
  },

  // Runtime config (env variables)
  runtimeConfig: {
    // Server-side only
    databaseUrl: process.env.DATABASE_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    facebookAppId: process.env.FACEBOOK_APP_ID,
    facebookAppSecret: process.env.FACEBOOK_APP_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    redisUrl: process.env.REDIS_URL,
    jwtSecret: process.env.JWT_SECRET,

    // Public (exposed to client)
    public: {
      appName: 'TamarindoReports',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },

  // App configuration
  app: {
    head: {
      title: 'TamarindoReports - Marketing Reports Made Easy',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Create beautiful marketing reports with AI-powered insights. Connect Google Ads, Facebook Ads, and more.',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  // Tailwind configuration
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
  },

  // Nitro server configuration
  nitro: {
    preset: 'node-server',
  },
})
