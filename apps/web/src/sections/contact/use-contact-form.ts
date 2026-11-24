import { useRef, useState, type FormEvent } from 'react'
import { centerOf } from '../../build/actions/geometry'
import { useDirector } from '../../build/build-provider'
import { documentRect } from '../../build/overlay'
import { useTurnstile } from '../../hooks/use-turnstile'
import { api } from '../../lib/api'
import { loadShared, type ApiFailureCode } from '../../lib/api-client'
import { formValues, invalidFields } from '../../lib/form-values'

export type ContactStatus = 'idle' | 'sending' | 'sent' | 'failed'

/**
 * Contact form logic (docs/product-spec.md F12): the same schema as the API validates first, then
 * Turnstile, then POST. Success sends Pixel off with the envelope; failure offers mailto instead.
 */
export function useContactForm() {
  const director = useDirector()
  const turnstile = useTurnstile()
  const submit = useRef<HTMLButtonElement>(null)
  const [status, setStatus] = useState<ContactStatus>('idle')
  const [invalid, setInvalid] = useState<ReadonlySet<string>>(new Set())
  const [failure, setFailure] = useState<ApiFailureCode | null>(null)

  const fail = (code: ApiFailureCode, fields: ReadonlySet<string> = new Set()) => {
    setFailure(code)
    setInvalid(fields)
    setStatus('failed')
  }

  /** First focus: fetch the schemas and Turnstile now, so submitting feels instant. */
  function prepare() {
    void loadShared()
    turnstile.prepare()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setStatus('sending')
    setFailure(null)
    const { contactInputSchema } = await loadShared()
    // The real token is fetched only once the fields are valid.
    const checked = contactInputSchema.safeParse({ ...formValues(form), turnstileToken: 'pending' })
    if (!checked.success) return fail('VALIDATION_ERROR', invalidFields(checked.error.issues))

    const token = await turnstile.getToken()
    if (!token) return fail('TURNSTILE_FAILED')
    const result = await api.sendContact({ ...checked.data, turnstileToken: token })
    turnstile.reset()
    if (!result.ok) return fail(result.error.code, new Set(result.error.fields))

    form.reset()
    setInvalid(new Set())
    setStatus('sent')
    if (submit.current) void director.crew()?.deliver(centerOf(documentRect(submit.current)))
  }

  return { status, invalid, failure, submit, turnstile: turnstile.container, prepare, handleSubmit }
}
