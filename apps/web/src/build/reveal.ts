/**
 * Hidden/visible state lives in data attributes; styles/build.css does the hiding. Content is only
 * ever hidden with opacity, so it keeps its layout and stays in the accessibility tree.
 */
export const BUILD_ATTRIBUTES = {
  target: 'data-build',
  built: 'data-built',
  section: 'data-build-section',
  claimed: 'data-build-claimed',
} as const

export function findTargets(section: ParentNode): Map<string, HTMLElement> {
  const targets = new Map<string, HTMLElement>()
  section.querySelectorAll<HTMLElement>(`[${BUILD_ATTRIBUTES.target}]`).forEach((element) => {
    const name = element.getAttribute(BUILD_ATTRIBUTES.target)
    if (name) targets.set(name, element)
  })
  return targets
}

export function revealTarget(element: Element) {
  element.setAttribute(BUILD_ATTRIBUTES.built, '')
}

export function revealSection(section: ParentNode) {
  findTargets(section).forEach(revealTarget)
}

export function hideSection(section: ParentNode) {
  findTargets(section).forEach((element) => element.removeAttribute(BUILD_ATTRIBUTES.built))
}

/** Turns off the CSS failsafe: from now on the director is responsible for showing the content. */
export function claimSection(section: Element) {
  section.setAttribute(BUILD_ATTRIBUTES.claimed, '')
}
