export interface StaffCandidate {
  id: number
  name: { full: string; native: string | null }
  primaryOccupations: string[]
  favourites: number | null
  image: { medium: string | null } | null
}

export interface MediaCandidate {
  id: number
  type: string
  format: string | null
  popularity: number | null
  startDate: { year: number | null } | null
  title: { native: string | null; romaji: string | null; english: string | null }
  coverImage: { medium: string | null } | null
}

export interface StudioCandidate {
  id: number
  name: string
  favourites: number | null
  isAnimationStudio: boolean
}

export interface RecentItem {
  id: number
  name: string
  type?: string
}

export type RecentKind = 'creator' | 'title' | 'director' | 'voice' | 'writing' | 'chardesign' | 'music' | 'theme-singer' | 'theme-lyrics' | 'theme-compose' | 'studio'

export type SearchMode = 'creator' | 'title' | 'director' | 'voice' | 'writing' | 'chardesign' | 'music' | 'theme-singer' | 'theme-lyrics' | 'theme-compose' | 'studio'

export type SortMode = 'score' | 'pop' | 'new' | 'old' | 'hidden'

export type RoleKey = 'writing' | 'chardesign' | 'creative' | 'music' | 'theme-singer' | 'theme-lyrics' | 'theme-compose'

export type ViewKind = RoleKey | 'creator' | 'director' | 'voice' | 'studio'

export interface WorkTitle {
  native: string | null
  romaji: string | null
  english: string | null
}

export interface WorkEdge {
  staffRole: string
  characters?: { id: number; name: string | null; image: string | null }[]
  node: {
    id: number
    title: WorkTitle
    startDate: { year: number | null } | null
    coverImage: { medium: string } | null
    siteUrl: string
    averageScore: number | null
    popularity: number | null
    genres: string[]
    episodes: number | null
    format: string | null
    status: string | null
    relations: {
      edges: { relationType: string; node: { id: number; type: string } }[]
    }
  }
}

export interface StudioWorkNode {
  id: number
  title: WorkTitle
  startDate: { year: number | null } | null
  coverImage: { medium: string } | null
  siteUrl: string
  averageScore: number | null
  popularity: number | null
  genres: string[]
  episodes: number | null
  format: string | null
  status: string | null
}

export interface WorksController {
  query: string
  vars: Record<string, unknown>
  pick: (data: any) => { items: any[]; hasNextPage: boolean } | null
  transform: (raw: any[]) => WorkEdge[]
  onBatch?: (works: WorkEdge[]) => Promise<void>
  seq: number
}

export interface VoiceEdge {
  characterRole: string
  node: StudioWorkNode
  characters: { id: number; name: { native: string | null; full: string } | null; image: { medium: string | null } | null }[]
}

export interface MediaStaffEdge {
  role: string
  node: { id: number; name: { full: string; native: string | null } }
}

export interface AuthorChoice {
  id: number
  name: { full: string; native: string | null }
  role: string
  label: string
  kind: 'author' | 'director' | 'staffrole'
  roleKey?: 'writing' | 'chardesign' | 'theme-singer' | 'theme-lyrics' | 'theme-compose' | 'music'
}

export interface RecItem {
  id: number
  type: string
  title: WorkTitle
  coverImage: { medium: string | null } | null
  siteUrl: string
  averageScore: number | null
  year: number | null
}

export interface CollabPerson {
  id: number
  name: { full: string; native: string | null }
  occupations: string[]
  image: string | null
  topRole: string
  count: number
}

export interface CollabStudio {
  id: number
  name: string
  count: number
}

export interface StudioNode {
  name: string
  isAnimationStudio: boolean
}

export interface SearchTab {
  mode: SearchMode
  label: string
}

export interface SortTab {
  mode: SortMode
  label: string
}
