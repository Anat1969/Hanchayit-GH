import { normalize, stems } from './hebrew.ts';

const WORD = /[\p{L}\p{N}"'״׳.]+/gu;

/** טווחי המילים בנוסח שאחת הצורות שלהן מתחילה באחד המונחים */
export function wordRanges(text: string, terms: string[]): Array<[number, number]> {
  if (!terms.length) return [];
  const out: Array<[number, number]> = [];
  for (const m of text.matchAll(WORD)) {
    const word = m[0].replace(/\.+$/, '');
    if (!word) continue;
    if (stems(normalize(word).replace(/\s+/g, '')).some((x) => terms.some((t) => x.startsWith(t)))) {
      out.push([m.index!, m.index! + word.length]);
    }
  }
  return out;
}
