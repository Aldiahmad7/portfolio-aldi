import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { copy } from '../../app/copy'
import { Navbar } from './Navbar'

describe('Navbar', () => {
  it('links every section and the contact action', () => {
    render(<Navbar />)
    const nav = screen.getByRole('navigation', { name: copy.nav.label })
    for (const [id, label] of Object.entries(copy.nav.sections)) {
      expect(within(nav).getAllByRole('link', { name: label })[0]).toHaveAttribute('href', `#${id}`)
    }
    expect(within(nav).getByRole('link', { name: copy.nav.hire })).toHaveAttribute(
      'href',
      '#contact',
    )
  })

  it('names the file after the first name', () => {
    expect(copy.nav.fileName('Aldi Ahmad Dani')).toBe('aldi.portfolio')
  })

  it('opens the menu, closes it with Esc and returns focus to the toggle', async () => {
    const user = userEvent.setup()
    const windowKeys = vi.fn()
    window.addEventListener('keydown', windowKeys)
    render(<Navbar />)
    const toggle = screen.getByRole('button', { name: copy.nav.menu })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById('nav-menu')).toBeVisible()

    await user.keyboard('{Escape}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
    // Global shortcuts (comment mode, command bar) never see the menu's Esc.
    expect(windowKeys).not.toHaveBeenCalled()
    window.removeEventListener('keydown', windowKeys)
  })

  it('closes the menu when a link is chosen', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    await user.click(screen.getByRole('button', { name: copy.nav.menu }))
    const menu = document.getElementById('nav-menu')
    if (!menu) throw new Error('menu missing')
    await user.click(within(menu).getByRole('link', { name: copy.nav.sections.skills }))
    expect(menu).not.toBeVisible()
  })
})
