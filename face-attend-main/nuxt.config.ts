// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'face-attend-secret-change-in-production-2026',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/faceattend',
    public: {
      apiBase: '/api',
    },
  },

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.ts',
  },

  nitro: {
    experimental: {
      asyncContext: true,
    },
  },
})
