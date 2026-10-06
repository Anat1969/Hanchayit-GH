import { dim, need } from './dims.ts';
import { box, plot, sidewalk } from './common.ts';
import { EXEMPT_PLOT as E } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/**
 * בית בחצר: גדר וקיר תמך בגבול הצדי והאחורי, גדר פנימית בתחום המגרש,
 * ושער בכניסה. גדר בפטור אינה מותרת בחזית לרחוב.
 */
export const exemptFence: SceneDef = {
  id: 'exempt-fence',
  requires: ['exempt_fence_height_max', 'exempt_retaining_wall_height_max'],
  build(get) {
    const m = emptyModel('z');
    const fence = need(get('exempt_fence_height_max'), 'exempt_fence_height_max');
    const wall = need(get('exempt_retaining_wall_height_max'), 'exempt_retaining_wall_height_max');
    const inner = get('exempt_inner_fence_height_max');
    const gate = get('exempt_gate_height_max');
    const W = E.width / 2;
    const D = E.depth;
    plot(m, -W, W, -D, 0);
    m.surfaces.push(...sidewalk(E.width));
    const h = E.house;
    m.volumes.push(box('mass', -W + 1.5, -W + 1.5 + h.width, 0, h.height, -E.frontSetback - h.depth, -E.frontSetback));

    // גבול צדי מזרחי: גדר; גבול אחורי: קיר תמך
    const t = 0.1;
    m.volumes.push(box('mass', W - 2 * t, W, 0, fence.value, -D, -E.frontSetback));
    m.dims.push(dim(fence, [W, 0, -E.frontSetback - 2], [W, fence.value, -E.frontSetback - 2], [0.8, 0, 0]));
    m.volumes.push(box('mass', -W, W, 0, wall.value, -D, -D + 2 * t));
    m.dims.push(dim(wall, [-W, 0, -D], [-W, wall.value, -D], [-0.8, 0, 0]));

    if (inner) {
      const x = -W + 1.5 + h.width + 1.5;
      m.volumes.push(box('light', x - t / 2, x + t / 2, 0, inner.value, -D + 2, -E.frontSetback - 2));
      m.dims.push(dim(inner, [x, 0, -D + 4], [x, inner.value, -D + 4], [0, 0, 0.8]));
    }
    if (gate) {
      // שער בכניסה, בלי גדר בפטור לאורך החזית
      for (const x of [1.5, 4.5]) m.volumes.push(box('mass', x - 0.15, x + 0.15, 0, gate.value, -0.3, 0));
      m.volumes.push(box('light', 1.65, 4.35, 0.05, gate.value, -0.12, -0.08));
      m.dims.push(dim(gate, [4.65, 0, 0], [4.65, gate.value, 0], [0.6, 0, 0.3]));
    }
    m.labels.push({ text: 'בחזית לרחוב: לא בפטור', at: [-W / 2, 0.6, 0.2] });
    m.persons.push([W - 2, 0, 1.6]);
    m.trees.push([W - 3, 0, -D + 4]);
    return m;
  },
};
