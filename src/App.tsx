import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chapter, rulesById, sectionsById, synonyms } from './data.ts';
import { appliesTo, sectionTree, type TypeFilter } from './rules/derive.ts';
import { buildSearch } from './search/index.ts';
import { useRoute } from './router.ts';
import { LinkContext, type LinkTarget } from './ui/links.ts';
import { Index } from './ui/Index.tsx';
import { RuleText } from './ui/RuleText.tsx';
import { SearchField } from './ui/SearchField.tsx';
import { Sheet } from './ui/Sheet.tsx';
import { TypeSwitch } from './ui/TypeSwitch.tsx';
import s from './App.module.css';

const search = buildSearch(chapter, synonyms);

/** הסעיף שנמצא באזור הקריאה: האחרון שראשו עבר את קו הקריאה. */
function useReadingRule(ids: string[], onChange: (id: string) => void, paused: React.RefObject<boolean>) {
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (paused.current) return;
        // קו הקריאה: מתחת לכותרת העליונה, ובמובייל מתחת לפס הגיליון
        const mobile = matchMedia('(max-width: 900px)').matches;
        const top = mobile
          ? (document.querySelector('[data-sheet-band]')?.getBoundingClientRect().bottom ?? 0)
          : (document.querySelector('header')?.getBoundingClientRect().bottom ?? 0);
        const line = top + 96;
        let current: string | undefined;
        for (const id of ids) {
          const el = document.getElementById(id);
          if (!el) continue;
          if (el.getBoundingClientRect().top <= line) current = id;
          else break;
        }
        if (current) onChange(current);
      });
    };
    addEventListener('scroll', update, { passive: true });
    return () => {
      removeEventListener('scroll', update);
      cancelAnimationFrame(frame);
    };
  }, [ids, onChange, paused]);
}

export function App() {
  const [route, navigate] = useRoute();
  const [activeId, setActiveId] = useState<string | null>(route.ruleId ?? chapter.rules[0].id);
  const [link, setLink] = useState<LinkTarget | null>(null);
  const [pinned, setPinned] = useState<LinkTarget | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [sheetCollapsed, setSheetCollapsed] = useState(false);
  const scrolling = useRef(false);

  const tree = useMemo(() => sectionTree(chapter, route.type), [route.type]);
  const visibleIds = useMemo(() => chapter.rules.filter((r) => appliesTo(r, route.type)).map((r) => r.id), [route.type]);
  const allowed = useCallback((id: string) => appliesTo(rulesById.get(id)!, route.type), [route.type]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    scrolling.current = true;
    setActiveId(id);
    el.scrollIntoView({ block: 'start' });
    // אירוע הגלילה מגיע בפריים הבא, ולא צריך לשנות את הסעיף הפעיל שבחרנו
    requestAnimationFrame(() => requestAnimationFrame(() => (scrolling.current = false)));
  }, []);

  // ניתוב: /rule/:id גולל לסעיף ומסמן אותו
  useEffect(() => {
    if (!route.ruleId) return;
    if (!rulesById.has(route.ruleId)) return;
    const id = route.ruleId;
    setActiveId(id);
    scrollTo(id);
    // הגופנים משנים את גובה השורות, ולכן גוללים שוב כשהם נטענים
    let cancelled = false;
    document.fonts?.ready.then(() => !cancelled && scrollTo(id));
    return () => {
      cancelled = true;
    };
  }, [route.ruleId, scrollTo]);

  useReadingRule(visibleIds, setActiveId, scrolling);

  const goTo = (ruleId: string, mode: 'push' | 'replace' = 'push') => {
    const rule = rulesById.get(ruleId)!;
    // סעיף שלא חל על סוג המבנה הנבחר: מבטלים את הסינון כדי להציג אותו
    const type: TypeFilter = appliesTo(rule, route.type) ? route.type : 'all';
    navigate({ ruleId, type }, mode);
    setIndexOpen(false);
    if (ruleId === route.ruleId) scrollTo(ruleId);
  };

  const active = activeId ? rulesById.get(activeId) : undefined;
  const activeSections = useMemo(() => {
    const out = new Set<string>();
    let id: string | null = active?.section ?? null;
    while (id) {
      out.add(id);
      id = sectionsById.get(id)?.parent ?? null;
    }
    return out;
  }, [active]);

  return (
    <LinkContext.Provider
      value={{
        current: link,
        set: setLink,
        pinned,
        pin: (t) => {
          setPinned(t);
          // לחיצה על מידה במודל מביאה את המשפט שקבע אותה
          if (t) scrollTo(t.ruleId);
        },
      }}
    >
      <div className={s.app}>
        <header className={s.header} data-print="hide">
          <div className={s.searchRow}>
            <button type="button" className={s.indexButton} aria-expanded={indexOpen} onClick={() => setIndexOpen((o) => !o)}>
              סעיפים
            </button>
            <SearchField search={search} allowed={allowed} onNavigate={goTo} />
          </div>
          <TypeSwitch value={route.type} onChange={(type) => navigate({ ...route, type })} />
        </header>
        <div className={s.columns}>
          <div className={s.indexCol} data-open={indexOpen} data-print="hide">
            <button type="button" className={s.closeIndex} onClick={() => setIndexOpen(false)}>
              סגירה
            </button>
            <Index tree={tree} activeSections={activeSections} onNavigate={goTo} />
          </div>
          <main className={s.textCol}>
            <RuleText tree={tree} route={route} activeId={activeId} onNavigate={goTo} />
          </main>
          <aside className={s.sheetCol} data-collapsed={sheetCollapsed} data-sheet-band>
            <Sheet rule={active} type={route.type} collapsed={sheetCollapsed} onToggle={() => setSheetCollapsed((c) => !c)} />
          </aside>
        </div>
      </div>
    </LinkContext.Provider>
  );
}
