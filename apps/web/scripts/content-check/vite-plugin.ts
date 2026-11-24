import type { Plugin } from 'vite'
import { findDummies } from './find-dummies.ts'
import { publicFileExists, readContent } from './read-content.ts'
import { validateContent } from './validate-content.ts'

const VIRTUAL_ID = 'virtual:dummy-count'
const RESOLVED_ID = `\0${VIRTUAL_ID}`
const CONTENT_JSON = /\/src\/content\/data\/[^/]+\.json$/

const isContentJson = (id: string) =>
  CONTENT_JSON.test(id.split('?')[0]?.replaceAll('\\', '/') ?? '')

export const formatProblems = (problems: readonly string[]) =>
  [
    'Content problems in src/content/data (see docs/content-guide.md):',
    ...problems.map((problem) => `  - ${problem}`),
  ].join('\n')

/** The `dummy` lists are for editors and content:check only; visitors never download them. */
function withoutDummyLists(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(withoutDummyLists)
  if (typeof data !== 'object' || data === null) return data
  return Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'dummy'))
}

/**
 * Content guard (docs/content-guide.md): invalid content fails `vite build` with a readable list and
 * shows as an overlay in dev; leftover placeholders only warn. Also feeds the dev dummy badge.
 */
export function contentCheckPlugin(webRoot: string): Plugin {
  const problems = () => validateContent(readContent(webRoot), publicFileExists(webRoot))
  const countDummies = () => findDummies(readContent(webRoot)).length

  return {
    name: 'content-check',
    enforce: 'pre',
    resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
    load: (id) => (id === RESOLVED_ID ? `export default ${countDummies()}` : undefined),
    buildStart() {
      const { command, consumer } = this.environment.config
      if (consumer !== 'client') return
      const found = problems()
      if (found.length === 0) return
      if (command === 'build') this.error(formatProblems(found))
      this.warn(formatProblems(found))
    },
    transform(code, id) {
      if (!isContentJson(id)) return
      return { code: JSON.stringify(withoutDummyLists(JSON.parse(code))), map: null }
    },
    hotUpdate({ file, modules, server }) {
      if (!isContentJson(file)) return
      const found = problems()
      if (found.length > 0) {
        server.ws.send({ type: 'error', err: { message: formatProblems(found), stack: '' } })
      }
      const counter = this.environment.moduleGraph.getModuleById(RESOLVED_ID)
      if (!counter) return
      this.environment.moduleGraph.invalidateModule(counter)
      return [...modules, counter]
    },
    buildEnd() {
      const { command, consumer } = this.environment.config
      if (command !== 'build' || consumer !== 'client') return
      const count = countDummies()
      if (count > 0) this.warn(`${count} dummy content values remain. Run \`pnpm content:check\`.`)
    },
  }
}
