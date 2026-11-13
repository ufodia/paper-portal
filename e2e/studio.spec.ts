import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('authored changes save, reopen, print real cards, and launch the embedded player', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/');
  await page.getByLabel('Project name', { exact: true }).fill('Paper laboratory');
  await page.getByLabel('Project name', { exact: true }).press('Tab');
  await page.getByLabel('Card 0 label', { exact: true }).fill('Signal');
  await page.getByLabel('Card 0 label', { exact: true }).press('Tab');
  await page.getByLabel('Stage title', { exact: true }).fill('Open the hatch');
  await page.getByLabel('Stage title', { exact: true }).press('Tab');
  await page.getByLabel('Hold duration in milliseconds', { exact: true }).fill('800');
  await page.getByLabel('Hold duration in milliseconds', { exact: true }).press('Tab');
  const saved = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const downloaded = await saved;
  const json = await readFile((await downloaded.path())!, 'utf8');
  const project = JSON.parse(json);
  expect(project.name).toBe('Paper laboratory');
  expect(project.cards[0].label).toBe('Signal');
  expect(project.stages[0].title).toBe('Open the hatch');
  expect(project.holdMs).toBe(800);
  await page.getByRole('button', { name: 'Load sample', exact: true }).click();
  await page
    .getByLabel('Import project', { exact: true })
    .setInputFiles({
      name: 'saved.paper-portal.json',
      mimeType: 'application/json',
      buffer: Buffer.from(json),
    });
  await expect(page.getByLabel('Project name', { exact: true })).toHaveValue('Paper laboratory');
  await expect(page.getByLabel('Card 0 label', { exact: true })).toHaveValue('Signal');
  await expect(page.getByTestId('stage-preview')).toContainText('Open the hatch');
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Print cards', exact: true }).click();
  const popup = await popupPromise;
  await expect(popup.getByRole('heading', { name: 'Paper cards, real controls.' })).toBeVisible();
  for (const id of [0, 1, 2])
    await expect(popup.getByRole('img', { name: `ARUCO marker ${id}`, exact: true })).toBeVisible();
  await expect(popup.locator('.card')).toHaveCount(3);
  await expect(popup.getByText('Signal', { exact: true })).toBeVisible();
  await popup.close();
  await page.getByRole('button', { name: 'Play puzzle', exact: true }).click();
  await expect(page.getByTestId('player-frame')).toBeVisible();
  await expect(
    page
      .frameLocator('[data-testid="player-frame"]')
      .getByRole('button', { name: 'Start camera', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close player', exact: true }).click();
  await expect(page.getByTestId('player-frame')).toHaveCount(0);
  await page.getByRole('button', { name: 'Load sample', exact: true }).click();
  await page.screenshot({ path: 'docs/assets/workspace.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/mobile-studio.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('invalid imported projects produce a useful error and preserve the current story', async ({
  page,
}) => {
  await page.goto('/');
  const before = await page.getByLabel('Project name', { exact: true }).inputValue();
  await page.getByLabel('Import project', { exact: true }).setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":999,"name":"unsupported"}'),
  });
  await expect(page.getByRole('status')).toContainText(/version 1|valid|project/i);
  await expect(page.getByLabel('Project name', { exact: true })).toHaveValue(before);
  await expect(page.getByRole('button', { name: 'Download game', exact: true })).toBeEnabled();
});
