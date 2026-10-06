import * as THREE from 'three';
import type { Surface, Volume } from './model.ts';

/**
 * חומר לפי מה שהאלמנט מייצג: בנוי, עץ ומתכת קלים, זכוכית, צמחייה, מים, חומר כהה.
 * הזכוכית והמים מבריקים, הבנוי מט, הצבעים רוויים מספיק כדי שהשרטוט לא ייראה דהוי.
 */
export interface Finish {
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
}

export const FINISH: Record<Volume['kind'], Finish> = {
  mass: { color: '#efe9df', roughness: 0.78, metalness: 0, opacity: 1 },
  light: { color: '#a8703f', roughness: 0.42, metalness: 0.2, opacity: 1 },
  glass: { color: '#6fb6e6', roughness: 0.04, metalness: 0.15, opacity: 0.45 },
  soil: { color: '#5f9e3c', roughness: 0.92, metalness: 0, opacity: 1 },
  water: { color: '#1f8fd6', roughness: 0.04, metalness: 0.1, opacity: 0.82 },
  dark: { color: '#3d4349', roughness: 0.35, metalness: 0.35, opacity: 1 },
};

export const TREE_FINISH = { crown: ['#5e9e3c', '#76b04f', '#4f8a33'], trunk: '#7a5838' };

export const PERSON_FINISH = { shirt: '#c8553d', legs: '#2f3b4c', skin: '#d9a77d' };

/** נפח רקע: שקוף ומעומעם */
export const CONTEXT_OPACITY = 0.28;

/** רקע השרטוט */
export const SKY = '#f5f7fa';

// ---- מרקמים פרוצדורליים לקרקע (נוצרים בדפדפן, בלי קבצים) ----

type Ground = 'lawn' | 'paving' | 'asphalt' | 'plaza' | 'concrete';

const cache = new Map<Ground, THREE.CanvasTexture>();

/** רעש עדין, שכבה אחת של כתמים בגוונים קרובים */
function speckle(ctx: CanvasRenderingContext2D, size: number, colors: string[], count: number, r: [number, number]) {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    ctx.globalAlpha = 0.35 + rand() * 0.4;
    const rr = r[0] + rand() * (r[1] - r[0]);
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function make(kind: Ground): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  switch (kind) {
    case 'lawn':
      ctx.fillStyle = '#a9cf7f';
      ctx.fillRect(0, 0, size, size);
      speckle(ctx, size, ['#93c06a', '#bcdc95', '#86b35d'], 900, [1, 3]);
      break;
    case 'paving': {
      ctx.fillStyle = '#d9d6cf';
      ctx.fillRect(0, 0, size, size);
      speckle(ctx, size, ['#cfcbc3', '#e3e0da'], 300, [1, 2]);
      ctx.strokeStyle = '#b3aea5';
      ctx.lineWidth = 2;
      // אבני ריצוף 40×40 ס"מ: 4 אבנים לכל מטר בתבנית
      for (let i = 0; i <= 4; i++) {
        const p = (i * size) / 4;
        ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
      }
      break;
    }
    case 'asphalt':
      ctx.fillStyle = '#5b5f63';
      ctx.fillRect(0, 0, size, size);
      speckle(ctx, size, ['#4d5155', '#6a6e72', '#73777b'], 1400, [0.6, 1.6]);
      break;
    case 'plaza':
      ctx.fillStyle = '#e4d9c5';
      ctx.fillRect(0, 0, size, size);
      speckle(ctx, size, ['#d8ccb5', '#eee4d2'], 400, [1, 2.5]);
      break;
    case 'concrete':
      ctx.fillStyle = '#d4d2cd';
      ctx.fillRect(0, 0, size, size);
      speckle(ctx, size, ['#c9c7c1', '#dddbd6'], 500, [1, 2]);
      break;
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** גודל אריח המרקם במטרים */
const TILE: Record<Ground, number> = { lawn: 4, paving: 1.6, asphalt: 3, plaza: 3, concrete: 4 };

export function groundOf(s: Surface): Ground | undefined {
  switch (s.use) {
    case 'residential':
      return 'lawn';
    case 'openSpace':
      return 'lawn';
    case 'public':
      return 'plaza';
    case 'industrial':
      return 'concrete';
    case 'road':
      // מדרכה (עם שורות ריצוף) או כביש (מתחת למפלס המדרכה)
      return s.paving || s.y >= 0 ? 'paving' : 'asphalt';
    default:
      return undefined;
  }
}

/** מרקם לקרקע; ה־UV של ShapeGeometry במטרים, ולכן repeat הוא 1 חלקי גודל האריח */
export function groundTexture(kind: Ground): THREE.CanvasTexture {
  let t = cache.get(kind);
  if (!t) {
    t = make(kind);
    t.repeat.set(1 / TILE[kind], 1 / TILE[kind]);
    cache.set(kind, t);
  }
  return t;
}
