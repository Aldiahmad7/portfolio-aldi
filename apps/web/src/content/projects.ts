import data from './data/projects.json'
import type { Project } from './types'

/** Edit data/projects.json: array order is display order; exactly one project is `featured`. */
export const projects = data as readonly Project[]
