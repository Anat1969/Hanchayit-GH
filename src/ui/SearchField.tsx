import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Search, SearchResult } from '../search/index.ts';
import { snippet } from '../search/snippet.ts';
import s from './SearchField.module.css';

export function SearchField({ search, allowed, onNavigate }: {
  search: Search;
  allowed: (id: string) => boolean;
  onNavigate: (ruleId: string, mode?: 'push' | 'replace') => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);

  const result: SearchResult = useMemo(() => search.search(query, allowed), [search, query, allowed]);
  const hits = result.kind === 'hits' ? result.hits.slice(0, 30) : [];

  // מספר סעיף קופץ ישר לסעיף, בלי רשימה
  useEffect(() => {
    if (result.kind !== 'jump') return;
    const t = setTimeout(() => onNavigate(result.ruleId, 'replace'), 250);
    return () => clearTimeout(t);
  }, [result]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const choose = (id: string) => {
    onNavigate(id);
    setOpen(false);
  };

  const showList = open && query.trim() !== '' && result.kind !== 'jump';

  return (
    <div className={s.root} ref={root}>
      <label htmlFor={`${listId}-input`} className="visually-hidden">חיפוש</label>
      <input
        id={`${listId}-input`}
        className={s.input}
        type="search"
        placeholder="חיפוש לפי מילה או מספר סעיף"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && hits[cursor] ? `${listId}-${cursor}` : undefined}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setCursor((c) => Math.min(c + 1, hits.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setCursor((c) => Math.max(c - 1, 0));
          } else if (e.key === 'Enter') {
            if (result.kind === 'jump') choose(result.ruleId);
            else if (hits[cursor]) choose(hits[cursor].id);
          }
        }}
      />
      {showList && (
        <div className={s.panel}>
          {result.kind === 'empty' ? (
            <p className={s.empty} role="status">
              לא נמצא סעיף עבור '{query.trim()}'.
              {result.suggestions.length > 0 && (
                <>
                  {' '}אולי:{' '}
                  {result.suggestions.map((t, i) => (
                    <span key={t}>
                      {i > 0 && ', '}
                      <button type="button" className={s.suggestion} onClick={() => setQuery(t)}>{t}</button>
                    </span>
                  ))}
                  .
                </>
              )}
            </p>
          ) : (
            <ul id={listId} role="listbox" className={s.list} aria-label="תוצאות חיפוש">
              {hits.map((h, i) => (
                <li
                  key={h.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === cursor}
                  className={s.hit}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(h.id)}
                  onMouseEnter={() => setCursor(i)}
                >
                  <span className={s.ref}>{h.ref}</span>
                  <span className={s.title}>{h.title}</span>
                  <span className={s.snippet}>
                    {snippet(h.text, h.queryWords, h.terms).map((p, j) => (p.match ? <mark key={j}>{p.text}</mark> : <span key={j}>{p.text}</span>))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
