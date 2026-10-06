import { need, tag } from './dims.ts';
import { box, plot, sidewalk } from './common.ts';
import { FLOOR, GARDEN as G } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/**
 * בניין מגורים בגובה המרבי שבו מותרות דירות גן. דירות הגן בעורף בלבד,
 * בשטח של עד השיעור המרבי מקומת הקרקע, ובמפלס גבוה מהפיתוח הגובל.
 */
export const gardenApartments: SceneDef = {
  id: 'garden-apartments',
  requires: ['garden_apt_floors_max'],
  build(get) {
    const m = emptyModel('x');
    const floors = need(get('garden_apt_floors_max'), 'garden_apt_floors_max');
    const ratio = get('garden_apt_ground_ratio_max');
    const W = G.width / 2;
    const h = floors.value * FLOOR.typicalHeight;
    const front = -5;
    const back = front - G.depth;

    plot(m, -W - 3, W + 3, back - G.gardenDepth - 2, 0);
    m.surfaces.push(...sidewalk(G.width + 6));
    m.volumes.push(box('mass', -W, W, 0, h, back, front));

    // דירות הגן: חלק מרוחב העורף, מוגבהות, עם חצרות
    const share = ratio?.value ?? 0.5;
    const gx1 = W;
    const gx0 = W - G.width * share;
    m.volumes.push(box('soil', gx0, gx1, 0, G.raise, back - G.gardenDepth, back));
    m.lines.push({ kind: 'pencil', points: [[gx0, FLOOR.typicalHeight, back - 0.01], [gx1, FLOOR.typicalHeight, back - 0.01]] });

    m.tags.push(tag(floors, [-W - 1, h + 1, front], 'עד '));
    if (ratio) m.tags.push(tag(ratio, [(gx0 + gx1) / 2, FLOOR.typicalHeight / 2, back - 0.3], 'דירות גן ', ' מקומת הקרקע'));
    m.labels.push(
      { text: 'חצרות בעורף, מפלס גבוה מהפיתוח', at: [(gx0 + gx1) / 2, G.raise + 0.4, back - G.gardenDepth / 2] },
      { text: 'ללא דירות גן בחזית לרחוב', at: [0, 1.5, front + 0.3] },
    );
    m.persons.push([0, 0, 1.6]);
    m.trees.push([-W + 3, 0, back - 4]);
    return m;
  },
};
