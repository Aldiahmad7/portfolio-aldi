import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'
import { contentCheckPlugin } from './scripts/content-check/vite-plugin.ts'

const webRoot = fileURLToPath(new URL('.', import.meta.url))
/** `wrangler dev` of apps/api (docs/backend-api.md): same-origin /api in development too. */
const apiProxy = { '/api': 'http://localhost:8787' }

export default defineConfig({
  envDir: '../..',
  plugins: [react(), tailwindcss(), contentCheckPlugin(webRoot)],
  server: { proxy: apiProxy },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // Playwright specs run in a real browser via `pnpm test:e2e`.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
