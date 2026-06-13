export default defineNuxtConfig({
  compatibilityDate: '2026-06-14',
  telemetry: false,
  devtools: { enabled: false },
  typescript: {
    shim: false
  },
  runtimeConfig: {
    public: {
      anilistEndpoint: 'https://graphql.anilist.co'
    }
  }
})
