import { prepareOfflinePythonRuntime, PYODIDE_BASE_URL, PYODIDE_CACHE_NAME } from './pyodideRunner';
import { hasOfflinePythonFiles } from './offlineRuntime';

export async function isCodingPrepared(): Promise<boolean> {
  if (!('caches' in globalThis)) return false;
  try {
    const cache = await caches.open(PYODIDE_CACHE_NAME);
    const keys = await cache.keys();
    const manifest = await cache.match(PYODIDE_BASE_URL + 'pyodide-lock.json');
    return hasOfflinePythonFiles(keys.map(request => request.url), PYODIDE_BASE_URL, manifest ? await manifest.json() : null);
  } catch { return false; }
}
export async function requireOfflineApp(): Promise<void> {
  if (!('serviceWorker' in navigator)) throw new Error('This browser does not support offline app storage.');
  if (navigator.serviceWorker.controller) return;
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Open the deployed site or built local preview while online, then reload once before preparing offline learning.')), 12000);
    void navigator.serviceWorker.ready.then(() => { clearTimeout(timeout); resolve(); }, error => { clearTimeout(timeout); reject(error); });
  });
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>(resolve => {
      const finish = () => { clearTimeout(timeout); navigator.serviceWorker.removeEventListener('controllerchange', finish); resolve(); };
      const timeout = setTimeout(finish, 4000);
      navigator.serviceWorker.addEventListener('controllerchange', finish, { once: true });
    });
  }
  if (!navigator.serviceWorker.controller) throw new Error('Reload the app once while connected, then prepare again.');
}
export async function prepareCoding(): Promise<void> {
  if (await isCodingPrepared()) return;
  await prepareOfflinePythonRuntime();
  for (let attempt = 0; attempt < 8; attempt++) {
    if (await isCodingPrepared()) return;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Python ran, but its complete offline files were not confirmed. Reload while online and retry.');
}
