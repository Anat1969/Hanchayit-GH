import { createContext, useContext } from 'react';
import type { Chapter, Param } from '../rules/load.ts';
import { formatValue } from '../rules/format.ts';

/**
 * מצב בחינה (SPEC.md, שלב 4): ערכים שנבחנים נשמרים בזיכרון בלבד, לפי param.key.
 * הנתונים עצמם לא משתנים; כל תצוגה משווה מול המהדורה המאושרת.
 */
export interface ReviewState {
  active: boolean;
  overrides: Record<string, number>;
  set: (key: string, value: number | undefined) => void;
}

export const ReviewContext = createContext<ReviewState>({ active: false, overrides: {}, set: () => {} });

export const useReview = () => useContext(ReviewContext);

/** טווח וצעד למחוון, לפי היחידה */
export function sliderRange(p: Param): { min: number; max: number; step: number } {
  const v = p.value as number;
  switch (p.unit) {
    case 'ratio':
      return { min: 0, max: Math.max(1, v), step: 0.01 };
    case 'm':
      return { min: 0, max: Math.max(1, Math.ceil(v * 2)), step: v < 1 ? 0.05 : 0.1 };
    case 'm2':
      return { min: 0, max: Math.ceil(v * 2), step: 1 };
    case 'floors':
    case 'spaces_per_tree':
      return { min: 1, max: Math.ceil(v * 2), step: 1 };
    case 'days_per_year':
      return { min: 0, max: 365, step: 5 };
    default:
      return { min: 0, max: Math.max(1, v * 2), step: v < 1 ? 0.01 : 0.1 };
  }
}

export interface Change {
  key: string;
  rules: Array<{ id: string; ref: string }>;
  unit: Param['unit'];
  original: number;
  tested: number;
}

/** רשימת השינויים שנבחנו, עם כל הסעיפים שבהם מופיע כל פרמטר */
export function changes(chapter: Chapter, overrides: Record<string, number>): Change[] {
  const out: Change[] = [];
  for (const [key, tested] of Object.entries(overrides)) {
    const rules = chapter.rules.filter((r) => r.params?.some((p) => p.key === key));
    const param = rules[0]?.params?.find((p) => p.key === key);
    if (!param || typeof param.value !== 'number' || param.value === tested) continue;
    out.push({ key, rules: rules.map((r) => ({ id: r.id, ref: r.ref })), unit: param.unit, original: param.value, tested });
  }
  return out;
}

const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** קובץ CSV לטיוטת מהדורה. BOM כדי שאקסל יקרא עברית. */
export function changesCsv(list: Change[], edition: string): string {
  const head = ['סעיפים', 'מזהים', 'פרמטר', 'ערך במהדורה ' + edition, 'ערך שנבחן'];
  const rows = list.map((c) => [
    c.rules.map((r) => r.ref).join('; '),
    c.rules.map((r) => r.id).join('; '),
    c.key,
    formatValue({ value: c.original, unit: c.unit }).replace(/ /g, ' '),
    formatValue({ value: c.tested, unit: c.unit }).replace(/ /g, ' '),
  ]);
  return '﻿' + [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
