# Creator Discovery — Goal（v0 公開版）

> Claude Code 自律実行の契約。技術的地雷は CLAUDE.md、外向き手順は HANDOFF.md を参照。

## Goal

「好きな作り手 → その人の他作品/系譜」を辿る discovery アプリ。v0（漫画作者軸・AniList 単体）を公開品質まで仕上げ、収益化を後挿しできる構造を用意する。

## スコープ

- IN: 公開品質 UI / デプロイ設定 / meta・SEO / AniList unofficial 表記 / アフィリエイトの構造的シーム / README 是正
- OUT: v1 作曲家軸 / 掲載誌タグ / 監督・作画 signature / ログイン・保存 / ライブのアフィリエイトタグ・広告

## 自律境界

- **GREEN（自走可）**: コード/設定/文面/構造の実装・ローカル検証・main への commit/push
- **RED（ユーザーに渡す）**: 公開デプロイ / GitHub public 化 / アフィリエイト有効化 → HANDOFF.md

## 受け入れ基準

- [ ] `npm run generate` 成功、`.output/public` で全機能動作
- [ ] モバイル幅崩れなし。loading/empty/error/429 が親切に表示
- [ ] title/description/OGP/favicon がビルド HTML に存在
- [ ] AniList unofficial 帰属表示あり。カバー hotlink 不変条件を文書化済み
- [ ] アフィリエイトのシームが存在し中立表示（タグ無し・広告無し）
- [ ] README が現状と一致。デプロイ手順が明文化済み
- [ ] main に commit/push 済み
- [ ] 外向き手順が HANDOFF.md に残してある

## 一方通行リスク

カバー画像を載せたまま商用化（カバーは出版社著作物・AniList も再利用権を付与しない）。RED 境界で構造上踏まない。
