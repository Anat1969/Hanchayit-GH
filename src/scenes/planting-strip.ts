import { dim, need } from './dims.ts';
import { box, plot, sidewalk } from './common.ts';
import { PLANTING as P } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** מגרש עם רצועת גינון לאורך הגבול. ההנחיה לא קובעת לאורך אילו גבולות, ולכן הפירוש מוצג. */
export const plantingStrip: SceneDef = {
  id: 'planting-strip',
  requires: ['planting_strip_width'],
  build(get) {
    const m = emptyModel('x');
    const strip = need(get('planting_strip_width'), 'planting_strip_width');
    const w = strip.value;
    const W = P.plot.width / 2;
    const D = P.plot.depth;
    plot(m, -W, W, -D, 0);
    m.surfaces.push(...sidewalk(P.plot.width));
    m.volumes.push(box('soil', -W, W, 0, 0.05, -w, 0));
    m.volumes.push(box('mass', -P.building.width / 2, P.building.width / 2, 0, P.building.height, -D + 8, -D + 8 + P.building.depth));
    for (let x = -W + 3; x < W; x += 6) m.trees.push([x, 0, -w / 2]);
    m.dims.push(dim(strip, [W, 0.05, 0], [W, 0.05, -w], [1, 0, 0]));
    m.notes.push({ text: 'פירוש לבחינה: הרצועה מוצגת לאורך החזית הראשית וברוחב מינימלי. ההנחיה לא קובעת לאורך אילו גבולות.' });
    m.persons.push([W - 3, 0, 1.6]);
    return m;
  },
};
