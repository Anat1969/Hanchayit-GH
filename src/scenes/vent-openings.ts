import { dim, need } from './dims.ts';
import { box, sidewalk } from './common.ts';
import { VENT as V } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** פתחי אוורור של חניון: בחזית האחורית בגובה הפיתוח, או בחזית לרחוב רק מעל הגובה המותר. */
export const ventOpenings: SceneDef = {
  id: 'vent-openings',
  requires: ['vent_height_min_if_public'],
  controls: () => [
    {
      id: 'facing',
      label: 'מיקום הפתחים',
      options: [
        { value: 'rear', label: 'חזית אחורית' },
        { value: 'street', label: 'פונה לרחוב' },
      ],
    },
  ],
  build(get, controls) {
    const m = emptyModel('z');
    const min = need(get('vent_height_min_if_public'), 'vent_height_min_if_public');
    const street = controls.facing === 'street';
    const W = V.width / 2;
    m.surfaces.push(...sidewalk(V.width + 6));
    m.surfaces.push({ use: 'residential', polygon: [[-W - 3, -V.depth - 6], [W + 3, -V.depth - 6], [W + 3, 0], [-W - 3, 0]], y: 0 });
    m.lines.push({ kind: 'plot', points: [[-W - 3, 0.01, 0], [W + 3, 0.01, 0]] });
    m.volumes.push(box('mass', -W, W, 0, V.height, -V.depth - 2, -2));

    const v = V.vent;
    if (street) {
      // בחזית לרחוב: מעל הגובה המזערי מפני הפיתוח הציבורי
      const y0 = min.value;
      for (const x of [-4, 0, 4]) m.volumes.push(box('dark', x - v.width / 2, x + v.width / 2, y0, y0 + v.height, -2, -1.95));
      m.dims.push(dim(min, [W, 0, -2], [W, y0, -2], [1, 0, 0]));
      m.labels.push({ text: 'רק כשאין אפשרות אחרת', at: [0, y0 + v.height + 0.6, -1.9] });
    } else {
      // בחזית האחורית: באדניות מגוננות מדורגות
      const z = -V.depth - 2;
      for (const x of [-4, 0, 4]) {
        m.volumes.push(box('dark', x - v.width / 2, x + v.width / 2, 0.2, 0.2 + v.height, z - 0.05, z));
        m.volumes.push(box('soil', x - v.width / 2 - 0.4, x + v.width / 2 + 0.4, 0, 0.6, z - 1.2, z - 0.05));
      }
      m.labels.push({ text: 'חזית אחורית, באדניות', at: [0, 1.6, z - 1] });
      m.labels.push({ text: 'ללא פתחים לרחוב', at: [0, 1.2, -1.9] });
    }
    m.persons.push([W + 1.5, 0, 1.6]);
    return m;
  },
};
