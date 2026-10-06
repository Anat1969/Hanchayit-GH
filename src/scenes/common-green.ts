import { dim, need, tag } from './dims.ts';
import { box, plot, sidewalk, ctx } from './common.ts';
import { COMMON_GREEN as G } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/**
 * תכנית מגרש מגורים: שטח מגונן משותף בשיעור המינימלי משטח המגרש,
 * ממנו שטח קבוע בסמוך ללובי בחזית, והיתרה כחטיבה אחת בעורף.
 */
export const commonGreen: SceneDef = {
  id: 'common-green',
  requires: ['common_green_ratio_min', 'common_green_near_lobby', 'common_green_parcel_width_min', 'common_green_parcel_area_min'],
  build(get) {
    const m = emptyModel('x');
    const ratio = need(get('common_green_ratio_min'), 'common_green_ratio_min');
    const lobby = need(get('common_green_near_lobby'), 'common_green_near_lobby');
    const width = need(get('common_green_parcel_width_min'), 'common_green_parcel_width_min');
    const parcelMin = need(get('common_green_parcel_area_min'), 'common_green_parcel_area_min');

    const W = G.plot.width / 2;
    const D = G.plot.depth;
    plot(m, -W, W, -D, 0);
    m.surfaces.push(...sidewalk(G.plot.width));
    const b = G.building;
    const bz1 = -G.frontSetback;
    const bz0 = bz1 - b.depth;
    m.volumes.push(ctx(box('mass', -b.width / 2, b.width / 2, 0, b.height, bz0, bz1)));
    m.labels.push({ text: 'לובי', at: [0, 0.2, bz1 + 0.6] });

    // ליד הלובי: ריבוע בשטח הנדרש, בחזית לרחוב
    const side = Math.sqrt(lobby.value);
    const lx1 = -b.width / 2 - 0.5;
    const lx0 = Math.max(-W, lx1 - side);
    const lz0 = -Math.min(G.frontSetback + b.depth, lobby.value / (lx1 - lx0));
    m.volumes.push(box('soil', lx0, lx1, 0, 0.05, lz0, 0));
    m.tags.push(tag(lobby, [(lx0 + lx1) / 2, 0.3, lz0 / 2]));

    // היתרה: חטיבה אחת ברוחב כל המגרש בעורף
    const total = ratio.value * G.plot.width * G.plot.depth;
    const rest = Math.max(total - lobby.value, parcelMin.value);
    const depth = rest / G.plot.width;
    m.volumes.push(box('soil', -W, W, 0, 0.05, -D, -D + depth));
    m.tags.push(tag(ratio, [0, 0.3, -D + depth / 2], 'משותף '));
    m.tags.push(tag(parcelMin, [W - 5, 0.3, -D + depth / 2], 'חטיבה '));
    // מד הרוחב המינימלי של חטיבת הקרקע
    m.dims.push(dim(width, [-W + 2, 0.05, -D], [-W + 2, 0.05, -D + width.value], [0, 0, 0]));
    m.trees.push([-W + 6, 0, -D + depth / 2], [W - 10, 0, -D + depth / 2], [(lx0 + lx1) / 2, 0, lz0 / 2 - 2]);
    m.persons.push([lx1 + 1, 0, -2]);
    return m;
  },
};
