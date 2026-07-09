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

  useEffect(() => {
    if (isStandalone()) return;

    const lastDismissed = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    const cooledDown = Date.now() - lastDismissed > DISMISS_COOLDOWN_MS;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
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
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'dismissed') dismiss();
    else setVisible(false);
    setDeferred(null);
  };

  if (!visible || installed) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:left-auto sm:w-96 z-50">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg p-4 flex items-start gap-3">
        <Logo className="w-10 h-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[var(--color-heading)] text-sm mb-0.5">Install HackerHub</div>
          <p className="text-xs text-[var(--color-text-dim)] leading-relaxed mb-3">
            Add it to your device for a full-screen, app-like experience with faster loads — your progress
            stays exactly where it is, since it already lives in this browser.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={install}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold hover:brightness-110 transition"
            >
              Install
            </button>
            <button
              onClick={dismiss}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors"
            >
              Not now
            </button>
          </div>
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
