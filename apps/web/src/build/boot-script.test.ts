import { afterEach, describe, expect, it, vi } from 'vitest'
import indexHtml from '../../index.html?raw'
import { REDUCED_MOTION_QUERY, STORAGE_KEYS } from './config'

const bootScript = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)?.[1] ?? ''

function runBootScript(prefersReducedMotion: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: prefersReducedMotion }))
  new Function(bootScript)()
  return document.documentElement.dataset.buildRoot
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.buildRoot
  sessionStorage.clear()
})

describe('index.html boot script', () => {
  it('uses the same keys as build/config.ts', () => {
    expect(bootScript).toContain(STORAGE_KEYS.skipped)
    expect(bootScript).toContain(REDUCED_MOTION_QUERY)
  })

  it('marks the page as pending by default', () => {
    expect(runBootScript(false)).toBe('pending')
  })

  it('does not hide anything for reduced motion', () => {
    expect(runBootScript(true)).toBeUndefined()
  })

  it('does not hide anything after a skip in this visit', () => {
    sessionStorage.setItem(STORAGE_KEYS.skipped, 'true')
    expect(runBootScript(false)).toBeUndefined()
  })
})
