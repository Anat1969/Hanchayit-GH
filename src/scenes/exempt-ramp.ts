import { dim, need, tag } from './dims.ts';
import { box, plot, sidewalk } from './common.ts';
import { EXEMPT_PLOT as E, EXEMPT_RAMP as R } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** כבש נגישות מהמדרכה לכניסה המוגבהת, בשיפוע המרבי ובהפרש הגובה המרבי, בתחום המגרש. */
export const exemptRamp: SceneDef = {
  id: 'exempt-ramp',
  requires: ['exempt_ramp_rise_max', 'exempt_ramp_slope_max'],
  build(get) {
    const m = emptyModel('z');
    const rise = need(get('exempt_ramp_rise_max'), 'exempt_ramp_rise_max');
    const slope = need(get('exempt_ramp_slope_max'), 'exempt_ramp_slope_max');
    const W = E.width / 2;
    plot(m, -W, W, -E.depth, 0);
    m.surfaces.push(...sidewalk(E.width));
    const h = E.house;
    const hz1 = -E.frontSetback;
    // הבית על מסד בגובה הפרש המפלסים
    m.volumes.push(box('mass', -W + 1, W - 1, 0, rise.value, hz1 - h.depth, hz1));
    m.volumes.push(box('mass', -W + 1, W - 1, rise.value, h.height, hz1 - h.depth, hz1 - 0.3));
    // משטח כניסה בפינת החזית, והכבש לאורך החזית בתוך המגרש
    const lx1 = W - 1;
    const lx0 = lx1 - R.landing;
    m.volumes.push(box('mass', lx0, lx1, 0, rise.value, hz1, hz1 + R.landing));
    const run = rise.value / slope.value;
    const x1 = lx0;
    const x0 = x1 - run;
    const z0 = hz1 + R.landing - R.width;
    const z1 = hz1 + R.landing;
    const angle = Math.atan2(rise.value, run);
    m.volumes.push({
      kind: 'mass',
      center: [(x0 + x1) / 2, rise.value / 2 - 0.08, (z0 + z1) / 2],
      size: [Math.hypot(run, rise.value), 0.15, R.width],
      rotation: [0, 0, angle],
    });
    m.dims.push(dim(rise, [lx1, 0, z1], [lx1, rise.value, z1], [0.6, 0, 0.3]));
    m.tags.push(tag(slope, [(x0 + x1) / 2, rise.value / 2 + 0.6, z1 + 0.3], 'שיפוע '));
    m.labels.push({ text: 'בגבולות המגרש בלבד', at: [(x0 + x1) / 2, 0.2, z1 + 1.2] });
    m.persons.push([x0 + 0.5, 0, z1 + 1.5]);
    return m;
  },
};
