import { useLink } from './links.ts';
import s from './LinkedValue.module.css';

/** ערך מספרי בנוסח שמקושר לפרמטר. הרווח לפני היחידה מוצג כרווח קשיח. */
export function LinkedValue({ ruleId, paramKey, text }: { ruleId: string; paramKey: string; text: string }) {
  const link = useLink();
  const active = link.current?.ruleId === ruleId && link.current.paramKey === paramKey;
  const target = { ruleId, paramKey };
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
      {text.replace(/ /g, ' ')}
    </span>
  );
}
