import { useState } from 'react';

/**
 * לוגו העירייה, אם הקובץ קיים ב־public/ashdod-logo.png. בלי הקובץ לא מוצג דבר.
 */
export function Logo() {
  const [ok, setOk] = useState(true);
  // בתצוגה המקדימה כקובץ יחיד אין קבצים נלווים
  if (!ok || import.meta.env.MODE === 'preview-embed') return null;
  return (
    <img
      src={`${import.meta.env.BASE_URL}ashdod-logo.png`}
      alt="עיריית אשדוד"
      height={36}
      style={{ display: 'block', blockSize: 36, inlineSize: 'auto' }}
      onError={() => setOk(false)}
    />
  );
}
