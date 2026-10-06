// צילומי מסך של כל סצנה בשלוש התצוגות, להשוואה מול DESIGN.md לפני שמסמנים סצנה כגמורה.
// שימוש: npm run build && npx vite preview --port 4173 & npm run screenshots
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/Hanchayit-GH';
const OUT = 'test-results/scenes';
// סעיף מייצג לכל סצנה שנבנתה
const RULES: Record<string, string> = {
  'fence-street': 'B1.2.1-2',
  'retaining-terrace': 'B2.2.1-6',
  'pergola-ground': 'B2.7.1-6',
  'building-spacing': 'B2.4.2',
  'ground-floor-height': 'B2.3.4',
};
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
