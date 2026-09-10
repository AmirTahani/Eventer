import { expect, test, type Page } from '@playwright/test';

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('eventer.accessToken', 'e2e-jwt');
    window.localStorage.setItem(
      'eventer.user',
      JSON.stringify({
        id: 'e2e-user',
        telegramUserId: '1',
        firstName: 'E2E',
        status: 'APPROVED',
        roles: ['ADMIN', 'ORGANIZER', 'VOUCHER'],
      }),
    );
  });
}

test.describe('Dashboard shell (authenticated UI)', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page);
  });

  test('home overview greets the user and links to modules', async ({
    page,
  }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/E2E|Overview|Welcome/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /events/i }).first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: /invitations/i }).first(),
    ).toBeVisible();
  });

  test('navigates to invitations from overview', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /invitations/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/invitations/);
  });

  test('events page loads', async ({ page }) => {
    await page.goto('/dashboard/events', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/dashboard\/events/);
    await expect(page.locator('body')).toContainText(/event/i);
  });

  test('theme toggle flips color scheme', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const toggle = page.getByRole('checkbox', { name: /toggle dark mode/i });
    await expect(toggle).toBeVisible();
    const before = await page.evaluate(
      () => document.documentElement.style.colorScheme,
    );
    await toggle.click({ force: true });
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.style.colorScheme),
      )
      .not.toBe(before);
  });
});
