import type { TypeFilter } from '../rules/derive.ts';
import { TYPE_LABELS } from '../data.ts';
import { Icon, type IconName } from './icons.tsx';

const ORDER: Array<[TypeFilter, IconName]> = [
  ['all', 'layers'],
  ['ground', 'house'],
  ['residential', 'building'],
  ['active', 'door'],
  ['industrial', 'bolt'],
];

export function TypeSwitch({ value, onChange }: { value: TypeFilter; onChange: (t: TypeFilter) => void }) {
  return (
    <div className="seg" role="group" aria-label="סוג מבנה">
      {ORDER.map(([t, icon]) => (
        <button key={t} type="button" aria-pressed={value === t} onClick={() => onChange(t)}>
          <Icon name={icon} />
          {TYPE_LABELS[t]}
        </button>
      ))}
    </div>
  );
}
