// The Zod-free entry: limits only, so the form does not pull Zod into the initial bundle.
import { LIMITS } from '@cursor-crew/shared/limits'
import { copy } from '../../app/copy'
import { buttonClass } from '../../components/ui/button'
import { Field } from '../../components/ui/Field'
import { profile } from '../../content/profile'
import { useContactForm } from './use-contact-form'

const { contactName, contactMessage } = LIMITS
const errorFor = (invalid: ReadonlySet<string>, field: keyof typeof copy.contact.fieldErrors) =>
  invalid.has(field) ? copy.contact.fieldErrors[field] : undefined

export function ContactForm() {
  const { status, invalid, failure, submit, turnstile, prepare, handleSubmit } = useContactForm()
  return (
    <form
      data-build="contact-form"
      onSubmit={(event) => void handleSubmit(event)}
      onFocus={prepare}
      noValidate
      className="space-y-5"
    >
      <Field
        label={copy.contact.nameLabel}
        name="name"
        autoComplete="name"
        required
        maxLength={contactName.max}
        error={errorFor(invalid, 'name')}
      />
      <Field
        label={copy.contact.emailLabel}
        name="email"
        type="email"
        autoComplete="email"
        required
        error={errorFor(invalid, 'email')}
      />
      <Field
        multiline
        label={copy.contact.messageLabel}
        name="message"
        required
        minLength={contactMessage.min}
        maxLength={contactMessage.max}
        rows={5}
        error={errorFor(invalid, 'message')}
      />
      <div ref={turnstile} />
      <button
        ref={submit}
        type="submit"
        data-build="contact-submit"
        disabled={status === 'sending'}
        className={`${buttonClass('primary')} disabled:opacity-60`}
      >
        {status === 'sending' ? copy.contact.sending : copy.contact.submit}
      </button>
      <div role="status" className="text-sm">
        {status === 'sent' && <p className="text-blue-pale">{copy.contact.sent}</p>}
        {status === 'failed' && failure && (
          <p className="text-text-secondary">
            {copy.apiErrors[failure]}{' '}
            {failure !== 'VALIDATION_ERROR' && (
              <>
                {copy.contact.fallback}{' '}
                <a
                  href={`mailto:${profile.email}`}
                  className="text-blue-light underline underline-offset-2 hover:text-blue-pale"
                >
                  {profile.email}
                </a>
              </>
            )}
          </p>
        )}
      </div>
    </form>
  )
}
