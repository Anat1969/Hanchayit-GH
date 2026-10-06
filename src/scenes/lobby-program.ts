import { box, sidewalk } from './common.ts';
import { FLOOR, LOBBY as L } from './fixtures.ts';
import { emptyModel, type SceneDef, type SceneModel, type Tag } from './model.ts';
import type { Rule } from '../rules/load.ts';

const NUM = '([\\d.]+)';
const M2 = ' מ"ר';

/**
 * פענוח תא בטבלה לשטח במ"ר עבור מספר יח"ד נתון. הדפוסים הם הניסוחים שבטבלה עצמה;
 * תא שאינו מתאים לאף דפוס מחזיר undefined ומוצג כטקסט בלבד.
 */
export function parseArea(cell: string, units: number): number | undefined {
  if (/אין חובה/.test(cell)) return 0;
  let m = new RegExp(`${NUM}${M2} ליח"ד, מינימום ${NUM}${M2}`).exec(cell);
  if (m) return Math.max(+m[1] * units, +m[2]);
  m = new RegExp(`${NUM}${M2} \\+ ${NUM}${M2} לכל יח"ד מעל (\\d+)`).exec(cell);
  if (m) return +m[1] + +m[2] * Math.max(0, units - +m[3]);
  m = new RegExp(`${NUM}${M2} או ${NUM}${M2} לכל יח"ד, לפי הגדול`).exec(cell);
  if (m) return Math.max(+m[1], +m[2] * units);
  m = new RegExp(`^${NUM}${M2}`).exec(cell);
  if (m) return +m[1];
  return undefined;
}

/** גובה המבואה: מספר במטרים, או "גובה כפול של קומה טיפוסית" */
export function parseHeight(cell: string): number {
  const m = /([\d.]+) מ'/.exec(cell);
  if (m) return +m[1];
  if (/גובה כפול/.test(cell)) return 2 * FLOOR.typicalHeight;
  return FLOOR.typicalHeight;
}

const BLOCKS: Array<{ col: string; title: string }> = [
  { col: 'lobby_area', title: 'מבואה' },
  { col: 'club_area', title: 'מועדון' },
  { col: 'bikes_room', title: 'עגלות ואופניים' },
  { col: 'common_storage', title: 'מחסן משותף' },
  { col: 'maintenance_storage', title: 'מחסן תחזוקה' },
];

/**
 * דיאגרמת נפחים של השטחים לרווחת הדיירים לפי שורה בטבלה. הסצנה מקבלת את הטבלה עצמה,
 * כי הערכים בה הם טקסט ולא פרמטרים. כל תווית היא תוכן התא כפי שהוא.
 */
export function lobbyModel(rule: Rule, row: number): SceneModel {
  const m = emptyModel('x');
  const table = rule.table!;
  const r = table.rows[row];
  const units = L.unitsPerRow[row] ?? L.unitsPerRow[0];

  const d = L.blockDepth;
  const tags: Tag[] = [];
  // נפחים לפי הסדר בטבלה, עם רווח ביניהם; תא בלי שטח ("אין חובה") לא מקבל נפח
  const blocks = BLOCKS.map((b) => ({ ...b, cell: r[b.col] ?? '', area: parseArea(r[b.col] ?? '', units) ?? 0 })).filter((b) => b.area > 0);
  const total = blocks.reduce((a, b) => a + b.area / d + L.gap, -L.gap);
  let x = -total / 2;
  blocks.forEach((b, i) => {
    const w = b.area / d;
    const h = b.col === 'lobby_area' ? parseHeight(r.lobby_height ?? '') : FLOOR.typicalHeight;
    m.volumes.push(box(b.col === 'lobby_area' ? 'glass' : 'mass', x, x + w, 0, h, -d, 0));
    // התוויות לסירוגין לפני הנפחים ומאחוריהם ובשני גבהים, כדי שלא יעלו זו על זו
    const y = Math.max(h, FLOOR.typicalHeight * 2) + 0.8 + (i % 2) * 1.6;
    const z = i % 2 ? -d - 1.5 : 1.5;
    tags.push({ ruleId: rule.id, paramKey: `table:${b.col}`, at: [x + w / 2, y, z], label: `${b.title}: ${b.cell}`, limit: false });
    x += w + L.gap;
  });
  if (r.lobby_height && blocks[0]?.col === 'lobby_area') {
    tags.push({ ruleId: rule.id, paramKey: 'table:lobby_height', at: [-total / 2 - 1, parseHeight(r.lobby_height) / 2, 0.5], label: `גובה: ${r.lobby_height}`, limit: false });
  }
  m.tags.push(...tags);
  m.surfaces.push(...sidewalk(total + 8));
  m.notes.push({
    text: `דוגמה: ${units} יח"ד. פירוש לבחינה: הטבלה פוענחה מה־PDF. הטווחים "25 ומעלה" ו"מעל 60" חופפים, ולא ברור אם המחסן הפרטי חל על כל השורות.`,
  });
  m.persons.push([-total / 2 - 1.5, 0, 1.5]);
  return m;
}

const tableRule = (rules: Rule[]) => rules.find((r) => r.table);

export const lobbyProgram: SceneDef = {
  id: 'lobby-program',
  controls: (_get, rules) => {
    const rule = tableRule(rules);
    if (!rule) return [];
    return [{ id: 'row', label: 'מספר יח"ד', options: rule.table!.rows.map((r, i) => ({ value: String(i), label: r.units })) }];
  },
  build: (_get, controls, rules) => {
    const rule = tableRule(rules);
    return rule ? lobbyModel(rule, Number(controls.row ?? 0)) : emptyModel();
  },
};
