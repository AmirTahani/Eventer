import { expect, test } from '@playwright/test';

test.describe('Login', () => {
  test('is Telegram-only (no JWT paste)', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(
      page.getByText(/use telegram login with the account that was invited/i),
    ).toBeVisible();
    await expect(page.getByLabel(/access token/i)).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /use access token/i }),
    ).toHaveCount(0);
    await expect(page.getByRole('link', { name: /back to home/i })).toHaveAttribute(
      'href',
      '/',
    );
  });

  test('loads Telegram widget script for the configured bot', async ({
    page,
  }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect
      .poll(async () =>
        page.locator('script[src*="telegram-widget.js"]').count(),
      )
      .toBeGreaterThan(0);
    const loginAttr = await page
      .locator('script[data-telegram-login]')
      .first()
      .getAttribute('data-telegram-login');
    expect(loginAttr).toBeTruthy();
    expect(loginAttr).not.toMatch(/REPLACE/i);
  });
});
