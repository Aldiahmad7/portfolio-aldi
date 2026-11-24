import { vi } from 'vitest'
import { createClock } from '../clock'
import { CURSOR } from '../config'
import { createOverlay } from '../overlay'
import { createFakeAnimate } from '../test-utils'
import type { ActionContext, ActionDefinition, BuildStep, CrewId } from '../types'

interface ContextOptions {
  text?: string
  by?: CrewId
  oops?: boolean
}

/** A real clock on fake WAAPI + fake timers, a recording cursor and a detached layer. */
export function createTestContext({
  text = 'Aldi',
  by = 'kern',
  oops = false,
}: ContextOptions = {}) {
  const fake = createFakeAnimate()
  const clock = createClock({ now: () => Date.now(), animate: fake.animate })
  const controller = new AbortController()
  const layer = document.createElement('div')
  const target = document.createElement('h1')
  target.textContent = text
  target.dataset.build = 'title'
  document.body.append(layer, target)
  const reveal = vi.fn()
  const say = vi.fn()
  const context: ActionContext = {
    by,
    target,
    rect: { x: 10, y: 20, width: 300, height: 40 },
    cursor: {
      moveTo: (_point, ms = CURSOR.moveMs) => clock.wait(ms, controller.signal),
      press: () => clock.wait(CURSOR.pressMs, controller.signal),
      say,
    },
    overlay: createOverlay(layer),
    play: (element, keyframes, ms) => clock.play(element, keyframes, ms, controller.signal),
    wait: (ms) => clock.wait(ms, controller.signal),
    reveal,
    oops,
    signal: controller.signal,
  }
  const step: BuildStep = { by, do: 'type', target: 'title', oops }
  return { context, step, layer, target, reveal, say, controller, calls: fake.calls }
}

/** Runs an action exactly for its declared duration; it must have finished by then. */
export async function runForDuration(
  action: ActionDefinition,
  context: ActionContext,
  step: BuildStep,
) {
  let finished = false
  const running = action.run(context).then(() => (finished = true))
  await vi.advanceTimersByTimeAsync(action.duration(step, context.target))
  await vi.advanceTimersByTimeAsync(0)
  if (!finished) throw new Error('action is still running after its declared duration')
  await running
}
