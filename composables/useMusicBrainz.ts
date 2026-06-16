const MB_BASE = 'https://musicbrainz.org/ws/2'
const MB_MIN_GAP_MS = 1100
const MB_MAX_RETRY = 2
const MB_UA = 'CreatorDiscovery/1.0 (https://creator-discovery-app.devshota-works.workers.dev/)'

let mbNextSlotAt = 0

async function mbWait() {
  const now = Date.now()
  const start = Math.max(now, mbNextSlotAt)
  mbNextSlotAt = start + MB_MIN_GAP_MS
  const wait = start - now
  if (wait > 0) await new Promise<void>(r => setTimeout(r, wait))
}

async function mbFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, fmt: 'json' }).toString()
  for (let attempt = 0; ; attempt++) {
    await mbWait()
    const res = await fetch(`${MB_BASE}${path}?${qs}`, {
      headers: { 'User-Agent': MB_UA, Accept: 'application/json' },
    })
    if (res.status === 503 && attempt < MB_MAX_RETRY) {
      mbNextSlotAt = Math.max(mbNextSlotAt, Date.now() + 2000)
      continue
    }
    if (!res.ok) throw new Error(`MusicBrainz ${res.status}`)
    return res.json() as Promise<T>
  }
}

export interface MBArtist {
  id: string
  name: string
  'sort-name': string
  disambiguation?: string
  score?: number
  type?: string
  country?: string
  'life-span'?: { begin?: string; end?: string; ended?: boolean }
}

export interface MBReleaseGroup {
  id: string
  title: string
  'primary-type'?: string
  'secondary-types'?: string[]
  'first-release-date'?: string
}

interface MBArtistSearchResult { artists: MBArtist[] }
interface MBReleaseGroupBrowse { 'release-groups': MBReleaseGroup[]; 'release-group-count': number; 'release-group-offset': number }

const artistCache = new Map<string, MBArtist | null>()

export function useMusicBrainz() {
  async function searchArtist(name: string): Promise<MBArtist | null> {
    const key = name.toLowerCase().trim()
    if (artistCache.has(key)) return artistCache.get(key) ?? null

    const data = await mbFetch<MBArtistSearchResult>('/artist', { query: key, limit: '5' })
    const match = data.artists?.find(a => a.score && a.score >= 90) ?? data.artists?.[0] ?? null
    const result = match && match.score && match.score >= 70 ? match : null
    artistCache.set(key, result)
    return result
  }

  async function getReleaseGroups(artistId: string, limit = 100): Promise<MBReleaseGroup[]> {
    const all: MBReleaseGroup[] = []
    let offset = 0
    for (;;) {
      const data = await mbFetch<MBReleaseGroupBrowse>('/release-group', {
        artist: artistId,
        limit: String(Math.min(limit - all.length, 100)),
        offset: String(offset),
      })
      const rgs = data['release-groups'] ?? []
      all.push(...rgs)
      if (all.length >= data['release-group-count'] || rgs.length === 0 || all.length >= limit) break
      offset += rgs.length
    }
    return all
  }

  return { searchArtist, getReleaseGroups }
}
