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
      <h1>{{ entityName }}{{ meta.h1 }}</h1>
      <p class="seo-desc">{{ entityName }}{{ meta.pageDesc }}</p>
      <a :href="`/?view=${view}&id=${id}`" class="seo-cta">{{ meta.cta }}</a>
    </main>
  </div>
</template>

<script setup lang="ts">
const VIEW_META: Record<string, {
  h1: string
  pageDesc: string
  metaDesc: string
  titleSuffix: string
  cta: string
  fallback: string
  jobTitle?: string
  entityType: 'Person' | 'Organization'
  nameKey: 'names' | 'studioNames'
}> = {
  creator:        { h1: 'の作品', pageDesc: 'の漫画・アニメ作品一覧。好きな作り手から「次に見る一本」をたどって見つけよう。', metaDesc: 'の漫画・アニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', titleSuffix: 'の作品', cta: '作品を見る →', fallback: '作り手', entityType: 'Person', nameKey: 'names' },
  director:       { h1: 'の監督作品', pageDesc: 'が監督したアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'が監督したアニメ作品一覧。Creator Discoveryで見つけよう。', titleSuffix: 'の監督作品', cta: '作品を見る →', fallback: '監督', jobTitle: 'Anime Director', entityType: 'Person', nameKey: 'names' },
  voice:          { h1: 'の出演作', pageDesc: 'が出演したアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'が出演したアニメ作品一覧。Creator Discoveryで見つけよう。', titleSuffix: 'の出演作', cta: '出演作を見る →', fallback: '声優', jobTitle: 'Voice Actor', entityType: 'Person', nameKey: 'names' },
  writing:        { h1: 'の脚本・シリーズ構成作品', pageDesc: 'が脚本・シリーズ構成を手がけたアニメ一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'が脚本・シリーズ構成を担当したアニメ一覧。高評価順・おすすめ付き。', titleSuffix: 'の脚本作品', cta: '作品を見る →', fallback: '脚本家', jobTitle: 'Screenwriter', entityType: 'Person', nameKey: 'names' },
  chardesign:     { h1: 'のキャラクターデザイン作品', pageDesc: 'がキャラクターデザインを手がけたアニメ一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'がキャラクターデザインを担当したアニメ一覧。高評価順・おすすめ付き。', titleSuffix: 'のキャラデザ作品', cta: '作品を見る →', fallback: 'キャラクターデザイナー', jobTitle: 'Character Designer', entityType: 'Person', nameKey: 'names' },
  music:          { h1: 'の音楽担当作品', pageDesc: 'が音楽を担当したアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'が音楽を担当したアニメ一覧。高評価順・おすすめ付き。', titleSuffix: 'の音楽担当作品', cta: '担当作品を見る →', fallback: '音楽担当', jobTitle: 'Composer', entityType: 'Person', nameKey: 'names' },
  'theme-singer': { h1: 'のOP/ED出演作品', pageDesc: 'がOP/EDを歌ったアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'がOP/EDを歌ったアニメ一覧。高評価順・おすすめ付き。', titleSuffix: 'のOP/ED出演作品', cta: '出演作品を見る →', fallback: 'OP/ED歌手', jobTitle: 'Singer', entityType: 'Person', nameKey: 'names' },
  'theme-lyrics': { h1: 'の作詞作品', pageDesc: 'が作詞を担当したアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'が作詞を担当したアニメ一覧。高評価順・おすすめ付き。', titleSuffix: 'の作詞作品', cta: '作詞作品を見る →', fallback: '作詞家', jobTitle: 'Lyricist', entityType: 'Person', nameKey: 'names' },
  'theme-compose':{ h1: 'の作曲・編曲作品', pageDesc: 'が作曲・編曲を担当したアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'が作曲・編曲を担当したアニメ一覧。高評価順・おすすめ付き。', titleSuffix: 'の作曲・編曲作品', cta: '担当作品を見る →', fallback: '作曲・編曲家', jobTitle: 'Composer/Arranger', entityType: 'Person', nameKey: 'names' },
  studio:         { h1: 'の制作作品', pageDesc: 'が制作したアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'が制作したアニメ一覧。高評価順の並べ替え・おすすめ付き。', titleSuffix: 'の制作作品', cta: '作品を見る →', fallback: '制作会社', entityType: 'Organization', nameKey: 'studioNames' },
}

const route = useRoute()
const view = route.params.view as string
const id = Number(route.params.id)
const meta = VIEW_META[view]

if (!meta) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

const config = useRuntimeConfig()

const { data: nameCache } = await useAsyncData('seo-names', async () => {
  if (import.meta.server) {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    try { return JSON.parse(readFileSync(resolve('public/_seo-names.json'), 'utf-8')) } catch { return null }
  }
  return $fetch<any>('/_seo-names.json').catch(() => null)
})

const entityName = computed(() => {
  if (meta.nameKey === 'studioNames') {
    return nameCache.value?.studioNames?.[id] || meta.fallback
  }
  const n = nameCache.value?.names?.[id]
  return n?.native || n?.full || meta.fallback
})

const SITE_URL = config.public.siteUrl as string
const title = computed(() => `${entityName.value}${meta.titleSuffix} — Creator Discovery`)
const desc = computed(() => `${entityName.value}${meta.metaDesc}`)

const mainEntity = computed(() => {
  const entity: Record<string, string> = { '@type': meta.entityType, name: entityName.value }
  if (meta.jobTitle) entity.jobTitle = meta.jobTitle
  return entity
})

useHead({
  title,
  link: [{ rel: 'canonical', href: `${SITE_URL}/${view}/${id}` }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: title.value,
      description: desc.value,
      url: `${SITE_URL}/${view}/${id}`,
      mainEntity: mainEntity.value,
    }),
  }],
})
useSeoMeta({
  description: desc,
  ogTitle: title,
  ogDescription: desc,
  ogUrl: `${SITE_URL}/${view}/${id}`,
  ogImage: `${SITE_URL}/og-image.png`,
  twitterCard: 'summary_large_image',
})

if (import.meta.client) {
  navigateTo({ path: '/', query: { view, id: String(id) } }, { replace: true })
}
</script>

<style scoped>
.seo-page { max-width: 700px; margin: 0 auto; padding: 40px 24px; font-family: "Zen Kaku Gothic New", system-ui, sans-serif; }
.seo-main { margin-top: 40px; }
.seo-main h1 { font-size: 32px; font-weight: 800; margin-bottom: 12px; }
.seo-desc { color: #4a4a56; line-height: 1.7; margin-bottom: 24px; }
.seo-cta { display: inline-block; padding: 12px 28px; background: #ed3a8c; color: #fff; border-radius: 999px; text-decoration: none; font-weight: 700; }
</style>
