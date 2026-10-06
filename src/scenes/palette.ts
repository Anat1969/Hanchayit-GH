// צבעי המודל נקראים ממשתני ה־CSS ב־tokens.css, כדי שיהיה מקור אחד לצבעים.

const FALLBACK = {
  paper: '#ffffff',
  ink: '#000000',
  pencil: '#5e6770',
  blueLine: '#1f4e79',
  limit: '#c8102e',
  marker: '#ffe14d',
  mass: '#fafafa',
  residential: '#f3e3a0',
  openSpace: '#cfe2b4',
  public: '#d8c3a5',
  industrial: '#d9cde6',
  road: '#e4e4e1',
};

export type Palette = typeof FALLBACK;

const TOKENS: Record<keyof Palette, string> = {
  paper: '--paper',
  ink: '--ink',
  pencil: '--pencil',
  blueLine: '--blue-line',
  limit: '--limit',
  marker: '--marker',
  mass: '--model-mass',
  residential: '--land-residential',
  openSpace: '--land-open-space',
  public: '--land-public',
  industrial: '--land-industrial',
  road: '--land-road',
};

export function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const out = { ...FALLBACK };
  for (const k of Object.keys(TOKENS) as Array<keyof Palette>) {
    const v = style.getPropertyValue(TOKENS[k]).trim();
    if (v) out[k] = v;
  }
  return out;
}
