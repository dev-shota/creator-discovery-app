export default defineNuxtConfig({
  compatibilityDate: '2026-06-14',
  telemetry: false,
  devtools: { enabled: false },
  modules: ['@nuxt/image'],
  // @nuxt/image: 外部画像（AniList CDN）は domains 未登録のためパススルー（URL そのまま）。
  // NuxtImg コンポーネントが decoding="async" を自動付与する。
  // WebP 自動変換を有効にするには Cloudflare Image Resizing (Pro plan+) が必要:
  //   provider: 'cloudflare',
  //   cloudflare: { baseURL: 'https://<custom-domain>/cdn-cgi/image/' },
  //   domains: ['s4.anilist.co'],
  image: {
    quality: 80,
    format: ['webp'],
  },
  // このアプリは client-side で AniList を叩く純静的サイト。Cloudflare のビルド環境は
  // 放っておくと Nitro が cloudflare-module（サーバ Worker）プリセットを自動選択し、
  // `nuxt generate`（prerender）と食い違って index.mjs 不在で deploy が落ちる。
  // ここで static を固定し、ローカル＝本番ともに `.output/public` の純静的出力に統一する。
  nitro: {
    preset: 'static',
    prerender: { concurrency: 5 },
  },
  hooks: {
    async 'prerender:routes'(ctx) {
      const AL = 'https://graphql.anilist.co'
      const gql = (query: string) => globalThis.fetch(AL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(15000),
      }).then(r => r.json())

      const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

      try {
        const res: any = await gql(`{
          creators: Page(perPage: 50) { staff(sort: FAVOURITES_DESC) { id } }
          studios: Page(perPage: 30) { studios(sort: FAVOURITES_DESC) { id } }
        }`)
        const staffIds: number[] = (res?.data?.creators?.staff ?? []).map((s: any) => s.id)
        const studioIds: number[] = (res?.data?.studios?.studios ?? []).map((s: any) => s.id)

        const staffViews = ['creator', 'director', 'voice', 'writing', 'chardesign', 'music', 'theme-singer', 'theme-lyrics', 'theme-compose']
        for (const id of staffIds) {
          for (const v of staffViews) ctx.routes.add(`/${v}/${id}`)
        }
        for (const id of studioIds) ctx.routes.add(`/studio/${id}`)
        console.log(`[prerender] Added ${staffIds.length * staffViews.length} staff + ${studioIds.length} studio routes`)

        const names: Record<string, { full: string; native: string | null; image?: string }> = {}
        const studioNames: Record<string, string> = {}
        const staffWorks: Record<string, { title: string; score: number | null; year: number | null; format: string | null; genres: string[] }[]> = {}
        const studioWorks: Record<string, { title: string; score: number | null; year: number | null; format: string | null; genres: string[] }[]> = {}

        for (let i = 0; i < staffIds.length; i += 25) {
          const batch = staffIds.slice(i, i + 25)
          const r: any = await gql(`{ Page(perPage:25) { staff(id_in:[${batch}]) { id name { full native } image { medium } } } }`)
          for (const s of r?.data?.Page?.staff ?? []) {
            names[s.id] = { full: s.name.full, native: s.name.native, image: s.image?.medium || undefined }
          }
        }
        for (let i = 0; i < studioIds.length; i += 25) {
          const batch = studioIds.slice(i, i + 25)
          const r: any = await gql(`{ Page(perPage:25) { studios(id_in:[${batch}]) { id name } } }`)
          for (const s of r?.data?.Page?.studios ?? []) studioNames[s.id] = s.name
        }

        // Fetch top 5 works per staff (batched 5 per query via aliases)
        for (let i = 0; i < staffIds.length; i += 5) {
          const batch = staffIds.slice(i, i + 5)
          const aliases = batch.map(id =>
            `s${id}: Staff(id:${id}) { staffMedia(sort:POPULARITY_DESC,perPage:5) { nodes { title { native romaji } averageScore startDate { year } format genres } } }`
          ).join('\n')
          try {
            const r: any = await gql(`{ ${aliases} }`)
            for (const id of batch) {
              const nodes = r?.data?.[`s${id}`]?.staffMedia?.nodes ?? []
              const seen = new Set<string>()
              staffWorks[id] = nodes.filter((n: any) => {
                const key = `${n.title?.native || n.title?.romaji || ''}_${n.startDate?.year ?? ''}_${n.format ?? ''}`
                if (seen.has(key)) return false
                seen.add(key)
                return true
              }).map((n: any) => ({
                title: n.title?.native || n.title?.romaji || '',
                romaji: n.title?.romaji || '',
                score: n.averageScore ?? null,
                year: n.startDate?.year ?? null,
                format: n.format ?? null,
                genres: (n.genres ?? []).slice(0, 3),
              }))
            }
          } catch { /* rate limit or error — skip batch, works will be empty */ }
          if (i + 5 < staffIds.length) await sleep(700)
        }
        console.log(`[prerender] Fetched works for ${Object.keys(staffWorks).length} staff`)

        // Fetch top 5 works per studio (batched 5 per query)
        for (let i = 0; i < studioIds.length; i += 5) {
          const batch = studioIds.slice(i, i + 5)
          const aliases = batch.map(id =>
            `st${id}: Studio(id:${id}) { media(sort:POPULARITY_DESC,perPage:5,isMain:true) { nodes { title { native romaji } averageScore startDate { year } format genres } } }`
          ).join('\n')
          try {
            const r: any = await gql(`{ ${aliases} }`)
            for (const id of batch) {
              const nodes = r?.data?.[`st${id}`]?.media?.nodes ?? []
              const seen = new Set<string>()
              studioWorks[id] = nodes.filter((n: any) => {
                const key = `${n.title?.native || n.title?.romaji || ''}_${n.startDate?.year ?? ''}_${n.format ?? ''}`
                if (seen.has(key)) return false
                seen.add(key)
                return true
              }).map((n: any) => ({
                title: n.title?.native || n.title?.romaji || '',
                romaji: n.title?.romaji || '',
                score: n.averageScore ?? null,
                year: n.startDate?.year ?? null,
                format: n.format ?? null,
                genres: (n.genres ?? []).slice(0, 3),
              }))
            }
          } catch { /* skip batch */ }
          if (i + 5 < studioIds.length) await sleep(700)
        }
        console.log(`[prerender] Fetched works for ${Object.keys(studioWorks).length} studios`)

        const { writeFileSync } = await import('node:fs')
        const { resolve } = await import('node:path')
        writeFileSync(resolve('public/_seo-names.json'), JSON.stringify({ names, studioNames, staffWorks, studioWorks }), 'utf-8')
        console.log(`[prerender] Cached ${Object.keys(names).length} staff + ${Object.keys(studioNames).length} studio names + works`)

        const siteUrl = 'https://creator-discovery-app.devshota-works.workers.dev'
        const allRoutes = ['/']
        for (const id of staffIds) { for (const v of staffViews) allRoutes.push(`/${v}/${id}`) }
        for (const id of studioIds) allRoutes.push(`/studio/${id}`)
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allRoutes.map(r => `  <url><loc>${siteUrl}${r}</loc></url>`).join('\n')}\n</urlset>\n`
        writeFileSync(resolve('public/sitemap.xml'), xml, 'utf-8')
        console.log(`[prerender] Wrote sitemap.xml with ${allRoutes.length} URLs`)
      } catch (e) {
        console.warn('[prerender] AniList fetch failed, skipping SEO routes:', (e as Error).message)
      }
    }
  },
  typescript: {
    shim: false
  },
  css: ['~/assets/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'ja' },
      meta: [
        { name: 'theme-color', content: '#ed3a8c' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
      script: [{
        innerHTML: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){if(matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.classList.add('dark')}})()`,
        tagPosition: 'head',
      }],
      link: [
        { rel: 'alternate', hreflang: 'ja', href: 'https://creator-discovery-app.devshota-works.workers.dev/' },
        { rel: 'alternate', hreflang: 'x-default', href: 'https://creator-discovery-app.devshota-works.workers.dev/' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/favicon.svg' },
        { rel: 'manifest', href: '/manifest.json' },
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'preconnect',
          href: 'https://s4.anilist.co',
        },
        {
          // PLAY/GROUND 系: 丸み JP サンセリフ + ロゴ用ラウンド + 手書きスクリプト
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=M+PLUS+Rounded+1c:wght@700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap'
        }
      ]
    }
  },
  // runtimeConfig.public は SSG では generate 時にビルドへ焼き込まれる。
  // 値は NUXT_PUBLIC_* 環境変数で generate 直前に上書きできる（Cloudflare Pages の
  // build 環境変数で設定可能）。コードは必ずここを単一の真実として参照する。
  runtimeConfig: {
    public: {
      // AniList GraphQL エンドポイント（R1: 直書き定数を廃しここへ寄せた）
      anilistEndpoint: 'https://graphql.anilist.co',
      // 公開ドメイン。OGP 画像/URL を絶対化する（X 等の共有カードは相対 URL の画像を出さない）。
      // 既定を本番 URL に固定し、env 未設定でもカード画像が出るようにする。独自ドメイン化したら
      // NUXT_PUBLIC_SITE_URL で上書き。
      siteUrl: 'https://creator-discovery-app.devshota-works.workers.dev',
      // アフィリエイトの構造的シーム（R4）。空＝中立（タグ無し・コミッション無し）。
      // 有効化は RED（外向き・不可逆）: Amazon アソシエイト承認後に
      // NUXT_PUBLIC_AFFILIATE_TAG=yourtag-22 を generate 環境に設定するだけ。
      affiliateTag: '',
      // PostHog アナリティクス。空=無効、NUXT_PUBLIC_POSTHOG_KEY/_HOST で generate 時に注入、ハードコード禁止。
      posthogKey: '',
      posthogHost: 'https://us.i.posthog.com'
    }
  }
})
