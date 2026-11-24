import { useEffect, useRef, useState } from 'react'
import { copy } from '../../app/copy'
import { profile } from '../../content/profile'
import { buttonClass } from '../ui/button'
import { useActiveSection } from './use-active-section'

const LINKS = Object.entries(copy.nav.sections)
const SECTION_IDS = LINKS.map(([id]) => id)
const MENU_ID = 'nav-menu'

const linkClass = (current: boolean) =>
  `rounded-sm px-3 py-1.5 transition-colors duration-(--duration-fast) ease-standard hover:text-text ${
    current ? 'bg-surface text-text shadow-glow' : 'text-text-secondary'
  }`

/** Design-tool style top bar: file name, section "frames", and a hire-me action. Never built by the crew. */
export function Navbar() {
  const active = useActiveSection(SECTION_IDS)
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)

  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // Document runs before the global shortcuts on window: only the menu reacts to this Esc.
      event.stopPropagation()
      setOpen(false)
      toggle.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const links = LINKS.map(([id, label]) => (
    <li key={id}>
      <a
        href={`#${id}`}
        onClick={close}
        aria-current={active === id ? 'location' : undefined}
        className={`block ${linkClass(active === id)}`}
      >
        {label}
      </a>
    </li>
  ))

  return (
    // Closed: below the crew layer (z-40), so cursors and their props pass over the bar like
    // over any page element. Open: the menu panel must cover whatever the crew is building.
    <header
      className={`sticky top-0 ${open ? 'z-50' : 'z-30'} border-b border-border bg-bg font-mono text-sm md:top-ruler`}
    >
      <nav
        aria-label={copy.nav.label}
        className="mx-auto flex h-nav max-w-content items-center justify-between gap-4 px-gutter"
      >
        <a href="#hero" className="flex items-center gap-2 text-text hover:text-blue-light">
          <span aria-hidden="true" className="text-accent">
            {copy.nav.fileIcon}
          </span>
          {copy.nav.fileName(profile.name)}
        </a>
        <ul className="hidden items-center gap-1 md:flex">{links}</ul>
        <div className="flex items-center gap-2">
          <a href="#contact" className={`${buttonClass('primary')} h-8 px-4`}>
            {copy.nav.hire}
          </a>
          <button
            ref={toggle}
            type="button"
            aria-expanded={open}
            aria-controls={MENU_ID}
            onClick={() => setOpen((value) => !value)}
            className={`${buttonClass('ghost')} h-8 px-4 md:hidden`}
          >
            {copy.nav.menu}
          </button>
        </div>
      </nav>
      <ul
        id={MENU_ID}
        hidden={!open}
        className="mx-auto grid max-w-content gap-1 border-t border-border px-gutter py-3 md:hidden"
      >
        {links}
      </ul>
    </header>
  )
}
