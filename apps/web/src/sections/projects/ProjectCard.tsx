import { Tag } from '../../components/ui/Tag'
import type { Project } from '../../content/types'
import { useBreakableCard } from './use-breakable-card'

interface ProjectCardProps {
  project: Project
  /** data-build name used by build/scripts/projects.ts. */
  buildName: string
  onOpen: (slug: string) => void
}

export function ProjectCard({ project, buildName, onOpen }: ProjectCardProps) {
  const card = useBreakableCard()

  return (
    <button
      ref={card}
      type="button"
      data-build={buildName}
      onClick={() => onOpen(project.slug)}
      // No aria-labelledby: the name is the card's visible text, so voice control users can say
      // what they see (WCAG 2.5.3 Label in Name).
      aria-haspopup="dialog"
      className="flex h-full w-full flex-col overflow-hidden rounded-md border border-border bg-surface text-left shadow-card hover:shadow-glow"
    >
      <img
        src={project.thumbnail.src}
        alt=""
        width={project.thumbnail.width}
        height={project.thumbnail.height}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="aspect-[16/10] w-full flex-1 object-cover"
      />
      <span className="flex flex-col gap-3 p-5">
        <span className="flex items-baseline justify-between gap-4">
          <span className="text-lg font-semibold">{project.title}</span>
          <span className="font-mono text-xs text-text-secondary">{project.year}</span>
        </span>
        <span className="text-sm text-text-secondary">{project.summary}</span>
        <span className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </span>
      </span>
    </button>
  )
}
