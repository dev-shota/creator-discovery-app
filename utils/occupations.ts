import type { SearchMode, MediaStaffEdge, AuthorChoice } from '~/types'

export const STAFF_ROLE_FILTER = ['Story & Art', 'Story', 'Original Creator', 'Original Story', 'Art', 'Illustration']

const VOICE_ONLY_OCCUPATIONS = new Set(['Voice Actor', 'Vocalist'])
export function isPureVoice(occ: string[]): boolean {
  return occ.length > 0 && occ.every(o => VOICE_ONLY_OCCUPATIONS.has(o))
}

const CREATOR_OCCUPATIONS = new Set([
  'Director', 'Writer', 'Artist', 'Animator',
  'Character Design', 'Story', 'Original Creator', 'Illustrator',
])

export function occupationScore(occupations: string[]): number {
  if (occupations.includes('Mangaka')) return 0
  if (occupations.some(o => CREATOR_OCCUPATIONS.has(o))) return 1
  return 2
}

const AUTHOR_OCCUPATIONS = new Set([
  'Mangaka', 'Story & Art', 'Story', 'Art', 'Original Creator',
  'Original Story', 'Illustrator', 'Writer', 'Novelist', 'Character Design',
])
function isAuthorPerson(occ: string[]): boolean {
  return occ.some(o => AUTHOR_OCCUPATIONS.has(o))
}
function isDirectorPerson(occ: string[]): boolean {
  return occ.some(o => o === 'Director' || o === 'Chief Director')
}
function isVoicePerson(occ: string[]): boolean {
  return occ.some(o => o === 'Voice Actor')
}

const WRITING_OCCUPATIONS = new Set(['Scriptwriter', 'Writer', 'Series Composition'])
const CHARDESIGN_OCCUPATIONS = new Set(['Character Design', 'Designer', 'Illustrator'])
function isWritingStaff(occ: string[]): boolean {
  return occ.some(o => WRITING_OCCUPATIONS.has(o))
}
function isChardesignStaff(occ: string[]): boolean {
  return occ.some(o => CHARDESIGN_OCCUPATIONS.has(o))
}

const MUSIC_OCCUPATIONS = new Set(['Composer', 'Musician', 'Music Producer', 'Arranger', 'Lyricist', 'Theme Song Performance', 'Singer'])
function isMusicPerson(occ: string[]): boolean {
  return occ.some(o => MUSIC_OCCUPATIONS.has(o)) || occ.length === 0
}

export function matchesSearchMode(occ: string[], mode: SearchMode): boolean {
  if (mode === 'voice') return isVoicePerson(occ)
  if (mode === 'writing') return isWritingStaff(occ)
  if (mode === 'chardesign') return isChardesignStaff(occ)
  if (mode === 'music' || mode === 'theme-singer' || mode === 'theme-lyrics' || mode === 'theme-compose') return isMusicPerson(occ)
  if (mode === 'staff') return isStaffGeneric(occ)
  if (occ.length === 0) return true
  if (mode === 'director') return isDirectorPerson(occ)
  return isAuthorPerson(occ)
}

const SPECIFIC_MODE_OCCUPATIONS = new Set([
  ...AUTHOR_OCCUPATIONS, 'Director', 'Chief Director', 'Voice Actor', 'Vocalist',
  ...WRITING_OCCUPATIONS, ...CHARDESIGN_OCCUPATIONS, ...MUSIC_OCCUPATIONS,
])
function isStaffGeneric(occ: string[]): boolean {
  if (occ.length === 0) return true
  return occ.some(o => !SPECIFIC_MODE_OCCUPATIONS.has(o))
}

export function isDirectorRole(role: string): boolean {
  const r = role.trim()
  if (!r.includes('Director')) return false
  return !/(Animation|Sound|Art|Episode|Assistant|Technical|Unit|Photography|CG|CGI|3D|Action|Mechanical|Editing|Color|Online)/i.test(r)
}

export const AUTHOR_ROLE_MATCHES = [
  'Original Creator', 'Original Story', 'Original Concept', 'Story & Art',
  'Story', 'Art', 'Illustration', 'Character Design',
]

export function authorRoleLabel(role: string, edges: MediaStaffEdge[]): string {
  const r = role.trim()
  if (r.includes('Story & Art')) return '原作・作画'
  if (r.includes('Original Concept')) return '原案'
  if (r.includes('Original Creator') || r.includes('Original Story')) return '原作'
  if (r === 'Story') {
    const hasOriginal = edges.some(e => /Original (Creator|Story)/.test(e.role ?? ''))
    return hasOriginal ? '脚本・構成' : '原作'
  }
  if (r.includes('Character Design')) return 'キャラクター原案'
  if (r.includes('Illustration') || r.includes('Art')) return '作画'
  return r
}

export function collectAuthors(edges: MediaStaffEdge[], roleMatches: string[]): AuthorChoice[] {
  const authors: AuthorChoice[] = []
  const seen = new Set<number>()
  for (const m of roleMatches) {
    for (const e of edges) {
      const r = (e.role ?? '').trim()
      if (r.includes(m) && !seen.has(e.node.id)) {
        seen.add(e.node.id)
        authors.push({ id: e.node.id, name: e.node.name, role: r, label: authorRoleLabel(r, edges), kind: 'author' })
      }
    }
  }
  return authors
}

export function collectAnimeCreators(edges: MediaStaffEdge[]): AuthorChoice[] {
  const out: AuthorChoice[] = []
  const seen = new Set<number>()
  const add = (e: MediaStaffEdge, kind: AuthorChoice['kind'], label: string, roleKey?: AuthorChoice['roleKey']) => {
    if (seen.has(e.node.id)) return
    seen.add(e.node.id)
    out.push({ id: e.node.id, name: e.node.name, role: (e.role ?? '').trim(), label, kind, roleKey })
  }
  for (const e of edges) {
    const r = (e.role ?? '').trim()
    if (/Original (Creator|Story|Concept)/.test(r)) add(e, 'author', authorRoleLabel(r, edges))
  }
  for (const e of edges) {
    if (isDirectorRole((e.role ?? '').trim())) add(e, 'director', '監督')
  }
  for (const e of edges) {
    const r = (e.role ?? '').trim()
    if (/Series Composition/.test(r)) add(e, 'staffrole', 'シリーズ構成', 'writing')
    else if (/Script|Screenplay/.test(r)) add(e, 'staffrole', '脚本', 'writing')
    else if (/Character Design/.test(r)) add(e, 'staffrole', 'キャラクター原案', 'chardesign')
  }
  for (const e of edges) {
    const r = (e.role ?? '').trim()
    if (/Theme Song Performance|Insert Song Performance/.test(r)) add(e, 'staffrole', 'OP/ED歌手', 'theme-singer')
    else if (/Theme Song Lyrics|Insert Song Lyrics/.test(r)) add(e, 'staffrole', '作詞', 'theme-lyrics')
    else if (/Theme Song Composition|Theme Song Arrangement|Insert Song Composition|Insert Song Arrangement|Music Composition|Music Arrangement/.test(r)) add(e, 'staffrole', '作曲・編曲', 'theme-compose')
    else if (/^Music$|^Music\b/.test(r) && !/Director/.test(r)) add(e, 'staffrole', '音楽', 'music')
  }
  return out
}

export function collabRoleJp(role: string): string {
  if (isDirectorRole(role)) return '監督'
  if (/Series Composition/.test(role)) return 'シリーズ構成'
  if (/Script|Screenplay/.test(role)) return '脚本'
  if (/Character Design/.test(role)) return 'キャラ原案'
  if (/Theme Song Performance/.test(role)) return 'OP/ED歌手'
  if (/Theme Song Lyrics/.test(role)) return '作詞'
  if (/Theme Song Composition|Theme Song Arrangement|Insert Song Composition|Insert Song Arrangement|Music Composition|Music Arrangement/.test(role)) return '作曲・編曲'
  if (/^Music$/.test(role) || (/^Music\b/.test(role) && !/Composition|Arrangement|Director/.test(role))) return '音楽'
  if (/Producer/.test(role)) return 'プロデューサー'
  if (/Original Story/.test(role)) return '原案'
  if (/Original/.test(role)) return '原作'
  if (/Chief Animation Director/.test(role)) return '総作画監督'
  if (/Animation Director/.test(role)) return '作画監督'
  if (/Episode Director/.test(role)) return '演出'
  if (/Storyboard/.test(role)) return '絵コンテ'
  if (/Art Director/.test(role)) return '美術監督'
  if (/Background Art|Art Setting|Art Design/.test(role)) return '美術'
  if (/Color Design|Color Setting/.test(role)) return '色彩設計'
  if (/Photography Director|Director of Photography/.test(role)) return '撮影監督'
  if (/Photography/.test(role)) return '撮影'
  if (/Sound Director/.test(role)) return '音響監督'
  if (/Sound Effects/.test(role)) return '音響効果'
  if (/Sound/.test(role)) return '音響'
  if (/Editing|Editor/.test(role)) return '編集'
  if (/CGI Director|3D Director|CG Director/.test(role)) return 'CGI監督'
  if (/CGI|3DCG|3D /.test(role)) return '3DCG'
  if (/Mechanical Design/.test(role)) return 'メカニックデザイン'
  if (/Prop Design/.test(role)) return 'プロップデザイン'
  if (/Production Designer|Production Design/.test(role)) return 'プロダクションデザイン'
  if (/Setting/.test(role)) return '設定'
  if (/Voice/.test(role)) return '声優'
  return role
}

export function pickBestRole(roles: string[]): string {
  const tests: ((r: string) => boolean)[] = [
    r => isDirectorRole(r),
    r => /Series Composition/.test(r),
    r => /Character Design/.test(r),
    r => /Script|Screenplay/.test(r),
    r => /Theme Song Performance/.test(r),
    r => /Theme Song Lyrics/.test(r),
    r => /Theme Song Composition|Theme Song Arrangement/.test(r),
    r => /^Music$|^Music\b/.test(r) && !/Director/.test(r),
    r => /Producer/.test(r),
    r => /Original/.test(r),
    r => /Chief Animation Director/.test(r),
    r => /Animation Director/.test(r),
    r => /Art Director/.test(r),
    r => /Sound Director/.test(r),
    r => /Photography Director|Director of Photography/.test(r),
    r => /CGI Director|3D Director|CG Director/.test(r),
    r => /Storyboard/.test(r),
    r => /Episode Director/.test(r),
    r => /Editing|Editor/.test(r),
    r => /Background Art|Art Setting|Art Design/.test(r),
    r => /Color Design|Color Setting/.test(r),
    r => /Mechanical Design/.test(r),
    r => /Prop Design/.test(r),
    r => /Production Designer|Production Design/.test(r),
    r => /Photography/.test(r),
    r => /Sound Effects|Sound/.test(r),
    r => /CGI|3DCG|3D /.test(r),
  ]
  for (const test of tests) {
    const match = roles.find(test)
    if (match) return collabRoleJp(match)
  }
  return collabRoleJp(roles[0] ?? '')
}
