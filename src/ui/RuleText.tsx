import { Fragment, type ReactNode } from 'react';
import type { Rule } from '../rules/load.ts';
import { flatten, marginRef, type SectionNode } from '../rules/derive.ts';
import { linkText } from '../rules/linkText.ts';
import { annotate, type Token } from '../rules/annotate.ts';
import { href, type Route } from '../router.ts';
import { chapter, scenesById } from '../data.ts';
import type { FindResult } from '../search/useFind.ts';
import { useReview } from '../review/review.ts';
import { LinkedValue } from './LinkedValue.tsx';
import { Icon, topicIcon } from './icons.tsx';
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

/** קטע אחד: סימון חיפוש והדגשה */
function Piece({ t, current }: { t: Token; current: number }) {
  let node: ReactNode = t.paramKey ? t.text.replace(/ /g, ' ') : t.text;
  if (t.strong) node = <strong className={s.strong}>{node}</strong>;
  if (t.find !== undefined) {
    node = (
      <mark className="find" id={`find-${t.find}`} data-current={t.find === current || undefined}>
        {node}
      </mark>
    );
  }
  return <>{node}</>;
}

/** שורה בנוסח: קטעים רצופים של אותו ערך מקושר מתקבצים לערך אחד */
function Line({ rule, tokens, current }: { rule: Rule; tokens: Token[]; current: number }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < tokens.length; ) {
    const key = tokens[i].paramKey;
    if (!key) {
      out.push(<Piece key={i} t={tokens[i]} current={current} />);
      i++;
      continue;
    }
    let j = i;
    while (j < tokens.length && tokens[j].paramKey === key) j++;
    const group = tokens.slice(i, j);
    out.push(
      <LinkedValue key={i} ruleId={rule.id} paramKey={key} text={group.map((t) => t.text).join('')} param={rule.params?.find((p) => p.key === key)}>
        {group.map((t, k) => <Piece key={k} t={t} current={current} />)}
      </LinkedValue>,
    );
    i = j;
  }
  return <span className={s.line}>{out}</span>;
}

export function RuleText({ tree, route, activeId, onNavigate, find, findIndex }: {
  tree: SectionNode[];
  route: Route;
  activeId: string | null;
  onNavigate: (ruleId: string) => void;
  find: FindResult;
  findIndex: number;
}) {
  const sections = new Map(chapter.sections.map((x) => [x.id, x]));
  const review = useReview();
  const activeScene = activeId ? chapter.rules.find((r) => r.id === activeId)?.scene : undefined;
  let lastScene: string | undefined;

  return (
    <div className={s.text}>
      {flatten(tree).map((item) => {
        if (item.type === 'section') {
          lastScene = undefined;
          const { section } = item.node;
          if (item.depth === 0) {
            return (
              <h1 key={section.id} id={`s-${section.id}`} className={s.chapter} data-section-heading>
                {section.title}
              </h1>
            );
          }
          const H = item.depth === 1 ? 'h2' : 'h3';
          return (
            <H key={section.id} id={`s-${section.id}`} className={item.depth === 1 ? s.part : s.section} data-section-heading>
              {item.depth === 1 ? (
                <span className={s.partNum}>{section.ref}</span>
              ) : (
                section.ref && <span className={s.margin}>{section.ref}</span>
              )}
              {item.depth === 1 && <Icon name={topicIcon(section.title)} size={20} />}
              <span>{section.title}</span>
            </H>
          );
        }
        const r = item.rule;
        const ref = marginRef(r, sections.get(r.section)!);
        const active = r.id === activeId;
        const lines = annotate(linkText(r), find.ranges.get(r.id) ?? [], find.base.get(r.id) ?? 0);
        // שם ההמחשה מופיע בראש רצף הסעיפים שמומחשים באותה סצנה
        const scene = r.scene && r.scene !== lastScene ? scenesById.get(r.scene) : undefined;
        lastScene = r.scene;
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
            {scene && (
              <button
                type="button"
                className={s.scene}
                data-current={scene.id === activeScene || undefined}
                onClick={() => onNavigate(r.id)}
              >
                <Icon name="cube" />
                <span>המחשה: {scene.title}</span>
              </button>
            )}
            <p>
              {lines.map((tokens, i) => (
                <Fragment key={i}>
                  <Line rule={r} tokens={tokens} current={findIndex} />
                </Fragment>
              ))}
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
