import { openAppInstall, usePwa } from '../../state/pwa';
import { IconDownload } from './icons';
import AppUpdateSymbol from './AppUpdateSymbol';
import { useIsOwner } from '../../lib/ownerAccess';

export default function InstallAppButton({ navigation = false }: { navigation?: boolean }) {
  const pwa = usePwa();
  // The app and offline workspace are for the owner accounts only; everyone else never sees the button.
  const owner = useIsOwner();
  if (!owner) return null;
  const label = 'App & offline';
  if (navigation) return <button type="button" onClick={openAppInstall} className="learning-navigation__app" aria-label={pwa.updateAvailable ? 'Update ready — ' + label : label} aria-haspopup="dialog" title={pwa.updateAvailable ? 'Update ready' : label}><span className="learning-navigation__symbol"><AppUpdateSymbol/></span><span>{pwa.updateAvailable ? 'Update ready' : label}</span>{pwa.updateAvailable && <span className="learning-navigation__update-dot" aria-hidden="true"/>}</button>;
  return <button type="button" onClick={openAppInstall} className="dw-app-button" aria-haspopup="dialog"><IconDownload className="h-4 w-4"/><span>{label}</span>{pwa.updateAvailable && <span className="dw-app-update-dot" aria-label="Update available"/>}</button>;
}
