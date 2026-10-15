import { expect, test } from '@playwright/test';

test('console dashboard renders KPI cards', async ({ page }) => {
  await page.goto('/admin/dashboard');
  const main = page.locator('main');
  await expect(main.getByText('Applications', { exact: true }).first()).toBeVisible();
  await expect(main.getByText('Shortlist rate', { exact: true }).first()).toBeVisible();
});

test.describe('CMS editor (client-side only)', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('adds, moves and removes a block', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto('/admin/cms/home');

    // Count top-level blocks only: an open block's list fields have their own
    // "Move up" buttons, so counting buttons would drift as blocks open and close.
    const blocks = page.locator('main ol').first().locator(':scope > li');
    const label = (i: number) => blocks.nth(i).locator('span.font-semibold').first();
    const before = await blocks.count();
    expect(before).toBeGreaterThan(1);

    await page.getByRole('button', { name: '+ Add a block' }).click();
    await page.getByRole('button', { name: /^Text/ }).first().click();
    await expect(blocks).toHaveCount(before + 1);
    await expect(label(before)).toHaveText('Text');

    const firstLabel = await label(0).innerText();
    const secondLabel = await label(1).innerText();
    await blocks.nth(0).getByRole('button', { name: 'Move down', exact: true }).first().click();
    await expect(label(0)).toHaveText(secondLabel);
    await expect(label(1)).toHaveText(firstLabel);

    await blocks.nth(before).getByRole('button', { name: 'Remove', exact: true }).first().click();
    await expect(blocks).toHaveCount(before);
  });
});
