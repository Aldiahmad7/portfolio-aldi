import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const CONTROL =
  'w-full rounded-sm border border-border bg-surface px-3 py-2 text-text focus:border-blue-light aria-invalid:border-2 aria-invalid:border-blue-pale'

type ControlProps =
  | ({ multiline?: false } & InputHTMLAttributes<HTMLInputElement>)
  | ({ multiline: true } & TextareaHTMLAttributes<HTMLTextAreaElement>)

type FieldProps = ControlProps & {
  label: string
  name: string
  /** Shown under the control and linked with aria-describedby when set. */
  error?: string | undefined
}

/**
 * Labelled input or textarea. Errors use an icon, text and a thicker border, not red: red belongs
 * to the crew member Red (docs/open-questions.md OQ-09).
 */
export function Field({ label, error, ...control }: FieldProps) {
  const errorId = useId()
  const describedBy = error ? { 'aria-describedby': errorId, 'aria-invalid': true } : {}
  return (
    // The error sits outside <label>, so it is read as a description, not as part of the name.
    <div className="space-y-2">
      <label className="block space-y-2">
        <span className="font-mono text-xs text-text-secondary">{label}</span>
        {control.multiline ? (
          <textarea {...withoutMultiline(control)} {...describedBy} className={CONTROL} />
        ) : (
          <input {...withoutMultiline(control)} {...describedBy} className={CONTROL} />
        )}
      </label>
      {error && (
        <p id={errorId} className="flex items-start gap-2 text-sm text-blue-pale">
          <span aria-hidden="true" className="font-mono">
            !
          </span>
          {error}
        </p>
      )}
    </div>
  )
}

function withoutMultiline<Props extends { multiline?: boolean }>(props: Props) {
  const { multiline, ...rest } = props
  return rest
}
