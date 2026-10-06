import { dim, need } from './dims.ts';
import { box, sidewalk } from './common.ts';
import { COLONNADE as C, FLOOR } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** קומת קרקע עם ארקדה פתוחה לציבור. גוף הבניין מעל הארקדה, עמודים בקו החזית. */
export const colonnade: SceneDef = {
  id: 'colonnade',
  requires: ['arcade_clear_height_min'],
  build(get) {
    const m = emptyModel('x');
    const clear = need(get('arcade_clear_height_min'), 'arcade_clear_height_min');
    const h = clear.value;
    const W = C.width / 2;
    const slab = FLOOR.slab;
    const upper = C.upperFloors * FLOOR.typicalHeight;

    m.surfaces.push(...sidewalk(C.width + 4));
    m.lines.push({ kind: 'plot', points: [[-W - 2, 0.01, 0], [W + 2, 0.01, 0]] });
    // חלל הארקדה: רצפה בהמשך המדרכה, חזיתות החנויות מאחור
    m.surfaces.push({ use: 'road', polygon: [[-W, -C.arcadeDepth], [W, -C.arcadeDepth], [W, 0], [-W, 0]], y: 0.003 });
    m.volumes.push(box('glass', -W + 0.3, W - 0.3, 0, h, -C.arcadeDepth - 0.05, -C.arcadeDepth));
    m.volumes.push(box('mass', -W, W, 0, h, -C.depth, -C.arcadeDepth - 0.05));
    m.volumes.push(box('mass', -W, W, h, h + slab, -C.depth, 0));
    m.volumes.push(box('mass', -W, W, h + slab, h + slab + upper, -C.depth, 0));
    for (let x = -W + C.column / 2; x <= W; x += C.bay) {
      m.volumes.push(box('mass', x - C.column / 2, x + C.column / 2, 0, h, -C.column, 0));
    }
    m.dims.push(dim(clear, [W, 0, -C.arcadeDepth / 2], [W, h, -C.arcadeDepth / 2], [1.2, 0, 0]));
    m.labels.push({ text: 'זיקת מעבר לציבור', at: [-W / 2, 0.3, -C.arcadeDepth / 2] });
    m.persons.push([-2, 0, -C.arcadeDepth / 2], [4, 0, 2]);
    m.trees.push([-W + 3, 0, 2.6], [W - 3, 0, 2.6]);
    return m;
  },
};
