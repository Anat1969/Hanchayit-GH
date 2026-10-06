import chapterAJson from '../data/chapter-a.json';
import chapterBJson from '../data/chapter-b.json';
import synonymsJson from '../data/synonyms.json';
import { mergeChapters, parseChapter, parseSynonyms } from './rules/load.ts';

/** פרק א' ופרק ב' כמסמך אחד, לפי סדר המסמך */
export const chapter = mergeChapters([parseChapter(chapterAJson), parseChapter(chapterBJson)]);
export const synonyms = parseSynonyms(synonymsJson);

export const rulesById = new Map(chapter.rules.map((r) => [r.id, r]));
export const sectionsById = new Map(chapter.sections.map((s) => [s.id, s]));
export const scenesById = new Map(chapter.scenes.map((s) => [s.id, s]));

/** תוויות קצרות לבורר ולטבלת הכותרת (SPEC.md, "סוג מבנה") */
export const TYPE_LABELS = {
  all: 'הכל',
  ground: 'צמודי קרקע',
  residential: 'מגורים רוויה',
  active: 'חזית פעילה',
  industrial: 'תעשייה',
} as const;

export const edition = /מהדורה מס' (\d+)/.exec(chapter.meta.source)?.[1] ?? '';
