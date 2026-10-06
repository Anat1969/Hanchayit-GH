import { aliased, type SceneDef } from './model.ts';
import { fenceStreet } from './fence-street.ts';
import { retainingTerrace } from './retaining-terrace.ts';
import { fenceInternal } from './fence-internal.ts';
import { parkingCanopy } from './parking-canopy.ts';
import { openFrontage } from './open-frontage.ts';
import { colonnade } from './colonnade.ts';
import { plantingStrip } from './planting-strip.ts';
import { commonGreen } from './common-green.ts';
import { shadingCoverage } from './shading-coverage.ts';
import { parkingRamp } from './parking-ramp.ts';
import { parkingTrees } from './parking-trees.ts';
import { ventOpenings } from './vent-openings.ts';
import { groundFloorHeight } from './ground-floor-height.ts';
import { activeFrontage } from './active-frontage.ts';
import { lobbyProgram } from './lobby-program.ts';
import { gardenApartments } from './garden-apartments.ts';
import { buildingSpacing } from './building-spacing.ts';
import { roofEquipment } from './roof-equipment.ts';
import { materialRatio } from './material-ratio.ts';
import { pergolaGround } from './pergola-ground.ts';
import { pergolaBalcony } from './pergola-balcony.ts';
import { awning } from './awning.ts';
import { poolSetback } from './pool-setback.ts';
import { umbrellaClearance } from './umbrella-clearance.ts';
import { exemptFence } from './exempt-fence.ts';
import { exemptAwning } from './exempt-awning.ts';
import { exemptParkingShade } from './exempt-parking-shade.ts';
import { exemptShed } from './exempt-shed.ts';
import { exemptRamp } from './exempt-ramp.ts';
import { exemptRooftop } from './exempt-rooftop.ts';

/** מצללה בפטור: אותה סצנה כמו בפרק ב', עם הפרמטרים של פרק א' */
const exemptPergola = aliased(pergolaGround, 'exempt-pergola', {
  pergola_setback_projection_max: 'exempt_pergola_setback_projection_max',
  pergola_area_max_abs: 'exempt_pergola_area_max_abs',
  pergola_area_max_ratio: 'exempt_pergola_area_max_ratio',
  pergola_open_ratio_min: 'exempt_pergola_open_ratio_min',
});

/** כל הסצנות, לפי המזהה בקבצי הנתונים */
export const SCENES: Record<string, SceneDef> = Object.fromEntries(
  [
    fenceStreet, retainingTerrace, fenceInternal, parkingCanopy, openFrontage, colonnade, plantingStrip,
    commonGreen, shadingCoverage, parkingRamp, parkingTrees, ventOpenings, groundFloorHeight, activeFrontage,
    lobbyProgram, gardenApartments, buildingSpacing, roofEquipment, materialRatio, pergolaGround,
    pergolaBalcony, awning, poolSetback, umbrellaClearance,
    exemptFence, exemptAwning, exemptParkingShade, exemptPergola, exemptShed, exemptRamp, exemptRooftop,
  ].map((s) => [s.id, s]),
);
