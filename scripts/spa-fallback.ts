// GitHub Pages מחזיר 404.html לכל כתובת שאינה קובץ. העתק של index.html מאפשר לפתוח /rule/:id ישירות.
import { copyFileSync } from 'node:fs';

copyFileSync('dist/index.html', 'dist/404.html');
