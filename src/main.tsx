import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Ubuntu / Ubuntu Mono, self-hosted so they are precached for offline use (no third-party font request).
import '@fontsource/ubuntu/400.css'
import '@fontsource/ubuntu/500.css'
import '@fontsource/ubuntu/700.css'
import '@fontsource/ubuntu/400-italic.css'
import '@fontsource/ubuntu-mono/400.css'
import '@fontsource/ubuntu-mono/700.css'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/layout/ErrorBoundary.tsx'
import ComputerAccessGate from './components/layout/ComputerAccessGate.tsx'
import './academy-system.css';
import { startPwa } from './state/pwa';
import { applyInitialTheme } from './state/theme';
import { startMonitoring } from './lib/monitoring';
import { recoverFromStaleBuilds } from './lib/staleBuildRecovery';

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
