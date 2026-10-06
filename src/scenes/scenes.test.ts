import { describe, expect, it } from 'vitest';
import { chapter, rulesById, scenesById } from '../data.ts';
import { formatDimension } from '../rules/format.ts';
import type { BuildingType } from '../rules/load.ts';
import { paramSource, supports, type SceneModel } from './model.ts';
import { SCENES } from './registry.ts';

function build(id: string, type: BuildingType, overrides: Record<string, number> = {}, controls: Record<string, string> = {}) {
  const scene = scenesById.get(id)!;
  return SCENES[id].build(paramSource(chapter, scene, type, overrides), controls);
}

const typesOf = (id: string) =>
  ([...new Set(scenesById.get(id)!.rules.flatMap((r) => rulesById.get(r)!.applies_to))] as BuildingType[]).filter((t) =>
    supports(SCENES[id], chapter, scenesById.get(id)!, t),
  );

const dimOf = (m: SceneModel, key: string) => m.dims.find((d) => d.paramKey === key)!;
const length = (d: SceneModel['dims'][number]) => Math.hypot(...d.to.map((v, i) => v - d.from[i]));

describe('כל הסצנות', () => {
  it('לכל סצנה יש לפחות סוג מבנה אחד שהיא תומכת בו', () => {
    for (const id of Object.keys(SCENES)) expect(typesOf(id).length, id).toBeGreaterThan(0);
  });

  for (const id of Object.keys(SCENES)) {
    for (const type of typesOf(id)) {
      it(`${id} (${type}): כל מידה מקושרת לסעיף של הסצנה ולפרמטר שלו`, () => {
        const m = build(id, type);
        const scene = scenesById.get(id)!;
        expect(m.dims.length + m.tags.length).toBeGreaterThan(0);
        for (const d of [...m.dims, ...m.tags]) {
          expect(scene.rules).toContain(d.ruleId);
          const param = rulesById.get(d.ruleId)!.params!.find((p) => p.key === d.paramKey);
          expect(param, `${d.ruleId} ${d.paramKey}`).toBeDefined();
          expect(d.label).toContain(formatDimension(param!));
          expect(rulesById.get(d.ruleId)!.applies_to).toContain(type);
        }
      });
    }
  }
});

describe('שינוי פרמטר משנה גיאומטריה ותווית', () => {
  it('fence-street: גובה גדר', () => {
    const a = dimOf(build('fence-street', 'ground'), 'fence_height_max');
    const b = dimOf(build('fence-street', 'ground', { fence_height_max: 2 }), 'fence_height_max');
    expect(length(a)).toBeCloseTo(1.8);
    expect(length(b)).toBeCloseTo(2);
    expect(b.label).toBe("\u2066≤\u00A02\u2069\u00A0מ'");
  });

  it('fence-street: בתעשייה מסד וחלק קל לפי הערכים הקבועים', () => {
    const m = build('fence-street', 'industrial');
    expect(length(dimOf(m, 'industrial_fence_base_height'))).toBeCloseTo(0.6);
    expect(length(dimOf(m, 'industrial_fence_light_height'))).toBeCloseTo(1.1);
    expect(dimOf(m, 'industrial_fence_base_height').limit).toBe(false);
  });

  it('fence-street: בלי גובה בנתונים מוצגת הערת פירוש', () => {
    expect(build('fence-street', 'residential').notes.length).toBe(1);
    expect(build('fence-street', 'ground').notes.length).toBe(0);
  });

  it('retaining-terrace: רוחב ערוגה וגובה מדרגות', () => {
    const a = build('retaining-terrace', 'residential');
    const b = build('retaining-terrace', 'residential', { terrace_bed_width: 0.9, terrace_bed_height_max: 1.4 });
    expect(length(dimOf(a, 'terrace_bed_width'))).toBeCloseTo(0.6);
    expect(length(dimOf(b, 'terrace_bed_width'))).toBeCloseTo(0.9);
    expect(length(dimOf(b, 'terrace_bed_height_max'))).toBeCloseTo(1.4);
    expect(dimOf(b, 'terrace_bed_width').label).toBe('90 ס"מ');
    expect(dimOf(a, 'retaining_trigger_height')).toBeUndefined();
    expect(dimOf(build('retaining-terrace', 'ground'), 'retaining_trigger_height')).toBeDefined();
  });

  it('pergola-ground: בליטה מעבר לקו הבניין', () => {
    const a = dimOf(build('pergola-ground', 'residential'), 'pergola_setback_projection_max');
    const b = dimOf(build('pergola-ground', 'residential', { pergola_setback_projection_max: 0.5 }), 'pergola_setback_projection_max');
    expect(length(b) / length(a)).toBeCloseTo(0.5 / 0.4);
    expect(b.label).toBe('\u2066≤\u00A050%\u2069');
  });

  it('building-spacing: הבורר בוחר את המרחק לפי סף הקומות', () => {
    const low = build('building-spacing', 'residential', {}, { floors: '14' });
    const high = build('building-spacing', 'residential', {}, { floors: '15' });
    expect(length(dimOf(low, 'building_spacing_min_upto14'))).toBeCloseTo(18);
    expect(length(dimOf(high, 'building_spacing_min_15plus'))).toBeCloseTo(21);
    expect(high.notes.length).toBe(1);
    const changed = build('building-spacing', 'residential', { building_spacing_min_15plus: 24 }, { floors: '15' });
    expect(length(dimOf(changed, 'building_spacing_min_15plus'))).toBeCloseTo(24);
    expect(length(dimOf(low, 'window_to_window_min'))).toBeCloseTo(6);
  });

  it('building-spacing: תוויות הבורר נגזרות מהנתונים', () => {
    const scene = scenesById.get('building-spacing')!;
    const c = SCENES['building-spacing'].controls!(paramSource(chapter, scene, 'residential', { building_spacing_lower_floors_max: 12 }));
    expect(c[0].options.map((o) => o.label)).toEqual(['עד 12 קומות', '13 קומות ומעלה']);
  });

  it('ground-floor-height: 4 מ׳, ו־6 מ׳ כשגוף הבניין בולט', () => {
    const a = build('ground-floor-height', 'active', {}, { overhang: 'no' });
    const b = build('ground-floor-height', 'active', {}, { overhang: 'yes' });
    expect(length(dimOf(a, 'active_ground_floor_height_min'))).toBeCloseTo(4);
    expect(length(dimOf(b, 'active_ground_floor_height_min_overhang'))).toBeCloseTo(6);
    const c = build('ground-floor-height', 'active', { active_ground_floor_height_min: 4.5 }, { overhang: 'no' });
    expect(length(dimOf(c, 'active_ground_floor_height_min'))).toBeCloseTo(4.5);
    expect(dimOf(c, 'active_ground_floor_height_min').label).toBe("\u2066≥\u00A04.5\u2069\u00A0מ'");
  });
});
