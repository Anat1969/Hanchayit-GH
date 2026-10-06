# הנחיות מרחביות אשדוד – מדריך תלת מימדי

מדריך דיגיטלי להנחיות המרחביות של אשדוד (מהדורה 18, דצמבר 2024). הנוסח המלא, עם חיפוש, מוצג לצד מודל תלת מימדי של כל נושא. הקהל: אדריכלים וצוות אדריכלית העיר. גרסה 1 מכסה את פרק ב' בלבד.

## לפני כל משימה, לקרוא

- `docs/SPEC.md`: מה בונים, בכמה שלבים, ומתי שלב נחשב גמור.
- `docs/DESIGN.md`: השפה העיצובית. היא מחייבת, כולל רשימת האסור.
- `docs/DATA-MODEL.md`: מבנה הנתונים.
- `data/review-notes.md`: עמימויות ידועות בהנחיות. לא לפתור אותן בקוד בשקט.

## עקרונות שלא מתפשרים עליהם

1. **הנתונים הם מקור האמת.** כל מספר שמוצג, בטקסט או במודל, נקרא מ־`data/chapter-b.json`. סצנה שמכילה מספר רגולטורי קבוע בקוד היא באג. גיאומטריית רקע (גודל מגרש לדוגמה, רוחב רחוב) מותרת, בקובץ `scenes/fixtures.ts` בלבד.
2. **הנוסח לא נערך.** אסור לשנות את `text`. תיקונים נרשמים ב־`review-notes.md`.
3. **כל מידה ניתנת למעקב.** כל הערת מידה במודל יודעת מאיזה `rule.id` ו־`param.key` היא באה. זה הבסיס לקישור הדו־כיווני ולמצב הבחינה.
4. **עברית ו־RTL מההתחלה.** `dir="rtl"`, תכונות CSS לוגיות, ובדיקות לחיפוש בעברית.
5. **שקט.** אם אפשר להסיר אלמנט בלי לאבד מידע, מסירים אותו.

## סטאק

- Vite, React 18, TypeScript (strict).
- three.js דרך `@react-three/fiber` ו־`@react-three/drei` (OrthographicCamera, Edges, Html לתוויות מידה).
- MiniSearch לחיפוש, עם tokenizer עברי משלנו ב־`src/search/hebrew.ts`.
- zod לולידציה של JSON בזמן build ובבדיקות.
- CSS Modules עם משתני CSS מתוך `src/styles/tokens.css`. בלי Tailwind ובלי ספריית רכיבים.
- גופנים: David Libre ו־Miriam Libre, באירוח עצמי (`@fontsource`).
- Vitest ו־Testing Library. Playwright לבדיקת צילומי מסך של סצנות.
- פריסה כאתר סטטי. אין שרת בגרסה 1.

## מבנה

```
data/                  chapter-b.json, synonyms.json, review-notes.md
docs/                  SPEC, DESIGN, DATA-MODEL
src/
  rules/               load.ts (zod), derive.ts (חישובי "לפי הגדול", סינון לפי סוג מבנה)
  search/              hebrew.ts (נרמול, תחיליות), index.ts
  scenes/              <scene-id>.tsx, אחד לכל סצנה; fixtures.ts; primitives/ (Dimension, PlotBoundary, Tree, Person)
  ui/                  Index, RuleText, LinkedValue, Sheet, TitleBlock, ViewSwitch, SearchField
  styles/              tokens.css, print.css
```

## פקודות

```
npm run dev
npm run test
npm run validate    # ולידציה של data/*.json מול הסכמה
npm run build
```

## איך בונים סצנה

1. קוראים את הסעיפים שלה ב־`scenes[].rules`.
2. מגדירים מה הפרמטרים שהיא צריכה (`param.key`), מקבלים אותם כ־props, ולא קוראים אותם ישירות מהקובץ.
3. משתמשים רק ב־primitives מהתיקייה. כל מידה היא `<Dimension ruleId paramKey ... />`.
4. מוסיפים טבלת מידות טקסטואלית לנגישות, שנוצרת אוטומטית מהמידות.
5. בדיקה: שינוי ערך הפרמטר בבדיקה משנה את הגיאומטריה ואת התווית.
6. מצלמים מסך בשלוש התצוגות ומשווים מול DESIGN.md לפני שמסמנים כגמור.

## אסור

- להוסיף תלות בלי הסבר בשורה אחת ב־commit.
- localStorage לנתוני ההנחיות. הנתונים נטענים מהקובץ.
- לפתור עמימות מ־`review-notes.md` בהנחה שקטה. אם סצנה חייבת לבחור פירוש, הוא מוצג במודל כהערת עיפרון ("פירוש לבחינה").
- כל מה שמופיע ב"מה אסור" ב־DESIGN.md.

## שלב נוכחי

שלב 4: מצב בחינה. שלבים 1–3 גמורים. ראו SPEC.md.
