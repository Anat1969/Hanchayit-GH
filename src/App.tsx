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
import { BoardSwitch, useBoard } from './ui/BoardSwitch.tsx';
import { Logo } from './ui/Logo.tsx';
import { LayoutSwitch, useLayout } from './ui/LayoutSwitch.tsx';
import type { SectionNode } from './rules/derive.ts';
import { Icon } from './ui/icons.tsx';
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
        const mobile = document.documentElement.dataset.mobile !== undefined;
        const top = mobile
          ? (document.querySelector('main')?.getBoundingClientRect().top ?? 0)
          : (document.querySelector('header')?.getBoundingClientRect().bottom ?? 0);
        const line = top + (mobile ? 48 : 96);
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
    // capture: גם גלילה של מכל הנוסח בנייד, לא רק של החלון
    addEventListener('scroll', update, { passive: true, capture: true });
    return () => {
      removeEventListener('scroll', update, { capture: true });
      cancelAnimationFrame(frame);
    };
  }, [ids, onChange, paused]);
}

/**
 * גלילה אל אלמנט בנוסח. בנייד הנוסח נגלל בתוך המכל שלו, ולכן גוללים רק אותו:
 * scrollIntoView היה גולל גם את החלון ומזיז את המסך הצידה.
 */
function scrollToElement(el: Element | null, block: 'start' | 'center' = 'start') {
  if (!el) return;
  const main = document.querySelector('main');
  if (document.documentElement.dataset.mobile === undefined || !main) {
    el.scrollIntoView({ block });
    return;
  }
  const r = el.getBoundingClientRect();
  const m = main.getBoundingClientRect();
  const offset = block === 'center' ? r.top - m.top - (m.height - r.height) / 2 : r.top - m.top - 8;
  main.scrollTo({ top: main.scrollTop + offset });
}

/** שיעור הגלילה במסמך, לפס ההתקדמות */
function useProgress(): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    const update = () => {
      // בנייד הנוסח נגלל בתוך המכל שלו; במחשב, החלון
      const main = document.querySelector('main');
      const own = main && main.scrollHeight > main.clientHeight + 1;
      const max = own ? main.scrollHeight - main.clientHeight : document.documentElement.scrollHeight - innerHeight;
      const pos = own ? main.scrollTop : scrollY;
      setP(max > 0 ? Math.min(1, pos / max) : 0);
    };
    update();
    addEventListener('scroll', update, { passive: true, capture: true });
    return () => removeEventListener('scroll', update, { capture: true });
  }, []);
  return p;
}

/** הגובה בפועל של הכותרת הדביקה ושל פס הגיליון בנייד, כמשתני CSS לגלילה ולקו הקריאה */
function useLayoutVars(mobile: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    const header = document.querySelector('header');
    const band = document.querySelector('[data-sheet-band]');
    const update = () => {
      root.style.setProperty('--header-h', mobile ? '0px' : `${header?.getBoundingClientRect().height ?? 128}px`);
      root.style.setProperty('--band-h', mobile ? `${band?.getBoundingClientRect().height ?? 0}px` : '0px');
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    if (header) ro.observe(header);
    if (band) ro.observe(band);
    return () => ro.disconnect();
  }, [mobile]);
}

function findSection(tree: SectionNode[], id: string): SectionNode | undefined {
  for (const n of tree) {
    if (n.section.id === id) return n;
    const c = findSection(n.children, id);
    if (c) return c;
  }
  return undefined;
}

function rulesIn(n: SectionNode): SectionNode['rules'] {
  return [...n.rules, ...n.children.flatMap(rulesIn)];
}

export function App() {
  const [route, navigate] = useRoute();
  const [layout, setLayout, mobile] = useLayout();
  const [board, setBoard] = useBoard();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  useLayoutVars(mobile);
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
    scrollToElement(el);
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

  // מקור השינוי של הסעיף הפעיל: בחירה (עם הנפשה בגיליון) או גלילה (בלי)
  const origin = useRef<'pick' | 'scroll'>('pick');
  const setActiveFromScroll = useCallback((id: string) => {
    origin.current = 'scroll';
    setActiveId(id);
  }, []);
  useReadingRule(visibleIds, setActiveFromScroll, scrolling);

  useEffect(() => setFindIndex(0), [query, route.type]);

  /** מעבר למופע הבא או הקודם של מילת החיפוש, במעגל */
  const stepFind = (d: 1 | -1) => {
    if (!find.total) return;
    const next = (findIndex + d + find.total) % find.total;
    setFindIndex(next);
    scrollToElement(document.getElementById(`find-${next}`), 'center');
  };

  const goTo = (ruleId: string, mode: 'push' | 'replace' = 'push') => {
    origin.current = 'pick';
    const rule = rulesById.get(ruleId)!;
    // סעיף שלא חל על סוג המבנה הנבחר: מבטלים את הסינון כדי להציג אותו
    const type: TypeFilter = appliesTo(rule, route.type) ? route.type : 'all';
    navigate({ ruleId, type }, mode);
    setIndexOpen(false);
    setSelectedSection(null);
    if (ruleId === route.ruleId) scrollTo(ruleId);
  };

  /** לחיצה על נושא בתוכן העניינים: הכותרת שלו בראש המסגרת, מסומנת בנוסח */
  const goToSection = (sectionId: string) => {
    origin.current = 'pick';
    const node = findSection(tree, sectionId);
    const rules = node ? rulesIn(node) : [];
    // הסעיף הפעיל: הראשון בנושא שיש לו המחשה, כדי שהגיליון יראה אותה
    const first = rules.find((r) => r.scene) ?? rules[0];
    setSelectedSection(sectionId);
    setIndexOpen(false);
    if (first) setActiveId(first.id);
    // גלילה אחרי שהתפריט נסגר (בנייד), כדי שהמסך לא יזוז
    scrolling.current = true;
    requestAnimationFrame(() => {
      scrollToElement(document.getElementById(`s-${sectionId}`));
      requestAnimationFrame(() => requestAnimationFrame(() => (scrolling.current = false)));
    });
  };

  /** כפתור ההמחשה: הסעיף הראשון בנושא שיש לו המחשה, והגיליון פתוח */
  const goToScene = (sectionId: string) => {
    const node = findSection(tree, sectionId);
    const target = node && rulesIn(node).find((r) => r.scene);
    if (!target) return;
    setSelectedSection(null);
    setSheetCollapsed(false);
    goTo(target.id);
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
                <div>
                  <div className={s.brandTitle}>הנחיות מרחביות אשדוד</div>
                  <div className={s.brandSub}>מהדורה {edition}</div>
                </div>
              </div>
              <button type="button" className={`icon-btn ${s.indexButton}`} aria-label="סעיפים" aria-expanded={indexOpen} onClick={() => setIndexOpen((o) => !o)}>
                <Icon name="legend" />
              </button>
              <div className={s.search}>
                <SearchField
                  search={search}
                  allowed={allowed}
                  onNavigate={goTo}
                  onQueryChange={setQuery}
                  find={{ index: findIndex, total: find.total, step: stepFind }}
                />
              </div>
              <div className={s.prefs}>
                <LayoutSwitch value={layout} onChange={setLayout} />
                <BoardSwitch value={board} onChange={setBoard} />
              </div>
              <div className={s.logo}>
                <Logo />
              </div>
            </div>
            <div className={s.bottomRow}>
              <TypeSwitch value={route.type} onChange={(type) => navigate({ ...route, type })} />
              <nav className={s.trail} aria-label="מיקום במסמך">
                {trail.map((id, i) => {
                  const sec = sectionsById.get(id)!;
                  return (
                    <span key={id} className={s.crumb}>
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
              {/* בנייד: העדפות התצוגה בתפריט, כדי לפנות מקום בראש המסך */}
              <div className={s.drawerPrefs}>
                <LayoutSwitch value={layout} onChange={setLayout} />
                <BoardSwitch value={board} onChange={setBoard} />
              </div>
              <Index tree={tree} activeSections={activeSections} selected={selectedSection} onSection={goToSection} onScene={goToScene} />
            </div>
            <main className={s.textCol}>
              <RuleText
                tree={tree}
                route={route}
                activeId={activeId}
                onNavigate={goTo}
                find={find}
                findIndex={findIndex}
                selected={selectedSection}
              />
            </main>
            <aside className={s.sheetCol} data-collapsed={sheetCollapsed} data-sheet-band>
              <Sheet
                rule={active}
                type={route.type}
                collapsed={sheetCollapsed}
                onToggle={() => setSheetCollapsed((c) => !c)}
                animate={origin.current === 'pick'}
              />
            </aside>
          </div>
          <ReviewBar onToggle={() => setReviewing((r) => !r)} onReset={() => setOverrides({})} />
        </div>
      </LinkContext.Provider>
    </ReviewContext.Provider>
  );
}
