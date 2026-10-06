import { dim, tag } from './dims.ts';
import { box } from './common.ts';
import { EXEMPT_ROOF as R } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** גג שטוח: דוד וקולט במרחק ממעקה הגג, פאנלים סולאריים במרחק משולי הגג, ותורן אנטנה עם צלחת. */
export const exemptRooftop: SceneDef = {
  id: 'exempt-rooftop',
  build(get) {
    const m = emptyModel('x');
    const heater = get('exempt_solar_parapet_distance_min');
    const pv = get('exempt_pv_roof_edge_min');
    const mast = get('exempt_antenna_mast_height_max');
    const dish = get('exempt_dish_diameter_max');
    const W = R.width / 2;
    const D = R.depth;
    const h = R.height;
    m.surfaces.push({ use: 'residential', polygon: [[-W - 3, -D - 3], [W + 3, -D - 3], [W + 3, 3], [-W - 3, 3]], y: 0 });
    m.volumes.push(box('mass', -W, W, 0, h, -D, 0));
    for (const [z0, z1] of [[-0.2, 0], [-D, -D + 0.2]]) m.volumes.push(box('mass', -W, W, h, h + R.parapet, z0, z1));
    for (const [x0, x1] of [[-W, -W + 0.2], [W - 0.2, W]]) m.volumes.push(box('mass', x0, x1, h, h + R.parapet, -D, 0));

    if (heater) {
      const d = heater.value;
      const x0 = -W + 0.2 + d;
      const z1 = -0.2 - d;
      const t = R.heater;
      m.volumes.push(box('mass', x0, x0 + t.width, h, h + t.height, z1 - t.depth, z1));
      m.dims.push(dim(heater, [x0 + t.width / 2, h + 0.05, -0.2], [x0 + t.width / 2, h + 0.05, z1], [0, 0, 0]));
    }
    if (pv) {
      const e = pv.value;
      const x1 = W - 0.2 - e;
      const z0 = -D + 0.2 + e;
      const p = R.panel;
      for (let i = 0; i < 3; i++) {
        const x = x1 - i * (p.width + p.gap);
        m.volumes.push(box('dark', x - p.width, x, h + 0.2, h + 0.3, z0, z0 + p.depth));
      }
      m.dims.push(dim(pv, [x1, h + 0.05, z0 + p.depth / 2], [W - 0.2, h + 0.05, z0 + p.depth / 2], [0, 0, 0]));
    }
    if (mast) {
      const mx = 0;
      const mz = -D / 2;
      m.volumes.push(box('light', mx - 0.05, mx + 0.05, h, h + mast.value, mz - 0.05, mz + 0.05));
      m.dims.push(dim(mast, [mx, h, mz], [mx, h + mast.value, mz], [0.8, 0, 0]));
      if (dish) {
        const r = dish.value / 2;
        m.volumes.push(box('light', mx - r, mx + r, h + 2 - r, h + 2 + r, mz + 0.1, mz + 0.18));
        m.tags.push(tag(dish, [mx - r - 1, h + 2, mz], 'קוטר '));
      }
    }
    m.persons.push([W + 1.5, 0, 1]);
    return m;
  },
};
