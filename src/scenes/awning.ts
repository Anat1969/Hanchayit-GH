import { dim, need } from './dims.ts';
import { box, sidewalk } from './common.ts';
import { AWNING as A } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** גגון מעל פתח: בולט עד המידה המרבית מכל צד של הפתח, ובגג בנסיגה מהמעקה בחזית הראשית. */
export const awning: SceneDef = {
  id: 'awning',
  requires: ['awning_side_overhang_max'],
  build(get) {
    const m = emptyModel('z');
    const side = need(get('awning_side_overhang_max'), 'awning_side_overhang_max');
    const roof = get('roof_awning_setback_min');
    const W = A.width / 2;
    m.surfaces.push(...sidewalk(A.width + 6));
    m.lines.push({ kind: 'plot', points: [[-W - 3, 0.01, 0], [W + 3, 0.01, 0]] });
    m.volumes.push(box('mass', -W, W, 0, A.height, -A.depth, 0));
    // מעקה הגג
    m.volumes.push(box('mass', -W, W, A.height, A.height + A.parapet, -0.2, 0));

    const o = A.opening;
    m.volumes.push(box('glass', -o.width / 2, o.width / 2, 0, o.height, -0.05, 0.01));
    const s = side.value;
    const ay = o.height + 0.3;
    m.volumes.push(box('light', -o.width / 2 - s, o.width / 2 + s, ay, ay + 0.1, 0, A.awningDepth));
    m.dims.push(dim(side, [o.width / 2, ay + 0.1, A.awningDepth], [o.width / 2 + s, ay + 0.1, A.awningDepth], [0, 0.5, 0]));
    m.labels.push({ text: 'ללא סגירת דפנות', at: [-o.width / 2 - s - 1.2, ay - 0.6, A.awningDepth / 2] });

    if (roof) {
      const r = roof.value;
      const ry = A.height;
      m.volumes.push(box('light', -3, 3, ry + 2.4, ry + 2.5, -r - 3, -r));
      for (const x of [-3, 2.9]) m.volumes.push(box('light', x, x + 0.1, ry, ry + 2.4, -r - 0.1, -r));
      m.dims.push(dim(roof, [W, ry + 2.5, 0], [W, ry + 2.5, -r], [1, 0, 0]));
    }
    m.persons.push([3, 0, 1.6]);
    return m;
  },
};
