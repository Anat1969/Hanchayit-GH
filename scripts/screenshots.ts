// צילומי מסך של כל סצנה בשלוש התצוגות, להשוואה מול DESIGN.md לפני שמסמנים סצנה כגמורה.
// שימוש: npm run build && npx vite preview --port 4173 & npm run screenshots
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/Hanchayit-GH';
const OUT = 'test-results/scenes';
// לכל סצנה: הסעיף הראשון שמפנה אליה, או סצנות מסוימות מהארגומנטים
const chapter = JSON.parse(readFileSync('data/chapter-b.json', 'utf8')) as { rules: Array<{ id: string; scene?: string; params?: unknown[] }> };
const RULES: Record<string, string> = {};
for (const r of chapter.rules) {
  const scene = r.scene;
  if (!scene) continue;
  // עדיפות לסעיף עם פרמטרים
  const current = chapter.rules.find((x) => x.id === RULES[scene]);
  if (!current || (r.params && !current.params)) RULES[scene] = r.id;
}
const only = process.argv.slice(2);
for (const k of Object.keys(RULES)) if (only.length && !only.includes(k)) delete RULES[k];
const VIEWS = { axo: 'אקסונומטריה', plan: 'תכנית', section: 'חתך' };

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));

for (const [scene, rule] of Object.entries(RULES)) {
  await page.goto(`${BASE}/rule/${rule}`);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1000);
  for (const [view, label] of Object.entries(VIEWS)) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.waitForTimeout(600);
    await page.locator('section[aria-label="גיליון"]').screenshot({ path: `${OUT}/${scene}-${view}.png` });
  }
}
await browser.close();
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`צילומים נשמרו ב־${OUT}`);
