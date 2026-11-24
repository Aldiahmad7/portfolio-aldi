import { z } from 'zod'
import type {
  Experience,
  Profile,
  Project,
  Seo,
  Skill,
  Social,
  YearMonth,
} from '../../src/content/types'

/**
 * Rules for src/content/data/*.json (docs/content-guide.md). Runs only at build/test time (Vite
 * plugin, Vitest, `pnpm content:check`), never in the visitor's browser. Objects are strict, so a
 * misspelled field name ("summery") is an error instead of being silently ignored.
 */

const LINK = /^(https?:\/\/|mailto:)\S+$/
/** Site files (public/): start with one slash, e.g. /content/avatar.jpg. */
const LOCAL_PATH = /^\/(?!\/)\S+$/
const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
/** The projects build script animates the featured card and the first two others. */
const MIN_PROJECTS = 3
const FIRST_YEAR = 1990
const LAST_YEAR = 2100

const text = z.string().trim().min(1, 'cannot be empty')
const link = z.string().regex(LINK, 'must start with https://, http:// or mailto:')
const linkOrFile = z
  .string()
  .refine((value) => LINK.test(value) || LOCAL_PATH.test(value), 'must be a link or a /path')
const yearMonth = z
  .string()
  .regex(YEAR_MONTH, 'must look like 2024-03')
  // The regex above is stricter than the YearMonth type, so the narrowing is safe.
  .transform((value) => value as YearMonth)

/** Field names (top level of the same object) that still hold placeholder values. */
const dummyList = z.array(z.string()).optional()

const image = z.strictObject({
  src: z.string().regex(LOCAL_PATH, 'must be a /path inside public/, e.g. /content/photo.jpg'),
  alt: text,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

const profile = z.strictObject({
  dummy: dummyList,
  name: text,
  role: text,
  tagline: text,
  location: text,
  availability: text,
  bio: z.array(text).min(1),
  avatar: image,
  email: z.email('must be an email address'),
  resumeUrl: linkOrFile.nullable(),
}) satisfies z.ZodType<Profile>

const project = z.strictObject({
  dummy: dummyList,
  slug: z.string().regex(SLUG, 'use lowercase letters, numbers and dashes, e.g. my-project'),
  title: text,
  summary: text,
  description: z.array(text).min(1),
  tags: z.array(text),
  thumbnail: image,
  links: z.strictObject({ demo: link.optional(), repo: link.optional() }),
  featured: z.boolean(),
  year: z.number().int().min(FIRST_YEAR).max(LAST_YEAR),
}) satisfies z.ZodType<Project>

const experience = z.strictObject({
  dummy: dummyList,
  company: text,
  title: text,
  start: yearMonth,
  end: z.union([yearMonth, z.literal('present')]),
  summary: text,
}) satisfies z.ZodType<Experience>

const skill = z.strictObject({
  dummy: dummyList,
  name: text,
  group: z.enum(['frontend', 'backend', 'database', 'ai']),
}) satisfies z.ZodType<Skill>

const social = z.strictObject({
  dummy: dummyList,
  platform: z.enum(['github', 'linkedin', 'x', 'email']),
  label: text,
  url: link,
}) satisfies z.ZodType<Social>

const seo = z.strictObject({
  dummy: dummyList,
  description: text,
  ogImage: z.string().regex(LOCAL_PATH, 'must be a /path inside public/'),
}) satisfies z.ZodType<Omit<Seo, 'title'>>

/** Every content file and its schema. A file missing here is not read at all. */
export const CONTENT_FILES = {
  'profile.json': profile,
  'projects.json': z
    .array(project)
    .min(MIN_PROJECTS, `needs at least ${MIN_PROJECTS} projects (1 featured + 2)`),
  'experience.json': z.array(experience).min(1, 'needs at least one item'),
  'skills.json': z.array(skill).min(1, 'needs at least one skill'),
  'socials.json': z.array(social),
  'seo.json': seo,
} as const

export type ContentFileName = keyof typeof CONTENT_FILES
