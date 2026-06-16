import { toHiragana, toKatakana } from 'wanakana'

export const STUDIO_ALIASES: Record<string, string> = {
  'きょうとあにめーしょん': 'kyoto', 'きょうあに': 'kyoto', 'きょうと': 'kyoto',
  '京都アニメーション': 'kyoto', '京アニ': 'kyoto', '京都': 'kyoto',
  'じぶり': 'ghibli', 'すたじおじぶり': 'ghibli',
  'とうえい': 'toei', 'とうえいあにめーしょん': 'toei', '東映': 'toei', '東映アニメーション': 'toei',
  'さんらいず': 'sunrise',
  'ぼんず': 'bones',
  'ゆーふぉーてーぶる': 'ufotable', 'ゆーふぉてーぶる': 'ufotable',
  'まっぱ': 'mappa',
  'まっどはうす': 'madhouse',
  'うぃっと': 'wit studio', 'うぃっとすたじお': 'wit studio',
  'しゃふと': 'shaft',
  'とりがー': 'trigger',
  'ぷろだくしょんあいじー': 'production i.g', 'ぷろだくしょんあいじ': 'production i.g', 'あいじー': 'production i.g',
  'くろーばーわーくす': 'cloverworks',
  'ぴえろ': 'pierrot', 'すたじおぴえろ': 'pierrot',
  'がいなっくす': 'gainax',
  'じぇーしーすたっふ': 'j.c.staff', 'じぇいしーすたっふ': 'j.c.staff',
  'ぴーえーわーくす': 'p.a.', 'ぴーえー': 'p.a.',
  'どうがこうぼう': 'doga', '動画工房': 'doga',
  'えーわん': 'a-1', 'えーわんぴくちゃーず': 'a-1',
  'すたじおでぃーん': 'deen', 'でぃーん': 'deen',
  'ごんぞ': 'gonzo',
  'たつのこ': 'tatsunoko', 'たつのこぷろ': 'tatsunoko',
  'らいでんふぃるむ': 'lidenfilms', 'らいでんふぃるむす': 'lidenfilms',
  'でいびっどぷろだくしょん': 'david', 'でいびっど': 'david',
  'おれんじ': 'orange',
  'さいえんすさる': 'science saru',
}

export function resolveStudioTerm(q: string): { term: string; viaAlias: boolean } {
  const raw = q.trim()
  const alias = STUDIO_ALIASES[raw] ?? STUDIO_ALIASES[toHiragana(raw)] ?? STUDIO_ALIASES[toKatakana(raw)]
  if (alias) return { term: alias, viaAlias: true }
  return { term: raw, viaAlias: false }
}
