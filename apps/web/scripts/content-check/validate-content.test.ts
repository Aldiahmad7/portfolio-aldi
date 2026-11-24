// @vitest-environment node
// Node script code: reads the real files under src/content/data.
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { findDummies } from './find-dummies.ts'
import { publicFileExists, readContent } from './read-content.ts'
import { validateContent, type ContentFile } from './validate-content.ts'

const webRoot = fileURLToPath(new URL('../..', import.meta.url))
const real = readContent(webRoot)
const exists = publicFileExists(webRoot)

/** The real content with one file replaced. */
function withFile(name: string, data: unknown): ContentFile[] {
  return real.map((file) => (file.name === name ? { name, data } : file))
}

const projects = real.find((file) => file.name === 'projects.json')?.data as Record<
  string,
  unknown
>[]

describe('content in src/content/data', () => {
  it('is valid', () => {
    expect(validateContent(real, exists)).toEqual([])
  })
})

describe('validateContent', () => {
  it('names the file, the item and the field of a schema problem', () => {
    const broken = projects.map((project, index) =>
      index === 2 ? { ...project, year: 'soon' } : project,
    )
    const [problem] = validateContent(withFile('projects.json', broken), exists)
    expect(problem).toMatch(/^projects\.json › item 3 "Pairbot" › year: /)
  })

  it('reports a misspelled field instead of ignoring it', () => {
    const broken = projects.map((project, index) =>
      index === 0 ? { ...project, summery: 'typo' } : project,
    )
    expect(validateContent(withFile('projects.json', broken), exists).join('\n')).toContain(
      'summery',
    )
  })

  it('enforces one featured project and unique slugs', () => {
    const twoFeatured = projects.map((project) => ({ ...project, featured: true }))
    expect(validateContent(withFile('projects.json', twoFeatured), exists)).toContain(
      'projects.json › exactly one project needs "featured": true (found 6)',
    )
    const duplicate = projects.map((project) => ({ ...project, slug: 'same' }))
    expect(validateContent(withFile('projects.json', duplicate), exists).join('\n')).toContain(
      '"same" is used twice',
    )
  })

  it('reports missing image files, unknown dummy fields and invalid JSON', () => {
    const missingImage = projects.map((project, index) =>
      index === 0
        ? { ...project, thumbnail: { src: '/content/nope.jpg', alt: 'x', width: 1, height: 1 } }
        : project,
    )
    expect(validateContent(withFile('projects.json', missingImage), exists).join('\n')).toContain(
      'public/content/nope.jpg does not exist',
    )
    const unknownDummy = projects.map((project, index) =>
      index === 0 ? { ...project, dummy: ['titel'] } : project,
    )
    expect(validateContent(withFile('projects.json', unknownDummy), exists).join('\n')).toContain(
      '"titel" is not a field here',
    )
    const invalid = real.map((file) =>
      file.name === 'seo.json'
        ? { name: file.name, data: null, parseError: 'Unexpected token' }
        : file,
    )
    expect(validateContent(invalid, exists)).toEqual([
      'seo.json › not valid JSON: Unexpected token',
    ])
  })
})

describe('findDummies', () => {
  it('lists every field still marked as placeholder', () => {
    const usages = findDummies(real).map((usage) => usage.where)
    expect(usages).toContain('projects.json › item 1 "DocuMind" › title')
    expect(usages).toContain('profile.json › avatar')
  })

  it('counts an unlisted /dummy/ image once, and nothing when content is real', () => {
    const files = [
      {
        name: 'profile.json',
        data: {
          name: 'Aldi',
          avatar: { src: '/dummy/avatar.svg', alt: 'Aldi', width: 1, height: 1 },
        },
      },
    ]
    expect(findDummies(files).map((usage) => usage.where)).toEqual(['profile.json › avatar'])
    expect(findDummies([{ name: 'skills.json', data: [{ name: 'React' }] }])).toEqual([])
  })
})
