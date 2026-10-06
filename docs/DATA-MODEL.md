# מודל הנתונים

`data/chapter-b.json` הוא מקור האמת היחיד. הטקסט, החיפוש והמודל התלת מימדי נגזרים ממנו. מספר שמופיע על המסך, בטקסט או בהערת מידה במודל, חייב להגיע מפרמטר בקובץ הזה ולא מקוד.

## טיפוסים (TypeScript, לממש עם zod)

```ts
type BuildingType = 'ground' | 'residential' | 'active' | 'industrial';
// ground = צמודי קרקע, residential = מגורים רוויה, active = חזית פעילה, industrial = תעשייה

type RuleKind = 'parametric' | 'requirement' | 'prohibition' | 'reference';
// parametric = יש ערך מספרי מדיד, requirement = דרישה איכותית,
// prohibition = איסור, reference = הפניה למסמך או מדיניות אחרים

interface Param {
  key: string;             // מזהה יציב, snake_case. משמש את הסצנות
  op: '=' | '<=' | '>=' | '<' | '>';
  value: number | string[];
  unit: 'm' | 'm2' | 'ratio' | 'floors' | 'days_per_year' | 'coef' | 'time' | 'spaces_per_tree';
  from?: string;           // נקודת המדידה: street_level, plot_boundary, higher_adjacent_level...
  of?: string;             // ליחסים: של מה (plot_area, envelope...)
  note?: string;
}

interface Rule {
  id: string;              // "B2.2.1-11". יציב, לא משתנה בין מהדורות אם הסעיף לא השתנה מהותית
  ref: string;             // הסימון כפי שמופיע במסמך: "2.2.1 (11)"
  section: string;         // מזהה ב־sections
  applies_to: BuildingType[];
  kind: RuleKind;
  text: string;            // נוסח הסעיף
  scene?: string;          // מזהה ב־scenes
  params?: Param[];
  materials?: { allowed?: string[]; allowed_industrial?: string[]; required?: string[]; forbidden?: string[] };
  table?: { columns: string[]; rows: Record<string, string>[] };
  review?: string;         // הערת בדיקה. לא מוצגת בממשק; מרוכזת גם ב־review-notes.md
}

interface Section { id: string; ref: string; title: string; parent: string | null }
interface Scene   { id: string; title: string; rules: string[] }
```

## כללים

1. אותו `key` יכול להופיע בכמה סעיפים, למשל `terrace_bed_width` בסעיפים 1.2.1 (3) ו־2.2.1 (6). הסצנה מקבלת את הערך לפי סוג המבנה הנבחר. אם יש שני ערכים שונים לאותו key ולאותו סוג מבנה, זו שגיאת ולידציה.
2. ערכים עם "לפי הגדול" (מצללה: 50 מ"ר או רבע מהשטח) נשמרים כשני פרמטרים, ‎`_abs` ו־`_ratio`. החישוב נעשה בפונקציה ב־`src/rules/derive.ts` ולא בתוך הסצנה.
3. מהדורות עתידיות יישמרו כקובץ חדש (`chapter-b.ed19.json`). ההשוואה בין מהדורות תיעשה לפי `id` ו־`key`.
4. בשדה `text` אסור לערוך תוכן. תיקוני כתיב ומספור נרשמים ב־`review` וב־`review-notes.md`.

## מילים נרדפות

`data/synonyms.json` כולל קבוצות מונחים שמתנהגות כמונח אחד בחיפוש, למשל מצללה ופרגולה.
