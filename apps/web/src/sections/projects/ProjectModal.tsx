import { useEffect, useRef } from 'react'
import { copy } from '../../app/copy'
import { buttonClass } from '../../components/ui/button'
import { Tag } from '../../components/ui/Tag'
import type { Project } from '../../content/types'

interface ProjectModalProps {
  project: Project | null
  onClose: () => void
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (project && !dialog.open) dialog.showModal()
    if (!project && dialog.open) dialog.close()
  }, [project])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="project-modal-title"
      onClose={() => project && onClose()}
      className="m-auto w-[calc(100%-2*var(--spacing-gutter))] max-w-3xl rounded-lg border border-border bg-surface p-0 text-text shadow-hud backdrop:bg-backdrop"
    >
      {project && (
        <article>
          <img
            src={project.thumbnail.src}
            alt={project.thumbnail.alt}
            width={project.thumbnail.width}
            height={project.thumbnail.height}
            className="aspect-[16/10] w-full object-cover"
          />
          <div className="space-y-4 p-6 sm:p-8">
            <p className="font-mono text-xs text-text-secondary">{project.year}</p>
            <h3 id="project-modal-title" className="text-2xl font-semibold">
              {project.title}
            </h3>
            {project.description.map((paragraph) => (
              <p key={paragraph} className="text-text-secondary">
                {paragraph}
              </p>
            ))}
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {project.links.demo && (
                <a href={project.links.demo} className={buttonClass('primary')}>
                  {copy.projects.demo}
                </a>
              )}
              {project.links.repo && (
                <a href={project.links.repo} className={buttonClass('ghost')}>
                  {copy.projects.repo}
                </a>
              )}
              <button type="button" onClick={onClose} className={buttonClass('ghost')}>
                {copy.projects.close}
              </button>
            </div>
          </div>
        </article>
      )}
    </dialog>
  )
}
