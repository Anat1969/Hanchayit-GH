import { dim, need, tag } from './dims.ts';
import { box, plot, sidewalk, ctx } from './common.ts';
import { EXEMPT_PLOT as E, EXEMPT_SHED as S } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** מחסן בחצר, צמוד לבית, לא בחזית לרחוב, ובמרחק מגבול המגרש. */
export const exemptShed: SceneDef = {
  id: 'exempt-shed',
  requires: ['exempt_shed_area_max', 'exempt_shed_height_max'],
  build(get) {
    const m = emptyModel('z');
    const area = need(get('exempt_shed_area_max'), 'exempt_shed_area_max');
    const height = need(get('exempt_shed_height_max'), 'exempt_shed_height_max');
    const pitched = get('exempt_shed_pitched_height_max');
    const distance = get('exempt_shed_boundary_distance_min');
    const W = E.width / 2;
    plot(m, -W, W, -E.depth, 0);
    m.surfaces.push(...sidewalk(E.width));
    const h = E.house;
    const hx0 = -W + 2;
    const hx1 = hx0 + h.width;
    const hz1 = -E.frontSetback;
    const hz0 = hz1 - h.depth;
    m.volumes.push(ctx(box('mass', hx0, hx1, 0, h.height, hz0, hz1)));

    // המחסן בעורף, צמוד לקיר האחורי של הבית
    const width = S.width;
    const depth = area.value / width;
    const sx1 = hx1;
    const sx0 = sx1 - width;
    m.volumes.push(box('mass', sx0, sx1, 0, height.value, hz0 - depth, hz0));
    m.dims.push(dim(height, [sx0, 0, hz0 - depth], [sx0, height.value, hz0 - depth], [-0.5, 0, 0]));
    m.tags.push(tag(area, [(sx0 + sx1) / 2, height.value + 0.4, hz0 - depth / 2], 'שטח '));
    if (pitched) m.tags.push(tag(pitched, [(sx0 + sx1) / 2, height.value + 1.2, hz0 - depth / 2], 'בגג משופע '));
    if (distance) {
      // המרחק מגבול המגרש האחורי
      m.dims.push(dim(distance, [sx1 + 0.5, 0.05, -E.depth], [sx1 + 0.5, 0.05, -E.depth + distance.value], [0, 0, 0]));
    }
    m.labels.push({ text: 'לא בחזית לרחוב', at: [0, 0.5, -1.5] });
    m.persons.push([sx0 - 1.2, 0, hz0 - depth - 0.8]);
    return m;
  },
};
