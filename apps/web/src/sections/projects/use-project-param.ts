import { useSyncExternalStore } from 'react'
import { projects } from '../../content/projects'
import type { Project } from '../../content/types'

const PARAM = 'project'
// history.pushState fires no event, so writes announce themselves with this one.
const URL_CHANGE_EVENT = 'project-param-change'

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  window.addEventListener(URL_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(URL_CHANGE_EVENT, onChange)
  }
}

const readSlug = () => new URLSearchParams(window.location.search).get(PARAM)
const readServerSlug = () => null

function urlWith(slug: string | null): string {
  const url = new URL(window.location.href)
  if (slug) url.searchParams.set(PARAM, slug)
  else url.searchParams.delete(PARAM)
  return url.toString()
}

function openProject(slug: string) {
  window.history.pushState({ [PARAM]: slug }, '', urlWith(slug))
  window.dispatchEvent(new Event(URL_CHANGE_EVENT))
}

function closeProject() {
  // Opened in this session: step back so Back/Forward stay natural. Deep link: just clean the URL.
  if (window.history.state?.[PARAM]) {
    window.history.back()
    return
  }
  window.history.replaceState(null, '', urlWith(null))
  window.dispatchEvent(new Event(URL_CHANGE_EVENT))
}

/** The open project lives in `?project=<slug>`, so details are deep-linkable and Back closes them. */
export function useProjectParam(): {
  project: Project | null
  open: (slug: string) => void
  close: () => void
} {
  const slug = useSyncExternalStore(subscribe, readSlug, readServerSlug)
  const project = projects.find((item) => item.slug === slug) ?? null
  return { project, open: openProject, close: closeProject }
}
