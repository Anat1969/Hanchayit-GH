import type { SceneDef } from './model.ts';
import { fenceStreet } from './fence-street.ts';
import { retainingTerrace } from './retaining-terrace.ts';
import { pergolaGround } from './pergola-ground.ts';
import { buildingSpacing } from './building-spacing.ts';
import { groundFloorHeight } from './ground-floor-height.ts';

/** סצנות שנבנו. סצנה מ־chapter-b.json שאינה כאן מוצגת כ"ההמחשה בהכנה". */
export const SCENES: Record<string, SceneDef> = Object.fromEntries(
  [fenceStreet, retainingTerrace, pergolaGround, buildingSpacing, groundFloorHeight].map((s) => [s.id, s]),
);
