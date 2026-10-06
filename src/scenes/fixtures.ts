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
