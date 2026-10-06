import { useMemo } from 'react';
import type { Rule } from '../rules/load.ts';
import type { Search } from './index.ts';
import { wordRanges } from './highlight.ts';

export interface FindResult {
  ranges: Map<string, Array<[number, number]>>;
  base: Map<string, number>;
  total: number;
}

/** כל מופעי מילת החיפוש בנוסח, לפי סדר הקריאה. אם אין מופע מדויק, לפי הצורות בלי תחילית. */
export function useFind(search: Search, query: string, rules: Rule[]): FindResult {
  return useMemo(() => {
    const { exact, loose } = search.findTerms(query);
    const run = (terms: string[]) => {
      const ranges = new Map<string, Array<[number, number]>>();
      const base = new Map<string, number>();
      let total = 0;
      for (const r of rules) {
        const found = wordRanges(r.text, terms);
        if (!found.length) continue;
        ranges.set(r.id, found);
        base.set(r.id, total);
        total += found.length;
      }
      return { ranges, base, total };
    };
    const first = run(exact);
    return first.total || !loose.length ? first : run(loose);
  }, [search, query, rules]);
}
