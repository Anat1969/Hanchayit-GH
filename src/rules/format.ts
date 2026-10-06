import type { Param } from './load.ts';

const NBSP = ' ';
const FRACTIONS: Record<string, string> = { '0.667': '2/3', '0.333': '1/3', '0.25': '1/4' };
const SIGN: Record<Param['op'], string> = { '=': '', '<=': '≤', '>=': '≥', '<': '<', '>': '>' };

const round = (n: number, digits = 3) => String(Math.round(n * 10 ** digits) / 10 ** digits);

/**
 * ערך הפרמטר בכתיב של הנוסח: "1.8 מ'", "60 ס"מ", "40%", "2/3".
 * יחס נכתב כשבר רק כשהנוסח עצמו כותב אותו כך (text), אחרת באחוזים.
 */
export function formatValue(p: Pick<Param, 'value' | 'unit'>, text?: string): string {
  if (Array.isArray(p.value)) return p.value.join(', ');
  const v = p.value;
  switch (p.unit) {
    case 'm':
      return v < 1 ? `${round(v * 100)}${NBSP}ס"מ` : `${round(v)}${NBSP}מ'`;
    case 'm2':
      return `${round(v)}${NBSP}מ"ר`;
    case 'ratio': {
      const frac = FRACTIONS[round(v)];
      return frac && (text === undefined || text.includes(frac)) ? frac : `${round(v * 100)}%`;
    }
    case 'floors':
      return `${round(v)}${NBSP}קומות`;
    case 'days_per_year':
      return `${round(v)}${NBSP}ימים`;
    default:
      return round(v);
  }
}

/** מידה מגבילה מקבלת סימן ≤ או ≥ לפני הערך (DESIGN.md, "מידות"). */
export function isLimit(p: Pick<Param, 'op'>): boolean {
  return p.op !== '=';
}

const LRI = '\u2066';
const PDI = '\u2069';

/**
 * תווית מידה: "≤ 1.8 מ'". הסימן והמספר מבודדים כקטע משמאל לימין,
 * אחרת בהקשר עברי הדפדפן משקף את ≤ ומציג אותו כ־≥.
 */
export function formatDimension(p: Pick<Param, 'value' | 'unit' | 'op'>, ruleText?: string): string {
  const sign = SIGN[p.op];
  if (!sign) return formatValue(p, ruleText);
  const text = formatValue(p, ruleText);
  const m = /^([\d./%]+)(?:\u00A0(.+))?$/.exec(text);
  if (!m) return `${LRI}${sign}${PDI}${NBSP}${text}`;
  const [, number, unit] = m;
  return `${LRI}${sign}${NBSP}${number}${PDI}${unit ? NBSP + unit : ''}`;
}
