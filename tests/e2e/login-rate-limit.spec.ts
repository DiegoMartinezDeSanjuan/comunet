import { test, expect } from '@playwright/test'

test.describe('Login Rate Limiter (Server Actions)', () => {
  test('should block IP after 5 attempts using true UI form submissions', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')

    let rateLimited = false

    // We do 6 attempts because the limit is 5 requests per 60s window.
    for (let i = 1; i <= 6; i++) {
      await page.locator('input[name="email"]').fill('bruteforce@example.com')
      await page.locator('input[name="password"]').fill(`wrong-password-${i}`)
      
      const responsePromise = page.waitForResponse(r => r.request().method() === 'POST', { timeout: 15000 })
      
      await page.locator('button[type="submit"]').click()
      
      const response = await responsePromise
      
      // Wait for the button to be re-enabled indicating React has parsed the error
      await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 15000 })

      // Check if it's the exact rate limit rejection
      const errorLocator = page.locator('.text-destructive')
      const errorContent = await errorLocator.textContent()

      if (errorContent?.includes('Demasiados intentos')) {
        rateLimited = true
        break
      }
    }

    // We expect the server action to have successfully bounced the operation and rendered the rate limit string.
    expect(rateLimited).toBe(true)
  })
})
