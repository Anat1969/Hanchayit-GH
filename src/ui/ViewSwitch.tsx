import type { View } from '../scenes/model.ts';
import s from './ViewSwitch.module.css';

const LABELS: Record<View, string> = { plan: 'תכנית', section: 'חתך', axo: 'אקסונומטריה' };

/** מתגים טקסטואליים, בלי אייקונים (DESIGN.md, "מתגי תצוגה") */
export function Toggles<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className={s.toggles} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ViewSwitch({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  return (
    <Toggles
      label="תצוגה"
      value={value}
      options={(['plan', 'section', 'axo'] as View[]).map((v) => ({ value: v, label: LABELS[v] }))}
      onChange={onChange}
    />
  );
}
