import { defineConfig, devices } from '@playwright/test'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import 'dotenv/config'

process.env.DATABASE_URL ??= `file:${join(tmpdir(), `trustred-playwright-${process.pid}.sqlite`)}`
process.env.PAYLOAD_SECRET ??= 'trustred-playwright-secret'
process.env.SETUP_TOKEN ??= 'trustred-playwright-setup-token'
process.env.SITE_TIMEZONE ??= 'Europe/Berlin'

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
