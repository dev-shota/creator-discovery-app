import type { RecentItem, RecentKind } from '~/types'

const RECENT_KEYS: Record<RecentKind, string> = {
  creator: 'cd_recent_creator',
  title: 'cd_recent_title',
  director: 'cd_recent_director',
  voice: 'cd_recent_voice',
  writing: 'cd_recent_writing',
  chardesign: 'cd_recent_chardesign',
  music: 'cd_recent_music',
  'theme-singer': 'cd_recent_theme_singer',
  'theme-lyrics': 'cd_recent_theme_lyrics',
  'theme-compose': 'cd_recent_theme_compose',
  studio: 'cd_recent_studio',
  staff: 'cd_recent_staff',
}
const RECENT_CAP = 8

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

function emptyRecent(): Record<RecentKind, RecentItem[]> {
  return {
    creator: [], title: [], director: [], voice: [], writing: [], chardesign: [],
    music: [], 'theme-singer': [], 'theme-lyrics': [], 'theme-compose': [], studio: [], staff: []
  }
}

export function useRecent() {
  const recentByKind = ref<Record<RecentKind, RecentItem[]>>(emptyRecent())

  function loadAllRecent() {
    const loaded = emptyRecent()
    for (const kind of Object.keys(loaded) as RecentKind[]) {
      loaded[kind] = loadRecentKind(kind)
    }
    recentByKind.value = loaded

    if (!import.meta.client || typeof window === 'undefined') return
    if (loaded.creator.length > 0) return
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
      window.localStorage.removeItem('cd_recent')
    } catch { /* migration failure is non-fatal */ }
  }

  function saveRecent(kind: RecentKind, id: number, name: string, type?: string) {
    if (!import.meta.client || typeof window === 'undefined') return
    if (!Number.isFinite(id) || !name) return
    const item: RecentItem = type ? { id, name, type } : { id, name }
    const next = [item, ...recentByKind.value[kind].filter(r => r.id !== id)].slice(0, RECENT_CAP)
    recentByKind.value = { ...recentByKind.value, [kind]: next }
    try {
      window.localStorage.setItem(RECENT_KEYS[kind], JSON.stringify(next))
    } catch { /* quota exceeded → ignore */ }
  }

  return { recentByKind, loadAllRecent, saveRecent }
}
