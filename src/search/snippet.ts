import { normalize, stems } from './hebrew.ts';

export type SnippetPart = { text: string; match?: boolean };

const WORD = /[\p{L}\p{N}"'״׳.]+/gu;

/**
 * קטע קצר מהנוסח סביב ההתאמה הראשונה, עם המילים שהתאימו מסומנות.
 * קודם מסמנים מילים שמכילות את מילת החיפוש כפי שהוקלדה, ורק אם אין כאלה את הצורות בלי תחילית.
 */
export function snippet(text: string, queryWords: string[], terms: string[], radius = 60): SnippetPart[] {
  const words = [...text.matchAll(WORD)].map((m) => ({ start: m.index!, end: m.index! + m[0].length, word: m[0] }));
  const matching = (list: string[]) =>
    words.filter((w) => stems(normalize(w.word).replace(/\s+/g, '')).some((x) => list.some((t) => x.startsWith(t))));
  const exact = matching(queryWords);
  const hits = exact.length ? exact : matching(terms);
  const first = hits[0]?.start ?? 0;
  let from = Math.max(0, first - radius);
  let to = Math.min(text.length, first + radius * 2);
  // לא לחתוך באמצע מילה
  from = from === 0 ? 0 : (words.find((w) => w.start >= from)?.start ?? from);
  to = to === text.length ? to : ([...words].reverse().find((w) => w.end <= to)?.end ?? to);

  const parts: SnippetPart[] = [];
  if (from > 0) parts.push({ text: '…' });
  let pos = from;
  for (const h of hits) {
    if (h.start < from || h.end > to) continue;
    if (h.start > pos) parts.push({ text: text.slice(pos, h.start) });
    parts.push({ text: text.slice(h.start, h.end), match: true });
    pos = h.end;
  }
  if (to > pos) parts.push({ text: text.slice(pos, to) });
  if (to < text.length) parts.push({ text: '…' });
  return parts;
}
