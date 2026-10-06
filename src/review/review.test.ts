import { describe, expect, it } from 'vitest';
import { chapter } from '../data.ts';
import { changes, changesCsv, sliderRange } from './review.ts';

describe('מצב בחינה', () => {
  it('רשימת שינויים: כל הסעיפים של הפרמטר, בלי ערכים שלא השתנו', () => {
    const list = changes(chapter, { fence_internal_height_max: 1.6, fence_height_max: 1.8 });
    expect(list).toHaveLength(1);
    expect(list[0].rules.map((r) => r.id)).toEqual(['B1.2.1-6', 'B2.2.1-7']);
    expect(list[0].original).toBe(1.5);
  });

  it('CSV עם BOM, ערכים בכתיב הנוסח', () => {
    const csv = changesCsv(changes(chapter, { fence_height_max: 2 }), '18');
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain("1.2.1 (2),B1.2.1-2,fence_height_max,1.8 מ',2 מ'");
  });

  it('טווח המחוון כולל את הערך המקורי', () => {
    for (const r of chapter.rules) {
      for (const p of r.params ?? []) {
        if (typeof p.value !== 'number') continue;
        const { min, max } = sliderRange(p);
        expect(p.value).toBeGreaterThanOrEqual(min);
        expect(p.value).toBeLessThanOrEqual(max);
      }
    }
  });
});
