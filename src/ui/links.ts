import { createContext, useContext } from 'react';

/** הערך המקושר שהמשתמש מצביע עליו. בשלב 2 המודל יקרא ממנו ויכתוב אליו. */
export interface LinkTarget {
  ruleId: string;
  paramKey: string;
}

export const LinkContext = createContext<{
  current: LinkTarget | null;
  set: (t: LinkTarget | null) => void;
}>({ current: null, set: () => {} });

export const useLink = () => useContext(LinkContext);
