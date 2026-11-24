/** Sections a comment can be pinned to; matches the section ids rendered by the web app. */
export const SECTION_IDS = ['hero', 'about', 'projects', 'skills', 'guestbook', 'contact'] as const
export type SectionId = (typeof SECTION_IDS)[number]

/** Input limits shared by the forms and the API (docs/backend-api.md §3). */
export const LIMITS = {
  commentName: { min: 1, max: 40 },
  commentMessage: { min: 1, max: 280 },
  contactName: { min: 1, max: 80 },
  contactMessage: { min: 10, max: 2000 },
  /** Pin position as a percentage of the section box. */
  position: { min: 0, max: 100 },
  page: { min: 1, max: 50, default: 20 },
} as const
