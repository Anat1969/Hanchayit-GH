import type { Volume } from './model.ts';

/**
 * חומר לפי מה שהאלמנט מייצג: בנוי, עץ ומתכת קלים, זכוכית, צמחייה, מים, חומר כהה.
 * ערכי ברק (roughness) ומתכתיות נבחרו כך שהזכוכית והמים מבריקים והבנוי מט.
 */
export interface Finish {
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
}

export const FINISH: Record<Volume['kind'], Finish> = {
  mass: { color: '#ece8e1', roughness: 0.8, metalness: 0, opacity: 1 },
  light: { color: '#b8865a', roughness: 0.45, metalness: 0.15, opacity: 1 },
  glass: { color: '#9ccbe8', roughness: 0.05, metalness: 0.1, opacity: 0.4 },
  soil: { color: '#86b85e', roughness: 0.95, metalness: 0, opacity: 1 },
  water: { color: '#3e9bd6', roughness: 0.05, metalness: 0.05, opacity: 0.8 },
  dark: { color: '#50565c', roughness: 0.4, metalness: 0.3, opacity: 1 },
};

export const TREE_FINISH = { crown: '#7db35f', trunk: '#8b6b4a' };

/** נפח רקע: שקוף ומעומעם */
export const CONTEXT_OPACITY = 0.28;
