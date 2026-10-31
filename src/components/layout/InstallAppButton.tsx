import { openAppInstall, usePwa } from '../../state/pwa';
import { IconDownload } from './icons';
import AppUpdateSymbol from './AppUpdateSymbol';

export default function InstallAppButton({ navigation = false }: { navigation?: boolean }) {
  const pwa = usePwa();
  if (navigation) return <button type="button" onClick={openAppInstall} className="learning-navigation__app" aria-label={pwa.updateAvailable ? 'Update ready — app and offline settings' : 'App and offline preparation'} aria-haspopup="dialog" title={pwa.updateAvailable ? 'Update ready' : 'App & offline'}><span className="learning-navigation__symbol"><AppUpdateSymbol/></span><span>{pwa.updateAvailable ? 'Update ready' : 'App & offline'}</span>{pwa.updateAvailable && <span className="learning-navigation__update-dot" aria-hidden="true"/>}</button>;
  return <button type="button" onClick={openAppInstall} className="dw-app-button" aria-haspopup="dialog"><IconDownload className="h-4 w-4"/><span>App & offline</span>{pwa.updateAvailable && <span className="dw-app-update-dot" aria-label="Update available"/>}</button>;
}
