import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/david-libre/hebrew-400.css';
import '@fontsource/david-libre/hebrew-700.css';
import '@fontsource/david-libre/latin-400.css';
import '@fontsource/david-libre/latin-700.css';
import '@fontsource/miriam-libre/hebrew-400.css';
import '@fontsource/miriam-libre/hebrew-700.css';
import '@fontsource/miriam-libre/latin-400.css';
import '@fontsource/miriam-libre/latin-700.css';
import './styles/tokens.css';
import './styles/print.css';
import { App } from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
