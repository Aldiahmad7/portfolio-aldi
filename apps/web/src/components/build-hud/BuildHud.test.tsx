import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { copy } from '../../app/copy'
import { BuildProvider } from '../../build/build-provider'
import type { Director } from '../../build/director'
import type { BuildState } from '../../build/types'
import { BuildHud } from './BuildHud'

function fakeDirector(initial: Partial<BuildState>) {
  let state: BuildState = { mode: 'on', active: null, progress: 0, speed: 1, ...initial }
  const listeners = new Set<() => void>()
  const director = {
    register: () => () => {},
    start: () => {},
    stop: () => {},
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getState: () => state,
    setSpeed: vi.fn(),
    skip: vi.fn(),
    replay: vi.fn(),
    rewind: () => false,
    finish: () => false,
    crew: () => null,
  } satisfies Director
  const update = (patch: Partial<BuildState>) =>
    act(() => {
      state = { ...state, ...patch }
      listeners.forEach((listener) => listener())
    })
  return { director, update }
}

function renderHud(initial: Partial<BuildState>) {
  const fake = fakeDirector(initial)
  render(
    <BuildProvider director={fake.director}>
      <BuildHud />
    </BuildProvider>,
  )
  return fake
}

describe('BuildHud', () => {
  it('renders nothing when building is off', () => {
    renderHud({ mode: 'off' })
    expect(screen.queryByRole('complementary')).toBeNull()
  })

  it('shows progress and Skip while building', async () => {
    const { director } = renderHud({ active: 'hero', progress: 0.57 })
    expect(screen.getByText(/57%/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(copy.hud.announceStart)
    await userEvent.click(screen.getByRole('button', { name: copy.hud.skip }))
    expect(director.skip).toHaveBeenCalledOnce()
  })

  it('changes speed and marks the active one', async () => {
    const { director } = renderHud({ active: 'hero', speed: 2 })
    expect(screen.getByRole('button', { name: '2×' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: '3×' }))
    expect(director.setSpeed).toHaveBeenCalledWith(3)
  })

  it('collapses after the build and can be opened again for Replay', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { director, update } = renderHud({ active: 'hero' })
    update({ active: null, progress: 1 })
    expect(screen.getByRole('status')).toHaveTextContent(copy.hud.announceDone)
    await act(() => vi.advanceTimersByTimeAsync(2000))
    vi.useRealTimers()
    await userEvent.click(screen.getByRole('button', { name: copy.hud.open }))
    await userEvent.click(screen.getByRole('button', { name: copy.hud.replay }))
    expect(director.replay).toHaveBeenCalledOnce()
  })
})
