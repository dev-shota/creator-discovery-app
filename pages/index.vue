<template>
  <div style="max-width: 900px; margin: 0 auto; padding: 2rem; font-family: sans-serif;">
    <h1>Creator Discovery</h1>

    <!-- Search Box -->
    <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="スタッフ名を入力（例: 井上雄彦）"
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
const ANILIST = 'https://graphql.anilist.co'

const STAFF_ROLE_FILTER = ['Story & Art', 'Story', 'Original Creator']

interface StaffCandidate {
  id: number
  name: { full: string; native: string | null }
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

// Helpers
function displayTitle(title: WorkEdge['node']['title']) {
  return title.native || title.romaji || title.english || '(タイトル不明)'
}

// Query 1: Staff search
async function searchStaff() {
  if (!searchQuery.value.trim()) return
  searchError.value = ''
  staffCandidates.value = []
  selectedStaff.value = null
  filteredWorks.value = []

  const query = `
    query($s: String) {
      Page(perPage: 10) {
        staff(search: $s) {
          id
          name { full native }
        }
      }
    }
  `
  try {
    const data = await $fetch<{ data: { Page: { staff: StaffCandidate[] } } }>(ANILIST, {
      method: 'POST',
      body: { query, variables: { s: searchQuery.value.trim() } }
    })
    staffCandidates.value = data.data.Page.staff
    if (staffCandidates.value.length === 0) {
      searchError.value = '候補が見つかりませんでした。'
    }
  } catch (e) {
    searchError.value = '検索中にエラーが発生しました。'
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
