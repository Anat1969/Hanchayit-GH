import { need, tag } from './dims.ts';
import { box, sidewalk, ctx } from './common.ts';
import { ACTIVE as A, FLOOR } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** חזית מסחרית: שקיפות לפי השיעור המזערי, גגון רציף אחד ופס שילוט אחיד לכל בתי העסק. */
export const activeFrontage: SceneDef = {
  id: 'active-frontage',
  requires: ['commercial_transparency_min'],
  build(get) {
    const m = emptyModel('z');
    const transparency = need(get('commercial_transparency_min'), 'commercial_transparency_min');
    const W = A.width / 2;
    const gf = A.groundFloor;
    const upper = A.upperFloors * FLOOR.typicalHeight;
    m.surfaces.push(...sidewalk(A.width + 4));
    m.lines.push({ kind: 'plot', points: [[-W - 2, 0.01, 0], [W + 2, 0.01, 0]] });

    m.volumes.push(box('mass', -W, W, 0, gf, -A.depth, -0.3));
    m.volumes.push(ctx(box('mass', -W, W, gf, gf + upper, -A.depth, 0)));
    // בכל מפתח: זכוכית ברוחב השיעור הנדרש, והשאר עמוד בנוי
    const pier = A.bay * (1 - transparency.value);
    const glassTop = gf - A.signHeight - 0.2;
    for (let x = -W; x < W - 0.01; x += A.bay) {
      m.volumes.push(box('mass', x, x + pier / 2, 0, gf, -0.3, 0));
      m.volumes.push(box('mass', x + A.bay - pier / 2, x + A.bay, 0, gf, -0.3, 0));
      m.volumes.push(box('glass', x + pier / 2, x + A.bay - pier / 2, 0, glassTop, -0.2, -0.15));
      m.volumes.push(box('mass', x + pier / 2, x + A.bay - pier / 2, glassTop, gf, -0.3, 0));
    }
    // פס שילוט אחיד וגגון רציף
    m.volumes.push(box('dark', -W + 0.5, W - 0.5, glassTop + 0.1, glassTop + 0.1 + A.signHeight * 0.6, 0, 0.05));
    m.volumes.push(box('light', -W, W, glassTop - 0.15, glassTop, 0, A.canopyDepth));

    m.tags.push(tag(transparency, [-W + A.bay / 2, glassTop / 2, 0.2], 'שקיפות '));
    m.labels.push({ text: 'גגון אחיד לכל החזית', at: [A.bay, glassTop + 0.1, A.canopyDepth + 0.3] });
    m.labels.push({ text: 'שילוט אחיד', at: [-A.bay, glassTop + 0.8, 0.3] });
    m.notes.push({ text: 'גובה קומת הקרקע להמחשה בלבד. הגובה המזערי מופיע בסצנה "גובה קומת קרקע וכניסה".' });
    m.persons.push([-2, 0, 1.4], [5, 0, 2.2]);
    m.trees.push([W - 2, 0, 2.8]);
    return m;
  },
};
