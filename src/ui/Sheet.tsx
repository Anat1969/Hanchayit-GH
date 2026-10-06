import { Component, lazy, Suspense, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Rule } from '../rules/load.ts';
import type { TypeFilter } from '../rules/derive.ts';
import { chapter, edition, rulesById, scenesById, sectionsById, TYPE_LABELS } from '../data.ts';
import { SCENES } from '../scenes/registry.ts';
import { paramSource, sceneRules, sceneType, type SceneModel, type View } from '../scenes/model.ts';
import { scaleLength } from '../scenes/scale.ts';
import { TitleBlock } from './TitleBlock.tsx';
import { useReview } from '../review/review.ts';
import { Toggles, ViewSwitch } from './ViewSwitch.tsx';
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

/**
 * הגיליון: המודל של הסעיף הפעיל, מתגי תצוגה וטבלת כותרת.
 * כשלסעיף אין סצנה מוצג הגיליון האחרון בגוון מעומעם.
 */
export function Sheet({ rule, type, collapsed, onToggle }: {
  rule: Rule | undefined;
  type: TypeFilter;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [view, setView] = useState<View>('axo');
  const [resetKey, setResetKey] = useState(0);
  const [controls, setControls] = useState<Record<string, Record<string, string>>>({});
  const [zoom, setZoom] = useState(0);
  const last = useRef<Shown | null>(null);
  const review = useReview();

  const sceneMeta = rule?.scene ? scenesById.get(rule.scene) : undefined;
  const def = sceneMeta ? SCENES[sceneMeta.id] : undefined;

  const current: Shown | null = useMemo(() => {
    if (!rule || !sceneMeta || !def) return null;
    const t = sceneType(def, chapter, sceneMeta, rule, type);
    if (!t) return null;
    const get = paramSource(chapter, sceneMeta, t, review.overrides);
    const rules = sceneRules(chapter, sceneMeta, t);
    const ctl = def.controls?.(get, rules) ?? [];
    const chosen = Object.fromEntries(ctl.map((c) => [c.id, controls[def.id]?.[c.id] ?? c.options[0].value]));
    return { sceneId: def.id, type: t, model: def.build(get, chosen, rules), controls: ctl };
  }, [rule, sceneMeta, def, type, controls, review.overrides]);

  if (current) last.current = current;
  const shown = current ?? last.current;
  const dimmed = !current;
  const shownMeta = shown ? scenesById.get(shown.sceneId)! : undefined;
  const sceneControls = current?.controls ?? [];

  const section = rule ? sectionsById.get(rule.section) : undefined;
  const caption = !rule?.scene ? 'לסעיף זה אין המחשה' : !current ? 'ההמחשה בהכנה' : null;

  return (
    <section className={s.sheet} data-collapsed={collapsed} aria-label="גיליון">
      <button type="button" className={s.toggle} onClick={onToggle} aria-expanded={!collapsed}>
        {collapsed ? 'הצגת הגיליון' : 'כיווץ הגיליון'}
      </button>
      <div className={s.drawing} data-dimmed={dimmed || undefined}>
        {shown && (
          <div className={s.canvas} aria-hidden="true">
            <ModelBoundary>
              <Suspense fallback={<div className={s.loading} />}>
                <SceneCanvas model={shown.model} view={view} resetKey={resetKey} onZoom={setZoom} />
              </Suspense>
            </ModelBoundary>
          </div>
        )}
        {shown && !dimmed && shown.model.north && view === 'plan' && (
          <svg className={s.north} viewBox="0 0 24 40" role="img" aria-label="צפון">
            <path d="M12 2 L19 22 L12 18 L5 22 Z" fill="currentColor" />
            <text x="12" y="36" textAnchor="middle" fontSize="11" fill="currentColor">צ</text>
          </svg>
        )}
        {shown && !dimmed && shown.model.notes.length > 0 && (
          <div className={s.notes}>
            {shown.model.notes.map((n) => <p key={n.text}>{n.text}</p>)}
          </div>
        )}
        {caption && <p className={s.caption}>{caption}{rule?.scene && !current && sceneMeta ? `: ${sceneMeta.title}` : ''}</p>}
      </div>
      {shown && !dimmed && (
        <div className={s.toolbar}>
          <ViewSwitch value={view} onChange={setView} />
          {sceneControls.map((c) => (
            <Toggles
              key={c.id}
              label={c.label}
              value={controls[shown.sceneId]?.[c.id] ?? c.options[0].value}
              options={c.options}
              onChange={(v) => setControls((prev) => ({ ...prev, [shown.sceneId]: { ...prev[shown.sceneId], [c.id]: v } }))}
            />
          ))}
          <button type="button" className={s.reset} onClick={() => setResetKey((k) => k + 1)}>
            חזרה לתצוגת המוצא
          </button>
        </div>
      )}
      <TitleBlock
        cells={[
          { label: 'סעיף', value: rule?.ref ?? '' },
          { label: 'נושא', value: shown && !dimmed ? shownMeta!.title : (section?.title ?? '') },
          { label: 'סוג מבנה', value: TYPE_LABELS[shown && !dimmed ? shown.type : type] },
          { label: 'מהדורה', value: edition },
          { label: 'קנה מידה', value: shown && !dimmed && view !== 'axo' && zoom > 0 ? <Scale zoom={zoom} /> : '' },
        ]}
      />
      {shown && !dimmed && <DimensionTable model={shown.model} title={shownMeta!.title} />}
    </section>
  );
}
