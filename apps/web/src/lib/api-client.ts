import type * as SharedModule from '@cursor-crew/shared'
import type { ErrorCode } from '@cursor-crew/shared'

/** API calls give up after this long (docs/backend-api.md §8). */
const TIMEOUT_MS = 5000

/** `OFFLINE`: no usable answer at all (network down, timeout, proxy error, unexpected body). */
export type ApiFailureCode = ErrorCode | 'OFFLINE'
export interface ApiFailure {
  code: ApiFailureCode
  fields?: readonly string[]
}
export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiFailure }

type Shared = typeof SharedModule
interface Schema<T> {
  safeParse: (data: unknown) => { success: true; data: T } | { success: false }
}

/** The shared schemas (and Zod) load with the first call, keeping them out of the initial bundle. */
export const loadShared = (): Promise<Shared> => import('@cursor-crew/shared')

const OFFLINE: Result<never> = { ok: false, error: { code: 'OFFLINE' } }

/** Fetches `/api/*` and validates the answer. Never throws: the page must work without the API. */
export async function request<T>(
  path: string,
  pickSchema: (shared: Shared) => Schema<T>,
  init: RequestInit = {},
): Promise<Result<T>> {
  try {
    const signal = AbortSignal.timeout(TIMEOUT_MS)
    const [shared, response] = await Promise.all([loadShared(), fetch(path, { ...init, signal })])
    const body: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const failure = shared.apiErrorSchema.safeParse(body)
      if (!failure.success) return OFFLINE
      const { code, fields } = failure.data.error
      return { ok: false, error: { code, ...(fields && { fields }) } }
    }
    const parsed = pickSchema(shared).safeParse(body)
    return parsed.success ? { ok: true, data: parsed.data } : OFFLINE
  } catch {
    return OFFLINE
  }
}

export const postJson = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
