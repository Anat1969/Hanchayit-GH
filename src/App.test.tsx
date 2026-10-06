import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from './App.tsx';
import { chapter } from './data.ts';
import { appliesTo } from './rules/derive.ts';

afterEach(() => {
  cleanup();
  history.replaceState(null, '', '/');
});

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
});

describe('המדריך', () => {
  it('מציג את כל הסעיפים של שני הפרקים', () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('[data-rule]')).toHaveLength(279 + 146);
    expect(screen.getByRole('navigation', { name: 'תוכן עניינים' })).toBeTruthy();
  });

  it('בורר סוג מבנה מסנן את הסעיפים', () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'תעשייה' }));
    const shown = [...container.querySelectorAll('[data-rule]')].map((e) => e.getAttribute('data-rule'));
    expect(shown).not.toContain('B1.2.1-2');
    expect(shown).toContain('B2.2.1-3a');
  });

  it('ערך מקושר מסומן בריחוף', () => {
    const { container } = render(<App />);
    const v = container.querySelector('[data-rule="B1.2.1-2"] [data-param="fence_height_max"]')!;
    expect(v.textContent).toBe('1.8 מ\'');
    fireEvent.mouseEnter(v);
    expect(v.hasAttribute('data-active')).toBe(true);
  });

  it('חיפוש מציג תוצאות ברשימה', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'פרגולה' } });
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
  });

  it('אין תוצאות', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'קסילופון' } });
    expect(screen.getByRole('status').textContent).toContain("לא נמצא סעיף עבור 'קסילופון'");
  });
});

describe('נאמנות לנתונים', () => {
  it('אין בממשק אפשרות לשנות ערכים, והערך בנוסח הוא הערך בנתונים', () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('input[type="range"]')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'מצב בחינה' })).toBeNull();
    const v = container.querySelector('[data-rule="B1.2.1-2"] [data-param="fence_height_max"]')!;
    expect(v.textContent).toBe("1.8\u00a0מ'");
  });
});

describe('סעיפים שמעמדם בספק', () => {
  it('כל סעיף עם הערת בדיקה מסומן בנוסח, ותוקף בספק מסומן גם בתוכן העניינים', () => {
    const { container } = render(<App />);
    const marked = [...container.querySelectorAll('[data-rule][data-doubt]')].map((e) => e.getAttribute('data-rule'));
    const expected = chapter.rules.filter((r) => r.review && appliesTo(r, 'all')).map((r) => r.id);
    expect(marked.sort()).toEqual(expected.sort());
    const a8 = container.querySelector('[data-rule="A8"]')!;
    expect(a8.getAttribute('data-doubt')).toBe('validity');
    expect(a8.textContent).toContain('תוקף הסעיף בספק');
    expect(a8.textContent).toContain('יש לוודא אם הוארכה');
    expect(container.querySelector('[data-rule="B2.11.7"]')!.textContent).toContain('לבחינה');
    expect(screen.getAllByTitle('תוקף הסעיף בספק').length).toBeGreaterThanOrEqual(3);
  });
});
