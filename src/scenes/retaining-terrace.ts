import { dim, need } from './dims.ts';
import { STREET, TERRACE as T } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';
import { sidewalk } from './common.ts';

/**
 * חתך בקיר תמך מדורג: שתי מדרגות, התחתונה בגובה המינימלי והעליונה בגובה המרבי,
 * וביניהן ערוגה ברוחב הקבוע. הפרש המפלסים הכולל נגזר מהפרמטרים.
 */
export const retainingTerrace: SceneDef = {
  id: 'retaining-terrace',
  requires: ['terrace_bed_width', 'terrace_bed_height_min', 'terrace_bed_height_max'],
  build(get) {
    const m = emptyModel('x');
    const width = need(get('terrace_bed_width'), 'terrace_bed_width');
    const hMin = need(get('terrace_bed_height_min'), 'terrace_bed_height_min');
    const hMax = need(get('terrace_bed_height_max'), 'terrace_bed_height_max');
    const trigger = get('retaining_trigger_height');

    const h1 = hMin.value;
    const h2 = hMax.value;
    const w = width.value;
    const t = T.wallThickness;
    const half = T.length / 2;
    const top = h1 + h2;

    m.surfaces.push(...sidewalk(T.length));
    m.lines.push({ kind: 'plot', points: [[-half, 0.01, 0], [half, 0.01, 0]] });

    // קיר תחתון בגבול המגרש, ערוגה, קיר עליון, ומגרש בגובה העליון
    m.volumes.push({ kind: 'mass', center: [0, h1 / 2, -t / 2], size: [T.length, h1, t] });
    m.volumes.push({ kind: 'soil', center: [0, (h1 - 0.05) / 2, -t - w / 2], size: [T.length, h1 - 0.05, w] });
    m.volumes.push({ kind: 'mass', center: [0, top / 2, -t - w - t / 2], size: [T.length, top, t] });
    const plotZ = -2 * t - w;
    m.volumes.push({ kind: 'soil', center: [0, top / 2, plotZ - T.plotDepth / 2], size: [T.length, top, T.plotDepth] });
    m.surfaces.push({
      use: 'residential',
      polygon: [[-half, plotZ - T.plotDepth], [half, plotZ - T.plotDepth], [half, plotZ], [-half, plotZ]],
      y: top + 0.005,
    });

    const x = half;
    m.dims.push(dim(width, [x, h1, -t], [x, h1, -t - w], [0, 0.5, 0]));
    m.dims.push(dim(hMin, [x, 0, 0], [x, h1, 0], [0, 0, 0.6]));
    m.dims.push(dim(hMax, [x, h1, -t - w], [x, top, -t - w], [0, 0, 0.6 + t + w]));
    if (trigger) m.dims.push(dim(trigger, [x, 0, 0], [x, top, 0], [0, 0, 1.6]));

    m.persons.push([half - 1, 0, STREET.sidewalkWidth / 2]);
    return m;
  },
};
