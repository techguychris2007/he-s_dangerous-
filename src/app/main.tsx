import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Ubuntu / Ubuntu Mono, self-hosted so they are precached for offline use (no third-party font request).
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-400-italic.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-sans/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import './styles/index.css'
import App from './App.tsx'
import ErrorBoundary from './guards/ErrorBoundary.tsx'
import ComputerAccessGate from './guards/ComputerAccessGate.tsx'
import './styles/academy-system.css';
import { startPwa } from '../features/offline/state/pwa';
import { applyInitialTheme } from '../shared/state/theme';
import { startMonitoring } from '../shared/lib/monitoring';
import { recoverFromStaleBuilds } from './staleBuildRecovery';

applyInitialTheme();
startPwa();
// A tab left open across a deploy reloads once to pick up the new build instead of erroring.
recoverFromStaleBuilds();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ComputerAccessGate><App /></ComputerAccessGate>
    </ErrorBoundary>
  </StrictMode>,
)

// Error reporting loads after the first render so it never delays a lesson.
void startMonitoring();

// The app registers its service worker explicitly and offers updates when learners are ready.
