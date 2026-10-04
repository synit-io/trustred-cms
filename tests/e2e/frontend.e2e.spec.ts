import { test, expect, Page } from '@playwright/test'

test.describe('Frontend', () => {
  let page: Page

  test.beforeAll(async ({ browser }, _testInfo) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('can go on homepage', async () => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle('Start | Ihre Organisation')

    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/)

    const heading = page.locator('h1').first()

    await expect(heading).toContainText('Startseite einrichten')
  })

  test('serves uncached health probes and rejects cross-site auth requests', async ({
    request,
  }) => {
    const health = await request.get('http://localhost:3000/health')
    expect(health.status()).toBe(200)
    expect(health.headers()['cache-control']).toBe('no-store')
    expect(health.headers()['x-content-type-options']).toBe('nosniff')
    expect((await request.get('http://localhost:3000/ready')).status()).toBe(200)
    const logout = await request.post('http://localhost:3000/manage/auth/logout', {
      headers: { Origin: 'https://attacker.example.test' },
    })
    expect(logout.status()).toBe(403)
  })
})
