import data from './data/seo.json'
import { profile } from './profile'
import type { Seo } from './types'

/** The page title always follows the profile; description and share image come from data/seo.json. */
export const seo: Seo = {
  title: `${profile.name} — ${profile.role}`,
  description: data.description,
  ogImage: data.ogImage,
}
