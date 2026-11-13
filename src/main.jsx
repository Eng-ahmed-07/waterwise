import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted font (no third-party request). Only the weights the design uses.
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';

import './styles/index.css';
import App from './app/App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
