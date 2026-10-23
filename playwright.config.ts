import { defineConfig, devices } from '@playwright/test'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtempSync } from 'node:fs'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import 'dotenv/config'

// Worker processes inherit the suite's dedicated database, never the .env database.
process.env.TRUSTRED_E2E_DATABASE_URL ??= `file:${join(mkdtempSync(join(tmpdir(), 'trustred-playwright-')), 'test.sqlite')}`
process.env.DATABASE_URL = process.env.TRUSTRED_E2E_DATABASE_URL
process.env.PAYLOAD_SECRET = 'trustred-playwright-secret'
process.env.SETUP_TOKEN = 'trustred-playwright-setup-token'
process.env.SITE_TIMEZONE = 'Europe/Berlin'
process.env.TRUSTRED_PUBLIC_ORIGIN = 'http://localhost:3000'
for (const key of ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']) {
  process.env[key] = ''
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/globalSetup.ts',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
      SETUP_TOKEN: process.env.SETUP_TOKEN,
      SITE_TIMEZONE: process.env.SITE_TIMEZONE,
    },
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === 'true',
    url: 'http://localhost:3000',
  },
})
