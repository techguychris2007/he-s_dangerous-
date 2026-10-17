import { useEffect, useState } from 'react';
import { IconCheck, IconDownload, IconLightning } from './icons';
import {
  prepareOfflinePythonRuntime,
  PYODIDE_BASE_URL,
  PYODIDE_CACHE_NAME,
  PYODIDE_VERSION,
} from '../../lib/pyodideRunner';

const READY_KEY = 'darkworld.offline.python.' + PYODIDE_VERSION;

type RuntimeStatus = 'checking' | 'idle' | 'preparing' | 'ready' | 'error';

async function isRuntimeCached(): Promise<boolean> {
  if (!('caches' in window)) return false;
  try {
    const prepared = localStorage.getItem(READY_KEY) === 'true';
    if (!prepared) return false;
    const cache = await caches.open(PYODIDE_CACHE_NAME);
    const keys = await cache.keys();
    const hasLoader = keys.some((request) => request.url === PYODIDE_BASE_URL + 'pyodide.js');
    const hasNumpy = keys.some((request) => new URL(request.url).pathname.includes('numpy-'));
    const hasPandas = keys.some((request) => new URL(request.url).pathname.includes('pandas-'));
    return hasLoader && hasNumpy && hasPandas;
  } catch {
    return false;
  }
}

async function waitForServiceWorkerControl(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('This browser does not support offline app storage.');
  }
  await navigator.serviceWorker.ready;
  if (navigator.serviceWorker.controller) return;

  await new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener('controllerchange', finish);
      resolve();
    };
    const timeout = window.setTimeout(finish, 4000);
    navigator.serviceWorker.addEventListener('controllerchange', finish, { once: true });
  });
  if (!navigator.serviceWorker.controller) {
    throw new Error('The offline app cache is still starting. Reload DarkWorld once while online, then prepare again.');
  }
}

export default function OfflineRuntimeCard() {
  const [status, setStatus] = useState<RuntimeStatus>('checking');
  const [online, setOnline] = useState(() => navigator.onLine);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const updateNetwork = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    void isRuntimeCached().then((ready) => {
      if (active) setStatus(ready ? 'ready' : 'idle');
    });
    return () => {
      active = false;
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
    };
  }, []);

  const prepare = async () => {
    if (!online || status === 'preparing') return;
    setStatus('preparing');
    setMessage('');
    try {
      await waitForServiceWorkerControl();
      try {
        await navigator.storage?.persist?.();
      } catch {
        // Persistent storage is a browser preference; preparation can still succeed without it.
      }
      await prepareOfflinePythonRuntime();
      const ready = await isRuntimeCachedAfterPreparation();
      if (!ready) {
        throw new Error('Python ran, but its offline files were not confirmed in the app cache. Reload while online and try once more.');
      }
      try {
        localStorage.setItem(READY_KEY, 'true');
      } catch {
        // The current session is prepared even if browser storage settings prevent a readiness marker.
      }
      setStatus('ready');
      setMessage('Python, NumPy, and pandas are ready for offline coding on this device.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Could not prepare the Python runtime.');
    }
  };

  return (
    <section
      aria-labelledby="offline-runtime-title"
      className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            {status === 'ready' ? <IconCheck className="h-5 w-5" /> : <IconLightning className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <h2 id="offline-runtime-title" className="text-sm font-bold text-[var(--color-heading)]">
              Offline coding readiness
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-dim)]">
              JavaScript and C++ run from the installed app. Prepare Python once while connected to cache its
              WebAssembly runtime and the NumPy and pandas packages used in DarkWorld exercises.
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-dim)]">
              Lessons, local progress, browser-based labs, and saved books remain on this device. Account sync,
              AI help, leaderboards, and external sites need internet.
            </p>
            {message && (
              <p
                role={status === 'error' ? 'alert' : 'status'}
                aria-live="polite"
                className={'mt-2 text-xs font-semibold ' + (status === 'error' ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]')}
              >
                {message}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span className={'text-xs font-semibold ' + (status === 'ready' ? 'text-[var(--color-success)]' : 'text-[var(--color-text-dim)]')}>
            {status === 'checking' ? 'Checking this device…' : status === 'ready' ? 'Python prepared' : online ? 'Online preparation available' : 'Connect once to prepare'}
          </span>
          <button
            type="button"
            onClick={prepare}
            disabled={!online || status === 'preparing' || status === 'checking'}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-bold text-white transition hover:bg-[var(--color-accent-dim)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {status === 'ready' ? <IconCheck className="h-4 w-4" /> : <IconDownload className="h-4 w-4" />}
            {status === 'preparing' ? 'Preparing Python…' : status === 'ready' ? 'Prepare again' : 'Prepare for offline'}
          </button>
        </div>
      </div>
    </section>
  );
}

async function isRuntimeCachedAfterPreparation(): Promise<boolean> {
  if (!('caches' in window)) return false;
  try {
    const cache = await caches.open(PYODIDE_CACHE_NAME);
    const keys = await cache.keys();
    return keys.some((request) => request.url === PYODIDE_BASE_URL + 'pyodide.js')
      && keys.some((request) => new URL(request.url).pathname.includes('numpy-'))
      && keys.some((request) => new URL(request.url).pathname.includes('pandas-'));
  } catch {
    return false;
  }
}
