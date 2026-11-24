import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { copy } from '../../app/copy'
import { BuildProvider } from '../../build/build-provider'
import { STORAGE_KEYS } from '../../build/config'
import { InteractionsProvider } from '../../interactions/InteractionsProvider'

function renderApp() {
  render(
    <BuildProvider>
      <InteractionsProvider>
        <button type="button">trigger</button>
        <input aria-label="name" />
      </InteractionsProvider>
    </BuildProvider>,
  )
}

const press = (key: string, init: KeyboardEventInit = {}, target: Element = document.body) =>
  fireEvent.keyDown(target, { key, ...init })

async function openWithSlash() {
  press('/')
  return screen.findByRole('combobox')
}

const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } })
const submit = (input: HTMLElement) => fireEvent.submit(input.closest('form') ?? input)

afterEach(() => localStorage.clear())

describe('command bar', () => {
  it('opens with / and with Ctrl+K', async () => {
    renderApp()
    expect(await openWithSlash()).toHaveFocus()
    act(() => document.querySelector('dialog')?.close())
    press('k', { ctrlKey: true })
    expect(document.querySelector('dialog')).toHaveAttribute('open')
  })

  it('does not open while the visitor types in a field', async () => {
    renderApp()
    press('/', {}, screen.getByLabelText('name'))
    await act(async () => {})
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('suggests commands by prefix', async () => {
    renderApp()
    type(await openWithSlash(), 'c')
    const options = screen.getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual([
      expect.stringContaining('crew dance'),
      expect.stringContaining('coffee break'),
    ])
  })

  it('answers an unknown command with a hint instead of an error', async () => {
    renderApp()
    const input = await openWithSlash()
    type(input, 'dace')
    submit(input)
    expect(screen.getByText(copy.commandBar.unknown)).toBeInTheDocument()
    expect(screen.getByText(copy.commandBar.tryHelp)).toBeInTheDocument()
  })

  it('prints help', async () => {
    renderApp()
    const input = await openWithSlash()
    type(input, 'help')
    submit(input)
    expect(screen.getByText(/^crew dance —/)).toBeInTheDocument()
  })

  it('runs speed with its argument and closes', async () => {
    renderApp()
    const input = await openWithSlash()
    type(input, 'speed 2')
    submit(input)
    expect(localStorage.getItem(STORAGE_KEYS.speed)).toBe('2')
    expect(document.querySelector('dialog')).not.toHaveAttribute('open')
  })

  it('returns focus to where it was when closed', async () => {
    renderApp()
    const trigger = screen.getByRole('button', { name: 'trigger' })
    trigger.focus()
    press('k', { ctrlKey: true }, trigger)
    await screen.findByRole('combobox')
    act(() => document.querySelector('dialog')?.close())
    expect(trigger).toHaveFocus()
  })
})
