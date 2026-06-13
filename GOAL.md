# Creator Discovery — Goal / 要件定義（v0 公開版）

> このファイルは Claude Code が自律実行するときの「契約」。requirements・受け入れ基準・自律境界の正典。
> 設計の why と裏取り済みデータ層は vault `ai-memory/creator-discovery-app-status.md` が母艦（このファイルは app repo 内で自己完結するよう要点を再掲する）。

## Goal（一行）

「好きな作り手 → その人の他作品/系譜」を辿る discovery アプリ。**v0（漫画作者軸・AniList 単体）を公開できる完成形まで仕上げ、収益化（アフィリエイト）を後挿しできる構造と法務ガードレールまで用意する。**

動機＝不便解決＋本人の creator-literacy 強化。

## 最終ターゲット（このゴールの「達成」）

現状の漫画作者 discovery（検索→候補→作品グリッド＋studio バッジ）を、**他人に公開して使える品質**へ引き上げ、**Amazon アソシエイト等のアフィリエイトを後から有効化できる構造**を仕込む。実際の公開デプロイと収益機構の有効化は「外向き・不可逆」なので **ユーザーに渡す**（下記 自律境界）。

- IN: 公開品質の UI／デプロイ設定／meta・SEO／AniList unofficial 表記／アフィリエイトの構造的シーム／README 是正。
- OUT（意図的に外す）: v1 作曲家軸(MusicBrainz)・掲載誌タグ・監督/作画 signature・ログイン/保存・**ライブのアフィリエイトタグ/広告**（広告はこのプロダクトに不向き＝research 裏取り済み）。

## 要件

### R1. デプロイ準備（Cloudflare Pages・静的）
- `npm run generate` が成功し、`.output/public` の静的出力が単体で正しく動く（client-side fetch なので SSG で完結するはず＝**generate 時に AniList を叩いて落ちないことを実際に検証**）。
- Cloudflare Pages の GitHub 連携 auto-build を想定し、ビルド設定を repo 側に明文化（build=`npx nuxt generate`／output=`.output/public`／Node バージョン固定が要れば `.nvmrc` 等）。
- `nuxt.config.ts` の `runtimeConfig.public.anilistEndpoint` は現状未使用（コードは `ANILIST` 定数を直書き）。**どちらかに寄せる**（config を使うか定数に統一）。

### R2. 公開品質の UI
- モバイル幅でグリッドが崩れない（レスポンシブ）。
- loading / empty / error の各状態が公開向けに整っている。とくに **AniList レート超過（429・90 req/min、一時 30）時に「少し待って再試行」を促す親切なメッセージ**（現状は catch で握り潰し or 汎用文）。
- アプリの素性: タイトル見出し＋一文の説明（何ができるツールか）＋フッター。
- meta/SEO: `useHead` で `<title>`・meta description・OGP（共有時のカード）・favicon。

### R3. 帰属表示と法務ガードレール（公開の必須条件）
- **AniList unofficial 表記**: フッター等に「Data from AniList. 非公式プロジェクトであり AniList とは無関係」を明示（ToS: 名称に "AniList" を使うなら unofficial/for AniList が必須。商用は <$150/mo なら OK・広告の明示禁止はなし）。
- **カバー画像は hotlink のみ**（AniList CDN を直参照・**再ホストしない**）。現状すでに hotlink ＝この不変条件を壊さない。
- アフィリエイト開示文を用意（リンクを有効化したときだけ表示する前提で文面だけ準備）。

### R4. 収益化の構造（機構の実装はトラフィック後）
- 「作者→作品を買う」導線の**構造的シーム**を1つ作る（各作品にスロット or タイトルから購入リンクを生成する関数）。今は中立表示（または非表示）で、後からアフィリエイトタグを差すだけにする。
- やらない: Amazon アソシエイト登録・ライブのアフィリエイトタグ埋め込み・広告。

### R5. repo 衛生
- **stale な README を是正**（studio バッジ／スタイリングは「TODO」でなく実装済み）。
- 任意: app repo に薄い `CLAUDE.md`（下記「技術的前提・地雷」を恒久化＝将来の自律セッションが再発見せずに済む）。

## 自律実行の境界（ユーザー指示 2026-06-14）

**GREEN（確認なしで自走）**: R1〜R5 のコード/設定/文面/構造の実装・`npm run build` と `npm run generate` のローカル検証・app repo main への commit/push。

**RED（必ず止めてユーザーに渡す＝外向き・不可逆）**:
- Cloudflare Pages への接続＋公開デプロイ（公開 URL の発行）。
- GitHub repo の public 化。
- Amazon アソシエイト登録・ライブのアフィリエイトタグ有効化・課金/アカウントに触る操作。

RED に達したら、ユーザーが踏むだけの**手順チェックリスト**を残して停止する。

## 受け入れ基準（done の定義）

- [ ] `npm run generate` が成功し、`.output/public` を配信して全機能が動く（`npm run preview` 等で実証）。
- [ ] モバイル幅で崩れない。loading/empty/error/レート超過の各状態が親切に表示される。
- [ ] title/description/OGP/favicon がビルド HTML に入っている（実物で確認）。
- [ ] AniList unofficial 帰属表示が描画され、カバー hotlink 不変条件が文書化されている。
- [ ] アフィリエイトのシームが存在し中立表示（ライブのタグ無し・広告無し）。
- [ ] README が現状と一致。ユーザーがデプロイ時に踏む手順が明文化されている。
- [ ] すべて `dev-shota/creator-discovery-app` main に commit/push 済み。
- [ ] 外向き手順（公開デプロイ・public 化・収益化）はユーザー用の handoff チェックリストとして残してある。

## 既知の一方通行リスク

唯一の不可逆は「**カバー画像を載せたまま商用化する**」こと（カバーは出版社著作物・AniList も再利用権を付与しない）。トリップしたら弁護士確認 or カバーを外すしかない。→ 自律実行ではトリップしない（公開デプロイ/収益化が RED で止まるため構造上踏まない）。

## 技術的前提・地雷（再発防止・実コード検証済み）

- **AniList は `relations` 配下に `studios` をネストすると 500**（relation ノード毎に1エラー＝既知の制約。perPage=1 でも死ぬ）。studio は2フェーズ: ①漫画→`relations{edges{relationType node{id type}}}` ②`ADAPTATION×ANIME` の id を集め `Page.media(id_in:[…],type:ANIME){studios(isMain:true){…}}` で一括（50件ずつ）。`pages/index.vue` に実装済み＝この形を壊さない。
- **検索**: AniList は かな↔漢字・ひら↔カナ を変換しない＝複数表記を投げて id で統合。relevance は「クエリ全トークンが name に部分一致」で AND 絞り（語順非依存）。`wanakana` 使用。
- CLI から AniList を検証するときは **browser UA 必須**（無いと Cloudflare 1010）。
- レート: 90 req/min（一時 30）。client-side ＝各訪問者が自分の IP 予算を使う＝サーバ共有予算なし（公開してもサーバコスト0）。ただし studio バッジは1作者で複数 media を引くので、ヘビーユーザーが 429 を踏みうる → R2 の親切メッセージで吸収。

## 現在地 & 入口

- HEAD `1a2c1d3`（studio バッジまで）・main・clean・private push 済み。
- 起動: `npm install && npm run dev` → http://localhost:3000。
- 全機能は `pages/index.vue`（単一ファイル）＋ `assets/main.css`（Apple 系デザイン・CSS 変数）。
- 設計の why・データ層の裏取り・収益化方針の全文は vault `ai-memory/creator-discovery-app-status.md`。
