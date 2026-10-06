import type { Param, Rule } from './load.ts';

export type TextPart = { text: string } | { text: string; paramKey: string };

const NUMBER = /\d+(?:\.\d+)?(?:\/\d+)?/g;
// טווח כמו "80–120 ס"מ": היחידה מופיעה רק אחרי המספר השני
const RANGE_TAIL = /^\s*[–-]\s*\d+(?:\.\d+)?/;

const UNIT: Record<string, RegExp> = {
  m: /^\s*(?:מ['׳](?![א-ת])|מטר|מ$)/,
  cm: /^\s*ס["״]מ/,
  m2: /^\s*מ["״]ר/,
  percent: /^\s*%/,
  floors: /^\s*קומות/,
  days: /^\s*ימים/,
  any: /^/,
};

const FRACTIONS: Record<string, string> = { '0.667': '2/3', '0.333': '1/3', '0.25': '1/4' };

function fmt(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

/** הצורות שבהן ערך הפרמטר יכול להופיע בנוסח, כמספר ויחידה. */
function forms(p: Param): Array<{ number: string; unit: RegExp }> {
  if (typeof p.value !== 'number') return [];
  const v = p.value;
  switch (p.unit) {
    case 'm':
      return [
        { number: fmt(v), unit: UNIT.m },
        { number: fmt(v * 100), unit: UNIT.cm },
        { number: v.toFixed(2), unit: UNIT.m },
      ];
    case 'm2':
      return [{ number: fmt(v), unit: UNIT.m2 }];
    case 'ratio': {
      const out = [{ number: fmt(v * 100), unit: UNIT.percent }];
      const frac = FRACTIONS[fmt(v)];
      if (frac) out.push({ number: frac, unit: UNIT.any });
      return out;
    }
    case 'floors':
      return [{ number: fmt(v), unit: UNIT.floors }, { number: fmt(v), unit: UNIT.any }];
    case 'days_per_year':
      return [{ number: fmt(v), unit: UNIT.days }];
    default:
      return [{ number: fmt(v), unit: UNIT.any }];
  }
}

/**
 * מפרק את נוסח הסעיף לקטעים, ומסמן את המקומות שבהם מופיע ערך של פרמטר.
 * הנוסח עצמו לא משתנה: חיבור כל הקטעים מחזיר בדיוק את rule.text.
 */
export function linkText(rule: Rule): TextPart[] {
  const text = rule.text;
  const tokens = [...text.matchAll(NUMBER)].map((m) => ({ start: m.index!, end: m.index! + m[0].length, value: m[0] }));
  const claimed = new Map<number, { end: number; paramKey: string }>();

  for (const p of rule.params ?? []) {
    // רשימת שעות ("10:00, 12:00, 15:00"): כל שעה מסומנת בנפרד
    if (Array.isArray(p.value)) {
      for (const literal of p.value) {
        const start = text.indexOf(literal);
        if (start >= 0 && !claimed.has(start)) claimed.set(start, { end: start + literal.length, paramKey: p.key });
      }
      continue;
    }
    let found = false;
    for (const f of forms(p)) {
      for (const t of tokens) {
        if ([...claimed].some(([s, c]) => t.start >= s && t.start < c.end) || t.value !== f.number) continue;
        const after = text.slice(t.end);
        const direct = f.unit.exec(after);
        const range = direct ? null : RANGE_TAIL.exec(after);
        const viaRange = range ? f.unit.exec(after.slice(range[0].length)) : null;
        if (!direct && !viaRange) continue;
        const end = direct && f.unit !== UNIT.any ? t.end + direct[0].length : t.end;
        claimed.set(t.start, { end, paramKey: p.key });
        found = true;
        break;
      }
      if (found) break;
    }
  }

  const parts: TextPart[] = [];
  let pos = 0;
  for (const start of [...claimed.keys()].sort((a, b) => a - b)) {
    const { end, paramKey } = claimed.get(start)!;
    if (start > pos) parts.push({ text: text.slice(pos, start) });
    parts.push({ text: text.slice(start, end), paramKey });
    pos = end;
  }
  if (pos < text.length) parts.push({ text: text.slice(pos) });
  return parts;
}
