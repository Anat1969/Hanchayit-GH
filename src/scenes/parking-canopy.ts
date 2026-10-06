import { need, tag } from './dims.ts';
import { box, plot, sidewalk, ctx } from './common.ts';
import { PARKING_CANOPY as P } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** בית צמוד קרקע עם קירוי חניה קל ושטוח בצמוד לגדר. שטח הקירוי בגודל המרבי. */
export const parkingCanopy: SceneDef = {
  id: 'parking-canopy',
  requires: ['parking_canopy_area_max'],
  build(get) {
    const m = emptyModel('x');
    const area = need(get('parking_canopy_area_max'), 'parking_canopy_area_max');
    const W = P.plot.width / 2;
    plot(m, -W, W, -P.plot.depth, 0);
    m.surfaces.push(...sidewalk(P.plot.width));

    const h = P.house;
    m.volumes.push(ctx(box('mass', -W + 1, -W + 1 + h.width, 0, h.height, -P.plot.depth + 4, -P.plot.depth + 4 + h.depth)));
    // קירוי: רוחב קבוע ועומק לפי השטח המרבי
    const depth = area.value / P.width;
    const x1 = W - 0.5;
    const x0 = x1 - P.width;
    m.volumes.push(box('light', x0, x1, P.height - 0.12, P.height, -depth, 0));
    for (const x of [x0 + 0.1, x1 - 0.1]) m.volumes.push(box('light', x - 0.06, x + 0.06, 0, P.height - 0.12, -depth + 0.1, -depth + 0.22));
    // הגדר לרחוב משני צידי הכניסה לחניה
    m.volumes.push(box('mass', -W, x0, 0, 1.2, -0.2, 0));
    m.tags.push(tag(area, [(x0 + x1) / 2, P.height + 0.3, -depth / 2], 'שטח '));
    m.labels.push({ text: 'ניקוז לכיוון המגרש', at: [(x0 + x1) / 2, P.height + 0.3, -depth - 1.2] });
    m.persons.push([x0 - 1, 0, 1.5]);
    return m;
  },
};
