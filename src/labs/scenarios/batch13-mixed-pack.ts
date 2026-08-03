import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

/** Batch 13. Same explicit steer as batch 12: every lab should be something that works verbatim against a
 *  real Kali box and the described real target -- this platform's `TerminalEngine` is a safe, simulated
 *  bridge for practicing that exact command syntax, not a different technique. Where the real command
 *  can't be live-simulated by this engine (no live LDAP/Azure-CLI/crt.sh HTTP client), the real command is
 *  still spelled out explicitly and the interaction is modeled as a captured-output file review instead of
 *  faking a live protocol this engine doesn't actually have -- see NOTES.md batch 13 for an explicit,
 *  per-lab "would this work on a real Kali box" answer for all six. */
export const batch13MixedLabs: LabScenario[] = [
  // 1 — Binary Analysis: Classic Stack Smash — ret2win Redirects to a Hidden Function
  {
    id: 'binary-stack-smash-ret2win-hidden-function',
    title: 'Reverse Engineering: Classic Stack Smash — ret2win Redirects to a Hidden Function',
    difficulty: 'Medium',
    category: 'Binary Analysis',
    briefing:
      'winvault3 is the textbook exploit this session\'s other Binary Analysis labs have all built on top ' +
      'of, but never demonstrated in its purest form: a fixed-size stack buffer with no bounds checking, no ' +
      'stack canary, and PIE disabled, sitting right below the function\'s saved return address on the ' +
      'stack. Overflowing that buffer by exactly the right amount overwrites the return address itself with ' +
      'the address of a hidden win() function that\'s compiled into the binary but never called by any ' +
      'normal code path -- when the vulnerable function returns, execution jumps straight into win() ' +
      'instead of back to main(). Critically, this works even with NX (the no-execute stack protection) ' +
      'fully enabled, because the exploit never injects or runs new shellcode at all -- it only redirects ' +
      'control flow to code that already legitimately exists in the binary\'s own executable segment. This ' +
      'is the exact "Smashing the Stack for Fun and Profit" foundation every ROP chain and ret2libc ' +
      'technique builds on top of.',
    objectives: [
      { text: 'file winvault3', why: 'Confirms the binary format before analysis, same discipline as every static-analysis lab on this platform.' },
      { text: 'checksec --file=winvault3', why: 'No canary and PIE disabled are exactly what makes a direct return-address overwrite possible at all -- a canary would abort before the corrupted return address is ever used, and PIE would randomize win()\'s address on every run.' },
      { text: 'objdump -d winvault3', why: 'Shows the vulnerable buffer\'s exact size (the offset needed before the return address itself is reached) and confirms win() is real, compiled code that simply has no caller anywhere in the normal program flow.' },
      { text: 'gdb winvault3', why: 'Confirms win()\'s exact fixed address (reliable specifically because PIE is disabled) before committing to the exploit.' },
      { text: 'Compute the win() address and run ./winvault3 with it', why: 'Supplying the correct decimal address is what completes the exploit -- overwriting the saved return address so the function returns directly into win() instead of back to its real caller.' },
    ],
    hints: [
      'file winvault3',
      'checksec --file=winvault3',
      'objdump -d winvault3',
      'gdb winvault3',
      'win() lives at 0x4011a6 -- convert to decimal and supply it to ./winvault3 <value>',
    ],
    totalFlags: 1,
    attacker: attacker({
      winvault3: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped',
          '#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nPartial RELRO    No canary found    NX enabled    PIE disabled',
          '#OBJDUMP:0000000000401180 <vulnerable_read>:\\n  401189:  sub    rsp,0x40             # 64-byte local buffer, no size check on the read that follows\\n  401194:  call   401050 <gets@plt>    # classic unbounded read -- straight past the 64-byte buffer into the saved return address\\n00000000004011a6 <win>:\\n  4011a6:  ...    # real, compiled code -- prints the flag -- but grep the whole binary and nothing ever calls it',
          '#GDB_SESSION:(gdb) print win\\n$1 = {<text variable, no debug info>} 0x4011a6 <win>\\n(gdb) disassemble vulnerable_read\\n   0x0000000000401189 <+9>:\\tsub    rsp,0x40\\n   0x0000000000401194 <+20>:\\tcall   0x401050 <gets@plt>\\n(gdb) # buffer is 64 bytes; the saved RBP is the next 8, then the saved return address -- 72 bytes of\\n(gdb) # junk padding before the 8-byte overwrite lands exactly on the return address slot',
          '#CRACKME_PASSWORD:4198822',
          '#CRACKME_SUCCESS:72 bytes of padding followed by win()\\\'s address overwrote the saved return address -- vulnerable_read() returned straight into win() instead of back to main().\\nflag{ret2win_classic_stack_smash_no_canary_no_pie_redirects_to_hidden_function}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },

  // 2 — Cloud: Azure Storage Account Key Exposure Grants Full Shared-Key Access
  {
    id: 'cloud-azure-storage-account-key-exposure',
    title: 'Cloud: An Exposed Azure Storage Account Key Grants Full Shared-Key Access',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'A CI pipeline\'s build log for coldarchive19 was left world-readable and includes a debug echo of an ' +
      'environment variable that should never have been printed at all: the storage account\'s primary ' +
      'access key. This is meaningfully more powerful than the overly-permissive SAS token this session ' +
      'already covers elsewhere -- a SAS token is a scoped, time-limited delegation, but the account access ' +
      'key IS the master credential Azure hands out for Shared Key authorization, and by default every new ' +
      'storage account is created with Shared Key auth enabled (Microsoft\'s own docs recommend disabling it ' +
      'in favor of Azure AD auth, but it stays on unless an admin explicitly turns it off). Anyone holding ' +
      'this key can authenticate as the storage account itself against every container, with full read, ' +
      'write, and delete rights -- the real tool for this on a Kali box is the Azure CLI (az storage blob ' +
      'list/download --account-name ... --account-key ...), since Shared Key auth requires an HMAC-SHA256 ' +
      'canonicalized-request signature the az CLI computes for you -- not something a bare curl command can ' +
      'produce without reimplementing Azure\'s signing algorithm by hand.',
    objectives: [
      { text: 'cat ci-pipeline-build-log.txt', why: 'Confirms the exact leaked credential -- the storage account\'s primary access key, echoed in plaintext by a debug step that should never have printed it.' },
      { text: 'cat az-storage-blob-list-output.txt', why: 'Captured output of the real command this key enables -- az storage blob list --account-name coldarchive19 --account-key <key> --container-name financial-archive -- confirming full authenticated access to every blob in the container, not just that the key looks plausible.' },
    ],
    hints: [
      'cat ci-pipeline-build-log.txt',
      'cat az-storage-blob-list-output.txt',
      'Real command this output was captured from: az storage blob list --account-name coldarchive19 --account-key <key> --container-name financial-archive --output table',
    ],
    totalFlags: 1,
    attacker: attacker({
      'ci-pipeline-build-log.txt': file(
        'Jenkins build log, job "coldarchive19-nightly-sync", build #482 (left world-readable):\n' +
          '  + echo "Using storage key: $AZURE_STORAGE_KEY"\n' +
          '  Using storage key: 9f8b3c1e7a2d4f6094b1c8e5a7d3f2b1c6e8a4d9f7b2c5e1a8d4f6b9c3e7a2d1AzSt==\n' +
          '  -- a debug echo statement never meant to survive past a local dev run, left in the pipeline script\n' +
          '     and printing the storage account\'s PRIMARY access key -- not a SAS token -- directly into a\n' +
          '     build log with no access restriction at all --\n',
      ),
      'az-storage-blob-list-output.txt': file(
        '$ az storage blob list --account-name coldarchive19 --account-key 9f8b3c1e7a2d4f6094b1c8e5a7d3f2b1c6e8a4d9f7b2c5e1a8d4f6b9c3e7a2d1AzSt== --container-name financial-archive --output table\n' +
          'Name                          Blob Type    Blob Tier    Length    Content Type\n' +
          '----------------------------  -----------  -----------  --------  ----------------\n' +
          'q3-2026-ledger-export.csv     BlockBlob    Hot          884213    text/csv\n' +
          'vendor-payment-batch-914.csv  BlockBlob    Hot          221904    text/csv\n' +
          '-- account-key (Shared Key) auth grants full read/write/delete on every container in this storage\n' +
          '   account -- meaningfully broader than a scoped, time-limited SAS token --\n' +
          'flag{azure_storage_account_key_leaked_build_log_grants_full_shared_key_access}\n',
      ),
    }),
    network: [],
  },

  // 3 — SOC: Illicit OAuth Consent Grant Survives a Password Reset
  {
    id: 'soc-illicit-oauth-consent-grant-detection',
    title: 'SOC: An Illicit OAuth Consent Grant Survives a Password Reset',
    difficulty: 'Hard',
    category: 'SOC',
    briefing:
      'A user reports a convincing phishing email that led them to a "Microsoft 365" consent screen asking ' +
      'to approve an app called "Quarterly Report Viewer" with read access to their mailbox and files -- ' +
      'they clicked Accept. This is a real, currently-active attack class Microsoft calls an illicit consent ' +
      'grant: instead of stealing a password, the attacker registers a malicious OAuth application and ' +
      'tricks the victim into granting IT consent directly, which is what makes this attack genuinely ' +
      'dangerous -- the access token issued to the malicious app is not tied to the user\'s password at all, ' +
      'so the organization\'s standard incident-response playbook (force a password reset, require MFA ' +
      're-enrollment) does absolutely nothing to revoke it. The only real remediation is finding and ' +
      'explicitly revoking the OAuth grant itself in the Entra ID audit log -- which is exactly what this ' +
      'investigation has to locate.',
    objectives: [
      { text: 'cat entra-audit-log-consent-events.txt', why: 'Confirms the exact malicious application, the broad Mail.Read/Files.ReadWrite.All permissions it requested, and that the user genuinely clicked Accept -- this was consent, not a stolen credential.' },
      { text: 'cat password-reset-timeline.txt', why: 'Shows that a full password reset AND an MFA re-enrollment were both completed after the phishing report, and the malicious app\'s access token remained fully valid and was used again afterward -- concrete proof that standard credential remediation does not touch an OAuth grant at all.' },
    ],
    hints: [
      'cat entra-audit-log-consent-events.txt',
      'cat password-reset-timeline.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'entra-audit-log-consent-events.txt': file(
          'Microsoft Entra ID audit log, activity: "Consent to application", user: dnjoku@meridiancorp.example:\n' +
            '  2026-07-28 14:02:11  Application: "Quarterly Report Viewer" (AppId: 7f3a1c9e-...-unverified-publisher)\n' +
            '  Permissions requested: Mail.Read, Files.ReadWrite.All, offline_access\n' +
            '  Consent type: User consent (NOT admin consent -- this org allows end users to consent to apps directly)\n' +
            '  Result: Granted\n' +
            '  -- offline_access is what issues a REFRESH token, letting the app mint new access tokens\n' +
            '     indefinitely without the user interacting again at all --\n',
        ),
        'password-reset-timeline.txt': file(
          [
            'Incident timeline, dnjoku@meridiancorp.example:',
            '  2026-07-28 14:02  Illicit consent granted to "Quarterly Report Viewer" (see audit log)',
            '  2026-07-29 09:15  User reports the phishing email to IT',
            '  2026-07-29 09:40  Helpdesk forces a full password reset',
            '  2026-07-29 09:52  User completes MFA re-enrollment on a new device',
            '  2026-07-29 11:03  "Quarterly Report Viewer" successfully calls Microsoft Graph again using its',
            '                    ORIGINAL refresh token -- issued BEFORE the reset -- and mints a fresh access token',
            '',
            '--- ANALYST NOTE: the password reset and MFA re-enrollment did nothing at all to this app\'s access --',
            '    OAuth consent grants are not tied to the user\'s password or session, only to the grant itself.',
            '    The only real fix is revoking this specific app\'s consent grant directly in Entra ID.',
            '    flag{illicit_oauth_consent_grant_survives_password_reset_and_mfa_reenrollment} ---',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },

  // 4 — Bug Bounty: Certificate Transparency Logs Expose a Forgotten Staging Subdomain
  {
    id: 'bb-certificate-transparency-staging-subdomain-discovery',
    title: 'Bug Bounty: Certificate Transparency Logs Expose a Forgotten Staging Subdomain',
    difficulty: 'Medium',
    category: 'Bug Bounty',
    briefing:
      'Every publicly-trusted TLS certificate issued anywhere is required by the CA/Browser Forum\'s ' +
      'Certificate Transparency policy to be published to public, append-only CT logs -- a real, ' +
      'currently-enforced requirement, not an optional best practice. crt.sh is a free, public search ' +
      'engine over those logs; querying it for meridiancorp.example (curl ' +
      '"https://crt.sh/?q=%.meridiancorp.example&output=json" is the real, exact command) returns every ' +
      'hostname anyone at the company has ever requested a certificate for, whether or not it was ever ' +
      'linked from the public site, indexed by a search engine, or intentionally announced anywhere. That\'s ' +
      'exactly how staging-internal-api.meridiancorp.example turns up here -- a pre-launch staging ' +
      'environment nobody meant to expose, discoverable purely because someone requested a valid TLS ' +
      'certificate for it eighteen months ago and never revoked or forgot that record exists.',
    objectives: [
      { text: 'cat crtsh-json-output.txt', why: 'Real crt.sh query output (curl "https://crt.sh/?q=%.meridiancorp.example&output=json") -- reveals staging-internal-api.meridiancorp.example, a hostname never linked from the public site or announced anywhere, purely because a CA once issued it a certificate.' },
      { text: 'dig staging-internal-api.meridiancorp.example', why: 'Confirms the discovered subdomain actually resolves to a live, reachable host, turning a passive CT-log finding into a real, in-scope target worth investigating further.' },
      { text: 'nmap -sV 10.10.250.2', why: 'Enumerates what\'s actually running on the newly discovered staging host now that its IP is known.' },
      { text: 'curl http://10.10.250.2:8080/api/internal/debug-status', why: 'A pre-launch staging build with verbose debug endpoints still enabled -- confirms real, concrete exposure on a host that was never supposed to be reachable at all.' },
    ],
    hints: [
      'cat crtsh-json-output.txt',
      'dig staging-internal-api.meridiancorp.example',
      'nmap -sV 10.10.250.2',
      'curl http://10.10.250.2:8080/api/internal/debug-status',
    ],
    totalFlags: 1,
    attacker: attacker({
      'crtsh-json-output.txt': file(
        '$ curl "https://crt.sh/?q=%.meridiancorp.example&output=json"\n' +
          '[\n' +
          '  {"issuer_name":"C=US, O=Let\'s Encrypt, CN=R3","common_name":"www.meridiancorp.example","entry_timestamp":"2026-01-04T02:11:07"},\n' +
          '  {"issuer_name":"C=US, O=Let\'s Encrypt, CN=R3","common_name":"mail.meridiancorp.example","entry_timestamp":"2025-11-19T14:02:31"},\n' +
          '  {"issuer_name":"C=US, O=Let\'s Encrypt, CN=R3","common_name":"staging-internal-api.meridiancorp.example","entry_timestamp":"2025-02-02T09:44:18"}\n' +
          ']\n' +
          '-- CT logs are a real, currently-enforced public record: every CA-issued cert for this domain shows\n' +
          '   up here whether or not it was ever linked, indexed, or meant to be found --\n',
      ),
    }),
    network: [
      {
        hostname: 'staging-internal-api.meridiancorp.example',
        ip: '10.10.250.2',
        os: 'Ubuntu 22.04 (pre-launch staging build, debug endpoints never disabled)',
        services: [
          {
            port: 8080,
            name: 'http',
            version: 'Node.js/Express 4.18 (staging build, NODE_ENV=development)',
            http: {
              '/api/internal/debug-status':
                '{"env":"development","db_host":"staging-db-internal.meridiancorp.example","last_deploy":"2025-02-02","note":"flag{certificate_transparency_log_exposed_forgotten_staging_host}"}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Web: Missing Subresource Integrity Turns a Trusted CDN Into a Silent Supply Chain Risk
  {
    id: 'web-missing-sri-third-party-script-supply-chain',
    title: 'Web: Missing Subresource Integrity Turns a Trusted CDN Into a Silent Supply Chain Risk',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'checkout-widget77\'s payment page loads a third-party CDN script with a plain <script src="..."> tag ' +
      'and no integrity attribute at all -- meaning the browser will execute whatever that CDN serves, with ' +
      'zero verification that it matches the script the developers actually tested and approved. This is not ' +
      'a hypothetical risk: in June 2024, the real polyfill.io CDN was acquired by a new owner and began ' +
      'serving malicious code to over 100,000 sites that trusted it, redirecting mobile visitors to scam ' +
      'pages -- and sites that HAD pinned a Subresource Integrity hash on the polyfill.io script itself were ' +
      'still safe from that specific entry-point change, because SRI causes the browser to refuse to execute ' +
      'a script whose fetched content doesn\'t match the pinned hash byte-for-byte. checkout-widget77 has no ' +
      'such pin on its own third-party payment script -- if that CDN is ever compromised the same way, ' +
      'every visitor\'s browser will run the attacker\'s replacement code with zero warning, on the single ' +
      'page handling this site\'s actual payment flow.',
    objectives: [
      { text: 'curl http://10.10.251.2:80/checkout', why: 'Confirms the third-party script tag has no integrity attribute at all -- the browser has no way to detect if the CDN ever serves something other than the script that was originally reviewed.' },
      { text: 'cat polyfill-io-2024-incident-summary.txt', why: 'The real, named 2024 incident this risk is not hypothetical about -- a compromised CDN serving malicious code to 100,000+ sites, with Subresource Integrity confirmed as an effective mitigation for exactly this entry-point compromise pattern.' },
    ],
    hints: [
      'curl http://10.10.251.2:80/checkout',
      'cat polyfill-io-2024-incident-summary.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'polyfill-io-2024-incident-summary.txt': file(
        'Real-world incident reference, June 2024 -- polyfill.io CDN supply chain compromise:\n' +
          '  - cdn.polyfill.io was acquired by a new domain owner and began injecting malicious code into the\n' +
          '    widely-used polyfill.js library, affecting an estimated 100,000+ sites that loaded it directly.\n' +
          '  - The injected code fingerprinted mobile User-Agents and redirected those visitors to scam/betting\n' +
          '    sites, with anti-analysis logic to evade automated detection.\n' +
          '  - Sites that had pinned a Subresource Integrity hash on the polyfill.io <script> tag itself were\n' +
          '    protected from THIS specific change -- SRI causes the browser to refuse to execute a fetched\n' +
          '    script whose content hash no longer matches the pinned value, exactly the entry-point compromise\n' +
          '    this checkout page has zero protection against today.\n' +
          '  flag{missing_sri_third_party_script_polyfill_io_2024_supply_chain_precedent}\n',
      ),
    }),
    network: [
      {
        hostname: 'checkout-widget77',
        ip: '10.10.251.2',
        os: 'nginx 1.24 (static checkout page)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24 (static hosting)',
            http: {
              '/checkout':
                '<html><body><h1>Checkout</h1><script src="https://cdn.thirdparty-payments.example/widget.js"></script></body></html>\n' +
                '<!-- no integrity="sha384-..." attribute on the third-party script tag at all -->',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — Malware: WMI-Based Lateral Movement via Win32_Process.Create
  {
    id: 'malware-wmi-lateral-movement-process-call-create',
    title: 'Malware Analysis: WMI-Based Lateral Movement via Win32_Process.Create',
    difficulty: 'Medium',
    category: 'Malware',
    briefing:
      'An attacker with stolen local-admin credentials pivoted from FIN-WKS-08 to a second host, ACCT-WKS-19, ' +
      'without dropping a single file, using a technique the 2026 CrowdStrike Global Threat Report found in ' +
      '34% of interactive intrusions (up from 29% the prior year, and MITRE ATT&CK\'s ninth most common ' +
      'technique overall): Windows Management Instrumentation, specifically wmic.exe\'s "process call create" ' +
      'action, which calls the Win32_Process.Create() method over WMI\'s remote DCOM interface to spawn a ' +
      'process on a target host using nothing but valid credentials -- no exploit, no implant, no file ' +
      'transferred to disk before execution. Because WMI is a legitimate, everywhere-enabled Windows admin ' +
      'feature, this activity blends into normal sysadmin traffic on its own; the real, high-confidence ' +
      'detection signal analysts rely on is correlation -- a network logon (Event ID 4624, Logon Type 3) on ' +
      'the destination host landing within seconds of that same host\'s wmiprvse.exe (the WMI provider host ' +
      'process) spawning an unexpected child process, which is exactly the pattern this incident shows.',
    objectives: [
      { text: 'cat acct-wks19-security-eventlog.txt', why: 'Shows the Event ID 4624 Logon Type 3 (network logon) landing on ACCT-WKS-19 seconds before wmiprvse.exe spawns an unexpected child process -- the real, high-confidence correlation analysts use to distinguish this from routine WMI/sysadmin activity.' },
      { text: 'cat wmic-command-captured.txt', why: 'The literal command the attacker ran from FIN-WKS-08 -- wmic /node:ACCT-WKS-19 process call create -- confirming this matches MITRE ATT&CK T1047 exactly, not a generic "suspicious process" alert.' },
    ],
    hints: [
      'cat acct-wks19-security-eventlog.txt',
      'cat wmic-command-captured.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'acct-wks19-security-eventlog.txt': file(
          'Windows Security Event Log, ACCT-WKS-19:\n' +
            '  09:14:02  Event ID 4624 (Logon Type 3 - Network)  Account: FINSVC-ADMIN  Source: 10.10.14.108 (FIN-WKS-08)\n' +
            '  09:14:04  wmiprvse.exe (PID 3312) spawns cmd.exe /c "whoami > C:\\Windows\\Temp\\out.txt"\n' +
            '  -- a network logon (4624, type 3) landing seconds before wmiprvse.exe -- the WMI provider host\n' +
            '     process -- spawns an unexpected child process is the standard, high-confidence WMI lateral\n' +
            '     movement correlation, distinguishing this from routine WMI/sysadmin/monitoring traffic --\n',
        ),
        'wmic-command-captured.txt': file(
          'EDR command-line capture, FIN-WKS-08 (source host):\n' +
            '  wmic /node:ACCT-WKS-19 /user:FINSVC-ADMIN /password:******** process call create "cmd.exe /c whoami > C:\\Windows\\Temp\\out.txt"\n' +
            '  -- MITRE ATT&CK T1047 (Windows Management Instrumentation): "process call create" invokes\n' +
            '     Win32_Process.Create() over the WMI DCOM interface on the remote host -- no exploit, no\n' +
            '     implant dropped to disk before execution, just valid stolen credentials and a built-in,\n' +
            '     always-available Windows admin feature --\n' +
            '  flag{wmi_lateral_movement_win32process_create_confirmed_by_4624_wmiprvse_correlation}\n',
        ),
      }),
    }),
    network: [],
  },
];
