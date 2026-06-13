<template>
  <div style="max-width: 900px; margin: 0 auto; padding: 2rem; font-family: sans-serif;">
    <h1>Creator Discovery</h1>

    <!-- Search Box -->
    <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="スタッフ名（漢字・かな・ローマ字）　例: 井上雄彦 / いのうえ / inoue"
        style="flex: 1; padding: 0.5rem; font-size: 1rem;"
        @keyup.enter="searchStaff"
      />
      <button @click="searchStaff" style="padding: 0.5rem 1rem; font-size: 1rem;">
        検索
      </button>
    </div>

    <!-- Search Error -->
    <p v-if="searchError" style="color: red;">{{ searchError }}</p>

    <!-- Staff Candidate List -->
    <ul v-if="staffCandidates.length > 0" style="list-style: none; padding: 0; margin-bottom: 1.5rem;">
      <li
        v-for="staff in staffCandidates"
        :key="staff.id"
        @click="selectStaff(staff)"
        style="padding: 0.5rem; cursor: pointer; border-bottom: 1px solid #eee;"
        :style="selectedStaff?.id === staff.id ? { background: '#e8f0fe' } : {}"
      >
        {{ staff.name.native || staff.name.full }}
        <span v-if="staff.name.native" style="color: #666; font-size: 0.9rem;">
          ({{ staff.name.full }})
        </span>
        <span
          v-if="staff.primaryOccupations.length > 0"
          style="margin-left: 0.5rem; font-size: 0.75rem; color: #999; background: #f0f0f0; padding: 0.1rem 0.4rem; border-radius: 3px;"
        >
          {{ staff.primaryOccupations.map(o => OCCUPATION_MAP[o] ?? o).join('、') }}
        </span>
      </li>
    </ul>

    <!-- Works Section -->
    <div v-if="selectedStaff">
      <h2>
        {{ selectedStaff.name.native || selectedStaff.name.full }} の作品
        <span v-if="worksLoading" style="font-size: 1rem; font-weight: normal;">読み込み中...</span>
      </h2>

      <p v-if="worksError" style="color: red;">{{ worksError }}</p>

      <div
        v-if="filteredWorks.length > 0"
        style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem;"
      >
        <div
          v-for="edge in filteredWorks"
          :key="edge.node.siteUrl"
          style="border: 1px solid #ddd; border-radius: 6px; overflow: hidden;"
        >
          <a :href="edge.node.siteUrl" target="_blank" rel="noopener">
            <img
              v-if="edge.node.coverImage?.medium"
              :src="edge.node.coverImage.medium"
              :alt="displayTitle(edge.node.title)"
              style="width: 100%; display: block;"
            />
          </a>
          <div style="padding: 0.5rem;">
            <a
              :href="edge.node.siteUrl"
              target="_blank"
              rel="noopener"
              style="font-weight: bold; font-size: 0.9rem; text-decoration: none; color: #333;"
            >
              {{ displayTitle(edge.node.title) }}
            </a>
            <div style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">
              {{ edge.node.startDate?.year ?? '年不明' }}
            </div>
            <div style="font-size: 0.75rem; color: #888; margin-top: 0.15rem;">
              {{ edge.staffRole }}
            </div>
            <!-- TODO: studio バッジ (relationType==ADAPTATION かつ type==ANIME の制作会社) はスコープ外 -->
          </div>
        </div>
      </div>

      <p v-else-if="!worksLoading && !worksError">
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
    title: { native: string | null; romaji: string | null; english: string | null }
    startDate: { year: number | null } | null
    coverImage: { medium: string } | null
    siteUrl: string
  }
}

// State
const searchQuery = ref('')
const staffCandidates = ref<StaffCandidate[]>([])
const selectedStaff = ref<StaffCandidate | null>(null)
const filteredWorks = ref<WorkEdge[]>([])

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

  // 安定ソート: Mangaka→0 / 制作系→1 / それ以外→2
  staffCandidates.value = [...byId.values()]
    .map((s, idx) => ({ s, idx }))
    .sort((a, b) => {
      const diff = occupationScore(a.s.primaryOccupations) - occupationScore(b.s.primaryOccupations)
      return diff !== 0 ? diff : a.idx - b.idx
    })
    .map(({ s }) => s)

  if (staffCandidates.value.length === 0) {
    searchError.value = '候補が見つかりませんでした。'
  }
}

// Query 2: Works by selected staff
async function selectStaff(staff: StaffCandidate) {
  selectedStaff.value = staff
  filteredWorks.value = []
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
  try {
    const data = await $fetch<{
      data: { Staff: { staffMedia: { edges: WorkEdge[] } } }
    }>(ANILIST, {
      method: 'POST',
      body: { query, variables: { id: staff.id } }
    })
    const edges = data.data.Staff.staffMedia.edges
    filteredWorks.value = edges.filter(edge =>
      STAFF_ROLE_FILTER.some(role => edge.staffRole.includes(role))
    )
  } catch (e) {
    worksError.value = '作品の取得中にエラーが発生しました。'
  } finally {
    worksLoading.value = false
  }
}
</script>
