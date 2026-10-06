import { readFileSync } from 'node:fs';
import { mergeChapters, parseChapter, parseSynonyms } from '../src/rules/load.ts';

const read = (f: string) => JSON.parse(readFileSync(f, 'utf8'));

try {
  const chapters = ['data/chapter-a.json', 'data/chapter-b.json'].map((f) => {
    const c = parseChapter(read(f));
    console.log(`${f}: ${c.rules.length} סעיפים, ${c.sections.length} פרקים, ${c.scenes.length} סצנות.`);
    return c;
  });
  mergeChapters(chapters);
  parseSynonyms(read('data/synonyms.json'));
  console.log('תקין.');
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
