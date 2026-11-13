import { test, expect } from '@playwright/test';

test('printed marker SVGs are recognized by the real detector, including clockwise rotation', async ({
  page,
}) => {
  await page.goto('/');
  const observed = await page.evaluate(async () => {
    const { markerSvg, detectMarkers } = await import('/src/markers.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 300;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (const id of [0, 1, 2]) {
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markerSvg(id))}`;
      await image.decode();
      context.save();
      context.translate(id * 300 + 150, 150);
      if (id === 1) context.rotate(Math.PI / 2);
      context.drawImage(image, -100, -100, 200, 200);
      context.restore();
    }
    return detectMarkers(context.getImageData(0, 0, canvas.width, canvas.height));
  });
  expect(observed.map((marker) => marker.id).sort()).toEqual([0, 1, 2]);
  for (const marker of observed) {
    expect(marker.width).toBeGreaterThan(100);
    expect(marker.height).toBeGreaterThan(100);
    expect(marker.x).toBeCloseTo(marker.id * 300 + 150, -1);
    expect(marker.y).toBeCloseTo(150, -1);
    const expectedAngle = marker.id === 1 ? 90 : 0;
    const angleError = Math.abs(((marker.angle - expectedAngle + 540) % 360) - 180);
    expect(angleError).toBeLessThan(5);
  }
});
