import { render } from '@testing-library/react'
import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import { About } from '../../sections/about/About'
import { Contact } from '../../sections/contact/Contact'
import { Guestbook } from '../../sections/guestbook/Guestbook'
import { Hero } from '../../sections/hero/Hero'
import { Projects } from '../../sections/projects/Projects'
import { Skills } from '../../sections/skills/Skills'
import { actions } from '../actions'
import { BuildProvider } from '../build-provider'
import { BUDGET_MS } from '../config'
import { crewIds } from '../crew'
import type { BuildScript } from '../types'
import { validateScript } from '../validate'
import { aboutScript } from './about'
import { contactScript } from './contact'
import { guestbookScript } from './guestbook'
import { heroScript } from './hero'
import { projectsScript } from './projects'
import { skillsScript } from './skills'

interface ScriptCase {
  name: string
  Section: ComponentType
  script: BuildScript
  budget: number
}

const cases: ScriptCase[] = [
  { name: 'hero', Section: Hero, script: heroScript, budget: BUDGET_MS.hero },
  { name: 'about', Section: About, script: aboutScript, budget: BUDGET_MS.default },
  { name: 'projects', Section: Projects, script: projectsScript, budget: BUDGET_MS.default },
  { name: 'skills', Section: Skills, script: skillsScript, budget: BUDGET_MS.default },
  { name: 'guestbook', Section: Guestbook, script: guestbookScript, budget: BUDGET_MS.default },
  { name: 'contact', Section: Contact, script: contactScript, budget: BUDGET_MS.default },
]

describe('real build scripts', () => {
  it.each(cases)(
    '$name script is valid against the rendered section',
    ({ Section, script, budget }) => {
      const { container } = render(
        <BuildProvider>
          <Section />
        </BuildProvider>,
      )
      const issues = validateScript(script, container, { crewIds, actions, budgetMs: budget })
      expect(issues.filter((issue) => issue.level !== 'info')).toEqual([])
    },
  )

  it('gives every section with a script a personality moment (an oops, Red or Intern)', () => {
    for (const { name, script } of cases) {
      const moment = script.some((step) => step.oops || step.by === 'red' || step.by === 'intern')
      expect(moment, name).toBe(true)
    }
  })
})
