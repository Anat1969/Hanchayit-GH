import { dim } from './dims.ts';
import { box, plot } from './common.ts';
import { FENCE_INTERNAL as F } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/**
 * שני מגרשים זה לצד זה ומגרש של מוסד ציבור מאחוריהם.
 * גדר בין המגרשים (פנימית, או בתעשייה גדר בגבול שאינו חזית) וגדר לגבול מוסד הציבור.
 */
export const fenceInternal: SceneDef = {
  id: 'fence-internal',
  build(get) {
    const m = emptyModel('z');
    const internal = get('fence_internal_height_max') ?? get('industrial_internal_fence_height_max');
    const institution = get('fence_public_institution_height_max');
    const W = F.plotWidth;
    const D = F.plotDepth;
    const t = F.thickness / 2;

    plot(m, -W, 0, -D, 0);
    plot(m, 0, W, -D, 0);
    plot(m, -W, W, -D - 12, -D, 'public');
    m.labels.push({ text: 'מוסד ציבור', at: [0, 0.1, -D - 6] });

    if (internal) {
      const h = internal.value;
      m.volumes.push(box('mass', -t, t, 0, h, -D, 0));
      m.dims.push(dim(internal, [0, 0, -2], [0, h, -2], [0, 0, 1]));
    }
    if (institution) {
      const h = institution.value;
      m.volumes.push(box('mass', -W, W, 0, h, -D - t, -D + t));
      m.dims.push(dim(institution, [W, 0, -D], [W, h, -D], [1, 0, 0]));
    }
    m.persons.push([-W / 2, 0, -D / 2]);
    m.trees.push([W / 2, 0, -D / 2], [-W / 2, 0, -D - 6]);
    return m;
  },
};
