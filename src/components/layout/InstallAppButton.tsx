import { openAppInstall, usePwa } from '../../state/pwa';
import { IconDownload } from './icons';

export default function InstallAppButton() {
  const pwa = usePwa();
  return <button type="button" onClick={openAppInstall} className="dw-app-button" aria-haspopup="dialog"><IconDownload className="h-4 w-4"/><span>App & offline</span>{pwa.updateAvailable && <span className="dw-app-update-dot" aria-label="Update available"/>}</button>;
}
