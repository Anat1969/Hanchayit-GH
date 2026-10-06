import { useEffect, useState } from 'react';
import { BUILDING_TYPES, type BuildingType } from './rules/load.ts';
import type { TypeFilter } from './rules/derive.ts';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export interface Route {
  ruleId: string | null;
  type: TypeFilter;
}

function read(): Route {
  const path = decodeURIComponent(location.pathname.slice(BASE.length));
  const m = /^\/rule\/([^/]+)\/?$/.exec(path);
  const t = new URLSearchParams(location.search).get('type');
  return {
    ruleId: m ? m[1] : null,
    type: BUILDING_TYPES.includes(t as BuildingType) ? (t as BuildingType) : 'all',
  };
}

export function href(route: Route): string {
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
    history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', href(next));
    setRoute(next);
  };
  return [route, navigate];
}
