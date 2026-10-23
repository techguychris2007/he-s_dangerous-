export interface DeviceSignals {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  mobile?: boolean;
  screenWidth: number;
  screenHeight: number;
  coarsePointer: boolean;
}

/** Device policy, independent of window width so resizing a laptop never locks it out. */
export function isUnsupportedDevice(device: DeviceSignals): boolean {
  if (device.mobile || /Android|iPhone|iPad|iPod|IEMobile|Windows Phone|Silk|Kindle|Opera Mini/i.test(device.userAgent)) return true;
  // iPadOS can advertise itself as a Mac in desktop browsing mode.
  if (/Mac/i.test(device.platform) && device.maxTouchPoints > 1) return true;
  return device.coarsePointer && device.maxTouchPoints > 0 &&
    Math.max(device.screenWidth, device.screenHeight) <= 960;
}
