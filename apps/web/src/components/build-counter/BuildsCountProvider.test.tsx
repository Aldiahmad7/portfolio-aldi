import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { BuildProvider } from '../../build/build-provider'
import { STORAGE_KEYS } from '../../build/config'
import type { Director } from '../../build/director'
import type { BuildState } from '../../build/types'
import { BuildsCount } from './BuildsCount'
import { BuildsCountProvider } from './BuildsCountProvider'

function fakeDirector(initial: BuildState) {
  let state = initial
  const listeners = new Set<() => void>()
  const director = {
    start() {},
    stop() {},
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  } as unknown as Director
  const set = (patch: Partial<BuildState>) => {
    state = { ...state, ...patch }
    listeners.forEach((listener) => listener())
  }
  return { director, set }
}

const building: BuildState = { mode: 'on', active: null, progress: 0, speed: 1 }

function renderCounter(director: Director) {
  return render(
    <BuildProvider director={director}>
      <BuildsCountProvider>
        <BuildsCount />
      </BuildsCountProvider>
    </BuildProvider>,
  )
}

let fetch: MockInstance<typeof globalThis.fetch>
beforeEach(() => {
  sessionStorage.clear()
  fetch = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () => new Response(JSON.stringify({ count: 42 })))
})
afterEach(() => vi.restoreAllMocks())

describe('builds counter', () => {
  it('counts once, when the first build job ends', async () => {
    const { director, set } = fakeDirector(building)
    renderCounter(director)
    await act(async () => set({ active: 'hero' }))
    expect(fetch).not.toHaveBeenCalled()
    await act(async () => set({ active: null }))
    expect(await screen.findByText('Built 42 times')).toBeInTheDocument()
    await act(async () => set({ active: 'about' }))
    await act(async () => set({ active: null }))
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' })
    expect(sessionStorage.getItem(STORAGE_KEYS.counted)).toBe('true')
  })

  it('counts right away when building is off, and only reads after that', async () => {
    const { director } = fakeDirector({ ...building, mode: 'off' })
    const first = renderCounter(director)
    await screen.findByText('Built 42 times')
    first.unmount()
    renderCounter(director)
    await screen.findByText('Built 42 times')
    expect(fetch.mock.calls.map((call) => call[1]?.method ?? 'GET')).toEqual(['POST', 'GET'])
  })

  it('stays hidden when the API is down', async () => {
    fetch.mockRejectedValue(new TypeError('offline'))
    const { director } = fakeDirector({ ...building, mode: 'skipped' })
    const { container } = renderCounter(director)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
    expect(container).toBeEmptyDOMElement()
  })
})
