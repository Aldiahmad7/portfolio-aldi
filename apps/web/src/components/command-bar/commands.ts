import { copy } from '../../app/copy'
import { SPEEDS } from '../../build/config'
import type { Director } from '../../build/director'
import { COMMANDS } from '../../interactions/config'

/** The narrow surface commands may use (docs/interactions.md §6). */
export interface CommandApi {
  director: Director
  scrollTo: (sectionId: string) => void
  /** Swaps the accent token for `ms`, then puts it back. Resolves when it is back. */
  setAccent: (value: string, ms: number) => Promise<void>
  /** Shows lines of output inside the bar (help). */
  print: (lines: readonly string[]) => void
  close: () => void
}

export type CommandName = keyof typeof copy.commandBar.commands

export interface Command {
  name: CommandName
  /** How it is typed when it takes an argument, e.g. "speed <1|2|3>". */
  usage?: string
  /** Runs it; returns false when the argument is invalid (shown as an unknown command). */
  run: (api: CommandApi, argument: string) => boolean
}

const RED = 'var(--color-red)'

/** Where crew reactions to commands happen: the middle of the visible page, in document coordinates. */
const screenCenter = () => ({
  x: window.scrollX + window.innerWidth / 2,
  y: window.scrollY + window.innerHeight / 2,
})

const always = (effect: (api: CommandApi) => void) => (api: CommandApi) => {
  effect(api)
  return true
}

/** The command list is data; the bar only matches and runs it. */
export const commands: readonly Command[] = [
  {
    name: 'help',
    run: always((api) =>
      api.print(
        commands.map(
          (command) =>
            `${command.usage ?? command.name} — ${copy.commandBar.commands[command.name]}`,
        ),
      ),
    ),
  },
  { name: 'crew dance', run: always((api) => (api.close(), api.director.crew()?.dance())) },
  {
    name: 'make it red',
    run: always((api) => {
      api.close()
      const crew = api.director.crew()
      void crew?.react('red', screenCenter(), 'red')
      void api
        .setAccent(RED, COMMANDS.redMs)
        .then(() => crew?.react('pixel', screenCenter(), 'notRed'))
    }),
  },
  { name: 'coffee break', run: always((api) => (api.close(), api.director.crew()?.coffeeBreak())) },
  {
    name: 'hire me',
    run: always((api) => api.scrollTo('contact')),
  },
  { name: 'skip', run: always((api) => (api.close(), api.director.skip())) },
  { name: 'replay', run: always((api) => (api.close(), api.director.replay())) },
  {
    name: 'speed',
    usage: 'speed <1|2|3>',
    run(api, argument) {
      const speed = SPEEDS.find((option) => String(option) === argument)
      if (!speed) return false
      api.director.setSpeed(speed)
      api.close()
      return true
    },
  },
]
