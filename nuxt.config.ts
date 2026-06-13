export default defineNuxtConfig({
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
