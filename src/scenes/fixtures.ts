// גיאומטריית רקע לסצנות: גודל מגרש לדוגמה, רוחב רחוב, גובה קומה טיפוסית.
// אלה אינם ערכים רגולטוריים. כל ערך רגולטורי מגיע מ־data/chapter-b.json (CLAUDE.md, עיקרון 1).

/** רחוב לדוגמה */
export const STREET = {
  sidewalkWidth: 3.5,
  /** רצועת כביש קצרה, רק כדי לסמן שזה רחוב */
  roadWidth: 2.5,
};

/** קנה מידה אנושי */
export const PERSON_HEIGHT = 1.7;
export const TREE = { trunkHeight: 2.2, trunkRadius: 0.15, crownRadius: 1.4 };

/** קומה טיפוסית ועובי תקרה */
export const FLOOR = { typicalHeight: 3.2, slab: 0.3 };

export const FENCE_STREET = {
  length: 10,
  thickness: 0.25,
  plotDepth: 6,
  /** פס של החלק הקל: רוחב הפס האטום */
  slatWidth: 0.08,
  /** גובה להמחשה בלבד, כשהפרק לא קובע גובה לגדר לרחוב לסוג המבנה */
  illustrativeHeight: 1.5,
};

export const TERRACE = {
  length: 8,
  plotDepth: 5,
  wallThickness: 0.25,
};

export const PERGOLA = {
  plot: { width: 22, depth: 30 },
  building: { width: 12, depth: 12, height: 6.6 },
  /** מרחק קו הבניין האחורי מגבול המגרש */
  rearSetback: 6,
  height: 2.6,
  beamDepth: 0.2,
  postSize: 0.15,
  /** אורך המצללה לאורך החזית */
  width: 6,
};

export const SPACING = {
  plot: { width: 36, depth: 64 },
  building: { width: 18, depth: 16 },
  /** כנף בבניין U: הפניית חלון אל חלון */
  wing: { width: 6, depth: 8 },
  frontSetback: 6,
};

export const GROUND_FLOOR = {
  depth: 14,
  width: 16,
  upperFloors: 4,
  /** בליטת גוף הבניין לרחוב, כשהבורר "גוף הבניין בולט" פעיל */
  overhang: 2,
  storefrontDepth: 0.3,
};

export const FENCE_INTERNAL = { plotWidth: 14, plotDepth: 20, length: 20, thickness: 0.2 };

export const PARKING_CANOPY = { width: 3, house: { width: 10, depth: 12, height: 6.6 }, plot: { width: 16, depth: 24 }, height: 2.5 };

export const OPEN_FRONTAGE = { width: 30, depth: 16, building: { depth: 14, height: 13 }, frontYard: 6, bench: { length: 1.8, depth: 0.5, height: 0.45 } };

export const COLONNADE = { width: 24, depth: 14, arcadeDepth: 3.5, column: 0.5, bay: 6, upperFloors: 4 };

export const PLANTING = { plot: { width: 30, depth: 36 }, building: { width: 18, depth: 16, height: 16 } };

export const COMMON_GREEN = { plot: { width: 30, depth: 40 }, building: { width: 18, depth: 16, height: 25 }, frontSetback: 5 };

/** אשדוד: קו רוחב ואורך, ושעון קיץ (UTC+3) ב־21 ביוני */
export const SUN = { latitude: 31.8, longitude: 34.65, utcOffset: 3, dayOfYear: 172 };

export const SHADING = {
  plot: { width: 26, depth: 30 },
  building: { width: 14, depth: 12, height: 20 },
  frontSetback: 5,
  /** אזור שהייה ומקום ישיבה לדוגמה */
  stay: { x0: -11, x1: -1, z0: 4, z1: 12 },
  bench: { x0: -8, x1: -5.5, z0: 7, z1: 7.6 },
  pergola: { x0: -10.5, x1: -2, z0: 4.5, z1: 10.5, slat: 0.15, gap: 0.15 },
  trees: [[6, 0, 9], [10, 0, 3], [-12, 0, -8]] as Array<[number, number, number]>,
  /** צפיפות הדגימה לחישוב הצל */
  grid: 0.25,
};

export const RAMP = { plot: { width: 24, depth: 30 }, width: 6.5, length: 18, depth: 3.2, building: { width: 16, depth: 16, height: 16 } };

export const PARKING_TREES = { perpendicular: { width: 2.5, depth: 5, count: 8 }, parallel: { width: 6, depth: 2.5, count: 4 }, aisle: 6 };

export const VENT = { width: 16, depth: 14, height: 13, vent: { width: 1.6, height: 0.8 } };

export const ACTIVE = { width: 24, depth: 14, groundFloor: 4.5, bay: 6, upperFloors: 4, canopyDepth: 1.8, signHeight: 0.6 };

export const LOBBY = {
  /** מספר יחידות דיור לדוגמה בכל שורה בטבלה */
  unitsPerRow: [16, 40, 80, 80],
  blockDepth: 4,
  gap: 2.5,
};

export const GARDEN = { width: 26, depth: 16, floors: 9, gardenDepth: 6, raise: 0.6 };

export const ROOF = { width: 16, depth: 14, floors: 5, condenser: { width: 1, depth: 0.5, height: 0.9 }, eyeHeight: 1.6, streetDistance: 14 };

export const FACADE = { width: 14, height: 9, depth: 10 };

export const BALCONY = { floors: 5, width: 14, depth: 12, balcony: { width: 8, depth: 6 }, railing: 1.1, pergolaHeight: 2.6 };

export const AWNING = { width: 12, height: 9, depth: 10, opening: { width: 1.8, height: 2.4 }, parapet: 1.2, awningDepth: 1.2 };

export const POOL = { plot: { width: 24, depth: 30 }, pool: { width: 4, length: 9, depth: 1.4 }, building: { width: 14, depth: 12, height: 10 } };

export const UMBRELLA = { width: 14, sidewalk: 6, canopyRadius: 1.4, pole: 0.06, curb: 0.15, building: { depth: 10, height: 12 } };

// פרק א': עבודות פטורות מהיתר
export const EXEMPT_PLOT = { width: 18, depth: 26, house: { width: 10, depth: 11, height: 6.6 }, frontSetback: 5 };
export const EXEMPT_AWNING = { width: 12, height: 9, depth: 10, door: { width: 1.2, height: 2.3 }, window: { width: 3, height: 2.2 }, parapet: 1.1 };
export const EXEMPT_SHED = { width: 3, depth: 2 };
export const EXEMPT_RAMP = { width: 1.5, landing: 1.6 };
export const EXEMPT_ROOF = { width: 14, depth: 12, height: 9.6, parapet: 1.1, heater: { width: 1.2, depth: 0.7, height: 1.6 }, panel: { width: 1, depth: 1.7, gap: 0.6 } };
