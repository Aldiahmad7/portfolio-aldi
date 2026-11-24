import { BUILD_ATTRIBUTES } from './reveal'

/** Height of the element inside the viewport: "the section the visitor is looking at". */
export function visibleHeight(element: Element) {
  const box = element.getBoundingClientRect()
  return Math.max(0, Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0))
}

/** True when every build target in the section is already shown (e.g. prerendered as built). */
export const isFullyBuilt = (section: Element) =>
  !section.querySelector(`[${BUILD_ATTRIBUTES.target}]:not([${BUILD_ATTRIBUTES.built}])`)

/** Sort comparator: earlier in the page first. */
export const byDocumentOrder = (a: Element, b: Element) =>
  a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
