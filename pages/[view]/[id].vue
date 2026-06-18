<template>
  <div class="seo-page">
    <header class="topbar">
      <a class="brand" href="/">
        <span class="brand-mark" aria-hidden="true">
          <img src="/logo-96.webp" alt="" width="32" height="32" />
        </span>
        <span class="brand-name">Creator Discovery</span>
      </a>
    </header>
    <main class="seo-main">
      <div class="seo-profile">
        <img v-if="entityImage" :src="entityImage" :alt="entityName" class="seo-avatar" width="96" height="96" loading="eager" />
        <div>
          <h1>{{ entityName }}{{ meta.h1 }}</h1>
          <p class="seo-role" v-if="meta.jobTitle">{{ meta.fallback }}</p>
        </div>
      </div>
      <p class="seo-desc">{{ entityName }}{{ meta.pageDesc }}</p>

      <div v-if="works.length > 0" class="seo-works">
        <h2>代表作品</h2>
        <ul class="seo-works-list">
          <li v-for="(w, i) in works" :key="i" class="seo-work-item">
            <span class="seo-work-title">{{ w.title }}<span v-if="w.romaji && w.romaji !== w.title" class="seo-work-romaji"> ({{ w.romaji }})</span></span>
            <span v-if="w.score" class="seo-work-score">★{{ w.score }}</span>
            <span v-if="w.year" class="seo-work-year">{{ w.year }}年</span>
            <span v-if="w.genres && w.genres.length" class="seo-work-genres">{{ w.genres.join(' / ') }}</span>
          </li>
        </ul>
      </div>

      <a :href="`/?view=${view}&id=${id}`" class="seo-cta">{{ meta.cta }}</a>
      <p class="seo-note">全作品をスコア・ジャンル・フィルタ付きで閲覧できます。</p>
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
  worksKey: 'staffWorks' | 'studioWorks'
}> = {
  creator:        { h1: 'の作品', pageDesc: 'の漫画・アニメ作品一覧。好きな作り手から「次に見る一本」をたどって見つけよう。', metaDesc: 'の漫画・アニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', titleSuffix: 'の作品', cta: '全作品を見る →', fallback: '作り手', entityType: 'Person', nameKey: 'names', worksKey: 'staffWorks' },
  director:       { h1: 'の監督作品', pageDesc: 'が監督したアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'が監督したアニメ作品一覧。Creator Discoveryで見つけよう。', titleSuffix: 'の監督作品', cta: '全作品を見る →', fallback: '監督', jobTitle: 'Anime Director', entityType: 'Person', nameKey: 'names', worksKey: 'staffWorks' },
  voice:          { h1: 'の出演作', pageDesc: 'が出演したアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'が出演したアニメ作品一覧。Creator Discoveryで見つけよう。', titleSuffix: 'の出演作', cta: '全出演作を見る →', fallback: '声優', jobTitle: 'Voice Actor', entityType: 'Person', nameKey: 'names', worksKey: 'staffWorks' },
  writing:        { h1: 'の脚本・シリーズ構成作品', pageDesc: 'が脚本・シリーズ構成を手がけたアニメ一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'が脚本・シリーズ構成を担当したアニメ一覧。高評価順・おすすめ付き。', titleSuffix: 'の脚本作品', cta: '全作品を見る →', fallback: '脚本家', jobTitle: 'Screenwriter', entityType: 'Person', nameKey: 'names', worksKey: 'staffWorks' },
  chardesign:     { h1: 'のキャラクターデザイン作品', pageDesc: 'がキャラクターデザインを手がけたアニメ一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'がキャラクターデザインを担当したアニメ一覧。高評価順・おすすめ付き。', titleSuffix: 'のキャラデザ作品', cta: '全作品を見る →', fallback: 'キャラクターデザイナー', jobTitle: 'Character Designer', entityType: 'Person', nameKey: 'names', worksKey: 'staffWorks' },
  music:          { h1: 'の音楽担当作品', pageDesc: 'が音楽を担当したアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'が音楽を担当したアニメ一覧。高評価順・おすすめ付き。', titleSuffix: 'の音楽担当作品', cta: '全担当作品を見る →', fallback: '音楽担当', jobTitle: 'Composer', entityType: 'Person', nameKey: 'names', worksKey: 'staffWorks' },
  'theme-singer': { h1: 'のOP/ED出演作品', pageDesc: 'がOP/EDを歌ったアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'がOP/EDを歌ったアニメ一覧。高評価順・おすすめ付き。', titleSuffix: 'のOP/ED出演作品', cta: '全出演作品を見る →', fallback: 'OP/ED歌手', jobTitle: 'Singer', entityType: 'Person', nameKey: 'names', worksKey: 'staffWorks' },
  'theme-lyrics': { h1: 'の作詞作品', pageDesc: 'が作詞を担当したアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'が作詞を担当したアニメ一覧。高評価順・おすすめ付き。', titleSuffix: 'の作詞作品', cta: '全作詞作品を見る →', fallback: '作詞家', jobTitle: 'Lyricist', entityType: 'Person', nameKey: 'names', worksKey: 'staffWorks' },
  'theme-compose':{ h1: 'の作曲・編曲作品', pageDesc: 'が作曲・編曲を担当したアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'が作曲・編曲を担当したアニメ一覧。高評価順・おすすめ付き。', titleSuffix: 'の作曲・編曲作品', cta: '全担当作品を見る →', fallback: '作曲・編曲家', jobTitle: 'Composer/Arranger', entityType: 'Person', nameKey: 'names', worksKey: 'staffWorks' },
  studio:         { h1: 'の制作作品', pageDesc: 'が制作したアニメ作品一覧。高評価順・おすすめ付き。Creator Discoveryで見つけよう。', metaDesc: 'が制作したアニメ一覧。高評価順の並べ替え・おすすめ付き。', titleSuffix: 'の制作作品', cta: '全作品を見る →', fallback: '制作会社', entityType: 'Organization', nameKey: 'studioNames', worksKey: 'studioWorks' },
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

const entityImage = computed(() => {
  if (meta.nameKey !== 'names') return null
  return nameCache.value?.names?.[id]?.image || null
})

const works = computed(() => {
  const w = nameCache.value?.[meta.worksKey]?.[id]
  return Array.isArray(w) ? w : []
})

const SITE_URL = config.public.siteUrl as string
const title = computed(() => `${entityName.value}${meta.titleSuffix} — Creator Discovery`)
const desc = computed(() => {
  const base = `${entityName.value}${meta.metaDesc}`
  if (works.value.length > 0) {
    const top = works.value.slice(0, 3).map(w => w.title).join('、')
    return `${base} 代表作: ${top}`
  }
  return base
})

const jsonLd = computed(() => {
  const entity: Record<string, any> = {
    '@type': meta.entityType,
    name: entityName.value,
    url: meta.entityType === 'Organization' ? `https://anilist.co/studio/${id}` : `https://anilist.co/staff/${id}`,
  }
  if (meta.jobTitle) entity.jobTitle = meta.jobTitle
  if (entityImage.value) entity.image = entityImage.value

  const result: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: title.value,
    description: desc.value,
    url: `${SITE_URL}/${view}/${id}`,
    mainEntity: entity,
  }

  if (works.value.length > 0) {
    result.hasPart = {
      '@type': 'ItemList',
      name: `${entityName.value}${meta.h1}`,
      numberOfItems: works.value.length,
      itemListElement: works.value.map((w, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'CreativeWork',
          name: w.title,
          ...(w.year ? { datePublished: String(w.year) } : {}),
          ...(w.genres.length ? { genre: w.genres } : {}),
        },
      })),
    }
  }

  return result
})

useHead({
  title,
  link: [{ rel: 'canonical', href: `${SITE_URL}/${view}/${id}` }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify(jsonLd.value),
  }],
})
useSeoMeta({
  description: desc,
  ogTitle: title,
  ogDescription: desc,
  ogUrl: `${SITE_URL}/${view}/${id}`,
  ogImage: entityImage.value || `${SITE_URL}/og-image.png`,
  twitterCard: 'summary_large_image',
})

if (import.meta.client) {
  navigateTo({ path: '/', query: { view, id: String(id) } }, { replace: true })
}
</script>

<style scoped>
.seo-page { max-width: 700px; margin: 0 auto; padding: 40px 24px; font-family: "Zen Kaku Gothic New", system-ui, sans-serif; }
.seo-main { margin-top: 40px; }
.seo-profile { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
.seo-avatar { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; background: #f0f0f4; }
.seo-profile h1 { font-size: 28px; font-weight: 800; margin: 0; line-height: 1.3; }
.seo-role { font-size: 15px; color: #70707d; margin-top: 4px; }
.seo-desc { color: #4a4a56; line-height: 1.7; margin-bottom: 24px; }
.seo-works { margin-bottom: 28px; }
.seo-works h2 { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
.seo-works-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.seo-work-item { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; padding: 10px 14px; background: #f8f8fc; border-radius: 10px; }
.seo-work-title { font-weight: 700; font-size: 15px; }
.seo-work-romaji { font-weight: 400; color: #70707d; font-size: 13px; }
.seo-work-score { color: #ed3a8c; font-weight: 700; font-size: 14px; }
.seo-work-year { color: #70707d; font-size: 13px; }
.seo-work-genres { color: #70707d; font-size: 12px; }
.seo-cta { display: inline-block; padding: 14px 32px; background: #ed3a8c; color: #fff; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 16px; }
.seo-cta:hover { opacity: 0.9; }
.seo-note { margin-top: 12px; font-size: 13px; color: #70707d; }

@media (prefers-color-scheme: dark) {
  .seo-page { background: #141420; color: #e4e4f0; }
  .seo-desc { color: #a0a0b8; }
  .seo-work-item { background: #1e1e32; }
  .seo-work-year, .seo-work-genres, .seo-role, .seo-note { color: #8888a0; }
}
</style>
