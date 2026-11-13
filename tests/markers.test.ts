import { describe, expect, it } from 'vitest';
import { detectMarkers, markerSvg } from '../src/markers';

/** Rasterize the actual upstream SVG rectangles onto an opaque white bitmap. */
function rasterMarker(id: number, clockwise = 0) {
  const size = 360;
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  const svg = markerSvg(id);
  const view = svg.match(/viewBox="0 0 (\d+) (\d+)"/)!;
  const units = Number(view[1]);
  const scale = 28;
  const offset = (size - units * scale) / 2;
  for (const match of svg.matchAll(
    /<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="(white|black)"\/>/g,
  )) {
    const x0 = offset + Number(match[1]) * scale;
    const y0 = offset + Number(match[2]) * scale;
    const width = Number(match[3]) * scale;
    const height = Number(match[4]) * scale;
    const color = match[5] === 'white' ? 255 : 0;
    for (let y = y0; y < y0 + height; y++)
      for (let x = x0; x < x0 + width; x++) {
        const i = (y * size + x) * 4;
        data[i] = color;
        data[i + 1] = color;
        data[i + 2] = color;
      }
  }
  if (!clockwise) return { data, width: size, height: size };
  const rotated = new Uint8ClampedArray(data.length);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let rx = x;
      let ry = y;
      for (let i = 0; i < clockwise / 90; i++) [rx, ry] = [size - 1 - ry, rx];
      rotated.set(data.subarray((y * size + x) * 4, (y * size + x) * 4 + 4), (ry * size + rx) * 4);
    }
  return { data: rotated, width: size, height: size };
}

describe('real upstream ARUCO recognition', () => {
  it.each([0, 1, 2, 3, 4, 5, 6, 7])('detects actual generated marker %i', (id) => {
    const detections = detectMarkers(rasterMarker(id));
    expect(detections).toHaveLength(1);
    expect(detections[0]!.id).toBe(id);
    expect(detections[0]!.width).toBeGreaterThan(150);
    expect(Math.min(detections[0]!.angle, 360 - detections[0]!.angle)).toBeLessThan(2);
  });
  it.each([90, 180, 270])('recovers clockwise rotation %i', (angle) => {
    const detection = detectMarkers(rasterMarker(1, angle))[0]!;
    expect(detection.id).toBe(1);
    expect(detection.angle).toBeCloseTo(angle, 0);
  });
  it('returns no marker for a blank real bitmap and rejects malformed image data', () => {
    const data = new Uint8ClampedArray(100 * 100 * 4).fill(255);
    expect(detectMarkers({ data, width: 100, height: 100 })).toEqual([]);
    expect(() => detectMarkers({ data, width: 101, height: 100 })).toThrow(/RGBA/);
    expect(() => markerSvg(8)).toThrow(/0–7/);
  });
});
