import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'iot-review-ws-3', user: 'root', root: dir({ root: dir(files) }) };
}

/** IoT & Embedded Security lab pack #3 — eight more labs bringing this category closer to parity with
 *  Mobile/Wireless/AI Security. Covers gaps the first two IoT packs didn't reach: companion-app/device trust,
 *  U-Boot bootloader secrets, SPI flash key recovery, Mirai's own scanner source, Zigbee's default
 *  Trust Center key, Purdue Model segmentation failure, an OWASP IoT Top 10 gap-analysis capstone (mirroring
 *  the Mobile module's MASVS-audit capstone), and one active CVE-correlation exploit lab reusing the engine's
 *  existing `exploitableAs`/`exploit` mechanism (distinct CVE from the CVE-2023-1389 lab already in iot-pack.ts). */
export const iotLabs3: LabScenario[] = [
  // 1 — companion app trusts device telemetry with no authentication (Lesson 1: ecosystem trust)
  {
    id: 'iot-companion-app-spoofed-device-telemetry',
    title: 'IoT: A Companion App Accepts Spoofed Telemetry From Any Claimed Device ID',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'aquasense\'s companion app displays pool sensor readings pushed by the device to a cloud endpoint. ' +
      'Review the API traffic capture to confirm whether the backend verifies that a telemetry update ' +
      'actually came from the genuine, paired device.',
    objectives: [
      { text: 'cat telemetry-api-capture.txt', why: 'Confirms the ecosystem-layer trust assumption from Lesson 1: the ' +
          'device, companion app, and cloud backend all have to agree on what counts as a legitimate update — and here, nothing does.' },
    ],
    hints: [
      'cat telemetry-api-capture.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'telemetry-api-capture.txt': file(
        'POST /api/v1/telemetry HTTP/1.1\n' +
          '{"device_id":"aqs-88213","ph":7.2,"chlorine_ppm":3.1,"temp_f":81}\n' +
          'HTTP/1.1 200 OK  {"status":"accepted"}\n\n' +
          '-- no device certificate, signed payload, or per-device API key of any kind is checked --\n' +
          '   the endpoint accepts ANY device_id with no proof it came from that physical device --\n\n' +
          'POST /api/v1/telemetry HTTP/1.1   (sent from an unrelated attacker-controlled host)\n' +
          '{"device_id":"aqs-88213","ph":7.2,"chlorine_ppm":0.0,"temp_f":81}\n' +
          'HTTP/1.1 200 OK  {"status":"accepted"}\n' +
          '-- the companion app now displays 0.0 ppm chlorine to the real owner, entirely spoofed --\n' +
          'flag{companion_app_accepts_unauthenticated_spoofed_device_telemetry}\n',
      ),
    }),
    network: [],
  },

  // 2 — U-Boot bootloader environment leaks a debug root password (Lesson 2: firmware static analysis)
  {
    id: 'iot-uboot-bootloader-env-debug-credentials',
    title: 'IoT: U-Boot Environment Variables Leak a Debug Root Password',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'A U-Boot environment block was carved out of skyviewcam-fw-v3.2.1.bin during the same binwalk pass ' +
      'from earlier in this module. Review it for exactly the kind of bootloader-level leak Lesson 2 flagged ' +
      'as another common firmware finding, beyond just /etc/shadow.',
    objectives: [
      { text: 'strings uboot-env-block.bin', why: 'U-Boot environment variables are stored as plain text in a predictable flash region — often recoverable directly from a firmware image with no hardware access needed at all, exactly as Lesson 2 described.' },
    ],
    hints: [
      'strings uboot-env-block.bin',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'uboot-env-block.bin': file(
        'bootdelay=3\n' +
          'baudrate=115200\n' +
          'bootcmd=bootm 0x80000000\n' +
          'bootargs=console=ttyS0,115200 root=/dev/mtdblock3\n' +
          'debug_root_pw=SkyView_Fact0ry!\n' +
          '  -- a debug root password stored directly in the U-Boot environment block, readable\n' +
          '     straight out of the firmware image with strings alone -- no hardware, no UART\n' +
          '     console access, and no runtime execution required at all --\n' +
          '  -- combined with bootdelay=3 (a nonzero delay with no console password set), this same\n' +
          '     device also permits interrupting the boot process entirely, per Lesson 2\'s note --\n' +
          'flag{uboot_environment_block_leaks_debug_root_password}\n',
      ),
    }),
    network: [],
  },

  // 3 — SPI flash dump recovers a firmware signing key (Lesson 3: hardware hacking)
  {
    id: 'iot-spi-flash-dump-recovers-signing-key',
    title: 'IoT: A Direct SPI Flash Dump Recovers the Firmware Signing Key',
    difficulty: 'Hard',
    category: 'IoT',
    briefing:
      'With no UART console access available on this particular device, the SPI NOR flash chip was desoldered ' +
      'and read directly with a CH341A programmer. Review the flashrom session and the recovered contents.',
    objectives: [
      { text: 'cat flashrom-spi-dump-session.log', why: 'This is Lesson 3\'s SPI flash workflow — reading the chip directly, independent of whether the CPU or any software-level protection is even running, the fallback when UART/JTAG access isn\'t available.' },
      { text: 'grep -i "private" recovered-flash-dump.bin', why: 'A private signing key baked into the SAME flash chip that stores the firmware it signs defeats the entire point of code signing (the Security Engineering module\'s threat-modeling lesson) — anyone who can dump the chip can also forge validly-signed malicious updates.' },
    ],
    hints: [
      'cat flashrom-spi-dump-session.log',
      'grep -i "private" recovered-flash-dump.bin',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'flashrom-spi-dump-session.log': file(
        '$ flashrom -p ch341a_spi -r recovered-flash-dump.bin\n' +
          'Found Winbond flash chip "W25Q64.V" (8192 kB, SPI)\n' +
          'Reading flash... done.\n' +
          '-- 8MB raw dump obtained directly from the desoldered chip, independent of the device\'s\n' +
          '   own CPU or any running software protection --\n',
      ),
      'recovered-flash-dump.bin': file(
        '...binary firmware content...\n' +
          '-----BEGIN RSA PRIVATE KEY-----\n' +
          'MIIEpAIBAAKCAQEA3f2f...[firmware update signing key, embedded in the SAME chip]...\n' +
          '-----END RSA PRIVATE KEY-----\n' +
          '-- this is the private key used to SIGN legitimate firmware updates for this device --\n' +
          '   shipped in the same flash chip it protects -- anyone who dumps the chip can sign\n' +
          '   their own malicious firmware update that the device will accept as genuine --\n' +
          'flag{spi_flash_dump_recovers_firmware_signing_private_key}\n',
      ),
    }),
    network: [],
  },

  // 4 — CVE correlation from a firmware version string, active exploit (Lesson 2, distinct CVE from iot-pack.ts)
  {
    id: 'iot-cve-2021-36260-hikvision-webserver-rce',
    title: 'IoT: Firmware Version Correlates to a Known Camera Web-Server RCE',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'streamguard-cam-04 is running a firmware build string matching a well-documented, publicly disclosed ' +
      'unauthenticated command injection in its web server (CVE-2021-36260). Confirm the version, then run ' +
      'the exploit.',
    objectives: [
      { text: 'nmap -sV 10.10.72.30', why: 'Correlating a service\'s identified version against known CVE databases (Lesson 2\'s closing point) is often the fastest path to a documented, pre-existing exploit — no custom vulnerability research needed.' },
      { text: 'exploit cve-2021-36260-hikvision-webserver-rce 10.10.72.30', why: 'Confirms the version-to-CVE correlation was correct by actually running the documented exploit against the identified, vulnerable service.' },
      { text: 'cat /root/root.txt', why: 'Confirms the session that opened is genuinely root, not just a low-privilege shell.' },
    ],
    hints: [
      'nmap -sV 10.10.72.30',
      'exploit cve-2021-36260-hikvision-webserver-rce 10.10.72.30',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'streamguard-cam-04', ip: '10.10.72.30', os: 'Embedded Linux (IP camera firmware, vulnerable web server build)',
        services: [
          { port: 80, name: 'http', version: 'IP camera web management (vulnerable to CVE-2021-36260)' },
        ],
        users: [],
        exploitableAs: 'cve-2021-36260-hikvision-webserver-rce',
        root: dir({
          root: dir({
            'root.txt': file(
              'CVE-2021-36260 confirmed -- unauthenticated command injection in the camera web server\'s\n' +
                'language-pack parsing, executed as root with zero prior credentials.\n' +
                'flag{firmware_version_cve_correlation_confirmed_by_working_exploit}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },

  // 5 — analyzing Mirai's own leaked scanner source (Lesson 5: botnets)
  {
    id: 'iot-mirai-leaked-scanner-source-analysis',
    title: 'IoT: Analyzing Mirai\'s Own Leaked Scanner Module Source',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'A copy of Mirai\'s publicly leaked source code (2016) is available for review. Read the scanner ' +
      'module\'s core logic to confirm exactly how it identified and validated candidate targets before ' +
      'attempting the credential table from Lesson 1.',
    objectives: [
      { text: 'cat mirai-source-excerpt-scanner.c', why: 'Reading the actual leaked source (Lesson 5) shows Mirai\'s scanning was not random — it deliberately excluded entire IP ranges (including, notably, Department of Defense and other government/major-corporation ranges) specifically to reduce the chance of drawing high-profile law enforcement attention.' },
    ],
    hints: [
      'cat mirai-source-excerpt-scanner.c',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'mirai-source-excerpt-scanner.c': file(
        '// excerpt, scanner.c -- from Mirai\'s publicly leaked source, September 2016\n' +
          'static ipv4_t get_random_ip(void) {\n' +
          '    ipv4_t tmp;\n' +
          '    do {\n' +
          '        tmp = rand_next();\n' +
          '    } while (\n' +
          '        (tmp & 0xff000000) == 0x7f000000 ||   // 127.0.0.0/8 (loopback)\n' +
          '        (tmp & 0xff000000) == 0x0a000000 ||   // 10.0.0.0/8 (private)\n' +
          '        (tmp & 0xff000000) == 0x6c000000 ||   // 108.0.0.0/8 (excluded -- General Electric)\n' +
          '        (tmp & 0xfff00000) == 0x6bc00000 ||   // 107.192.0.0/12 (excluded)\n' +
          '        (tmp & 0xff000000) == 0x21000000 ||   // 33.0.0.0/8 (excluded -- US DoD)\n' +
          '        ... /* several more explicit exclusions follow */\n' +
          '    );\n' +
          '    return tmp;\n' +
          '}\n' +
          '-- Mirai\'s scanning was deliberately NOT fully random -- specific ranges including US DoD\n' +
          '   and select large corporations were hardcoded exclusions, a deliberate operational-\n' +
          '   security choice to reduce the odds of drawing high-profile attention during propagation --\n' +
          'flag{mirai_scanner_source_reveals_deliberate_ip_range_exclusions}\n',
      ),
    }),
    network: [],
  },

  // 6 — Zigbee default Trust Center link key captured during commissioning (Lesson 6: protocols)
  {
    id: 'iot-zigbee-default-trust-center-key-capture',
    title: 'IoT: Zigbee\'s Default Trust Center Link Key Exposes the Network Key',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'A Zigbee sniffer captured a device joining meridianhome\'s mesh network. Review the commissioning ' +
      'exchange to confirm whether the network key transport was actually protected.',
    objectives: [
      { text: 'cat zigbee-commissioning-capture.log', why: 'The Zigbee specification\'s well-known default Trust Center link key ("ZigBeeAlliance09") is meant only for the brief key-transport step — but many real implementations use no additional protection during that step, meaning anyone capturing it recovers the network key for the ENTIRE mesh, not just the joining device.' },
    ],
    hints: [
      'cat zigbee-commissioning-capture.log',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'zigbee-commissioning-capture.log': file(
        'Zigbee sniffer (CC2531 + Wireshark Zigbee dissector) -- new device join captured\n' +
          'Frame: APS Transport Key command\n' +
          '  Encrypted with: Trust Center Link Key = 5A:69:67:42:65:65:41:6C:6C:69:61:6E:63:65:30:39\n' +
          '  (this is the well-known Zigbee Alliance DEFAULT link key, "ZigBeeAlliance09" in ASCII --\n' +
          '   this specific vendor\'s Trust Center uses it with no additional protection layered on top)\n' +
          '  Decrypted payload: Network Key = 8F:2A:71:C4:E8:B0:D3:F5:C9:A1:B6:E8:A4:D9:F7:B2\n' +
          '-- this ONE network key encrypts traffic for EVERY device on the mesh -- capturing this\n' +
          '   single brief commissioning exchange compromises the entire network, not just the\n' +
          '   device that happened to be joining --\n' +
          'flag{default_trust_center_link_key_exposes_entire_mesh_network_key}\n',
      ),
    }),
    network: [],
  },

  // 7 — missing IT/OT DMZ segmentation lets a phishing compromise pivot into the control network (Lesson 7)
  {
    id: 'iot-purdue-model-missing-dmz-it-ot-pivot',
    title: 'IoT: Missing Purdue Model Segmentation Lets an IT Compromise Reach OT',
    difficulty: 'Hard',
    category: 'IoT',
    briefing:
      'An incident review is underway after unusual traffic was observed reaching a plant-floor PLC network. ' +
      'Review the incident timeline to confirm how an ordinary phishing compromise on the corporate side ' +
      'ended up with reachability into the control network.',
    objectives: [
      { text: 'cat incident-timeline-it-ot-pivot.txt', why: 'This is the exact pattern Lesson 7 described: a large share of real ICS compromises start with an ordinary IT-side compromise, not a sophisticated OT-specific attack, and succeed only because the Purdue Model\'s Level 3.5 DMZ boundary was not actually enforced.' },
    ],
    hints: [
      'cat incident-timeline-it-ot-pivot.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'incident-timeline-it-ot-pivot.txt': file(
        '09:14  Phishing email opened on a corporate IT workstation (Level 4)\n' +
          '09:16  Malware establishes C2, attacker gains a foothold on the IT network\n' +
          '09:52  Attacker discovers a flat routing rule: the plant\'s historian server (Level 3)\n' +
          '       has a direct route to the Level 2 SCADA VLAN with NO firewall/DMZ in between --\n' +
          '       documented policy calls for a Level 3.5 DMZ here, but the actual firewall rule\n' +
          '       implementing it was never deployed after a network refresh eight months ago\n' +
          '10:03  Attacker pivots from the compromised IT workstation, through the historian server,\n' +
          '       directly reaching the Level 2 SCADA network with no additional barrier at all\n' +
          '-- an ordinary phishing compromise, with no OT-specific exploit used anywhere in this --\n' +
          '   chain, reached the control network purely because documented segmentation policy --\n' +
          '   was never actually enforced in the real firewall configuration --\n' +
          'flag{missing_dmz_enforcement_lets_it_phishing_pivot_reach_ot_network}\n',
      ),
    }),
    network: [],
  },

  // 8 — OWASP IoT Top 10 gap-analysis capstone (Lesson 8, mirrors the Mobile module's MASVS-audit capstone)
  {
    id: 'iot-owasp-top10-gap-analysis-capstone',
    title: 'IoT: An OWASP IoT Top 10 Gap Analysis Surfaces an Untested Category',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'A completed assessment report for skyviewcam is up for QA review before delivery. Cross-reference the ' +
      'evidence log against the OWASP IoT Top 10 checklist from this module\'s opening lesson and confirm ' +
      'which category has no corresponding test evidence at all.',
    objectives: [
      { text: 'cat owasp-iot-top10-scope-checklist.txt', why: 'The same systematic, category-by-category coverage discipline as the Mobile module\'s MASVS audit — confirming testing actually covered every in-scope category, not just the ones that came to mind first.' },
      { text: 'cat assessment-evidence-index.txt', why: 'Cross-referencing reveals I8 (Insufficient Privacy Protection — what personal data the device collects/transmits and how it\'s handled) has zero corresponding evidence anywhere in the index, despite being listed as in-scope.' },
    ],
    hints: [
      'cat owasp-iot-top10-scope-checklist.txt',
      'cat assessment-evidence-index.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'owasp-iot-top10-scope-checklist.txt': file(
        'skyviewcam assessment -- OWASP IoT Top 10 scope (per engagement letter):\n' +
          '  [x] I1 Weak/Hardcoded Credentials   [x] I2 Insecure Network Services\n' +
          '  [x] I3 Insecure Ecosystem Interfaces  [x] I4 Lack of Secure Update Mechanism\n' +
          '  [x] I5 Insecure/Outdated Components     [x] I6 Insufficient Privacy Protection*\n' +
          '  [x] I7 Insecure Data Transfer/Storage      [x] I8 Lack of Device Management\n' +
          '  (*listed here as I6 per this engagement\'s scope numbering)\n',
      ),
      'assessment-evidence-index.txt': file(
        'Evidence index:\n' +
          '  credential-findings.pdf, network-service-scan.pdf, api-ecosystem-review.pdf,\n' +
          '  ota-update-analysis.pdf, component-cve-correlation.pdf, storage-and-transfer-findings.pdf,\n' +
          '  device-management-review.pdf\n' +
          '-- no privacy-focused evidence anywhere in this index: no review of WHAT personal data\n' +
          '   (video footage, motion timestamps, WiFi network names in range) the device actually\n' +
          '   collects, transmits, or retains, and under what retention/sharing policy --\n' +
          'flag{owasp_iot_top10_audit_finds_untested_privacy_protection_category}\n',
      ),
    }),
    network: [],
  },
];
