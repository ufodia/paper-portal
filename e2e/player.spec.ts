import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { authoredProject } from './fixtures';

async function downloadGame(
  page: Page,
  info: TestInfo,
): Promise<{ filename: string; html: string }> {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download game', exact: true }).click();
  const download = await pending;
  const filename = info.outputPath('standalone-game.html');
  await download.saveAs(filename);
  return { filename, html: await readFile(filename, 'utf8') };
}

test('exported HTML runs offline and preserves hostile labels as project data', async ({
  page,
  browser,
}, info) => {
  await page.goto('/');
  const project = authoredProject('</script><img src=x onerror=alert(1)>');
  project.cards[0]!.label = '<svg onload=alert(2)>';
  await page.getByLabel('Import project', { exact: true }).setInputFiles({
    name: 'hostile.paper-portal.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(project)),
  });
  const game = await downloadGame(page, info);
  expect(game.html).not.toMatch(/<script\s+[^>]*src\s*=/i);
  const context = await browser.newContext({ offline: true });
  try {
    const standalone = await context.newPage();
    const errors: string[] = [];
    const requests: string[] = [];
    const dialogs: string[] = [];
    standalone.on('pageerror', (error) => errors.push(error.message));
    standalone.on('request', (request) => {
      if (/^https?:/.test(request.url())) requests.push(request.url());
    });
    standalone.on('dialog', async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });
    await standalone.goto(pathToFileURL(game.filename).href);
    await expect(
      standalone.getByRole('button', { name: 'Start camera', exact: true }),
    ).toBeVisible();
    const embedded = await standalone.locator('#paper-project').textContent();
    expect(JSON.parse(embedded!)).toEqual(project);
    await expect(standalone.locator('img[onerror], svg[onload]')).toHaveCount(0);
    expect(requests).toEqual([]);
    expect(dialogs).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('standalone simulator resets source hold state and completes the three-stage sample', async ({
  page,
  browser,
}, info) => {
  await page.goto('/');
  const game = await downloadGame(page, info);
  const context = await browser.newContext({ offline: true });
  try {
    const player = await context.newPage();
    await player.goto(pathToFileURL(game.filename).href);
    await player.getByLabel('Use simulator', { exact: true }).check();
    await player.getByLabel('Key visible', { exact: true }).check();
    await expect
      .poll(() =>
        player
          .locator('#hold-progress')
          .evaluate((element) => (element as HTMLProgressElement).value),
      )
      .toBeGreaterThan(0);
    await player.getByLabel('Use simulator', { exact: true }).uncheck();
    await expect(player.locator('#hold-progress')).toHaveJSProperty('value', 0);
    await expect(player.locator('#current-stage')).toHaveText('Wake the console');
    await player.getByLabel('Use simulator', { exact: true }).check();
    await expect(player.locator('#current-stage')).toHaveText('Align the sky keys', {
      timeout: 10_000,
    });
    await player.getByLabel('Sun visible', { exact: true }).check();
    await player.getByLabel('Moon visible', { exact: true }).check();
    await expect(player.locator('#current-stage')).toHaveText('Make the key disappear', {
      timeout: 10_000,
    });
    await expect(player.locator('#engine-message')).toContainText('Card recognized', {
      timeout: 10_000,
    });
    await player.getByLabel('Key visible', { exact: true }).uncheck();
    await expect(player.locator('#engine-message')).toContainText(
      'A small impossible door is open',
      { timeout: 10_000 },
    );
    await player.getByRole('button', { name: 'Restart game', exact: true }).click();
    await expect(player.locator('#current-stage')).toHaveText('Wake the console');
    await expect(player.locator('#hold-progress')).toHaveJSProperty('value', 0);
    await player.screenshot({ path: 'test-results/player-restarted.png', fullPage: true });
  } finally {
    await context.close();
  }
});

test('synthetic camera frames pass through real marker detection and tracks stop on request', async ({
  page,
  browser,
}, info) => {
  await page.goto('/');
  const marker = await page.evaluate(async () => (await import('/src/markers.ts')).markerSvg(1));
  const game = await downloadGame(page, info);
  const context = await browser.newContext({ offline: true });
  try {
    await context.addInitScript(
      ({ svg }) => {
        const state = window as typeof window & {
          cameraRequests?: number;
          cameraConstraints?: MediaStreamConstraints;
          syntheticStream?: MediaStream;
        };
        state.cameraRequests = 0;
        Object.defineProperty(navigator, 'mediaDevices', {
          configurable: true,
          value: {
            async getUserMedia(constraints: MediaStreamConstraints) {
              state.cameraRequests = (state.cameraRequests || 0) + 1;
              state.cameraConstraints = constraints;
              const image = new Image();
              image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
              await image.decode();
              const canvas = document.createElement('canvas');
              canvas.width = 640;
              canvas.height = 480;
              const drawing = canvas.getContext('2d')!;
              let frame = 0;
              const draw = () => {
                drawing.fillStyle = frame++ % 2 ? '#ffffff' : '#fefefe';
                drawing.fillRect(0, 0, 640, 480);
                drawing.drawImage(image, 180, 100, 280, 280);
                if (
                  !state.syntheticStream ||
                  state.syntheticStream
                    .getVideoTracks()
                    .some((track) => track.readyState === 'live')
                )
                  requestAnimationFrame(draw);
              };
              draw();
              state.syntheticStream = canvas.captureStream(20);
              return state.syntheticStream;
            },
          },
        });
      },
      { svg: marker },
    );
    const player = await context.newPage();
    await player.goto(pathToFileURL(game.filename).href);
    await expect(player.getByRole('button', { name: 'Start camera', exact: true })).toBeVisible();
    expect(
      await player.evaluate(
        () => (window as typeof window & { cameraRequests: number }).cameraRequests,
      ),
    ).toBe(0);
    await player.getByRole('button', { name: 'Start camera', exact: true }).click();
    await expect(player.locator('#current-stage')).toHaveText('Align the sky keys', {
      timeout: 15_000,
    });
    expect(
      await player.evaluate(
        () =>
          (window as typeof window & { cameraConstraints: MediaStreamConstraints })
            .cameraConstraints.audio,
      ),
    ).toBe(false);
    await player.screenshot({ path: 'docs/assets/player.png', fullPage: true });
    await player.getByRole('button', { name: 'Stop camera', exact: true }).click();
    await expect
      .poll(() =>
        player.evaluate(() =>
          (window as typeof window & { syntheticStream: MediaStream }).syntheticStream
            .getTracks()
            .every((track) => track.readyState === 'ended'),
        ),
      )
      .toBe(true);
    await expect(player.locator('#hold-progress')).toHaveJSProperty('value', 0);
  } finally {
    await context.close();
  }
});
