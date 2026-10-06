import { dim, need, tag } from './dims.ts';
import { box, plot, sidewalk, ctx } from './common.ts';
import { EXEMPT_PLOT as E, PARKING_CANOPY as P } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** סככת צל מאריג לחניה: צמודה לגבול הצדי, קונזולית בגב החניה, בלי עמודים בחזית. */
export const exemptParkingShade: SceneDef = {
  id: 'exempt-parking-shade',
  requires: ['exempt_parking_shade_area_max', 'exempt_parking_shade_height_max'],
  build(get) {
    const m = emptyModel('x');
    const area = need(get('exempt_parking_shade_area_max'), 'exempt_parking_shade_area_max');
    const height = need(get('exempt_parking_shade_height_max'), 'exempt_parking_shade_height_max');
    const W = E.width / 2;
    plot(m, -W, W, -E.depth, 0);
    m.surfaces.push(...sidewalk(E.width));
    const h = E.house;
    m.volumes.push(ctx(box('mass', -W + 1.5, -W + 1.5 + h.width, 0, h.height, -E.frontSetback - h.depth, -E.frontSetback)));

    const width = P.width;
    const depth = area.value / width;
    const x1 = W;
    const x0 = W - width;
    const y = height.value;
    // אריג הקירוי, וקונזולה בגב החניה
    m.volumes.push(box('light', x0, x1, y - 0.08, y, -depth, 0));
    m.volumes.push(box('mass', x1 - 0.2, x1, 0, y, -depth, -depth + 0.2));
    m.volumes.push(box('light', x0, x1 - 0.2, y - 0.2, y - 0.08, -depth, -depth + 0.15));
    m.tags.push(tag(area, [(x0 + x1) / 2, y + 0.4, -depth / 2], 'שטח '));
    m.dims.push(dim(height, [x0, 0, 0], [x0, y, 0], [-0.6, 0, 0.3]));
    m.labels.push({ text: 'ללא עמודים בחזית החניה', at: [(x0 + x1) / 2, 0.3, 0.8] });
    m.persons.push([x0 - 1.2, 0, 1.6]);
    return m;
  },
};
