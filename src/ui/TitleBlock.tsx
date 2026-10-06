import s from './TitleBlock.module.css';

export interface TitleBlockCell {
  label: string;
  value: string;
}

/** טבלת הכותרת בתחתית הגיליון, כמו בגיליון הגשה להיתר */
export function TitleBlock({ cells }: { cells: TitleBlockCell[] }) {
  return (
    <dl className={s.block}>
      {cells.map((c) => (
        <div key={c.label} className={s.cell}>
          <dt>{c.label}</dt>
          <dd>{c.value}</dd>
        </div>
      ))}
    </dl>
  );
}
