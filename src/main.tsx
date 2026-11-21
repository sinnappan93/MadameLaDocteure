import '@fontsource-variable/nunito';
import '@fontsource/dancing-script/700.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// Demande au navigateur de ne pas effacer les données (fiches et images) en cas de manque d'espace.
void navigator.storage?.persist?.();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
