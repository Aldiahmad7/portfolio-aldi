import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { renderPage } from './prerender'

describe('prerender', () => {
  it('produces HTML that hydrates without mismatches', async () => {
    const { head, html } = renderPage('2026-11-24')
    expect(head).toContain('<title>')

    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    const onRecoverableError = vi.fn()

    await act(async () => {
      hydrateRoot(container, <App />, { onRecoverableError })
    })

    expect(onRecoverableError).not.toHaveBeenCalled()
    container.remove()
  })
})
