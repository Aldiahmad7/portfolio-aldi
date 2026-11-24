import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { profile } from '../content/profile'
import { App } from './App'

describe('App', () => {
  it('renders the hero name and every section heading', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: profile.name })).toBeInTheDocument()
    for (const name of [
      'About',
      'Selected projects',
      'Skills',
      'Guestbook',
      "Let's build something",
    ]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
  })

  it('marks every section heading as a build target', () => {
    const { container } = render(<App />)
    expect(container.querySelectorAll('h2[data-build]')).toHaveLength(5)
  })
})
