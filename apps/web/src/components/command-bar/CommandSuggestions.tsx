import { copy } from '../../app/copy'
import type { Command } from './commands'

interface CommandSuggestionsProps {
  id: string
  suggestions: readonly Command[]
  /** Index of the option the combobox points at, -1 for none. */
  active: number
  optionId: (index: number) => string
  onChoose: (index: number) => void
}

/** The listbox half of the command bar combobox. */
export function CommandSuggestions({
  id,
  suggestions,
  active,
  optionId,
  onChoose,
}: CommandSuggestionsProps) {
  return (
    <ul id={id} role="listbox" aria-label={copy.commandBar.suggestions} className="p-2">
      {suggestions.map((command, index) => (
        // Keyboard users move through options from the combobox input (aria-activedescendant).
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        <li
          key={command.name}
          id={optionId(index)}
          role="option"
          aria-selected={index === active}
          onClick={() => onChoose(index)}
          className="flex cursor-pointer justify-between gap-4 rounded-sm px-3 py-2 font-mono text-sm aria-selected:bg-border"
        >
          <span>{command.usage ?? command.name}</span>
          <span className="truncate text-text-secondary">
            {copy.commandBar.commands[command.name]}
          </span>
        </li>
      ))}
    </ul>
  )
}
