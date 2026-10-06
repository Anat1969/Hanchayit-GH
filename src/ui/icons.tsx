// אייקונים מינימליסטיים בשפה אחת: רשת 16, קו 1.5, פינות מעוגלות, צבע מהטקסט.

const PATHS = {
  fence: 'M2 14V5l1.5-2L5 5v9M7 14V5l1.5-2L10 5v9M12 14V5l1.5-2L15 5v9M1 7h15M1 11h15',
  canopy: 'M2 6l6-3 6 3M2 6h12M3 6v8M13 6v8M5 14h6',
  pergola: 'M1 4h14M3 4v10M13 4v10M5 2v4M8 2v4M11 2v4',
  tools: 'M10.5 2.5a3 3 0 0 0-3.9 3.9L2 11l3 3 4.6-4.6a3 3 0 0 0 3.9-3.9l-2 2-2-2z',
  bolt: 'M9 1L3 9h5l-1 6 6-8H8z',
  clock: 'M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM8 4.5V8l2.5 1.5',
  box: 'M2 5l6-3 6 3v6l-6 3-6-3zM2 5l6 3 6-3M8 8v6',
  shield: 'M8 1.5l5.5 2v4.5c0 3.2-2.4 5.6-5.5 6.5-3.1-.9-5.5-3.3-5.5-6.5V3.5z',
  path: 'M3 14c0-3 3-3 3-6s-3-3-3-6M10 14c0-3 3-3 3-6s-3-3-3-6',
  ramp: 'M1 13h14M3 13l9-6h3',
  antenna: 'M8 6v9M5 15h6M4.5 3.5a5 5 0 0 1 7 0M2.5 1.5a8 8 0 0 1 11 0M8 6a1 1 0 1 0 0-.01',
  demolish: 'M3 14h10M4 14V7l4-3 4 3v7M6 9l4 3M10 9l-4 3',
  house: 'M2 7.5L8 2.5l6 5M3.5 6.5V14h9V6.5M6.5 14v-4h3v4',
  building: 'M3 15V2h7v13M10 6h3v9M5 4.5h1M7 4.5h1M5 7h1M7 7h1M5 9.5h1M7 9.5h1M1.5 15h13',
  tree: 'M8 15V9M8 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 15h6',
  sun: 'M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1',
  drop: 'M8 1.5S3.5 6.5 3.5 9.5a4.5 4.5 0 0 0 9 0C12.5 6.5 8 1.5 8 1.5z',
  car: 'M2 11V8l1.5-4h9L14 8v3M2 11h12M2 11v2M14 11v2M4.5 9.5h.5M11 9.5h.5',
  door: 'M3 15V1.5h10V15M1.5 15h13M10 8.5h.5',
  layers: 'M8 2l6.5 3L8 8 1.5 5zM1.5 8L8 11l6.5-3M1.5 11L8 14l6.5-3',
  sign: 'M2 3h12v6H2zM8 9v6M5 15h6',
  waves: 'M1 6c2-1.5 3-1.5 5 0s3 1.5 5 0 2.5-1.5 4 0M1 10c2-1.5 3-1.5 5 0s3 1.5 5 0 2.5-1.5 4 0',
  office: 'M2 15V5h8v10M10 8h4v7M4 7.5h2M4 10h2M4 12.5h2M1 15h14',
  plus: 'M3 3h10v10H3zM8 5.5v5M5.5 8h5',
  info: 'M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM8 7v4.5M8 4.5v.5',
  cube: 'M8 1.5l6 3v7l-6 3-6-3v-7zM2 4.5l6 3 6-3M8 7.5v7',
  hand: 'M5 8V3.5a1 1 0 0 1 2 0V7M7 7V2.5a1 1 0 0 1 2 0V7M9 7V3.5a1 1 0 0 1 2 0V8M11 8V5.5a1 1 0 0 1 2 0V10c0 3-2 5-4.5 5S4 13.5 3 11.5L2 9a1 1 0 0 1 1.7-1L5 9.5',
  rotate: 'M13.5 8A5.5 5.5 0 1 1 11 3.4M13.5 1.5V4.5h-3',
  zoomIn: 'M7 2a5 5 0 1 0 0 10A5 5 0 0 0 7 2zM14.5 14.5L10.6 10.6M7 4.5v5M4.5 7h5',
  zoomOut: 'M7 2a5 5 0 1 0 0 10A5 5 0 0 0 7 2zM14.5 14.5L10.6 10.6M4.5 7h5',
  fit: 'M1.5 5.5v-4h4M10.5 1.5h4v4M14.5 10.5v4h-4M5.5 14.5h-4v-4',
  up: 'M3.5 10L8 5.5l4.5 4.5',
  down: 'M3.5 6L8 10.5 12.5 6',
  close: 'M4 4l8 8M12 4l-8 8',
  legend: 'M2 3.5h2M6 3.5h8M2 8h2M6 8h8M2 12.5h2M6 12.5h8',
  palette: 'M8 1.5a6.5 6.5 0 0 0 0 13c1 0 1.5-.6 1.5-1.4 0-1.2-1-1.3-1-2.3S9.3 9.5 10.5 9.5h1.3a2.7 2.7 0 0 0 2.7-2.7C14.5 3.8 11.6 1.5 8 1.5zM4.5 7.5h.5M6.5 4.5h.5M10 4.5h.5',
  person: 'M8 1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM8 6v4.5M5.5 15L8 10.5l2.5 4.5M5 7.5h6',
  search: 'M7 2a5 5 0 1 0 0 10A5 5 0 0 0 7 2zM14.5 14.5L10.6 10.6',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ flex: 'none' }}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

// אייקון לפי נושא הפרק. הסדר חשוב: ההתאמה הראשונה קובעת.
const TOPICS: Array<[RegExp, IconName]> = [
  [/תנאים כלליים|כללי|הגדרות/, 'info'],
  [/מצללה|פרגולה|אלמנטי הצללה/, 'pergola'],
  [/הצללת|הצללה/, 'sun'],
  [/גדר|גדרות|שער/, 'fence'],
  [/גגון|סככ|סוכך/, 'canopy'],
  [/מי גשמים|ניקוז/, 'drop'],
  [/חניה|תפעול|מרתפים/, 'car'],
  [/קומת הקרקע|קומת הכניסה|חזית פעילה|דירות גן/, 'door'],
  [/גוף הבניין|עיצוב מבנים/, 'building'],
  [/צמודי קרקע/, 'house'],
  [/חומרי|גמר/, 'layers'],
  [/שילוט/, 'sign'],
  [/בריכ/, 'waves'],
  [/משרדי מכירות/, 'office'],
  [/תוספות|שינויים/, 'plus'],
  [/מחסן|מבנה לשומר/, 'box'],
  [/מרחב מוגן/, 'shield'],
  [/פיתוח ונגישות|מרחב הפיתוח|פיתוח/, 'tree'],
  [/נגישות/, 'ramp'],
  [/אנטנ|צלחות|תורן|עירוב/, 'antenna'],
  [/הריסה|פירוק/, 'demolish'],
  [/טכני|חשמל|גז|פוטו|באר|אגירה|ניטור/, 'bolt'],
  [/זמני|עונתית|חקלאית/, 'clock'],
  [/שימושים נלווים|פרטי עזר|מזגן|דוד|סורגים|רכיבים|אשפה|משקה/, 'tools'],
  [/מטרדים/, 'shield'],
];

export function topicIcon(title: string): IconName {
  return TOPICS.find(([re]) => re.test(title))?.[1] ?? 'info';
}
