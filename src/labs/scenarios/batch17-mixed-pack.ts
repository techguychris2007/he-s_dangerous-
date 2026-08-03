import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

/** Batch 17. Same discipline as the last several batches (see NOTES.md): every technique researched for
 *  real-machine accuracy, every non-80 target given an explicit port, every hand-computed cryptographic
 *  value re-derived programmatically (this batch's RSA e=3 attack was verified end-to-end with real
 *  BigInt arithmetic in Node before being hardcoded — see NOTES.md batch 17 for the exact script). */
export const batch17MixedLabs: LabScenario[] = [
  // 1 — Cryptography: RSA e=3 Cube Root Attack Recovers an Unpadded PIN With No Private Key
  {
    id: 'crypto-rsa-e3-cube-root-unpadded-attack',
    title: 'Cryptography: RSA e=3 Cube Root Attack Recovers an Unpadded PIN',
    difficulty: 'Medium',
    category: 'Cryptography',
    briefing:
      'pinreset-svc22 encrypts a customer\'s 9-digit PIN directly with RSA, public exponent e=3, and no ' +
      'padding scheme at all — RSA textbook-style, exactly the configuration real cryptographic guidance ' +
      'has warned against for decades. The attack here needs no private key, no factoring, and no oracle: ' +
      'RSA encryption is C = M^e mod N, but when the plaintext M is small relative to the modulus N (a ' +
      '9-digit PIN against a 300+ bit modulus, here), M^3 itself is still smaller than N — meaning the ' +
      '"mod N" step never actually reduces anything, and the ciphertext C is exactly, over the integers, ' +
      'equal to M^3. Recovering M is then nothing more than taking the ordinary integer cube root of C, ' +
      'something any attacker can compute in milliseconds with no cryptographic material at all. This is ' +
      'the simplest real case of the RSA low-exponent family of attacks (the same root cause behind ' +
      'Håstad\'s broadcast attack, which extends it to Chinese-Remainder-Theorem-recover a message sent to ' +
      'multiple recipients under different moduli) — the fix has been well-established for decades: use a ' +
      'real padding scheme like OAEP, which guarantees the padded message is never small relative to N.',
    objectives: [
      { text: 'cat rsa-pin-encryption-spec.txt', why: 'Confirms the exact vulnerable configuration: RSA with e=3 and NO padding scheme applied to the plaintext before encryption -- the one precondition this entire attack depends on.' },
      { text: 'cat intercepted-ciphertext.txt', why: 'The captured ciphertext for a real PIN-reset request -- confirms its size is consistent with M^3 never having exceeded the modulus, meaning no modular reduction occurred at all.' },
      { text: 'curl -X POST -H "X-Recovered-PIN: 804517239" http://10.10.259.2:80/api/pin-verify', why: 'Submits the PIN recovered by taking the plain integer cube root of the intercepted ciphertext -- computed with no private key, no factoring, and no oracle of any kind, just ordinary integer arithmetic.' },
    ],
    hints: [
      'cat rsa-pin-encryption-spec.txt',
      'cat intercepted-ciphertext.txt',
      'The ciphertext (hex 1aebb3514a617ad5f5145a7) is exactly M^3 over the integers -- no modular wraparound occurred because the modulus is far larger than any 9-digit PIN cubed. Taking its real cube root recovers M directly.',
      'curl -X POST -H "X-Recovered-PIN: 804517239" http://10.10.259.2:80/api/pin-verify',
    ],
    totalFlags: 1,
    attacker: attacker({
      'rsa-pin-encryption-spec.txt': file(
        'pinreset-svc22 PIN encryption spec (internal wiki, "Legacy Crypto" page):\n' +
          '  Algorithm:  RSA, public exponent e = 3\n' +
          '  Padding:    NONE -- the 9-digit PIN is encoded as an integer and encrypted directly, C = M^3 mod N\n' +
          '  Modulus N (hex): C1A5E3F2B4D6A8901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12345678\n' +
          '  (~352-bit modulus)\n' +
          '  -- textbook RSA with a small public exponent and no padding scheme -- exactly the configuration\n' +
          '     real cryptographic guidance has warned against since the 1980s (Hastad, Coppersmith) --\n',
      ),
      'intercepted-ciphertext.txt': file(
        'Intercepted PIN-reset request, pinreset-svc22:\n' +
          '  Ciphertext (hex):     1aebb3514a617ad5f5145a7\n' +
          '  Ciphertext (decimal): 520722164131925835673322919\n' +
          '  -- verified independently with real BigInt arithmetic: this value is EXACTLY M^3 for a 9-digit\n' +
          '     integer M, over the integers (not merely congruent mod N) -- the modulus never came into play\n' +
          '     at all, because M^3 for any 9-digit PIN is still far smaller than the ~352-bit modulus --\n' +
          '  -- taking the real (not modular) cube root of this exact ciphertext recovers the PIN directly --\n',
      ),
    }),
    network: [
      {
        hostname: 'pinreset-svc22',
        ip: '10.10.259.2',
        os: 'Ubuntu 22.04 (Node.js, textbook RSA e=3 PIN encryption, no padding)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/pin-verify',
                param: 'X-Recovered-PIN',
                location: 'header',
                triggerSubstrings: ['804517239'],
                vulnerableResponse: '{"status":200,"result":"pin_verified","account":"unlocked","note":"flag{rsa_e3_cube_root_attack_recovers_unpadded_pin_no_private_key}"}',
                normalResponse: '{"error":"401 Unauthorized - incorrect PIN"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — API: An API Key Passed in the URL Query String Leaks via Access Logs
  {
    id: 'api-key-url-query-string-log-leak',
    title: 'API: A Key Passed in the URL Query String Leaks via Access Logs',
    difficulty: 'Easy',
    category: 'API',
    briefing:
      'analytics-ingest71 authenticates its reporting API with api_key as a URL query parameter instead of ' +
      'an Authorization header — a real, common anti-pattern precisely because it feels convenient (a ' +
      'single copy-pasteable URL) while quietly defeating one of the basic protections a header-based key ' +
      'gets for free. Web servers and reverse proxies routinely log full request URLs, including their ' +
      'query strings, but headers are logged far less often by default — meaning a key that would have been ' +
      'invisible in an Authorization header sits in plaintext in every access log line for as long as those ' +
      'logs are retained. Here, an old debug log-export endpoint left reachable exposes exactly that: a ' +
      'stream of real historical requests, api_key values included, going back months.',
    objectives: [
      { text: 'gobuster -u http://10.10.260.2 -w /root/wordlists/log-paths.txt', why: 'Log-export/debug endpoints are never linked from a normal API\'s documentation -- directory brute-forcing is genuinely how this class of forgotten endpoint gets found.' },
      { text: 'curl http://10.10.260.2/debug/access-log-export', why: 'A real historical access log -- every api_key that was ever passed as a query parameter is sitting here in plaintext, for as long as these logs have been retained.' },
      { text: 'curl "http://10.10.260.2/api/v1/reports?api_key=ak_live_7f3d9c1b2e5a8f04"', why: 'Confirms the leaked key still works -- turning "a key appeared in a log file" into "this key grants live, working access to the reporting API right now."' },
    ],
    hints: [
      'gobuster -u http://10.10.260.2 -w /root/wordlists/log-paths.txt',
      'curl http://10.10.260.2/debug/access-log-export',
      'curl "http://10.10.260.2/api/v1/reports?api_key=ak_live_7f3d9c1b2e5a8f04"',
    ],
    totalFlags: 1,
    attacker: attacker({
      wordlists: dir({
        'log-paths.txt': file('debug/access-log-export\nadmin\nrobots.txt\napi/v1/reports\nhealth\n'),
      }),
    }),
    network: [
      {
        hostname: 'analytics-ingest71',
        ip: '10.10.260.2',
        os: 'nginx 1.24 + Express 4.18 (API keys accepted via ?api_key= query parameter)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24 (full request URLs logged, including query strings)',
            http: {
              '/debug/access-log-export':
                '10.10.14.220 - - [29/Jul/2026:11:02:07] "GET /api/v1/reports?api_key=ak_live_7f3d9c1b2e5a8f04 HTTP/1.1" 200\n' +
                '10.10.14.221 - - [29/Jul/2026:11:04:51] "GET /api/v1/reports?api_key=ak_live_7f3d9c1b2e5a8f04&range=30d HTTP/1.1" 200\n' +
                '-- api_key values are logged in plaintext on every single request that used one -- headers are\n' +
                '   logged far less often by default, which is exactly why URL query strings are the wrong place\n' +
                '   for a secret like this one --\n',
              '/api/v1/reports':
                '{"error":"401 Unauthorized - missing or invalid api_key"}',
            },
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/v1/reports',
                param: 'api_key',
                triggerSubstrings: ['ak_live_7f3d9c1b2e5a8f04'],
                vulnerableResponse: '{"status":200,"report":"q3_revenue_summary","total":"$4,281,900","note":"flag{api_key_in_url_query_string_leaked_via_access_log}"}',
                normalResponse: '{"error":"401 Unauthorized - missing or invalid api_key"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Security Engineering: A Negative-Quantity Business Logic Flaw Turns a Checkout Into Free Credit
  {
    id: 'secengineering-negative-quantity-checkout-business-logic',
    title: 'Security Engineering: A Negative-Quantity Checkout Flaw Grants Free Account Credit',
    difficulty: 'Medium',
    category: 'Security Engineering',
    briefing:
      'shopfront33\'s checkout API accepts a quantity field per line item and multiplies it by the item\'s ' +
      'price server-side to compute the order total — correct in principle, but with no check that quantity ' +
      'is actually a positive number. This is a real, commonly-reported business logic class distinct from ' +
      'every injection or authentication bug on this platform: no malformed syntax, no bypassed check, ' +
      'nothing a WAF or input-sanitization filter would ever flag, because negative-five is a perfectly ' +
      'well-formed integer. Submitting a cart with one full-price item and a second line item at quantity ' +
      '-1 makes the server\'s own multiplication produce a negative subtotal for that line, dragging the ' +
      'order total below zero — and shopfront33\'s payment flow, on seeing a negative total, credits the ' +
      'difference directly to the customer\'s account balance instead of rejecting the order outright.',
    objectives: [
      { text: 'curl -X POST http://10.10.261.2:80/api/checkout -d "items=SKU-1001:1,SKU-2044:1"', why: 'Establishes the normal, expected checkout total first -- a known-good baseline before attempting to manipulate it.' },
      { text: 'curl -X POST http://10.10.261.2:80/api/checkout -d "items=SKU-1001:1,SKU-2044:-1"', why: 'A negative quantity is a perfectly well-formed integer -- nothing here is malformed syntax an input filter would catch, yet the server\'s own price-times-quantity multiplication produces a negative order total.' },
    ],
    hints: [
      'curl -X POST http://10.10.261.2:80/api/checkout -d "items=SKU-1001:1,SKU-2044:1"',
      'curl -X POST http://10.10.261.2:80/api/checkout -d "items=SKU-1001:1,SKU-2044:-1"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'shopfront33',
        ip: '10.10.261.2',
        os: 'Ubuntu 22.04 (Express 4.18, server-side price calculation, no quantity sign validation)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/checkout',
                param: 'items',
                triggerSubstrings: [':-1', ':-'],
                vulnerableResponse:
                  '{"status":200,"order_total":"-149.00","result":"negative_total_credited_to_account_balance","note":"flag{negative_quantity_business_logic_flaw_grants_free_credit}"}',
                normalResponse: '{"status":200,"order_total":"238.00","result":"order_placed"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 4 — Security+: 125kHz RFID Proximity Badge Cloning
  {
    id: 'securityplus-125khz-rfid-badge-cloning',
    title: 'Security+: 125kHz RFID Proximity Badge Cloning',
    difficulty: 'Easy',
    category: 'Security+',
    briefing:
      'A physical security assessment of meridiancorp\'s office finds its door badges are legacy 125kHz ' +
      'proximity cards — still in use at an estimated 70% of physical access control deployments today. ' +
      'These cards have no encryption at all: the site code and card number are broadcast in plaintext the ' +
      'instant the card is within range of a reader, no challenge-response, no cryptographic exchange of ' +
      'any kind. A tool like a Proxmark3 (or the far cheaper, consumer-available Flipper Zero) can read ' +
      'that plaintext ID from several centimeters away — through a bag, a wallet, or clothing — without the ' +
      'cardholder ever noticing, and writing the captured ID to a blank card takes seconds. In a crowded ' +
      'space like an elevator or a cafeteria line, a motivated attacker can walk away with a fully working ' +
      'clone of a badge they never touched.',
    objectives: [
      { text: 'cat proxmark3-capture-log.txt', why: 'Confirms the card broadcasts its site code and card number completely unencrypted -- no challenge-response, nothing to defeat, just a plaintext read within range.' },
      { text: 'cat badge-clone-verification.txt', why: 'Confirms the concrete real-world impact: the cloned card was tested against an actual meridiancorp door reader and granted access identically to the original -- not a theoretical capture, a working physical clone.' },
    ],
    hints: [
      'cat proxmark3-capture-log.txt',
      'cat badge-clone-verification.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'proxmark3-capture-log.txt': file(
        'Proxmark3 capture, target: meridiancorp employee badge (captured at ~8cm range, through a jacket pocket):\n' +
          '$ proxmark3> lf search\n' +
          '[+] Chipset detection: HID Prox\n' +
          '[+] Site code: 042\n' +
          '[+] Card number: 18841\n' +
          '[+] Raw ID: 2004A18841\n' +
          '-- broadcast completely in plaintext, no encryption, no challenge-response -- 125kHz proximity\n' +
          '   cards were never designed with any cryptographic protection at all --\n' +
          '   capture took under 2 seconds, no indication given to the cardholder that anything occurred --\n',
      ),
      'badge-clone-verification.txt': file(
        'Physical assessment verification log:\n' +
          '  Blank T5577 card written with captured raw ID 2004A18841 (site code 042, card number 18841)\n' +
          '  Test: presented cloned card to meridiancorp east-entrance door reader, 14:22:03\n' +
          '  Result: ACCESS GRANTED -- door reader could not distinguish the clone from the original badge\n' +
          '  -- confirms this is a real, working physical access bypass, not merely a successful data capture --\n' +
          '  flag{125khz_rfid_proximity_badge_cloned_plaintext_no_encryption}\n',
      ),
    }),
    network: [],
  },

  // 5 — SOC: WinRM Lateral Movement Detected via wsmprovhost.exe Correlation
  {
    id: 'soc-winrm-lateral-movement-wsmprovhost-detection',
    title: 'SOC: WinRM Lateral Movement Detected via wsmprovhost.exe Correlation',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'An attacker who compromised local-admin credentials on FIN-WKS-08 pivoted to ACCT-WKS-31 using ' +
      'Windows Remote Management (WinRM) — MITRE ATT&CK T1021.006, a completely legitimate, ' +
      'always-available Windows remote-administration protocol, so this activity generates no exploit ' +
      'alert, no malware signature hit, nothing an antivirus product would ever flag. The real, standard ' +
      'detection approach correlates two ordinary-looking signals that are only suspicious together: an ' +
      'Event ID 4624 network logon (Logon Type 3) landing on the destination host, immediately followed by ' +
      'wsmprovhost.exe — the WinRM provider host process — spawning an unexpected child process. Neither ' +
      'event alone would justify an alert; wsmprovhost.exe legitimately spawns children during every normal ' +
      'PowerShell remoting session an admin runs. What makes this one different is entirely contextual: the ' +
      'logon source, the account\'s normal behavior baseline, and the specific command that child process ran.',
    objectives: [
      { text: 'cat acctwks31-security-eventlog-4624.txt', why: 'Shows the Event ID 4624 Logon Type 3 network logon landing on ACCT-WKS-31 from FIN-WKS-08 -- an account and source combination outside this account\'s normal behavior baseline.' },
      { text: 'cat wsmprovhost-process-correlation.txt', why: 'Correlates that exact logon to wsmprovhost.exe spawning an unexpected child process seconds later -- the standard, real detection pattern for T1021.006, since wsmprovhost.exe itself is completely normal but this specific child process is not.' },
    ],
    hints: [
      'cat acctwks31-security-eventlog-4624.txt',
      'cat wsmprovhost-process-correlation.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'acctwks31-security-eventlog-4624.txt': file(
          'Windows Security Event Log, ACCT-WKS-31:\n' +
            '  2026-08-01 10:41:52  Event ID 4624 (Logon Type 3 - Network)\n' +
            '    Account Name: FINSVC-ADMIN   Source Network Address: 10.10.14.108 (FIN-WKS-08)\n' +
            '    Logon Process: NtLmSsp\n' +
            '  -- FINSVC-ADMIN\'s normal baseline never touches ACCT-WKS-31, and never logs on from FIN-WKS-08 --\n' +
            '     this account\'s documented job function has no legitimate reason to reach this host at all --\n',
        ),
        'wsmprovhost-process-correlation.txt': file(
          'Process creation telemetry, ACCT-WKS-31 (Event ID 4688 + Sysmon Event ID 1):\n' +
            '  10:41:54  wsmprovhost.exe (PID 4402) -- spawned by the WinRM service, tied to the 4624 logon above\n' +
            '  10:41:55  wsmprovhost.exe (PID 4402) spawns: powershell.exe -enc <base64-encoded-command>\n' +
            '\n' +
            '--- ANALYST NOTE: wsmprovhost.exe itself is completely normal -- it is the real WinRM provider host\n' +
            '    process, and spawns a child on every legitimate PowerShell remoting session. What makes THIS\n' +
            '    instance suspicious is entirely contextual: an out-of-baseline account, an unexpected source\n' +
            '    host, and an encoded PowerShell command as the specific child process -- exactly the\n' +
            '    "correlate multiple ordinary signals" approach real T1021.006 detection requires, since no\n' +
            '    single signal here would justify an alert on its own.\n' +
            '    flag{winrm_lateral_movement_wsmprovhost_4624_correlation_t1021_006} ---\n',
        ),
      }),
    }),
    network: [],
  },

  // 6 — Forensics: NTFS $LogFile Transaction Records Independently Confirm Timestomping
  {
    id: 'forensics-ntfs-logfile-transaction-timestomp-confirmation',
    title: 'Forensics: NTFS $LogFile Transaction Records Independently Confirm Timestomping',
    difficulty: 'Hard',
    category: 'Forensics',
    briefing:
      'A suspicious executable\'s $STANDARD_INFORMATION claims it has sat untouched since 2018, and this ' +
      'session\'s existing USN journal lab already covers cross-referencing that claim against ' +
      '$Extend\\$UsnJrnl:$J\'s reason-code history. This investigation goes one level deeper: NTFS\'s own ' +
      '$LogFile, the filesystem\'s write-ahead transaction log for every metadata operation, redo and undo ' +
      'both, recorded against a Log Sequence Number (LSN). Where the USN journal records WHAT happened to a ' +
      'file (a reason code like BASIC_INFO_CHANGE), $LogFile records the literal transaction that performed ' +
      'the metadata write itself — here, an UpdateStandardInformation operation, with its own authentic, ' +
      'independently-timestamped LSN entry — giving a second, lower-level artifact that has to agree with ' +
      'the USN journal\'s account for the anti-forensics story to hold up, and giving investigators a ' +
      'artifact that\'s a layer further from anything a timestomping tool\'s author was likely thinking about ' +
      'when they built it.',
    objectives: [
      { text: 'cat mft-si-claimed-timestamp.txt', why: 'The claimed $STANDARD_INFORMATION creation date -- 2018 -- the number a timestomping tool set and the one a surface-level triage would otherwise trust.' },
      { text: 'cat logfile-lsn-transaction-record.txt', why: '$LogFile\'s own transaction record for the exact operation that rewrote this file\'s $STANDARD_INFORMATION -- an independent, lower-level artifact with its own authentic LSN timestamp, agreeing with the USN journal and directly contradicting the claimed 2018 date.' },
    ],
    hints: [
      'cat mft-si-claimed-timestamp.txt',
      'cat logfile-lsn-transaction-record.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'mft-si-claimed-timestamp.txt': file(
          '$MFT record for C:\\ProgramData\\svc_helper.exe:\n' +
            '  $STANDARD_INFORMATION:  Created 2018-06-02 10:15:44   Modified 2018-06-02 10:15:44\n' +
            '  $FILE_NAME:             Created 2018-06-02 10:15:44   Modified 2018-06-02 10:15:44\n' +
            '  -- both attributes agree with each other -- a competent timestomping tool touched both,\n' +
            '     the way this session\'s existing $SI/$FN-mismatch lab covers a NAIVE tool that only\n' +
            '     touches $SI, leaving the two attributes visibly inconsistent --\n',
        ),
        'logfile-lsn-transaction-record.txt': file(
          '$LogFile parsed transaction record, file reference 0x50031, C:\\ProgramData\\svc_helper.exe:\n' +
            '  LSN 0x00000A3F19E0  Redo Op: UpdateStandardInformation   Commit time: 2026-07-30 02:14:09\n' +
            '  LSN 0x00000A3F1A18  Redo Op: DataOverwrite (0 bytes -- metadata-only transaction)\n' +
            '\n' +
            '--- ANALYST NOTE: $LogFile is NTFS\'s own write-ahead transaction log -- every metadata operation,\n' +
            '    including the exact UpdateStandardInformation call that rewrote this file\'s $SI timestamps,\n' +
            '    is recorded here against its own authentic LSN with an independent commit time. This LSN\n' +
            '    entry is dated 2026-07-30 -- four days before this investigation began -- not 2018, agreeing\n' +
            '    with the USN journal\'s account and directly confirming the $SI claim is forged. A timestomping\n' +
            '    tool that carefully matches $SI and $FN together still has no way to retroactively rewrite\n' +
            '    the already-committed $LogFile transaction record of its own write operation.\n' +
            '    flag{ntfs_logfile_lsn_transaction_independently_confirms_timestomping} ---\n',
        ),
      }),
    }),
    network: [],
  },
];
