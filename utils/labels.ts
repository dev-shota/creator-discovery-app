export const GENRE_JP: Record<string, string> = {
  Action: 'アクション', Adventure: '冒険', Comedy: 'コメディ', Drama: 'ドラマ',
  Ecchi: 'エッチ', Fantasy: 'ファンタジー', Horror: 'ホラー', 'Mahou Shoujo': '魔法少女',
  Mecha: 'メカ', Music: '音楽', Mystery: 'ミステリー', Psychological: 'サイコ',
  Romance: 'ロマンス', 'Sci-Fi': 'SF', 'Slice of Life': '日常', Sports: 'スポーツ',
  Supernatural: '超常', Thriller: 'スリラー', Hentai: 'R18',
}
export const genreJp = (g: string) => GENRE_JP[g] ?? g

export const FORMAT_JP: Record<string, string> = {
  TV: 'TV', TV_SHORT: 'TV短編', MOVIE: '劇場', OVA: 'OVA', ONA: 'ONA',
  SPECIAL: '特別編', MUSIC: 'MV', MANGA: '漫画', NOVEL: '小説', ONE_SHOT: '読切',
}
export const formatJp = (f: string | null) => (f ? FORMAT_JP[f] ?? f : '')

export const STATUS_JP: Record<string, string> = {
  FINISHED: '完結', RELEASING: '連載・放送中', NOT_YET_RELEASED: '未放送',
  CANCELLED: '中止', HIATUS: '休止',
}
export const statusJp = (s: string | null) => (s ? STATUS_JP[s] ?? s : '')

export const WORK_ROLE_JP: Record<string, string> = {
  'Story & Art': '原作・作画', Story: '原作/脚本', Art: '作画',
  'Original Creator': '原作', 'Original Story': '原作', Illustration: '作画',
  'Character Design': 'キャラ原案',
}
export const workRoleJp = (r: string) => WORK_ROLE_JP[r] ?? r

export const OCCUPATION_MAP: Record<string, string> = {
  'Mangaka': '漫画家',
  'Voice Actor': '声優',
  'Director': '監督',
  'Writer': '脚本',
  'Animator': 'アニメーター',
}

export const MEDIA_TYPE_MAP: Record<string, string> = { MANGA: '漫画', ANIME: 'アニメ' }

import type { WorkEdge, MediaCandidate, RoleKey } from '~/types'

export function formatChip(node: WorkEdge['node']): string {
  const f = formatJp(node.format)
  if ((node.format === 'TV' || node.format === 'ONA' || node.format === 'TV_SHORT') && node.episodes) {
    return `${f} ${node.episodes}話`
  }
  return f
}

export function mediaMeta(media: MediaCandidate): string {
  const parts: string[] = []
  parts.push(MEDIA_TYPE_MAP[media.type] ?? media.type)
  if (media.format && media.format !== media.type) parts.push(media.format)
  if (media.startDate?.year) parts.push(String(media.startDate.year))
  return parts.join('・')
}

export function displayTitle(title: { native: string | null; romaji: string | null; english: string | null }) {
  return title.native || title.romaji || title.english || '(タイトル不明)'
}

export const RECENT_LABELS: Record<string, string> = {
  creator: '最近見た作者',
  title: '最近見た作品',
  director: '最近見た監督',
  voice: '最近見た声優',
  writing: '最近見た脚本家',
  chardesign: '最近見たキャラ原案',
  music: '最近見た音楽担当',
  'theme-singer': '最近見た歌手',
  'theme-lyrics': '最近見た作詞家',
  'theme-compose': '最近見た作曲・編曲家',
  studio: '最近見た制作会社',
}

export function themeRoleLabel(raw: string, fallback: string): string {
  const m = raw.match(/\(([^)]+)\)/)
  if (!m) {
    if (/^Music Composition$/.test(raw)) return '作曲'
    if (/^Music Arrangement$/.test(raw)) return '編曲'
    return fallback
  }
  const tag = m[1].replace(/\s+/g, '')
  if (/Theme Song Performance|Insert Song Performance/.test(raw)) return `歌手 (${tag})`
  if (/Theme Song Lyrics|Insert Song Lyrics/.test(raw)) return `作詞 (${tag})`
  if (/Theme Song Composition|Insert Song Composition/.test(raw)) return `作曲 (${tag})`
  if (/Theme Song Arrangement|Insert Song Arrangement/.test(raw)) return `編曲 (${tag})`
  return fallback
}

export const STAFF_ROLE_FAMILIES: Record<RoleKey, { label: string; match: RegExp }> = {
  writing: { label: '脚本・構成', match: /Series Composition|Script|Screenplay/ },
  chardesign: { label: 'キャラクター原案', match: /Character Design/ },
  creative: { label: '脚本・原案', match: /Series Composition|Script|Screenplay|Character Design/ },
  music: { label: '音楽', match: /^Music$|^Music\b/ },
  'theme-singer': { label: 'OP/ED歌手', match: /Theme Song Performance|Insert Song Performance/ },
  'theme-lyrics': { label: '作詞', match: /Theme Song Lyrics|Insert Song Lyrics/ },
  'theme-compose': { label: '作曲・編曲', match: /Theme Song Composition|Theme Song Arrangement|Insert Song Composition|Insert Song Arrangement|Music Composition|Music Arrangement/ },
}
