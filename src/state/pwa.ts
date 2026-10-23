import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
type PwaState = { installable: boolean; installed: boolean; offlineReady: boolean; updateAvailable: boolean; error: string };
let state: PwaState = { installable: false, installed: false, offlineReady: false, updateAvailable: false, error: '' };
const listeners = new Set<() => void>();
let deferred: InstallEvent | null = null;
let started = false;
let update: ((reload?: boolean) => Promise<void>) | undefined;
function patch(value: Partial<PwaState>) { state = { ...state, ...value }; listeners.forEach(listener => listener()); }
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function usePwa() { return useSyncExternalStore(subscribe, () => state); }
export function openAppInstall() { window.dispatchEvent(new Event('darkworld:app-settings')); }
export async function installApp(): Promise<void> {
  const event = deferred;
  if (!event) return;
  deferred = null;
  patch({ installable: false, error: '' });
  try { await event.prompt(); await event.userChoice; }
  catch { patch({ error: 'The browser could not open installation. Use the install option in its menu, or try again in Chrome or Edge.' }); }
}
export async function applyAppUpdate() {
  try { await update?.(true); }
  catch { patch({ error: 'The update could not be applied. Finish your work, reconnect, and reload DarkWorld.' }); }
}
export function startPwa() {
  if (started) return;
  started = true;
  const display = matchMedia('(display-mode: standalone)');
  patch({ installed: display.matches });
  display.addEventListener('change', () => patch({ installed: display.matches }));
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferred = event as InstallEvent; patch({ installable: true }); });
  window.addEventListener('appinstalled', () => { deferred = null; patch({ installed: true, installable: false }); });
  if (import.meta.env.DEV) return;
  update = registerSW({
    immediate: true,
    onNeedRefresh: () => patch({ updateAvailable: true }),
    onOfflineReady: () => patch({ offlineReady: true, error: '' }),
    onRegisteredSW: (_url, registration) => {
      if (registration?.active) void caches.match(new URL('index.html', import.meta.env.BASE_URL.startsWith('/') ? location.origin + import.meta.env.BASE_URL : location.href).href, { ignoreSearch: true }).then(response => patch({ offlineReady: Boolean(response) })).catch(() => {});
    },
    onRegisterError: () => patch({ error: 'Offline storage could not start. Reconnect and reload DarkWorld; also check that this browser allows site storage.' }),
  });
}
