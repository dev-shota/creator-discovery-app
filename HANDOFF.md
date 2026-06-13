# HANDOFF — 外向き・不可逆な操作（ユーザーが手動で踏む）

自律実行は GREEN（コード/設定/文面/ローカル検証/main への push）まで完了済み。
ここから先は **外向き・不可逆（RED）** なので、あなた（ユーザー）が手動で実行する。
各手順は独立して踏める。途中で止めても、すでに push 済みのコードは壊れない。

---

## 1. GitHub repo を public 化（任意・公開する場合のみ）

- GitHub → `dev-shota/creator-discovery-app` → Settings → General → Danger Zone
  → "Change repository visibility" → Public。
- **不可逆性**: 一度 public にすると履歴も公開される。private のままでも Cloudflare Pages は連携できる（private 連携可）ので、公開が不要ならこの手順は飛ばしてよい。

## 2. Cloudflare Pages に接続して公開デプロイ

1. Cloudflare ダッシュボード → Workers & Pages → Create → Pages → Connect to Git。
2. `dev-shota/creator-discovery-app` を選択（private でも可）。
3. ビルド設定:
   - Build command: `npx nuxt generate`
   - Build output directory: `.output/public`
   - （Node が古い場合）環境変数 `NODE_VERSION = 22`
4. （任意）環境変数 `NUXT_PUBLIC_SITE_URL = https://<発行されたドメイン>` を設定して再デプロイ
   → OGP 共有カードの画像が絶対 URL になり、SNS 表示が安定する。
5. Save and Deploy → 公開 URL が発行される。

> client-side fetch のみなので Workers の実行枠は消費しない（静的配信のみ）。独自ドメインも無料。

## 3. 収益化（アフィリエイト）を有効化（トラフィックが付いてから）

**前提（法務）**: カバー画像を載せたまま商用化するのが唯一の一方通行リスク。
本アプリはカバーを hotlink するだけで再ホストしない設計なので構造上は安全側だが、
商用化（アフィリエイト収益化）に踏み切る前に、AniList 商用 ToS（<$150/mo は OK）と
カバー表示の扱いを最終確認すること。心配なら弁護士確認 or カバー非表示に切り替え。

1. Amazon アソシエイト・プログラムに登録し、トラッキング ID（例 `yourtag-22`）を取得。
2. Cloudflare Pages の環境変数に `NUXT_PUBLIC_AFFILIATE_TAG = yourtag-22` を設定 → 再デプロイ。
   - これだけで「Amazon で探す」リンクにタグが付与され、フッターにアフィリエイト開示文が自動表示される（コード変更不要）。
3. アソシエイト規約上の開示義務は、フッターの開示文（タグ有効時に自動表示）で満たす。文面は必要に応じて調整。

> やらないことの線引き: 広告（バナー等）は入れない（ニッチで RPM が悪く、カバー著作権リスクも上がる＝research 裏取り済み）。

---

## チェックリスト

- [ ] （任意）GitHub repo を public 化した
- [ ] Cloudflare Pages に接続し、`npx nuxt generate` / `.output/public` で公開デプロイした
- [ ] （任意）`NUXT_PUBLIC_SITE_URL` を設定して OGP を絶対 URL 化した
- [ ] （収益化する場合）Amazon アソシエイト登録 → `NUXT_PUBLIC_AFFILIATE_TAG` を設定 → 開示文の表示を確認した
