import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useSyncStatus } from '../../features/progress/state/syncStatus';

const subscribeOnline = (listener: () => void) => {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
};

/**
 * One quiet line above the page when the learner's work is not reaching the cloud: either the
 * browser is offline, or progress sync failed and is being kept on this device. It says what still
 * works, so a dropped connection mid-lesson is not mistaken for lost progress. When the connection
 * comes back it confirms once and then gets out of the way.
 */
export default function ConnectionNotice() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const sync = useSyncStatus();
  const [recovered, setRecovered] = useState(false);
  // A ref, not state: updating it must not re-run the effect, or the cleanup would cancel the timer.
  const wasOffline = useRef(!online);

  useEffect(() => {
    if (!online) { wasOffline.current = true; setRecovered(false); return; }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    setRecovered(true);
    const timer = window.setTimeout(() => setRecovered(false), 4000);
    return () => window.clearTimeout(timer);
  }, [online]);

  let message: string | null = null;
  let tone: 'warn' | 'ok' = 'warn';
  if (!online) message = 'You are offline. Lessons you have opened still work, and progress is saved on this device until you reconnect.';
  else if (sync === 'local') message = 'Progress is saved on this device. Syncing with your account will retry automatically.';
  else if (recovered) { message = 'Back online.'; tone = 'ok'; }

  return (
    <div role="status" aria-live="polite" className="dw-connection" data-tone={tone} hidden={!message}>
      {message}
    </div>
  );
}
