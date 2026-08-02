import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'review-ws', user: 'root', root: dir(files) };
}

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

/** Batch 10. Same discipline as the last several batches (see NOTES.md): every technique researched for
 *  real-machine accuracy, every non-80 target given an explicit port, every hand-typed encoded/computed
 *  value re-derived programmatically before trusting it. */
export const batch10MixedLabs: LabScenario[] = [
  // 1 — Cryptography: PBKDF2 With an Insufficient Iteration Count
  {
    id: 'crypto-pbkdf2-insufficient-iterations',
    title: 'PBKDF2 Password Hashing With an Insufficient Iteration Count',
    difficulty: 'Medium',
    category: 'Cryptography',
    briefing:
      'Authsvc31 hashes passwords with PBKDF2-HMAC-SHA256 — a real, sound key-derivation function, not a ' +
      'broken algorithm — but configured with an iteration count of 10,000, a value that was defensible a ' +
      'decade ago and is not anymore. OWASP\'s current guidance (updated 2023) puts the minimum at 600,000 ' +
      'iterations for PBKDF2-HMAC-SHA256 (210,000 was the older baseline before GPU cracking got faster), ' +
      'precisely because the entire point of an iteration count is to make each individual guess expensive — ' +
      'a count that was "expensive enough" against 2015 hardware is now cheap enough that a single modern ' +
      'consumer GPU can attempt billions of low-iteration PBKDF2 guesses per day. This is not a cipher being ' +
      'broken; it is a tuning parameter that was never revisited as hardware got faster, which is exactly the ' +
      'kind of drift a periodic crypto-config review exists to catch.',
    objectives: [
      { text: 'cat auth-service-hashing-config.txt', why: 'Confirms the exact KDF and iteration count in use — PBKDF2-HMAC-SHA256 itself is a fine choice; the count is the actual defect.' },
      { text: 'cat crack-speed-benchmark.txt', why: 'Translates "10,000 iterations" into a concrete real-world cracking timeframe against a modern GPU — the number that actually makes the risk legible to someone who isn\'t a cryptographer.' },
    ],
    hints: [
      'cat auth-service-hashing-config.txt',
      'cat crack-speed-benchmark.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      root: dir({
        'auth-service-hashing-config.txt': file(
          'authsvc31 password hashing config (password_hasher.py):\n' +
            '  algorithm:   PBKDF2-HMAC-SHA256\n' +
            '  iterations:  10000\n' +
            '  salt:        16 random bytes per user (this part is fine)\n' +
            '  -- OWASP Password Storage Cheat Sheet (2023 revision) recommends >= 600,000 iterations for\n' +
            '     PBKDF2-HMAC-SHA256 (raised from the older 210,000 baseline as GPU cracking got faster) --\n' +
            '     this config is roughly 60x below current guidance.\n',
        ),
        'crack-speed-benchmark.txt': file(
          'Offline cracking benchmark, single modern consumer GPU, PBKDF2-HMAC-SHA256 mode:\n' +
            '  at 600,000 iterations (current OWASP minimum):  ~thousands of guesses/sec  -- an 8-char\n' +
            '                                                    alphanumeric space stays impractical to exhaust\n' +
            '  at 10,000 iterations (this config, 60x fewer):   ~hundreds of thousands of guesses/sec -- the\n' +
            '                                                    same 8-char alphanumeric space becomes\n' +
            '                                                    exhaustible in a practical offline timeframe\n' +
            '  -- the iteration count is the ONLY thing separating these two outcomes; the hash algorithm,\n' +
            '     salt, and password itself are identical in both rows --\n' +
            '  flag{pbkdf2_iteration_count_10000_far_below_owasp_600000_minimum}\n',
        ),
      }),
    }),
    network: [],
  },

  // 2 — Binary Analysis: GOT Overwrite via a Format-String Arbitrary Write
  {
    id: 'binary-got-overwrite-format-string',
    title: 'Reverse Engineering: GOT Overwrite via a Format-String Arbitrary Write',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'gotpwn9 logs a message with printf(user_input) — the user-controlled string is passed directly as the ' +
      'FORMAT argument rather than as a %s parameter, the classic format-string bug, giving an attacker a ' +
      'read-and-write primitive into the process\'s own memory. The target here is the Global Offset Table: ' +
      'with PIE disabled, the GOT sits at a fixed, known-in-advance address, and — critically — this binary ' +
      'was built with only Partial RELRO, meaning the GOT stays writable for the program\'s entire lifetime ' +
      '(Full RELRO is the real mitigation for this exact class: it makes the linker resolve every PLT entry ' +
      'eagerly at startup and then mprotects the GOT read-only, which would shut this technique down ' +
      'completely). Overwriting a frequently-called function\'s GOT entry — here, strlen — with the address ' +
      'of a hidden backdoor function redirects every subsequent call through that entry into attacker-chosen ' +
      'code, with no return-address smashing or stack canary involved at all.',
    objectives: [
      { text: 'file gotpwn9', why: 'Confirms the binary format before analysis.' },
      { text: 'checksec --file=gotpwn9', why: 'The one fact that decides whether this technique is even possible here: Partial RELRO leaves the GOT writable for the whole program lifetime, while Full RELRO would make it read-only after startup and rule this out entirely.' },
      { text: 'objdump -d gotpwn9', why: 'Shows the unvalidated printf(user_input) format-string bug, and the fixed address of strlen\'s GOT slot that a later code path calls through — the exact write target.' },
      { text: 'gdb gotpwn9', why: 'Reveals the address of the hidden backdoor function this GOT slot needs to be redirected to, and confirms what the slot currently holds (libc\'s real strlen address).' },
      { text: 'Compute the backdoor address and run ./gotpwn9 with it', why: 'Supplying the correct target address is what completes the exploit — proving the forged format-string write landed exactly on the GOT slot the next strlen call resolves through.' },
    ],
    hints: [
      'file gotpwn9',
      'checksec --file=gotpwn9',
      'objdump -d gotpwn9',
      'gdb gotpwn9',
      'secret_backdoor lives at 0x401550 -- convert to decimal and supply it to ./gotpwn9 <value>',
    ],
    totalFlags: 1,
    attacker: attacker({
      gotpwn9: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped',
          '#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nPartial RELRO    No canary found    NX enabled    PIE disabled',
          '#OBJDUMP:0000000000401300 <log_message>:\\n  40130a:  call   401060 <printf@plt>   # prints user_input directly as the FORMAT arg -- no %s, no bounds check\\n0000000000401360 <process_item>:\\n  40136c:  call   *0x604018          # calls through strlen@got.plt (fixed at 0x604018 since PIE is disabled)',
          '#GDB_SESSION:(gdb) x/gx 0x604018\\n0x604018 <strlen@got.plt>:  0x00007ffff7e2b6e0   # currently resolved to real libc strlen\\n(gdb) print secret_backdoor\\n$1 = {<text variable, no debug info>} 0x401550 <secret_backdoor>\\n(gdb) # forging the format-string write to place 0x401550 at 0x604018 redirects the next call through strlen@got straight into secret_backdoor',
          '#CRACKME_PASSWORD:4199760',
          '#CRACKME_SUCCESS:Forged format-string write redirected strlen@got.plt to secret_backdoor() -- the next call through it executes attacker-controlled code instead of libc strlen.\\nflag{got_overwrite_format_string_partial_relro_arbitrary_write}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },

  // 3 — Forensics: USN Change Journal Contradicts a Timestomped File
  {
    id: 'forensics-usn-journal-timestomp-detection',
    title: 'Forensics: USN Change Journal Contradicts a Timestomped File',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'A dropped executable\'s $STANDARD_INFORMATION timestamps claim it has sat untouched on this host since ' +
      '2019 — a classic timestomping move meant to make a malicious file blend into old, legitimate software. ' +
      'But NTFS keeps a second, independent record of file activity that a timestomping tool rarely touches ' +
      'at all: the USN (Update Sequence Number) Change Journal, $Extend\\$UsnJrnl:$J, a running log of every ' +
      'create, rename, data-write, and close operation on the volume, each with its own real timestamp and ' +
      'reason code, maintained by the filesystem itself rather than read from the same $MFT attribute a ' +
      'timestomping tool edits. Cross-referencing a suspicious file\'s claimed $SI timestamps against its USN ' +
      'journal history is a standard, real anti-anti-forensics technique — because faking one artifact ' +
      '($STANDARD_INFORMATION) is easy, but faking every independent artifact that recorded the same event is ' +
      'much harder, and attackers routinely miss the ones they don\'t know to look for.',
    objectives: [
      { text: 'cat mft-timestomp-comparison.txt', why: 'Shows the file\'s claimed $STANDARD_INFORMATION creation date — the number the timestomping tool set, and the one a quick triage would otherwise trust at face value.' },
      { text: 'cat usnjrnl-parsed-entries.txt', why: 'The USN journal is a separate NTFS structure the timestomping tool never touched — its real, unaltered timestamps for this exact file directly contradict the $SI claim.' },
      { text: 'Identify the contradiction between $SI and the USN journal, then capture the flag', why: 'Naming the specific gap (claimed 2019 creation vs. a USN journal that only starts recording this file a few days ago) is what turns "the file looks old" into hard, corroborated proof of timestomping.' },
    ],
    hints: [
      'cat mft-timestomp-comparison.txt',
      'cat usnjrnl-parsed-entries.txt',
      'The $SI claims 2019; the USN journal\'s FILE_CREATE record for the same file is dated four days ago.',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'mft-timestomp-comparison.txt': file(
          '$MFT record for C:\\Windows\\Temp\\svchost_update.exe:\n' +
            '  $STANDARD_INFORMATION:  Created 2019-03-11 08:14:02   Modified 2019-03-11 08:14:02\n' +
            '  $FILE_NAME:             Created 2019-03-11 08:14:02   Modified 2019-03-11 08:14:02\n' +
            '  -- both attributes agree with each other, which is exactly what a competent timestomping tool\n' +
            '     produces (naive tools only touch $SI and leave $FILE_NAME mismatched -- this one touched both) --\n',
        ),
        'usnjrnl-parsed-entries.txt': file(
          [
            '$UsnJrnl:$J parsed records for C:\\Windows\\Temp\\svchost_update.exe (frn 0x50026):',
            '  2026-07-29 03:07:11  Reason: FILE_CREATE                     (the file did not exist before this)',
            '  2026-07-29 03:07:11  Reason: DATA_EXTEND | DATA_OVERWRITE    (payload written to disk)',
            '  2026-07-29 03:07:12  Reason: CLOSE                           (handle closed after write)',
            '  2026-07-29 03:07:12  Reason: BASIC_INFO_CHANGE                (timestomping tool ran immediately after -- this is the',
            '                                                                 record of the $SI values themselves being rewritten)',
            '',
            '--- ANALYST NOTE: the USN journal -- a structure the timestomping tool never edited -- shows this file',
            '    was created FOUR DAYS AGO, not in 2019. The BASIC_INFO_CHANGE record even captures the moment',
            '    the $SI timestamps were forged, immediately after the file was written.',
            '    flag{usn_journal_basic_info_change_exposes_timestomping} ---',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },

  // 4 — Cloud: Default automountServiceAccountToken Exposes Cluster Credentials
  {
    id: 'cloud-k8s-automount-serviceaccount-token',
    title: 'Kubernetes Default automountServiceAccountToken Exposes Cluster Credentials',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'Every pod in this cluster was created without an explicit automountServiceAccountToken setting — and ' +
      'Kubernetes\' real default for that field is true, meaning every pod, including ones that never call ' +
      'the Kubernetes API for anything, gets a service-account bearer token silently mounted into its own ' +
      'filesystem at boot. Having the token alone would be low-impact against a cluster following the ' +
      'principle of least privilege, since a bare "default" service account normally holds no RBAC ' +
      'permissions at all under modern Kubernetes — the real, compounding misconfiguration here is that an ' +
      'overly broad ClusterRoleBinding grants this same default service account permission to list secrets ' +
      'cluster-wide, a documented, common real-world pairing: automount delivers the credential into every ' +
      'compromised pod, and permissive RBAC is what makes that credential worth stealing at all.',
    objectives: [
      { text: 'cat serviceaccount-token.txt', why: 'automountServiceAccountToken defaults to true, so this bearer token was mounted here automatically the moment the pod started, whether or not the pod\'s own code ever calls the Kubernetes API.' },
      {
        text: 'curl -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImFiY2RlZjEyMzQifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmRlZmF1bHQ6ZGVmYXVsdCJ9.c2lnbmF0dXJlcGxhY2Vob2xkZXI" https://10.10.234.2:6443/api/v1/namespaces/kube-system/secrets',
        why: 'The token alone is only half the story — this cluster\'s default service account has also been bound to a role permitting secrets:list, which is what turns "every pod has a token" into "every compromised pod can read cluster-wide secrets."',
      },
    ],
    hints: [
      'cat serviceaccount-token.txt',
      'curl -H "Authorization: Bearer <the token from the file>" https://10.10.234.2:6443/api/v1/namespaces/kube-system/secrets',
    ],
    totalFlags: 1,
    attacker: attacker({
      'serviceaccount-token.txt': file(
        'Auto-mounted at /var/run/secrets/kubernetes.io/serviceaccount/token (automountServiceAccountToken: true, cluster default):\n' +
          'eyJhbGciOiJSUzI1NiIsImtpZCI6ImFiY2RlZjEyMzQifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmRlZmF1bHQ6ZGVmYXVsdCJ9.c2lnbmF0dXJlcGxhY2Vob2xkZXI\n' +
          '-- this pod never calls the Kubernetes API in its own code, yet the credential is here anyway,\n' +
          '   because the field controlling this was never explicitly set to false --\n',
      ),
    }),
    network: [
      {
        hostname: 'k8s-api-server',
        ip: '10.10.234.2',
        os: 'Kubernetes 1.29 API server (default ServiceAccount over-bound to a secrets-reader ClusterRole)',
        services: [
          {
            port: 6443,
            name: 'https',
            version: 'kube-apiserver 1.29 (RBAC enabled, but default SA bound to an overly broad ClusterRoleBinding)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/v1/namespaces/kube-system/secrets',
                param: 'authorization',
                location: 'header',
                triggerSubstrings: ['c2lnbmF0dXJlcGxhY2Vob2xkZXI'],
                vulnerableResponse:
                  '{"kind":"SecretList","items":[{"metadata":{"name":"argocd-repo-creds"}},{"metadata":{"name":"prod-db-credentials"}}],"note":"flag{k8s_automount_default_sa_plus_permissive_rbac_secrets_read}"}',
                normalResponse: '{"kind":"Status","status":"Failure","message":"secrets is forbidden: User cannot list resource secrets","code":403}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Web: Client-Side Prototype Pollution via URL Fragment Leads to DOM XSS
  {
    id: 'web-client-side-prototype-pollution-dom-xss',
    title: 'Client-Side Prototype Pollution via URL Fragment Leads to DOM XSS',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Dashboard40\'s client-side config loader reads settings out of the URL fragment (everything after "#") ' +
      'and recursively merges them into a shared config object with no check for the special __proto__ key — ' +
      'the same bug class as this platform\'s existing server-side settings-merge vulnerability, but a ' +
      'meaningfully different, currently well-documented one: this merge runs entirely in the browser, on ' +
      'data that never gets sent to any server at all, since URL fragments are a client-only construct by ' +
      'HTTP\'s own design. That means the payload never appears in any server access log, WAF log, or network ' +
      'capture — it is invisible to every server-side defense simultaneously, and only shows up in source-code ' +
      'review or dynamic browser-side analysis (tooling like PortSwigger\'s DOM Invader exists specifically for ' +
      'this class). Once Object.prototype is polluted, a later render call reads a polluted "template" ' +
      'property straight into innerHTML with no sanitization, completing the chain into a real DOM-based XSS.',
    objectives: [
      { text: 'cat client-config-loader.js', why: 'The recursive fragment-merge with no __proto__ guard, and the innerHTML sink downstream that reads a polluted property — this is a code-review finding, since nothing about a URL fragment payload is ever visible on the wire.' },
      { text: 'cat dom-invader-poc-analysis.txt', why: 'Confirms the exact fragment payload and that it genuinely executes arbitrary script in the browser once the polluted "template" property reaches the innerHTML sink — proving this isn\'t just a theoretical gadget chain.' },
    ],
    hints: [
      'cat client-config-loader.js',
      'cat dom-invader-poc-analysis.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      root: dir({
      'client-config-loader.js': file(
        'function deepMerge(target, source) {\n' +
          '  for (const key in source) {\n' +
          '    // no check here for key === "__proto__" or key === "constructor" -- the real defect\n' +
          '    if (typeof source[key] === "object" && source[key] !== null) {\n' +
          '      target[key] = target[key] || {};\n' +
          '      deepMerge(target[key], source[key]);\n' +
          '    } else {\n' +
          '      target[key] = source[key];\n' +
          '    }\n' +
          '  }\n' +
          '  return target;\n' +
          '}\n\n' +
          'const fragmentConfig = JSON.parse(decodeURIComponent(location.hash.slice(1) || "{}"));\n' +
          'deepMerge(window.appConfig, fragmentConfig);   // fragment data merged with no key filtering at all\n\n' +
          'function renderWidget(widget) {\n' +
          '  widget.innerHTML = window.appConfig.template || defaultTemplate;   // polluted property read straight into innerHTML\n' +
          '}\n',
      ),
      'dom-invader-poc-analysis.txt': file(
        'DOM Invader-style dynamic analysis, dashboard40:\n' +
          '  PoC URL: https://dashboard40.internal/#{"__proto__":{"template":"<img src=x onerror=alert(document.domain)>"}}\n' +
          '  -- the fragment is NEVER sent to the server (confirmed: zero matching entries in the server access\n' +
          '     log for this request, by HTTP\'s own design) -- the entire attack happens client-side only\n' +
          '  Result: Object.prototype.template is now polluted for the whole page. The next call to\n' +
          '  renderWidget() for ANY widget on the page reads the polluted template and injects it via\n' +
          '  innerHTML -- confirmed executing arbitrary attacker JS in the victim\'s browser session.\n' +
          '  flag{client_side_prototype_pollution_url_fragment_dom_xss}\n',
      ),
      }),
    }),
    network: [],
  },

  // 6 — Security+: Insufficient Log Retention Violates a Compliance Window
  {
    id: 'securityplus-insufficient-log-retention-pci-dss',
    title: 'Security+: Insufficient Log Retention Violates the PCI DSS Compliance Window',
    difficulty: 'Easy',
    category: 'Security+',
    briefing:
      'A routine compliance audit checks how long meridiancorp retains security event logs — access logs, ' +
      'authentication events, firewall logs — against PCI DSS Requirement 10.5.1 (numbered 10.7 in older PCI ' +
      'DSS versions), which sets a specific, real, currently-enforced retention window: audit log history ' +
      'must be retained for at least twelve months, with at least the most recent three months (90 days) ' +
      'immediately available for analysis, precisely because breach investigations routinely need to ' +
      'reconstruct activity from weeks or months before the breach was even discovered. Meridiancorp\'s ' +
      'current log pipeline auto-purges everything after 30 days with no long-term archive at all — meaning ' +
      'any incident not caught within its first month becomes permanently uninvestigatable, a gap far short ' +
      'of the mandated minimum and a real audit finding, not a theoretical one.',
    objectives: [
      { text: 'cat log-retention-policy-current.txt', why: 'Confirms exactly how long logs are actually kept today, and that there is no long-term archive backing up the live retention window at all.' },
      { text: 'cat pci-dss-requirement-10-notes.txt', why: 'The real, specific PCI DSS mandate this falls short of — citing the actual requirement number and retention window is what turns "logs get deleted kind of fast" into a concrete, auditable compliance gap.' },
    ],
    hints: [
      'cat log-retention-policy-current.txt',
      'cat pci-dss-requirement-10-notes.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'log-retention-policy-current.txt': file(
          'meridiancorp SIEM log retention config:\n' +
            '  security event logs (auth, access, firewall):  retained 30 days, then permanently purged\n' +
            '  long-term / cold-storage archive:                none configured\n' +
            '  -- any incident discovered more than 30 days after it occurred has zero corroborating log\n' +
            '     evidence left anywhere in the environment --\n',
        ),
        'pci-dss-requirement-10-notes.txt': file(
          'PCI DSS v4.0, Requirement 10.5.1 (this requirement was numbered 10.7 in PCI DSS v3.2.1):\n' +
            '  "Retain audit log history for at least 12 months, with at least the most recent 3 months\n' +
            '   immediately available for analysis."\n' +
            '  -- meridiancorp retains 30 days total, with nothing at all beyond that -- roughly 1/12th of the\n' +
            '     mandated minimum retention window, and short of even the "immediately available" 90-day floor --\n' +
            '  flag{log_retention_30_days_violates_pci_dss_10_5_1_twelve_month_minimum}\n',
        ),
      }),
    }),
    network: [],
  },
];
