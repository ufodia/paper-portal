import aruco from 'js-aruco2';
import type { Detection } from './core';

const dictionary = new aruco.AR.Dictionary('ARUCO');
const detector = new aruco.AR.Detector({ dictionaryName: 'ARUCO', maxHammingDistance: 0 });

/** Printed patterns and the detector use the same upstream dictionary. */
export function markerSvg(id: number): string {
  if (!Number.isInteger(id) || id < 0 || id > 7)
    throw new Error('Paper Portal marker ids are 0–7.');
  return dictionary
    .generateSVG(id)
    .replace(
      '<svg ',
      `<svg role="img" aria-label="ARUCO marker ${id}" shape-rendering="crispEdges" `,
    );
}

/** Real ARUCO recognition; coordinates and clockwise angles are in camera space. */
export function detectMarkers(image: {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}): Detection[] {
  if (
    !image ||
    !Number.isInteger(image.width) ||
    !Number.isInteger(image.height) ||
    image.width < 1 ||
    image.height < 1 ||
    image.width > 1920 ||
    image.height > 1080 ||
    image.width * image.height > 2_073_600 ||
    !(image.data instanceof Uint8ClampedArray) ||
    image.data.length !== image.width * image.height * 4
  )
    throw new Error('Use an RGBA camera frame no larger than 1920 × 1080.');
  return detector
    .detect(image)
    .slice(0, 64)
    .filter(
      (marker) =>
        marker.corners.length === 4 &&
        marker.corners.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    )
    .map((marker) => {
      const [a, b, c, d] = marker.corners;
      const length = (p: { x: number; y: number }, q: { x: number; y: number }) =>
        Math.hypot(p.x - q.x, p.y - q.y);
      return {
        id: marker.id,
        x: (a.x + b.x + c.x + d.x) / 4,
        y: (a.y + b.y + c.y + d.y) / 4,
        width: (length(a, b) + length(c, d)) / 2,
        height: (length(b, c) + length(d, a)) / 2,
        angle: ((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 360) % 360,
      };
    });
}
