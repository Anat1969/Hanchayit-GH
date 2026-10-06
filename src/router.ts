import { useEffect, useState } from 'react';
import { BUILDING_TYPES, type BuildingType } from './rules/load.ts';
import type { TypeFilter } from './rules/derive.ts';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
// בגרסת התצוגה המקדימה (מסגרת סגורה) אין כתובות: הניתוב נשמר בזיכרון בלבד
const MEMORY = import.meta.env.MODE === 'preview-embed';

export interface Route {
  ruleId: string | null;
  type: TypeFilter;
}

function read(): Route {
  if (MEMORY) return { ruleId: null, type: 'all' };
  const path = decodeURIComponent(location.pathname.slice(BASE.length));
  const m = /^\/rule\/([^/]+)\/?$/.exec(path);
  const t = new URLSearchParams(location.search).get('type');
  return {
    ruleId: m ? m[1] : null,
    type: t === 'exempt' ? 'exempt' : BUILDING_TYPES.includes(t as BuildingType) ? (t as BuildingType) : 'all',
  };
}

export function href(route: Route): string {
  if (MEMORY) return `#${route.ruleId ?? ''}`;
  const path = route.ruleId ? `/rule/${encodeURIComponent(route.ruleId)}` : '/';
  const query = route.type === 'all' ? '' : `?type=${route.type}`;
  return BASE + path + query;
}

export function useRoute(): [Route, (next: Route, mode?: 'push' | 'replace') => void] {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onPop = () => setRoute(read());
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);
  const navigate = (next: Route, mode: 'push' | 'replace' = 'push') => {
    if (!MEMORY) history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', href(next));
    setRoute(next);
  };
  return [route, navigate];
}
