import { COMMANDS } from '../../interactions/config'
import { commands, type Command } from './commands'

const normalize = (input: string) => input.trim().toLowerCase().replace(/\s+/g, ' ')

/** The command typed, with its argument ("speed 2" → speed, "2"), or null. */
export function resolveCommand(input: string): { command: Command; argument: string } | null {
  const text = normalize(input)
  for (const command of commands) {
    if (text === command.name) return { command, argument: '' }
    if (command.usage && text.startsWith(`${command.name} `)) {
      return { command, argument: text.slice(command.name.length + 1) }
    }
  }
  return null
}

/** Prefix matches on the name, best first; everything when the input is empty. No fuzzy matching. */
export function suggestCommands(input: string): Command[] {
  const text = normalize(input)
  const words = text.split(' ')
  const matches = commands.filter(
    (command) =>
      command.name.startsWith(text) ||
      text.startsWith(command.name) ||
      words.every((word) => command.name.split(' ').some((part) => part.startsWith(word))),
  )
  return matches.slice(0, COMMANDS.maxSuggestions)
}
