import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ContentFile } from './validate-content.ts'

export const contentDirectory = (webRoot: string) => join(webRoot, 'src', 'content', 'data')

/** Reads every JSON file in src/content/data; a syntax error is kept as `parseError`. */
export function readContent(webRoot: string): ContentFile[] {
  const directory = contentDirectory(webRoot)
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const text = readFileSync(join(directory, name), 'utf8')
      try {
        return { name, data: JSON.parse(text) as unknown }
      } catch (error) {
        return { name, data: null, parseError: error instanceof Error ? error.message : 'unknown' }
      }
    })
}

/** `/content/photo.jpg` → does apps/web/public/content/photo.jpg exist? */
export const publicFileExists = (webRoot: string) => (publicPath: string) =>
  existsSync(join(webRoot, 'public', ...publicPath.split('/').filter(Boolean)))
