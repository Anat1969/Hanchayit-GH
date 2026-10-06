import type { TypeFilter } from '../rules/derive.ts';
import { TYPE_LABELS } from '../data.ts';
import s from './TypeSwitch.module.css';

const ORDER: TypeFilter[] = ['all', 'ground', 'residential', 'active', 'industrial'];

export function TypeSwitch({ value, onChange }: { value: TypeFilter; onChange: (t: TypeFilter) => void }) {
  return (
    <div className={s.switch} role="group" aria-label="סוג מבנה">
      {ORDER.map((t) => (
        <button key={t} type="button" aria-pressed={value === t} onClick={() => onChange(t)}>
          {TYPE_LABELS[t]}
        </button>
      ))}
    </div>
  );
}
