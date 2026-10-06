import { dim, need, tag } from './dims.ts';
import { FLOOR, SPACING as S } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/**
 * שני בניינים על מגרש אחד. בורר הגובה בוחר בין שני המרחקים לפי סף הקומות שבנתונים.
 * בבניין הראשון שתי כנפיים זו מול זו: הפניית חלון אל חלון.
 */
export const buildingSpacing: SceneDef = {
  id: 'building-spacing',
  requires: ['building_spacing_lower_floors_max', 'building_spacing_min_upto14', 'building_spacing_min_15plus'],
  controls(get) {
    const lower = need(get('building_spacing_lower_floors_max'), 'building_spacing_lower_floors_max').value;
    return [
      {
        id: 'floors',
        label: 'גובה הבניינים',
        options: [
          { value: String(lower), label: `עד ${lower} קומות` },
          { value: String(lower + 1), label: `${lower + 1} קומות ומעלה` },
        ],
      },
    ];
  },
  build(get, controls) {
    const m = emptyModel('x');
    const lower = need(get('building_spacing_lower_floors_max'), 'building_spacing_lower_floors_max');
    const near = need(get('building_spacing_min_upto14'), 'building_spacing_min_upto14');
    const far = need(get('building_spacing_min_15plus'), 'building_spacing_min_15plus');
    const reduction = get('building_spacing_reduction_max');
    const window = get('window_to_window_min');

    const floors = Number(controls.floors ?? lower.value);
    const tall = floors > lower.value;
    const spacing = tall ? far : near;
    const h = floors * FLOOR.typicalHeight;

    const W = S.plot.width / 2;
    const D = S.plot.depth / 2;
    m.surfaces.push({ use: 'residential', polygon: [[-W, -D], [W, -D], [W, D], [-W, D]], y: 0 });
    m.lines.push({ kind: 'plot', points: [[-W, 0.01, -D], [W, 0.01, -D], [W, 0.01, D], [-W, 0.01, D], [-W, 0.01, -D]] });

    // בניין דרומי (קרוב לרחוב) ובניין צפוני, ביניהם המרחק הנדרש
    const b = S.building;
    const southFront = D - S.frontSetback;
    const southRear = southFront - b.depth;
    const northFront = southRear - spacing.value;
    const northRear = northFront - b.depth;
    m.volumes.push({ kind: 'mass', center: [0, h / 2, (southFront + southRear) / 2], size: [b.width, h, b.depth] });

    // הבניין הצפוני בצורת U: שתי כנפיים לכיוון צפון, ביניהן מרווח של חלון אל חלון
    const gap = window ? window.value : 0;
    const coreDepth = b.depth - S.wing.depth;
    m.volumes.push({ kind: 'mass', center: [0, h / 2, northFront - coreDepth / 2], size: [b.width, h, coreDepth] });
    if (window) {
      const wingX = gap / 2 + S.wing.width / 2;
      for (const x of [-wingX, wingX]) {
        m.volumes.push({ kind: 'mass', center: [x, h / 2, northRear + S.wing.depth / 2], size: [S.wing.width, h, S.wing.depth] });
      }
      const y = h * 0.6;
      m.dims.push(dim(window, [-gap / 2, y, northRear], [gap / 2, y, northRear], [0, 0, -1.5]));
    } else {
      m.volumes.push({ kind: 'mass', center: [0, h / 2, northRear + S.wing.depth / 2], size: [b.width, h, S.wing.depth] });
    }

    const x = b.width / 2 + 2;
    m.dims.push(dim(spacing, [x, 0, southRear], [x, 0, northFront], [0, 1.5, 0]));
    if (reduction) m.tags.push(tag(reduction, [-x, 4, (southRear + northFront) / 2], 'הקטנה '));

    if (tall && floors === lower.value + 1) {
      m.notes.push({
        text: `פירוש לבחינה: בניין בן ${floors} קומות מוצג לפי 2.4.2 ("${floors} קומות ומעלה"). ב־2.3.2 וב־2.4.4 הסף מנוסח "עולה על ${floors}".`,
      });
    }
    m.persons.push([x + 1, 0, southFront + 2]);
    m.trees.push([-W + 3, 0, (southRear + northFront) / 2], [W - 3, 0, (southRear + northFront) / 2 + 3]);
    return m;
  },
};
