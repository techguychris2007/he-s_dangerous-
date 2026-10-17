import { useEffect, useState } from 'react';
import Logo from './Logo';

const DISMISS_KEY = 'hackerhub.installPromptDismissedAt';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // don't re-nag for a week after a dismissal

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState('');
  const [manualGuide, setManualGuide] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    let lastDismissed = 0;
    try { lastDismissed = Number(localStorage.getItem(DISMISS_KEY) ?? 0) || 0; } catch { /* Storage can be unavailable in private or restricted browsers. */ }
    const cooledDown = Date.now() - lastDismissed > DISMISS_COOLDOWN_MS;
    let nativePromptAvailable = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!nativePromptAvailable && cooledDown) {
        setManualGuide(true);
        setVisible(true);
      }
    }, 2500);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      nativePromptAvailable = true;
      window.clearTimeout(fallbackTimer);
      setManualGuide(false);
      setDeferred(e as BeforeInstallPromptEvent);
      if (cooledDown) setVisible(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* Dismissal should still work without persistent storage. */ }
    setVisible(false);
  };

  const install = async () => {
    if (!deferred || installing) return;
    setInstalling(true);
    setError('');
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'dismissed') dismiss();
      else setVisible(false);
      setDeferred(null);
    } catch {
      setError('Installation could not start. You can keep learning in this browser.');
    } finally { setInstalling(false); }
  };

  if (!visible || installed) return null;

  const userAgent = navigator.userAgent;
  const isAppleMobile = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(userAgent) && !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS/.test(userAgent);
  const isFirefox = /Firefox|FxiOS/.test(userAgent);
  const manualInstructions = isAppleMobile
    ? 'Open DarkWorld in Safari, tap Share, choose Add to Home Screen, then tap Add.'
    : isSafari
      ? 'In Safari on macOS, choose File → Add to Dock to keep DarkWorld in your Dock.'
      : isFirefox
        ? 'This browser does not offer an app-install prompt. Open DarkWorld in Safari, Chrome, or Edge and use its Add to Home Screen or Install option.'
        : 'Open your browser menu and choose Install DarkWorld, Install app, or Add to Home Screen. The exact label depends on your browser.';

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:left-auto sm:w-96 z-50">
      <div className="premium-card rounded-2xl p-4 flex items-start gap-3">
        <Logo className="w-10 h-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[var(--color-heading)] text-sm mb-0.5">{manualGuide ? 'Add DarkWorld to your device' : 'Install DarkWorld'}</div>
          <p className="text-xs text-[var(--color-text-dim)] leading-relaxed mb-3">
            {manualGuide
              ? manualInstructions
              : 'Add it to your device for a full-screen, app-like experience with faster loads. Your learning progress stays in this browser.'}
          </p>
          <div className="flex items-center gap-2">
            {!manualGuide && (
              <button
                onClick={install}
                disabled={installing}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold hover:brightness-110 transition"
              >
                {installing ? 'Opening…' : 'Install'}
              </button>
            )}
            <button
              onClick={dismiss}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors"
            >
              Not now
            </button>
          </div>
          {error && <p role="alert" className="mt-2 text-xs text-[var(--color-danger)]">{error}</p>}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-[var(--color-text-dim)] hover:text-[var(--color-heading)] text-lg leading-none shrink-0"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
