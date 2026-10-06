import { dim, need } from './dims.ts';
import { box, sidewalk, ctx } from './common.ts';
import { EXEMPT_AWNING as A } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/**
 * חזית עם גגון מעל הדלת, סוכך מתקפל מעל חלון, ובחזית מסחרית סוכך לרחוב.
 * על הגג: גגון בנסיגה ממעקה הגג.
 */
export const exemptAwning: SceneDef = {
  id: 'exempt-awning',
  requires: ['exempt_canopy_projection_max'],
  build(get) {
    const m = emptyModel('x');
    const canopy = need(get('exempt_canopy_projection_max'), 'exempt_canopy_projection_max');
    const folded = get('exempt_folding_awning_folded_max');
    const shop = get('exempt_shop_awning_projection_max');
    const clear = get('exempt_shop_awning_clear_height_min');
    const roof = get('exempt_roof_canopy_setback_min');
    const W = A.width / 2;
    m.surfaces.push(...sidewalk(A.width + 4));
    m.volumes.push(ctx(box('mass', -W, W, 0, A.height, -A.depth, 0)));
    m.volumes.push(box('mass', -W, W, A.height, A.height + A.parapet, -0.2, 0));

    // גגון מעל הדלת
    const d = A.door;
    const dx = -W + 2.5;
    m.volumes.push(box('glass', dx - d.width / 2, dx + d.width / 2, 0, d.height, -0.05, 0.01));
    const cy = d.height + 0.25;
    m.volumes.push(box('light', dx - d.width, dx + d.width, cy, cy + 0.1, 0, canopy.value));
    m.dims.push(dim(canopy, [dx + d.width, cy + 0.1, 0], [dx + d.width, cy + 0.1, canopy.value], [0.6, 0, 0]));

    // סוכך מתקפל במצב מקופל מעל חלון
    const wx = 1;
    const w = A.window;
    m.volumes.push(box('glass', wx - w.width / 2, wx + w.width / 2, 0.9, 0.9 + w.height, -0.05, 0.01));
    if (folded) {
      const fy = 0.9 + w.height + 0.3;
      m.volumes.push(box('light', wx - w.width / 2, wx + w.width / 2, fy, fy + 0.3, 0, folded.value));
      m.dims.push(dim(folded, [wx + w.width / 2, fy + 0.3, 0], [wx + w.width / 2, fy + 0.3, folded.value], [0.4, 0.3, 0]));
    }

    // חזית מסחרית: סוכך פתוח לרחוב
    if (shop && clear) {
      const sx0 = 3;
      const sx1 = W - 0.5;
      m.volumes.push(box('glass', sx0, sx1, 0, 3, -0.05, 0.01));
      const y = clear.value;
      m.volumes.push(box('light', sx0, sx1, y, y + 0.12, 0, shop.value));
      m.dims.push(dim(shop, [sx1, y + 0.12, 0], [sx1, y + 0.12, shop.value], [0.6, 0, 0]));
      m.dims.push(dim(clear, [sx1, 0, shop.value], [sx1, y, shop.value], [0.6, 0, 0]));
    }
    if (roof) {
      const r = roof.value;
      const ry = A.height;
      m.volumes.push(box('light', -3, 1, ry + 2.4, ry + 2.5, -r - 2.5, -r));
      for (const x of [-3, 0.9]) m.volumes.push(box('light', x, x + 0.1, ry, ry + 2.4, -r - 0.1, -r));
      m.dims.push(dim(roof, [1, ry + 2.5, 0], [1, ry + 2.5, -r], [0.8, 0, 0]));
    }
    m.persons.push([dx + 2.2, 0, 1.4]);
    return m;
  },
};
