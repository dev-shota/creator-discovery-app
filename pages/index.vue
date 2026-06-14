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
          <div class="search-box">
            <div class="search-row">
              <input
                ref="searchInputEl"
                :value="searchQuery"
                type="text"
                class="search-input"
                placeholder="スタッフ名（漢字・かな・ローマ字）　例: 井上雄彦 / いのうえ / inoue"
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
              aria-label="作り手の候補"
            >
              <li v-if="searchLoading" class="candidate-status">検索中…</li>
              <li v-else-if="searchError" class="candidate-status is-error">{{ searchError }}</li>
              <li v-else-if="staffCandidates.length === 0" class="candidate-status">
                該当する作り手が見つかりませんでした。
              </li>
              <template v-else>
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
            </ul>
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

    <!-- Works Section — directly after candidate list -->
    <div v-if="selectedStaff" class="works-section">
      <h2>
        {{ selectedStaff.name.native || selectedStaff.name.full }} の作品
        <span v-if="worksLoading" class="works-loading-indicator">読み込み中...</span>
      </h2>

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
            >Amazon で探す</a>
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
        ※ 当サイトのリンクには Amazon アソシエイト等のアフィリエイトリンクが含まれます。
        リンク経由で商品が購入された場合、当サイトが収益を得ることがあります。
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { toRomaji, toHiragana, toKatakana } from 'wanakana'

// ── Config（R1: エンドポイントは runtimeConfig.public に一本化）─────────────
const config = useRuntimeConfig()
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
const staffCandidates = ref<StaffCandidate[]>([])
const selectedStaff = ref<StaffCandidate | null>(null)
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
// aria-activedescendant 用: ハイライト中候補の DOM id
const activeId = computed(() => {
  const s = staffCandidates.value[activeIndex.value]
  return s ? `cand-${s.id}` : undefined
})
const worksError = ref('')
const worksNotice = ref('') // 非ブロッキングの案内（例: studio がレート上限で省略）
const worksLoading = ref(false)

// Debounce state
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let requestSeq = 0
let suppressNextWatch = false // selectStaff で入力欄を書き換えた時の再検索抑止

// Helpers
function displayTitle(title: WorkEdge['node']['title']) {
  return title.native || title.romaji || title.english || '(タイトル不明)'
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

// 入力欄に戻ってきた時、候補が残っていれば再表示する
function onFocus() {
  if (staffCandidates.value.length > 0 && searchQuery.value.trim().length >= 2) {
    dropdownOpen.value = true
  }
}

// 上下キーでハイライトを循環移動し、画面外なら見える位置へスクロール
function moveActive(delta: number) {
  const n = staffCandidates.value.length
  if (!dropdownOpen.value || n === 0) return
  activeIndex.value = (activeIndex.value + delta + n) % n
  nextTick(() => {
    const s = staffCandidates.value[activeIndex.value]
    if (s) document.getElementById(`cand-${s.id}`)?.scrollIntoView({ block: 'nearest' })
  })
}

// Enter: ハイライト中の候補があれば選択、無ければ検索を実行
function onEnter() {
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
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

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
    // 入力が短い場合は候補をクリアしてドロップダウンを閉じる
    staffCandidates.value = []
    searchError.value = ''
    searchLoading.value = false
    closeDropdown()
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

// 1 表記ぶんの検索。失敗しても [] を返してマージを止めない。
// 429（レート上限）だけは握り潰さず呼び出し側へ伝える。
async function fetchStaff(term: string): Promise<{ staff: StaffCandidate[]; rateLimited: boolean }> {
  try {
    const data = await $fetch<{ data: { Page: { staff: StaffCandidate[] } } }>(ANILIST, {
      method: 'POST',
      body: { query: SEARCH_QUERY, variables: { s: term } }
    })
    return { staff: data.data.Page.staff, rateLimited: false }
  } catch (e) {
    return { staff: [], rateLimited: isRateLimited(e) }
  }
}

async function executeSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
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
}

// 古い選択のレスポンスでバッジ/作品を上書きしないための連番
let selectSeq = 0

// Query 2: Works by selected staff
async function selectStaff(staff: StaffCandidate) {
  // 選んだ名前を入力欄に入れてドロップダウンを閉じる（再検索は抑止）
  suppressNextWatch = true
  searchQuery.value = staff.name.native || staff.name.full
  closeDropdown()
  const mySeq = ++selectSeq
  selectedStaff.value = staff
  filteredWorks.value = []
  studioBadges.value = {}
  expandedStudios.value = new Set()
  worksError.value = ''
  worksNotice.value = ''
  worksLoading.value = true

  const query = `
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
  try {
    const data = await $fetch<{
      data: { Staff: { staffMedia: { edges: WorkEdge[] } } }
    }>(ANILIST, {
      method: 'POST',
      body: { query, variables: { id: staff.id } }
    })
    if (mySeq !== selectSeq) return
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

// ── Studio badges ───────────────────────────────────────────────────────────
// AniList は relations 配下の studios をネスト取得すると 500 を返す（relation
// ノード1つにつき1エラー＝既知の制約）。そこで2フェーズ目として、表示作品の
// ADAPTATION→ANIME の media id を集め、その制作会社を id_in で一括取得する。
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
  } catch (e) {
    if (mySeq !== selectSeq) return
    // studio 取得失敗時はバッジ無しで継続（グリッドは保持）。
    // 429 のときだけ、なぜバッジが出ないかを非ブロッキングで案内する。
    if (isRateLimited(e)) {
      worksNotice.value =
        'アニメ化（制作会社）情報は AniList のレート上限のため省略しました。少し待つと表示されます。'
    }
  }
}
</script>
