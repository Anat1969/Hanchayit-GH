import { describe, expect, it } from 'vitest';
import { chapter, synonyms } from '../data.ts';
import { buildSearch, type SearchResult } from './index.ts';

const s = buildSearch(chapter, synonyms);
const ids = (r: SearchResult) => (r.kind === 'hits' ? r.hits.map((h) => h.id) : []);

describe('חיפוש', () => {
  it('התאמה לפי תחילית: "גדר" מוצא "גדרות"', () => {
    const r = ids(s.search('גדר'));
    const withPlural = chapter.rules.filter((x) => x.text.includes('גדרות')).map((x) => x.id);
    expect(withPlural.length).toBeGreaterThan(0);
    for (const id of withPlural) expect(r).toContain(id);
  });

  it('הסרת תחיליות: "והגדרות" ו"בגדר" מוצאים סעיפי גדר', () => {
    expect(ids(s.search('והגדרות'))).toContain('B1.2.1-6');
    expect(ids(s.search('בגדר'))).toContain('B1.2.1-2');
  });

  it('ניקוד וגרשיים לא משנים את התוצאה', () => {
    expect(ids(s.search('מִצְלָלָה'))).toEqual(ids(s.search('מצללה')));
    expect(ids(s.search('מה"ע'))).toEqual(ids(s.search('מה״ע')));
    expect(ids(s.search('מה"ע')).length).toBeGreaterThan(0);
  });

  it('מילים נרדפות: "פרגולה" מוצאת את סעיפי המצללה', () => {
    const r = ids(s.search('פרגולה'));
    expect(r).toContain('B2.7.1-1');
    expect(r).toContain('B2.7.1-6');
  });

  it('מילים נרדפות של כמה מילים: "קיר תומך" מוצא "קיר תמך"', () => {
    expect(ids(s.search('קיר תומך'))).toContain('B2.2.1-6');
  });

  it('מספר סעיף קופץ ישר לסעיף', () => {
    expect(s.search('2.7.1')).toEqual({ kind: 'jump', ruleId: 'B2.7.1-1' });
    expect(s.search('2.2.1 (11)')).toEqual({ kind: 'jump', ruleId: 'B2.2.1-11' });
    expect(s.search('2.2.1 (3) א')).toEqual({ kind: 'jump', ruleId: 'B2.2.1-3a' });
    expect(s.search('2.10')).toEqual({ kind: 'jump', ruleId: 'B2.10' });
  });

  it('מספר שקיים בשני הפרקים: שתי תוצאות, ואות פרק בוחרת אחד', () => {
    expect(ids(s.search('1.2'))).toEqual(['A1.2', 'B1.2.1-1']);
    expect(s.search('א 1.2')).toEqual({ kind: 'jump', ruleId: 'A1.2' });
    expect(s.search("ב' 1.2")).toEqual({ kind: 'jump', ruleId: 'B1.2.1-1' });
    expect(s.search('פרק א 3.2.4')).toEqual({ kind: 'jump', ruleId: 'A3.2.4' });
  });

  it('חיפוש בפרק א\'', () => {
    expect(ids(s.search('מחסן'))).toContain('A7.1.2');
    expect(ids(s.search('דוד שמש'))).toContain('A4.6.1');
  });

  it('סינון לפי סוג מבנה', () => {
    const r = ids(s.search('גדר', (id) => chapter.rules.find((x) => x.id === id)!.applies_to.includes('industrial')));
    expect(r.length).toBeGreaterThan(0);
    expect(r).not.toContain('B1.2.1-2');
  });

  it('אין תוצאות: מחזיר הצעות שיש להן תוצאות בלבד', () => {
    const r = s.search('קסילופון');
    expect(r.kind).toBe('empty');
    const near = s.search('פרגולות');
    expect(near.kind).toBe('hits');
    const typo = s.search('מסלעות');
    if (typo.kind === 'empty') for (const t of typo.suggestions) expect(ids(s.search(t)).length).toBeGreaterThan(0);
  });

  it('שאילתה ריקה', () => expect(s.search('  ')).toEqual({ kind: 'hits', hits: [] }));
});
