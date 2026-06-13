# creator-discovery-app

AniList の GraphQL API を直叩きして、漫画スタッフ（原作者・作画担当等）の作品を検索・一覧するツール（v0）。

## 起動

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く。

## スコープ（v0）

- スタッフ名で検索 → 候補リストから選択
- 選択したスタッフの漫画作品を staffRole フィルタ付きで表示
  - フィルタ対象: "Story & Art" / "Story" / "Original Creator"
- カバー画像・タイトル（native 優先）・開始年・AniList リンクを表示
- 認証不要（AniList Public API を使用）

## TODO / 未実装

- studio バッジ（アニメ化時の制作会社表示）
- ページネーション（現在 perPage: 50 固定）
- アニメ版への横断検索
- スタイリング整備
