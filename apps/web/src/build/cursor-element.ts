import { crew } from './crew'
import type { CrewId, Point } from './types'

/** 16×16 arrow, tip at (1, 1). Shared with the HUD toggle icon. */
export const CURSOR_ARROW_PATH = 'M1 1v13l3.5-3.5L7 15l2-1-2.4-4.4h4.9z'

// Shown only while the cursor carries a sent message out of the page (crew-control `deliver`).
const ENVELOPE_SVG = `<svg class="build-cursor-envelope" viewBox="0 0 16 12" aria-hidden="true"><rect x="0.5" y="0.5" width="15" height="11" rx="1.5"/><path d="M1 1.5l7 5 7-5"/></svg>`

const ARROW_SVG = `<svg class="build-cursor-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="${CURSOR_ARROW_PATH}"/></svg>`

export const translate = (point: Point) => `translate(${point.x}px, ${point.y}px)`

/**
 * Arrow, name label and a small hitbox: the only part of the decoration layer that takes pointer
 * events, so visitors can grab the cursor without the layer blocking clicks on the page.
 */
export function createCursorElement(id: CrewId) {
  const member = crew[id]
  const element = document.createElement('div')
  element.className = 'build-cursor'
  element.dataset.crew = id
  element.dataset.labelText = member.labelText
  element.style.setProperty('--crew-color', member.color)
  element.innerHTML = ARROW_SVG + ENVELOPE_SVG
  const hitbox = document.createElement('span')
  hitbox.className = 'build-cursor-hitbox'
  const label = document.createElement('span')
  label.className = 'build-cursor-label'
  label.textContent = member.name
  element.append(hitbox, label)
  return element
}
