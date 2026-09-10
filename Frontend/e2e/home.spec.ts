import { expect, test } from '@playwright/test';

test.describe('Marketing homepage', () => {
  test('shows closed-room hero and primary CTAs', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', {
        name: /the room stays closed until you open it/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /hosts sign in/i }).first()).toHaveAttribute(
      'href',
      '/login',
    );
    await expect(page.getByRole('link', { name: /open telegram/i })).toHaveAttribute(
      'href',
      /https:\/\/t\.me\/[A-Za-z0-9_]+/,
    );
    await expect(page.getByRole('link', { name: /open telegram/i })).not.toHaveAttribute(
      'href',
      /REPLACE/i,
    );
  });

  test('how-it-works anchor scrolls to steps', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /how it works/i }).first().click();
    await expect(page).toHaveURL(/#how-it-works/);
    await expect(
      page.getByRole('heading', { name: /invite, register, arrive/i }),
    ).toBeVisible();
  });

  test('public trust pages are linked from the footer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('contentinfo').getByRole('link', { name: /privacy/i })).toHaveAttribute(
      'href',
      '/privacy',
    );
    await page.goto('/faq', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: /how do guests get in/i }),
    ).toBeVisible();
  });
});
