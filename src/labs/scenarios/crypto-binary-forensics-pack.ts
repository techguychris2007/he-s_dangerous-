import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'analyst-ws', user: 'root', root: dir(files) };
}

/** Batch 4: 2 more Cryptography, 2 more Binary Analysis, 2 more Forensics labs, each researched via
 *  web search before writing (see NOTES.md) and cross-checked against every existing lab title first.
 *  Continuing the explicit instruction to stay within this platform's existing pattern (simulated
 *  TerminalEngine target, conceptual flag capture) and skip anything that would cross into real-world
 *  attack uplift. */
export const cryptoBinaryForensicsLabs: LabScenario[] = [
  // 1 — Cryptography: Bleichenbacher RSA PKCS#1 v1.5 Padding Oracle
  {
    id: 'crypto-bleichenbacher-rsa-padding-oracle',
    title: 'Bleichenbacher RSA Padding Oracle Decrypts a Captured Ciphertext',
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      'Paysvc84\'s legacy payment API decrypts RSA-encrypted session keys using PKCS#1 v1.5 padding, and its ' +
      'error handling leaks exactly which failure occurred: a distinct "padding invalid" response versus a ' +
      'generic "decryption failed" response for every other kind of error. That distinction is the entire ' +
      'oracle a Bleichenbacher attack needs — by resubmitting carefully modified versions of a captured ' +
      'ciphertext and watching which specific error comes back each time, an attacker can adaptively narrow ' +
      'down and eventually recover the original plaintext without ever touching the private key. First ' +
      'published in 1998, this exact attack came back as the real, widely-affecting "ROBOT" vulnerability ' +
      'in 2017 — found across nine different vendors, including Facebook and PayPal\'s own infrastructure at ' +
      'the time — precisely because "distinguishable padding errors" is such an easy implementation mistake ' +
      'to reintroduce.',
    objectives: [
      { text: 'nmap -sV 10.10.213.2', why: 'Confirms the legacy payment API before analyzing its RSA decryption error handling.' },
      { text: 'cat padding-oracle-notes.txt', why: 'Confirms the server returns a distinguishable error specifically for invalid PKCS#1 v1.5 padding, separate from every other failure case — the exact oracle Bleichenbacher\'s attack requires.' },
      {
        text: 'Run a Bleichenbacher oracle tool (e.g. bleichenbacher.py) against the captured ciphertext, using the padding-valid/padding-invalid distinction as the oracle signal, to adaptively recover the plaintext session key',
        why: 'The tool submits thousands of modified ciphertexts and uses the oracle\'s valid/invalid padding signal on each one to mathematically narrow the plaintext down to an exact value — a real, if slow, adaptive-chosen-ciphertext attack, not a brute force.',
      },
      {
        text: 'curl -X POST -d "session_key=a83f19" http://10.10.213.2/payments/verify-decrypted-key',
        why: 'Submitting the recovered plaintext session key proves the oracle attack actually worked end to end — the private key was never touched, only its error-handling behavior.',
      },
    ],
    hints: [
      'nmap -sV 10.10.213.2',
      'cat padding-oracle-notes.txt',
      'The recovered session key from the padding-oracle run is a83f19 -- confirmed in the analysis notes.',
      'curl -X POST -d "session_key=a83f19" http://10.10.213.2/payments/verify-decrypted-key',
    ],
    totalFlags: 1,
    attacker: attacker({
      'padding-oracle-notes.txt': file(
        'paysvc84 RSA decryption error handling (from a captured API spec):\n' +
          '  Response A: {"error":"invalid_padding"}       -- returned ONLY when PKCS#1 v1.5 padding is malformed\n' +
          '  Response B: {"error":"decryption_failed"}      -- returned for every other kind of failure\n' +
          '  -- these two distinct responses ARE the Bleichenbacher oracle: an attacker who can tell which\n' +
          '     one came back for a given modified ciphertext learns one bit of information about the\n' +
          '     original plaintext per query, adaptively, without ever needing the private key --\n' +
          '     the exact 1998 attack that resurfaced as the real 2017 "ROBOT" vulnerability.\n' +
          '  -- captured ciphertext (target of the oracle attack): 7f3a91e8...c02b (RSA-2048, truncated)\n' +
          '  -- after a full Bleichenbacher run against this oracle, the recovered plaintext session key is: a83f19\n',
      ),
    }),
    network: [
      {
        hostname: 'paysvc84',
        ip: '10.10.213.2',
        os: 'Ubuntu 20.04 (legacy payment API, PKCS#1 v1.5 RSA decryption)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.18 + custom RSA-PKCS1v15 payment key exchange',
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/payments/verify-decrypted-key',
                param: 'session_key',
                triggerSubstrings: ['a83f19'],
                vulnerableResponse: '{"status":"confirmed","message":"recovered key matches the true session key -- oracle attack succeeded without the private key","note":"flag{bleichenbacher_padding_oracle_decrypted_session_key}"}',
                normalResponse: '{"status":"no_match","message":"submitted value does not match the true session key"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — Cryptography: UUIDv1 Password-Reset Token Entropy
  {
    id: 'crypto-uuidv1-reset-token-entropy',
    title: 'UUIDv1 Password-Reset Tokens Leak Predictable Entropy',
    difficulty: 'Medium',
    category: 'Cryptography',
    briefing:
      'Accountsvc27 generates password-reset tokens as standard UUIDs — but specifically UUID version 1, ' +
      'not the random version 4 that a security-sensitive token should use. UUIDv1 packs a 60-bit ' +
      'timestamp (100-nanosecond resolution) and the 48-bit MAC address of the generating server directly ' +
      'into the identifier — it was designed to guarantee uniqueness across distributed systems, never to ' +
      'be unguessable. One reset token, captured from an intercepted email, reveals the server\'s MAC ' +
      'address (a fixed, unchanging value) and a timestamp; knowing roughly when a SECOND reset was ' +
      'requested narrows that token\'s timestamp field to a small, enumerable window, at which point every ' +
      'remaining field is fully known or brute-forceable in seconds — a real, repeatedly-documented ' +
      'account-takeover technique against any service that reaches for UUIDv1 instead of a real random ' +
      'token generator.',
    objectives: [
      { text: 'nmap -sV 10.10.214.2', why: 'Confirms the account service before analyzing its reset-token generation scheme.' },
      { text: 'cat captured-reset-email.txt', why: 'One captured UUIDv1 token reveals the server\'s fixed MAC-address field, reusable across every future token this server ever generates.' },
      { text: 'cat uuid-entropy-analysis.txt', why: 'Confirms the specific version (UUIDv1, not v4) and shows exactly how the MAC-address and timestamp fields decompose out of the raw token -- the two facts that combine into predictability.' },
      {
        text: 'curl -X POST -d "reset_token=6ba7b810-9dad-11e6-8106-9a9b5c3f2e41" http://10.10.214.2/account/reset-password',
        why: 'This second token was reconstructed entirely offline -- same MAC-address field as the captured token, timestamp derived from the narrowed request-time window -- and never observed in transit, proving the token space is predictable rather than genuinely random.',
      },
    ],
    hints: [
      'nmap -sV 10.10.214.2',
      'cat captured-reset-email.txt',
      'cat uuid-entropy-analysis.txt',
      'curl -X POST -d "reset_token=6ba7b810-9dad-11e6-8106-9a9b5c3f2e41" http://10.10.214.2/account/reset-password',
    ],
    totalFlags: 1,
    attacker: attacker({
      'captured-reset-email.txt': file(
        'Intercepted password-reset email (a prior, unrelated request):\n' +
          'Your reset link: https://accountsvc27.example/reset?token=6ba7b810-9dad-11d1-8106-9a9b5c3f2e41\n',
      ),
      'uuid-entropy-analysis.txt': file(
        'Token structure analysis:\n' +
          '  6ba7b810-9dad-11d1-8106-9a9b5c3f2e41\n' +
          '  -- version nibble is "1" (in "11d1") -- this is UUIDv1, not the random UUIDv4 a reset token should use\n' +
          '  -- last 48 bits (9a9b5c3f2e41) are the NODE field -- normally the generating server\'s MAC address,\n' +
          '     FIXED across every UUIDv1 this same server ever generates -- already fully known from this one capture\n' +
          '  -- remaining bits are a 60-bit timestamp, 100ns resolution -- narrowing the request time to a\n' +
          '     multi-second window (e.g. from an observed HTTP response Date header) leaves only a small,\n' +
          '     enumerable number of candidate timestamps to try for a NEW target token\n' +
          '  -- reconstructed candidate for the victim\'s in-progress reset: 6ba7b810-9dad-11e6-8106-9a9b5c3f2e41\n' +
          '     (same node field, timestamp field advanced to the narrowed request window)\n',
      ),
    }),
    network: [
      {
        hostname: 'accountsvc27',
        ip: '10.10.214.2',
        os: 'Ubuntu 22.04 (account service, UUIDv1 reset tokens)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Flask 3.0 (Python, uuid.uuid1() reset tokens)',
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/account/reset-password',
                param: 'reset_token',
                triggerSubstrings: ['6ba7b810-9dad-11e6-8106-9a9b5c3f2e41'],
                vulnerableResponse: '{"status":"password_reset","account":"victim_user","note":"flag{uuidv1_reset_token_entropy_predicted_offline}"}',
                normalResponse: '{"error":"Invalid or expired token"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Binary Analysis: Stack Canary Leak via Format String
  {
    id: 'binary-stack-canary-leak-bypass',
    title: 'Reverse Engineering: Leaking a Stack Canary via a Format String Bug',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'canaryleak4 has two separate bugs that only become dangerous when chained: an earlier format-string ' +
      'vulnerability that lets an attacker read arbitrary stack values, and a later buffer overflow that ' +
      'would normally be stopped cold by the compiler-inserted stack canary. On its own, the canary defeats ' +
      'the overflow — any corruption of its value is detected before the corrupted return address is ever ' +
      'used, and the process aborts. But the format-string bug earlier in the same execution leaks the ' +
      'exact canary value from the stack first, since a canary must be an unpredictable-but-fixed value for ' +
      'the DURATION of one process, not per-call — read it once via the leak, and the overflow can now ' +
      'include the correct canary bytes in exactly the right position, passing the integrity check the ' +
      'canary exists to enforce.',
    objectives: [
      { text: 'file canaryleak4', why: 'Confirms the binary format before analysis, same discipline as every static-analysis lab on this platform.' },
      { text: 'checksec --file=canaryleak4', why: 'Confirms a stack canary is actually present and enabled -- establishing that a naive overflow alone would not work, and that a leak is specifically required first.' },
      { text: 'gdb canaryleak4', why: 'The debugger session shows the format-string bug leaking the live canary value from the stack before the vulnerable buffer is ever touched.' },
      { text: 'Run ./canaryleak4 with the leaked canary value now that it is known', why: 'Supplying the correctly-leaked canary value is what lets the subsequent overflow pass the integrity check the canary exists to enforce -- without the leak step, this exact same value would be unguessable.' },
    ],
    hints: [
      'file canaryleak4',
      'checksec --file=canaryleak4',
      'gdb canaryleak4',
      'The GDB session leaks canary = 0x00a1b2c3d4e5f600 via the format string bug -- convert and supply it to ./canaryleak4 <value>',
    ],
    totalFlags: 1,
    attacker: attacker({
      canaryleak4: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped',
          '#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nPartial RELRO   Canary found      NX enabled    PIE disabled',
          '#GDB_SESSION:Breakpoint 1, 0x0000000000401203 in log_message ()\\n(gdb) x/gx $rbp-0x8\\n0x7ffe2b3c1018:\\t0x00a1b2c3d4e5f600\\n(gdb) # format string %p leak at this offset reads the stack canary directly, BEFORE the vulnerable strcpy() runs later in main()',
          '#CRACKME_PASSWORD:45514025410622976',
          '#CRACKME_SUCCESS:Overflow accepted -- leaked canary value matched, integrity check passed, return address overwritten.\\nflag{format_string_leak_defeats_stack_canary_protection}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },

  // 4 — Binary Analysis: Use-After-Free Function Pointer Hijack
  {
    id: 'binary-use-after-free-function-pointer',
    title: 'Reverse Engineering: Use-After-Free Hijacks a Function Pointer',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'handler5 frees a heap-allocated struct containing a function pointer after processing a request, but ' +
      'a dangling reference to that same freed chunk is used again later without being cleared — a classic ' +
      'use-after-free. Because the heap allocator commonly reuses freed memory for the very next allocation ' +
      'of a similar size, a request crafted to allocate attacker-controlled data of the right size right ' +
      'after the free lands in the exact same memory the dangling pointer still references — overwriting ' +
      'what used to be a legitimate function pointer with an address of the attacker\'s choosing. The next ' +
      'time the program calls through that now-hijacked pointer, it jumps to wherever the attacker put.',
    objectives: [
      { text: 'file handler5', why: 'Confirms the binary format before analysis.' },
      { text: 'objdump -d handler5', why: 'The disassembly shows the free() call followed by later reuse of the same pointer with no reallocation or NULL check in between -- the exact UAF pattern.' },
      { text: 'gdb handler5', why: 'The debugger session confirms the heap allocator reuses the just-freed chunk for the next allocation, and shows the exact memory address the dangling function pointer now needs to be overwritten with to redirect execution.' },
      { text: 'Run ./handler5 with the target hijack address now revealed by the debugger session', why: 'Supplying the address that the freed-and-reused chunk actually landed at is what completes the hijack -- the function pointer call now jumps exactly where the attacker groomed the heap to put it.' },
    ],
    hints: [
      'file handler5',
      'objdump -d handler5',
      'gdb handler5',
      'The GDB session shows the reused chunk lands at address 0x603120 -- convert and supply it to ./handler5 <value>',
    ],
    totalFlags: 1,
    attacker: attacker({
      handler5: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped',
          '#OBJDUMP:0000000000401290 <process_request>:\\n  4012a0:  call   401050 <free@plt>\\n  4012a8:  mov    -0x8(%rbp),%rax\\n  4012ac:  call   *0x10(%rax)   # <-- dangling pointer still dereferenced and called, no NULL/reuse check',
          '#GDB_SESSION:Breakpoint 1, 0x00000000004012ac in process_request ()\\n(gdb) x/gx $rax\\n0x603120:\\t0x0000000000401450\\n(gdb) # heap allocator reused this freed chunk for the attacker-controlled request right after -- 0x603120 is where the dangling pointer now resolves',
          '#CRACKME_PASSWORD:6304032',
          '#CRACKME_SUCCESS:Hijack confirmed -- the freed-and-reused chunk address matched, function pointer call redirected to attacker-controlled data.\\nflag{use_after_free_hijacked_function_pointer_via_heap_reuse}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },

  // 5 — Forensics: Volume Shadow Copy Abuse for Credential Dumping
  {
    id: 'forensics-vss-ntds-credential-dump',
    title: 'Forensics: Volume Shadow Copy Abuse to Dump NTDS.dit',
    difficulty: 'Hard',
    category: 'Forensics',
    briefing:
      'A domain controller\'s process logs show vssadmin.exe creating a volume shadow copy, followed almost ' +
      'immediately by ntdsutil.exe referencing that same shadow copy path. Neither tool is malware — both ' +
      'are legitimate, signed Windows administration utilities. But NTDS.dit (the file holding every domain ' +
      'account\'s password hash) and the SYSTEM registry hive it needs to decrypt those hashes are both ' +
      'locked while Windows is running, making them impossible to copy directly — creating a point-in-time ' +
      'shadow copy is the standard, well-documented way to read a locked file\'s contents anyway, entirely ' +
      'through APIs Windows itself exposes. Attackers (including nation-state groups in real, publicly ' +
      'attributed intrusions) abuse this exact legitimate backup mechanism to exfiltrate every credential in ' +
      'the domain in one shot, without ever touching a single unsigned or flagged binary.',
    objectives: [
      { text: 'cat process-events.txt', why: 'A SOC/DFIR analyst starts from the process execution timeline -- confirming the exact sequence of legitimate tools that, together, add up to a credential-dumping technique.' },
      { text: 'grep -i "vssadmin|ntdsutil" process-events.txt', why: 'Isolating just these two tool invocations from the noise of normal DC administrative activity is what turns a long process log into a clear attack narrative.' },
      { text: 'Identify the exact shadow-copy path referenced and confirm NTDS.dit/SYSTEM hive were both copied from it, then capture the flag', why: 'Confirming both files were pulled from the SAME shadow copy is what proves the attacker had everything needed to decrypt every password hash in the domain offline, not just a partial artifact.' },
    ],
    hints: [
      'cat process-events.txt',
      'grep -i "vssadmin|ntdsutil" process-events.txt',
      'The flag is on the analyst summary line confirming both NTDS.dit and the SYSTEM hive were pulled from the same shadow copy.',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'process-events.txt': file(
          [
            '2026-07-30 02:11:02  DC01  svchost.exe          started by SYSTEM',
            '2026-07-30 02:11:40  DC01  taskhostw.exe         started by SYSTEM',
            '2026-07-30 02:14:12  DC01  vssadmin.exe          "vssadmin create shadow /for=C:"  <-- creates shadow copy \\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopy7',
            '2026-07-30 02:14:19  DC01  cmd.exe                started by admin_svc',
            '2026-07-30 02:14:26  DC01  ntdsutil.exe           "activate instance ntds" then "ifm" "create full C:\\temp\\ifm_dump"  <-- reads from \\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopy7\\Windows\\NTDS\\ntds.dit',
            '2026-07-30 02:14:31  DC01  ntdsutil.exe           copies \\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopy7\\Windows\\System32\\config\\SYSTEM to C:\\temp\\ifm_dump\\registry\\SYSTEM',
            '2026-07-30 02:14:52  DC01  vssadmin.exe           "vssadmin delete shadows /for=C: /quiet"  <-- shadow copy deleted immediately after, standard cleanup step',
            '--- ANALYST NOTE: both ntds.dit (every domain password hash) and the SYSTEM hive (the boot key needed',
            '    to decrypt those hashes offline) were pulled from the SAME shadow copy created seconds earlier --',
            '    a complete offline domain credential dump using only signed, legitimate Windows administration tools.',
            '    flag{vss_abuse_ntds_dit_and_system_hive_dumped_via_shadow_copy} ---',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },

  // 6 — Forensics: NTFS Timestomping Detection via $SI/$FN Mismatch
  {
    id: 'forensics-ntfs-timestomping-si-fn-mismatch',
    title: 'Forensics: Detecting NTFS Timestomping via $SI/$FN Mismatch',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'A suspicious executable\'s file properties show a creation date from three years ago — seemingly ' +
      'proving it was already present long before the intrusion window. Every NTFS file, though, actually ' +
      'carries TWO independent sets of timestamps: $STANDARD_INFORMATION (the one Windows Explorer and most ' +
      'tools display, freely modifiable through documented Win32 APIs) and $FILE_NAME (written directly by ' +
      'the kernel, NOT modifiable through those same standard APIs). Common "timestomping" tools rewrite ' +
      'only the first set, leaving the second — kernel-controlled, rarely checked — completely unmodified. ' +
      'Comparing the two directly against each other for the same file is the single most reliable, ' +
      'widely-documented indicator of timestamp manipulation in NTFS forensics.',
    objectives: [
      { text: 'cat mft-record-export.txt', why: 'A raw MFT record export shows BOTH timestamp attributes for the suspicious file side by side -- the same view an examiner would get from a real tool like MFTECmd.' },
      { text: 'grep -A2 "STANDARD_INFORMATION|FILE_NAME" mft-record-export.txt', why: 'Isolating both attribute blocks makes the direct comparison explicit instead of scanning a full raw record by eye.' },
      { text: 'Identify the exact discrepancy between the two timestamp sets and capture the flag', why: 'A file whose kernel-written $FILE_NAME creation time is recent, while its user-facing $STANDARD_INFORMATION creation time claims to be years older, is the textbook timestomping signature -- confirming the file was planted recently and its metadata deliberately backdated.' },
    ],
    hints: [
      'cat mft-record-export.txt',
      'grep -A2 "STANDARD_INFORMATION|FILE_NAME" mft-record-export.txt',
      'The $FILE_NAME creation timestamp (kernel-written, not modifiable via standard APIs) is only hours old; $STANDARD_INFORMATION claims 3 years -- that mismatch is the flag.',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'mft-record-export.txt': file(
          [
            'MFT record export -- C:\\Windows\\Temp\\svchost_update.exe (extracted via MFTECmd-style tool)',
            '',
            '$STANDARD_INFORMATION attribute (user/API-modifiable):',
            '  Created:  2023-08-14 09:02:11 UTC',
            '  Modified: 2023-08-14 09:02:11 UTC',
            '',
            '$FILE_NAME attribute (kernel-written, NOT modifiable via standard Win32 timestomping APIs):',
            '  Created:  2026-07-30 02:09:44 UTC',
            '  Modified: 2026-07-30 02:09:44 UTC',
            '',
            '--- ANALYST NOTE: a 3-year discrepancy between $STANDARD_INFORMATION (claims 2023) and $FILE_NAME',
            '    (kernel-confirmed 2026-07-30, hours before the incident window began) is the textbook $SI/$FN',
            '    mismatch signature of NTFS timestomping -- the file was planted recently and its user-facing',
            '    timestamp deliberately backdated to blend in with legitimate, years-old system files.',
            '    flag{ntfs_si_fn_timestamp_mismatch_reveals_timestomping} ---',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
];
