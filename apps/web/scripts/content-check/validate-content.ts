import { CONTENT_FILES, type ContentFileName } from './content-schema.ts'

/** A content file as read from disk; `data` is the parsed JSON, or the parse error message. */
export interface ContentFile {
  name: string
  data: unknown
  parseError?: string
}

type Path = readonly PropertyKey[]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Fields that name an item in messages, so "item 3" also says which one. */
const NAME_FIELDS = ['title', 'name', 'company', 'label', 'slug']

function describeItem(data: unknown, index: number) {
  const item = Array.isArray(data) ? (data[index] as unknown) : undefined
  const field = isRecord(item)
    ? NAME_FIELDS.find((key) => typeof item[key] === 'string')
    : undefined
  const name = field && isRecord(item) ? ` "${String(item[field])}"` : ''
  return `item ${index + 1}${name}`
}

/** `projects.json › item 3 "Pairbot" › thumbnail.src` */
export function where(file: ContentFile, path: Path) {
  const [first, ...rest] = path
  const parts = [file.name]
  if (typeof first === 'number') parts.push(describeItem(file.data, first))
  const fields = typeof first === 'number' ? rest : path
  if (fields.length > 0) parts.push(fields.map(String).join('.'))
  return parts.join(' › ')
}

const isContentFile = (name: string): name is ContentFileName => name in CONTENT_FILES

/** Objects of a file: the object itself, or each array item, with their paths. */
export function objectsOf(data: unknown): { path: Path; value: Record<string, unknown> }[] {
  if (Array.isArray(data)) {
    return data.flatMap((value: unknown, index) =>
      isRecord(value) ? [{ path: [index], value }] : [],
    )
  }
  return isRecord(data) ? [{ path: [], value: data }] : []
}

/** Every local file reference ("/content/x.jpg") anywhere in the data, with its path. */
function localPaths(value: unknown, path: Path = []): { path: Path; src: string }[] {
  if (typeof value === 'string') return /^\/(?!\/)/.test(value) ? [{ path, src: value }] : []
  if (Array.isArray(value))
    return value.flatMap((item, index) => localPaths(item, [...path, index]))
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, item]) => localPaths(item, [...path, key]))
  }
  return []
}

function rules(files: readonly ContentFile[]): string[] {
  const projects = files.find((file) => file.name === 'projects.json')
  if (!projects || !Array.isArray(projects.data)) return []
  const list = projects.data as { slug?: unknown; featured?: unknown }[]
  const problems: string[] = []
  const featured = list.filter((project) => project.featured === true).length
  if (featured !== 1) {
    problems.push(`projects.json › exactly one project needs "featured": true (found ${featured})`)
  }
  const slugs = list.map((project) => project.slug)
  slugs.forEach((slug, index) => {
    if (slugs.indexOf(slug) !== index) {
      problems.push(`${where(projects, [index, 'slug'])}: "${String(slug)}" is used twice`)
    }
  })
  return problems
}

/**
 * Everything wrong with the content, as one readable line per problem (empty = all good). Checks
 * JSON syntax, the schema, the layout rules, `dummy` lists and that local files exist.
 */
export function validateContent(
  files: readonly ContentFile[],
  fileExists: (publicPath: string) => boolean,
): string[] {
  const problems: string[] = []
  for (const name of Object.keys(CONTENT_FILES)) {
    if (!files.some((file) => file.name === name)) problems.push(`${name} › file is missing`)
  }
  for (const file of files) {
    if (file.parseError) {
      problems.push(`${file.name} › not valid JSON: ${file.parseError}`)
      continue
    }
    if (!isContentFile(file.name)) continue
    const result = CONTENT_FILES[file.name].safeParse(file.data)
    if (!result.success) {
      for (const issue of result.error.issues) {
        problems.push(`${where(file, issue.path)}: ${issue.message}`)
      }
      continue
    }
    for (const { path, value } of objectsOf(file.data)) {
      const listed = Array.isArray(value.dummy) ? value.dummy : []
      for (const field of listed) {
        if (typeof field === 'string' && !(field in value)) {
          problems.push(`${where(file, [...path, 'dummy'])}: "${field}" is not a field here`)
        }
      }
    }
    for (const { path, src } of localPaths(file.data)) {
      if (!fileExists(src)) problems.push(`${where(file, path)}: public${src} does not exist`)
    }
  }
  return [...problems, ...rules(files)]
}
