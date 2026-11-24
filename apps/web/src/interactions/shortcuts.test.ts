import { describe, expect, it } from 'vitest'
import { matchShortcut } from './shortcuts'
import { isTypingContext } from './typing-context'

function press(key: string, init: KeyboardEventInit = {}, target: Element = document.body) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, ...init })
  Object.defineProperty(event, 'target', { value: target })
  return matchShortcut(event)
}

describe('matchShortcut', () => {
  it('maps the table', () => {
    expect(press('/')).toBe('commandBar')
    expect(press('k', { ctrlKey: true })).toBe('commandBar')
    expect(press('k', { metaKey: true })).toBe('commandBar')
    expect(press('z', { ctrlKey: true })).toBe('undo')
    expect(press('Z', { ctrlKey: true, shiftKey: true })).toBe('redo')
    expect(press('y', { ctrlKey: true })).toBe('redo')
    expect(press('c')).toBe('comments')
  })

  it('ignores other keys and modifiers', () => {
    expect(press('k')).toBeNull()
    // Ctrl+C stays copy.
    expect(press('c', { ctrlKey: true })).toBeNull()
    expect(press('/', { ctrlKey: true })).toBeNull()
    expect(press('z', { ctrlKey: true, altKey: true })).toBeNull()
  })

  it.each([
    '<input />',
    '<textarea></textarea>',
    '<select></select>',
    '<div contenteditable="true"></div>',
  ])('does nothing while typing in %s', (html) => {
    const host = document.createElement('div')
    host.innerHTML = html
    const field = host.firstElementChild
    if (!field) throw new Error('no field')
    expect(press('/', {}, field)).toBeNull()
    expect(press('z', { ctrlKey: true }, field)).toBeNull()
  })
})

describe('isTypingContext', () => {
  it('is false for plain content and buttons', () => {
    const button = document.createElement('button')
    expect(isTypingContext(button)).toBe(false)
    expect(isTypingContext(null)).toBe(false)
  })
})
