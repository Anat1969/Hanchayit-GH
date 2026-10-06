import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { chapter } from '../data.ts';
import { parseChapter } from './load.ts';
import { appliesTo, flatten, largerOf, marginRef, paramFor, sectionTree } from './derive.ts';
import { linkText } from './linkText.ts';

const raw = () => JSON.parse(readFileSync('data/chapter-b.json', 'utf8'));

describe('ולידציה', () => {
  it('הקובץ תקין', () => expect(() => parseChapter(raw())).not.toThrow());

  it('שני ערכים שונים לאותו key ולאותו סוג מבנה הם שגיאה', () => {
    const c = raw();
    const rule = c.rules.find((r: { id: string }) => r.id === 'B2.7.1-7');
    rule.params[0].value = 60;
    expect(() => parseChapter(c)).toThrow(/pergola_area_max_abs/);
  });

  it('הפניה לסצנה שלא קיימת היא שגיאה', () => {
    const c = raw();
    c.rules[0].scene = 'no-such-scene';
    expect(() => parseChapter(c)).toThrow(/no-such-scene/);
  });

  it('שדה לא מוכר הוא שגיאה', () => {
    const c = raw();
    c.rules[0].extra = 1;
    expect(() => parseChapter(c)).toThrow();
  });
});

describe('סינון וסדר', () => {
  it('כל 146 הסעיפים מופיעים בסדר הקריאה, כל אחד פעם אחת', () => {
    const rules = flatten(sectionTree(chapter, 'all')).filter((x) => x.type === 'rule');
    expect(rules).toHaveLength(146);
    expect(new Set(rules.map((x) => x.type === 'rule' && x.rule.id)).size).toBe(146);
  });

  it('סינון לפי סוג מבנה משאיר רק סעיפים שחלים עליו', () => {
    for (const t of ['ground', 'residential', 'active', 'industrial'] as const) {
      const rules = flatten(sectionTree(chapter, t)).flatMap((x) => (x.type === 'rule' ? [x.rule] : []));
      expect(rules.length).toBe(chapter.rules.filter((r) => appliesTo(r, t)).length);
      expect(rules.every((r) => r.applies_to.includes(t))).toBe(true);
    }
  });

  it('פרק בלי סעיפים חלים לא מוצג', () => {
    const titles = flatten(sectionTree(chapter, 'industrial')).flatMap((x) => (x.type === 'section' ? [x.node.section.id] : []));
    expect(titles).not.toContain('B1');
  });

  it('מספר בשוליים', () => {
    const s = (id: string) => chapter.sections.find((x) => x.id === id)!;
    const r = (id: string) => chapter.rules.find((x) => x.id === id)!;
    expect(marginRef(r('B2.2.1-11'), s('B2.2.1'))).toBe('(11)');
    expect(marginRef(r('B1.3.3'), s('B1.3'))).toBe('1.3.3');
    expect(marginRef(r('B1.1'), s('B1.1'))).toBe('');
  });
});

describe('פרמטרים', () => {
  it('ערך לפי סוג מבנה', () => {
    expect(paramFor(chapter, 'fence_internal_height_max', 'ground')?.rule.id).toBe('B1.2.1-6');
    expect(paramFor(chapter, 'fence_internal_height_max', 'residential')?.rule.id).toBe('B2.2.1-7');
    expect(paramFor(chapter, 'fence_internal_height_max', 'industrial')).toBeUndefined();
  });

  it('"לפי הגדול"', () => {
    expect(largerOf(50, 0.25, 100)).toBe(50);
    expect(largerOf(50, 0.25, 400)).toBe(100);
  });
});

describe('ערכים מקושרים בנוסח', () => {
  // ערך שאינו מופיע בנוסח כמספר: 9 קומות נגזר מ"10 קומות ומעלה"
  const NOT_IN_TEXT = new Set(['B2.3.7-1/garden_apt_floors_max']);

  it('הנוסח לא משתנה', () => {
    for (const r of chapter.rules) expect(linkText(r).map((p) => p.text).join('')).toBe(r.text);
  });

  it('כל פרמטר נמצא בנוסח', () => {
    for (const r of chapter.rules) {
      const linked = new Set(linkText(r).flatMap((p) => ('paramKey' in p ? [p.paramKey] : [])));
      for (const p of r.params ?? []) {
        if (NOT_IN_TEXT.has(`${r.id}/${p.key}`)) continue;
        expect(linked, `${r.id} ${p.key}`).toContain(p.key);
      }
    }
  });

  it('הערך המסומן כולל את היחידה', () => {
    const parts = linkText(chapter.rules.find((r) => r.id === 'B1.2.1-2')!);
    expect(parts.filter((p) => 'paramKey' in p).map((p) => p.text)).toEqual(["1.8 מ'", '70 ס"מ']);
  });

  it('טווח: שני הקצוות מסומנים', () => {
    const parts = linkText(chapter.rules.find((r) => r.id === 'B2.2.1-6')!);
    const byKey = Object.fromEntries(parts.flatMap((p) => ('paramKey' in p ? [[p.paramKey, p.text]] : [])));
    expect(byKey.terrace_bed_height_min).toBe('80');
    expect(byKey.terrace_bed_height_max).toBe('120 ס"מ');
  });
});

describe('סדר המסמך', () => {
  it('סדר הקריאה זהה לסדר הסעיפים בקובץ', () => {
    const order = flatten(sectionTree(chapter, 'all')).flatMap((x) => (x.type === 'rule' ? [x.rule.id] : []));
    expect(order).toEqual(chapter.rules.map((r) => r.id));
  });
});
