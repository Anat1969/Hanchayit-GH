import { dim, need, tag } from './dims.ts';
import { FENCE_STREET as F, STREET } from './fixtures.ts';
import { emptyModel, type SceneDef, type SceneModel, type Volume } from './model.ts';
import { sidewalk } from './common.ts';

/** החלק הקל: פסים אטומים עם רווחים, כך שהחלק הפתוח שווה לשיעור החירור */
function slats(y0: number, height: number, perforation: number): Volume[] {
  const pitch = F.slatWidth / (1 - perforation);
  const count = Math.floor(F.length / pitch);
  const start = -(count * pitch) / 2 + pitch / 2;
  const out: Volume[] = [
    { kind: 'light', center: [0, y0 + height - 0.03, 0], size: [F.length, 0.06, 0.06] },
  ];
  for (let i = 0; i < count; i++) {
    out.push({ kind: 'light', center: [start + i * pitch, y0 + height / 2, 0], size: [F.slatWidth, height, 0.04] });
  }
  return out;
}

export const fenceStreet: SceneDef = {
  id: 'fence-street',
  build(get) {
    const m: SceneModel = emptyModel('z');
    const half = F.length / 2;
    m.surfaces.push(
      { use: 'residential', polygon: [[-half, -F.plotDepth], [half, -F.plotDepth], [half, 0], [-half, 0]], y: 0 },
      ...sidewalk(F.length),
    );
    m.lines.push({ kind: 'plot', points: [[-half, 0.01, 0], [half, 0.01, 0]] });
    m.persons.push([-half - 1, 0, STREET.sidewalkWidth / 2]);

    const industrialBase = get('industrial_fence_base_height');
    const industrialLight = get('industrial_fence_light_height');
    const heightMax = get('fence_height_max');
    const baseRatio = get('fence_base_ratio');
    const lightRatio = get('fence_light_ratio');
    const perforation = get('fence_light_perforation_min');

    let base: number;
    let light: number;

    if (industrialBase && industrialLight) {
      // תעשייה: מסד וגדר קלה בגבהים קבועים
      base = industrialBase.value;
      light = industrialLight.value;
      m.dims.push(dim(industrialBase, [half, 0, 0], [half, base, 0], [0.5, 0, 0]));
      m.dims.push(dim(industrialLight, [half, base, 0], [half, base + light, 0], [0.5, 0, 0]));
    } else {
      const b = need(baseRatio, 'fence_base_ratio');
      const l = need(lightRatio, 'fence_light_ratio');
      const total = heightMax ? heightMax.value : F.illustrativeHeight;
      if (!heightMax) {
        m.notes.push({ text: 'פירוש לבחינה: בסעיפים של סוג מבנה זה לא נקבע גובה לגדר לרחוב. הגובה במודל להמחשה בלבד.' });
      }
      base = total * b.value;
      light = total * l.value;
      m.dims.push(dim(b, [half, 0, 0], [half, base, 0], [0.5, 0, 0]));
      m.dims.push(dim(l, [half, base, 0], [half, base + light, 0], [0.5, 0, 0]));
      if (heightMax) m.dims.push(dim(heightMax, [half, 0, 0], [half, total, 0], [1.5, 0, 0]));
    }

    m.volumes.push({ kind: 'mass', center: [0, base / 2, 0], size: [F.length, base, F.thickness] });
    m.volumes.push(...slats(base, light, perforation?.value ?? 0.5));
    if (perforation) m.tags.push(tag(perforation, [-half / 2, base + light / 2, 0.1], 'חירור '));
    return m;
  },
};
