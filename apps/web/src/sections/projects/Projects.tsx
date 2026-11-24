import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { copy } from '../../app/copy'
import { projectsScript } from '../../build/scripts/projects'
import { buttonClass } from '../../components/ui/button'
import { Section } from '../../components/ui/Section'
import { projects } from '../../content/projects'
import type { Project } from '../../content/types'
import { ProjectCard } from './ProjectCard'
import { ProjectModal } from './ProjectModal'
import { ProjectStack } from './ProjectStack'
import { hasStack, planStack, stackCardClass, stackedCardClass } from './project-stack'
import { useProjectParam } from './use-project-param'

const LIST_ID = 'project-list'
const regular = projects.filter((project) => !project.featured)
const plan = planStack(regular.length)

/** Positional build targets, so build/scripts/projects.ts never depends on content slugs. */
const regularIndex = new Map(regular.map((project, index) => [project.slug, index]))
const buildName = (project: Project) =>
  project.featured ? 'project-featured' : `project-${regularIndex.get(project.slug) ?? 0}`

export function Projects() {
  const { eyebrow, title } = copy.sections.projects
  const { project, open, close } = useProjectParam()
  const [expanded, setExpanded] = useState(false)
  const list = useRef<HTMLUListElement>(null)
  const stack = useRef<HTMLButtonElement>(null)

  const expand = () => {
    // The first card the stack was hiding in this layout gets focus, as the stack button goes away.
    const firstHidden = [...(list.current?.querySelectorAll('li[data-stacked]') ?? [])].find(
      (item) => item instanceof HTMLElement && item.offsetParent === null,
    )
    flushSync(() => setExpanded(true))
    firstHidden?.querySelector('button')?.focus()
  }
  const collapse = () => {
    flushSync(() => setExpanded(false))
    stack.current?.focus()
  }

  const itemClass = (item: Project) => {
    if (item.featured) return 'sm:col-span-2 lg:row-span-2'
    if (expanded) return undefined
    return stackedCardClass(plan, regularIndex.get(item.slug) ?? 0) || undefined
  }

  return (
    <Section id="projects" eyebrow={eyebrow} title={title} script={projectsScript}>
      <ul
        id={LIST_ID}
        ref={list}
        className="grid gap-4 sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-3"
      >
        {projects.map((item) => (
          <li
            key={item.slug}
            data-stacked={itemClass(item) && !item.featured ? '' : undefined}
            className={itemClass(item)}
          >
            <ProjectCard project={item} buildName={buildName(item)} onOpen={open} />
          </li>
        ))}
        {hasStack(plan) && !expanded && (
          <li className={stackCardClass(plan) || undefined}>
            <ProjectStack
              ref={stack}
              plan={plan}
              regular={regular}
              controls={LIST_ID}
              onExpand={expand}
            />
          </li>
        )}
      </ul>
      {hasStack(plan) && expanded && (
        <div className={`mt-8 flex justify-center ${stackCardClass(plan)}`}>
          <button
            type="button"
            aria-expanded={true}
            aria-controls={LIST_ID}
            onClick={collapse}
            className={buttonClass('ghost')}
          >
            {copy.projects.showFewer}
          </button>
        </div>
      )}
      <ProjectModal project={project} onClose={close} />
    </Section>
  )
}
