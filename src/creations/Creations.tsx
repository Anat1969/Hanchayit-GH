import { edition } from '../data.ts';
import { Logo } from '../ui/Logo.tsx';
import s from '../App.module.css';
import './creations.css';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'app-creations': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { src?: string; heading?: string };
    }
  }
}

const BASE = import.meta.env.BASE_URL;

/** הכתובת של דף הכתבות, יחסית לבסיס האתר */
export const CREATIONS_PATH = 'creations';
export const isCreationsPage = () =>
  import.meta.env.MODE !== 'preview-embed' && location.pathname.replace(/\/$/, '').endsWith(`/${CREATIONS_PATH}`);

/** קישור "כתבות" בפקדי הכותרת, בסגנון קבוצת הכפתורים של המדריך */
export function CreationsLink({ current = false }: { current?: boolean }) {
  if (import.meta.env.MODE === 'preview-embed') return null;
  return (
    <nav className="seg creations-nav" aria-label="כתבות">
      <a href={BASE + CREATIONS_PATH} aria-current={current ? 'page' : undefined} data-on={current}>
        כתבות
      </a>
    </nav>
  );
}

/**
 * כתבות: עמוד A4 אחד לכל נושא, מורכב מהנוסח ומההמחשות של המדריך.
 * הרכיב המשותף <app-creations> (AppOfApp-GH/public/creations.js) מציג, מדפיס ומעלה לחדר במוזיאון TAARUCHA.
 * הנתונים: public/creations.json, נגזר מ-data/ ב-tools/creations.mjs.
 */
export function Creations() {
  return (
    <div className="creations-page">
      <header className={s.header}>
        <div className={s.topRow}>
          <a className={`${s.brand} creations-home`} href={BASE}>
            <div>
              <div className={s.brandTitle}>הנחיות מרחביות אשדוד</div>
              <div className={s.brandSub}>מהדורה {edition}</div>
            </div>
          </a>
          <div className="creations-fill" />
          <CreationsLink current />
          <div className={s.logo}>
            <Logo />
          </div>
          <ai-menu />
        </div>
      </header>
      <main className="creations-main">
        <app-creations src={`${BASE}creations.json`} heading="כתבות מתוך ההנחיות" />
      </main>
    </div>
  );
}
