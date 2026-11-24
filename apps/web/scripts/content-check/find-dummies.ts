import { objectsOf, where, type ContentFile } from './validate-content.ts'

export interface DummyUsage {
  /** e.g. `projects.json › item 1 "DocuMind" › title` */
  where: string
}

const DUMMY_IMAGE = /^\/dummy\//

/**
 * Placeholder content left: every field named in a `dummy` list, plus any /dummy/ image that is not
 * already covered by a listed field (so an image is never counted twice).
 */
export function findDummies(files: readonly ContentFile[]): DummyUsage[] {
  return files.flatMap((file) =>
    objectsOf(file.data).flatMap(({ path, value }) => {
      const listed = new Set(
        Array.isArray(value.dummy) ? value.dummy.filter((field) => typeof field === 'string') : [],
      )
      const fields = [...listed].map((field) => ({ where: where(file, [...path, field]) }))
      const images = Object.entries(value).flatMap(([field, item]) =>
        !listed.has(field) && containsDummyImage(item)
          ? [{ where: where(file, [...path, field]) }]
          : [],
      )
      return [...fields, ...images]
    }),
  )
}

function containsDummyImage(value: unknown): boolean {
  if (typeof value === 'string') return DUMMY_IMAGE.test(value)
  if (Array.isArray(value)) return value.some(containsDummyImage)
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some(containsDummyImage)
  }
  return false
}
