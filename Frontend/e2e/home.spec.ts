import { expect, test } from '@playwright/test';

test.describe('Marketing homepage', () => {
  test('shows editorial hero and organize CTA', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', {
        name: /stay closed until you open the door/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /organize an event/i }).first(),
    ).toHaveAttribute('href', '/login');
  });

  test('shows guest and organizer sections with CTAs', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: /you're invited in telegram/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /you run the door from the web/i }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /join an event/i })).toHaveAttribute(
      'href',
      /https:\/\/t\.me\/[A-Za-z0-9_]+/,
    );
    await expect(page.getByRole('link', { name: /join an event/i })).not.toHaveAttribute(
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
    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: /privacy/i }),
    ).toHaveAttribute('href', '/privacy');
    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: /about/i }),
    ).toHaveAttribute('href', '/about');
    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: /contact/i }),
    ).toHaveAttribute('href', '/contact');
    await page.goto('/faq', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('button', { name: /how do guests get in/i }),
    ).toBeVisible();
  });

  test('about and contact pages render', async ({ page }) => {
    await page.goto('/about', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: /about eventer/i }),
    ).toBeVisible();
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: /contact us/i }),
    ).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^name/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
  });
});
