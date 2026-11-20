import type { ReactNode } from 'react';
import { isUnsupportedDevice } from '../../shared/lib/deviceAccess';
import Logo from '../../shared/components/layout/Logo';
import '../../shared/styles/entry-pages.css';

/** Computer-only mode. Off by default, so phones and tablets can use DarkWorld. Build with
 *  VITE_COMPUTER_ONLY=on (in Vercel: Project → Settings → Environment Variables) to show phones and
 *  tablets the "Continue on a computer" notice instead. */
export const COMPUTER_ONLY = import.meta.env.VITE_COMPUTER_ONLY === 'on';

export default function ComputerAccessGate({ children }: { children: ReactNode }) {
  if (!COMPUTER_ONLY) return children;
  const browser = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  const blocked = isUnsupportedDevice({
    userAgent: browser.userAgent,
    platform: browser.platform,
    maxTouchPoints: browser.maxTouchPoints,
    mobile: browser.userAgentData?.mobile,
    screenWidth: screen.width,
    screenHeight: screen.height,
    coarsePointer: matchMedia('(pointer: coarse)').matches,
  });
  if (!blocked) return children;
  return (
    <main className="dw-entry dw-device-notice">
      <section aria-labelledby="computer-access-title">
        <Logo className="dw-device-logo" />
        <p className="dw-eyebrow">DarkWorld Academy</p>
        <h1 id="computer-access-title">Continue on a computer.</h1>
        <p>DarkWorld is available on laptops and desktop computers. Phones and tablets cannot access the academy.</p>
        <p>Open this same address on your computer to sign in and use the lessons, coding workspaces and labs.</p>
        <span className="dw-device-requirement">Laptop or desktop required</span>
      </section>
    </main>
  );
}
