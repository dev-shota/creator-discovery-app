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
          <!-- 検索モード切替（作者で探す / 作品名で探す）。作品名→作者の逆引き対応。 -->
          <div class="search-mode" role="tablist" aria-label="検索モード">
            <button
              type="button"
              class="mode-btn"
              role="tab"
              :aria-selected="searchMode === 'creator'"
              :class="{ 'is-active': searchMode === 'creator' }"
              @click="setSearchMode('creator')"
            >作者で探す</button>
            <button
              type="button"
              class="mode-btn"
              role="tab"
              :aria-selected="searchMode === 'title'"
              :class="{ 'is-active': searchMode === 'title' }"
              @click="setSearchMode('title')"
            >作品名で探す</button>
          </div>

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
              :aria-label="searchMode === 'title' ? '作品の候補' : '作り手の候補'"
            >
              <!-- 入力が空でフォーカス中: 最近見た作者を出す（recent セクション） -->
              <template v-if="showRecent">
                <li class="candidate-section-label">最近見た作者</li>
                <li
                  v-for="r in recentStaff"
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

          <!-- 最近見た作者チップ（検索前のヒーロー下。控えめ・非ブロッキング） -->
          <div v-if="!selectedStaff && recentStaff.length > 0" class="recent-chips" aria-label="最近見た作者">
            <span class="recent-chips-label">最近見た作者</span>
            <button
              v-for="r in recentStaff"
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

    <!-- How it works（検索前のオンボーディング＝作り手→作品→スタジオ） -->
    <section v-if="!selectedStaff" class="how" aria-label="使い方">
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
          {{ selectedStaff.name.native || selectedStaff.name.full }} の作品
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

      <div v-if="filteredWorks.length > 0" class="works-grid">
        <div
          v-for="edge in filteredWorks"
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

const STAFF_ROLE_FILTER = ['Story & Art', 'Story', 'Original Creator']

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
  startDate: { year: number | null } | null
  title: { native: string | null; romaji: string | null; english: string | null }
  coverImage: { medium: string | null } | null
}

// localStorage に保存する最近見た作者の最小形
interface RecentStaff {
  id: number
  name: string
}

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
// 検索モード: 作者で探す（既定）/ 作品名で探す（逆引き）
const searchMode = ref<'creator' | 'title'>('creator')
const staffCandidates = ref<StaffCandidate[]>([])
const mediaCandidates = ref<MediaCandidate[]>([])   // 作品名モードの候補
const selectedStaff = ref<StaffCandidate | null>(null)
// 最近見た作者（localStorage `cd_recent`・most-recent-first・id でユニーク・上限8）
const recentStaff = ref<RecentStaff[]>([])
const filteredWorks = ref<WorkEdge[]>([])
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
    : staffCandidates.value[activeIndex.value]
  return item ? `cand-${item.id}` : undefined
})
const worksError = ref('')
const worksNotice = ref('') // 非ブロッキングの案内（例: studio がレート上限で省略）
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
const searchPlaceholder = computed(() =>
  searchMode.value === 'title' ? TITLE_PLACEHOLDER : CREATOR_PLACEHOLDER
)

// 入力が空でフォーカス中、かつ最近見た作者があればドロップダウンに recent を出す
const showRecent = computed(() =>
  dropdownOpen.value && searchQuery.value.trim().length === 0 && recentStaff.value.length > 0
)

// 作品候補の補助タグ（種別・フォーマット・年）。例「アニメ・TV・2013」
const MEDIA_TYPE_MAP: Record<string, string> = { MANGA: '漫画', ANIME: 'アニメ' }
function mediaMeta(media: MediaCandidate): string {
  const parts: string[] = []
  parts.push(MEDIA_TYPE_MAP[media.type] ?? media.type)
  if (media.format && media.format !== media.type) parts.push(media.format)
  if (media.startDate?.year) parts.push(String(media.startDate.year))
  return parts.join('・')
}

// ── 最近見た作者（localStorage・SSR 安全）─────────────────────────────────────
const RECENT_KEY = 'cd_recent'
const RECENT_CAP = 8

// localStorage から読む（client のみ・try/catch で常に安全に [] へフォールバック）
function loadRecent(): RecentStaff[] {
  if (!import.meta.client || typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((x: any) => x && typeof x.id === 'number' && typeof x.name === 'string')
      .slice(0, RECENT_CAP)
  } catch {
    return []
  }
}

// 作者を最近見たリストへ追加（most-recent-first・id で dedup・上限8・永続化）
function saveRecent(id: number, name: string) {
  if (!import.meta.client || typeof window === 'undefined') return
  if (!Number.isFinite(id) || !name) return
  const next = [{ id, name }, ...recentStaff.value.filter(r => r.id !== id)].slice(0, RECENT_CAP)
  recentStaff.value = next
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
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
  if (len === 0 && recentStaff.value.length > 0) {
    dropdownOpen.value = true
    return
  }
  const candCount = searchMode.value === 'title'
    ? mediaCandidates.value.length
    : staffCandidates.value.length
  if (candCount > 0 && len >= 2) {
    dropdownOpen.value = true
  }
}

// 上下キーでハイライトを循環移動し、画面外なら見える位置へスクロール
function moveActive(delta: number) {
  const list: { id: number }[] = searchMode.value === 'title'
    ? mediaCandidates.value
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

onMounted(() => {
  document.addEventListener('click', onDocClick)
  // 最近見た作者を localStorage から復元（client のみ）
  recentStaff.value = loadRecent()
  // 共有 URL（?staff=ID）で直接開かれたら、その作者を読み込む
  const id = parseInt(String(route.query.staff ?? ''), 10)
  if (Number.isFinite(id)) selectStaffById(id)
})
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

// 戻る/進む（または ?staff=ID の変化）に追従する
watch(() => route.query.staff, (val) => {
  const id = parseInt(String(val ?? ''), 10)
  if (Number.isFinite(id)) {
    if (selectedStaff.value?.id !== id) selectStaffById(id)
  } else if (selectedStaff.value) {
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
  if (debounceTimer !== null) clearTimeout(debounceTimer)
  if (newVal.trim().length < 2) {
    // 入力が短い場合は候補をクリア。空なら recent を見せるためドロップダウンは
    // 開いたままにし、それ以外（1文字）は閉じる。
    staffCandidates.value = []
    mediaCandidates.value = []
    searchError.value = ''
    searchLoading.value = false
    if (newVal.trim().length === 0 && recentStaff.value.length > 0) {
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
        id type format startDate { year }
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

async function executeSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  // 作品名モードは別パス（逆引き）。作者モードは下の既存ロジック。
  if (searchMode.value === 'title') {
    await executeTitleSearch(q)
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
  selectedStaff.value = null
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

    // 非・純声優: 職業データがあって全部 Voice Actor / Vocalist だけの人を除外
    const isPureVA = c.primaryOccupations.length > 0 && occupationScore(c.primaryOccupations) === 2

    return isRelevant && !isPureVA
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
  selectedStaff.value = null
  filteredWorks.value = []

  // stale レスポンス対策（作者検索と連番を共有）
  const mySeq = ++requestSeq
  try {
    const data = await $fetch<{ data: { Page: { media: MediaCandidate[] } } }>(ANILIST, {
      method: 'POST',
      body: { query: TITLE_SEARCH_QUERY, variables: { s: q } }
    })
    if (mySeq !== requestSeq) return
    searchLoading.value = false
    activeIndex.value = -1
    mediaCandidates.value = data.data.Page.media ?? []
  } catch (e) {
    if (mySeq !== requestSeq) return
    searchLoading.value = false
    activeIndex.value = -1
    mediaCandidates.value = []
    if (isRateLimited(e)) searchError.value = RATE_LIMIT_MSG
  }

  // analytics: 検索イベント（作品名モードの結果件数）
  $posthog?.capture('search', { query: q, mode: searchMode.value, results: mediaCandidates.value.length })
}

// 検索モードを切り替える。候補・選択をクリアし、入力もリセットする。
function setSearchMode(mode: 'creator' | 'title') {
  if (searchMode.value === mode) return
  searchMode.value = mode
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  staffCandidates.value = []
  mediaCandidates.value = []
  searchError.value = ''
  searchLoading.value = false
  closeDropdown()
  setQuerySilently('')
}

// 古い選択のレスポンスでバッジ/作品を上書きしないための連番
let selectSeq = 0

const WORKS_QUERY = `
  query($id: Int) {
    Staff(id: $id) {
      name { full native }
      staffMedia(type: MANGA, sort: START_DATE, perPage: 50) {
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

// 選択を解除して初期状態へ戻す（URL から ?staff が外れた＝戻る操作 等）
function clearSelection() {
  selectedStaff.value = null
  filteredWorks.value = []
  studioBadges.value = {}
  expandedStudios.value = new Set()
  worksError.value = ''
  worksNotice.value = ''
}

// 作品＋スタジオバッジを読み込む（selectedStaff は呼び出し側で先にセット済み）
async function loadWorks(id: number, mySeq: number) {
  filteredWorks.value = []
  studioBadges.value = {}
  expandedStudios.value = new Set()
  worksError.value = ''
  worksNotice.value = ''
  worksLoading.value = true
  try {
    const data = await $fetch<{
      data: { Staff: { name: { full: string; native: string | null }; staffMedia: { edges: WorkEdge[] } } }
    }>(ANILIST, {
      method: 'POST',
      body: { query: WORKS_QUERY, variables: { id } }
    })
    if (mySeq !== selectSeq) return
    // works クエリも name を返す。?staff=ID 直アクセス（名前未確定）の時に確定させる。
    if (selectedStaff.value?.id === id && data.data.Staff?.name) {
      selectedStaff.value = { ...selectedStaff.value, name: data.data.Staff.name }
    }
    const works = data.data.Staff.staffMedia.edges.filter(edge =>
      STAFF_ROLE_FILTER.some(role => edge.staffRole.includes(role))
    )
    filteredWorks.value = works
    worksLoading.value = false
    // 作品グリッドは即表示し、アニメ化バッジは後追いで差し込む（best-effort）
    await loadStudioBadges(works, mySeq)
  } catch (e) {
    if (mySeq !== selectSeq) return
    worksError.value = isRateLimited(e)
      ? RATE_LIMIT_MSG
      : '作品の取得中にエラーが発生しました。少し待ってから再試行してください。'
    worksLoading.value = false
  }
}

// 候補クリックから選択。共有のため URL に ?staff=ID を載せる（戻る/シェア対応）。
async function selectStaff(staff: StaffCandidate) {
  const name = staff.name.native || staff.name.full
  setQuerySilently(name)
  closeDropdown()
  const mySeq = ++selectSeq
  selectedStaff.value = staff
  if (String(route.query.staff ?? '') !== String(staff.id)) {
    router.push({ query: { staff: String(staff.id) } })
  }
  // 最近見た作者へ保存 ＋ analytics（作者検索由来）
  saveRecent(staff.id, name)
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

// 作者と見なすロール（優先度順）。role 文字列にこのいずれかが含まれる最初の edge を採る。
const AUTHOR_ROLE_PRIORITY = [
  'Story & Art', 'Story', 'Original Creator', 'Original Story', 'Art', 'Original Concept',
]

interface MediaStaffEdge {
  role: string
  node: { id: number; name: { full: string; native: string | null } }
}

// 作品候補をクリック→その作者を解決し、既存の loadWorks パイプラインへ流す
// （?staff=ID push でディープリンク/戻る/スタジオバッジが全部そのまま効く）。
async function selectMediaToAuthor(media: MediaCandidate) {
  closeDropdown()
  searchError.value = ''
  try {
    const data = await $fetch<{ data: { Media: { staff: { edges: MediaStaffEdge[] } } } }>(ANILIST, {
      method: 'POST',
      body: { query: MEDIA_STAFF_QUERY, variables: { id: media.id } }
    })
    const edges = data.data.Media?.staff?.edges ?? []
    if (edges.length === 0) {
      worksNotice.value = 'この作品の作者情報が取得できませんでした。'
      selectedStaff.value = null
      return
    }
    // 優先ロールで最初に当たった作者。無ければ先頭の staff にフォールバック。
    let chosen: MediaStaffEdge | undefined
    for (const role of AUTHOR_ROLE_PRIORITY) {
      chosen = edges.find(e => e.role && e.role.includes(role))
      if (chosen) break
    }
    if (!chosen) chosen = edges[0]
    const authorId = chosen.node.id
    const name = chosen.node.name.native || chosen.node.name.full

    const mySeq = ++selectSeq
    selectedStaff.value = {
      id: authorId,
      name: chosen.node.name,
      primaryOccupations: [],
      favourites: null,
      image: null
    }
    setQuerySilently(name)
    if (String(route.query.staff ?? '') !== String(authorId)) {
      router.push({ query: { staff: String(authorId) } })
    }
    // 最近見た作者へ保存 ＋ analytics（作品名検索由来）
    saveRecent(authorId, name)
    $posthog?.capture('creator_viewed', { staff_id: authorId, staff_name: name, source: 'title_search' })
    await loadWorks(authorId, mySeq)
  } catch (e) {
    if (isRateLimited(e)) {
      worksNotice.value = RATE_LIMIT_MSG
    } else {
      worksNotice.value = '作者の解決中にエラーが発生しました。少し待ってから再試行してください。'
    }
    selectedStaff.value = null
  }
}

// 最近見た作者チップ/行のクリック → selectStaffById(id) で読み込み（名前は確定済み）。
async function selectRecent(r: RecentStaff) {
  setQuerySilently(r.name)
  closeDropdown()
  // analytics（最近見た作者由来）
  $posthog?.capture('creator_viewed', { staff_id: r.id, staff_name: r.name, source: 'recent' })
  saveRecent(r.id, r.name) // クリックで最前面へ並べ替え
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
  closeDropdown()
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
