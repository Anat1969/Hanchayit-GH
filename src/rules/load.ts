import { z } from 'zod';

export const BUILDING_TYPES = ['ground', 'residential', 'active', 'industrial'] as const;

const BuildingType = z.enum(BUILDING_TYPES);

const Param = z.strictObject({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/),
  op: z.enum(['=', '<=', '>=', '<', '>']),
  value: z.union([z.number(), z.array(z.string()).nonempty()]),
  unit: z.enum(['m', 'm2', 'ratio', 'floors', 'days_per_year', 'coef', 'time', 'spaces_per_tree']),
  from: z.string().optional(),
  of: z.string().optional(),
  note: z.string().optional(),
});

const Rule = z.strictObject({
  id: z.string().regex(/^B[\d.]+(-[\da-z]+)?$/),
  ref: z.string(),
  section: z.string(),
  applies_to: z.array(BuildingType).nonempty(),
  kind: z.enum(['parametric', 'requirement', 'prohibition', 'reference']),
  text: z.string().min(1),
  scene: z.string().optional(),
  params: z.array(Param).optional(),
  materials: z
    .strictObject({
      allowed: z.array(z.string()).optional(),
      allowed_industrial: z.array(z.string()).optional(),
      required: z.array(z.string()).optional(),
      forbidden: z.array(z.string()).optional(),
    })
    .optional(),
  table: z
    .strictObject({
      columns: z.array(z.string()).nonempty(),
      rows: z.array(z.record(z.string(), z.string())),
    })
    .optional(),
  review: z.string().optional(),
});

const Section = z.strictObject({
  id: z.string(),
  ref: z.string(),
  title: z.string(),
  parent: z.string().nullable(),
});

const Scene = z.strictObject({
  id: z.string().regex(/^[a-z][a-z-]*$/),
  title: z.string(),
  rules: z.array(z.string()),
});

const Chapter = z.strictObject({
  meta: z.object({
    source: z.string(),
    chapter: z.string(),
    pages: z.string(),
    extracted: z.string(),
    status: z.string(),
    schema_version: z.literal(1),
  }),
  building_types: z.record(BuildingType, z.string()),
  sections: z.array(Section),
  scenes: z.array(Scene),
  rules: z.array(Rule),
});

const Synonyms = z.object({
  _note: z.string().optional(),
  groups: z.array(z.array(z.string()).min(2)),
});

export type BuildingType = z.infer<typeof BuildingType>;
export type Param = z.infer<typeof Param>;
export type Rule = z.infer<typeof Rule>;
export type Section = z.infer<typeof Section>;
export type Scene = z.infer<typeof Scene>;
export type Chapter = z.infer<typeof Chapter>;
export type Synonyms = z.infer<typeof Synonyms>;

/** בדיקות שהסכמה לבדה לא תופסת: הפניות בין ישויות וערכים סותרים לאותו key. */
function crossCheck(c: Chapter): string[] {
  const errors: string[] = [];
  const sectionIds = new Set(c.sections.map((s) => s.id));
  const sceneIds = new Set(c.scenes.map((s) => s.id));
  const ruleIds = new Set<string>();

  for (const s of c.sections) {
    if (s.parent !== null && !sectionIds.has(s.parent)) errors.push(`פרק ${s.id}: הורה לא קיים ${s.parent}`);
  }
  for (const r of c.rules) {
    if (ruleIds.has(r.id)) errors.push(`סעיף ${r.id}: מזהה כפול`);
    ruleIds.add(r.id);
    if (!sectionIds.has(r.section)) errors.push(`סעיף ${r.id}: פרק לא קיים ${r.section}`);
    if (r.scene && !sceneIds.has(r.scene)) errors.push(`סעיף ${r.id}: סצנה לא קיימת ${r.scene}`);
    if (r.kind === 'parametric' && !r.params?.length && !r.table) errors.push(`סעיף ${r.id}: parametric בלי params או table`);
  }
  for (const s of c.scenes) {
    for (const id of s.rules) if (!ruleIds.has(id)) errors.push(`סצנה ${s.id}: סעיף לא קיים ${id}`);
  }

  // אותו key ואותו סוג מבנה חייבים לתת אותו ערך (DATA-MODEL.md, כלל 1)
  const seen = new Map<string, { value: string; rule: string }>();
  for (const r of c.rules) {
    for (const p of r.params ?? []) {
      for (const t of r.applies_to) {
        const k = `${p.key}|${t}`;
        const v = JSON.stringify([p.op, p.value, p.unit]);
        const prev = seen.get(k);
        if (prev && prev.value !== v) errors.push(`${p.key} (${t}): ערכים שונים ב־${prev.rule} וב־${r.id}`);
        else seen.set(k, { value: v, rule: r.id });
      }
    }
  }
  return errors;
}

export function parseChapter(json: unknown): Chapter {
  const result = Chapter.safeParse(json);
  if (!result.success) {
    throw new Error('chapter-b.json לא תקין:\n' + z.prettifyError(result.error));
  }
  const errors = crossCheck(result.data);
  if (errors.length) throw new Error('chapter-b.json לא תקין:\n' + errors.join('\n'));
  return result.data;
}

export function parseSynonyms(json: unknown): Synonyms {
  const result = Synonyms.safeParse(json);
  if (!result.success) throw new Error('synonyms.json לא תקין:\n' + z.prettifyError(result.error));
  return result.data;
}
