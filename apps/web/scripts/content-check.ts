import { fileURLToPath } from 'node:url'
import { findDummies } from './content-check/find-dummies.ts'
import { publicFileExists, readContent } from './content-check/read-content.ts'
import { validateContent } from './content-check/validate-content.ts'
import { formatProblems } from './content-check/vite-plugin.ts'

const webRoot = fileURLToPath(new URL('..', import.meta.url))
const files = readContent(webRoot)
const problems = validateContent(files, publicFileExists(webRoot))
const dummies = findDummies(files)

for (const usage of dummies) process.stdout.write(`dummy  ${usage.where}\n`)
process.stdout.write(`\nDummy content remaining: ${dummies.length}\n`)
if (problems.length > 0) {
  process.stderr.write(`\n${formatProblems(problems)}\n`)
  process.exitCode = 1
}
