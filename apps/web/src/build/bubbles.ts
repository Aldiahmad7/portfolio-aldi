import type { Clock } from './clock'
import { BUBBLE } from './config'
import { dialog } from './crew'
import type { CrewId, DialogKey } from './types'

export interface BubbleDependencies {
  clock: Clock
  now: () => number
  random: () => number
  /** False on mobile: no routine bubbles there (docs/interactions.md, mobile). */
  enabled: boolean
}

export interface Bubbles {
  /**
   * Shows a line above the cursor when the rules allow it (docs/crew.md §3); otherwise nothing.
   * A `reaction` (thrown, greeted, a command) also speaks at 3× and on mobile, and skips the cooldown.
   */
  show: (
    id: CrewId,
    cursor: HTMLElement,
    key: DialogKey,
    signal: AbortSignal,
    reaction?: boolean,
  ) => void
}

const pick = <T>(items: readonly T[], random: () => number) =>
  items[Math.floor(random() * items.length)]

function bubbleOf(cursor: HTMLElement) {
  const existing = cursor.querySelector<HTMLElement>('.build-bubble')
  if (existing) return existing
  const bubble = document.createElement('span')
  bubble.className = 'build-bubble'
  cursor.append(bubble)
  return bubble
}

export function createBubbles({ clock, now, random, enabled }: BubbleDependencies): Bubbles {
  const speaking = new Set<CrewId>()
  const quietUntil = new Map<CrewId, number>()

  function allowed(id: CrewId, reaction: boolean) {
    if (speaking.has(id) || speaking.size >= BUBBLE.maxOnScreen) return false
    if (reaction) return true
    return enabled && clock.speed < BUBBLE.quietSpeed && now() >= (quietUntil.get(id) ?? 0)
  }

  return {
    show(id, cursor, key, signal, reaction = false) {
      const line = pick(dialog[key][id] ?? [], random)
      if (!line || !allowed(id, reaction) || signal.aborted) return
      const bubble = bubbleOf(cursor)
      bubble.textContent = line
      bubble.dataset.visible = 'true'
      speaking.add(id)
      const cooldown =
        BUBBLE.cooldownMinMs + random() * (BUBBLE.cooldownMaxMs - BUBBLE.cooldownMinMs)
      quietUntil.set(id, now() + cooldown)

      const hide = () => {
        delete bubble.dataset.visible
        speaking.delete(id)
      }
      // Lives on the build clock, so it follows speed and pause and disappears when the job ends.
      clock.wait(BUBBLE.showMs, signal).then(hide, hide)
    },
  }
}
