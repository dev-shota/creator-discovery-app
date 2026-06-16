export default defineNuxtConfig({
  compatibilityDate: '2026-06-14',
  telemetry: false,
  devtools: { enabled: false },
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

      try {
        const res: any = await gql(`{
          creators: Page(perPage: 50) { staff(sort: FAVOURITES_DESC) { id } }
          studios: Page(perPage: 30) { studios(sort: FAVOURITES_DESC) { id } }
        }`)
        const staffIds: number[] = (res?.data?.creators?.staff ?? []).map((s: any) => s.id)
        const studioIds: number[] = (res?.data?.studios?.studios ?? []).map((s: any) => s.id)

        const staffViews = ['creator', 'director', 'voice', 'music', 'theme-singer', 'theme-lyrics', 'theme-compose']
        for (const id of staffIds) {
          for (const v of staffViews) ctx.routes.add(`/${v}/${id}`)
        }
        for (const id of studioIds) ctx.routes.add(`/studio/${id}`)
        console.log(`[prerender] Added ${staffIds.length * staffViews.length} staff + ${studioIds.length} studio routes`)

        const names: Record<string, { full: string; native: string | null }> = {}
        const studioNames: Record<string, string> = {}

        for (let i = 0; i < staffIds.length; i += 25) {
          const batch = staffIds.slice(i, i + 25)
          const r: any = await gql(`{ Page(perPage:25) { staff(id_in:[${batch}]) { id name { full native } } } }`)
          for (const s of r?.data?.Page?.staff ?? []) names[s.id] = s.name
        }
        for (let i = 0; i < studioIds.length; i += 25) {
          const batch = studioIds.slice(i, i + 25)
          const r: any = await gql(`{ Page(perPage:25) { studios(id_in:[${batch}]) { id name } } }`)
          for (const s of r?.data?.Page?.studios ?? []) studioNames[s.id] = s.name
        }

        const { writeFileSync } = await import('node:fs')
        const { resolve } = await import('node:path')
        writeFileSync(resolve('public/_seo-names.json'), JSON.stringify({ names, studioNames }), 'utf-8')
        console.log(`[prerender] Cached ${Object.keys(names).length} staff + ${Object.keys(studioNames).length} studio names`)

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
      link: [
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
