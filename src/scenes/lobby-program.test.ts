import { describe, expect, it } from 'vitest';
import { parseArea, parseHeight } from './lobby-program.ts';
import { FLOOR } from './fixtures.ts';

describe('פענוח טבלת השטחים', () => {
  it('ליח"ד עם מינימום', () => {
    expect(parseArea('2 מ"ר ליח"ד, מינימום 10 מ"ר', 16)).toBe(32);
    expect(parseArea('2 מ"ר ליח"ד, מינימום 10 מ"ר', 4)).toBe(10);
  });
  it('תוספת לכל יח"ד מעל סף', () => {
    expect(parseArea('10 מ"ר + 0.4 מ"ר לכל יח"ד מעל 24', 40)).toBeCloseTo(16.4);
    expect(parseArea('30 מ"ר + 0.4 מ"ר לכל יח"ד מעל 60; ניתן לפצל לשניים', 80)).toBeCloseTo(38);
  });
  it('לפי הגדול', () => {
    expect(parseArea('100 מ"ר או 1 מ"ר לכל יח"ד, לפי הגדול; בקומת הקרקע/ בקומת הגג', 80)).toBe(100);
    expect(parseArea('100 מ"ר או 1 מ"ר לכל יח"ד, לפי הגדול', 150)).toBe(150);
  });
  it('ערך פשוט, אין חובה, ולא מוכר', () => {
    expect(parseArea('60 מ"ר', 40)).toBe(60);
    expect(parseArea('אין חובה', 40)).toBe(0);
    expect(parseArea('בקומת הקרקע', 40)).toBeUndefined();
  });
  it('גובה מבואה', () => {
    expect(parseHeight("עד 6 מ'")).toBe(6);
    expect(parseHeight('גובה כפול של קומה טיפוסית')).toBe(2 * FLOOR.typicalHeight);
  });
});
