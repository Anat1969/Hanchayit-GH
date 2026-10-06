import { useMemo } from 'react';
import { chapter, edition } from '../data.ts';
import { changes, changesCsv, useReview } from '../review/review.ts';
import s from './ReviewBar.module.css';

/** מתג מצב הבחינה בתחתית העמוד, מספר השינויים, ייצוא ואיפוס */
export function ReviewBar({ onToggle, onReset }: { onToggle: () => void; onReset: () => void }) {
  const review = useReview();
  const list = useMemo(() => changes(chapter, review.overrides), [review.overrides]);

  const download = () => {
    const blob = new Blob([changesCsv(list, edition)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-edition-${edition}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className={s.bar} data-print="hide">
      <button type="button" className={s.toggle} aria-pressed={review.active} onClick={onToggle}>
        מצב בחינה
      </button>
      {review.active && (
        <>
          <span className={s.count} role="status">
            {list.length === 0 ? 'אין שינויים. הזיזו מחוון ליד ערך בנוסח.' : `${list.length} ${list.length === 1 ? 'שינוי' : 'שינויים'} מול מהדורה ${edition}`}
          </span>
          <button type="button" className={s.action} disabled={list.length === 0} onClick={download}>
            ייצוא לקובץ
          </button>
          <button type="button" className={s.action} disabled={list.length === 0} onClick={onReset}>
            איפוס
          </button>
        </>
      )}
    </div>
  );
}
