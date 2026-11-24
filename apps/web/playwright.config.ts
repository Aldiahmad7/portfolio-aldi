import { defineConfig, devices } from '@playwright/test'

// Not 4173: `pnpm preview` (the Worker with the real API) runs there, and reuseExistingServer
// would test against it instead of this build with the fake API.
const PORT = 4175
const isCI = Boolean(process.env.CI)

/** Smoke tests against the production build (`pnpm test:e2e` builds first). */
export default defineConfig({
  testDir: './e2e',
  forbidOnly: isCI,
  reporter: 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
  },
})
