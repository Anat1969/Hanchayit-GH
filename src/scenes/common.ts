import { STREET } from './fixtures.ts';
import type { SceneModel, Surface, Volume } from './model.ts';

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


/** נפח לפי גבולות: x מ־x0 עד x1, y מ־y0 עד y1, z מ־z0 עד z1 */
export function box(kind: Volume['kind'], x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Volume {
  return {
    kind,
    center: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
    size: [Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)],
  };
}

/** מגרש מלבני: גוון ייעוד וגבול בקו כחול מקווקו */
export function plot(m: SceneModel, x0: number, x1: number, z0: number, z1: number, use: Surface['use'] = 'residential') {
  m.surfaces.push({ use, polygon: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y: 0 });
  m.lines.push({ kind: 'plot', points: [[x0, 0.01, z0], [x1, 0.01, z0], [x1, 0.01, z1], [x0, 0.01, z1], [x0, 0.01, z0]] });
}
