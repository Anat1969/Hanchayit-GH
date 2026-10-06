import { SUN } from './fixtures.ts';
import type { Vec3 } from './model.ts';

const rad = (d: number) => (d * Math.PI) / 180;

/**
 * כיוון השמש (וקטור יחידה אל השמש) בשעון מקומי, לפי נוסחאות NOAA המקורבות.
 * x מזרח, y למעלה, z דרום.
 */
export function sunDirection(clock: string, opts = SUN): Vec3 {
  const [hh, mm] = clock.split(':').map(Number);
  const n = opts.dayOfYear;
  const decl = rad(23.44) * Math.sin((2 * Math.PI * (284 + n)) / 365);
  const b = (2 * Math.PI * (n - 81)) / 364;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  const solar = hh + mm / 60 + (4 * opts.longitude - 60 * opts.utcOffset + eot) / 60;
  const h = rad(15 * (solar - 12));
  const lat = rad(opts.latitude);
  const sinEl = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(h);
  const el = Math.asin(sinEl);
  // אזימוט מצפון בכיוון השעון
  const az = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat)) + Math.PI;
  return [Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az)];
}

export interface Box3 {
  min: Vec3;
  max: Vec3;
}

/** האם הקרן מהנקודה לכיוון השמש פוגעת בתיבה (מבחן לוחות) */
export function shaded(p: Vec3, sun: Vec3, boxes: Box3[]): boolean {
  for (const b of boxes) {
    let t0 = 0.001;
    let t1 = Infinity;
    let hit = true;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(sun[i]) < 1e-9) {
        if (p[i] < b.min[i] || p[i] > b.max[i]) { hit = false; break; }
        continue;
      }
      let a = (b.min[i] - p[i]) / sun[i];
      let c = (b.max[i] - p[i]) / sun[i];
      if (a > c) [a, c] = [c, a];
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, c);
      if (t0 > t1) { hit = false; break; }
    }
    if (hit) return true;
  }
  return false;
}

/** שיעור ההצללה של מלבן על הקרקע, בדגימה על רשת */
export function coverage(area: { x0: number; x1: number; z0: number; z1: number }, sun: Vec3, boxes: Box3[], step: number, exclude?: (x: number, z: number) => boolean): number {
  let total = 0;
  let dark = 0;
  for (let x = area.x0 + step / 2; x < area.x1; x += step) {
    for (let z = area.z0 + step / 2; z < area.z1; z += step) {
      if (exclude?.(x, z)) continue;
      total++;
      if (shaded([x, 0.01, z], sun, boxes)) dark++;
    }
  }
  return total ? dark / total : 0;
}

/** הצל של תיבה על הקרקע: המעטפת הקמורה של הטלת הפינות */
export function shadowPolygon(b: Box3, sun: Vec3): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (const x of [b.min[0], b.max[0]]) for (const y of [b.min[1], b.max[1]]) for (const z of [b.min[2], b.max[2]]) {
    const t = y / sun[1];
    pts.push([x - sun[0] * t, z - sun[2] * t]);
  }
  pts.sort((a, c) => a[0] - c[0] || a[1] - c[1]);
  const cross = (o: number[], a: number[], c: number[]) => (a[0] - o[0]) * (c[1] - o[1]) - (a[1] - o[1]) * (c[0] - o[0]);
  const lower: Array<[number, number]> = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Array<[number, number]> = [];
  for (const p of [...pts].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
