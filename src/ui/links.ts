import { createContext, useContext } from 'react';

/** ערך מקושר: הנוסח והמודל קוראים וכותבים לאותו מקום, וכך המרקר מופיע בשניהם. */
export interface LinkTarget {
  ruleId: string;
  paramKey: string;
}

export interface LinkState {
  /** הערך שהמשתמש מצביע עליו כרגע (ריחוף או פוקוס) */
  current: LinkTarget | null;
  set: (t: LinkTarget | null) => void;
  /** מידה שנלחצה במודל: הערך בנוסח נשאר מסומן עד לחיצה נוספת */
  pinned: LinkTarget | null;
  pin: (t: LinkTarget | null) => void;
}

export const LinkContext = createContext<LinkState>({ current: null, set: () => {}, pinned: null, pin: () => {} });

export const useLink = () => useContext(LinkContext);

export const sameTarget = (a: LinkTarget | null, b: LinkTarget | null) =>
  !!a && !!b && a.ruleId === b.ruleId && a.paramKey === b.paramKey;
