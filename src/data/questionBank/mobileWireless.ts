import type { TypedQuestion } from '../../types';

/** Mobile security and wireless security lessons. */
export const MOBILE_WIRELESS_QUESTIONS: Record<string, TypedQuestion[]> = {
  'mob-1': [
    { prompt: 'What is the Android app package format? (three letters)', answer: 'APK' },
    { prompt: 'What is the iOS app package format? (three letters)', answer: 'IPA' },
  ],
  'mob-2': [
    { prompt: 'Alongside apktool, which decompiler reconstructs a source-like view of DEX code?', answer: 'jadx' },
    { prompt: 'Which file do you review for exported components and permissions?', answer: 'manifest', accept: ['androidmanifest.xml', 'merged manifest'] },
  ],
  'mob-3': [
    { prompt: 'Which instrumentation tool is used to bypass certificate pinning?', answer: 'Frida' },
    { prompt: 'Which adb command gives root on a "Google APIs" emulator image?', answer: 'adb root' },
  ],
  'mob-4': [
    { prompt: 'Which Android storage API is meant only for small, non-sensitive settings?', answer: 'SharedPreferences' },
    { prompt: 'Which OWASP Mobile Top 10 code is Insecure Data Storage?', answer: 'M9' },
  ],
  'mob-5': [
    { prompt: 'Which iOS feature enforces secure network connections by default?', answer: 'App Transport Security', accept: ['ats'] },
    { prompt: 'Where should an iOS app store secrets?', answer: 'Keychain', accept: ['the keychain'] },
  ],
  'mob-6': [
    { prompt: 'Which Android capability is behind most banking trojans?', answer: 'Accessibility Service', accept: ['accessibility'] },
    { prompt: 'Which banking trojan is the case study (also known as Anatsa)?', answer: 'TeaBot', accept: ['anatsa'] },
  ],
  'mob-7': [
    { prompt: 'What does MDM stand for?', answer: 'Mobile Device Management' },
    { prompt: 'On BYOD devices, remote wipe can target just the work what?', answer: 'profile', accept: ['work profile'] },
  ],
  'mob-8': [
    { prompt: 'Which OWASP standard defines the requirements a secure mobile app should meet?', answer: 'MASVS' },
    { prompt: 'Which companion OWASP guide is the hands-on testing methodology?', answer: 'MASTG' },
  ],
  'mobile-modern-1': [
    { prompt: 'Which Android facility protects cryptographic keys?', answer: 'Keystore', accept: ['android keystore'] },
    { prompt: 'Which is its iOS counterpart?', answer: 'Keychain' },
  ],
  'mobile-modern-2': [
    { prompt: 'Which component setting decides whether another app can invoke it?', answer: 'exported' },
    { prompt: 'Links that open a specific app screen directly are called deep what?', answer: 'links', accept: ['deep links'] },
  ],
  'mobile-modern-3': [
    { prompt: 'Which Android configuration defines cleartext and trust behaviour per domain?', answer: 'Network Security Configuration' },
    { prompt: 'Which embedded browser component can expose a JavaScript bridge?', answer: 'WebView' },
  ],
  'mobile-modern-4': [
    { prompt: 'Which tool inspects Android code representations?', answer: 'JADX' },
    { prompt: 'Which tool observes or modifies runtime behaviour?', answer: 'Frida' },
  ],
  'wl-1': [
    { prompt: 'Which 802.11 frame type handles discovery and connection setup?', answer: 'management', accept: ['management frames'] },
    { prompt: 'Which adapter mode lets you capture raw frames from the air?', answer: 'monitor mode', accept: ['monitor'] },
  ],
  'wl-2': [
    { prompt: 'How many messages does the WPA2 handshake exchange?', answer: '4', accept: ['four', '4-way'] },
    { prompt: 'Which quieter capture technique needs no deauthentication?', answer: 'PMKID' },
  ],
  'wl-3': [
    { prompt: 'Which hashcat mode cracks WPA handshakes and PMKIDs?', answer: '22000', accept: ['-m 22000'] },
    { prompt: 'Which WPA3 handshake breaks the offline-cracking model? (acronym)', answer: 'SAE' },
  ],
  'wl-4': [
    { prompt: 'Which attack clones a network name a client already trusts?', answer: 'evil twin' },
    { prompt: 'Which daemon broadcasts the attacker-controlled access point?', answer: 'hostapd' },
  ],
  'wl-5': [
    { prompt: 'Which Bluetooth vulnerability set is the case study?', answer: 'BlueBorne' },
    { prompt: 'Which BLE attribute profile is enumerated for services? (acronym)', answer: 'GATT' },
  ],
  'wl-6': [
    { prompt: 'In 802.1X, what is the client device called?', answer: 'supplicant' },
    { prompt: 'Which server checks the per-user credentials?', answer: 'RADIUS' },
  ],
  'wl-7': [
    { prompt: 'Which wireless monitoring tool is named in this lesson?', answer: 'Kismet' },
    { prompt: 'A WIDS spots a deauth flood from the abnormal what of deauth frames?', answer: 'rate' },
  ],
  'wl-8': [
    { prompt: 'What is the cellular "evil twin" device called?', answer: 'IMSI catcher', accept: ['stingray', 'imsi catchers'] },
    { prompt: 'Which legacy signalling protocol is discussed alongside Diameter?', answer: 'SS7' },
  ],
};
