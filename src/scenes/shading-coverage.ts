import { dim, need, tag } from './dims.ts';
import { box, plot, sidewalk } from './common.ts';
import { SHADING as S, TREE } from './fixtures.ts';
import { emptyModel, type SceneDef, type Volume } from './model.ts';
import { coverage, shadowPolygon, sunDirection, type Box3 } from './sun.ts';

const toBox = (v: Volume): Box3 => ({
  min: [v.center[0] - v.size[0] / 2, v.center[1] - v.size[1] / 2, v.center[2] - v.size[2] / 2],
  max: [v.center[0] + v.size[0] / 2, v.center[1] + v.size[1] / 2, v.center[2] + v.size[2] / 2],
});

const pct = (r: number) => `${Math.round(r * 100)}%`;

/**
 * מגרש עם בניין, מצללה מעל אזור השהייה ועצים. הצל מחושב לפי מיקום השמש באשדוד
 * ב־21 ביוני, בשעות שבנתונים, והשיעור המחושב מוצג מול הנדרש.
 */
export const shadingCoverage: SceneDef = {
  id: 'shading-coverage',
  requires: ['shade_seating', 'shade_stay_areas', 'shade_open_space', 'shade_check_times'],
  controls(get) {
    const times = need(get('shade_check_times'), 'shade_check_times').param.value as string[];
    return [{ id: 'time', label: 'שעה ב־21 ביוני', options: times.map((t) => ({ value: t, label: t })) }];
  },
  build(get, controls) {
    const m = emptyModel('x');
    m.north = true;
    const seating = need(get('shade_seating'), 'shade_seating');
    const stay = need(get('shade_stay_areas'), 'shade_stay_areas');
    const open = need(get('shade_open_space'), 'shade_open_space');
    const times = need(get('shade_check_times'), 'shade_check_times').param.value as string[];
    const height = get('shade_element_height_min');
    const time = controls.time ?? times[0];

    const W = S.plot.width / 2;
    const D = S.plot.depth / 2;
    plot(m, -W, W, -D, D);
    m.surfaces.push(...sidewalk(S.plot.width).map((s) => ({ ...s, polygon: s.polygon.map(([x, z]) => [x, z + D] as [number, number]) })));

    const b = S.building;
    const bz1 = D - S.frontSetback;
    const bz0 = bz1 - b.depth;
    const building = box('mass', W - 1 - b.width, W - 1, 0, b.height, bz0, bz1);
    m.volumes.push(building);

    // מצללה בגובה המינימלי לאלמנטי הצללה
    const p = S.pergola;
    const h = height?.value ?? 3;
    const casters: Volume[] = [building];
    for (let x = p.x0; x < p.x1; x += p.slat + p.gap) {
      casters.push(box('light', x, Math.min(x + p.slat, p.x1), h, h + 0.15, p.z0, p.z1));
    }
    for (const x of [p.x0, p.x1 - 0.15]) for (const z of [p.z0, p.z1 - 0.15]) casters.push(box('light', x, x + 0.15, 0, h, z, z + 0.15));
    m.volumes.push(...casters.slice(1));
    const treeBoxes: Box3[] = S.trees.map(([x, , z]) => ({
      min: [x - TREE.crownRadius, TREE.trunkHeight, z - TREE.crownRadius],
      max: [x + TREE.crownRadius, TREE.trunkHeight + TREE.crownRadius * 1.8, z + TREE.crownRadius],
    }));
    m.trees.push(...S.trees);
    const bench = box('mass', S.bench.x0, S.bench.x1, 0, 0.45, S.bench.z0, S.bench.z1);
    m.volumes.push(bench);

    // הצל
    const sun = sunDirection(time);
    const boxes = [...casters.map(toBox), ...treeBoxes];
    if (sun[1] > 0) {
      for (const c of boxes) m.surfaces.push({ use: 'shadow', polygon: shadowPolygon(c, sun), y: 0.004 });
    }
    const step = S.grid;
    const inBuilding = (x: number, z: number) => {
      const bb = toBox(building);
      return x > bb.min[0] && x < bb.max[0] && z > bb.min[2] && z < bb.max[2];
    };
    const measured = {
      seating: coverage(S.bench, sun, boxes, step / 2),
      stay: coverage(S.stay, sun, boxes, step),
      open: coverage({ x0: -W, x1: W, z0: -D, z1: D }, sun, boxes, step, inBuilding),
    };

    m.lines.push({ kind: 'pencil', points: [[S.stay.x0, 0.02, S.stay.z0], [S.stay.x1, 0.02, S.stay.z0], [S.stay.x1, 0.02, S.stay.z1], [S.stay.x0, 0.02, S.stay.z1], [S.stay.x0, 0.02, S.stay.z0]] });
    m.tags.push(tag(stay, [S.stay.x1 + 2.5, 0.3, S.stay.z1 - 1], 'שהייה '));
    m.labels.push({ text: `מחושב ${pct(measured.stay)}`, at: [S.stay.x1 + 2.5, 0.3, S.stay.z1 + 0.2] });
    m.tags.push(tag(seating, [(S.bench.x0 + S.bench.x1) / 2, 0.8, S.bench.z1 + 1.8], 'ספסל '));
    m.labels.push({ text: `מחושב ${pct(measured.seating)}`, at: [(S.bench.x0 + S.bench.x1) / 2, 0.8, S.bench.z1 + 3] });
    m.tags.push(tag(open, [W - 5, 0.3, -D + 3], 'מגרש '));
    m.labels.push({ text: `מחושב ${pct(measured.open)}`, at: [W - 5, 0.3, -D + 4.2] });
    if (height) m.dims.push(dim(height, [p.x0, 0, p.z0], [p.x0, h, p.z0], [-1, 0, 0]));
    m.persons.push([S.stay.x0 + 2, 0, S.stay.z1 - 1]);
    return m;
  },
};
