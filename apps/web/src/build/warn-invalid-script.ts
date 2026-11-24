import { BUDGET_MS } from './config'
import { crewIds } from './crew'
import type { ActionDefinition, ActionName, SectionConfig } from './types'
import { validateScript } from './validate'

/** Development aid: production skips invalid steps silently (job.ts). */
export function warnInvalidScript(
  config: SectionConfig,
  actions: Readonly<Record<ActionName, ActionDefinition>>,
) {
  const problems = validateScript(config.script, config.element, {
    crewIds,
    actions,
    budgetMs: BUDGET_MS[config.budget],
  }).filter((issue) => issue.level !== 'info')
  if (problems.length > 0) {
    console.warn(
      `[build] script "${config.id}":\n${problems.map((issue) => `- ${issue.message}`).join('\n')}`,
    )
  }
}
