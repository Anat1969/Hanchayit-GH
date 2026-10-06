import { largerOf } from '../rules/derive.ts';
import { need, tag } from './dims.ts';
import { box, ctx } from './common.ts';
import { BALCONY as B, FLOOR } from './fixtures.ts';
import { emptyModel, type SceneDef } from './model.ts';

/** מצללה במרפסת גג: בתוך קו המעקה, בשטח עד הגדול מבין הערך המוחלט והחלק היחסי של המרפסת. */
export const pergolaBalcony: SceneDef = {
  id: 'pergola-balcony',
  requires: ['pergola_area_max_abs', 'pergola_area_max_ratio'],
  build(get) {
    const m = emptyModel('x');
    const abs = need(get('pergola_area_max_abs'), 'pergola_area_max_abs');
    const ratio = need(get('pergola_area_max_ratio'), 'pergola_area_max_ratio');
    const W = B.width / 2;
    const h = B.floors * FLOOR.typicalHeight;
    const front = 0;
    const back = -B.depth;
    m.surfaces.push({ use: 'residential', polygon: [[-W - 3, back - 3], [W + 3, back - 3], [W + 3, 3], [-W - 3, 3]], y: 0 });
    m.volumes.push(ctx(box('mass', -W, W, 0, h, back, front)));
    // קומת גג בנסיגה, והמרפסת לפניה
    const b = B.balcony;
    m.volumes.push(ctx(box('mass', -W, W, h, h + FLOOR.typicalHeight, back, front - b.depth)));
    m.volumes.push(box('light', -W, W, h, h + B.railing, front - 0.08, front));
    for (const x of [-W, W - 0.08]) m.volumes.push(box('light', x, x + 0.08, h, h + B.railing, front - b.depth, front));

    // המצללה: בגבולות המרפסת, לא מעבר למעקה
    const area = Math.min(largerOf(abs.value, ratio.value, B.width * b.depth), B.width * b.depth);
    const depth = Math.min(b.depth - 0.3, area / b.width);
    const px0 = -b.width / 2;
    const px1 = b.width / 2;
    const z1 = front - b.depth;
    const z0 = z1 + depth;
    const top = h + B.pergolaHeight;
    for (let x = px0; x <= px1; x += 0.3) m.volumes.push(box('light', x, x + 0.1, top - 0.12, top, z1, z0));
    for (const x of [px0, px1 - 0.12]) m.volumes.push(box('light', x, x + 0.12, h, top - 0.12, z0 - 0.12, z0));

    m.tags.push(tag(abs, [px1 + 2.2, top + 0.6, z1], 'שטח '));
    m.tags.push(tag(ratio, [px1 + 2.2, top - 0.2, z1], 'או ', ' מהמרפסת, לפי הגדול'));
    m.labels.push({ text: 'ללא חריגה מעבר למעקה', at: [0, h + B.railing + 0.4, front + 0.2] });
    m.persons.push([px0 - 1, h, front - 1.5]);
    return m;
  },
};
