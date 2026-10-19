import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/layout/ErrorBoundary.tsx'
import ComputerAccessGate from './components/layout/ComputerAccessGate.tsx'
import './academy-system.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ComputerAccessGate><App /></ComputerAccessGate>
    </ErrorBoundary>
  </StrictMode>,
)

// Service worker registration is injected automatically by vite-plugin-pwa (registerType: 'autoUpdate').
