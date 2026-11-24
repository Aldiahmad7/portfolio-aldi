import data from './data/experience.json'
import type { Experience } from './types'

/** Edit data/experience.json: newest first, as it appears on the timeline. */
export const experience = data as readonly Experience[]
