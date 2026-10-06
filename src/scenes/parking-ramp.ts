import { dim, need, tag } from './dims.ts';
import { box, plot, sidewalk } from './common.ts';
import { RAMP as R } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** רמפת ירידה לחניון: מישור במפלס המדרכה עד המרחק הנדרש מגבול המגרש, ורק אז השיפוע. */
export const parkingRamp: SceneDef = {
  id: 'parking-ramp',
  requires: ['ramp_start_setback_min'],
  build(get) {
    const m = emptyModel('x');
    const setback = need(get('ramp_start_setback_min'), 'ramp_start_setback_min');
    const underground = get('underground_parking_ratio_min');
    const s = setback.value;
    const W = R.plot.width / 2;
    plot(m, -W, W, -R.plot.depth, 0);
    m.surfaces.push(...sidewalk(R.plot.width));

    const x1 = W - 1;
    const x0 = x1 - R.width;
    // קטע מישורי בכניסה, בהמשך המדרכה
    m.volumes.push(box('mass', x0, x1, -0.2, 0, -s, 0));
    // הרמפה: לוח משופע, מתחיל בסוף הקטע המישורי
    const angle = Math.atan2(R.depth, R.length);
    const run = Math.hypot(R.length, R.depth);
    m.volumes.push({
      kind: 'mass',
      center: [(x0 + x1) / 2, -R.depth / 2 - 0.1, -s - R.length / 2],
      size: [R.width, 0.2, run],
      rotation: [-angle, 0, 0],
    });
    for (const x of [x0 - 0.1, x1 + 0.1]) m.volumes.push(box('mass', x - 0.1, x + 0.1, -R.depth, 0.9, -s - R.length, -s));
    m.volumes.push(box('mass', -W + 1, -W + 1 + R.building.width, 0, R.building.height, -R.plot.depth + 4, -R.plot.depth + 4 + R.building.depth));

    m.dims.push(dim(setback, [x1, 0, 0], [x1, 0, -s], [1.2, 0, 0]));
    m.labels.push({ text: 'מדרכה רציפה, בלי אבן שפה ניצבת', at: [(x0 + x1) / 2, 0.2, 1.8] });
    m.labels.push({ text: 'תחילת השיפוע', at: [(x0 + x1) / 2, 0.3, -s] });
    if (underground) m.tags.push(tag(underground, [(x0 + x1) / 2, -R.depth, -s - R.length - 2], 'חניה תת־קרקעית '));
    m.persons.push([x0 - 1.5, 0, 1.6]);
    return m;
  },
};
