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

const SECTION_NUMBER = /^\s*(\d+(?:\.\d+)*)\s*(?:\(\s*(\d+)\s*\)\s*([א-ת])?)?\s*$/;

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
      ref: r.ref,
      title: r.title,
      text: r.text,
      queryWords,
      terms: r.terms,
    }));
  }

  function byNumber(query: string): string | undefined {
    const m = SECTION_NUMBER.exec(query);
    if (!m) return undefined;
    const [, num, sub, letter] = m;
    if (sub) {
      const ref = `${num} (${sub})${letter ? ' ' + letter : ''}`;
      return chapter.rules.find((r) => r.ref === ref)?.id;
    }
    const exact = chapter.rules.find((r) => r.ref === num);
    if (exact) return exact.id;
    // מספר פרק: הסעיף הראשון בו או באחד מתתי־הפרקים
    return chapter.rules.find((r) => r.ref === num || r.ref.startsWith(num + ' ') || r.ref.startsWith(num + '.'))?.id;
  }

  return {
    search(query: string, allowed?: (id: string) => boolean): SearchResult {
      if (!tokenize(query).length) return { kind: 'hits', hits: [] };
      const jump = byNumber(query);
      if (jump) return { kind: 'jump', ruleId: jump };
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
