import { Fragment } from 'react';
import type { Rule } from '../rules/load.ts';
import { flatten, marginRef, type SectionNode } from '../rules/derive.ts';
import { linkText } from '../rules/linkText.ts';
import { href, type Route } from '../router.ts';
import { chapter } from '../data.ts';
import { LinkedValue } from './LinkedValue.tsx';
import { useReview } from '../review/review.ts';
import s from './RuleText.module.css';

const TABLE_LABELS: Record<string, string> = {
  units: 'יח"ד',
  lobby_height: 'גובה מבואה',
  lobby_area: 'שטח מבואה',
  club_area: 'מועדון דיירים',
  bikes_room: 'חדר עגלות ואופניים',
  common_storage: 'מחסן משותף',
  maintenance_storage: 'מחסן תחזוקה',
  private_storage: 'מחסן פרטי ליח"ד',
};

function Materials({ m }: { m: NonNullable<Rule['materials']> }) {
  const allowed = [...(m.allowed ?? []), ...(m.required ?? []).map((x) => `${x} (חובה)`)];
  return (
    <div className={s.materials}>
      {allowed.length > 0 && (
        <div>
          <h4>מותר</h4>
          <ul>{allowed.map((x) => <li key={x}>{x}</li>)}</ul>
          {m.allowed_industrial && (
            <>
              <h4>מותר בתעשייה</h4>
              <ul>{m.allowed_industrial.map((x) => <li key={x}>{x}</li>)}</ul>
            </>
          )}
        </div>
      )}
      {m.forbidden && (
        <div className={s.forbidden}>
          <h4>אסור</h4>
          <ul>{m.forbidden.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function RuleTable({ t }: { t: NonNullable<Rule['table']> }) {
  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>{t.columns.map((c) => <th key={c} scope="col">{TABLE_LABELS[c] ?? c}</th>)}</tr>
        </thead>
        <tbody>
          {t.rows.map((row, i) => (
            <tr key={i}>
              {t.columns.map((c, j) =>
                j === 0 ? <th key={c} scope="row">{row[c]}</th> : <td key={c}>{row[c]}</td>,
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RuleText({ tree, route, activeId, onNavigate }: {
  tree: SectionNode[];
  route: Route;
  activeId: string | null;
  onNavigate: (ruleId: string) => void;
}) {
  const sections = new Map(chapter.sections.map((x) => [x.id, x]));
  const review = useReview();
  return (
    <div className={s.text}>
      {flatten(tree).map((item) => {
        if (item.type === 'section') {
          const { section } = item.node;
          // עומק 0: הפרק (א' או ב'), 1: פרק משנה ממוספר, 2 ומטה: נושא
          const H = item.depth === 0 ? 'h1' : item.depth === 1 ? 'h2' : 'h3';
          const cls = item.depth === 0 ? s.chapter : item.depth === 1 ? s.part : s.section;
          return (
            <H key={section.id} id={`s-${section.id}`} className={cls} data-section-heading>
              {section.ref && <span className={s.margin}>{section.ref}</span>}
              {section.title}
            </H>
          );
        }
        const r = item.rule;
        const ref = marginRef(r, sections.get(r.section)!);
        const active = r.id === activeId;
        return (
          <article key={r.id} id={r.id} className={s.rule} data-rule={r.id} data-active={active}>
            <a
              className={s.margin}
              href={href({ ...route, ruleId: r.id })}
              aria-label={`סעיף ${r.ref}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(r.id);
              }}
            >
              {ref}
            </a>
            <p>
              {linkText(r).map((part, i) =>
                'paramKey' in part ? (
                  <LinkedValue
                    key={i}
                    ruleId={r.id}
                    paramKey={part.paramKey}
                    text={part.text}
                    param={r.params?.find((p) => p.key === part.paramKey)}
                  />
                ) : (
                  <Fragment key={i}>{part.text}</Fragment>
                ),
              )}
            </p>
            {review.active && r.review && <p className={s.review}>{r.review}</p>}
            {r.materials && <Materials m={r.materials} />}
            {r.table && <RuleTable t={r.table} />}
          </article>
        );
      })}
    </div>
  );
}
