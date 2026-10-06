import { useEffect, useState } from 'react';
import { Icon } from './icons.tsx';

export type Layout = 'auto' | 'mobile' | 'desktop';

const KEY = 'hanchayit-layout';
const NARROW = '(max-width: 900px)';

/** matchMedia אינו קיים בכל סביבה (למשל בבדיקות) */
function query(q: string): MediaQueryList | undefined {
  return typeof window.matchMedia === 'function' ? window.matchMedia(q) : undefined;
}

function stored(): Layout {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'auto' || v === 'mobile' || v === 'desktop') return v;
  } catch {
    // אחסון חסום
  }
  return 'auto';
}

/**
 * מצב תצוגה: נייד, מחשב, או אוטומטי לפי רוחב המסך.
 * התוצאה נכתבת לשורש: data-mobile כשהתצוגה ניידת, ו־data-layout לבחירה עצמה.
 */
export function useLayout(): [Layout, (l: Layout) => void, boolean] {
  const [layout, setLayout] = useState<Layout>(stored);
  const [narrow, setNarrow] = useState(() => query(NARROW)?.matches ?? false);
  useEffect(() => {
    const mq = query(NARROW);
    if (!mq) return;
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const mobile = layout === 'mobile' || (layout === 'auto' && narrow);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.layout = layout;
    if (mobile) root.dataset.mobile = '';
    else delete root.dataset.mobile;
    try {
      localStorage.setItem(KEY, layout);
    } catch {
      // אין צורך לשמור
    }
  }, [layout, mobile]);
  return [layout, setLayout, mobile];
}

export function LayoutSwitch({ value, onChange }: { value: Layout; onChange: (l: Layout) => void }) {
  const options: Array<[Layout, 'phone' | 'desktop' | 'auto', string]> = [
    ['mobile', 'phone', 'נייד'],
    ['desktop', 'desktop', 'מחשב'],
    ['auto', 'auto', 'אוטומטי'],
  ];
  return (
    <div className="seg seg-compact" role="group" aria-label="מצב תצוגה">
      {options.map(([v, icon, label]) => (
        <button key={v} type="button" aria-pressed={value === v} title={`תצוגת ${label}`} onClick={() => onChange(v)}>
          <Icon name={icon} />
          <span className="seg-label">{label}</span>
        </button>
      ))}
    </div>
  );
}
