import type { Rule } from '../rules/load.ts';
import type { TypeFilter } from '../rules/derive.ts';
import { edition, scenesById, sectionsById, TYPE_LABELS } from '../data.ts';
import { TitleBlock } from './TitleBlock.tsx';
import s from './Sheet.module.css';

/**
 * הגיליון: מסגרת דיו עם טבלת כותרת. בשלב 1 אין עדיין מודל, ולכן מוצג רק שם ההמחשה של הסעיף.
 */
export function Sheet({ rule, type, collapsed, onToggle }: {
  rule: Rule | undefined;
  type: TypeFilter;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const scene = rule?.scene ? scenesById.get(rule.scene) : undefined;
  const section = rule ? sectionsById.get(rule.section) : undefined;
  return (
    <section className={s.sheet} data-collapsed={collapsed} aria-label="גיליון">
      <button type="button" className={s.toggle} onClick={onToggle} aria-expanded={!collapsed}>
        {collapsed ? 'הצגת הגיליון' : 'כיווץ הגיליון'}
      </button>
      <div className={s.drawing}>
        {scene ? (
          <p className={s.note}>
            {scene.title}
            <br />
            ההמחשה בהכנה.
          </p>
        ) : (
          <p className={s.note}>לסעיף זה אין המחשה</p>
        )}
      </div>
      <TitleBlock
        cells={[
          { label: 'סעיף', value: rule?.ref ?? '' },
          { label: 'נושא', value: section?.title ?? '' },
          { label: 'סוג מבנה', value: TYPE_LABELS[type] },
          { label: 'מהדורה', value: edition },
        ]}
      />
    </section>
  );
}
