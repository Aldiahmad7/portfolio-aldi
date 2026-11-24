import type { SkillGroup } from '../../content/types'

const PATHS: Record<SkillGroup, string> = {
  frontend: 'M3 5h18v14H3zM3 9h18',
  backend: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01',
  database:
    'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  ai: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
}

interface SkillGroupIconProps {
  group: SkillGroup
}

export function SkillGroupIcon({ group }: SkillGroupIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 fill-none stroke-current stroke-[1.5]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[group]} />
    </svg>
  )
}
