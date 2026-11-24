import { dialog } from './crew'
import { findTargets } from './reveal'
import { buildTimeline, contentTotal } from './timeline'
import type { ActionDefinition, ActionName, BuildScript, CrewId } from './types'

export interface ScriptIssue {
  level: 'error' | 'warning' | 'info'
  message: string
}

export interface ValidateOptions {
  crewIds: readonly CrewId[]
  actions: Readonly<Record<ActionName, ActionDefinition>>
  budgetMs: number
}

/** Checks a script against the rendered section. Errors make the step invalid (it is skipped). */
export function validateScript(
  script: BuildScript,
  section: ParentNode,
  { crewIds, actions, budgetMs }: ValidateOptions,
): ScriptIssue[] {
  const issues: ScriptIssue[] = []
  const targets = findTargets(section)
  const durations = script.map((step, index) => {
    const label = `step ${index} (${step.by} ${step.do} "${step.target}")`
    const error = (message: string) =>
      issues.push({ level: 'error', message: `${label}: ${message}` })
    const target = targets.get(step.target)
    const action = Object.hasOwn(actions, step.do) ? actions[step.do] : undefined
    if (!crewIds.includes(step.by)) error(`unknown crew member "${step.by}"`)
    if (!action) error(`unknown action "${step.do}"`)
    if (!target) error('target not found in section')
    if (step.at !== undefined && step.at < 0) error('`at` must be >= 0')
    if (step.say && !dialog[step.say][step.by]?.length) {
      issues.push({ level: 'warning', message: `${label}: no "${step.say}" lines, stays quiet` })
    }
    return action && target ? action.duration(step, target) : 0
  })

  const timeline = buildTimeline(script, durations)
  const decorative = script.map((step) =>
    Object.hasOwn(actions, step.do) ? (actions[step.do].decorative ?? false) : false,
  )
  const total = contentTotal(timeline, decorative)
  if (total > budgetMs) {
    issues.push({ level: 'warning', message: `total ${total}ms exceeds budget ${budgetMs}ms` })
  }

  const busyUntil = new Map<CrewId, number>()
  script.forEach((step, index) => {
    const scheduled = timeline.steps[index]
    if (!scheduled) return
    const previousEnd = busyUntil.get(step.by) ?? 0
    if (scheduled.start < previousEnd) {
      issues.push({
        level: 'warning',
        message: `step ${index}: ${step.by} is still busy until ${previousEnd}ms; the step will wait`,
      })
    }
    busyUntil.set(step.by, Math.max(previousEnd, scheduled.start) + scheduled.duration)
  })

  const used = new Set(script.map((step) => step.target))
  targets.forEach((_, name) => {
    if (!used.has(name)) issues.push({ level: 'info', message: `"${name}" is revealed at the end` })
  })
  return issues
}
