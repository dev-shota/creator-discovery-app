export default defineNuxtConfig({
  compatibilityDate: '2026-06-14',
  telemetry: false,
  devtools: { enabled: false },
  // このアプリは client-side で AniList を叩く純静的サイト。Cloudflare のビルド環境は
  // 放っておくと Nitro が cloudflare-module（サーバ Worker）プリセットを自動選択し、
  // `nuxt generate`（prerender）と食い違って index.mjs 不在で deploy が落ちる。
  // ここで static を固定し、ローカル＝本番ともに `.output/public` の純静的出力に統一する。
  nitro: { preset: 'static' },
  typescript: {
    shim: false
  },
  css: ['~/assets/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'ja' },
      link: [
        // favicon（public/favicon.svg）
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
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
      affiliateTag: ''
    }
  }
})
