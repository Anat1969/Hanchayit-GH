import type { View } from '../scenes/model.ts';

const LABELS: Record<View, string> = { plan: 'תכנית', section: 'חתך', axo: 'אקסונומטריה' };

/** מתגים מקובצים: הבחירה הפעילה ממולאת בצבע הלוח */
export function Toggles<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
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
