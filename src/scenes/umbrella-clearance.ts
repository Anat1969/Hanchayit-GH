import { dim, need } from './dims.ts';
import { box, ctx } from './common.ts';
import { UMBRELLA as U } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** שמשייה במדרכה של חזית פעילה: מרחק מהכביש וגובה חופשי מתחת לסוכך. */
export const umbrellaClearance: SceneDef = {
  id: 'umbrella-clearance',
  requires: ['umbrella_road_distance_min', 'umbrella_clear_height_min'],
  build(get) {
    const m = emptyModel('x');
    const road = need(get('umbrella_road_distance_min'), 'umbrella_road_distance_min');
    const clear = need(get('umbrella_clear_height_min'), 'umbrella_clear_height_min');
    const W = U.width / 2;
    const curb = U.sidewalk;
    m.surfaces.push({ use: 'road', polygon: [[-W, 0], [W, 0], [W, curb], [-W, curb]], y: 0, paving: { from: [-W, 0], to: [W, 0], width: curb } });
    m.surfaces.push({ use: 'road', polygon: [[-W, curb], [W, curb], [W, curb + 3], [-W, curb + 3]], y: -U.curb });
    m.volumes.push(ctx(box('mass', -W, W, 0, U.building.height, -U.building.depth, 0)));
    m.volumes.push(ctx(box('glass', -W + 1, W - 1, 0, 3.5, 0, 0.05)));

    // השמשייה: קצה הסוכך במרחק המזערי מאבן השפה
    const r = U.canopyRadius;
    const cx = 0;
    const cz = curb - road.value - r;
    const h = clear.value;
    m.volumes.push(box('light', cx - U.pole, cx + U.pole, 0, h + 0.4, cz - U.pole, cz + U.pole));
    m.volumes.push(box('light', cx - r, cx + r, h, h + 0.12, cz - r, cz + r));
    m.dims.push(dim(clear, [cx + r, 0, cz + r], [cx + r, h, cz + r], [0, 0, 0.4]));
    m.dims.push(dim(road, [cx + r, 0.02, cz + r], [cx + r, 0.02, curb], [0.6, 0, 0]));
    m.notes.push({ text: 'פירוש לבחינה: המרחק נמדד מאבן השפה. ההנחיה לא קובעת אם מאבן השפה או מקצה המיסעה.' });
    m.persons.push([cx - 0.6, 0, cz + 0.3]);
    return m;
  },
};
