import type { Overlay, Rect } from './types'

/**
 * The single decoration layer: absolutely positioned in document coordinates at the top of <body>,
 * so native scrolling moves every decoration without scroll listeners. Hidden from assistive tech.
 * Not `inert`: that would block the cursor hitboxes used for catch-and-throw (ADR 0005). Nothing in
 * the layer is focusable.
 */
export function createLayer(): HTMLElement {
  const layer = document.createElement('div')
  layer.className = 'build-layer'
  layer.setAttribute('aria-hidden', 'true')
  document.body.append(layer)
  return layer
}

/** Decorations of one job. `clear` removes everything the job added. */
export function createOverlay(layer: HTMLElement): Overlay & { clear: () => void } {
  const added = new Set<HTMLElement>()
  return {
    add(element) {
      added.add(element)
      layer.append(element)
      return element
    },
    clear() {
      added.forEach((element) => element.remove())
      added.clear()
    },
  }
}

export function documentRect(element: Element): Rect {
  const box = element.getBoundingClientRect()
  return {
    x: box.left + window.scrollX,
    y: box.top + window.scrollY,
    width: box.width,
    height: box.height,
  }
}

/** Positions a decoration over a document rect. */
export function placeOver(element: HTMLElement, rect: Rect) {
  element.style.left = `${rect.x}px`
  element.style.top = `${rect.y}px`
  element.style.width = `${rect.width}px`
  element.style.height = `${rect.height}px`
}
