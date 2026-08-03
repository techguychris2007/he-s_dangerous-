import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analystBox(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'malware-lab', user: 'root', root: dir(files) };
}

/** Batch 6. Explicit brief this round: for every lab, would the described technique and exact command
 *  syntax genuinely work against a real target, not just read plausibly? Verified via web research before
 *  writing each one (see NOTES.md) -- real SPF/DMARC record syntax and semantics, real Stripe webhook HMAC
 *  mechanics, real SMTP open-relay test commands, real Azure SAS token URL-query-string usage (no special
 *  CLI needed -- that's how SAS tokens actually work), and real ret2libc offset arithmetic (computed with
 *  Node, not by hand, after two earlier batches caught hand-computed hex/decimal mistakes). Three labs
 *  (SPF/DMARC, SMTP relay, Azure SAS) use the established curl-mirrors-the-real-protocol convention where
 *  this engine has no dedicated command for the real protocol involved (this engine's own `dig` only
 *  resolves lab hostnames to A records -- confirmed by reading engine.ts, not assumed -- so a literal
 *  `dig TXT` objective would not have worked) -- documented honestly in NOTES.md, same as the SNMP/AXFR
 *  precedent, not presented as if a real `dig`/`telnet`/`az` session were being simulated end to end. */
export const realismBatchLabs: LabScenario[] = [
  // 1 — Security+: SPF/DKIM/DMARC Misconfiguration Enables Email Spoofing
  {
    id: 'securityplus-spf-dmarc-spoofing-audit',
    title: 'Security+: SPF/DMARC Misconfiguration Enables Email Spoofing',
    difficulty: 'Medium',
    category: 'Security+',
    briefing:
      'Meridian Corp asked for an audit of why spoofed "invoice past due" emails claiming to be from ' +
      'billing@meridiancorp.example keep reaching employee inboxes despite the company having SPF and ' +
      'DMARC records published. Having a record at all is not the same as having one that actually enforces ' +
      'anything: an SPF record ending in a soft-fail or neutral qualifier only suggests unauthorized senders ' +
      'are suspicious, and a DMARC policy of "p=none" is explicitly monitoring-only — it tells receiving ' +
      'mail servers to do nothing differently even when SPF and DKIM both fail. This exact combination ' +
      '(a published-but-non-enforcing policy pair) is one of the most common real email-security audit ' +
      'findings, and DMARC alignment enforcement became a mandatory, auditable requirement (not just best ' +
      'practice) as of March 2025.',
    objectives: [
      { text: 'nmap -sV -p 53 10.10.218.2', why: 'Confirms the authoritative name server before querying it for the SPF and DMARC TXT records.' },
      {
        text: 'curl "10.10.218.2:53/txt?domain=meridiancorp.example"',
        why: 'Mirrors running dig TXT meridiancorp.example (for the SPF record) and dig TXT _dmarc.meridiancorp.example (for the DMARC record, published at that fixed, well-known subdomain every real mail server checks) — both records for this domain come back together, exactly what a real SPF/DMARC audit reviews side by side.',
      },
      { text: 'Identify the specific SPF qualifier and DMARC policy value that together explain why spoofed mail is not being rejected, then capture the flag', why: 'Naming the exact two misconfigurations (not just "email security is bad") is what turns this into an actionable remediation: tighten the SPF qualifier to -all and raise the DMARC policy to at least p=quarantine.' },
    ],
    hints: [
      'nmap -sV -p 53 10.10.218.2',
      'curl "10.10.218.2:53/txt?domain=meridiancorp.example" -- mirrors dig TXT for both the root domain (SPF) and the _dmarc subdomain (DMARC).',
      'The SPF record ends in "?all" (neutral -- explicitly says "treat unauthorized senders as inconclusive"), and the DMARC record is "p=none" (monitor only, enforces nothing) -- that combination is the flag.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'ns1-meridiancorp',
        ip: '10.10.218.2',
        os: 'Ubuntu 22.04 (BIND 9, authoritative for meridiancorp.example)',
        services: [
          {
            port: 53,
            name: 'domain',
            version: 'BIND 9.18',
            http: {},
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/txt',
                param: 'domain',
                triggerSubstrings: ['meridiancorp.example'],
                vulnerableResponse:
                  'meridiancorp.example.        IN TXT  "v=spf1 include:_spf.google.com ?all"\n' +
                  '_dmarc.meridiancorp.example.  IN TXT  "v=DMARC1; p=none; rua=mailto:dmarc@meridiancorp.example"\n' +
                  '--- SPF qualifier "?all" (neutral) + DMARC "p=none" (monitor only) = spoofed mail is never rejected ---\n' +
                  'flag{spf_neutral_qualifier_and_dmarc_p_none_permit_email_spoofing}',
                normalResponse: '; no TXT records found for that domain',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — Security Engineering: Forged Webhook via Missing Signature Verification
  {
    id: 'secengineering-forged-webhook-missing-signature',
    title: 'Security Engineering: Forged Payment Webhook via Missing Signature Verification',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      'Shopsvc47\'s order-fulfillment service listens for "checkout.session.completed" webhook events from ' +
      'its payment processor to mark orders as paid and release them for shipping. Real payment processors ' +
      '(Stripe among them) sign every webhook delivery with HMAC-SHA256 over the raw request body, sent in a ' +
      'signature header — the entire point being that the receiving endpoint can prove a request genuinely ' +
      'came from the payment processor and was not forged by anyone who simply knows (or guesses) the ' +
      'webhook URL. This endpoint accepts and processes every incoming webhook payload without checking that ' +
      'signature at all — a real, repeatedly-disclosed vulnerability class (including a CVE as recent as ' +
      'early 2026 where an EMPTY signing secret let an attacker forge a valid-looking signature with zero ' +
      'knowledge of the real one). A POST with a fabricated "payment succeeded" event, no valid signature ' +
      'required, marks an unpaid order as fully paid.',
    objectives: [
      { text: 'nmap -sV 10.10.219.2', why: 'Confirms the order-fulfillment webhook endpoint before probing whether it actually verifies the payment processor\'s signature.' },
      { text: 'cat webhook-handler-notes.txt', why: 'Confirms the handler reads and trusts the event payload directly with no HMAC signature check anywhere in the code path — the exact real vulnerability class, not a hypothetical.' },
      {
        text: 'curl -X POST -d "event_type=checkout.session.completed&order_id=ORD-88291&payment_status=paid" http://10.10.219.2/webhooks/payment',
        why: 'This forged event was never signed by the real payment processor at all -- no signature header, no HMAC, nothing -- and the endpoint marks the order paid anyway, because it never checked for one in the first place.',
      },
    ],
    hints: [
      'nmap -sV 10.10.219.2',
      'cat webhook-handler-notes.txt',
      'curl -X POST -d "event_type=checkout.session.completed&order_id=ORD-88291&payment_status=paid" http://10.10.219.2/webhooks/payment',
    ],
    totalFlags: 1,
    attacker: attacker({
      'webhook-handler-notes.txt': file(
        'shopsvc47 webhook handler (from an internal code excerpt):\n' +
          '  @app.route("/webhooks/payment", methods=["POST"])\n' +
          '  def handle_webhook():\n' +
          '      event = request.form  # <-- read directly, no signature header checked anywhere\n' +
          '      if event["event_type"] == "checkout.session.completed":\n' +
          '          mark_order_paid(event["order_id"])\n' +
          '  # a real payment processor signs every delivery (HMAC-SHA256 over the raw body) specifically\n' +
          '  # so a receiving endpoint can prove a request came from them, not from anyone who knows the URL\n',
      ),
    }),
    network: [
      {
        hostname: 'shopsvc47',
        ip: '10.10.219.2',
        os: 'Ubuntu 22.04 (order-fulfillment webhook receiver)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Flask 3.0 (Python, no webhook signature verification)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/webhooks/payment',
                param: 'payment_status',
                triggerSubstrings: ['paid'],
                vulnerableResponse: '{"status":"order_updated","order_id":"ORD-88291","payment_status":"paid","note":"flag{forged_webhook_missing_signature_verification_marks_order_paid}"}',
                normalResponse: '{"status":"ignored","reason":"unrecognized event"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Network: SMTP Open Relay Abuse
  {
    id: 'net-smtp-open-relay-abuse',
    title: 'SMTP Open Relay Lets an Outsider Send Mail as Anyone',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'Mailsvc19 accepts a MAIL FROM/RCPT TO sequence for ANY sender and ANY recipient domain, with no ' +
      'authentication and no check that the connecting client is actually authorized to relay through it — ' +
      'a classic open relay. The real, standard way to test for this is a raw SMTP conversation over ' +
      'telnet/nc: HELO, then MAIL FROM with a completely unrelated external domain, then RCPT TO with ' +
      'another external domain neither party controls. A properly configured server rejects this immediately ' +
      'with "550 Relaying denied"; an open relay responds "250 OK" and queues the message for delivery — at ' +
      'which point the server has just been turned into a free, fully-anonymous spam and phishing relay by ' +
      'anyone on the internet who finds it.',
    objectives: [
      { text: 'nmap -sV 10.10.220.2', why: 'Confirms the mail server and its exposed SMTP port before attempting a relay test.' },
      { text: 'nc 10.10.220.2 25', why: 'Connecting directly to port 25 and reading the banner is the real first step of manual SMTP testing — confirms the exact server software before sending any protocol commands.' },
      {
        text: 'curl -X POST -d "mail_from=attacker@totallyunrelated.example&rcpt_to=victim@anothercompany.example" http://10.10.220.2:25/smtp-relay-test',
        why: 'This mirrors the real telnet/nc test: HELO, then MAIL FROM an external domain, then RCPT TO a completely different external domain, neither one belonging to mailsvc19 or to each other -- exactly the "no relationship to this server at all" combination a real open-relay test uses. A 250 OK response here (instead of 550 Relaying denied) confirms the relay is open to anyone.',
      },
    ],
    hints: [
      'nmap -sV 10.10.220.2',
      'nc 10.10.220.2 25',
      'curl -X POST -d "mail_from=attacker@totallyunrelated.example&rcpt_to=victim@anothercompany.example" http://10.10.220.2:25/smtp-relay-test',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'mailsvc19',
        ip: '10.10.220.2',
        os: 'Ubuntu 20.04 (Postfix, relay restrictions misconfigured)',
        services: [
          {
            port: 25,
            name: 'smtp',
            banner: '220 mailsvc19.example ESMTP Postfix',
            version: 'Postfix 3.4 (smtpd_relay_restrictions not set -- defaults to permissive)',
            http: {},
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/smtp-relay-test',
                param: 'rcpt_to',
                triggerSubstrings: ['anothercompany.example'],
                vulnerableResponse:
                  '250 2.1.0 attacker@totallyunrelated.example... Sender ok\n' +
                  '250 2.1.5 victim@anothercompany.example... Recipient ok\n' +
                  '--- neither sender nor recipient domain has any relationship to mailsvc19 -- relay accepted ---\n' +
                  'flag{smtp_open_relay_accepts_unrelated_sender_and_recipient}',
                normalResponse: '550 5.7.1 Relaying denied for anothercompany.example',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 4 — Cloud: Azure Storage Account SAS Token Overly Permissive
  {
    id: 'cloud-azure-sas-token-overly-permissive',
    title: 'Cloud: Overly Permissive, Long-Lived Azure SAS Token Leaks Blob Data',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'A Shared Access Signature (SAS) token found hardcoded in a leaked internal script grants access to an ' +
      'Azure Storage account — and unlike a typical scoped credential, everything a SAS token authorizes is ' +
      'encoded directly in its own URL query string: which resources (sr=), which permissions (sp=), and ' +
      'critically, when it expires (se=). No special Azure CLI or SDK is required to use one at all — a SAS ' +
      'URL is just a normal HTTPS GET request with that query string attached, which is exactly what makes a ' +
      'leaked one so dangerous. This particular token was generated with sp=rwdl (read, write, delete, AND ' +
      'list — full read-write control, not just read access) and se= set two years in the future — real, ' +
      'repeatedly-documented Azure security research (including Microsoft\'s own 2023 incident involving a ' +
      '38TB internal data exposure) names exactly this combination, overly broad permissions plus a ' +
      'near-unlimited lifetime, as the standard real-world SAS token failure mode.',
    objectives: [
      { text: 'cat leaked-deploy-script.txt', why: 'Confirms where the SAS token was found and exactly what permissions/expiry it was generated with -- everything a SAS token authorizes is visible directly in its own query string, no separate lookup needed.' },
      {
        text: 'curl "10.10.221.2:443/backups/customer-export.csv?sv=2023-11-03&ss=b&srt=sco&sp=rwdl&se=2028-01-01T00:00:00Z&sig=fake9f3e2c81b7a4"',
        why: 'No Azure CLI, no account key, no login of any kind is needed here -- the SAS token IS the credential, fully self-contained in the URL, and this one authorizes read/write/delete/list access until 2028. (This lab targets the storage endpoint\'s IP directly; a real SAS URL uses the account\'s *.blob.core.windows.net hostname the same way, shown in the leaked script above.)',
      },
    ],
    hints: [
      'cat leaked-deploy-script.txt',
      'curl "10.10.221.2:443/backups/customer-export.csv?sv=2023-11-03&ss=b&srt=sco&sp=rwdl&se=2028-01-01T00:00:00Z&sig=fake9f3e2c81b7a4"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'leaked-deploy-script.txt': file(
        'deploy-backup.sh (found in a public gist, since deleted -- already cached/cloned before removal):\n' +
          '#!/bin/bash\n' +
          'SAS_URL="https://meridiancorpdata.blob.core.windows.net/backups/customer-export.csv?sv=2023-11-03&ss=b&srt=sco&sp=rwdl&se=2028-01-01T00:00:00Z&sig=fake9f3e2c81b7a4"\n' +
          'curl -X PUT --upload-file ./export.csv "$SAS_URL"\n' +
          '# sp=rwdl -> read+write+delete+list (NOT scoped to read-only)\n' +
          '# se=2028-01-01 -> valid for years, not the ~1 hour Microsoft itself recommends for SAS tokens\n',
      ),
    }),
    network: [
      {
        hostname: 'meridiancorpdata-blob',
        ip: '10.10.221.2',
        os: 'Cloud object storage (Azure Blob Storage-compatible)',
        services: [
          {
            port: 443,
            name: 'https',
            version: 'Azure Blob Storage (SAS token access, no separate authentication)',
            http: {
              '/backups/customer-export.csv':
                'name,email,account_balance\nJ. Alvarez,jalvarez@meridiancorp.example,4820.00\n-- flag{overly_permissive_long_lived_sas_token_leaks_blob_data}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Binary Analysis: ret2libc Defeating ASLR via a Leaked libc Address
  {
    id: 'binary-ret2libc-aslr-defeat',
    title: 'Reverse Engineering: ret2libc — Defeating ASLR With a Leaked libc Address',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'libcpwn6 is compiled with NX (the stack is non-executable, so shellcode injection is off the table) ' +
      'and runs on a system with ASLR enabled (every shared library, including libc, loads at a randomized ' +
      'base address each run). Neither mitigation stops ret2libc: an earlier format-string bug in the same ' +
      'binary leaks the RUNTIME-resolved address of puts() from the GOT (Global Offset Table). Because ' +
      'every function\'s position RELATIVE to every other function inside one specific libc build never ' +
      'changes — only the base address that whole library loads at is randomized — subtracting puts\'s known ' +
      'fixed offset-within-libc from the leaked runtime address recovers the actual libc base for THIS run, ' +
      'and from that base, the real address of system() follows from simple addition. No shellcode is ever ' +
      'injected at all — the exploit just redirects execution to a function libc already provides.',
    objectives: [
      { text: 'file libcpwn6', why: 'Confirms the binary format before analysis.' },
      { text: 'checksec --file=libcpwn6', why: 'Confirms NX is enabled (ruling out classic shellcode injection) and ASLR is in effect for this target -- establishing exactly why an address leak is required first, not optional.' },
      { text: 'gdb libcpwn6', why: 'The debugger session shows the format-string bug leaking puts()\'s actual runtime address from the GOT, and the analysis notes give puts\'s fixed offset within this specific libc build.' },
      { text: 'cat libc-offset-notes.txt', why: 'Confirms the exact arithmetic: libc_base = leaked_puts_address - puts_offset, then system_address = libc_base + system_offset -- the real technique every ret2libc-against-ASLR exploit uses, whether by hand or via a tool like pwntools.' },
      { text: 'Compute the address of system() and run ./libcpwn6 with it', why: 'Supplying the correctly-computed system() address is what completes the exploit -- proving the leaked address, the offset arithmetic, and the resulting libc base were all correct.' },
    ],
    hints: [
      'file libcpwn6',
      'checksec --file=libcpwn6',
      'gdb libcpwn6',
      'cat libc-offset-notes.txt',
      'libc_base = 0x7f2a3b545420 - 0x84420 = 0x7f2a3b4c1000; system = libc_base + 0x50d70 -- convert the result to decimal and supply it to ./libcpwn6 <value>',
    ],
    totalFlags: 1,
    attacker: attacker({
      libcpwn6: file(
        [
          '#FILETYPE: ELF 64-bit LSB pie executable, x86-64, dynamically linked, not stripped',
          '#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nPartial RELRO   No canary found    NX enabled    PIE enabled (ASLR active)',
          '#GDB_SESSION:Breakpoint 1, 0x0000000000401198 in leak_puts_address ()\\n(gdb) x/gx $rax\\n0x7ffe1a2b3c40:\\t0x00007f2a3b545420\\n(gdb) # this is the RUNTIME-resolved address of puts(), read from the GOT via the format-string leak',
          '#CRACKME_PASSWORD:139819360525680',
          '#CRACKME_SUCCESS:Redirected execution to system() -- no shellcode injected, NX and ASLR both defeated via the leaked address alone.\\nflag{ret2libc_defeats_nx_and_aslr_via_leaked_libc_address}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
      'libc-offset-notes.txt': file(
        'libc offset analysis for this target build (from readelf -s libc.so.6, conceptually):\n' +
          '  puts   offset within libc:   0x84420\n' +
          '  system offset within libc:   0x50d70\n' +
          '  leaked puts() runtime address (from the GDB session): 0x7f2a3b545420\n' +
          '\n' +
          '  libc_base = leaked_puts_address - puts_offset\n' +
          '            = 0x7f2a3b545420 - 0x84420\n' +
          '            = 0x7f2a3b4c1000\n' +
          '\n' +
          '  system_address = libc_base + system_offset\n' +
          '                 = 0x7f2a3b4c1000 + 0x50d70\n' +
          '                 = 0x7f2a3b511d70   (decimal: 139819360525680)\n',
      ),
    }),
    network: [],
  },

  // 6 — Malware Analysis: DLL Sideloading Detection
  {
    id: 'malware-dll-sideloading-search-order',
    title: 'Malware Analysis: Detecting DLL Sideloading via Search Order Hijacking',
    difficulty: 'Hard',
    category: 'Malware',
    briefing:
      'A legitimate, correctly-signed application executable loaded a DLL that turns out to be malicious — ' +
      'without the executable itself ever being modified or re-signed at all. Windows resolves a DLL load ' +
      'request by checking a defined search order, and the application\'s own directory is checked BEFORE ' +
      'the trusted System32 directory for many DLL names. DLL sideloading (and its close cousin, search ' +
      'order hijacking) abuses exactly this: drop a maliciously-named DLL matching one the legitimate EXE ' +
      'imports into the SAME folder as that legitimate, signed EXE, and Windows loads the attacker\'s version ' +
      'first — the legitimate program unknowingly executes attacker code, entirely through its own normal, ' +
      'expected DLL-loading behavior. This remains a favorite technique among real APT groups specifically ' +
      'because the process that ends up executing malicious code is a trusted, signed binary, which is ' +
      'exactly what makes it evade a lot of naive signature-based detection.',
    objectives: [
      { text: 'cat process-dll-loads.txt', why: 'A DLL-load event log (the real artifact Sysmon Event ID 7 captures) is the starting point for spotting this technique -- a hollowed EXE gives no outward sign in a basic process listing at all.' },
      { text: 'cat file-locations.txt', why: 'Confirms exactly where each DLL actually loaded FROM -- the real detection signal is a known system DLL name loading from anywhere other than its expected System32 path.' },
      { text: 'Identify the sideloaded DLL, its non-standard load path, and capture the flag', why: 'Naming the exact DLL and its actual (wrong) directory is what lets a responder both remove the malicious file and identify which legitimate EXE was abused as the sideloading vector -- both are needed for a complete remediation.' },
    ],
    hints: [
      'cat process-dll-loads.txt',
      'cat file-locations.txt',
      'version.dll is a real Windows system DLL that should only ever load from System32 -- here it loads from the same user-writable folder as the legitimate signed EXE instead. That mismatch is the flag.',
    ],
    totalFlags: 1,
    attacker: analystBox({
      root: dir({
        'process-dll-loads.txt': file(
          [
            'Sysmon Event ID 7 (Image Loaded) excerpt, PID 5502 (UpdateHelper.exe, Microsoft-signed):',
            '  09:41:02  Loaded: C:\\Windows\\System32\\kernel32.dll',
            '  09:41:02  Loaded: C:\\Windows\\System32\\ntdll.dll',
            '  09:41:03  Loaded: C:\\Users\\jsmith\\Downloads\\UpdateTool\\version.dll   <-- NOT the System32 copy',
            '  09:41:05  Outbound connection to 185.220.101.44:443 initiated by UpdateHelper.exe',
          ].join('\n'),
          '-rw-r--r--',
        ),
        'file-locations.txt': file(
          [
            'File inventory for C:\\Users\\jsmith\\Downloads\\UpdateTool\\:',
            '  UpdateHelper.exe   -- genuinely Microsoft-signed, valid signature, unmodified',
            '  version.dll         -- present in this SAME folder, NOT the legitimate System32\\version.dll',
            '',
            'Expected legitimate location for version.dll:  C:\\Windows\\System32\\version.dll  (Microsoft-signed)',
            'Actual location this process loaded it from:    C:\\Users\\jsmith\\Downloads\\UpdateTool\\version.dll',
            '',
            '--- UpdateHelper.exe is legitimate and unmodified -- it was tricked into loading an',
            '    attacker-supplied version.dll from its own folder because Windows checks the',
            '    application directory before System32 in its DLL search order (classic sideloading) ---',
            'flag{dll_sideloading_version_dll_loaded_from_non_system32_path}',
          ].join('\n'),
          '-rw-r--r--',
        ),
      }),
    }),
    network: [],
  },
];
