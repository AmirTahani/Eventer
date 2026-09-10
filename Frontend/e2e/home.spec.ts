import { expect, test } from '@playwright/test';

test.describe('Marketing homepage', () => {
  test('shows invite-only hero and primary CTAs', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', {
        name: /private events, from invite to the door/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /organizer sign in/i })).toHaveAttribute(
      'href',
      '/login',
    );
    await expect(page.getByRole('link', { name: /telegram bot/i })).toHaveAttribute(
      'href',
      /https:\/\/t\.me\/[A-Za-z0-9_]+/,
    );
    await expect(page.getByRole('link', { name: /telegram bot/i })).not.toHaveAttribute(
      'href',
      /REPLACE/i,
    );
  });

  test('how-it-works anchor scrolls to steps', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /how it works/i }).click();
    await expect(page).toHaveURL(/#how-it-works/);
    await expect(
      page.getByRole('heading', { name: /three steps/i }),
    ).toBeVisible();
  });
});
