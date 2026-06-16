const SEEN_KEY = 'cd_seen'

export function useSeen() {
  const seenIds = ref<Set<number>>(new Set())

  function loadSeen() {
    if (!import.meta.client || typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(SEEN_KEY)
      const arr = raw ? JSON.parse(raw) : []
      if (Array.isArray(arr)) seenIds.value = new Set(arr.filter((x: any) => typeof x === 'number'))
    } catch { /* corrupted → start empty */ }
  }

  function toggleSeen(id: number) {
    const next = new Set(seenIds.value)
    next.has(id) ? next.delete(id) : next.add(id)
    seenIds.value = next
    if (!import.meta.client || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(SEEN_KEY, JSON.stringify([...next]))
    } catch { /* quota exceeded → ignore */ }
  }

  return { seenIds, loadSeen, toggleSeen }
}
