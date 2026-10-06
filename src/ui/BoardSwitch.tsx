import { useEffect, useState } from 'react';
import s from './BoardSwitch.module.css';

export type Board = 'mono' | 'blue' | 'green' | 'yellow' | 'red';

const BOARDS: Array<{ id: Board; label: string }> = [
  { id: 'mono', label: 'שחור ולבן' },
  { id: 'blue', label: 'כחול' },
  { id: 'green', label: 'ירוק' },
  { id: 'yellow', label: 'צהוב' },
  { id: 'red', label: 'אדום' },
];

const KEY = 'hanchayit-board';

function stored(): Board {
  try {
    const v = localStorage.getItem(KEY);
    if (BOARDS.some((b) => b.id === v)) return v as Board;
  } catch {
    // אחסון חסום: נשארים עם ברירת המחדל
  }
  return 'mono';
}

/** לוח העיצוב הנבחר. נכתב לשורש ונשמר בדפדפן של הצופה בלבד. */
export function useBoard(): [Board, (b: Board) => void] {
  const [board, setBoard] = useState<Board>(stored);
  useEffect(() => {
    document.documentElement.dataset.board = board;
    try {
      localStorage.setItem(KEY, board);
    } catch {
      // אין צורך לשמור
    }
  }, [board]);
  return [board, setBoard];
}

/** לוח העיצוב: גוון אחד בהיר לרקע וחזק לכותרות */
export function BoardSwitch({ value, onChange }: { value: Board; onChange: (b: Board) => void }) {
  const board = value;
  const setBoard = onChange;
  return (
    <div className={s.boards} role="group" aria-label="לוח עיצוב">
      {BOARDS.map((b) => (
        <button
          key={b.id}
          type="button"
          className={s.swatch}
          data-board={b.id}
          aria-pressed={board === b.id}
          aria-label={`לוח ${b.label}`}
          title={`לוח ${b.label}`}
          onClick={() => setBoard(b.id)}
        />
      ))}
    </div>
  );
}
