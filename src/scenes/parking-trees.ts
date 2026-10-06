import { need, tag } from './dims.ts';
import { PARKING_TREES as P } from './fixtures.ts';
import { emptyModel, type Line, type SceneDef } from './model.ts';

const rect = (x0: number, x1: number, z0: number, z1: number): Line => ({
  kind: 'pencil',
  points: [[x0, 0.02, z0], [x1, 0.02, z0], [x1, 0.02, z1], [x0, 0.02, z1], [x0, 0.02, z0]],
});

/** חניה עילית: שורת חניות ניצבות עם עץ לפי מספר החניות, ושורת חניות מקבילות. */
export const parkingTrees: SceneDef = {
  id: 'parking-trees',
  requires: ['trees_per_perpendicular_spaces', 'trees_per_parallel_spaces'],
  build(get) {
    const m = emptyModel('x');
    const perp = need(get('trees_per_perpendicular_spaces'), 'trees_per_perpendicular_spaces');
    const par = need(get('trees_per_parallel_spaces'), 'trees_per_parallel_spaces');

    // ניצבות: אחרי כל קבוצה של perp חניות, אי עץ ברוחב חניה
    const p = P.perpendicular;
    let x = 0;
    for (let i = 0; i < p.count; i++) {
      m.lines.push(rect(x, x + p.width, -p.depth, 0));
      x += p.width;
      if ((i + 1) % perp.value === 0) {
        m.surfaces.push({ use: 'openSpace', polygon: [[x, -p.depth], [x + p.width, -p.depth], [x + p.width, 0], [x, 0]], y: 0.01 });
        m.trees.push([x + p.width / 2, 0, -p.depth / 2]);
        if (i + 1 === perp.value) m.tags.push(tag(perp, [x + p.width / 2, 0.3, 1], 'עץ לכל ', ' חניות'));
        x += p.width;
      }
    }
    const length = x;
    // מקבילות, מעבר לנתיב הנסיעה
    const q = P.parallel;
    const z0 = P.aisle;
    x = 0;
    for (let i = 0; i < q.count; i++) {
      m.lines.push(rect(x, x + q.width, z0, z0 + q.depth));
      x += q.width;
      if ((i + 1) % par.value === 0) {
        m.surfaces.push({ use: 'openSpace', polygon: [[x, z0], [x + 2, z0], [x + 2, z0 + q.depth], [x, z0 + q.depth]], y: 0.01 });
        m.trees.push([x + 1, 0, z0 + q.depth / 2]);
        if (i + 1 === par.value) m.tags.push(tag(par, [x + 1, 0.3, z0 + q.depth + 1.2], 'עץ לכל ', ' חניות'));
        x += 2;
      }
    }
    m.surfaces.push({ use: 'road', polygon: [[-1, -p.depth - 1], [Math.max(length, x) + 1, -p.depth - 1], [Math.max(length, x) + 1, z0 + q.depth + 1], [-1, z0 + q.depth + 1]], y: 0 });
    m.labels.push({ text: 'נתיב נסיעה', at: [length / 2, 0.1, z0 / 2] });
    m.persons.push([-0.5, 0, z0 / 2]);
    return m;
  },
};
