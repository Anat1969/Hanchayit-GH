import type { TextPart } from './linkText.ts';

/** קטע בנוסח עם כל הסימונים שלו. חיבור כל הקטעים מחזיר את הנוסח כמות שהוא. */
export interface Token {
  text: string;
  paramKey?: string;
  /** מספר ההתאמה לחיפוש, במספור של כל המסמך */
  find?: number;
  strong?: boolean;
}

// מילים שקובעות את החובה במשפט: איסור, מגבלה, חובה ופטור
const EMPHASIS =
  /(לא (?:יעלה|יעלו|תעלה|יפחת|יפחתו|תפחת|תותר|יותר|יותרו|יבלוט|תחרוג|יחרוג|ימוקם|ימוקמו|יוצבו|יוקם)(?: על| מ| מעבר)?|אין (?:להציב|להתקין|להפנות|לבצע)|אסור|חובה|חלה חובת (?:דיווח|הודעה)|לפחות|לכל היותר|בלבד|ובלבד ש|פטור(?:ה|ים)? מהיתר|אינה פטורה מהיתר|טעונ(?:ות|ה) היתר|יש (?:לוודא|לצרף|להקפיד|להציג|לשמר))/g;

// כותרת פנימית בתחילת משפט: "סוכך מתקפל (מרקיזה):"
const RUN_IN = /^[^:.;]{2,48}:(?=\s)/;

/** תחילת כל משפט ותחילת כל פריט ברשימה ("א.", "(1)") עוברים לשורה חדשה */
export function lineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length - 1; i++) {
    if (text[i] !== '.' || text[i + 1] !== ' ') continue;
    const word = /[^\s(]+$/.exec(text.slice(0, i))?.[0] ?? '';
    // "א." ו־"(1)" הם סימני פריט, לא סוף משפט
    if (word.length < 2 || /^\(?\d+\)?$/.test(word) && /^\s*[א-ת]/.test(text.slice(i + 2)) === false) continue;
    starts.push(i + 2);
  }
  const item = /(?<=[:;.] )(?:[א-ת]\.|\(\d+\)) /g;
  for (const m of text.matchAll(item)) starts.push(m.index!);
  return [...new Set(starts)].filter((s) => s < text.length).sort((a, b) => a - b);
}

export function annotate(parts: TextPart[], finds: Array<[number, number]>, findBase: number): Token[][] {
  const text = parts.map((p) => p.text).join('');
  const n = text.length;
  const param: Array<string | undefined> = new Array(n);
  const find: Array<number | undefined> = new Array(n);
  const strong = new Array<boolean>(n).fill(false);

  let pos = 0;
  for (const p of parts) {
    if ('paramKey' in p) for (let i = pos; i < pos + p.text.length; i++) param[i] = p.paramKey;
    pos += p.text.length;
  }
  finds.forEach(([s, e], k) => {
    for (let i = s; i < e; i++) find[i] = findBase + k;
  });
  for (const m of text.matchAll(EMPHASIS)) for (let i = m.index!; i < m.index! + m[0].length; i++) strong[i] = true;

  const starts = lineStarts(text);
  for (const s of starts) {
    const m = RUN_IN.exec(text.slice(s));
    if (m) for (let i = s; i < s + m[0].length; i++) strong[i] = true;
  }

  const lines: Token[][] = [];
  starts.forEach((s, li) => {
    const e = starts[li + 1] ?? n;
    const line: Token[] = [];
    let i = s;
    while (i < e) {
      let j = i + 1;
      while (j < e && param[j] === param[i] && find[j] === find[i] && strong[j] === strong[i]) j++;
      line.push({ text: text.slice(i, j), paramKey: param[i], find: find[i], strong: strong[i] || undefined });
      i = j;
    }
    lines.push(line);
  });
  return lines;
}
