import { readFileSync } from 'node:fs';
import { parseChapter, parseSynonyms } from '../src/rules/load.ts';

const chapter = JSON.parse(readFileSync('data/chapter-b.json', 'utf8'));
const synonyms = JSON.parse(readFileSync('data/synonyms.json', 'utf8'));

try {
  const c = parseChapter(chapter);
  parseSynonyms(synonyms);
  console.log(`תקין: ${c.rules.length} סעיפים, ${c.sections.length} פרקים, ${c.scenes.length} סצנות.`);
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
