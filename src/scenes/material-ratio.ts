import { need, tag } from './dims.ts';
import { box } from './common.ts';
import { FACADE as F } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/**
 * מעטפת בחזית: החומר הראשי בשיעור המזערי, ושאר השטח בחומר משני.
 * בצמודי קרקע: טיח כהה עד השיעור המרבי.
 */
export const materialRatio: SceneDef = {
  id: 'material-ratio',
  build(get) {
    const m = emptyModel('z');
    const main = get('main_material_ratio_min');
    const dark = get('dark_plaster_ratio_max');
    const hard = get('hard_cladding_ratio');
    const W = F.width / 2;
    m.surfaces.push({ use: 'residential', polygon: [[-W - 2, -F.depth - 2], [W + 2, -F.depth - 2], [W + 2, 2], [-W - 2, 2]], y: 0 });
    m.volumes.push(box('mass', -W, W, 0, F.height, -F.depth, -0.1));

    if (main) {
      // רצועה אנכית בחומר משני ברוחב השארית
      const secondary = F.width * (1 - main.value);
      m.volumes.push(box('mass', -W, W - secondary, 0, F.height, -0.1, 0));
      m.volumes.push(box('dark', W - secondary, W, 0, F.height, -0.1, 0.02));
      m.tags.push(tag(main, [-W / 2, F.height / 2, 0.2], 'חומר ראשי '));
      m.labels.push({ text: 'חומר משני', at: [W - secondary / 2, F.height + 0.5, 0] });
      if (hard) m.tags.push(tag(hard, [-W / 2, F.height + 0.6, 0.2], 'חיפוי קשיח '));
    } else {
      const d = need(dark, 'dark_plaster_ratio_max');
      // טיח כהה: פס אופקי בשיעור המרבי משטח החזית
      const band = F.height * d.value;
      m.volumes.push(box('mass', -W, W, band, F.height, -0.1, 0));
      m.volumes.push(box('dark', -W, W, 0, band, -0.1, 0.02));
      m.tags.push(tag(d, [0, band / 2, 0.3], 'טיח כהה '));
      m.labels.push({ text: 'שאר המעטפת בגוון בהיר', at: [0, F.height * 0.6, 0.2] });
    }
    m.notes.push({ text: 'פירוש לבחינה: השיעור מחושב על חזית אחת, ולא על כל המעטפת.' });
    m.persons.push([W + 1, 0, 1]);
    return m;
  },
};
