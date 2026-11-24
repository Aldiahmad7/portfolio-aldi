import data from './data/profile.json'
import type { Profile } from './types'

/** Edit data/profile.json (docs/content-guide.md); the build checks it against the content schema. */
export const profile = data as Profile
