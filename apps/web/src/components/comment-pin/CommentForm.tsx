import type { Comment } from '@cursor-crew/shared'
import { LIMITS } from '@cursor-crew/shared/limits'
import { copy } from '../../app/copy'
import { buttonClass } from '../ui/button'
import { Field } from '../ui/Field'
import { useCommentForm, type CommentTarget } from './use-comment-form'

interface CommentFormProps {
  target: CommentTarget
  onPosted?: (item: Comment) => void
  onCancel?: () => void
  /** Pin popovers focus the name field right away; the Guestbook form does not. */
  focusOnOpen?: boolean
}

const { commentName, commentMessage } = LIMITS

/** Name + comment form, used in the Guestbook and in the popover of a new pin. */
export function CommentForm({ target, onPosted, onCancel, focusOnOpen = false }: CommentFormProps) {
  const { status, invalid, failure, turnstile, prepare, handleSubmit } = useCommentForm(
    target,
    onPosted,
  )
  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      onFocus={prepare}
      noValidate
      className="space-y-4"
    >
      <Field
        label={copy.comments.nameLabel}
        name="name"
        autoComplete="nickname"
        required
        maxLength={commentName.max}
        // Opening a pin popover is an explicit request to write, so moving focus is expected.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={focusOnOpen}
        error={invalid.has('name') ? copy.comments.fieldErrors.name : undefined}
      />
      <Field
        multiline
        label={copy.comments.messageLabel}
        name="message"
        required
        maxLength={commentMessage.max}
        rows={3}
        error={invalid.has('message') ? copy.comments.fieldErrors.message : undefined}
      />
      <div ref={turnstile} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === 'sending'}
          className={`${buttonClass('primary')} disabled:opacity-60`}
        >
          {status === 'sending' ? copy.comments.sending : copy.comments.submit}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={buttonClass('ghost')}>
            {copy.comments.cancel}
          </button>
        )}
      </div>
      <p role="status" className="text-sm text-text-secondary">
        {status === 'posted' && copy.comments.posted}
        {status === 'failed' && failure && copy.apiErrors[failure]}
      </p>
    </form>
  )
}
