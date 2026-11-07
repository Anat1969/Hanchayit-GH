// מפיק את public/creations.json מתוך נתוני ההנחיות (תקן "יצירות" וכתבות, AppOfApp-GH/docs/creations-standard.md).
// הרצה: node tools/creations.mjs
// כל נוסח, מספר ומספר סעיף נקראים מ-data/chapter-a.json ומ-data/chapter-b.json, והנוסח מצוטט כפי שהוא.
// בקוד כתובים רק המסגור: שם הכתבה, כותרת התובנה, ההייקו (מסומן "הייקו מקורי").
// תמונות: ההמחשה התלת־ממדית של הסצנה מתוך המדריך עצמו, צילום מסך ב-public/creations/img/<scene>.jpg.
import fs from 'node:fs';

const chapters = ['data/chapter-a.json', 'data/chapter-b.json'].map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
const [A, B] = chapters;
const RULE = Object.fromEntries(chapters.flatMap((c) => c.rules).map((r) => [r.id, r]));
const SCENE = Object.fromEntries(chapters.flatMap((c) => c.scenes).map((s) => [s.id, s]));
const edition = /מהדורה מס' (\d+)/.exec(B.meta.source)?.[1] ?? '';
const SOURCE = `הנחיות מרחביות לעיר אשדוד, מהדורה ${edition}, דצמבר 2024`;

const r = (id) => { if (!RULE[id]) throw new Error(`סעיף לא נמצא: ${id}`); return RULE[id]; };
const text = (id) => r(id).text;
const chap = (id) => (id.startsWith('A') ? "פרק א'" : "פרק ב'");
const who = (id) => `סעיף ${r(id).ref}, ${chap(id)}`;
// ערך פרמטר מהנתונים, כדי שלא ייכתב מספר רגולטורי בקוד
const P = (id, key) => {
  const p = (r(id).params || []).find((x) => x.key === key);
  if (!p) throw new Error(`פרמטר לא נמצא: ${id} ${key}`);
  return p.value;
};
const m = (v) => `${v} מ'`;
const pct = (v) => `${Math.round(v * 100)}%`;
// משפטים מתוך הנוסח, עד אורך מסוים, בלי לערוך אותם
const sentences = (s) => s.split(/(?<=[.:])\s+/).filter(Boolean);
const clip = (s, max = 230) => {
  let out = '';
  for (const x of sentences(s)) {
    if (out && (out + ' ' + x).length > max) return out + ' …';
    out = out ? out + ' ' + x : x;
  }
  return out.length > max + 80 ? out.slice(0, max).replace(/\s+\S*$/, '') + ' …' : out;
};
const quote = (id, max) => ({ style: 'quote', quote: clip(text(id), max), who: who(id), cite: SOURCE });

const img = (scene) => {
  const file = `public/creations/img/${scene}.jpg`;
  if (!fs.existsSync(file)) throw new Error(`חסרה המחשה: ${file}`);
  return { image: `creations/img/${scene}.jpg`, credit: `המחשה מתוך המדריך: ${SCENE[scene].title}` };
};
const T = (id, zone, title, sub, creations) => ({
  id, zone, title, sub,
  creations: creations.map((c) => ({ id: c.id || c.style, kicker: c.kicker || `הנחיות מרחביות אשדוד · ${zone}`, ...c })),
});
const haiku = (lines, what) => ({ style: 'haiku', lines, text: `הייקו מקורי. ${what}` });

const topics = [];

// 1. ידע: גדר לרחוב
{
  const id = 'B1.2.1-1';
  topics.push(T('fence-street', 'ידע', 'גדר לרחוב: שני שליש בנוי, שליש קל', 'גדר של בית צמוד קרקע, הפונה אל המרחב הציבורי, לפי סעיף 1.2.1.', [
    { style: 'poster', title: SCENE['fence-street'].title, text: `עד **${m(P('B1.2.1-2', 'fence_height_max'))}** ממפלס הרחוב.`, ...img('fence-street') },
    quote(id),
    { style: 'insight', title: 'שני שליש מסד, שליש חומר קל', text: `==לפחות ${pct(P(id, 'fence_light_perforation_min'))} חירור== בחלק הקל, והגובה עד ${m(P('B1.2.1-2', 'fence_height_max'))}.` },
    { style: 'fromto', title: 'גמר הגדר: מה יוצא ומה נכנס', fromLabel: 'לא יותר', toLabel: 'מותר', from: 'מסד ללא גמר. פלסטיק, במבוק, נצרים או יריעות.', to: 'שליכט, בטון אדריכלי, אבן, לבני סיליקט. אלומיניום, פלדה, משרביות, גדר חיה.', text: 'סעיפים 1.2.2 (2) ו-(3), פרק ב\'.' },
    { style: 'essay', title: 'מה עוד נקבע לגדר', text: SCENE['fence-street'].title, body: [clip(text('B1.2.1-2'), 200), clip(text('B1.2.4-1'), 200)] },
    haiku(['שני שליש אבן', 'שליש של אור ורוח', 'הרחוב עובר'], 'הגדר כחלוקה: **מסד בנוי** ו**חלק קל** מחורר.'),
  ]));
}

// 2. ידע: מרחק בין בניינים
{
  const id = 'B2.4.2';
  topics.push(T('building-spacing', 'ידע', `${P(id, 'building_spacing_min_upto14')} או ${P(id, 'building_spacing_min_15plus')} מטר בין בניינים`, 'מרחק בין בניינים באותו המגרש, לפי מספר הקומות. סעיף 2.4.2 בפרק ב\'.', [
    { style: 'poster', title: SCENE['building-spacing'].title, text: `**${m(P(id, 'building_spacing_min_upto14'))}** עד ${P(id, 'building_spacing_lower_floors_max')} קומות, **${m(P(id, 'building_spacing_min_15plus'))}** מ-15 קומות.`, ...img('building-spacing') },
    quote(id, 320),
    { style: 'insight', title: 'חלון מול חלון רק במרווח רחב', text: `==מעל ${m(P('B2.4.3', 'window_to_window_min'))}== בין המבנים (${who('B2.4.3')}).` },
    { style: 'fromto', title: 'כשהבניין עולה, המרווח גדל', fromLabel: `עד ${P(id, 'building_spacing_lower_floors_max')} קומות`, toLabel: '15 קומות ומעלה', from: `לא פחות מ-${m(P(id, 'building_spacing_min_upto14'))}.`, to: `לא פחות מ-${m(P(id, 'building_spacing_min_15plus'))}.`, text: `הקטנה של עד ${pct(P(id, 'building_spacing_reduction_max'))}, רק עם פתרונות להצללה, לרוחות ולהפניית פתחים.` },
    haiku(['שני מגדלים', 'ביניהם רוח ואור', 'ומבט רחוק'], 'המרווח בין בניינים נקבע **במטרים** ונמדד **בקומות**.'),
  ]));
}

// 3. הבנה: גגון וסוכך, פטור מול היתר
{
  topics.push(T('awning', 'הבנה', 'גגון: להטיל צל, לא להוסיף חדר', 'מה מותר בגגון ובסוכך, ואיך נבדל הפטור מהיתר מהבקשה להיתר.', [
    { style: 'poster', title: SCENE.awning.title, text: `עד **${Math.round(P('B2.7.2-2', 'awning_side_overhang_max') * 100)} ס"מ** מכל צד של הפתח, ובגג נסיגה של **${m(P('B2.7.2-5', 'roof_awning_setback_min'))}** לפחות.`, ...img('awning') },
    quote('B2.7.2-1'),
    { style: 'fromto', title: 'רוחב הגגון בשני הפרקים', fromLabel: "פרק א', פטור (3.1.5)", toLabel: "פרק ב', היתר (2.7.2)", from: sentences(text('A3.1.5'))[0], to: clip(text('B2.7.2-2'), 90), text: 'הערת בחינה במדריך: בפתח רחב שני הכללים נותנים תוצאות שונות.' },
    { style: 'insight', title: 'הגגון מצל, הוא לא נסגר', text: `==לא תותר סגירת דפנות== הסוכך או הגגון (${who('B2.7.2-1')}).` },
    haiku(['פס של צל', 'מעל הדלת הפתוחה', 'בלי קיר אחד'], 'הגגון קיים כדי **להטיל צל**, לא כדי **להרחיב את המבנה**.'),
  ]));
}

// 4. הבנה: הצללת מרחב הפיתוח
{
  const id = 'B2.2.2-1';
  const times = P(id, 'shade_check_times');
  topics.push(T('shading', 'הבנה', 'שלוש שעות ביוני קובעות את הצל', 'הצללת מרחב הפיתוח הפרטי, כפי שמוצגת בנספח הפיתוח של הבקשה להיתר.', [
    { style: 'poster', title: SCENE['shading-coverage'].title, text: `נבדק ביוני: **${times.join(', ')}**.`, ...img('shading-coverage') },
    quote(id, 360),
    { style: 'insight', title: `${pct(P(id, 'shade_seating'))} לספסל, ${pct(P(id, 'shade_stay_areas'))} לשהייה, ${pct(P(id, 'shade_open_space'))} למגרש`, text: `==גובה אלמנט ההצללה לפחות ${m(P('B2.2.2-2', 'shade_element_height_min'))}== נטו, כדי לאפשר אוורור טבעי.` },
    { style: 'post', title: 'כמה צל צריך מגרש', text: [`ספסלים ומתקני ישיבה: ${pct(P(id, 'shade_seating'))} הצללה.`, `שטחי שהייה לדיירים: לפחות ${pct(P(id, 'shade_stay_areas'))}.`, `כלל מרחב הפיתוח הפרטי: ${pct(P(id, 'shade_open_space'))}.`, `בדיקה ביוני, בשעות ${times.join(', ')}.`].join('\n'), tags: ['הנחיות_מרחביות', 'אשדוד', 'הצללה'] },
    haiku(['עשר, שתים עשרה', 'שלוש אחר הצהריים', 'הספסל בצל'], 'הצל נמדד **בשלוש שעות** של יום יוני אחד.'),
  ]));
}

// 5. הבנה: חזית פעילה מסחרית
{
  const id = 'B2.3.5-4';
  topics.push(T('active-frontage', 'הבנה', 'חזית פעילה: חלון ראווה לכל הרחוב', 'מבנה עם מסחר בקומת הקרקע, כחלק מרצף הרחוב. סעיף 2.3.5 בפרק ב\'.', [
    { style: 'poster', title: SCENE['active-frontage'].title, text: `לפחות **${pct(P(id, 'commercial_transparency_min'))}** מהחזית שקופה.`, ...img('active-frontage') },
    quote('B2.3.5-1'),
    { style: 'insight', title: 'רחוב אחד, לא אוסף חזיתות', text: '==לא תותר חלוקה עיצובית של החזית== לצורך ייחוד בתי עסק.' },
    { style: 'fromto', title: 'מחזית מפוצלת אל רצף אחד', fromLabel: 'לא תותר', toLabel: 'נדרש', from: 'פסאז\'ים, וחלוקה עיצובית של החזית לפי בית עסק.', to: 'חתך אחיד לאורך הרחוב: גובה קומה, קולונדה, גגונים ושילוט.', text: 'סעיפים 2.3.5 (1) ו-(3), פרק ב\'.' },
    { style: 'essay', title: 'קומת הקרקע של הרחוב', text: SCENE['active-frontage'].title, body: [text('B2.3.5-2'), clip(text('B2.3.4'), 260)] },
  ]));
}

// 6. יישום: חזית ראשית פתוחה לרחוב
{
  topics.push(T('open-frontage', 'יישום', 'בלי גדר בין הבניין לרחוב', 'מרחב הפיתוח שלמרגלות הבניין פוגש את המדרכה, פתוח בכל שעות היממה.', [
    { style: 'poster', title: SCENE['open-frontage'].title, text: 'פתוח ונגיש לציבור **בכל שעות היממה**.', ...img('open-frontage') },
    quote('B2.2.1-2', 260),
    { style: 'insight', title: 'המדרכה ממשיכה עד הכניסה', text: '==מפלס החזית הפעילה כמפלס המדרכה==, מתוכנן כמקשה אחת עמה.' },
    { style: 'post', title: 'מה מחר בבוקר בחזית', text: ['בלי גדר ובלי חציצה מול הרחוב.', 'גישה נוחה, ישירה ונגישה להולך הרגל.', 'ספסלים ומתקני ישיבה בנויים, ביחידות נפרדות.', 'פינות ישיבה, אשפתונים, גינון ועצי צל.'].join('\n'), tags: ['הנחיות_מרחביות', 'אשדוד', 'מרחב_ציבורי'] },
    haiku(['אין שער, אין סף', 'המדרכה נכנסת', 'עד דלת הבית'], 'בחזית הראשית **אין גדר**, והרחוב ממשיך עד הכניסה.'),
  ]));
}

// 7. יישום: עצים, גינון ושטח משותף
{
  const id = 'B2.2.4-15';
  topics.push(T('green', 'יישום', `עץ בוגר על כל ${P(id, 'trees_per_perpendicular_spaces')} חניות`, 'הירוק במגרש: עצים בחניה העילית, רצועת גינון בגבול ושטח מגונן משותף.', [
    { style: 'poster', title: SCENE['parking-trees'].title, text: `עץ על כל **${P(id, 'trees_per_perpendicular_spaces')}** חניות, או **${P(id, 'trees_per_parallel_spaces')}** חניות מקבילות.`, ...img('parking-trees') },
    quote(id),
    { style: 'insight', title: 'רבע מהמגרש לכל הדיירים', text: `==לפחות ${pct(P('B2.2.1-11', 'common_green_ratio_min'))} משטח המגרש== כשטח מגונן משותף, בלי גינות פרטיות וחניות.` },
    { style: 'post', title: 'שלושה צעדים ירוקים במגרש', text: [`עץ בוגר על כל ${P(id, 'trees_per_perpendicular_spaces')} מקומות חניה.`, `רצועת גינון ברוחב ${m(P('B2.2.1-10', 'planting_strip_width'))} בגבולות המגרש.`, `${pct(P('B2.2.1-11', 'common_green_ratio_min'))} מהמגרש מגונן ומשותף.`, `${P('B2.2.1-11', 'common_green_near_lobby')} מ"ר מתוכו ליד הלובי, אל הרחוב.`].join('\n'), tags: ['הנחיות_מרחביות', 'אשדוד', 'עצים'] },
    haiku(['ארבע מכוניות', 'ועץ אחד ביניהן', 'צל על המכסה'], `עץ בוגר **על כל ${P(id, 'trees_per_perpendicular_spaces')} חניות** בחניה עילית.`),
  ]));
}

// 8. יישום: מה בונים בחצר בלי היתר (פרק א')
{
  const id = 'A7.1.2';
  topics.push(T('exempt-yard', 'יישום', 'מה בונים בחצר בלי היתר', "פרק א': עבודות פטורות מהיתר בניה, וגבולות המידה שלהן.", [
    { style: 'poster', title: SCENE['exempt-pergola'].title, text: `עד **${P('A3.2.3', 'exempt_pergola_area_max_abs')} מ"ר** או רבע מהשטח הפנוי, לפי הגדול.`, ...img('exempt-pergola') },
    quote(id),
    { style: 'fromto', title: 'גדר בפטור מול גדר לרחוב', fromLabel: "פטור, פרק א' 2.1.1", toLabel: "היתר, פרק ב' 1.2.1", from: `עד ${m(P('A2.1.1', 'exempt_fence_height_max'))}, ולא בחזית הפונה לרחוב.`, to: `גדר לרחוב עד ${m(P('B1.2.1-2', 'fence_height_max'))} ממפלס הרחוב.`, text: 'הגדר שפונה לרחוב אינה בפטור (סעיף 2.1.3 בפרק א\').' },
    { style: 'post', title: 'רשימת הפטור לחצר', text: [`מחסן: עד ${P(id, 'exempt_shed_area_max')} מ"ר וגובה ${m(P(id, 'exempt_shed_height_max'))}.`, `מצללה: לפחות ${pct(P('A3.2.1', 'exempt_pergola_open_ratio_min'))} מרווחים פתוחים.`, `גדר בתוך המגרש: עד ${m(P('A2.1.7', 'exempt_inner_fence_height_max'))}.`, `כבש: הפרש גובה עד ${m(P('A11.2', 'exempt_ramp_rise_max'))}, שיפוע עד ${pct(P('A11.2.2', 'exempt_ramp_slope_max'))}.`].join('\n'), tags: ['פטור_מהיתר', 'אשדוד', 'חצר'] },
    { style: 'insight', title: 'הפטור נעצר בקו הרחוב', text: '==מחסן לא ימוקם בחזית קדמית== הפונה לרחוב או לשטח ציבורי (סעיף 7.1.3).' },
  ]));
}

// המאגר: כל סצנה שלא שימשה כנושא, עם ההמחשה שלה, הנוסח והסעיפים
const usedScenes = new Set(['fence-street', 'building-spacing', 'awning', 'shading-coverage', 'active-frontage', 'open-frontage', 'parking-trees', 'exempt-pergola']);
const zoneOf = (s) => (s.id.startsWith('exempt') ? 'יישום' : s.rules.some((id) => r(id).params?.length) ? 'ידע' : 'הבנה');
const pool = Object.values(SCENE).filter((s) => !usedScenes.has(s.id)).map((s) => {
  const ids = s.rules;
  const zone = zoneOf(s);
  const first = ids.find((id) => r(id).params?.length) || ids[0];
  const rest = ids.filter((id) => id !== first);
  const body = (rest.length ? rest.slice(0, 3).map((id) => clip(text(id), 200)) : sentences(text(first)).slice(1, 4));
  const c = [
    { style: 'poster', title: s.title, text: `${who(first)}.`, ...img(s.id) },
    quote(first, 260),
    { style: 'post', title: s.title, text: ids.slice(0, 6).map((id) => `${r(id).ref}: ${clip(text(id), 70).replace(/ …$/, '…')}`).join('\n'), tags: ['הנחיות_מרחביות', 'אשדוד'] },
  ];
  if (body.length) c.push({ style: 'essay', title: s.title, text: `${chap(first)}, ${ids.length} סעיפים.`, body });
  else c.push({ style: 'gradient', title: s.title, text: `${chap(first)}, ${who(first)}.` });
  return T(`scene-${s.id}`, zone, s.title, `${chap(first)} · ${SOURCE}`, c);
});

const out = {
  app: {
    id: 'hanchayit',
    name: 'הנחיות מרחביות אשדוד',
    url: 'https://hanchayit-gh.vercel.app',
    repo: 'Anat1969/Hanchayit-GH',
    description: `ההנחיות המרחביות של אשדוד (${SOURCE}), סעיף אחרי סעיף, עם ההמחשה התלת־ממדית של כל נושא. כל כתבה מצטטת את הנוסח כפי שהוא.`,
    palette: { a: '#1f4e79', b: '#c8102e', c: '#5e6770', s: '#1e6b3a', accent: '#1f4e79', marker: '#ffe14d', paper: '#ffffff', paper2: '#f4f4f4', ink: '#000000', bp: '#1f4e79', 'b-wash': '#fdf1f0', 's-wash': '#eef7f0' },
    article: { layout: 'blueprint' },
  },
  topics,
  pool,
};

// שבר כמו 2/3 ושעה כמו 10:00 מתהפכים בשורה עברית (3/2). בידוד כיווניות (LRI…PDI) שומר על הסדר בלי לשנות את הנוסח
const isolate = (x) => (typeof x === 'string' ? x.replace(/(?<![\u2066\w/:])(\d+[/:]\d+)(?![\w/:])/g, '\u2066$1\u2069') : Array.isArray(x) ? x.map(isolate) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, y]) => [k, k === 'image' ? y : isolate(y)])) : x);
out.topics = isolate(out.topics);
out.pool = isolate(out.pool);

// בדיקות התקן
const fail = [];
const words = (s) => String(s).replace(/[*=]/g, '').trim().split(/\s+/).length;
if (topics.length < 6) fail.push('פחות מ-6 נושאים');
if (new Set(topics.map((t) => t.zone)).size < 3) fail.push('חסר שלב');
for (const t of [...topics, ...pool]) {
  if (t.creations.length < 4 || t.creations.length > 6) fail.push(`${t.id}: ${t.creations.length} יצירות`);
  const st = t.creations.map((c) => c.style);
  if (new Set(st).size !== st.length) fail.push(`${t.id}: עיצוב חוזר`);
  if (words(t.title) > 8) fail.push(`${t.id}: כותרת ארוכה`);
  for (const c of t.creations) if (c.title && words(c.title) > 8) fail.push(`${t.id}/${c.style}: כותרת ארוכה "${c.title}"`);
}
if (pool.length < 20) fail.push(`מאגר קטן: ${pool.length}`);
if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
fs.writeFileSync('public/creations.json', JSON.stringify(out, null, 1) + '\n');
console.log(`creations.json: ${topics.length} נושאים, ${topics.reduce((n, t) => n + t.creations.length, 0)} יצירות, ${pool.length} במאגר`);
