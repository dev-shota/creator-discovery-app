# creator-discovery-app

「好きな作り手 → その人の他作品/系譜」を辿る discovery アプリ（v0・漫画作者軸）。
AniList の GraphQL API を直叩きし、漫画スタッフ（原作者・作画担当等）を検索 →
その作品をグリッド表示 → アニメ化作には制作会社（studio）バッジを付ける。

バックエンド無し（client-side fetch のみ）。静的サイトとして配信できる。

## 起動（開発）

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く。

## 機能（v0）

- スタッフ名で検索（漢字・かな・ローマ字。かな↔漢字は AniList が変換しないため複数表記を投げて id で統合）
- 候補リストから選択 → その人の漫画作品をグリッド表示
  - staffRole フィルタ: `Story & Art` / `Story` / `Original Creator` のみ採用（声優等のノイズを除外）
- カバー画像・タイトル（native 優先）・開始年・AniList リンク
- **studio バッジ**: アニメ化作に制作会社をピル表示（頻度順・上位2＋`+N` で展開）
- loading / empty / error / **レート上限（429）** の各状態を表示
- 各作品に「Amazon で探す」リンク（現在は中立＝アフィリエイトタグ無し）

## アーキテクチャ

- Nuxt 3 + TypeScript。全機能は `pages/index.vue`（単一ファイル）+ `assets/main.css`。
- 設定は `nuxt.config.ts` の `runtimeConfig.public` に集約（エンドポイント・公開URL・アフィリエイトタグ）。
  値は `NUXT_PUBLIC_*` 環境変数で `generate` 直前に上書きできる。
- データ層は AniList のみ（認証不要・90 req/min、一時 30）。client-side fetch なので
  各訪問者が自分の IP のレート予算を使う＝サーバ共有予算もサーバコストも無い。

### 不変条件（壊さない）

- **カバー画像は AniList CDN を hotlink するだけ。再ホスト（ダウンロード保存して配信）しない。**
  カバーは出版社の著作物であり AniList も再利用権を付与しない。再ホスト＋商用化は法務上の一方通行。
- AniList の `relations` 配下に `studios` をネストすると 500 になる（既知の制約）。
  studio は2フェーズで取る（漫画の `relations` から ADAPTATION×ANIME の id を集め、別クエリで `Page.media(id_in:…)` の studios を一括取得）。`pages/index.vue` のこの形を壊さない。

## デザイン

遊び心のある有機的（playful / organic）な方向。参考は動画「Claude Design × GPT image 2」
（shin-sibainu / PLAY/GROUND）。柔らかい抽象シェイプがふわっと浮く・余白広め・丸み・パステル。

- パレット: pink `#ED3A8C` / yellow `#EFF33C` / teal `#2DC7C0` / purple `#A78BFA`、白背景、インク `#2A2A33`。
- フォント: 見出し/ロゴ `M PLUS Rounded 1c`、本文 `Zen Kaku Gothic New`、ワンポイント手書き `Caveat`。
- 背景の有機シェイプは **CSS グラデーション＋float アニメで標準装備**（画像不要・`prefers-reduced-motion` 尊重）。
- よりリッチにしたい時は **GPT image 2 で素材画像を作って差し替える**。プロンプト集と手順は `ASSET-PROMPTS.md`。

## ビルド & 静的出力

```bash
npm run generate   # → .output/public に静的サイトを生成
npx serve .output/public   # ローカルで配信確認（または npm run preview）
```

`generate` は AniList を叩かない（fetch はすべてユーザー操作起点の client-side）。
プリレンダは `/`・`/200.html`・`/404.html` のみ。

## デプロイ（Cloudflare Pages・静的・無料枠）

GitHub 連携の auto-build を想定。Cloudflare Pages のプロジェクト設定:

| 項目 | 値 |
|---|---|
| Framework preset | Nuxt.js（または None） |
| Build command | `npx nuxt generate` |
| Build output directory | `.output/public` |
| Node version | `.nvmrc`（=22）が尊重される。されない場合は環境変数 `NODE_VERSION=22` |

任意のビルド環境変数（設定すると有効化される）:

- `NUXT_PUBLIC_SITE_URL` … 公開ドメイン（例 `https://creator-discovery.pages.dev`）。
  設定すると OGP 画像が絶対 URL になり、SNS の共有カード互換性が上がる。
- `NUXT_PUBLIC_AFFILIATE_TAG` … Amazon アソシエイトのタグ ID。**設定すると収益化が有効になる（RED・下記）。**

> 検証環境: ローカル `node v24.15` で `npm run generate` 成功。`.nvmrc` は Cloudflare Pages の
> 標準ベースラインに合わせ `22`（Nuxt 3.17 / Vite 7 ともに対応）。

## 外向き・不可逆な操作（ユーザーが手動で踏む — HANDOFF）

自律実行はここで止める（外向き・不可逆＝RED 境界）。`HANDOFF.md` に手順チェックリストがある:

1. GitHub repo の public 化
2. Cloudflare Pages への接続＋公開デプロイ（公開 URL の発行）
3. Amazon アソシエイト登録＋アフィリエイトタグの有効化（`NUXT_PUBLIC_AFFILIATE_TAG`）

## スコープ外（v0 では実装しない）

- v1 作曲家軸（MusicBrainz）・掲載誌タグ・監督/作画 signature・ログイン/保存
- ライブのアフィリエイトタグ（構造だけ用意・有効化は HANDOFF）・広告（このプロダクトに不向き）

設計の why・データ層の裏取り・収益化方針の正典は要件定義 `GOAL.md` と
個人 vault `ai-memory/creator-discovery-app-status.md`。
