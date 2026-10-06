import MiniSearch from 'minisearch';
import type { Chapter, Synonyms } from '../rules/load.ts';
import { normalize, stems, tokenize } from './hebrew.ts';

export interface SearchDoc {
  id: string;
  ref: string;
  title: string;
  text: string;
}

export interface SearchHit {
  id: string;
  /** אות הפרק: א או ב */
  chapter: string;
  ref: string;
  title: string;
  text: string;
  /** מילות השאילתה והמילים הנרדפות כפי שהוקלדו, לסימון בקטע */
  queryWords: string[];
  /** המילים מהנוסח שהתאימו, כולל אחרי הסרת תחיליות */
  terms: string[];
}

export type SearchResult =
  | { kind: 'jump'; ruleId: string }
  | { kind: 'hits'; hits: SearchHit[] }
  | { kind: 'empty'; suggestions: string[] };

// "2.7.1", "2.2.1 (11)", "2.2.1 (3) א", ועם אות פרק: "א 2.1", "פרק ב' 2.7.1"
const SECTION_NUMBER = /^\s*(?:(?:פרק\s*)?([אב])['׳]?\s+)?(\d+(?:\.\d+)*)\s*(?:\(\s*(\d+)\s*\)\s*([א-ת])?)?\s*$/;
const CHAPTER_LETTER: Record<string, string> = { א: 'A', ב: 'B' };
const LETTER_OF: Record<string, string> = { A: 'א', B: 'ב' };

const options = {
  fields: ['ref', 'title', 'text', 'sceneTitle'],
  storeFields: ['ref', 'title', 'text'],
  tokenize,
  processTerm: (term: string) => stems(term),
  searchOptions: {
    boost: { ref: 3, title: 2, sceneTitle: 1.5 },
    prefix: true,
    combineWith: 'OR' as const,
  },
};

export function buildSearch(chapter: Chapter, synonyms: Synonyms) {
  const sections = new Map(chapter.sections.map((s) => [s.id, s]));
  const scenes = new Map(chapter.scenes.map((s) => [s.id, s]));
  const docs = chapter.rules.map((r) => ({
    id: r.id,
    ref: r.ref,
    title: sections.get(r.section)!.title,
    text: r.text,
    sceneTitle: r.scene ? scenes.get(r.scene)!.title : '',
  }));
  const index = new MiniSearch<(typeof docs)[number]>(options);
  index.addAll(docs);
  const docsList = docs;

  const groups = synonyms.groups.map((g) => g.map(normalize));
  const allSynonyms = [...new Set(synonyms.groups.flat())];

  /** הביטוי ומילים נרדפות שלו. ביטוי של כמה מילים נבדק כרצף שלם. */
  function expand(query: string): string[] {
    const q = ` ${tokenize(query).join(' ')} `;
    const out = [query];
    for (const g of groups) {
      if (g.some((term) => q.includes(` ${tokenize(term).join(' ')} `))) {
        for (const term of g) if (!out.includes(term)) out.push(term);
      }
    }
    return out;
  }

  function hits(query: string, allowed?: (id: string) => boolean): SearchHit[] {
    const queries = expand(query);
    const queryWords = queries.flatMap(tokenize);
    const full = new Set(queryWords);
    const results = index.search(
      { combineWith: 'OR', queries },
      {
        filter: allowed ? (r) => allowed(r.id) : undefined,
        // המילה כפי שהוקלדה גוברת על הצורה בלי תחילית ("מצללה" לפני "הצללה")
        boostTerm: (term) => (full.has(term) ? 1 : 0.4),
      },
    );
    return results.map((r) => ({
      id: r.id,
      chapter: LETTER_OF[r.id[0]],
      ref: r.ref,
      title: r.title,
      text: r.text,
      queryWords,
      terms: r.terms,
    }));
  }

  /** הסעיפים שמספרם הוקלד, אחד לכל פרק שבו המספר קיים */
  function byNumber(query: string): string[] | undefined {
    const m = SECTION_NUMBER.exec(query);
    if (!m) return undefined;
    const [, chapterLetter, num, sub, letter] = m;
    const prefixes = chapterLetter ? [CHAPTER_LETTER[chapterLetter]] : ['A', 'B'];
    return prefixes.flatMap((prefix) => {
      const rules = chapter.rules.filter((r) => r.id.startsWith(prefix));
      if (sub) {
        const ref = `${num} (${sub})${letter ? ' ' + letter : ''}`;
        return rules.filter((r) => r.ref === ref).slice(0, 1).map((r) => r.id);
      }
      const exact = rules.find((r) => r.ref === num);
      // מספר פרק: הסעיף הראשון בו או באחד מתתי־הפרקים
      const first = exact ?? rules.find((r) => r.ref.startsWith(num + ' ') || r.ref.startsWith(num + '.'));
      return first ? [first.id] : [];
    });
  }

  return {
    /**
     * מונחים לסימון בתוך המסמך: המילים שהוקלדו והמילים הנרדפות שלהן.
     * מספר סעיף אינו מסומן. גם הצורות בלי תחילית, לשימוש כשאין התאמה מדויקת.
     */
    findTerms(query: string): { exact: string[]; loose: string[] } {
      if (!tokenize(query).length || SECTION_NUMBER.test(query)) return { exact: [], loose: [] };
      const exact = [...new Set(expand(query).flatMap(tokenize))].filter((t) => t.length >= 2);
      const loose = [...new Set(exact.flatMap(stems))].filter((t) => t.length >= 3);
      return { exact, loose };
    },
    search(query: string, allowed?: (id: string) => boolean): SearchResult {
      if (!tokenize(query).length) return { kind: 'hits', hits: [] };
      const numbered = byNumber(query);
      if (numbered?.length === 1) return { kind: 'jump', ruleId: numbered[0] };
      if (numbered && numbered.length > 1) {
        // אותו מספר בשני הפרקים: שתי תוצאות לבחירה
        const docs = new Map(docsList.map((d) => [d.id, d]));
        return {
          kind: 'hits',
          hits: numbered.map((id) => ({ ...docs.get(id)!, chapter: LETTER_OF[id[0]], queryWords: [], terms: [] })),
        };
      }
      const found = hits(query, allowed);
      if (found.length) return { kind: 'hits', hits: found };
      // הצעות: מונחים מרשימת המילים הנרדפות שדומים לשאילתה ויש להם תוצאות
      const near = new MiniSearch({ fields: ['term'], storeFields: ['term'], tokenize, processTerm: (t: string) => stems(t) });
      near.addAll(allSynonyms.map((term, id) => ({ id, term })));
      const suggestions = near
        .search(query, { fuzzy: 0.34, prefix: true })
        .map((r) => r.term as string)
        .filter((term) => hits(term, allowed).length > 0)
        .slice(0, 3);
      return { kind: 'empty', suggestions };
    },
  };
}

export type Search = ReturnType<typeof buildSearch>;
