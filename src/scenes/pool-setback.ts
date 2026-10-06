import { dim, need } from './dims.ts';
import { box, plot, sidewalk, ctx } from './common.ts';
import { POOL as P } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

const KEYS = { private: 'pool_setback_private', shared: 'pool_setback_shared', commercial: 'pool_setback_commercial' } as const;

/** בריכה בחצר האחורית, במרחק המזערי מגבול המגרש לפי סוג הבריכה. */
export const poolSetback: SceneDef = {
  id: 'pool-setback',
  requires: ['pool_setback_private', 'pool_setback_shared', 'pool_setback_commercial'],
  controls: () => [
    {
      id: 'kind',
      label: 'סוג הבריכה',
      options: [
        { value: 'private', label: 'פרטית' },
        { value: 'shared', label: 'משותפת' },
        { value: 'commercial', label: 'מסחרית' },
      ],
    },
  ],
  build(get, controls) {
    const m = emptyModel('z');
    const kind = (controls.kind ?? 'private') as keyof typeof KEYS;
    const setback = need(get(KEYS[kind]), KEYS[kind]);
    const W = P.plot.width / 2;
    const D = P.plot.depth;
    plot(m, -W, W, -D, 0);
    m.surfaces.push(...sidewalk(P.plot.width));
    m.volumes.push(ctx(box('mass', -P.building.width / 2, P.building.width / 2, 0, P.building.height, -6 - P.building.depth, -6)));

    // הבריכה בפינה האחורית, צמודה למרחק המזערי מהגבול הצדי
    const s = setback.value;
    const x1 = W - s;
    const x0 = x1 - P.pool.width;
    const z0 = -D + 3;
    const z1 = z0 + P.pool.length;
    m.volumes.push(box('water', x0, x1, -P.pool.depth, 0.02, z0, z1));
    m.dims.push(dim(setback, [x1, 0.05, (z0 + z1) / 2], [W, 0.05, (z0 + z1) / 2], [0, 0, 0]));
    m.labels.push({ text: 'חזית אחורית', at: [0, 0.2, -D + 1] });
    m.persons.push([x0 - 1, 0, z1 - 1]);
    m.trees.push([-W + 3, 0, -D + 4]);
    return m;
  },
};
