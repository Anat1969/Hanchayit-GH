import { describe, expect, it } from 'vitest';
import { chapter, rulesById, scenesById } from '../data.ts';
import { formatDimension } from '../rules/format.ts';
import type { BuildingType } from '../rules/load.ts';
import { paramSource, sceneRules, supports, type SceneModel } from './model.ts';
import { SCENES } from './registry.ts';

function build(id: string, type: BuildingType, overrides: Record<string, number> = {}, controls: Record<string, string> = {}) {
  const scene = scenesById.get(id)!;
  return SCENES[id].build(paramSource(chapter, scene, type, overrides), controls, sceneRules(chapter, scene, type));
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
        expect(m.dims.length + m.tags.length + m.labels.length).toBeGreaterThan(0);
        for (const d of [...m.dims, ...m.tags]) {
          expect(scene.rules).toContain(d.ruleId);
          if (d.paramKey.startsWith('table:')) {
            const col = d.paramKey.slice('table:'.length);
            const table = rulesById.get(d.ruleId)!.table!;
            expect(table.columns).toContain(col);
            expect(table.rows.some((r) => d.label.endsWith(r[col]))).toBe(true);
            continue;
          }
          const param = rulesById.get(d.ruleId)!.params!.find((p) => p.key === d.paramKey);
          expect(param, `${d.ruleId} ${d.paramKey}`).toBeDefined();
          expect(d.label).toContain(formatDimension(param!, rulesById.get(d.ruleId)!.text));
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
    const c = SCENES['building-spacing'].controls!(paramSource(chapter, scene, 'residential', { building_spacing_lower_floors_max: 12 }), []);
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

const tagOf = (m: SceneModel, key: string) => m.tags.find((t) => t.paramKey === key)!;
const vol = (m: SceneModel, kind: string) => m.volumes.filter((v) => v.kind === kind);

describe('סצנות שלב 3', () => {
  it('pool-setback: המרחק לפי סוג הבריכה', () => {
    expect(length(dimOf(build('pool-setback', 'residential', {}, { kind: 'private' }), 'pool_setback_private'))).toBeCloseTo(1);
    expect(length(dimOf(build('pool-setback', 'residential', {}, { kind: 'shared' }), 'pool_setback_shared'))).toBeCloseTo(3);
    expect(length(dimOf(build('pool-setback', 'residential', { pool_setback_shared: 4 }, { kind: 'shared' }), 'pool_setback_shared'))).toBeCloseTo(4);
  });

  it('umbrella-clearance: גובה חופשי ומרחק מהכביש', () => {
    const m = build('umbrella-clearance', 'active', { umbrella_clear_height_min: 3 });
    expect(length(dimOf(m, 'umbrella_clear_height_min'))).toBeCloseTo(3);
    expect(length(dimOf(m, 'umbrella_road_distance_min'))).toBeCloseTo(1);
    expect(m.notes).toHaveLength(1);
  });

  it('parking-canopy: שטח הקירוי שווה לשטח המרבי', () => {
    const roof = (m: SceneModel) => vol(m, 'light').reduce((a, v) => (v.size[0] * v.size[2] > a ? v.size[0] * v.size[2] : a), 0);
    expect(roof(build('parking-canopy', 'ground'))).toBeCloseTo(15);
    expect(roof(build('parking-canopy', 'ground', { parking_canopy_area_max: 20 }))).toBeCloseTo(20);
  });

  it('parking-trees: מספר העצים לפי מספר החניות לעץ', () => {
    const a = build('parking-trees', 'residential');
    const b = build('parking-trees', 'residential', { trees_per_perpendicular_spaces: 2 });
    expect(b.trees.length).toBeGreaterThan(a.trees.length);
    expect(tagOf(a, 'trees_per_perpendicular_spaces').label).toBe('עץ לכל 4 חניות');
  });

  it('colonnade, planting-strip, awning: המידה בגיאומטריה שווה לפרמטר', () => {
    expect(length(dimOf(build('colonnade', 'active', { arcade_clear_height_min: 5 }), 'arcade_clear_height_min'))).toBeCloseTo(5);
    expect(length(dimOf(build('planting-strip', 'industrial', { planting_strip_width: 2 }), 'planting_strip_width'))).toBeCloseTo(2);
    expect(length(dimOf(build('awning', 'residential', { awning_side_overhang_max: 0.3 }), 'awning_side_overhang_max'))).toBeCloseTo(0.3);
    expect(length(dimOf(build('awning', 'residential'), 'roof_awning_setback_min'))).toBeCloseTo(1);
  });

  it('common-green: השטח המגונן הכולל לפי השיעור המזערי', () => {
    const soil = (m: SceneModel) => vol(m, 'soil').reduce((a, v) => a + v.size[0] * v.size[2], 0);
    expect(soil(build('common-green', 'residential'))).toBeCloseTo(0.25 * 30 * 40);
    expect(soil(build('common-green', 'residential', { common_green_ratio_min: 0.3 }))).toBeCloseTo(0.3 * 30 * 40);
  });

  it('material-ratio: חומר ראשי במגורים, טיח כהה בצמודי קרקע', () => {
    expect(tagOf(build('material-ratio', 'residential'), 'main_material_ratio_min')).toBeDefined();
    const g = build('material-ratio', 'ground', { dark_plaster_ratio_max: 0.2 });
    expect(vol(g, 'dark')[0].size[1]).toBeCloseTo(9 * 0.2);
  });

  it('shading-coverage: הצל משתנה לפי השעה, וגובה המצללה לפי הפרמטר', () => {
    const at = (t: string) => build('shading-coverage', 'residential', {}, { time: t });
    const shadows = (m: SceneModel) => JSON.stringify(m.surfaces.filter((s) => s.use === 'shadow'));
    expect(shadows(at('10:00'))).not.toBe(shadows(at('15:00')));
    expect(at('12:00').labels.filter((l) => l.text.startsWith('מחושב'))).toHaveLength(3);
    expect(at('12:00').north).toBe(true);
    expect(length(dimOf(build('shading-coverage', 'residential', { shade_element_height_min: 4 }), 'shade_element_height_min'))).toBeCloseTo(4);
  });

  it('lobby-program: השורה בטבלה קובעת את הנפחים, והתוויות הן תוכן התאים', () => {
    const a = build('lobby-program', 'residential', {}, { row: '0' });
    const b = build('lobby-program', 'residential', {}, { row: '2' });
    expect(a.volumes.length).toBeLessThan(b.volumes.length);
    expect(tagOf(b, 'table:lobby_area').label).toBe('מבואה: 100 מ"ר');
  });
});

describe('סצנות פרק א\'', () => {
  it('exempt-fence: גדר, קיר תמך, גדר פנימית ושער לפי הפרמטרים', () => {
    const m = build('exempt-fence', 'ground', { exempt_fence_height_max: 1.2 });
    expect(length(dimOf(m, 'exempt_fence_height_max'))).toBeCloseTo(1.2);
    expect(length(dimOf(m, 'exempt_retaining_wall_height_max'))).toBeCloseTo(1);
    expect(length(dimOf(m, 'exempt_inner_fence_height_max'))).toBeCloseTo(1);
    expect(length(dimOf(m, 'exempt_gate_height_max'))).toBeCloseTo(1.8);
  });

  it('exempt-pergola: אותה סצנה כמו בפרק ב\', עם המפתחות של פרק א\'', () => {
    const m = build('exempt-pergola', 'residential', { exempt_pergola_setback_projection_max: 0.5 });
    const d = dimOf(m, 'exempt_pergola_setback_projection_max');
    expect(d.ruleId).toBe('A3.2.4');
    expect(m.dims.find((x) => x.paramKey === 'pergola_setback_projection_max')).toBeUndefined();
    expect(d.label).toBe('⁦≤ 50%⁩');
  });

  it('exempt-awning: סוכך לרחוב רק בחזית פעילה', () => {
    expect(dimOf(build('exempt-awning', 'active'), 'exempt_shop_awning_clear_height_min')).toBeDefined();
    expect(dimOf(build('exempt-awning', 'residential'), 'exempt_shop_awning_clear_height_min')).toBeUndefined();
    expect(length(dimOf(build('exempt-awning', 'residential', { exempt_canopy_projection_max: 1.5 }), 'exempt_canopy_projection_max'))).toBeCloseTo(1.5);
  });

  it('exempt-ramp: אורך הכבש נגזר מהפרש הגובה ומהשיפוע', () => {
    const run = (m: SceneModel) => m.volumes.find((v) => v.rotation)!.size[0];
    const a = build('exempt-ramp', 'residential');
    const b = build('exempt-ramp', 'residential', { exempt_ramp_slope_max: 0.05 });
    expect(run(a)).toBeCloseTo(Math.hypot(1.2 / 0.08, 1.2));
    expect(run(b)).toBeGreaterThan(run(a));
  });

  it('exempt-shed, exempt-parking-shade, exempt-rooftop', () => {
    const shed = build('exempt-shed', 'ground', { exempt_shed_height_max: 2.2 });
    expect(length(dimOf(shed, 'exempt_shed_height_max'))).toBeCloseTo(2.2);
    expect(length(dimOf(shed, 'exempt_shed_boundary_distance_min'))).toBeCloseTo(1);
    expect(length(dimOf(build('exempt-parking-shade', 'residential'), 'exempt_parking_shade_height_max'))).toBeCloseTo(2.5);
    const roof = build('exempt-rooftop', 'residential');
    expect(length(dimOf(roof, 'exempt_solar_parapet_distance_min'))).toBeCloseTo(1.5);
    expect(length(dimOf(roof, 'exempt_pv_roof_edge_min'))).toBeCloseTo(0.4);
    expect(length(dimOf(roof, 'exempt_antenna_mast_height_max'))).toBeCloseTo(6);
  });
});

it('exempt-ramp: הכבש כולו בתחום המגרש', () => {
  const m = build('exempt-ramp', 'residential');
  const ramp = m.volumes.find((v) => v.rotation)!;
  expect(ramp.center[0] - ramp.size[0] / 2).toBeGreaterThan(-9);
});
