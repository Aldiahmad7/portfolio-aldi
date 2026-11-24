export interface ImageAsset {
  src: string
  alt: string
  width: number
  height: number
}

export type YearMonth = `${number}-${number}`

export interface Profile {
  name: string
  role: string
  tagline: string
  location: string
  availability: string
  bio: readonly string[]
  avatar: ImageAsset
  email: string
  resumeUrl: string | null
}

export interface Experience {
  company: string
  title: string
  start: YearMonth
  end: YearMonth | 'present'
  summary: string
}

export interface ProjectLinks {
  demo?: string | undefined
  repo?: string | undefined
}

export interface Project {
  slug: string
  title: string
  summary: string
  description: readonly string[]
  tags: readonly string[]
  thumbnail: ImageAsset
  links: ProjectLinks
  featured: boolean
  year: number
}

export type SkillGroup = 'frontend' | 'backend' | 'database' | 'ai'

export interface Skill {
  name: string
  group: SkillGroup
}

export type SocialPlatform = 'github' | 'linkedin' | 'x' | 'email'

export interface Social {
  platform: SocialPlatform
  label: string
  url: string
}

export interface Seo {
  title: string
  description: string
  ogImage: string
}
