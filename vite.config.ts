import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages מגיש את האתר תחת שם הריפו
export default defineConfig({
  base: '/Hanchayit-GH/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
