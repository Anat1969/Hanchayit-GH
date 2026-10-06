import { largerOf } from '../rules/derive.ts';
import { dim, need, tag } from './dims.ts';
import { PERGOLA as P } from './fixtures.ts';
import { emptyModel, type SceneDef, type Volume } from './model.ts';

/**
 * מצללה בחצר האחורית, צמודה לבניין ובולטת מעבר לקו הבניין.
 * הבליטה היא חלק מהמרחק בין קו הבניין לגבול המגרש (param.of = building_line_distance).
 */
export const pergolaGround: SceneDef = {
  id: 'pergola-ground',
  requires: ['pergola_setback_projection_max', 'pergola_area_max_abs', 'pergola_area_max_ratio'],
  build(get) {
    const m = emptyModel('x');
    const projection = need(get('pergola_setback_projection_max'), 'pergola_setback_projection_max');
    const areaAbs = need(get('pergola_area_max_abs'), 'pergola_area_max_abs');
    const areaRatio = need(get('pergola_area_max_ratio'), 'pergola_area_max_ratio');
    const open = get('pergola_open_ratio_min');

    const W = P.plot.width / 2;
    const D = P.plot.depth / 2;
    // החצר האחורית בדרום (z חיובי), לכיוון הצופה באקסונומטריה
    const rearBoundary = D;
    const buildingLine = rearBoundary - P.rearSetback;
    const b = P.building;
    const buildingRear = buildingLine;
    const buildingFront = buildingRear - b.depth;

    m.surfaces.push({ use: 'residential', polygon: [[-W, -D], [W, -D], [W, D], [-W, D]], y: 0 });
    m.lines.push({ kind: 'plot', points: [[-W, 0.01, -D], [W, 0.01, -D], [W, 0.01, D], [-W, 0.01, D], [-W, 0.01, -D]] });
    m.lines.push({ kind: 'buildingLine', points: [[-W, 0.02, buildingLine], [W, 0.02, buildingLine]], label: 'קו בניין' });
    m.volumes.push({ kind: 'mass', center: [0, b.height / 2, (buildingRear + buildingFront) / 2], size: [b.width, b.height, b.depth] });

    // עומק המצללה: עד הבליטה המותרת, ושטח עד הגדול מבין הערך המוחלט והחלק היחסי של הגינה הפנויה
    const freeGarden = P.plot.width * P.plot.depth - b.width * b.depth;
    const maxArea = largerOf(areaAbs.value, areaRatio.value, freeGarden);
    const beyond = projection.value * P.rearSetback;
    const depth = Math.min(beyond, maxArea / P.width);
    const z1 = buildingRear;
    const z0 = z1 + depth;
    const zc = (z0 + z1) / 2;
    const h = P.height;
    const x0 = -P.width / 2;

    const parts: Volume[] = [];
    for (const px of [x0, -x0]) {
      parts.push({ kind: 'light', center: [px, h / 2, z0 - P.postSize / 2], size: [P.postSize, h, P.postSize] });
    }
    parts.push({ kind: 'light', center: [0, h - P.beamDepth / 2, z0 - P.postSize / 2], size: [P.width, P.beamDepth, P.postSize] });
    // קורות ההצללה: הרווחים ביניהן הם החלק הפתוח של משטח ההצללה
    const openRatio = open?.value ?? 0.5;
    const slat = 0.12;
    const pitch = slat / (1 - openRatio);
    const count = Math.floor(P.width / pitch);
    for (let i = 0; i <= count; i++) {
      const x = x0 + Math.min(i * pitch, P.width);
      parts.push({ kind: 'light', center: [x, h + 0.06, zc], size: [slat, 0.12, depth] });
    }
    m.volumes.push(...parts);

    m.dims.push(dim(projection, [-x0, 0.02, buildingLine], [-x0, 0.02, buildingLine + beyond], [1.2, 0, 0]));
    // תוויות השטח מחוץ למצללה, אחת מעל השנייה בתכנית
    const tagX = x0 - 4;
    m.tags.push(tag(areaAbs, [tagX, h + 1.6, zc - 0.8], 'שטח '));
    const ratioTag = tag(areaRatio, [tagX, h + 0.6, zc + 0.8], 'או ');
    m.tags.push({ ...ratioTag, label: `${ratioTag.label} מהגינה, לפי הגדול` });
    if (open) m.tags.push(tag(open, [0, h + 0.3, zc], 'מרווחים '));
    m.persons.push([-x0 + 2, 0, zc + 1]);
    m.trees.push([-W + 3, 0, D - 2.5]);
    return m;
  },
};
