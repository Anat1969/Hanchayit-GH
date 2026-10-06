import type { BuildingType, Chapter, Param, Rule, Scene } from '../rules/load.ts';

/** x מזרח, y למעלה, z דרום (לכיוון הרחוב). מטרים. */
export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export type View = 'plan' | 'section' | 'axo';
export const VIEWS: View[] = ['plan', 'section', 'axo'];

export type LandUse = 'residential' | 'openSpace' | 'public' | 'industrial' | 'road';

/** פרמטר כפי שהוא מגיע לסצנה: הערך, ומאיזה סעיף ומפתח הוא בא */
export interface SceneParam {
  key: string;
  ruleId: string;
  param: Param;
  value: number;
  /** נוסח הסעיף, כדי שהתווית תיכתב כמו בנוסח (שבר או אחוז) */
  ruleText: string;
}

export interface Volume {
  /**
   * mass: נפח בנוי לבן, light: חלק קל (סורג, מצללה), soil: ערוגה ואדמה,
   * glass: זכוכית שקופה, water: מים, dark: חומר כהה (טיח כהה, חומר משני)
   */
  kind: 'mass' | 'light' | 'soil' | 'glass' | 'water' | 'dark';
  center: Vec3;
  size: Vec3;
  /** סיבוב ברדיאנים (x, y, z), לרמפה ולגג משופע */
  rotation?: Vec3;
  /** רקע להקשר (בניין סמוך, בית במגרש): מוצג שקוף ומעומעם, כדי שהעיקר יבלוט */
  context?: boolean;
}

export interface Surface {
  /** shadow: צל מחושב על הקרקע */
  use: LandUse | 'shadow';
  /** מצולע בתכנית (x, z) */
  polygon: Vec2[];
  y: number;
  /** שתי שורות ריצוף מרומזות לאורך המדרכה */
  paving?: { from: Vec2; to: Vec2; width: number };
}

export interface Line {
  kind: 'plot' | 'buildingLine' | 'pencil';
  points: Vec3[];
  label?: string;
}

export interface Dim {
  ruleId: string;
  paramKey: string;
  from: Vec3;
  to: Vec3;
  /** הכיוון והמרחק של קו המידה מהאובייקט */
  offset: Vec3;
  label: string;
  limit: boolean;
}

/** ערך שאינו אורך (יחס, שטח): תווית עם קו מוביל אל הנקודה */
export interface Tag {
  ruleId: string;
  paramKey: string;
  at: Vec3;
  label: string;
  limit: boolean;
}

/** הערת עיפרון: "פירוש לבחינה" כשהסצנה חייבת לבחור פירוש (CLAUDE.md, "אסור") */
export interface Note {
  text: string;
}

/** תווית איכותית בעיפרון במקום במודל ("ללא גדר", "מפלס המדרכה"). אינה מידה ואינה מקושרת. */
export interface Label {
  text: string;
  at: Vec3;
}

export interface SceneModel {
  volumes: Volume[];
  surfaces: Surface[];
  lines: Line[];
  trees: Vec3[];
  persons: Vec3[];
  dims: Dim[];
  tags: Tag[];
  notes: Note[];
  labels: Label[];
  /** חץ צפון בתכנית, רק כשהכיוון משמעותי (הצללה) */
  north?: boolean;
  /** הצל בסצנה מחושב לפי השעה, ולכן בלי צל אוטומטי של התאורה */
  computedShadows?: boolean;
  /** כיוון המבט בחתך: מהצד (ציר x) או מהרחוב (ציר z) */
  sectionAxis: 'x' | 'z';
}

export interface SceneControl {
  id: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}

export type ParamSource = (key: string) => SceneParam | undefined;

export interface SceneDef {
  id: string;
  /** פרמטרים שבלעדיהם אין סצנה. סוג מבנה שאין לו אותם לא מוצג בסצנה הזו. */
  requires?: string[];
  /** בוררים של הסצנה, כמו מספר קומות. התוויות נבנות מהפרמטרים. */
  controls?: (get: ParamSource, rules: Rule[]) => SceneControl[];
  /** rules: הסעיפים של הסצנה שחלים על סוג המבנה, לסצנה שנבנית מטבלה */
  build: (get: ParamSource, controls: Record<string, string>, rules: Rule[]) => SceneModel;
}

export function emptyModel(sectionAxis: 'x' | 'z' = 'x'): SceneModel {
  return { volumes: [], surfaces: [], lines: [], trees: [], persons: [], dims: [], tags: [], notes: [], labels: [], sectionAxis };
}

/**
 * הפרמטרים של סצנה לסוג מבנה נתון: רק מהסעיפים שברשימת הסצנה, ורק מסעיפים שחלים על הסוג.
 * אפשר לדרוס ערכים (בבדיקות, ובשלב 4 במצב בחינה).
 */
export function paramSource(
  chapter: Chapter,
  scene: Scene,
  type: BuildingType,
  overrides: Record<string, number> = {},
): ParamSource {
  const rules = new Map(chapter.rules.map((r) => [r.id, r]));
  const found = new Map<string, SceneParam>();
  for (const id of scene.rules) {
    const rule: Rule | undefined = rules.get(id);
    if (!rule || !rule.applies_to.includes(type)) continue;
    for (const p of rule.params ?? []) {
      if (found.has(p.key)) continue;
      // רשימה (שעות) נשמרת ב־param.value; value המספרי שלה NaN
      if (typeof p.value !== 'number') {
        found.set(p.key, { key: p.key, ruleId: rule.id, param: p, value: NaN, ruleText: rule.text });
        continue;
      }
      const value = overrides[p.key] ?? p.value;
      found.set(p.key, { key: p.key, ruleId: rule.id, param: { ...p, value }, value, ruleText: rule.text });
    }
  }
  return (key) => found.get(key);
}

export function supports(def: SceneDef, chapter: Chapter, scene: Scene, type: BuildingType): boolean {
  const get = paramSource(chapter, scene, type);
  return (def.requires ?? []).every((k) => get(k));
}

/**
 * סוג המבנה שהסצנה מציגה: הסוג שנבחר אם הסעיף חל עליו, אחרת סוגי הסעיף לפי הסדר,
 * ובכל מקרה סוג שיש לסצנה את הפרמטרים שלו.
 */
export function sceneType(
  def: SceneDef,
  chapter: Chapter,
  scene: Scene,
  rule: Rule,
  filter: BuildingType | 'all',
): BuildingType | undefined {
  const all: BuildingType[] = ['ground', 'residential', 'active', 'industrial'];
  const candidates = [...(filter !== 'all' && rule.applies_to.includes(filter) ? [filter] : []), ...rule.applies_to, ...all];
  return candidates.find((t) => supports(def, chapter, scene, t));
}

/** הסעיפים של הסצנה שחלים על סוג המבנה */
export function sceneRules(chapter: Chapter, scene: Scene, type: BuildingType): Rule[] {
  const rules = new Map(chapter.rules.map((r) => [r.id, r]));
  return scene.rules.map((id) => rules.get(id)!).filter((r) => r && r.applies_to.includes(type));
}

/**
 * אותה סצנה עם מפתחות אחרים: למשל מצללה בפרק א' (exempt_pergola_*) על בסיס הסצנה של פרק ב'.
 * המידות שומרות את המפתח האמיתי, כך שהקישור לנוסח נשמר.
 */
export function aliased(def: SceneDef, id: string, keys: Record<string, string>): SceneDef {
  const wrap = (get: ParamSource): ParamSource => (k) => get(keys[k] ?? k);
  return {
    id,
    requires: def.requires?.map((k) => keys[k] ?? k),
    controls: def.controls && ((get, rules) => def.controls!(wrap(get), rules)),
    build: (get, controls, rules) => def.build(wrap(get), controls, rules),
  };
}
