import { STREET } from './fixtures.ts';
import type { Surface } from './model.ts';

/** מדרכה וכביש לאורך חזית המגרש, מגבול המגרש (z = 0) לכיוון דרום */
export function sidewalk(length: number, x0 = -length / 2): Surface[] {
  const x1 = x0 + length;
  const sw = STREET.sidewalkWidth;
  return [
    {
      use: 'road',
      polygon: [[x0, 0], [x1, 0], [x1, sw], [x0, sw]],
      y: 0,
      paving: { from: [x0, 0], to: [x1, 0], width: sw },
    },
    { use: 'road', polygon: [[x0, sw], [x1, sw], [x1, sw + STREET.roadWidth], [x0, sw + STREET.roadWidth]], y: -0.15 },
  ];
}
