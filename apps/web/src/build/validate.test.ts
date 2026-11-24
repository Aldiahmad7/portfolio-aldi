import { describe, expect, it } from 'vitest'
import { actionRegistry } from './test-utils'
import type { ActionDefinition, BuildStep } from './types'
import { validateScript, type ValidateOptions } from './validate'

const fixedAction = (ms: number): ActionDefinition => ({ duration: () => ms, run: async () => {} })

const options: ValidateOptions = {
  crewIds: ['pixel', 'kern'],
  actions: actionRegistry(fixedAction(500), {
    visit: { ...fixedAction(5000), decorative: true },
  }),
  budgetMs: 1500,
}

function section(...targets: string[]) {
  const element = document.createElement('section')
  element.innerHTML = targets.map((name) => `<p data-build="${name}"></p>`).join('')
  return element
}

const step = (overrides: Partial<BuildStep> = {}): BuildStep => ({
  by: 'pixel',
  do: 'drawRect',
  target: 'a',
  ...overrides,
})

const levels = (issues: ReturnType<typeof validateScript>) => issues.map((issue) => issue.level)

describe('validateScript', () => {
  it('accepts a valid script', () => {
    const issues = validateScript(
      [step(), step({ by: 'kern', do: 'type', target: 'b' })],
      section('a', 'b'),
      options,
    )
    expect(issues).toEqual([])
  })

  it('reports a missing target', () => {
    const issues = validateScript([step({ target: 'missing' })], section('a'), options)
    expect(
      issues.some((issue) => issue.level === 'error' && issue.message.includes('target')),
    ).toBe(true)
  })

  it('reports unknown crew members and actions', () => {
    const script = [
      step({ by: 'nobody' as BuildStep['by'] }),
      step({ do: 'dance' as BuildStep['do'] }),
    ]
    expect(levels(validateScript(script, section('a'), options))).toEqual(['error', 'error'])
  })

  it('reports a negative `at`', () => {
    const issues = validateScript([step({ at: -1 })], section('a'), options)
    expect(issues[0]?.message).toContain('`at`')
  })

  it('warns when the script is over budget', () => {
    const issues = validateScript([step(), step(), step(), step()], section('a'), options)
    expect(issues.some((issue) => issue.message.includes('budget'))).toBe(true)
  })

  it('warns when the same cursor has overlapping steps', () => {
    const issues = validateScript([step(), step({ at: 0.1 })], section('a'), options)
    expect(issues.some((issue) => issue.message.includes('busy'))).toBe(true)
  })

  it('lists targets the script does not mention as info', () => {
    expect(levels(validateScript([step()], section('a', 'b'), options))).toEqual(['info'])
  })

  it('leaves decorative steps out of the budget', () => {
    const issues = validateScript([step({ by: 'kern', do: 'visit' })], section('a'), options)
    expect(issues).toEqual([])
  })

  it('warns when the crew member has no lines for `say`', () => {
    const issues = validateScript([step({ say: 'late' })], section('a'), options)
    expect(issues.map((issue) => issue.message)).toEqual([expect.stringContaining('"late"')])
  })
})
