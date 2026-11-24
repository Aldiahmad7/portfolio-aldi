import type { Comment, SectionId } from '@cursor-crew/shared'
import { useState, type FormEvent } from 'react'
import { useTurnstile } from '../../hooks/use-turnstile'
import { api } from '../../lib/api'
import { loadShared, type ApiFailureCode } from '../../lib/api-client'
import { commentsStore } from '../../lib/comments-store'
import { formValues, invalidFields } from '../../lib/form-values'

export interface CommentTarget {
  section: SectionId
  /** Percent of the section box (docs/interactions.md §7). */
  x: number
  y: number
}

type Status = 'idle' | 'sending' | 'posted' | 'failed'

/** Same flow as the contact form: shared schema → Turnstile → POST → shared comments list. */
export function useCommentForm(target: CommentTarget, onPosted?: (item: Comment) => void) {
  const turnstile = useTurnstile()
  const [status, setStatus] = useState<Status>('idle')
  const [invalid, setInvalid] = useState<ReadonlySet<string>>(new Set())
  const [failure, setFailure] = useState<ApiFailureCode | null>(null)

  const fail = (code: ApiFailureCode, fields: ReadonlySet<string> = new Set()) => {
    setFailure(code)
    setInvalid(fields)
    setStatus('failed')
  }

  function prepare() {
    void loadShared()
    turnstile.prepare()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setStatus('sending')
    setFailure(null)
    const { commentInputSchema } = await loadShared()
    const values = { ...formValues(form), ...target, turnstileToken: 'pending' }
    const checked = commentInputSchema.safeParse(values)
    if (!checked.success) return fail('VALIDATION_ERROR', invalidFields(checked.error.issues))

    const token = await turnstile.getToken()
    if (!token) return fail('TURNSTILE_FAILED')
    const result = await api.postComment({ ...checked.data, turnstileToken: token })
    turnstile.reset()
    if (!result.ok) return fail(result.error.code, new Set(result.error.fields))

    form.reset()
    setInvalid(new Set())
    setStatus('posted')
    commentsStore.add(result.data.item)
    onPosted?.(result.data.item)
  }

  return { status, invalid, failure, turnstile: turnstile.container, prepare, handleSubmit }
}
