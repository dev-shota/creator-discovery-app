<template>
  <div class="seo-page">
    <header class="topbar">
      <a class="brand" href="/">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="32" height="32">
            <rect width="64" height="64" rx="16" fill="#ed3a8c" />
            <circle cx="50" cy="15" r="6" fill="#eff33c" />
            <circle cx="28" cy="30" r="12" fill="none" stroke="#fff" stroke-width="5" />
            <line x1="37" y1="39" x2="49" y2="51" stroke="#fff" stroke-width="6" stroke-linecap="round" />
          </svg>
        </span>
        <span class="brand-name">Creator Discovery</span>
      </a>
    </header>
    <main class="seo-main">
      <h1>{{ staffName }}の作詞作品</h1>
      <p class="seo-desc">{{ staffName }}が作詞を担当したアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。</p>
      <a :href="`/?view=theme-lyrics&id=${id}`" class="seo-cta">作詞作品を見る →</a>
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const id = Number(route.params.id)
const config = useRuntimeConfig()

const { data: nameCache } = await useAsyncData('seo-names', async () => {
  if (import.meta.server) {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    try { return JSON.parse(readFileSync(resolve('public/_seo-names.json'), 'utf-8')) } catch { return null }
  }
  return $fetch<any>('/_seo-names.json').catch(() => null)
})

const staffName = computed(() => {
  const n = nameCache.value?.names?.[id]
  return n?.native || n?.full || '作詞家'
})

const SITE_URL = config.public.siteUrl as string
const title = computed(() => `${staffName.value}の作詞作品 — Creator Discovery`)
const desc = computed(() => `${staffName.value}が作詞を担当したアニメ一覧。高評価順・おすすめ付き。`)

useHead({ title })
useSeoMeta({
  description: desc,
  ogTitle: title,
  ogDescription: desc,
  ogUrl: `${SITE_URL}/theme-lyrics/${id}`,
  ogImage: `${SITE_URL}/og-image.png`,
  twitterCard: 'summary_large_image',
})

if (import.meta.client) {
  navigateTo({ path: '/', query: { view: 'theme-lyrics', id: String(id) } }, { replace: true })
}
</script>

<style scoped>
.seo-page { max-width: 700px; margin: 0 auto; padding: 40px 24px; font-family: "Zen Kaku Gothic New", system-ui, sans-serif; }
.seo-main { margin-top: 40px; }
.seo-main h1 { font-size: 32px; font-weight: 800; margin-bottom: 12px; }
.seo-desc { color: #4a4a56; line-height: 1.7; margin-bottom: 24px; }
.seo-cta { display: inline-block; padding: 12px 28px; background: #ed3a8c; color: #fff; border-radius: 999px; text-decoration: none; font-weight: 700; }
</style>
