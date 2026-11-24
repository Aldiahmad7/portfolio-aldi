import { copy } from '../../app/copy'

export interface Feedback {
  lines: readonly string[]
  /** Unknown input: the closest command, if any. */
  suggestion?: string
}

interface CommandOutputProps {
  feedback: Feedback
  /** Puts a suggested command into the input. */
  onPick: (command: string) => void
}

/** Help text or the "unknown command" answer, announced politely. */
export function CommandOutput({ feedback, onPick }: CommandOutputProps) {
  return (
    <div
      aria-live="polite"
      className="border-t border-border px-4 py-3 font-mono text-xs text-text-secondary"
    >
      <ul className="space-y-1">
        {feedback.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {feedback.suggestion && (
        <p className="mt-2">
          {copy.commandBar.didYouMean}{' '}
          <button
            type="button"
            onClick={() => onPick(feedback.suggestion ?? '')}
            className="text-blue-light underline"
          >
            {feedback.suggestion}
          </button>
          ?
        </p>
      )}
    </div>
  )
}
