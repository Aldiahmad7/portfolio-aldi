import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { copy } from '../../app/copy'
import { useDirector } from '../../build/build-provider'
import { CommandOutput, type Feedback } from './CommandOutput'
import { CommandSuggestions } from './CommandSuggestions'
import { resolveCommand, suggestCommands } from './parse-command'
import { useCommandApi } from './use-command-api'

interface CommandBarProps {
  /** Opens on every increase. */
  openRequests: number
}

/** Combobox in a native <dialog> (focus trap, Esc). Loaded lazily on first open. */
export default function CommandBar({ openRequests }: CommandBarProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const returnTo = useRef<Element | null>(null)
  const returnFocus = useRef(true)
  const director = useDirector()
  const listId = useId()
  const [input, setInput] = useState('')
  const [active, setActive] = useState(-1)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const suggestions = suggestCommands(input)

  /** Clears the bar synchronously, so a quick reopen never shows the previous input. */
  const reset = useCallback(() => {
    setInput('')
    setActive(-1)
    setFeedback(null)
  }, [])
  const close = useCallback(
    (restore: boolean) => {
      returnFocus.current = restore
      reset()
      dialog.current?.close()
    },
    [reset],
  )
  const print = useCallback((lines: readonly string[]) => setFeedback({ lines }), [])
  const api = useCommandApi(close, print)

  useEffect(() => {
    const element = dialog.current
    if (!element || openRequests === 0 || element.open) return
    returnTo.current = document.activeElement
    returnFocus.current = true
    element.showModal()
    field.current?.focus()
  }, [openRequests])

  function handleClose() {
    // `close` fires a task later; if the bar was reopened meanwhile, this event is stale.
    if (dialog.current?.open) return
    if (returnFocus.current && returnTo.current instanceof HTMLElement) returnTo.current.focus()
  }

  function run(text: string) {
    const resolved = resolveCommand(text)
    if (resolved?.command.run(api, resolved.argument)) return
    const closest = suggestCommands(text)[0]
    setFeedback({
      lines: [copy.commandBar.unknown, copy.commandBar.tryHelp],
      ...(closest && { suggestion: closest.usage ?? closest.name }),
    })
    const center = { x: window.scrollX + window.innerWidth / 2, y: window.scrollY }
    void director.crew()?.react('bugsy', center, 'unknownCommand')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const last = suggestions.length - 1
    if (event.key === 'ArrowDown') setActive((index) => (index >= last ? 0 : index + 1))
    else if (event.key === 'ArrowUp') setActive((index) => (index <= 0 ? last : index - 1))
    else return
    event.preventDefault()
  }

  function choose(index: number) {
    const command = suggestions[index]
    if (!command) return run(input)
    // Commands with an argument need it typed: fill in the name and wait.
    if (command.usage) return setInput(`${command.name} `)
    run(command.name)
  }

  const optionId = (index: number) => `${listId}-${index}`
  return (
    <dialog
      ref={dialog}
      aria-label={copy.commandBar.label}
      onCancel={reset}
      onClose={handleClose}
      className="m-auto mt-[15dvh] w-[min(36rem,calc(100vw-2*var(--spacing-gutter)))] rounded-lg border border-border bg-surface p-0 text-text shadow-hud backdrop:bg-backdrop"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          choose(active)
        }}
        className="flex items-center gap-2 border-b border-border px-4"
      >
        <span aria-hidden="true" className="font-mono text-blue-pale">
          /
        </span>
        <input
          ref={field}
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          aria-label={copy.commandBar.label}
          placeholder={copy.commandBar.placeholder}
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            setActive(-1)
            setFeedback(null)
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          className="h-12 min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-text-muted"
        />
        <button
          type="submit"
          className="font-mono text-xs text-text-secondary hover:text-blue-light"
        >
          {copy.commandBar.run}
        </button>
      </form>
      <CommandSuggestions
        id={listId}
        suggestions={suggestions}
        active={active}
        optionId={optionId}
        onChoose={choose}
      />
      {feedback && <CommandOutput feedback={feedback} onPick={setInput} />}
    </dialog>
  )
}
