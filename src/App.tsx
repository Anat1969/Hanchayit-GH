import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chapter, edition, rulesById, sectionsById, synonyms } from './data.ts';
import { appliesTo, sectionTree, type TypeFilter } from './rules/derive.ts';
import { buildSearch } from './search/index.ts';
import { useFind } from './search/useFind.ts';
import { useRoute } from './router.ts';
import { LinkContext, type LinkTarget } from './ui/links.ts';
import { Index } from './ui/Index.tsx';
import { RuleText } from './ui/RuleText.tsx';
import { SearchField } from './ui/SearchField.tsx';
import { Sheet } from './ui/Sheet.tsx';
import { TypeSwitch } from './ui/TypeSwitch.tsx';
import { ReviewBar } from './ui/ReviewBar.tsx';
import { BoardSwitch } from './ui/BoardSwitch.tsx';
import { Logo } from './ui/Logo.tsx';
import { Icon, topicIcon } from './ui/icons.tsx';
import { ReviewContext } from './review/review.ts';
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

/** שיעור הגלילה במסמך, לפס ההתקדמות */
function useProgress(): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setP(max > 0 ? Math.min(1, scrollY / max) : 0);
    };
    update();
    addEventListener('scroll', update, { passive: true });
    return () => removeEventListener('scroll', update);
  }, []);
  return p;
}

export function App() {
  const [route, navigate] = useRoute();
  const [activeId, setActiveId] = useState<string | null>(route.ruleId ?? chapter.rules[0].id);
  const [link, setLink] = useState<LinkTarget | null>(null);
  const [pinned, setPinned] = useState<LinkTarget | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [sheetCollapsed, setSheetCollapsed] = useState(false);
  const scrolling = useRef(false);
  const [reviewing, setReviewing] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');
  const [findIndex, setFindIndex] = useState(0);
  const progress = useProgress();

  const review = useMemo(
    () => ({
      active: reviewing,
      overrides,
      set: (key: string, value: number | undefined) =>
        setOverrides((prev) => {
          const next = { ...prev };
          if (value === undefined) delete next[key];
          else next[key] = value;
          return next;
        }),
    }),
    [reviewing, overrides],
  );

  const tree = useMemo(() => sectionTree(chapter, route.type), [route.type]);
  const visibleRules = useMemo(() => chapter.rules.filter((r) => appliesTo(r, route.type)), [route.type]);
  const visibleIds = useMemo(() => visibleRules.map((r) => r.id), [visibleRules]);
  const allowed = useCallback((id: string) => appliesTo(rulesById.get(id)!, route.type), [route.type]);
  const find = useFind(search, query, visibleRules);

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

  useEffect(() => setFindIndex(0), [query, route.type]);

  /** מעבר למופע הבא או הקודם של מילת החיפוש, במעגל */
  const stepFind = (d: 1 | -1) => {
    if (!find.total) return;
    const next = (findIndex + d + find.total) % find.total;
    setFindIndex(next);
    document.getElementById(`find-${next}`)?.scrollIntoView({ block: 'center' });
  };

  const goTo = (ruleId: string, mode: 'push' | 'replace' = 'push') => {
    const rule = rulesById.get(ruleId)!;
    // סעיף שלא חל על סוג המבנה הנבחר: מבטלים את הסינון כדי להציג אותו
    const type: TypeFilter = appliesTo(rule, route.type) ? route.type : 'all';
    navigate({ ruleId, type }, mode);
    setIndexOpen(false);
    if (ruleId === route.ruleId) scrollTo(ruleId);
  };

  const active = activeId ? rulesById.get(activeId) : undefined;
  const trail = useMemo(() => {
    const out: string[] = [];
    let id: string | null = active?.section ?? null;
    while (id) {
      out.unshift(id);
      id = sectionsById.get(id)?.parent ?? null;
    }
    return out;
  }, [active]);
  const activeSections = useMemo(() => new Set(trail), [trail]);

  return (
    <ReviewContext.Provider value={review}>
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
            <div className={s.topRow}>
              <div className={s.brand}>
                <Logo />
                <div>
                  <div className={s.brandTitle}>הנחיות מרחביות אשדוד</div>
                  <div className={s.brandSub}>מהדורה {edition}</div>
                </div>
              </div>
              <button type="button" className={`icon-btn ${s.indexButton}`} aria-label="סעיפים" aria-expanded={indexOpen} onClick={() => setIndexOpen((o) => !o)}>
                <Icon name="legend" />
              </button>
              <SearchField
                search={search}
                allowed={allowed}
                onNavigate={goTo}
                onQueryChange={setQuery}
                find={{ index: findIndex, total: find.total, step: stepFind }}
              />
              <BoardSwitch />
            </div>
            <div className={s.bottomRow}>
              <TypeSwitch value={route.type} onChange={(type) => navigate({ ...route, type })} />
              <nav className={s.trail} aria-label="מיקום במסמך">
                {trail.map((id, i) => {
                  const sec = sectionsById.get(id)!;
                  return (
                    <span key={id} className={s.crumb}>
                      {i === 1 && <Icon name={topicIcon(sec.title)} size={14} />}
                      {i === 0 ? (id === 'A' ? "פרק א'" : "פרק ב'") : `${sec.ref} ${sec.title}`}
                    </span>
                  );
                })}
              </nav>
            </div>
            <div className={s.progress} style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
          </header>
          <div className={s.columns}>
            <div className={s.indexCol} data-open={indexOpen} data-print="hide">
              <button type="button" className={`icon-btn ${s.closeIndex}`} aria-label="סגירה" onClick={() => setIndexOpen(false)}>
                <Icon name="close" />
              </button>
              <Index tree={tree} activeSections={activeSections} onNavigate={goTo} />
            </div>
            <main className={s.textCol}>
              <RuleText tree={tree} route={route} activeId={activeId} onNavigate={goTo} find={find} findIndex={findIndex} />
            </main>
            <aside className={s.sheetCol} data-collapsed={sheetCollapsed} data-sheet-band>
              <Sheet rule={active} type={route.type} collapsed={sheetCollapsed} onToggle={() => setSheetCollapsed((c) => !c)} />
            </aside>
          </div>
          <ReviewBar onToggle={() => setReviewing((r) => !r)} onReset={() => setOverrides({})} />
        </div>
      </LinkContext.Provider>
    </ReviewContext.Provider>
  );
}
