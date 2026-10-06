import { Component, lazy, Suspense, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Rule } from '../rules/load.ts';
import type { TypeFilter } from '../rules/derive.ts';
import { chapter, edition, rulesById, scenesById, TYPE_LABELS } from '../data.ts';
import { SCENES } from '../scenes/registry.ts';
import { paramSource, sceneRules, sceneType, type SceneModel, type View } from '../scenes/model.ts';
import type { NavMode, ZoomCommand } from '../scenes/SceneCanvas.tsx';
import { scaleLength } from '../scenes/scale.ts';
import { PERSON_HEIGHT } from '../scenes/fixtures.ts';
import { TitleBlock } from './TitleBlock.tsx';
import { Toggles, ViewSwitch } from './ViewSwitch.tsx';
import { Icon } from './icons.tsx';
import s from './Sheet.module.css';

const SceneCanvas = lazy(() => import('../scenes/SceneCanvas.tsx'));

class ModelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <p className={s.note}>המודל לא נטען. רעננו את הדף.</p> : this.props.children;
  }
}

interface Shown {
  sceneId: string;
  type: NonNullable<ReturnType<typeof sceneType>>;
  model: SceneModel;
  controls: ReturnType<NonNullable<(typeof SCENES)[string]['controls']>>;
}

/** טבלת המידות לקוראי מסך: פרמטר, ערך, סעיף (DESIGN.md, "נגישות") */
function DimensionTable({ model, title }: { model: SceneModel; title: string }) {
  const rows = [...model.dims, ...model.tags];
  return (
    <table className="visually-hidden">
      <caption>מידות במודל: {title}</caption>
      <thead>
        <tr><th scope="col">מידה</th><th scope="col">ערך</th><th scope="col">סעיף</th></tr>
      </thead>
      <tbody>
        {rows.map((d) => (
          <tr key={`${d.ruleId}/${d.paramKey}`}>
            <td>{d.paramKey}</td>
            <td>{d.label}</td>
            <td>{rulesById.get(d.ruleId)?.ref}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Scale({ zoom }: { zoom: number }) {
  const len = scaleLength(zoom);
  return (
    <span className={s.scale}>
      <span>0</span>
      <span className={s.scaleBar} style={{ inlineSize: `${len * zoom}px` }}>
        <span />
      </span>
      <span>{len}&nbsp;מ'</span>
    </span>
  );
}

/** מקרא: דוגמה קטנה לכל סימן בשרטוט, באותה שפה של השרטוט עצמו */
function Legend() {
  const line = (color: string, dashed = false, ticks = false) => (
    <svg width="40" height="12" viewBox="0 0 40 12" aria-hidden="true">
      <line x1="2" y1="6" x2="38" y2="6" stroke={color} strokeWidth="1.5" strokeDasharray={dashed ? '5 3' : undefined} />
      {ticks && (
        <>
          <line x1="0" y1="10" x2="4" y2="2" stroke={color} strokeWidth="1.5" />
          <line x1="36" y1="10" x2="40" y2="2" stroke={color} strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
  const items: Array<[ReactNode, string]> = [
    [line('var(--limit)', false, true), 'מידה מגבילה (≤ / ≥)'],
    [line('var(--ink)', false, true), 'מידה תיאורית'],
    [<span className={s.legendMarker}>1.8</span>, 'ערך מקושר שנבחר'],
    [line('var(--blue-line)', true), 'גבול מגרש'],
    [line('var(--limit)', true), 'קו בניין'],
    [<span className={s.legendPencil}>הערה</span>, 'תווית ופירוש לבחינה'],
    [<Icon name="person" />, `דמות בגובה ${PERSON_HEIGHT.toFixed(2)} מ' לקנה מידה`],
  ];
  return (
    <ul className={s.legend} aria-label="מקרא">
      {items.map(([sample, text]) => (
        <li key={text}>
          <span className={s.legendSample}>{sample}</span>
          {text}
        </li>
      ))}
    </ul>
  );
}

/** כלי ניווט קומפקטיים: יד (הזזה), סיבוב, זום ומרכוז */
function NavTools({ mode, setMode, onZoom, onFit }: {
  mode: NavMode;
  setMode: (m: NavMode) => void;
  onZoom: (factor: number) => void;
  onFit: () => void;
}) {
  return (
    <div className={s.nav} role="toolbar" aria-label="ניווט במודל">
      <button type="button" className="icon-btn" aria-pressed={mode === 'pan'} aria-label="הזזה" title="הזזה (גרירה)" onClick={() => setMode('pan')}>
        <Icon name="hand" />
      </button>
      <button type="button" className="icon-btn" aria-pressed={mode === 'rotate'} aria-label="סיבוב" title="סיבוב (גרירה)" onClick={() => setMode('rotate')}>
        <Icon name="rotate" />
      </button>
      <span className={s.navGap} />
      <button type="button" className="icon-btn" aria-label="הגדלה" title="הגדלה" onClick={() => onZoom(1.25)}>
        <Icon name="zoomIn" />
      </button>
      <button type="button" className="icon-btn" aria-label="הקטנה" title="הקטנה" onClick={() => onZoom(0.8)}>
        <Icon name="zoomOut" />
      </button>
      <button type="button" className="icon-btn" aria-label="חזרה לתצוגת המוצא" title="חזרה לתצוגת המוצא" onClick={onFit}>
        <Icon name="fit" />
      </button>
    </div>
  );
}

/**
 * הגיליון: שם ההמחשה וכפתורי התצוגה בראש, המודל, וטבלת כותרת בתחתית.
 * כשלסעיף אין סצנה מוצג הגיליון האחרון בגוון מעומעם.
 */
export function Sheet({ rule, type, collapsed, onToggle, animate }: {
  rule: Rule | undefined;
  type: TypeFilter;
  collapsed: boolean;
  onToggle: () => void;
  /** הנפשת כניסה רק כשהמשתמש בחר סעיף או נושא, לא בזמן גלילה */
  animate: boolean;
}) {
  const [view, setView] = useState<View>('axo');
  const [resetKey, setResetKey] = useState(0);
  const [controls, setControls] = useState<Record<string, Record<string, string>>>({});
  const [zoom, setZoom] = useState(0);
  const [mode, setMode] = useState<NavMode>('rotate');
  const [zoomCmd, setZoomCmd] = useState<ZoomCommand>({ n: 0, factor: 1 });
  const [legend, setLegend] = useState(false);
  const last = useRef<Shown | null>(null);

  const sceneMeta = rule?.scene ? scenesById.get(rule.scene) : undefined;
  const def = sceneMeta ? SCENES[sceneMeta.id] : undefined;

  const current: Shown | null = useMemo(() => {
    if (!rule || !sceneMeta || !def) return null;
    const t = sceneType(def, chapter, sceneMeta, rule, type);
    if (!t) return null;
    const get = paramSource(chapter, sceneMeta, t);
    const rules = sceneRules(chapter, sceneMeta, t);
    const ctl = def.controls?.(get, rules) ?? [];
    const chosen = Object.fromEntries(ctl.map((c) => [c.id, controls[def.id]?.[c.id] ?? c.options[0].value]));
    return { sceneId: def.id, type: t, model: def.build(get, chosen, rules), controls: ctl };
  }, [rule, sceneMeta, def, type, controls]);

  if (current) last.current = current;
  const shown = current ?? last.current;
  const dimmed = !current;
  const shownMeta = shown ? scenesById.get(shown.sceneId)! : undefined;
  const live = shown && !dimmed;
  const caption = !rule?.scene ? 'לסעיף זה אין המחשה' : !current ? 'ההמחשה בהכנה' : null;

  return (
    <section className={s.sheet} data-collapsed={collapsed} data-noscene={!live || undefined} aria-label="גיליון">
      {/* מבנה קבוע: אותן שורות גם כשלסעיף אין המחשה, כדי שהחלון לא יקפוץ בזמן גלילה */}
      <div className={s.top}>
        <div className={s.titleRow}>
          <Icon name="cube" size={20} />
          <h2 key={shown?.sceneId ?? 'none'} className={s.title} data-dimmed={!live || undefined}>
            {shownMeta ? shownMeta.title : caption}
          </h2>
          {shown && dimmed && <span className={s.status}>{caption}</span>}
          {shown && (
            <button type="button" className="text-btn" aria-pressed={legend} onClick={() => setLegend((l) => !l)}>
              <Icon name="legend" />
              מקרא
            </button>
          )}
          <button type="button" className={`icon-btn ${s.toggle}`} onClick={onToggle} aria-expanded={!collapsed} aria-label={collapsed ? 'הצגת הגיליון' : 'כיווץ הגיליון'}>
            <Icon name={collapsed ? 'down' : 'up'} />
          </button>
        </div>
        {shown && (
          <div className={s.toolbar} data-inactive={dimmed || undefined}>
            <ViewSwitch value={view} onChange={setView} />
            {shown.controls.map((c) => (
              <Toggles
                key={c.id}
                label={c.label}
                value={controls[shown.sceneId]?.[c.id] ?? c.options[0].value}
                options={c.options}
                onChange={(v) => setControls((prev) => ({ ...prev, [shown.sceneId]: { ...prev[shown.sceneId], [c.id]: v } }))}
              />
            ))}
          </div>
        )}
        {/* המקרא בראש הגיליון, לא מעל השרטוט */}
        {shown && legend && <Legend />}
      </div>
      <div className={s.drawing} data-dimmed={dimmed || undefined}>
        {shown && (
          <div className={s.canvas} aria-hidden="true" data-static={!animate || undefined}>
            <ModelBoundary>
              <Suspense fallback={<div className={s.loading} />}>
                <SceneCanvas
                  sceneKey={`${shown.sceneId}/${shown.type}`}
                  model={shown.model}
                  view={view}
                  resetKey={resetKey}
                  mode={mode}
                  zoom={zoomCmd}
                  animate={animate}
                  onZoom={setZoom}
                />
              </Suspense>
            </ModelBoundary>
          </div>
        )}
        {live && shown.model.north && view === 'plan' && (
          <svg className={s.north} viewBox="0 0 24 40" role="img" aria-label="צפון">
            <path d="M12 2 L19 22 L12 18 L5 22 Z" fill="currentColor" />
            <text x="12" y="36" textAnchor="middle" fontSize="11" fill="currentColor">צ</text>
          </svg>
        )}
        {live && shown.model.notes.length > 0 && (
          <div className={s.notes}>
            {shown.model.notes.map((n) => <p key={n.text}>{n.text}</p>)}
          </div>
        )}
        {shown && (
          <NavTools
            mode={mode}
            setMode={setMode}
            onZoom={(factor) => setZoomCmd((z) => ({ n: z.n + 1, factor }))}
            onFit={() => setResetKey((k) => k + 1)}
          />
        )}
        {!shown && caption && <p className={s.caption}>{caption}</p>}
      </div>
      <TitleBlock
        cells={[
          { label: 'סעיף', value: rule ? `${rule.id[0] === 'A' ? 'א' : 'ב'}' ${rule.ref}` : '' },
          { label: 'נושא', value: live ? shownMeta!.title : '' },
          { label: 'סוג מבנה', value: TYPE_LABELS[live ? shown.type : type] },
          { label: 'מהדורה', value: edition },
          { label: 'קנה מידה', value: live && view !== 'axo' && zoom > 0 ? <Scale zoom={zoom} /> : '' },
        ]}
      />
      {live && <DimensionTable model={shown.model} title={shownMeta!.title} />}
    </section>
  );
}
