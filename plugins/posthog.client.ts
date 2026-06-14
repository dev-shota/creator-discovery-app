import posthog from 'posthog-js'

// PostHog アナリティクス（client-only）。
// key は runtimeConfig.public（generate 時に NUXT_PUBLIC_POSTHOG_KEY で注入）から読む。
// key が空なら何も初期化せず即 return ＝ローカル/未設定環境では一切送信しない（phone home しない）。
// cookie モード ON: 本人が cookie 利用に同意済みで country/GeoIP を取りたい。
// autocapture OFF: クォータ節約＋プライバシー。capture_pageleave ON: 直帰/滞在の計測。
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const key = (config.public.posthogKey as string) || ''
  const host = (config.public.posthogHost as string) || 'https://us.i.posthog.com'

  // key 未設定 = 無効。no-op で返す（$posthog?.capture の optional-chaining で安全に握り潰される）。
  if (!key) return

  posthog.init(key, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: 'always'
  })

  // 初期 $pageview を1回手動で送り、以降は SPA 遷移（?staff=ID のクエリ変化含む）ごとに送る。
  posthog.capture('$pageview')
  useRouter().afterEach(() => {
    posthog.capture('$pageview')
  })

  return {
    provide: { posthog }
  }
})
