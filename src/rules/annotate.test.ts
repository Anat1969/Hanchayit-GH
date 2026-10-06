import { describe, expect, it } from 'vitest';
import { annotate, lineStarts } from './annotate.ts';
import { linkText } from './linkText.ts';
import { chapter } from '../data.ts';

const rule = (id: string) => chapter.rules.find((r) => r.id === id)!;
const joined = (lines: ReturnType<typeof annotate>) => lines.map((l) => l.map((t) => t.text).join('')).join('');

describe('annotate', () => {
  it('הנוסח לא משתנה, בכל הסעיפים', () => {
    for (const r of chapter.rules) expect(joined(annotate(linkText(r), [], 0))).toBe(r.text);
  });

  it('כל משפט בשורה חדשה, ומספר עשרוני לא שובר שורה', () => {
    const lines = annotate(linkText(rule('B1.2.1-2')), [], 0);
    expect(lines).toHaveLength(2);
    expect(lines[0].map((t) => t.text).join('')).toContain("1.8 מ'");
  });

  it('פריטי רשימה ("א.") בשורה משלהם', () => {
    const t = rule('B2.2.2-1').text;
    const starts = lineStarts(t);
    expect(starts.some((s) => t.slice(s).startsWith('א.'))).toBe(true);
    expect(starts.some((s) => t.slice(s).startsWith('ב.'))).toBe(true);
  });

  it('מילות חובה ואיסור מודגשות, וכותרת פנימית מודגשת', () => {
    const strong = (id: string) => annotate(linkText(rule(id)), [], 0).flat().filter((t) => t.strong).map((t) => t.text);
    expect(strong('B1.2.1-2').join('|')).toContain('לא יעלה על');
    expect(strong('A3.1.2')[0]).toBe('סוכך מתקפל (מרקיזה):');
  });

  it('התאמות חיפוש ממוספרות לפי המסמך', () => {
    const lines = annotate(linkText(rule('B1.2.1-2')), [[0, 4], [10, 14]], 7);
    expect(lines.flat().filter((t) => t.find !== undefined).map((t) => t.find)).toEqual([7, 8]);
  });
});
