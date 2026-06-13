# CLAUDE.md — creator-discovery-app（app repo 内・薄い操作レイヤー）

要件定義・受け入れ基準・自律境界の正典は `GOAL.md`。設計の why は個人 vault
`ai-memory/creator-discovery-app-status.md`。ここは将来の自律セッションが再発見せずに
済むための「技術的地雷メモ」だけを置く。

## 構成

- 全機能は `pages/index.vue`（単一ファイル）+ `assets/main.css`。バックエンド無し。
- 設定は `nuxt.config.ts` の `runtimeConfig.public` に一本化（endpoint / siteUrl / affiliateTag）。
  コードは必ずここを参照する（直書き定数を新設しない）。

## 技術的地雷（実コードで検証済み・壊さない）

- **AniList は `relations` 配下に `studios` をネストすると 500**（relation ノード毎に1エラー＝
  既知の制約。perPage=1 でも死ぬ）。studio は2フェーズ:
  ① 漫画→`relations{edges{relationType node{id type}}}`（studios なし）
  ② `ADAPTATION×ANIME` の id を集め `Page.media(id_in:[…],type:ANIME){studios(isMain:true){…}}` で一括（50件ずつ）。
- **検索**: AniList は かな↔漢字・ひら↔カナ を変換しない＝複数表記を投げて id で統合。
  relevance は「クエリ全トークンが name に部分一致」で AND 絞り（語順非依存）。`wanakana` 使用。
- **CLI から AniList を検証するときは browser UA 必須**（無いと Cloudflare 1010）。
- **レート**: 90 req/min（一時 30）。client-side ＝各訪問者が自分の IP 予算を使う。
  studio バッジは1作者で複数 media を引くのでヘビーユーザーが 429 を踏みうる
  → UI は 429 を検出して「少し待って再試行」を表示する（握り潰さない）。
- **カバー画像は hotlink のみ。再ホストしない**（出版社著作物・商用化の一方通行リスク）。

## ビルド / デプロイ

- `npm run generate` → `.output/public`（静的）。`generate` は AniList を叩かない。
- デプロイは Cloudflare Pages（build `npx nuxt generate` / output `.output/public`）。詳細 `HANDOFF.md`。
- **公開デプロイ・repo public 化・アフィリエイト有効化は RED（外向き・不可逆）＝自律実行では踏まない。**
