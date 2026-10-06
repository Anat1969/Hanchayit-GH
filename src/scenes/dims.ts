import { formatDimension, isLimit } from '../rules/format.ts';
import type { Dim, SceneParam, Tag, Vec3 } from './model.ts';

/** הערת מידה שנגזרת מפרמטר: התווית והצבע נקבעים מהפרמטר, לא מהסצנה. */
export function dim(p: SceneParam, from: Vec3, to: Vec3, offset: Vec3): Dim {
  return { ruleId: p.ruleId, paramKey: p.key, from, to, offset, label: formatDimension(p.param, p.ruleText), limit: isLimit(p.param) };
}

export function tag(p: SceneParam, at: Vec3, prefix = '', suffix = ''): Tag {
  return { ruleId: p.ruleId, paramKey: p.key, at, label: prefix + formatDimension(p.param, p.ruleText) + suffix, limit: isLimit(p.param) };
}

/** פרמטר חובה. סצנה שחסר לה פרמטר היא באג בנתונים או ברשימת הסעיפים של הסצנה. */
export function need(p: SceneParam | undefined, key: string): SceneParam {
  if (!p) throw new Error(`חסר פרמטר ${key}`);
  return p;
}
