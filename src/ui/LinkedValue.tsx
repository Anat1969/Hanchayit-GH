import type { ReactNode } from 'react';
import { sameTarget, useLink } from './links.ts';
import s from './LinkedValue.module.css';

/**
 * ערך מספרי בנוסח שמקושר לפרמטר. הרווח לפני היחידה מוצג כרווח קשיח.
 * הערך תמיד כפי שהוא בנתונים.
 */
export function LinkedValue({ ruleId, paramKey, text, children }: {
  ruleId: string;
  paramKey: string;
  text: string;
  /** התצוגה (למשל עם סימון חיפוש). ברירת המחדל: הטקסט עצמו */
  children?: ReactNode;
}) {
  const link = useLink();
  const target = { ruleId, paramKey };
  const active = sameTarget(link.current, target) || sameTarget(link.pinned, target);
  const shown = children ?? text.replace(/ /g, ' ');

  return (
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
      {shown}
    </span>
  );
}

