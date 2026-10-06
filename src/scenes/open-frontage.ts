import { box, sidewalk } from './common.ts';
import { OPEN_FRONTAGE as O } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** חזית ראשית בלי גדר: מרחב הפיתוח ממשיך את המדרכה במפלס אחד, עם ספסלים ועצים. סצנה איכותית. */
export const openFrontage: SceneDef = {
  id: 'open-frontage',
  build() {
    const m = emptyModel('x');
    const W = O.width / 2;
    m.surfaces.push(...sidewalk(O.width));
    m.surfaces.push({ use: 'road', polygon: [[-W, -O.frontYard], [W, -O.frontYard], [W, 0], [-W, 0]], y: 0.002 });
    m.surfaces.push({ use: 'residential', polygon: [[-W, -O.frontYard - O.building.depth], [W, -O.frontYard - O.building.depth], [W, -O.frontYard], [-W, -O.frontYard]], y: 0 });
    m.lines.push({ kind: 'plot', points: [[-W, 0.01, 0], [W, 0.01, 0]] });
    m.volumes.push(box('mass', -W + 2, W - 2, 0, O.building.height, -O.frontYard - O.building.depth, -O.frontYard));
    // כניסה ראשית ממוקמת במרכז החזית
    m.volumes.push(box('glass', -2, 2, 0, 3.2, -O.frontYard - 0.05, -O.frontYard + 0.05));

    const b = O.bench;
    for (const x of [-9, -4.5, 4.5, 9]) {
      m.volumes.push(box('mass', x - b.length / 2, x + b.length / 2, 0, b.height, -2.5 - b.depth / 2, -2.5 + b.depth / 2));
      m.trees.push([x + (x > 0 ? 2.3 : -2.3), 0, -3]);
    }
    m.labels.push(
      { text: 'ללא גדר', at: [0, 0.4, 0] },
      { text: 'מפלס המדרכה', at: [W - 4, 0.2, -O.frontYard / 2] },
      { text: 'כניסה מהרחוב', at: [0, 3.8, -O.frontYard] },
    );
    m.persons.push([1.5, 0, -2], [-6, 0, 1.8]);
    return m;
  },
};
