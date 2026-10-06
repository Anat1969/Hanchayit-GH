import { box, sidewalk } from './common.ts';
import { FLOOR, ROOF as R, STREET } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** גג עם מעבים ומערכות מאחורי מעקה מוגבה, וקו המבט מהמדרכה שממול. סצנה איכותית. */
export const roofEquipment: SceneDef = {
  id: 'roof-equipment',
  build() {
    const m = emptyModel('x');
    const W = R.width / 2;
    const h = R.floors * FLOOR.typicalHeight;
    const front = -3;
    const back = front - R.depth;
    const c = R.condenser;
    // מעקה בגובה שמסתיר את המערכות
    const parapet = c.height + 0.3;

    m.surfaces.push(...sidewalk(R.width + 6));
    m.surfaces.push({ use: 'residential', polygon: [[-W - 3, back - 3], [W + 3, back - 3], [W + 3, 0], [-W - 3, 0]], y: 0 });
    m.lines.push({ kind: 'plot', points: [[-W - 3, 0.01, 0], [W + 3, 0.01, 0]] });
    m.volumes.push(box('mass', -W, W, 0, h, back, front));
    for (const [z0, z1] of [[front - 0.2, front], [back, back + 0.2]]) m.volumes.push(box('mass', -W, W, h, h + parapet, z0, z1));
    for (const [x0, x1] of [[-W, -W + 0.2], [W - 0.2, W]]) m.volumes.push(box('mass', x0, x1, h, h + parapet, back, front));
    for (let i = 0; i < 4; i++) {
      const x = -W + 2 + i * 1.6;
      m.volumes.push(box('light', x, x + c.width, h, h + c.height, back + 2, back + 2 + c.depth));
    }
    m.volumes.push(box('mass', 2, 5, h, h + c.height, back + 1.5, back + 4));

    // קו המבט: מעין של הולך רגל במדרכה שממול, דרך ראש המעקה
    const eye: [number, number, number] = [W - 2, R.eyeHeight, STREET.sidewalkWidth + STREET.roadWidth + 1];
    const top: [number, number, number] = [W - 2, h + parapet, front];
    const t = 1.6;
    m.lines.push({ kind: 'pencil', points: [eye, [eye[0], eye[1] + (top[1] - eye[1]) * t, eye[2] + (top[2] - eye[2]) * t]] });
    m.persons.push([W - 2, 0, eye[2]]);
    m.labels.push(
      { text: 'קו המבט מהרחוב', at: [W - 2, h * 0.55, eye[2] / 2] },
      { text: 'מערכות מאחורי מעקה מוגבה', at: [-W + 3, h + parapet + 1, back + 2] },
      { text: 'ללא מזגנים בחזית לרחוב', at: [0, h / 2, front + 0.3] },
    );
    return m;
  },
};
