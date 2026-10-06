import { describe, expect, it } from 'vitest';
import { snippet } from './snippet.ts';

const marked = (parts: ReturnType<typeof snippet>) => parts.filter((p) => p.match).map((p) => p.text);

describe('snippet', () => {
  it('מסמן את המילה כפי שהוקלדה, כולל עם תחילית', () => {
    expect(marked(snippet('גמר המצללה והצללה נוספת', ['מצללה'], ['מצללה', 'צללה']))).toEqual(['המצללה']);
  });
  it('כשאין התאמה מדויקת, מסמן לפי הצורה בלי תחילית', () => {
    expect(marked(snippet('גובה הגדר לא יעלה', ['בגדר'], ['גדר']))).toEqual(['הגדר']);
  });
  it('קטע ארוך נחתך עם שלוש נקודות', () => {
    const text = 'מילה '.repeat(60) + 'גדר ' + 'מילה '.repeat(60);
    const parts = snippet(text, ['גדר'], ['גדר']);
    expect(parts[0].text).toBe('…');
    expect(parts.at(-1)!.text).toBe('…');
  });
});
