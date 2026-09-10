import { expect, test } from '@playwright/test';

test.describe('Public page smoke', () => {
  test('payments return page renders without crashing', async ({ page }) => {
    await page.goto('/payments/return?payment_intent=pi_e2e', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('body')).toContainText(/payment/i);
  });

  test('payments cancel page renders without crashing', async ({ page }) => {
    await page.goto('/payments/cancel', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/cancel|payment/i);
  });
});
