/** אורך עגול לקנה המידה הגרפי, כ־80 פיקסלים */
export function scaleLength(zoom: number): number {
  const target = 80 / zoom;
  return [0.5, 1, 2, 5, 10, 20, 50, 100].find((l) => l >= target) ?? 100;
}
