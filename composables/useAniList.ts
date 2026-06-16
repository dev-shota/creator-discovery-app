const ANILIST_MIN_GAP_MS = 360
const ANILIST_MAX_CONCURRENT = 2
const ANILIST_MAX_RETRY = 3
const RESPONSE_CACHE_CAP = 120
const responseCache = new Map<string, any>()
const inflight = new Map<string, Promise<any>>()
let activeRequests = 0
let nextSlotAt = 0
let cooldownUntil = 0

export const RATE_LIMIT_MSG =
  'AniList のレート上限に達しました（1分あたりのリクエスト数の上限）。少し待ってから再試行してください。'

export function isRateLimited(e: unknown): boolean {
  const err = e as { statusCode?: number; status?: number; response?: { status?: number } }
  const code = err?.statusCode ?? err?.status ?? err?.response?.status
  return code === 429
}

export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export function retryDelayMs(e: unknown, fallbackMs: number): number {
  const ra = (e as { response?: { headers?: { get?: (k: string) => string | null } } })
    ?.response?.headers?.get?.('retry-after')
  const sec = ra ? parseInt(ra, 10) : NaN
  return Number.isFinite(sec) && sec > 0 ? Math.min(sec * 1000 + 500, 70000) : fallbackMs
}

function cacheKey(query: string, variables: Record<string, unknown> | undefined): string {
  return JSON.stringify({ q: query, v: variables ?? {} })
}

const slotWaiters: (() => void)[] = []

async function acquireSlot(): Promise<void> {
  if (activeRequests >= ANILIST_MAX_CONCURRENT) {
    await new Promise<void>(res => slotWaiters.push(res))
  }
  activeRequests++
  const now = Date.now()
  const start = Math.max(now, cooldownUntil, nextSlotAt)
  nextSlotAt = start + ANILIST_MIN_GAP_MS
  const wait = start - now
  if (wait > 0) await sleep(wait)
}

function releaseSlot(): void {
  activeRequests--
  const next = slotWaiters.shift()
  if (next) next()
}

export function useAniList() {
  const config = useRuntimeConfig()
  const ANILIST = config.public.anilistEndpoint as string

  async function anilist<T = any>(
    query: string,
    variables?: Record<string, unknown>,
    opts: { cache?: boolean } = {}
  ): Promise<T> {
    const useCache = opts.cache !== false
    const key = cacheKey(query, variables)
    if (useCache && responseCache.has(key)) {
      const cached = responseCache.get(key)
      responseCache.delete(key)
      responseCache.set(key, cached)
      return cached as T
    }
    const existing = inflight.get(key)
    if (existing) return existing as Promise<T>

    const run = (async () => {
      for (let attempt = 0; ; attempt++) {
        await acquireSlot()
        try {
          const data = await $fetch<T>(ANILIST, {
            method: 'POST',
            body: { query, variables: variables ?? {} },
            timeout: 15000
          })
          const body = data as any
          const hasErrors = !!(body && Array.isArray(body.errors) && body.errors.length > 0)
          if (hasErrors && body.data == null) {
            throw new Error(`AniList GraphQL error: ${body.errors?.[0]?.message ?? 'unknown'}`)
          }
          if (useCache && !hasErrors) {
            responseCache.set(key, data)
            if (responseCache.size > RESPONSE_CACHE_CAP) {
              const oldest = responseCache.keys().next().value
              if (oldest !== undefined) responseCache.delete(oldest)
            }
          }
          return data
        } catch (e) {
          if (isRateLimited(e) && attempt < ANILIST_MAX_RETRY) {
            const delay = retryDelayMs(e, 1500 * (attempt + 1))
            cooldownUntil = Math.max(cooldownUntil, Date.now() + delay)
            continue
          }
          throw e
        } finally {
          releaseSlot()
        }
      }
    })()
    inflight.set(key, run)
    try {
      return await run
    } finally {
      inflight.delete(key)
    }
  }

  return { anilist }
}
