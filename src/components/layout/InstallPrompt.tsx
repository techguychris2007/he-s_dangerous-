import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../state/authStore';
import { applyAppUpdate, installApp, usePwa } from '../../state/pwa';
import OfflineRuntimeCard from './OfflineRuntimeCard';
import InstallAppButton from './InstallAppButton';
import Logo from './Logo';
import './app-install.css';

export default function InstallPrompt() {
  const pwa = usePwa();
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const show = () => setOpen(true);
    const network = () => setOnline(navigator.onLine);
    window.addEventListener('darkworld:app-settings', show);
    window.addEventListener('online', network); window.addEventListener('offline', network);
    return () => { window.removeEventListener('darkworld:app-settings', show); window.removeEventListener('online', network); window.removeEventListener('offline', network); };
  }, []);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  const safari = /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|OPR/.test(navigator.userAgent);
  const firefox = /Firefox/.test(navigator.userAgent);
  return <>
    {!auth.user && <div className="dw-entry-install"><InstallAppButton/></div>}
    <dialog ref={dialog} className="dw-app-dialog" aria-labelledby="dw-app-title" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <header><Logo className="h-12 w-12"/><div><p>YOUR DESKTOP WORKSPACE</p><h2 id="dw-app-title">DarkWorld, ready when you are.</h2></div><button type="button" aria-label="Close app and offline settings" onClick={() => setOpen(false)}>×</button></header>
      <div className="dw-app-content">
        <section className="dw-app-install-section"><h3>{pwa.installed ? 'You’re using the desktop app' : 'Install DarkWorld'}</h3><p>Keep DarkWorld in its own window and open it from your desktop or app launcher. Installation is handled by your browser; no separate installer is needed.</p>
          {pwa.installable && <button type="button" className="dw-app-primary" disabled={busy} onClick={async () => { setBusy(true); try { await installApp(); } finally { setBusy(false); } }}>{busy ? 'Opening installer…' : 'Install desktop app'}</button>}
          {!pwa.installable && !pwa.installed && <p className="dw-app-instructions">{safari ? 'Safari on Mac: open File → Add to Dock.' : firefox ? 'For installation, open this address in Chrome or Edge and choose the install option in the address bar or browser menu. You can continue learning in Firefox.' : 'Chrome: open the browser menu → Cast, save and share → Install page as app. Edge: open the browser menu → Apps → Install this site as an app. If already installed, open DarkWorld from your apps.'}</p>}
        </section>
        <section className="dw-app-offline-section"><div className="dw-app-status"><h3>Offline learning</h3><span>{!online ? 'Offline' : pwa.offlineReady ? 'App saved on this device' : import.meta.env.DEV ? 'Development preview' : 'Preparing app files…'}</span></div>
          <p>{import.meta.env.DEV ? 'Installation and offline caching are tested in the built app or deployed site, not this development preview.' : pwa.offlineReady ? 'Lessons, browser-based security labs and JavaScript/C++ exercises are saved for offline use. Stay signed in before disconnecting.' : 'Keep this page open and connected while DarkWorld saves its app files. Once ready, you can reopen it without internet.'}</p>
          <p>Save books individually in the Library. Prepare Python below before disconnecting. Sign-in, cloud sync, AI help, live rankings and external websites need internet. This browser’s local labs do not run a remote Kali machine.</p>
          <OfflineRuntimeCard/>
        </section>
        {pwa.updateAvailable && <section className="dw-app-update"><h3>A new version is ready</h3><p>Finish your current task before updating. This reloads DarkWorld.</p><button type="button" className="dw-app-primary" onClick={() => { void applyAppUpdate(); }}>Update and reload</button></section>}
        {pwa.error && <p role="alert" className="dw-app-error">{pwa.error}</p>}
      </div>
    </dialog>
  </>;
}
