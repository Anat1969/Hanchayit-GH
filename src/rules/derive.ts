import type { BuildingType, Chapter, Param, Rule, Section } from './load.ts';

/** סינון: הכל, עבודות פטורות מהיתר (פרק א'), או סוג מבנה */
export type TypeFilter = BuildingType | 'all' | 'exempt';

export function appliesTo(rule: Rule, filter: TypeFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'exempt') return rule.id.startsWith('A');
  return rule.applies_to.includes(filter);
}

/** ערך הפרמטר לסוג מבנה נתון. הוולידציה מבטיחה שאין שני ערכים שונים לאותו key ולאותו סוג. */
export function paramFor(chapter: Chapter, key: string, type: BuildingType): { rule: Rule; param: Param } | undefined {
  for (const rule of chapter.rules) {
    if (!rule.applies_to.includes(type)) continue;
    const param = rule.params?.find((p) => p.key === key);
    if (param) return { rule, param };
  }
  return undefined;
}

/** "לפי הגדול": שטח מרבי לפי ערך מוחלט או חלק יחסי משטח הייחוס (DATA-MODEL.md, כלל 2). */
export function largerOf(abs: number, ratio: number, referenceArea: number): number {
  return Math.max(abs, ratio * referenceArea);
}

export interface SectionNode {
  section: Section;
  rules: Rule[];
  children: SectionNode[];
  /** המקום של הסעיף הראשון בתת־העץ לפי סדר המסמך */
  order: number;
  /** המקום של כל סעיף ב־rules לפי סדר המסמך */
  ruleOrder: number[];
}

/** עץ הפרקים לפי סדר הופעה, עם הסעיפים של כל פרק. פרק בלי סעיפים חלים (גם בצאצאים) מושמט. */
export function sectionTree(chapter: Chapter, filter: TypeFilter): SectionNode[] {
  const nodes = new Map<string, SectionNode>();
  for (const s of chapter.sections) nodes.set(s.id, { section: s, rules: [], children: [], order: Infinity, ruleOrder: [] });
  chapter.rules.forEach((r, i) => {
    if (!appliesTo(r, filter)) return;
    const node = nodes.get(r.section)!;
    node.rules.push(r);
    node.ruleOrder.push(i);
    // הסדר עולה במעלה העץ, כדי שתת־פרק ימוקם בין הסעיפים של ההורה לפי המסמך
    for (let id: string | null = node.section.id; id; id = nodes.get(id)!.section.parent) {
      const n = nodes.get(id)!;
      n.order = Math.min(n.order, i);
    }
  });

  const roots: SectionNode[] = [];
  for (const s of chapter.sections) {
    const node = nodes.get(s.id)!;
    if (s.parent === null) roots.push(node);
    else nodes.get(s.parent)!.children.push(node);
  }

  const prune = (list: SectionNode[]): SectionNode[] =>
    list
      .map((n) => ({ ...n, children: prune(n.children) }))
      .filter((n) => n.rules.length > 0 || n.children.length > 0)
      .sort((a, b) => a.order - b.order);
  return prune(roots);
}

/** סדר הקריאה כמו במסמך: כותרת הפרק, ואחריה הסעיפים ותתי־הפרקים משולבים לפי סדר הופעתם. */
export function flatten(tree: SectionNode[]): Array<{ type: 'section'; node: SectionNode; depth: number } | { type: 'rule'; rule: Rule }> {
  const out: ReturnType<typeof flatten> = [];
  const walk = (n: SectionNode, depth: number) => {
    out.push({ type: 'section', node: n, depth });
    const items = [
      ...n.rules.map((rule, i) => ({ at: n.ruleOrder[i], rule })),
      ...n.children.map((child) => ({ at: child.order, child })),
    ].sort((a, b) => a.at - b.at);
    for (const item of items) {
      if ('rule' in item) out.push({ type: 'rule', rule: item.rule });
      else walk(item.child, depth + 1);
    }
  };
  tree.forEach((n) => walk(n, 0));
  return out;
}

export function hasScene(node: SectionNode): boolean {
  return node.rules.some((r) => r.scene) || node.children.some(hasScene);
}

/** המספר בשוליים: "(11)" כשמספר הפרק כבר מופיע בכותרת, ריק כשהסעיף הוא הפרק עצמו, אחרת המספר המלא. */
export function marginRef(rule: Rule, section: Section): string {
  if (rule.ref === section.ref) return '';
  if (rule.ref.startsWith(section.ref + ' ')) return rule.ref.slice(section.ref.length + 1);
  return rule.ref;
}
