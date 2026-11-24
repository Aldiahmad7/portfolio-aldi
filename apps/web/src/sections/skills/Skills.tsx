import { copy } from '../../app/copy'
import { skillsScript } from '../../build/scripts/skills'
import { Section } from '../../components/ui/Section'
import { Tag } from '../../components/ui/Tag'
import { skills } from '../../content/skills'
import type { SkillGroup } from '../../content/types'
import { SkillGroupIcon } from './SkillGroupIcon'

const GROUPS = Object.keys(copy.skillGroups) as SkillGroup[]

export function Skills() {
  const { eyebrow, title } = copy.sections.skills
  return (
    <Section id="skills" eyebrow={eyebrow} title={title} script={skillsScript}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GROUPS.map((group) => (
          <li
            key={group}
            data-build={`skills-${group}`}
            className="rounded-md border border-border bg-surface p-5 shadow-card"
          >
            <h3 className="flex items-center gap-2 font-mono text-sm text-blue-pale">
              <SkillGroupIcon group={group} />
              {copy.skillGroups[group]}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {skills
                .filter((skill) => skill.group === group)
                .map((skill) => (
                  <li key={skill.name}>
                    <Tag>{skill.name}</Tag>
                  </li>
                ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  )
}
