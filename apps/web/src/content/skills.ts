import data from './data/skills.json'
import type { Skill } from './types'

/** Edit data/skills.json: grouped on the page by `group`, in array order. */
export const skills = data as readonly Skill[]
