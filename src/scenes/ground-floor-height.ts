import { dim, need } from './dims.ts';
import { FLOOR, GROUND_FLOOR as G, STREET } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';
import { sidewalk } from './common.ts';

/** חתך בבניין עם חזית פעילה: קומת קרקע גבוהה, ומעליה קומות טיפוסיות שיכולות לבלוט לרחוב. */
export const groundFloorHeight: SceneDef = {
  id: 'ground-floor-height',
  requires: ['active_ground_floor_height_min', 'active_ground_floor_height_min_overhang'],
  controls: () => [
    {
      id: 'overhang',
      label: 'גוף הבניין',
      options: [
        { value: 'no', label: 'בקו החזית' },
        { value: 'yes', label: 'בולט לרחוב' },
      ],
    },
  ],
  build(get, controls) {
    const m = emptyModel('x');
    const overhang = controls.overhang === 'yes';
    const p = overhang
      ? need(get('active_ground_floor_height_min_overhang'), 'active_ground_floor_height_min_overhang')
      : need(get('active_ground_floor_height_min'), 'active_ground_floor_height_min');

    const gf = p.value;
    const upper = G.upperFloors * FLOOR.typicalHeight;
    const half = G.width / 2;
    const front = 0;
    const back = -G.depth;
    const shift = overhang ? G.overhang : 0;

    m.surfaces.push(...sidewalk(G.width + 6));
    m.surfaces.push({ use: 'residential', polygon: [[-half - 3, back - 2], [half + 3, back - 2], [half + 3, 0], [-half - 3, 0]], y: 0 });
    m.lines.push({ kind: 'plot', points: [[-half - 3, 0.01, 0], [half + 3, 0.01, 0]] });

    // קומת קרקע: תקרה, קירות צד וחזית מסחרית שקופה (חלק קל)
    m.volumes.push({ kind: 'mass', center: [0, gf - FLOOR.slab / 2, (front + back) / 2], size: [G.width, FLOOR.slab, G.depth] });
    m.volumes.push({ kind: 'mass', center: [0, gf / 2, back + 0.15], size: [G.width, gf, 0.3] });
    for (const x of [-half + 0.15, half - 0.15]) {
      m.volumes.push({ kind: 'mass', center: [x, gf / 2, (front + back) / 2], size: [0.3, gf, G.depth] });
    }
    m.volumes.push({ kind: 'light', center: [0, gf / 2, front - G.storefrontDepth / 2], size: [G.width - 0.6, gf - FLOOR.slab, 0.05] });
    m.volumes.push({ kind: 'mass', center: [0, gf + upper / 2, (front + shift + back) / 2], size: [G.width, upper, G.depth + shift] });

    const x = half;
    m.dims.push(dim(p, [x, 0, front + shift], [x, gf, front + shift], [0, 0, 1.2]));
    m.persons.push([half - 2, 0, STREET.sidewalkWidth / 2]);
    m.trees.push([-half + 1.5, 0, STREET.sidewalkWidth - 0.8]);
    return m;
  },
};
