<template>
  <div class="page-container">
    <!-- 背景の有機的シェイプ（GPT image 2 生成素材を切り出し透過・ふわふわ浮く・装飾のみ） -->
    <div class="bg-decor" aria-hidden="true">
      <span class="blob b1"></span>
      <span class="blob b2"></span>
      <span class="blob b3"></span>
      <span class="blob b4"></span>
    </div>

    <!-- Top bar: brand -->
    <header class="topbar">
      <a class="brand" href="/">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="32" height="32">
            <rect width="64" height="64" rx="16" fill="#ed3a8c" />
            <circle cx="50" cy="15" r="6" fill="#eff33c" />
            <circle cx="28" cy="30" r="12" fill="none" stroke="#fff" stroke-width="5" />
            <line x1="37" y1="39" x2="49" y2="51" stroke="#fff" stroke-width="6" stroke-linecap="round" />
          </svg>
        </span>
        <span class="brand-name">Creator Discovery</span>
      </a>
    </header>

    <!-- Hero（検索ファースト・左テキスト / 右ビジュアル） -->
    <section class="hero">
      <div class="hero-text">
        <span class="eyebrow">creator discovery</span>
        <h1 class="hero-title">
          作り手から、<span class="ac-pink">作品</span>、<br class="hero-br" />そして<span class="ac-teal">アニメ</span>へ。
        </h1>
        <p class="hero-sub">
          <span class="hand">次の“好き”</span>を、好きな作者からたどって見つける discovery ツール。
        </p>

        <!-- Search（ヒーローの主役アクション・候補は入力直下にドロップダウン） -->
        <div class="search-hero">
          <!-- 検索モード切替（作者/作品名/制作会社…）。広い画面はタブ、狭ければプルダウン。 -->
          <div class="search-mode" role="tablist" aria-label="検索モード">
            <button
              v-for="t in SEARCH_TABS"
              :key="t.mode"
              type="button"
              class="mode-btn"
              role="tab"
              :aria-selected="searchMode === t.mode"
              :class="{ 'is-active': searchMode === t.mode }"
              @click="setSearchMode(t.mode)"
            >{{ t.label }}</button>
          </div>
          <!-- 横に収まらない狭い画面ではプルダウンに切替（CSS の media query で出し分け） -->
          <select
            class="search-mode-select"
            aria-label="検索モード"
            :value="searchMode"
            @change="setSearchMode(($event.target as HTMLSelectElement).value as SearchMode)"
          >
            <option v-for="t in SEARCH_TABS" :key="t.mode" :value="t.mode">{{ t.label }}</option>
          </select>

          <div class="search-box">
            <div class="search-row">
              <input
                ref="searchInputEl"
                :value="searchQuery"
                type="text"
                class="search-input"
                :placeholder="searchPlaceholder"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="staff-candidate-list"
                :aria-expanded="dropdownOpen"
                :aria-activedescendant="activeId"
                autocomplete="off"
                @input="onInput"
                @keydown="onKeydown"
                @focus="onFocus"
              />
              <button class="search-btn" @click="searchStaff">検索</button>
            </div>

            <!-- 候補ドロップダウン（live 検索・入力直下にアンカー） -->
            <ul
              v-if="dropdownOpen"
              id="staff-candidate-list"
              class="candidate-list"
              role="listbox"
              :aria-label="searchMode === 'title' ? '作品の候補' : searchMode === 'studio' ? '制作会社の候補' : '作り手の候補'"
            >
              <!-- 入力が空でフォーカス中: 現モードの「最近見た」を出す（recent セクション・#1） -->
              <template v-if="showRecent">
                <li class="candidate-section-label">{{ recentLabel }}</li>
                <li
                  v-for="r in currentRecent"
                  :key="`recent-${r.id}`"
                  class="candidate-item"
                  role="option"
                  :aria-selected="false"
                  @mousedown.prevent
                  @click="selectRecent(r)"
                >
                  <span class="candidate-avatar candidate-avatar-fallback" aria-hidden="true">
                    {{ (r.name || '?').slice(0, 1) }}
                  </span>
                  <span class="candidate-name-native">{{ r.name }}</span>
                </li>
              </template>

              <template v-else>
                <li v-if="searchLoading" class="candidate-status">検索中…</li>
                <li v-else-if="searchError" class="candidate-status is-error">{{ searchError }}</li>

                <!-- 制作会社モード: スタジオ候補 -->
                <template v-else-if="searchMode === 'studio'">
                  <li v-if="studioCandidates.length === 0" class="candidate-status">
                    {{ studioHint || '該当する制作会社が見つかりませんでした。' }}
                  </li>
                  <li
                    v-for="(st, i) in studioCandidates"
                    :id="`cand-${st.id}`"
                    :key="st.id"
                    class="candidate-item"
                    role="option"
                    :aria-selected="false"
                    :class="{ 'is-active': i === activeIndex }"
                    @mouseenter="activeIndex = i"
                    @mousedown.prevent
                    @click="selectStudio(st)"
                  >
                    <span class="candidate-avatar candidate-avatar-fallback" aria-hidden="true">
                      {{ (st.name || '?').slice(0, 1) }}
                    </span>
                    <span class="candidate-name-native">{{ st.name }}</span>
                    <span v-if="st.isAnimationStudio" class="occupation-tag">制作会社</span>
                  </li>
                </template>

                <!-- 作品名モード: 作品候補 -->
                <template v-else-if="searchMode === 'title'">
                  <li v-if="mediaCandidates.length === 0" class="candidate-status">
                    該当する作品が見つかりませんでした。
                  </li>
                  <li
                    v-for="(media, i) in mediaCandidates"
                    :id="`cand-${media.id}`"
                    :key="media.id"
                    class="candidate-item candidate-item-media"
                    role="option"
                    :aria-selected="false"
                    :class="{ 'is-active': i === activeIndex }"
                    @mouseenter="activeIndex = i"
                    @mousedown.prevent
                    @click="selectMediaToAuthor(media)"
                  >
                    <img
                      v-if="media.coverImage?.medium"
                      class="candidate-cover"
                      :src="media.coverImage.medium"
                      alt=""
                      loading="lazy"
                    />
                    <span v-else class="candidate-cover candidate-cover-fallback" aria-hidden="true">?</span>
                    <span class="candidate-media-main">
                      <span class="candidate-name-native">{{ displayTitle(media.title) }}</span>
                      <span class="candidate-media-meta">{{ mediaMeta(media) }}</span>
                    </span>
                  </li>
                </template>

                <!-- 作者モード: 既存のスタッフ候補（変更なし） -->
                <template v-else>
                  <li v-if="staffCandidates.length === 0" class="candidate-status">
                    該当する作り手が見つかりませんでした。
                  </li>
                  <li
                    v-for="(staff, i) in staffCandidates"
                    :id="`cand-${staff.id}`"
                    :key="staff.id"
                    class="candidate-item"
                    role="option"
                    :aria-selected="selectedStaff?.id === staff.id"
                    :class="{ 'is-selected': selectedStaff?.id === staff.id, 'is-active': i === activeIndex }"
                    @mouseenter="activeIndex = i"
                    @mousedown.prevent
                    @click="selectStaff(staff)"
                  >
                    <img
                      v-if="staff.image?.medium"
                      class="candidate-avatar"
                      :src="staff.image.medium"
                      alt=""
                      loading="lazy"
                    />
                    <span v-else class="candidate-avatar candidate-avatar-fallback" aria-hidden="true">
                      {{ (staff.name.native || staff.name.full || '?').slice(0, 1) }}
                    </span>
                    <span class="candidate-name-native">{{ staff.name.native || staff.name.full }}</span>
                    <span v-if="staff.name.native" class="candidate-name-full">
                      ({{ staff.name.full }})
                    </span>
                    <span v-if="staff.primaryOccupations.length > 0" class="occupation-tag">
                      {{ staff.primaryOccupations.map(o => OCCUPATION_MAP[o] ?? o).join('、') }}
                    </span>
                  </li>
                </template>
              </template>
            </ul>
          </div>

          <!-- 「最近見た」チップ（検索前のヒーロー下。控えめ・非ブロッキング・現モード別＝#1） -->
          <div v-if="!selectedStaff && !selectedStudio && mediaAuthorChoices.length === 0 && currentRecent.length > 0" class="recent-chips" :aria-label="recentLabel">
            <span class="recent-chips-label">{{ recentLabel }}</span>
            <button
              v-for="r in currentRecent"
              :key="`chip-${r.id}`"
              type="button"
              class="recent-chip"
              @click="selectRecent(r)"
            >{{ r.name }}</button>
          </div>
        </div>
      </div>

      <!-- 右: ヒーローイラスト（GPT image 2 生成・作り手が作品を生む情景） -->
      <div class="hero-visual" aria-hidden="true">
        <img class="hero-img" src="/assets/hero-artist.png" alt="" />
      </div>
    </section>

    <!-- 作品名→作者の解決メッセージ（作者なし/エラー）。選択が無くても見える（Codex#5）。 -->
    <p
      v-if="resolveNotice && !selectedStaff && !selectedStudio && mediaAuthorChoices.length === 0"
      class="status-notice resolve-notice"
    >{{ resolveNotice }}</p>

    <!-- 作品→作り手チューザ（原作/作画が複数いる作品だけ。例: ラノベの漫画化＝原作者＋漫画家） -->
    <section
      v-if="mediaAuthorChoices.length > 0 && !selectedStaff && !selectedStudio"
      class="author-chooser"
      aria-label="作り手を選ぶ"
    >
      <h2 class="author-chooser-title">「{{ mediaAuthorSourceTitle }}」の作り手</h2>
      <p class="author-chooser-sub">この作品の作り手から、たどりたい人を選んでください。</p>
      <div class="author-chooser-list">
        <button
          v-for="c in mediaAuthorChoices"
          :key="c.id"
          type="button"
          class="author-choice"
          @click="goToChoice(c)"
        >
          <span class="author-choice-role">{{ c.label }}</span>
          <span class="author-choice-name">{{ c.name.native || c.name.full }}</span>
        </button>
      </div>
    </section>

    <!-- How it works（検索前のオンボーディング＝作り手→作品→スタジオ） -->
    <section v-if="!selectedStaff && !selectedStudio && mediaAuthorChoices.length === 0" class="how" aria-label="使い方">
      <div class="how-card c-creator">
        <span class="how-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" /><path d="M14 7l3 3" /></svg>
        </span>
        <span class="how-name">Creator</span>
        <span class="how-desc">漫画家・原作者</span>
      </div>
      <span class="how-arrow" aria-hidden="true">→</span>
      <div class="how-card c-work">
        <span class="how-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5c2.5-1 5-1 8 .5C15 4 17.5 4 20 5v13c-2.5-1-5-1-8 .5C9 17 6.5 17 4 18V5z" /><path d="M12 5.5V18.5" /></svg>
        </span>
        <span class="how-name">Work</span>
        <span class="how-desc">作品（漫画・原作）</span>
      </div>
      <span class="how-arrow" aria-hidden="true">→</span>
      <div class="how-card c-studio">
        <span class="how-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="11" rx="2" /><path d="M3 9l3-4 3.5 0-3 4M9.5 9l3-4 3.5 0-3 4" /></svg>
        </span>
        <span class="how-name">Studio</span>
        <span class="how-desc">アニメ化スタジオ</span>
      </div>
    </section>

    <!-- Works Section -->
    <div v-if="selectedStaff" class="works-section">
      <div class="works-head">
        <h2>
          {{ selectedStaff.name.native || selectedStaff.name.full }}{{ staffWorksSuffix }}
          <span v-if="worksLoading" class="works-loading-indicator">読み込み中...</span>
        </h2>
        <button
          v-if="!worksLoading && filteredWorks.length > 0"
          type="button"
          class="share-btn"
          @click="shareOnX"
        >X でシェア</button>
      </div>

      <p v-if="worksError" class="status-error">{{ worksError }}</p>
      <p v-if="worksNotice" class="status-notice">{{ worksNotice }}</p>

      <!-- 並び順トグル（初期=古い順）＋件数。作品が2件以上のときだけ出す。 -->
      <div v-if="filteredWorks.length > 1" class="works-controls">
        <div class="sort-toggle" role="group" aria-label="並び順">
          <button type="button" class="sort-btn" :class="{ 'is-active': worksSort === 'old' }" @click="worksSort = 'old'">古い順</button>
          <button type="button" class="sort-btn" :class="{ 'is-active': worksSort === 'new' }" @click="worksSort = 'new'">新しい順</button>
        </div>
        <span class="works-count">{{ filteredWorks.length }}件{{ worksHasMore ? '＋' : '' }}</span>
      </div>

      <div v-if="filteredWorks.length > 0" class="works-grid">
        <div
          v-for="edge in sortedWorks"
          :key="edge.node.siteUrl"
          class="work-card"
        >
          <a :href="edge.node.siteUrl" target="_blank" rel="noopener">
            <img
              v-if="edge.node.coverImage?.medium"
              :src="edge.node.coverImage.medium"
              :alt="displayTitle(edge.node.title)"
              class="work-card-cover"
            />
          </a>
          <div class="work-card-body">
            <a
              :href="edge.node.siteUrl"
              target="_blank"
              rel="noopener"
              class="work-card-title"
            >
              {{ displayTitle(edge.node.title) }}
            </a>
            <div class="work-card-year">
              {{ edge.node.startDate?.year ?? '年不明' }}
            </div>
            <div class="work-card-role">{{ edge.staffRole }}</div>
            <div v-if="studioBadges[edge.node.id]?.length" class="work-card-studios">
              <span class="work-card-studios-label">アニメ化</span>
              <span
                v-for="name in visibleStudios(edge.node.id)"
                :key="name"
                class="studio-badge"
              >{{ name }}</span>
              <button
                v-if="studioBadges[edge.node.id].length > 2"
                type="button"
                class="studio-badge studio-badge-more"
                @click="toggleStudios(edge.node.id)"
              >{{ expandedStudios.has(edge.node.id) ? '閉じる' : '+' + (studioBadges[edge.node.id].length - 2) }}</button>
            </div>
            <!-- 購入導線（R4 シーム）。中立リンク（タグ無し）。affiliateTag を
                 設定するとアフィリエイト化＋下部に開示文が出る。 -->
            <a
              :href="purchaseLink(edge.node.title)"
              target="_blank"
              :rel="purchaseRel"
              class="work-card-buy"
            ><span v-if="affiliateActive" class="ad-badge">広告</span>Amazon で探す</a>
          </div>
        </div>
      </div>

      <p v-else-if="!worksLoading && !worksError" class="status-empty">
        表示対象の作品が見つかりませんでした（staffRole フィルタ適用済み）。
      </p>

      <!-- 件数が多いと1回で全部取れないので、続きを取得する（切り替えで全件＝要望）。 -->
      <div v-if="worksHasMore && !worksLoading" class="load-more-wrap">
        <button type="button" class="load-more-btn" :disabled="worksLoadingMore" @click="loadMoreWorks">
          {{ worksLoadingMore ? '読み込み中…' : 'もっと読み込む' }}
        </button>
      </div>
    </div>

    <!-- 制作会社の作品（アニメ）。役割行・スタジオバッジ無しの簡易グリッド（独立パス）。 -->
    <div v-if="selectedStudio" class="works-section">
      <div class="works-head">
        <h2>
          {{ selectedStudio.name }} の制作作品
          <span v-if="worksLoading" class="works-loading-indicator">読み込み中...</span>
        </h2>
      </div>

      <p v-if="worksError" class="status-error">{{ worksError }}</p>
      <p v-if="worksNotice" class="status-notice">{{ worksNotice }}</p>

      <div v-if="filteredWorks.length > 1" class="works-controls">
        <div class="sort-toggle" role="group" aria-label="並び順">
          <button type="button" class="sort-btn" :class="{ 'is-active': worksSort === 'old' }" @click="worksSort = 'old'">古い順</button>
          <button type="button" class="sort-btn" :class="{ 'is-active': worksSort === 'new' }" @click="worksSort = 'new'">新しい順</button>
        </div>
        <span class="works-count">{{ filteredWorks.length }}件{{ worksHasMore ? '＋' : '' }}</span>
      </div>

      <div v-if="filteredWorks.length > 0" class="works-grid">
        <div
          v-for="edge in sortedWorks"
          :key="edge.node.siteUrl"
          class="work-card"
        >
          <a :href="edge.node.siteUrl" target="_blank" rel="noopener">
            <img
              v-if="edge.node.coverImage?.medium"
              :src="edge.node.coverImage.medium"
              :alt="displayTitle(edge.node.title)"
              class="work-card-cover"
            />
          </a>
          <div class="work-card-body">
            <a
              :href="edge.node.siteUrl"
              target="_blank"
              rel="noopener"
              class="work-card-title"
            >
              {{ displayTitle(edge.node.title) }}
            </a>
            <div class="work-card-year">
              {{ edge.node.startDate?.year ?? '年不明' }}
            </div>
            <a
              :href="purchaseLink(edge.node.title)"
              target="_blank"
              :rel="purchaseRel"
              class="work-card-buy"
            ><span v-if="affiliateActive" class="ad-badge">広告</span>Amazon で探す</a>
          </div>
        </div>
      </div>

      <p v-else-if="!worksLoading && !worksError" class="status-empty">
        この制作会社の作品が見つかりませんでした。
      </p>

      <div v-if="worksHasMore && !worksLoading" class="load-more-wrap">
        <button type="button" class="load-more-btn" :disabled="worksLoadingMore" @click="loadMoreWorks">
          {{ worksLoadingMore ? '読み込み中…' : 'もっと読み込む' }}
        </button>
      </div>
    </div>

    <!-- Footer: AniList 非公式帰属（必須・常時） + アフィリエイト開示（タグ有効時のみ） -->
    <footer class="site-footer">
      <p class="footer-attribution">
        Data from
        <a href="https://anilist.co" target="_blank" rel="noopener">AniList</a>.
        本サイトは非公式の個人プロジェクトであり、AniList とは一切関係ありません。
        カバー画像は AniList の画像を直接参照（hotlink）しています。
      </p>
      <p v-if="affiliateActive" class="footer-disclosure">
        <strong>広告（アフィリエイト）について:</strong>
        当サイトは Amazon アソシエイト・プログラムの参加者です。「Amazonのアソシエイトとして、Creator Discovery は適格販売により収入を得ています。」
        作品の購入リンクには広告（アフィリエイトリンク）が含まれ、リンク経由で購入された場合に当サイトが収益を得ることがあります。
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { toRomaji, toHiragana, toKatakana } from 'wanakana'

// ── Config（R1: エンドポイントは runtimeConfig.public に一本化）─────────────
const config = useRuntimeConfig()
const route = useRoute()
const router = useRouter()
// PostHog（plugins/posthog.client.ts が provide）。key 未設定なら provide されず
// $posthog は undefined ＝ optional-chaining で全 capture が no-op になる。
const { $posthog } = useNuxtApp() as any
const ANILIST = config.public.anilistEndpoint as string
const SITE_URL = ((config.public.siteUrl as string) || '').replace(/\/$/, '')
const AFFILIATE_TAG = (config.public.affiliateTag as string) || ''
const affiliateActive = computed(() => AFFILIATE_TAG.length > 0)

// ── SEO / OGP / favicon（R2）──────────────────────────────────────────────
const SITE_TITLE = 'Creator Discovery — 漫画家から作品をたどる'
const SITE_DESC =
  '好きな漫画家・原作者を検索して、その作品とアニメ化した制作会社をたどれる discovery ツール。データは AniList。'
// OGP 画像は絶対 URL が望ましい。公開ドメインが分かれば SITE_URL で絶対化する。
const OG_IMAGE = SITE_URL ? `${SITE_URL}/og-image.png` : '/og-image.png'
useHead({
  title: SITE_TITLE,
  meta: [
    { name: 'description', content: SITE_DESC },
    { property: 'og:title', content: SITE_TITLE },
    { property: 'og:description', content: SITE_DESC },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: OG_IMAGE },
    ...(SITE_URL ? [{ property: 'og:url', content: SITE_URL }] : []),
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: SITE_TITLE },
    { name: 'twitter:description', content: SITE_DESC },
    { name: 'twitter:image', content: OG_IMAGE }
  ]
})

// ── レート上限（429）の親切表示（R2）───────────────────────────────────────
const RATE_LIMIT_MSG =
  'AniList のレート上限に達しました（1分あたりのリクエスト数の上限）。少し待ってから再試行してください。'

// $fetch が投げる FetchError から 429 を判定する
function isRateLimited(e: unknown): boolean {
  const err = e as { statusCode?: number; status?: number; response?: { status?: number } }
  const code = err?.statusCode ?? err?.status ?? err?.response?.status
  return code === 429
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

// 429 応答の Retry-After（秒）を読み、無ければ fallback を返す（上限 70s）
function retryDelayMs(e: unknown, fallbackMs: number): number {
  const ra = (e as { response?: { headers?: { get?: (k: string) => string | null } } })
    ?.response?.headers?.get?.('retry-after')
  const sec = ra ? parseInt(ra, 10) : NaN
  return Number.isFinite(sec) && sec > 0 ? Math.min(sec * 1000 + 500, 70000) : fallbackMs
}

// 作品タイトルから購入導線（Amazon.co.jp 検索）を生成。タグが空なら中立リンク。
function purchaseLink(title: WorkEdge['node']['title']): string {
  const q = title.native || title.romaji || title.english || ''
  const url = `https://www.amazon.co.jp/s?k=${encodeURIComponent(q)}`
  return AFFILIATE_TAG ? `${url}&tag=${AFFILIATE_TAG}` : url
}
// アフィリエイト有効時だけ sponsored を付ける（中立時は nofollow のみ）
const purchaseRel = computed(() =>
  affiliateActive.value ? 'noopener nofollow sponsored' : 'noopener nofollow'
)

// 作者モードで表示する漫画ロール。作画のみ担当（role="Art"）の漫画家も拾う＝
// 純・作画担当を選ぶと作品が空になる問題を防ぐ（実測: Boichi の Rakia は role="Art"）。
const STAFF_ROLE_FILTER = ['Story & Art', 'Story', 'Original Creator', 'Original Story', 'Art', 'Illustration']

// 純・声優/ボーカルだけの人を作者/監督候補から除外する精密判定（#5 関連・レビュー#3）。
// 旧実装は「CREATOR_OCCUPATIONS に無い＝純声優」と見なし、Novelist/Producer 等の正当な
// 作り手まで落としていた。意図どおり「全職業が声優系の時だけ除外」に直す。
const VOICE_ONLY_OCCUPATIONS = new Set(['Voice Actor', 'Vocalist'])
function isPureVoice(occ: string[]): boolean {
  return occ.length > 0 && occ.every(o => VOICE_ONLY_OCCUPATIONS.has(o))
}

// 職業の日本語マップ
const OCCUPATION_MAP: Record<string, string> = {
  'Mangaka': '漫画家',
  'Voice Actor': '声優',
  'Director': '監督',
  'Writer': '脚本',
  'Animator': 'アニメーター',
}

// 制作系職業（声優より上に出す）
const CREATOR_OCCUPATIONS = new Set([
  'Director', 'Writer', 'Artist', 'Animator',
  'Character Design', 'Story', 'Original Creator', 'Illustrator',
])

function occupationScore(occupations: string[]): number {
  if (occupations.includes('Mangaka')) return 0
  if (occupations.some(o => CREATOR_OCCUPATIONS.has(o))) return 1
  return 2
}

// ── モード別の候補フィルタ（#5: 作者検索に監督、監督検索に作者が混ざるのを止める）──
// creator と director は同じ staff(search) を叩く（AniList に役割別検索が無い）ので、
// 候補を primaryOccupations で出し分ける。職業データが空の人は判定不能なので
// （AniList は occupation が疎）どちらのモードでも残す＝取りこぼしを作らない。
const AUTHOR_OCCUPATIONS = new Set([
  'Mangaka', 'Story & Art', 'Story', 'Art', 'Original Creator',
  'Original Story', 'Illustrator', 'Writer', 'Novelist', 'Character Design',
])
function isAuthorPerson(occ: string[]): boolean {
  return occ.some(o => AUTHOR_OCCUPATIONS.has(o))
}
function isDirectorPerson(occ: string[]): boolean {
  return occ.some(o => o === 'Director' || o === 'Chief Director')
}
// creator モード=著者系のみ（明確な監督/声優を除外）、director モード=監督系のみ。
// occ 空（不明）は両モードとも残す。実測: 山田尚子=['Director','Storyboard Artist']→
// creator から除外・director で残す。尾田=['Mangaka']→creator で残す・director から除外。
function matchesSearchMode(occ: string[], mode: SearchMode): boolean {
  if (occ.length === 0) return true
  if (mode === 'director') return isDirectorPerson(occ)
  return isAuthorPerson(occ) // creator
}

interface StaffCandidate {
  id: number
  name: { full: string; native: string | null }
  primaryOccupations: string[]
  favourites: number | null      // AniList のお気に入り数＝知名度の代理指標（ランキングの第1キー）
  image: { medium: string | null } | null
}

// 作品名（逆引き）モードの候補。漫画・アニメ両方を含む。
interface MediaCandidate {
  id: number
  type: string                   // MANGA / ANIME
  format: string | null          // TV / MANGA / MOVIE 等
  popularity: number | null      // 知名度の代理指標。かな表記違いの統合後の並べ替えキー
  startDate: { year: number | null } | null
  title: { native: string | null; romaji: string | null; english: string | null }
  coverImage: { medium: string | null } | null
}

// 制作会社（studio）モードの候補。AniList の Studio エンティティ。
interface StudioCandidate {
  id: number
  name: string
  favourites: number | null
  isAnimationStudio: boolean
}

// localStorage に保存する「最近見た」項目の最小形。type は作品モードのみ使用
// （media を再解決する際に ANIME/MANGA で原作ロールの拾い方が変わるため）。
interface RecentItem {
  id: number
  name: string
  type?: string
}
// 「最近見た」はモードごとに別リスト（#1: 作品/作者/監督/制作会社）。searchMode と同じキー。
type RecentKind = 'creator' | 'title' | 'director' | 'studio'

interface WorkEdge {
  staffRole: string
  node: {
    id: number
    title: { native: string | null; romaji: string | null; english: string | null }
    startDate: { year: number | null } | null
    coverImage: { medium: string } | null
    siteUrl: string
    relations: {
      edges: { relationType: string; node: { id: number; type: string } }[]
    }
  }
}

// State
const searchQuery = ref('')
// 検索モード: 作者(staff) / 作品名(media 逆引き) / 制作会社(studio)。監督・声優は次段で追加予定。
type SearchMode = 'creator' | 'title' | 'director' | 'studio'
const searchMode = ref<SearchMode>('creator')
// 検索タブ。広い画面は横並びタブ、狭い画面はプルダウン（search-mode-select）に切替。
const SEARCH_TABS: { mode: SearchMode; label: string }[] = [
  { mode: 'creator', label: '作者' },
  { mode: 'title', label: '作品名' },
  { mode: 'director', label: '監督' },
  { mode: 'studio', label: '制作会社' },
]
const staffCandidates = ref<StaffCandidate[]>([])
const mediaCandidates = ref<MediaCandidate[]>([])   // 作品名モードの候補
const studioCandidates = ref<StudioCandidate[]>([]) // 制作会社モードの候補
// 作品を選んだあと、その作品の作り手（原作/作画など）を出すチューザ。1人なら自動で
// 進み、複数（ラノベ→漫画化＝原作者＋漫画家 等）ならユーザーに選ばせる（#2/#3）。
const mediaAuthorChoices = ref<AuthorChoice[]>([])
const mediaAuthorSourceTitle = ref('')              // チューザ見出し用（どの作品由来か）
const selectedStaff = ref<StaffCandidate | null>(null)
// 制作会社モードで選択中のスタジオ（works-section を出すもう一つのトリガ）
const selectedStudio = ref<StudioCandidate | null>(null)
// 最近見た（モード別・most-recent-first・id でユニーク・各上限8）。
const recentByKind = ref<Record<RecentKind, RecentItem[]>>({ creator: [], title: [], director: [], studio: [] })
const filteredWorks = ref<WorkEdge[]>([])
// 選択中の作り手の作品が「作者作品」か「監督作品」か（見出しの出し分け＝検索タブと独立。
// 作品名チューザから監督を選んだ場合も正しく「監督作品」見出しになる）。
const selectedStaffKind = ref<'author' | 'director'>('author')
// 作品グリッドの並び順（初期は古い順。トグルで新しい順へ）。新しい選択ごとに古い順へ戻す。
const worksSort = ref<'old' | 'new'>('old')
// 段階ロード: まだ続きのページがあるか／追加ロード中か（「もっと読み込む」で全件取得）。
const worksHasMore = ref(false)
const worksLoadingMore = ref(false)
// manga node id → アニメ化した制作会社名（頻度順）
const studioBadges = ref<Record<number, string[]>>({})
// +N を押して制作会社を全件展開中の manga node id
const expandedStudios = ref<Set<number>>(new Set())

// 表示する制作会社：展開中は全件、それ以外は上位2件
function visibleStudios(id: number): string[] {
  const all = studioBadges.value[id] ?? []
  return expandedStudios.value.has(id) ? all : all.slice(0, 2)
}

function toggleStudios(id: number) {
  const next = new Set(expandedStudios.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expandedStudios.value = next
}

const searchError = ref('')
const searchLoading = ref(false)    // live 検索の実行中（ドロップダウンに「検索中」表示）
const dropdownOpen = ref(false)     // 候補ドロップダウンの開閉
const activeIndex = ref(-1)         // キーボードでハイライト中の候補 index（-1＝なし）
const searchInputEl = ref<HTMLInputElement | null>(null)
// aria-activedescendant 用: ハイライト中候補の DOM id（モード対応）
const activeId = computed(() => {
  const item = searchMode.value === 'title'
    ? mediaCandidates.value[activeIndex.value]
    : searchMode.value === 'studio'
      ? studioCandidates.value[activeIndex.value]
      : staffCandidates.value[activeIndex.value]
  return item ? `cand-${item.id}` : undefined
})
const worksError = ref('')
const worksNotice = ref('') // 非ブロッキングの案内（例: studio がレート上限で省略）
// 作品名→作者の解決が「作者なし/エラー」だった時の案内（選択が無くても見える独立表示）
const resolveNotice = ref('')
// 制作会社モードのドロップダウンに出す案内（日本語名は不可→ローマ字を促す 等・#2）
const studioHint = ref('')
const worksLoading = ref(false)

// Debounce state
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let requestSeq = 0
let suppressNextWatch = false // selectStaff で入力欄を書き換えた時の再検索抑止

// Helpers
function displayTitle(title: { native: string | null; romaji: string | null; english: string | null }) {
  return title.native || title.romaji || title.english || '(タイトル不明)'
}

// 検索欄のプレースホルダ（モードで切替）
const CREATOR_PLACEHOLDER = 'スタッフ名（漢字・かな・ローマ字）　例: 井上雄彦 / いのうえ / inoue'
const TITLE_PLACEHOLDER = '作品名（漫画・アニメ）　例: 進撃の巨人 / チェンソーマン'
const DIRECTOR_PLACEHOLDER = '監督名（漢字・かな・ローマ字）　例: 新海誠 / 山田尚子'
const STUDIO_PLACEHOLDER = '制作会社（アニメスタジオ）　例: MAPPA / ufotable / 京都アニメーション'
const searchPlaceholder = computed(() =>
  searchMode.value === 'title' ? TITLE_PLACEHOLDER
    : searchMode.value === 'director' ? DIRECTOR_PLACEHOLDER
    : searchMode.value === 'studio' ? STUDIO_PLACEHOLDER
    : CREATOR_PLACEHOLDER
)

// 各モードの「最近見た」ラベル（#1: タブと1対1）。
const RECENT_LABELS: Record<RecentKind, string> = {
  creator: '最近見た作者',
  title: '最近見た作品',
  director: '最近見た監督',
  studio: '最近見た制作会社',
}
// 現在モードの recent リストとラベル（searchMode は RecentKind と同じ集合）。
const currentRecent = computed<RecentItem[]>(() => recentByKind.value[searchMode.value])
const recentLabel = computed(() => RECENT_LABELS[searchMode.value])

// 入力が空でフォーカス中、かつ現モードの最近見たがあればドロップダウンに recent を出す。
const showRecent = computed(() =>
  dropdownOpen.value && searchQuery.value.trim().length === 0 &&
  currentRecent.value.length > 0
)

// 作品セクション見出しの接尾辞（監督作品なら「の監督作品」）。検索タブではなく
// selectedStaffKind を見る＝作品名チューザから監督を選んでも正しく出る。
const staffWorksSuffix = computed(() => selectedStaffKind.value === 'director' ? ' の監督作品' : ' の作品')

// 表示用の並べ替え（古い順/新しい順）。年不明は常に末尾。元の filteredWorks は触らない。
const sortedWorks = computed<WorkEdge[]>(() => {
  const arr = filteredWorks.value.slice()
  arr.sort((a, b) => {
    const ya = a.node.startDate?.year ?? null
    const yb = b.node.startDate?.year ?? null
    if (ya === null && yb === null) return 0
    if (ya === null) return 1
    if (yb === null) return -1
    return worksSort.value === 'old' ? ya - yb : yb - ya
  })
  return arr
})

// 作品候補の補助タグ（種別・フォーマット・年）。例「アニメ・TV・2013」
const MEDIA_TYPE_MAP: Record<string, string> = { MANGA: '漫画', ANIME: 'アニメ' }
function mediaMeta(media: MediaCandidate): string {
  const parts: string[] = []
  parts.push(MEDIA_TYPE_MAP[media.type] ?? media.type)
  if (media.format && media.format !== media.type) parts.push(media.format)
  if (media.startDate?.year) parts.push(String(media.startDate.year))
  return parts.join('・')
}

// ── 最近見た（モード別・localStorage・SSR 安全）─────────────────────────────────
const RECENT_KEYS: Record<RecentKind, string> = {
  creator: 'cd_recent_creator',
  title: 'cd_recent_title',
  director: 'cd_recent_director',
  studio: 'cd_recent_studio',
}
const RECENT_CAP = 8

// 1モード分を localStorage から読む（client のみ・try/catch で常に安全に [] へ）。
function loadRecentKind(kind: RecentKind): RecentItem[] {
  if (!import.meta.client || typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_KEYS[kind])
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((x: any) => x && typeof x.id === 'number' && typeof x.name === 'string')
      .map((x: any) => (typeof x.type === 'string' ? { id: x.id, name: x.name, type: x.type } : { id: x.id, name: x.name }))
      .slice(0, RECENT_CAP)
  } catch {
    return []
  }
}

// 全4モードを復元（onMounted で1回）。旧 `cd_recent`（作者のみ・キー変更前）が
// あれば一度だけ creator へ移行して履歴を失わない（レビュー指摘）。
function loadAllRecent() {
  recentByKind.value = {
    creator: loadRecentKind('creator'),
    title: loadRecentKind('title'),
    director: loadRecentKind('director'),
    studio: loadRecentKind('studio'),
  }
  if (!import.meta.client || typeof window === 'undefined') return
  if (recentByKind.value.creator.length > 0) return // 既に新キーがある＝移行不要
  try {
    const legacy = window.localStorage.getItem('cd_recent')
    if (!legacy) return
    const arr = JSON.parse(legacy)
    if (Array.isArray(arr)) {
      const items = arr
        .filter((x: any) => x && typeof x.id === 'number' && typeof x.name === 'string')
        .map((x: any) => ({ id: x.id, name: x.name }))
        .slice(0, RECENT_CAP)
      if (items.length) {
        recentByKind.value = { ...recentByKind.value, creator: items }
        window.localStorage.setItem(RECENT_KEYS.creator, JSON.stringify(items))
      }
    }
    window.localStorage.removeItem('cd_recent') // 移行済み（再移行しない）
  } catch {
    // 移行失敗は無視（機能は劣化させない）
  }
}

// 指定モードの「最近見た」へ追加（most-recent-first・id で dedup・上限8・永続化）。
function saveRecent(kind: RecentKind, id: number, name: string, type?: string) {
  if (!import.meta.client || typeof window === 'undefined') return
  if (!Number.isFinite(id) || !name) return
  const item: RecentItem = type ? { id, name, type } : { id, name }
  const next = [item, ...recentByKind.value[kind].filter(r => r.id !== id)].slice(0, RECENT_CAP)
  recentByKind.value = { ...recentByKind.value, [kind]: next }
  try {
    window.localStorage.setItem(RECENT_KEYS[kind], JSON.stringify(next))
  } catch {
    // quota 超過・プライベートモード等は黙って無視（機能は劣化させない）
  }
}

// ── 候補ドロップダウン: 開閉・キーボード操作・外クリック ──────────────────────

// v-model は IME 変換確定（Enter）まで値を同期しない＝「打っている途中」では候補が
// 出なかった。input イベントを直接拾うことで、変換中（確定前）でも1文字ごとに
// searchQuery を更新し、Google のように打っているそばから候補を出す。
function onInput(e: Event) {
  searchQuery.value = (e.target as HTMLInputElement).value
}

function closeDropdown() {
  dropdownOpen.value = false
  activeIndex.value = -1
}

// 入力欄に戻ってきた時、候補が残っていれば再表示する。
// 入力が空でも「最近見た作者」があればドロップダウンを開いて recent を見せる。
function onFocus() {
  const len = searchQuery.value.trim().length
  if (len === 0 && currentRecent.value.length > 0) {
    dropdownOpen.value = true
    return
  }
  const candCount = searchMode.value === 'title'
    ? mediaCandidates.value.length
    : searchMode.value === 'studio'
      ? studioCandidates.value.length
      : staffCandidates.value.length
  if (candCount > 0 && len >= 2) {
    dropdownOpen.value = true
  }
}

// 上下キーでハイライトを循環移動し、画面外なら見える位置へスクロール
function moveActive(delta: number) {
  const list: { id: number }[] = searchMode.value === 'title'
    ? mediaCandidates.value
    : searchMode.value === 'studio'
      ? studioCandidates.value
      : staffCandidates.value
  const n = list.length
  if (!dropdownOpen.value || n === 0) return
  activeIndex.value = (activeIndex.value + delta + n) % n
  nextTick(() => {
    const item = list[activeIndex.value]
    if (item) document.getElementById(`cand-${item.id}`)?.scrollIntoView({ block: 'nearest' })
  })
}

// Enter: ハイライト中の候補があれば選択、無ければ検索を実行
function onEnter() {
  if (searchMode.value === 'title') {
    const m = mediaCandidates.value[activeIndex.value]
    if (dropdownOpen.value && m) {
      selectMediaToAuthor(m)
      return
    }
    searchStaff()
    return
  }
  if (searchMode.value === 'studio') {
    const st = studioCandidates.value[activeIndex.value]
    if (dropdownOpen.value && st) {
      selectStudio(st)
      return
    }
    searchStaff()
    return
  }
  const s = staffCandidates.value[activeIndex.value]
  if (dropdownOpen.value && s) {
    selectStaff(s)
    return
  }
  searchStaff()
}

// IME 変換中（isComposing）はキー操作を無視する＝変換確定の Enter で誤検索しない定石。
function onKeydown(e: KeyboardEvent) {
  if (e.isComposing) return
  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); moveActive(1); break
    case 'ArrowUp': e.preventDefault(); moveActive(-1); break
    case 'Enter': e.preventDefault(); onEnter(); break
    case 'Escape': closeDropdown(); break
  }
}

// ドロップダウン外のクリックで閉じる（client-side のみ）
function onDocClick(e: MouseEvent) {
  const box = searchInputEl.value?.closest('.search-box')
  if (box && !box.contains(e.target as Node)) closeDropdown()
}

// プログラムから検索欄を書き換える時、再検索 watch を1回だけ抑止する。
// 値が変わらない時は何もしない（抑止フラグの漏れ＝次の入力が無視される事故を防ぐ）。
function setQuerySilently(v: string) {
  if (searchQuery.value === v) return
  suppressNextWatch = true
  searchQuery.value = v
}

// 候補/最近見たを「選択」したら、未発火の debounce 検索を取り消し、進行中の検索
// レスポンスも無効化する。これをしないと、選択直後に遅れて発火/到着した検索が
// 候補リストとドロップダウンを開き直し、選んだ選択を上書きしてしまう（レビュー指摘#3）。
function cancelPendingSearch() {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  requestSeq++ // 進行中の executeSearch/executeStudioSearch の応答を stale 化
  searchLoading.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  // 最近見た（全モード）を localStorage から復元（client のみ）
  loadAllRecent()
  // 共有 URL で直接開かれたら復元（?studio を優先、無ければ ?staff）。
  const studioId = parseInt(String(route.query.studio ?? ''), 10)
  const staffId = parseInt(String(route.query.staff ?? ''), 10)
  if (Number.isFinite(studioId)) selectStudioById(studioId)
  else if (Number.isFinite(staffId)) selectStaffById(staffId)
})
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

// 戻る/進む（?staff / ?studio の変化）に追従する。
watch(() => [route.query.staff, route.query.studio] as const, ([staffVal, studioVal]) => {
  const studioId = parseInt(String(studioVal ?? ''), 10)
  const staffId = parseInt(String(staffVal ?? ''), 10)
  if (Number.isFinite(studioId)) {
    if (selectedStudio.value?.id !== studioId) selectStudioById(studioId)
  } else if (Number.isFinite(staffId)) {
    if (selectedStaff.value?.id !== staffId) selectStaffById(staffId)
  } else if (selectedStaff.value || selectedStudio.value) {
    clearSelection()
    setQuerySilently('')
  }
})

// Query 1: Staff search (immediate — Enter / button)
async function searchStaff() {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  await executeSearch()
}

// Live search: debounced watch
watch(searchQuery, (newVal) => {
  // selectStaff が入力欄に名前を入れた直後は再検索しない
  if (suppressNextWatch) {
    suppressNextWatch = false
    return
  }
  resolveNotice.value = '' // 入力が変われば古い「作者なし」案内は消す（Codex#5）
  if (debounceTimer !== null) clearTimeout(debounceTimer)
  if (newVal.trim().length < 2) {
    // 入力が短い場合は候補をクリア。空なら recent を見せるためドロップダウンは
    // 開いたままにし、それ以外（1文字）は閉じる。
    // 進行中の検索レスポンスを無効化（クリア後に stale 候補が戻らないように＝Codex#2）。
    requestSeq++
    staffCandidates.value = []
    mediaCandidates.value = []
    studioCandidates.value = []
    searchError.value = ''
    studioHint.value = ''
    searchLoading.value = false
    if (newVal.trim().length === 0 && currentRecent.value.length > 0) {
      dropdownOpen.value = true
      activeIndex.value = -1
    } else {
      closeDropdown()
    }
    return
  }
  // 入力中はすぐドロップダウンを開いて「検索中」を見せる（体感速度）
  dropdownOpen.value = true
  searchLoading.value = true
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    executeSearch()
  }, 300)
})

const SEARCH_QUERY = `
  query($s: String) {
    Page(perPage: 20) {
      staff(search: $s) {
        id
        name { full native }
        primaryOccupations
        favourites
        image { medium }
      }
    }
  }
`

// 作品名（逆引き）モードの検索。type フィルタ無し＝漫画もアニメも出す。
const TITLE_SEARCH_QUERY = `
  query($s: String) {
    Page(perPage: 20) {
      media(search: $s, sort: [SEARCH_MATCH, POPULARITY_DESC]) {
        id type format popularity startDate { year }
        title { native romaji english } coverImage { medium }
      }
    }
  }
`

// term 単位の検索結果キャッシュ（同じ語の再リクエストを避けてレート負荷を下げる）
const staffSearchCache = new Map<string, StaffCandidate[]>()

// 1 表記ぶんの検索。失敗しても [] を返してマージを止めない。
// 429（レート上限）だけは握り潰さず呼び出し側へ伝える。成功結果はキャッシュする。
async function fetchStaff(term: string): Promise<{ staff: StaffCandidate[]; rateLimited: boolean }> {
  const cached = staffSearchCache.get(term)
  if (cached) return { staff: cached, rateLimited: false }
  try {
    const data = await $fetch<{ data: { Page: { staff: StaffCandidate[] } } }>(ANILIST, {
      method: 'POST',
      body: { query: SEARCH_QUERY, variables: { s: term } }
    })
    const staff = data.data.Page.staff
    staffSearchCache.set(term, staff)
    return { staff, rateLimited: false }
  } catch (e) {
    return { staff: [], rateLimited: isRateLimited(e) }
  }
}

// term 単位の作品検索キャッシュ（同じ語の再リクエストを避けてレート負荷を下げる）
const mediaSearchCache = new Map<string, MediaCandidate[]>()

// 1 表記ぶんの作品検索。失敗しても [] を返してマージを止めない。429 だけは伝える。
async function fetchMedia(term: string): Promise<{ media: MediaCandidate[]; rateLimited: boolean }> {
  const cached = mediaSearchCache.get(term)
  if (cached) return { media: cached, rateLimited: false }
  try {
    const data = await $fetch<{ data: { Page: { media: MediaCandidate[] } } }>(ANILIST, {
      method: 'POST',
      body: { query: TITLE_SEARCH_QUERY, variables: { s: term } }
    })
    const media = data.data.Page.media ?? []
    mediaSearchCache.set(term, media)
    return { media, rateLimited: false }
  } catch (e) {
    return { media: [], rateLimited: isRateLimited(e) }
  }
}

async function executeSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  // 作品名・制作会社モードは別パス。作者モードは下の既存ロジック。
  if (searchMode.value === 'title') {
    await executeTitleSearch(q)
    return
  }
  if (searchMode.value === 'studio') {
    await executeStudioSearch(q)
    return
  }
  dropdownOpen.value = true
  searchLoading.value = true

  // 検索バリアント: AniList はかな→漢字も ひらがな↔カタカナ も変換しないので、
  // 複数表記を投げて id で統合する:
  //  - 生入力（その表記の native にヒット。例 ひらがな名「かきふらい」）
  //  - ひら/カナ変換（カタカナ入力→ひらがな native。例 カキフライ→かきふらい）
  //  - ローマ字（漢字 native を読みで拾う。例 いのうえ→inoue→井上雄彦）
  const hasKana = /[぀-ヿ]/.test(q)
  const terms = hasKana
    ? [...new Set([q, toHiragana(q), toKatakana(q), toRomaji(q)])]
    : [q]

  searchError.value = ''
  staffCandidates.value = []
  mediaCandidates.value = []
  studioCandidates.value = []
  mediaAuthorChoices.value = []
  selectedStaff.value = null
  selectedStudio.value = null
  filteredWorks.value = []

  // stale レスポンス対策: このリクエストの連番を記録
  const mySeq = ++requestSeq

  const batches = await Promise.all(terms.map(fetchStaff))

  // 古いレスポンスは捨てる
  if (mySeq !== requestSeq) return
  searchLoading.value = false
  activeIndex.value = -1

  const anyRateLimited = batches.some(b => b.rateLimited)

  // id で重複排除して統合
  const byId = new Map<number, StaffCandidate>()
  for (const batch of batches) {
    for (const s of batch.staff) if (!byId.has(s.id)) byId.set(s.id, s)
  }

  // ── (A) Filter + Sort ──────────────────────────────────────────────────────
  // queryForms: 検索に使った全 term を小文字化
  const queryForms = terms.map(t => t.toLowerCase())

  const filtered = [...byId.values()].filter((c, _idx) => {
    // relevance: いずれかの term が name (native + full) に部分一致
    const fullName = ((c.name.native ?? '') + ' ' + (c.name.full ?? '')).toLowerCase()
    const isRelevant = queryForms.some(qf => {
      const toks = qf.split(/\s+/).filter(Boolean)
      return toks.length > 0 && toks.every(tok => fullName.includes(tok))
    })

    // 純・声優/ボーカルだけの人を除外（精密判定＝正当な作り手を巻き込まない）
    const pureVoice = isPureVoice(c.primaryOccupations)

    // モード別（#5）: creator は著者系のみ・director は監督系のみ（occ 空は両方残す）
    return isRelevant && !pureVoice && matchesSearchMode(c.primaryOccupations, searchMode.value)
  })

  // relevance rank: いずれかの term が native か full の先頭に一致 → 0、中間一致 → 1
  const withRank = filtered.map((c, idx) => {
    const native = (c.name.native ?? '').toLowerCase()
    const full = (c.name.full ?? '').toLowerCase()
    const prefixMatch = queryForms.some(qf => native.startsWith(qf) || full.startsWith(qf))
    return { c, idx, relevanceRank: prefixMatch ? 0 : 1 }
  })

  // 安定ソート: 第1=知名度（favourites 降順）、第2=occupationScore 昇順、
  // 第3=relevanceRank 昇順、第4=元 index。
  // favourites を最優先にするのが肝: AniList のかな検索は読みの前方一致で無名の人を
  // 上位に出し、ユーザーが探している有名な作り手（尾田・新海・荒木…）を埋もれさせる。
  // 知名度を第1キーにすると Google のように「有名な該当者が一番上」に揃う（実測検証済み）。
  withRank.sort((a, b) => {
    const favDiff = (b.c.favourites ?? 0) - (a.c.favourites ?? 0)
    if (favDiff !== 0) return favDiff
    const occDiff = occupationScore(a.c.primaryOccupations) - occupationScore(b.c.primaryOccupations)
    if (occDiff !== 0) return occDiff
    const relDiff = a.relevanceRank - b.relevanceRank
    if (relDiff !== 0) return relDiff
    return a.idx - b.idx
  })

  staffCandidates.value = withRank.map(({ c }) => c)
  // ──────────────────────────────────────────────────────────────────────────

  if (staffCandidates.value.length === 0) {
    // 全表記が 429 で空なら「見つからない」ではなくレート上限を案内する
    searchError.value = anyRateLimited ? RATE_LIMIT_MSG : '候補が見つかりませんでした。'
  }

  // analytics: 検索イベント（作者モードの結果件数）
  $posthog?.capture('search', { query: q, mode: searchMode.value, results: staffCandidates.value.length })
}

// 作品名（逆引き）モードの検索本体。候補は同じドロップダウンに別レイアウトで出す。
async function executeTitleSearch(q: string) {
  dropdownOpen.value = true
  searchLoading.value = true
  searchError.value = ''
  staffCandidates.value = []
  mediaCandidates.value = []
  mediaAuthorChoices.value = []
  selectedStaff.value = null
  filteredWorks.value = []

  // AniList は ひらがな↔カタカナ を変換しない（実測: わんぴーす では ONE PIECE が出ない）。
  // 作者検索と同じく複数表記を投げて id で統合する。タイトルは外来語が多く romaji 化は
  // ノイズ（進撃→"進撃no巨人"）になるので、ここは かな2系統だけに絞る。
  const hasKana = /[぀-ヿ]/.test(q)
  const terms = hasKana ? [...new Set([q, toHiragana(q), toKatakana(q)])] : [q]

  // stale レスポンス対策（作者検索と連番を共有）
  const mySeq = ++requestSeq
  const batches = await Promise.all(terms.map(fetchMedia))
  if (mySeq !== requestSeq) return
  searchLoading.value = false
  activeIndex.value = -1

  // id で統合し、popularity 降順で並べる。かな表記違いでヒットした有名作を上位へ
  // （作者検索が favourites を第1キーにするのと同じ狙い）。
  const byId = new Map<number, MediaCandidate>()
  for (const batch of batches) {
    for (const m of batch.media) if (!byId.has(m.id)) byId.set(m.id, m)
  }
  mediaCandidates.value = [...byId.values()].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))

  // 全表記が 429 で空ならレート上限を案内（0件は通常の「見つからない」表示に任せる）。
  if (mediaCandidates.value.length === 0 && batches.some(b => b.rateLimited)) {
    searchError.value = RATE_LIMIT_MSG
  }

  // analytics: 検索イベント（作品名モードの結果件数）
  $posthog?.capture('search', { query: q, mode: searchMode.value, results: mediaCandidates.value.length })
}

// ── 制作会社（studio）モード ──────────────────────────────────────────────────
// AniList の studios(search) は日本語入力で機能しない（実測 2026-06-14）:
//   ・漢字クエリ（例「京都」）→ 関連性ゼロで FAVOURITES_DESC 先頭（人気順）をそのまま返す
//     ＝ Kyoto Animation が先頭なのは「最も favourites が多いから」で、マッチではない（#2）
//   ・かな/かな混じり（例「京アニ」「ジブリ」）→ 空
//   ・ローマ字/英語（例「ufotable」「kyoto」）→ 正常にマッチ
// そこで、よく検索される日本語スタジオ名 →「AniList が解決できるローマ字根」の別名表で
// 橋渡しする（各根が意図どおりのスタジオを先頭に返すことを実測で確認済み）。
// かなはひらがなに正規化して照合、漢字キーは生のまま照合する。
const STUDIO_ALIASES: Record<string, string> = {
  // Kyoto Animation
  'きょうとあにめーしょん': 'kyoto', 'きょうあに': 'kyoto', 'きょうと': 'kyoto',
  '京都アニメーション': 'kyoto', '京アニ': 'kyoto', '京都': 'kyoto',
  // Studio Ghibli
  'じぶり': 'ghibli', 'すたじおじぶり': 'ghibli',
  // Toei Animation
  'とうえい': 'toei', 'とうえいあにめーしょん': 'toei', '東映': 'toei', '東映アニメーション': 'toei',
  // others（根は実測でヒット確認済み）
  'さんらいず': 'sunrise',
  'ぼんず': 'bones',
  'ゆーふぉーてーぶる': 'ufotable', 'ゆーふぉてーぶる': 'ufotable',
  'まっぱ': 'mappa',
  'まっどはうす': 'madhouse',
  'うぃっと': 'wit studio', 'うぃっとすたじお': 'wit studio',
  'しゃふと': 'shaft',
  'とりがー': 'trigger',
  'ぷろだくしょんあいじー': 'production i.g', 'ぷろだくしょんあいじ': 'production i.g', 'あいじー': 'production i.g',
  'くろーばーわーくす': 'cloverworks',
  'ぴえろ': 'pierrot', 'すたじおぴえろ': 'pierrot',
  'がいなっくす': 'gainax',
  'じぇーしーすたっふ': 'j.c.staff', 'じぇいしーすたっふ': 'j.c.staff',
  'ぴーえーわーくす': 'p.a.', 'ぴーえー': 'p.a.',
  'どうがこうぼう': 'doga', '動画工房': 'doga',
  'えーわん': 'a-1', 'えーわんぴくちゃーず': 'a-1',
  'すたじおでぃーん': 'deen', 'でぃーん': 'deen',
  'ごんぞ': 'gonzo',
  'たつのこ': 'tatsunoko', 'たつのこぷろ': 'tatsunoko',
  'らいでんふぃるむ': 'lidenfilms', 'らいでんふぃるむす': 'lidenfilms',
  'でいびっどぷろだくしょん': 'david', 'でいびっど': 'david',
  'おれんじ': 'orange',
  'さいえんすさる': 'science saru',
}

// 検索語を AniList 用に正規化。別名に当たればローマ字根へ、当たらなければ生のまま。
function resolveStudioTerm(q: string): { term: string; viaAlias: boolean } {
  const raw = q.trim()
  const alias = STUDIO_ALIASES[raw] ?? STUDIO_ALIASES[toHiragana(raw)] ?? STUDIO_ALIASES[toKatakana(raw)]
  if (alias) return { term: alias, viaAlias: true }
  return { term: raw, viaAlias: false }
}

const STUDIO_SEARCH_QUERY = `
  query($s: String) {
    Page(perPage: 20) {
      studios(search: $s) { id name favourites isAnimationStudio }
    }
  }
`

// スタジオ→主要制作アニメ（isMain で関与が薄い作品を除外・新しい順）。
const STUDIO_WORKS_QUERY = `
  query($id: Int, $p: Int) {
    Studio(id: $id) {
      name
      media(isMain: true, sort: [START_DATE_DESC], page: $p, perPage: 50) {
        pageInfo { hasNextPage }
        nodes {
          id
          title { native romaji english }
          startDate { year }
          coverImage { medium }
          siteUrl
        }
      }
    }
  }
`

interface StudioWorkNode {
  id: number
  title: { native: string | null; romaji: string | null; english: string | null }
  startDate: { year: number | null } | null
  coverImage: { medium: string } | null
  siteUrl: string
}

// 制作会社モードの検索。日本語名は別名表でローマ字根へ橋渡しし（#2）、当たらない
// 日本語入力は AniList が人気順フィラーを返すので検索せずローマ字入力を案内する。
async function executeStudioSearch(q: string) {
  // 進行中の検索を先に無効化（日本語ガードの早期 return より前に bump しないと、
  // 古い in-flight 検索が後から候補/ヒントを上書きする＝Codex#1）。
  const mySeq = ++requestSeq
  dropdownOpen.value = true
  searchLoading.value = true
  searchError.value = ''
  studioHint.value = ''
  staffCandidates.value = []
  mediaCandidates.value = []
  studioCandidates.value = []
  mediaAuthorChoices.value = []
  selectedStaff.value = null
  selectedStudio.value = null
  filteredWorks.value = []

  const { term, viaAlias } = resolveStudioTerm(q)
  // 別名にも当たらない日本語入力（漢字→人気順フィラー / かな→空）は検索せず案内する。
  const termHasJa = /[぀-ヿ一-鿿]/.test(term)
  if (termHasJa && !viaAlias) {
    searchLoading.value = false
    activeIndex.value = -1
    studioCandidates.value = []
    studioHint.value =
      '制作会社は英語/ローマ字名で検索してください（例: 京都アニメーション → Kyoto Animation、ほか MAPPA / ufotable / Toei）。'
    $posthog?.capture('search', { query: q, mode: searchMode.value, results: 0 })
    return
  }

  try {
    const data = await $fetch<{ data: { Page: { studios: StudioCandidate[] } } }>(ANILIST, {
      method: 'POST',
      body: { query: STUDIO_SEARCH_QUERY, variables: { s: term } }
    })
    if (mySeq !== requestSeq) return
    searchLoading.value = false
    activeIndex.value = -1
    // AniList の検索関連度順をそのまま使う（ローマ字検索は実測でクリーン）。favourites で
    // 再ソートすると、たまたまヒットした有名スタジオが本命を押しのける（#1）。
    studioCandidates.value = data.data.Page.studios ?? []
    if (studioCandidates.value.length === 0) {
      studioHint.value = '該当する制作会社が見つかりませんでした。'
    }
  } catch (e) {
    if (mySeq !== requestSeq) return
    searchLoading.value = false
    activeIndex.value = -1
    studioCandidates.value = []
    if (isRateLimited(e)) searchError.value = RATE_LIMIT_MSG
  }

  $posthog?.capture('search', { query: q, mode: searchMode.value, results: studioCandidates.value.length })
}

// 制作会社を選択 → 主要アニメを読み込む。共有のため URL に ?studio=ID を載せる。
async function selectStudio(studio: StudioCandidate) {
  cancelPendingSearch()
  closeDropdown()
  searchError.value = ''
  mediaAuthorChoices.value = []
  selectedStaff.value = null
  selectedStudio.value = studio
  setQuerySilently(studio.name)
  saveRecent('studio', studio.id, studio.name) // 最近見た制作会社へ保存（#1）
  const mySeq = ++selectSeq
  if (String(route.query.studio ?? '') !== String(studio.id)) {
    router.push({ query: { studio: String(studio.id) } })
  }
  $posthog?.capture('creator_viewed', { staff_id: studio.id, staff_name: studio.name, source: 'studio_search' })
  await loadStudioWorks(studio.id, mySeq)
}

// 制作会社の作品を読み込み、work-card 再利用のため WorkEdge 形へマップ（staffRole は空）。
async function loadStudioWorks(id: number, mySeq: number) {
  studioBadges.value = {}
  expandedStudios.value = new Set()
  selectedStaffKind.value = 'author'
  worksCtl = {
    query: STUDIO_WORKS_QUERY,
    vars: { id },
    pick: (data) => {
      const st = data?.data?.Studio
      if (!st) return null
      // ?studio=ID 直アクセスは名前未確定なので、応答の Studio.name で確定させる。
      if (selectedStudio.value?.id === id && st.name) {
        selectedStudio.value = { ...selectedStudio.value, name: st.name }
      }
      return { items: (st.media?.nodes ?? []) as StudioWorkNode[], hasNextPage: !!st.media?.pageInfo?.hasNextPage }
    },
    // 並び順は sortedWorks（古い順/新しい順トグル）が担当するので transform では並べない。
    transform: (raw: StudioWorkNode[]) => raw.map(n => ({
      staffRole: '',
      node: {
        id: n.id,
        title: n.title,
        startDate: n.startDate,
        coverImage: n.coverImage,
        siteUrl: n.siteUrl,
        relations: { edges: [] }
      }
    })),
    seq: mySeq,
  }
  await runWorksBatch(true)
}

// URL（?studio=ID）や戻る/進む操作から制作会社を選択。名前は works 応答で確定する。
async function selectStudioById(id: number) {
  searchMode.value = 'studio'
  selectedStaff.value = null
  mediaAuthorChoices.value = []
  selectedStudio.value = { id, name: '', favourites: null, isAnimationStudio: false }
  closeDropdown()
  const mySeq = ++selectSeq
  await loadStudioWorks(id, mySeq)
  if (selectedStudio.value?.id === id) setQuerySilently(selectedStudio.value.name)
}

// 検索モードを切り替える。候補・選択・URL を全部リセットする。
function setSearchMode(mode: SearchMode) {
  if (searchMode.value === mode) return
  searchMode.value = mode
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  // 進行中の検索/選択レスポンスを無効化（stale が新モードに紛れ込むのを防ぐ＝Codex#2/#4）。
  requestSeq++
  selectSeq++
  staffCandidates.value = []
  mediaCandidates.value = []
  studioCandidates.value = []
  searchError.value = ''
  resolveNotice.value = ''
  studioHint.value = ''
  searchLoading.value = false
  // 選択（作者/制作会社）と作品表示も全部リセット（古い結果が残らないように＝Codex#4）。
  clearSelection()
  // URL から ?staff / ?studio を外す（再読込/戻るで古い選択が復活しないように＝Codex#3）。
  if (route.query.staff != null || route.query.studio != null) {
    router.replace({ query: {} })
  }
  closeDropdown()
  setQuerySilently('')
}

// 古い選択のレスポンスでバッジ/作品を上書きしないための連番
let selectSeq = 0

const WORKS_QUERY = `
  query($id: Int, $p: Int) {
    Staff(id: $id) {
      name { full native }
      staffMedia(type: MANGA, sort: START_DATE, page: $p, perPage: 50) {
        pageInfo { hasNextPage }
        edges {
          staffRole
          node {
            id
            title { native romaji english }
            startDate { year }
            coverImage { medium }
            siteUrl
            relations { edges { relationType node { id type } } }
          }
        }
      }
    }
  }
`

// ── 段階ロード基盤（#3/#4 ＋ 全件取得）─────────────────────────────────────────
// AniList のネストした staffMedia / Studio.media は perPage を要求しても 25 に
// クランプされ（実測 2026-06-14）、`total` は嘘を返す（page1-4 で total=500 と言い
// page5 で 122・hasNext=false）。なので total は使わず hasNextPage だけで辿る。
// 多作（山田尚子=ANIME 122件・けいおんは4ページ目）でも全ロールを集めてから
// クライアント側で役割フィルタしないと、25件クランプで目的の作品が落ちる（#4 の根因）。
// ハード打ち切りはせず、1バッチ=数ページずつ取り、続きがあれば「もっと読み込む」で
// 全件取得できるようにする（件数が多くても切り替えで全部辿れる＝ユーザー要望）。
const RATE_LIMITED_MORE_NOTICE =
  'AniList のレート上限です。少し待ってから「もっと読み込む」で続きを取得できます。'
const WORKS_BATCH_PAGES = 4 // 1バッチで取るページ数（25×4≒100件）。残りは「もっと読み込む」で

// 段階ロードのコントローラ（現在表示中の作品ソース）。モード差はここに閉じ込める。
interface WorksController {
  query: string
  vars: Record<string, unknown>
  // 応答からこのページの生 items と続きの有無を取り出す（name 確定の副作用もここで）
  pick: (data: any) => { items: any[]; hasNextPage: boolean } | null
  // 生 items の累積 → 表示用 WorkEdge[]（役割フィルタ・重複排除・整形）
  transform: (raw: any[]) => WorkEdge[]
  // バッチ取得後フック（例: 作者作品の studio バッジ解決）
  onBatch?: (works: WorkEdge[]) => Promise<void>
  seq: number // 起動時の selectSeq スナップショット（stale 判定）
}
let worksCtl: WorksController | null = null
let worksRaw: any[] = [] // 生 edges/nodes の累積（再 transform 用）
let worksCursor = 1 // 次に取るページ番号

// 1バッチ分（最大 WORKS_BATCH_PAGES ページ）を取得して累積に足し、表示を更新する。
// reset=true で先頭から（新しい選択）、false で続き（もっと読み込む）。
async function runWorksBatch(reset: boolean) {
  const ctl = worksCtl
  if (!ctl) return
  if (reset) {
    worksRaw = []
    worksCursor = 1
    worksSort.value = 'old' // 新しい選択は初期=古い順
    worksLoading.value = true
    worksError.value = ''
    worksNotice.value = ''
    worksHasMore.value = false
  } else {
    worksLoadingMore.value = true
  }
  try {
    let pages = 0
    while (pages < WORKS_BATCH_PAGES) {
      let data: any
      try {
        data = await $fetch<any>(ANILIST, {
          method: 'POST',
          body: { query: ctl.query, variables: { ...ctl.vars, p: worksCursor } }
        })
      } catch (e) {
        // バッチ途中の失敗: 既に取れたぶんは保持し、続きは後で（もっと読み込む）。
        if (worksRaw.length > 0) {
          if (isRateLimited(e)) worksNotice.value = RATE_LIMITED_MORE_NOTICE
          worksHasMore.value = true
          break
        }
        throw e // 先頭から失敗 → 呼び出し側のエラー表示へ
      }
      if (ctl.seq !== selectSeq) return // stale（別の選択が来た）
      const page = ctl.pick(data)
      if (!page) { worksHasMore.value = false; break }
      worksRaw.push(...page.items)
      worksCursor++
      pages++
      worksHasMore.value = !!page.hasNextPage
      if (!page.hasNextPage) break
    }
    if (ctl.seq !== selectSeq) return
    const works = ctl.transform(worksRaw)
    filteredWorks.value = works
    worksLoading.value = false
    worksLoadingMore.value = false
    if (ctl.onBatch) await ctl.onBatch(works)
  } catch (e) {
    if (!worksCtl || worksCtl.seq !== selectSeq) return
    worksError.value = isRateLimited(e)
      ? RATE_LIMIT_MSG
      : '作品の取得中にエラーが発生しました。少し待ってから再試行してください。'
    worksLoading.value = false
    worksLoadingMore.value = false
  }
}

// 「もっと読み込む」: 続きのバッチを取得して追記する。
async function loadMoreWorks() {
  if (worksLoadingMore.value || worksLoading.value) return
  await runWorksBatch(false)
}

// 選択を解除して初期状態へ戻す（URL から ?staff が外れた＝戻る操作 等）
function clearSelection() {
  selectedStaff.value = null
  selectedStudio.value = null
  filteredWorks.value = []
  studioBadges.value = {}
  expandedStudios.value = new Set()
  worksError.value = ''
  worksNotice.value = ''
  mediaAuthorChoices.value = []
  // 段階ロード状態もリセット
  worksCtl = null
  worksRaw = []
  worksHasMore.value = false
  worksLoadingMore.value = false
}

// 作品＋スタジオバッジを読み込む（selectedStaff は呼び出し側で先にセット済み）。
// 全ページ辿ってから staffRole フィルタ＝25件クランプで Story&Art 作品が落ちない（#3）。
// 段階ロード（バッチ）で、件数が多くても「もっと読み込む」で全件取れる。
async function loadWorks(id: number, mySeq: number) {
  studioBadges.value = {}
  expandedStudios.value = new Set()
  selectedStaffKind.value = 'author'
  worksCtl = {
    query: WORKS_QUERY,
    vars: { id },
    pick: (data) => {
      const sm = data?.data?.Staff?.staffMedia
      if (!sm) return null
      // works クエリも name を返す。?staff=ID 直アクセス（名前未確定）の時に確定させる。
      if (selectedStaff.value?.id === id && data.data.Staff?.name) {
        selectedStaff.value = { ...selectedStaff.value, name: data.data.Staff.name }
      }
      return { items: (sm.edges ?? []) as WorkEdge[], hasNextPage: !!sm.pageInfo?.hasNextPage }
    },
    // staffRole フィルタ後、同一作品が複数ロールで重複するので node id で1件に畳む。
    transform: (raw: WorkEdge[]) => {
      const matched = raw.filter(edge => STAFF_ROLE_FILTER.some(role => edge.staffRole.includes(role)))
      const seen = new Set<number>()
      return matched.filter(edge => {
        if (seen.has(edge.node.id)) return false
        seen.add(edge.node.id)
        return true
      })
    },
    // 表示後にアニメ化（制作会社）バッジを後追いで差し込む（best-effort）。
    onBatch: async (works) => { await loadStudioBadges(works, mySeq) },
    seq: mySeq,
  }
  await runWorksBatch(true)
}

// 監督モードの作品クエリ（アニメの監督ロールだけを後で抽出）。
const DIRECTOR_WORKS_QUERY = `
  query($id: Int, $p: Int) {
    Staff(id: $id) {
      name { full native }
      staffMedia(type: ANIME, sort: START_DATE_DESC, page: $p, perPage: 50) {
        pageInfo { hasNextPage }
        edges {
          staffRole
          node {
            id
            title { native romaji english }
            startDate { year }
            coverImage { medium }
            siteUrl
          }
        }
      }
    }
  }
`

// 監督ロール判定: "Director" を含むが、部門ディレクター（作画/音響/美術/各話/助監督等）は除外。
function isDirectorRole(role: string): boolean {
  const r = role.trim()
  if (!r.includes('Director')) return false
  return !/(Animation|Sound|Art|Episode|Assistant|Technical|Unit|Photography|CG|CGI|3D|Action|Mechanical|Editing|Color|Online)/i.test(r)
}

// 監督モード: 選んだ人物が監督した作品（アニメ）を新しい順で表示。スタジオバッジは付けない。
// 監督ロールは全アニメ credits（episode/storyboard 含む数百件）中ごく少数に散在し、
// 25件クランプだと古い代表作が落ちる（山田尚子のけいおん=2009 は4ページ目＝#4 の根因）。
// 全ページ辿ってから isDirectorRole で抽出する。
async function loadDirectorWorks(id: number, mySeq: number) {
  studioBadges.value = {}
  expandedStudios.value = new Set()
  selectedStaffKind.value = 'director'
  worksCtl = {
    query: DIRECTOR_WORKS_QUERY,
    vars: { id },
    pick: (data) => {
      const sm = data?.data?.Staff?.staffMedia
      if (!sm) return null
      if (selectedStaff.value?.id === id && data.data.Staff?.name) {
        selectedStaff.value = { ...selectedStaff.value, name: data.data.Staff.name }
      }
      return { items: (sm.edges ?? []) as WorkEdge[], hasNextPage: !!sm.pageInfo?.hasNextPage }
    },
    // 監督ロールのみ＋ node id で重複排除（並び順は sortedWorks が担当）。
    transform: (raw: WorkEdge[]) => {
      const seen = new Set<number>()
      return raw
        .filter(e => isDirectorRole(e.staffRole))
        .filter(e => { if (seen.has(e.node.id)) return false; seen.add(e.node.id); return true })
        .map(e => ({ staffRole: '監督', node: { ...e.node, relations: { edges: [] } } }))
    },
    seq: mySeq,
  }
  await runWorksBatch(true)
}

// 候補クリックから選択。作者/監督モードで読み込む作品を切替える。
async function selectStaff(staff: StaffCandidate) {
  cancelPendingSearch()
  const name = staff.name.native || staff.name.full
  setQuerySilently(name)
  closeDropdown()
  mediaAuthorChoices.value = []
  selectedStudio.value = null
  resolveNotice.value = ''
  const mySeq = ++selectSeq
  selectedStaff.value = staff
  // 監督モード: その人物の「監督作品（アニメ）」を表示。最近見た監督へ保存（URL は v1 で載せない）。
  if (searchMode.value === 'director') {
    saveRecent('director', staff.id, name)
    $posthog?.capture('creator_viewed', { staff_id: staff.id, staff_name: name, source: 'director_search' })
    await loadDirectorWorks(staff.id, mySeq)
    return
  }
  // 作者モード: 共有のため URL に ?staff=ID を載せる（戻る/シェア対応）。
  if (String(route.query.staff ?? '') !== String(staff.id)) {
    router.push({ query: { staff: String(staff.id) } })
  }
  // 最近見た作者へ保存 ＋ analytics（作者検索由来）
  saveRecent('creator', staff.id, name)
  $posthog?.capture('creator_viewed', { staff_id: staff.id, staff_name: name, source: 'creator_search' })
  await loadWorks(staff.id, mySeq)
}

// 作品名（逆引き）モードの構成. Media の staff から「作者」を解決する。
// アニメ→原作者、漫画→漫画家。優先ロールの並び順で最初に当たったものを採用。
const MEDIA_STAFF_QUERY = `
  query($id: Int) {
    Media(id: $id) {
      staff(sort: [RELEVANCE]) {
        edges { role node { id name { full native } } }
      }
    }
  }
`

// 作品→作り手チューザに出すロール（表示優先度順・部分一致で判定）。原作系を先頭にし
// （「原作者と漫画作家」の語順）、次に Story & Art、作画系、原案 の順。翻訳・写植・
// レタリング等の制作ロールはこのリストに無い＝チューザに出さない。
// "Story & Art" は "Story"/"Art" より前に置く（部分一致の取りこぼし/二重取りを防ぐ）。
const AUTHOR_ROLE_MATCHES = [
  'Original Creator', 'Original Story', 'Original Concept', 'Story & Art',
  'Story', 'Art', 'Illustration', 'Character Design',
]

interface MediaStaffEdge {
  role: string
  node: { id: number; name: { full: string; native: string | null } }
}

// チューザ1件分（作り手＋日本語ロールラベル＋辿り先の種別）。
// kind='author' は漫画/原作作品へ、kind='director' は監督作品へルーティングする。
interface AuthorChoice {
  id: number
  name: { full: string; native: string | null }
  role: string
  label: string
  kind: 'author' | 'director'
}

// AniList の英語ロールを日本語ラベルへ。AniList は role 文字列に前後の空白を含むことが
// ある（例 "Story "）ので trim して判定する。"Story" 単独は原作 or 脚色で曖昧なので、
// 同じ作品に Original 系がいれば「脚本・構成」、いなければ「原作」と文脈で出し分ける。
function authorRoleLabel(role: string, edges: MediaStaffEdge[]): string {
  const r = role.trim()
  if (r.includes('Story & Art')) return '原作・作画'
  if (r.includes('Original Concept')) return '原案'
  if (r.includes('Original Creator') || r.includes('Original Story')) return '原作'
  if (r === 'Story') {
    const hasOriginal = edges.some(e => /Original (Creator|Story)/.test(e.role ?? ''))
    return hasOriginal ? '脚本・構成' : '原作'
  }
  if (r.includes('Character Design')) return 'キャラクター原案'
  if (r.includes('Illustration') || r.includes('Art')) return '作画'
  return r
}

// 漫画は AUTHOR_ROLE_MATCHES の全系統（原作＋作画）を作者として扱う。
// 作品の staff edges から「作り手」を優先度順・node id で重複排除して集める。
function collectAuthors(edges: MediaStaffEdge[], roleMatches: string[]): AuthorChoice[] {
  const authors: AuthorChoice[] = []
  const seen = new Set<number>()
  for (const m of roleMatches) {
    for (const e of edges) {
      const r = (e.role ?? '').trim()
      if (r.includes(m) && !seen.has(e.node.id)) {
        seen.add(e.node.id)
        authors.push({ id: e.node.id, name: e.node.name, role: r, label: authorRoleLabel(r, edges), kind: 'author' })
      }
    }
  }
  return authors
}

// アニメ作品のチューザ用: 原作（→漫画作品へ）＋監督（→監督作品へ）＋シリーズ構成/脚本/
// キャラ原案（→その人の原作・漫画へ）を、優先度順・node id 重複排除で集める。
// 監督判定は isDirectorRole（"Director" 部分一致だと Animation/Sound Director 等も拾う）。
function collectAnimeCreators(edges: MediaStaffEdge[]): AuthorChoice[] {
  const out: AuthorChoice[] = []
  const seen = new Set<number>()
  const add = (e: MediaStaffEdge, kind: 'author' | 'director', label: string) => {
    if (seen.has(e.node.id)) return
    seen.add(e.node.id)
    out.push({ id: e.node.id, name: e.node.name, role: (e.role ?? '').trim(), label, kind })
  }
  // 1) 原作系（漫画/小説へ辿れる）
  for (const e of edges) {
    const r = (e.role ?? '').trim()
    if (/Original (Creator|Story|Concept)/.test(r)) add(e, 'author', authorRoleLabel(r, edges))
  }
  // 2) 監督（監督作品へ辿れる・部門ディレクターは除外）
  for (const e of edges) {
    if (isDirectorRole((e.role ?? '').trim())) add(e, 'director', '監督')
  }
  // 3) シリーズ構成 / 脚本 / キャラクター原案（その人の原作・漫画へ辿れることがある）
  for (const e of edges) {
    const r = (e.role ?? '').trim()
    if (/Series Composition/.test(r)) add(e, 'author', 'シリーズ構成')
    else if (/Script|Screenplay/.test(r)) add(e, 'author', '脚本')
    else if (/Character Design/.test(r)) add(e, 'author', 'キャラクター原案')
  }
  return out
}

// 作品候補をクリック→その作品の作り手を解決する。原作/作画など複数いれば
// チューザを出して選ばせ（#2/#3）、1人なら従来どおり自動でその作者へ進む。
async function selectMediaToAuthor(media: MediaCandidate) {
  // 最近見た作品へ保存（#1: 作品モードは作品を覚える。type は再解決で原作ロールの拾い方に使う）。
  saveRecent('title', media.id, displayTitle(media.title), media.type)
  await resolveMediaToAuthor(media.id, media.type, displayTitle(media.title))
}

// 作品 id → 作者解決の本体（作品候補クリックと「最近見た作品」クリックの共通処理）。
async function resolveMediaToAuthor(id: number, type: string, displayName: string) {
  cancelPendingSearch()
  closeDropdown()
  searchError.value = ''
  resolveNotice.value = ''
  // タイトルモードの検索欄には作者名を入れず、選んだ作品名を残す（#3）。
  setQuerySilently(displayName)
  // stale ガード: 解決中に別の選択/検索が来たら、遅れて返る応答は捨てる（Codex#1）。
  const mySeq = ++selectSeq
  try {
    const data = await $fetch<{ data: { Media: { staff: { edges: MediaStaffEdge[] } } } }>(ANILIST, {
      method: 'POST',
      body: { query: MEDIA_STAFF_QUERY, variables: { id } }
    })
    if (mySeq !== selectSeq) return
    const edges = data.data.Media?.staff?.edges ?? []
    // アニメは原作＋監督＋構成/脚本/キャラ原案を出す（監督等も辿れるように＝要望）。
    // 漫画は原作＋作画の全系統（すべて kind='author'）。
    const authors = type === 'ANIME' ? collectAnimeCreators(edges) : collectAuthors(edges, AUTHOR_ROLE_MATCHES)
    // 作り手が居なければ案内（resolveNotice は選択が無くても見える独立表示＝Codex#5）。
    if (authors.length === 0) {
      resolveNotice.value = type === 'ANIME'
        ? `「${displayName}」の主要な作り手（原作・監督など）が見つかりませんでした。`
        : `「${displayName}」の作者情報が取得できませんでした。`
      selectedStaff.value = null
      mediaAuthorChoices.value = []
      return
    }
    if (authors.length === 1) {
      await goToChoice(authors[0])
      return
    }
    // 複数（原作＋監督＋… 等）はチューザを表示し、選択を待つ（works はまだ走らせない）。
    mediaAuthorChoices.value = authors
    mediaAuthorSourceTitle.value = displayName
    selectedStaff.value = null
    filteredWorks.value = []
  } catch (e) {
    if (mySeq !== selectSeq) return
    mediaAuthorChoices.value = []
    resolveNotice.value = isRateLimited(e)
      ? RATE_LIMIT_MSG
      : '作者の解決中にエラーが発生しました。少し待ってから再試行してください。'
    selectedStaff.value = null
  }
}

// チューザの選択を種別で振り分ける。原作系→漫画作品（goToAuthor）、監督→監督作品。
async function goToChoice(c: AuthorChoice) {
  if (c.kind === 'director') {
    const display = c.name.native || c.name.full
    saveRecent('director', c.id, display) // 最近見た監督へ
    $posthog?.capture('creator_viewed', { staff_id: c.id, staff_name: display, source: 'title_to_director' })
    await selectDirectorById(c.id, display)
    return
  }
  await goToAuthor(c.id, c.name)
}

// 作者を確定して作品を読み込む共通処理（単一作者の自動選択 / チューザ選択 から呼ぶ）。
// ?staff=ID を push するのでディープリンク・戻る・スタジオバッジがそのまま効く。
async function goToAuthor(id: number, name: { full: string; native: string | null }) {
  cancelPendingSearch()
  mediaAuthorChoices.value = []
  selectedStudio.value = null
  const mySeq = ++selectSeq
  selectedStaff.value = { id, name, primaryOccupations: [], favourites: null, image: null }
  const display = name.native || name.full
  if (String(route.query.staff ?? '') !== String(id)) {
    router.push({ query: { staff: String(id) } })
  }
  // 作品モード由来なので「最近見た作品」は selectMediaToAuthor 側で保存済み（ここでは作者を recent に積まない＝リストをタブと1対1に保つ）。
  $posthog?.capture('creator_viewed', { staff_id: id, staff_name: display, source: 'title_search' })
  await loadWorks(id, mySeq)
}

// 「最近見た監督」クリック等から、監督作品を id で読み込む（名前は確定済み）。
async function selectDirectorById(id: number, name: string) {
  selectedStudio.value = null
  mediaAuthorChoices.value = []
  closeDropdown()
  const mySeq = ++selectSeq
  selectedStaff.value = { id, name: { full: name, native: name }, primaryOccupations: [], favourites: null, image: null }
  await loadDirectorWorks(id, mySeq)
}

// 「最近見た」チップ/行のクリック。現在モードに応じて読み込み先を切替える（#1）。
async function selectRecent(r: RecentItem) {
  cancelPendingSearch()
  setQuerySilently(r.name)
  closeDropdown()
  const mode = searchMode.value
  // クリックで最前面へ並べ替え（各モードの list へ）
  if (mode === 'studio') {
    saveRecent('studio', r.id, r.name)
    await selectStudioById(r.id)
    // 共有/リロードできるよう URL に ?studio=ID を載せる（候補クリックと対称）。
    if (String(route.query.studio ?? '') !== String(r.id)) {
      router.push({ query: { studio: String(r.id) } })
    }
    return
  }
  if (mode === 'director') {
    saveRecent('director', r.id, r.name)
    $posthog?.capture('creator_viewed', { staff_id: r.id, staff_name: r.name, source: 'recent' })
    await selectDirectorById(r.id, r.name)
    return
  }
  if (mode === 'title') {
    saveRecent('title', r.id, r.name, r.type)
    await resolveMediaToAuthor(r.id, r.type ?? 'MANGA', r.name)
    return
  }
  // creator
  saveRecent('creator', r.id, r.name)
  $posthog?.capture('creator_viewed', { staff_id: r.id, staff_name: r.name, source: 'recent' })
  // selectStaffById が selectedStaff.id を即セットするので、続く ?staff push の watch は
  // 同 id 判定で二重ロードしない。loadWorks も selectStaffById 内で1回だけ走る。
  await selectStaffById(r.id)
  if (String(route.query.staff ?? '') !== String(r.id)) {
    router.push({ query: { staff: String(r.id) } })
  }
}

// URL（?staff=ID）や戻る/進む操作から選択。名前は works クエリ応答で確定する。
async function selectStaffById(id: number) {
  const mySeq = ++selectSeq
  selectedStaff.value = { id, name: { full: '', native: null }, primaryOccupations: [], favourites: null, image: null }
  selectedStudio.value = null
  closeDropdown()
  mediaAuthorChoices.value = []
  await loadWorks(id, mySeq)
  if (selectedStaff.value?.id === id) {
    setQuerySilently(selectedStaff.value.name.native || selectedStaff.value.name.full)
  }
}

// X（旧 Twitter）へ現在の作者ページを共有する（Web Intent）
function shareOnX() {
  if (!selectedStaff.value) return
  const name = selectedStaff.value.name.native || selectedStaff.value.name.full
  const text = `「${name}」の作品とアニメ化スタジオ｜Creator Discovery`
  const url = window.location.href
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  window.open(intent, '_blank', 'noopener')
}

// ── Studio badges ───────────────────────────────────────────────────────────
// AniList は relations 配下の studios をネスト取得すると 500 を返す（relation
// ノード1つにつき1エラー＝既知の制約）。そこで2フェーズ目として、表示作品の
// ADAPTATION→ANIME の media id を集め、その制作会社を id_in で一括取得する。
// 429 自動リトライの待ち時間（ms・Retry-After が無い時の fallback）。要素数＝最大リトライ回数。
const STUDIO_RETRY_FALLBACK = [20000, 40000]

const STUDIO_QUERY = `
  query($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        studios(isMain: true) { nodes { name isAnimationStudio } }
      }
    }
  }
`

interface StudioNode { name: string; isAnimationStudio: boolean }

// anime media id → 主要制作会社名（アニメ制作会社を優先）。id は 50 件ずつ分割。
async function fetchStudiosByAnime(ids: number[]): Promise<Map<number, string[]>> {
  const out = new Map<number, string[]>()
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50)
    const data = await $fetch<{
      data: { Page: { media: { id: number; studios: { nodes: StudioNode[] } }[] } }
    }>(ANILIST, {
      method: 'POST',
      body: { query: STUDIO_QUERY, variables: { ids: chunk } }
    })
    for (const m of data.data.Page.media) {
      const anim = m.studios.nodes.filter(n => n.isAnimationStudio).map(n => n.name)
      // isMain は通常アニメ制作会社。フラグが付かない時だけ全 main にフォールバック
      out.set(m.id, anim.length ? anim : m.studios.nodes.map(n => n.name))
    }
  }
  return out
}

// 表示中の各作品に「アニメ化した制作会社」バッジを解決する。
async function loadStudioBadges(works: WorkEdge[], mySeq: number) {
  const animeIdsByManga = new Map<number, number[]>()
  const allAnimeIds = new Set<number>()
  for (const edge of works) {
    const ids = (edge.node.relations?.edges ?? [])
      .filter(r => r.relationType === 'ADAPTATION' && r.node.type === 'ANIME')
      .map(r => r.node.id)
    if (ids.length) {
      animeIdsByManga.set(edge.node.id, ids)
      ids.forEach(id => allAnimeIds.add(id))
    }
  }
  if (allAnimeIds.size === 0) return

  // 429（レート上限）を踏んだら少し待って自動リトライ（最大2回・Retry-After 尊重）。
  // グリッドは既に表示済みなので、バッジだけ後追いで埋める best-effort。
  for (let attempt = 0; ; attempt++) {
    try {
      const studioByAnime = await fetchStudiosByAnime([...allAnimeIds])
      if (mySeq !== selectSeq) return
      const badges: Record<number, string[]> = {}
      for (const [mangaId, animeIds] of animeIdsByManga) {
        const counts = new Map<string, number>()
        for (const aid of animeIds) {
          for (const name of studioByAnime.get(aid) ?? []) {
            counts.set(name, (counts.get(name) ?? 0) + 1)
          }
        }
        // 劇場版などで複数社あるとき、最頻＝その作品の主たる制作会社を先頭に
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n)
        if (sorted.length) badges[mangaId] = sorted
      }
      studioBadges.value = badges
      worksNotice.value = '' // 取得できたら待機通知を消す
      return
    } catch (e) {
      if (mySeq !== selectSeq) return
      // 429 なら待ってリトライ（待っている間に別の作者を選んだら中止）
      if (isRateLimited(e) && attempt < STUDIO_RETRY_FALLBACK.length) {
        worksNotice.value =
          'アニメ化（制作会社）情報は AniList のレート上限中です。自動で再取得します…'
        await sleep(retryDelayMs(e, STUDIO_RETRY_FALLBACK[attempt]))
        if (mySeq !== selectSeq) return
        continue
      }
      // リトライ尽き or 429 以外 → バッジ無しで継続（グリッドは保持）
      if (isRateLimited(e)) {
        worksNotice.value =
          'アニメ化（制作会社）情報は AniList のレート上限のため省略しました。少し待って選び直すと表示されます。'
      }
      return
    }
  }
}
</script>
