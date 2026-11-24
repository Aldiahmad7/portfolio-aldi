import { describe, expect, it } from 'vitest'
import { resolveCommand, suggestCommands } from './parse-command'

const names = (input: string) => suggestCommands(input).map((command) => command.name)

describe('resolveCommand', () => {
  it('finds commands regardless of case and spacing', () => {
    expect(resolveCommand('  Crew   Dance ')?.command.name).toBe('crew dance')
  })

  it('splits off the argument of commands that take one', () => {
    const resolved = resolveCommand('speed 2')
    expect(resolved?.command.name).toBe('speed')
    expect(resolved?.argument).toBe('2')
  })

  it('does not take arguments for commands without usage', () => {
    expect(resolveCommand('help me')).toBeNull()
    expect(resolveCommand('dance')).toBeNull()
  })
})

describe('suggestCommands', () => {
  it('suggests by prefix', () => {
    expect(names('c')).toEqual(['crew dance', 'coffee break'])
    expect(names('he')).toEqual(['help'])
  })

  it('matches word prefixes ("dance" → crew dance)', () => {
    expect(names('dan')).toEqual(['crew dance'])
  })

  it('keeps suggesting while an argument is typed', () => {
    expect(names('speed 3')).toEqual(['speed'])
  })

  it('suggests nothing for nonsense', () => {
    expect(names('xyz')).toEqual([])
  })
})
