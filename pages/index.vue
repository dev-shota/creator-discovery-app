<template>
  <div class="page-container">
    <h1>Creator Discovery</h1>

    <!-- Search Box -->
    <div class="search-row">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="スタッフ名（漢字・かな・ローマ字）　例: 井上雄彦 / いのうえ / inoue"
        @keyup.enter="searchStaff"
      />
      <button class="search-btn" @click="searchStaff">検索</button>
    </div>

    <!-- Search Error -->
    <p v-if="searchError" class="status-error">{{ searchError }}</p>

    <!-- Staff Candidate List — max-height scroll so works section is always visible -->
    <ul v-if="staffCandidates.length > 0" class="candidate-list">
      <li
        v-for="staff in staffCandidates"
        :key="staff.id"
        class="candidate-item"
        :class="{ 'is-selected': selectedStaff?.id === staff.id }"
        @click="selectStaff(staff)"
      >
        <span class="candidate-name-native">{{ staff.name.native || staff.name.full }}</span>
        <span v-if="staff.name.native" class="candidate-name-full">
          ({{ staff.name.full }})
        </span>
        <span v-if="staff.primaryOccupations.length > 0" class="occupation-tag">
          {{ staff.primaryOccupations.map(o => OCCUPATION_MAP[o] ?? o).join('、') }}
        </span>
      </li>
    </ul>

    <!-- Works Section — directly after candidate list -->
    <div v-if="selectedStaff" class="works-section">
      <h2>
        {{ selectedStaff.name.native || selectedStaff.name.full }} の作品
        <span v-if="worksLoading" class="works-loading-indicator">読み込み中...</span>
      </h2>

      <p v-if="worksError" class="status-error">{{ worksError }}</p>

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
          </div>
        </div>
      </div>

      <p v-else-if="!worksLoading && !worksError" class="status-empty">
        表示対象の作品が見つかりませんでした（staffRole フィルタ適用済み）。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRomaji, toHiragana, toKatakana } from 'wanakana'

const ANILIST = 'https://graphql.anilist.co'

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
const worksError = ref('')
const worksLoading = ref(false)

// Debounce state
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let requestSeq = 0

// Helpers
function displayTitle(title: WorkEdge['node']['title']) {
  return title.native || title.romaji || title.english || '(タイトル不明)'
}

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
  if (debounceTimer !== null) clearTimeout(debounceTimer)
  if (newVal.trim().length < 2) {
    // 入力が短い場合は候補をクリアして終了
    staffCandidates.value = []
    searchError.value = ''
    return
  }
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
      }
    }
  }
`

// 1 表記ぶんの検索。失敗しても [] を返してマージを止めない。
async function fetchStaff(term: string): Promise<StaffCandidate[]> {
  try {
    const data = await $fetch<{ data: { Page: { staff: StaffCandidate[] } } }>(ANILIST, {
      method: 'POST',
      body: { query: SEARCH_QUERY, variables: { s: term } }
    })
    return data.data.Page.staff
  } catch {
    return []
  }
}

async function executeSearch() {
  const q = searchQuery.value.trim()
  if (!q) return

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

  // id で重複排除して統合
  const byId = new Map<number, StaffCandidate>()
  for (const batch of batches) {
    for (const s of batch) if (!byId.has(s.id)) byId.set(s.id, s)
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

  // 安定ソート: 第1=occupationScore 昇順、第2=relevanceRank 昇順、第3=元 index
  withRank.sort((a, b) => {
    const occDiff = occupationScore(a.c.primaryOccupations) - occupationScore(b.c.primaryOccupations)
    if (occDiff !== 0) return occDiff
    const relDiff = a.relevanceRank - b.relevanceRank
    if (relDiff !== 0) return relDiff
    return a.idx - b.idx
  })

  staffCandidates.value = withRank.map(({ c }) => c)
  // ──────────────────────────────────────────────────────────────────────────

  if (staffCandidates.value.length === 0) {
    searchError.value = '候補が見つかりませんでした。'
  }
}

// 古い選択のレスポンスでバッジ/作品を上書きしないための連番
let selectSeq = 0

// Query 2: Works by selected staff
async function selectStaff(staff: StaffCandidate) {
  const mySeq = ++selectSeq
  selectedStaff.value = staff
  filteredWorks.value = []
  studioBadges.value = {}
  expandedStudios.value = new Set()
  worksError.value = ''
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
    worksError.value = '作品の取得中にエラーが発生しました。'
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
  } catch {
    // studio 取得失敗時はバッジ無しで継続（グリッドは保持）
  }
}
</script>
