import type { Param } from '../rules/load.ts';
import { formatValue } from '../rules/format.ts';
import { sliderRange, useReview } from '../review/review.ts';
import { sameTarget, useLink } from './links.ts';
import s from './LinkedValue.module.css';

/**
 * ערך מספרי בנוסח שמקושר לפרמטר. הרווח לפני היחידה מוצג כרווח קשיח.
 * במצב בחינה: מחוון ליד הערך, והערך המקורי בעיפרון לפני הערך שנבחן ("1.8 ← 2.0").
 */
export function LinkedValue({ ruleId, paramKey, text, param }: { ruleId: string; paramKey: string; text: string; param?: Param }) {
  const link = useLink();
  const review = useReview();
  const target = { ruleId, paramKey };
  const active = sameTarget(link.current, target) || sameTarget(link.pinned, target);
  const numeric = param && typeof param.value === 'number' ? param : undefined;
  const tested = numeric ? review.overrides[paramKey] : undefined;
  const changed = tested !== undefined && tested !== numeric!.value;
  const shown = text.replace(/ /g, ' ');

  return (
    <>
      <span
        className={s.value}
        data-active={active || undefined}
        data-param={paramKey}
        tabIndex={0}
        onMouseEnter={() => link.set(target)}
        onMouseLeave={() => link.set(null)}
        onFocus={() => link.set(target)}
        onBlur={() => link.set(null)}
      >
        {changed ? (
          <>
            <span className={s.original}>{shown}</span>
            {' ← '}
            {formatValue({ value: tested!, unit: numeric!.unit }, text)}
          </>
        ) : (
          shown
        )}
      </span>
      {review.active && numeric && (
        <Slider param={numeric} paramKey={paramKey} value={tested ?? (numeric.value as number)} onChange={(v) => review.set(paramKey, v === numeric.value ? undefined : v)} />
      )}
    </>
  );
}

function Slider({ param, paramKey, value, onChange }: { param: Param; paramKey: string; value: number; onChange: (v: number) => void }) {
  const { min, max, step } = sliderRange(param);
  return (
    <span className={s.slider}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={`בחינת ${paramKey}`}
        aria-valuetext={formatValue({ value, unit: param.unit })}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output>{formatValue({ value, unit: param.unit })}</output>
    </span>
  );
}
