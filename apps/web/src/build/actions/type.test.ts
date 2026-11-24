import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CURSOR, TYPE } from '../config'
import { createTestContext, runForDuration } from './test-context'
import { typeAction, typedLength } from './type'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('typedLength', () => {
  it('types short text completely', () => {
    expect(typedLength('Aldi Ahmad Dani')).toBe(15)
  })

  it('cuts long text at a word boundary', () => {
    const text = 'Fullstack developer who builds playful interfaces'
    expect(typedLength(text)).toBeLessThanOrEqual(TYPE.maxChars)
    expect(text[typedLength(text)]).toBe(' ')
  })
})

describe('type action', () => {
  it('types into a clone, then reveals the target and removes the clone', async () => {
    const { context, layer, reveal } = createTestContext({ text: 'Aldi' })
    const running = typeAction.run(context)
    await vi.advanceTimersByTimeAsync(CURSOR.moveMs + TYPE.charMs)
    expect(layer.querySelector('.build-clone')?.textContent).toBe('Al')
    await vi.advanceTimersByTimeAsync(TYPE.charMs * 3)
    await running
    expect(reveal).toHaveBeenCalledOnce()
    expect(layer.children).toHaveLength(0)
  })

  it('includes the paste in the duration of long text', () => {
    const { context, step } = createTestContext({ text: 'x'.repeat(TYPE.maxChars + 10) })
    expect(typeAction.duration(step, context.target)).toBe(
      CURSOR.moveMs + TYPE.maxChars * TYPE.charMs + TYPE.pasteMs,
    )
  })

  it('with oops, types swapped letters and says so', async () => {
    const { context, layer, say, controller } = createTestContext({ text: 'Aldi', oops: true })
    const running = typeAction.run(context)
    // "Aldi": the typo happens after "Al", typing "id" instead of "di".
    await vi.advanceTimersByTimeAsync(CURSOR.moveMs + TYPE.charMs * 4)
    expect(layer.querySelector('.build-clone')?.textContent).toBe('Alid')
    expect(say).toHaveBeenCalledWith('typo')
    controller.abort()
    await expect(running).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('with oops, backspaces and finishes within its declared duration', async () => {
    const { context, step, reveal } = createTestContext({ text: 'Aldi', oops: true })
    await runForDuration(typeAction, context, { ...step, do: 'type' })
    expect(reveal).toHaveBeenCalledOnce()
  })

  it('stops when aborted without revealing (the job reveals)', async () => {
    const { context, reveal, controller } = createTestContext({ text: 'Aldi Ahmad Dani' })
    const running = typeAction.run(context)
    await vi.advanceTimersByTimeAsync(CURSOR.moveMs)
    controller.abort()
    await expect(running).rejects.toMatchObject({ name: 'AbortError' })
    expect(reveal).not.toHaveBeenCalled()
  })
})
