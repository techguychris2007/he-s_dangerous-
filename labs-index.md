# Labs index

Running count and category breakdown for the offensive-security lab expansion. See `CHANGELOG.md` for
full narrative detail on every batch (what was added, why, and how each one was verified); this file is
just the running tally `NOTES.md`'s citations and the "when I'm back" summary can point at.

**Total labs: 368** (204 at the start of this expansion → 368 now, +164 so far toward the "up to 500, quality
first" target). Every count below is the actual `LABS.length` broken out by `category`, not an estimate.
Batch 18 marked a deliberate pace change (30 labs in one batch instead of six, per explicit instruction);
batch 19 continues it under a real tooling constraint — see the batch 19 entry below for what happened and
how it was handled.

| Category | Count | This expansion added |
|---|---|---|
| Linux | 46 | +24 (Docker sudo NOPASSWD GTFOBins bind-mount privesc, GDB sudo NOPASSWD GTFOBins shell escape, plus 22 more real GTFOBins sudo/SUID escapes in batch 18: chroot, nice, setarch, sqlite3, mysql, watch, unshare, taskset, timeout, ionice, stdbuf, flock, nohup, expect, zsh, dash, screen, nano, rsync, ssh/scp ProxyCommand, busybox) |
| Network | 45 | +20 (SMTP open relay abuse, CouchDB "Admin Party" unauthenticated access, CVE-2024-1709 ScreenConnect, CVE-2024-3400 PAN-OS GlobalProtect, CVE-2024-6387 regreSSHion, CVE-2023-46747 F5 BIG-IP AJP smuggling, CVE-2024-4577 PHP-CGI Best Fit, plus 13 more CVEs in batch 19: ProxyLogon, ProxyShell, Confluence OGNL injection, Spring4Shell, PaperCut auth bypass, Citrix ADC path traversal, Citrix NetScaler stack overflow, FortiOS SSL VPN OOB write, Confluence broken access control, vCenter vROps plugin upload, VMware Aria command injection, JetBrains TeamCity auth bypass, PHPUnit eval-stdin) |
| Web | 48 | +8 (DNS rebinding SSRF-allowlist bypass, client-side prototype pollution, Host header password reset poisoning, missing SRI on a payment script, blind SQLi via sqlmap, SSRF via a PDF-generation service, server-side XSS in a dynamic PDF report, Node.js insecure deserialization via node-serialize) |
| Active Directory | 25 | +10 (ADCS ESC1, RBCD abuse, Silver Ticket, Shadow Credentials, DCShadow rogue DC, GPP cpassword/MS14-025, LDAP anonymous bind disclosure, constrained delegation S4U abuse, GPO GenericWrite immediate-task abuse, DCSync rights self-granted via WriteDacl) |
| Bug Bounty | 22 | +2 (Certificate Transparency logs exposing a forgotten staging subdomain, exposed .env file leaking full Laravel application secrets) |
| SOC | 25 | +9 (Golden SAML detection, impossible travel, illicit OAuth consent grant, Golden Ticket lifetime detection, WinRM lateral movement, EncodedCommand C2 beacon decode, scheduled task persistence Event 4698, new service persistence Event 7045, LSASS access Sysmon Event 10) |
| Forensics | 21 | +11 (Volume Shadow Copy NTDS.dit dump, NTFS timestomping, PowerShell ScriptBlock de-obfuscation, Recycle Bin $I metadata, USN Change Journal, Shellbags, Event ID 1102 log clearing, NTFS ADS hidden payload, NTFS $LogFile transaction confirmation, Windows Jump Lists, Windows Timeline ActivitiesCache.db) |
| Cloud | 24 | +12 (IMDSv2 bypass, Docker-socket escape, Lambda env-var secrets, Azure SAS token, GCP allUsers Cloud Function, K8s automount, Lambda Function URL authType NONE, Azure Storage Account key, GCP IAM actAs privesc, exposed etcd datastore, Azure AD app registration owner privesc, publicly accessible RDS with a weak password) |
| Security+ | 18 | +7 (SPF/DMARC misconfiguration, missing HSTS, insufficient log retention, VLAN hopping, rogue DHCP server, 125kHz RFID badge cloning, IDN homograph domain attack) |
| Binary Analysis | 19 | +9 (stack canary leak, UAF function pointer hijack, ret2libc, heap unlink, GOT overwrite, tcache poisoning, ret2win, type confusion, fastbin dup pre-tcache freelist corruption) |
| Malware | 23 | +10 (process hollowing, DLL sideloading, LNK whitespace padding, regsvr32 Squiblydoo, AMSI bypass, WMI lateral movement, PDF /OpenAction JS, MSBuild inline-task bypass, rundll32 javascript: protocol handler, BITSAdmin download/persistence) |
| Security Engineering | 18 | +8 (secret in git history, forged webhook, remember-me token, ECB-penguin, TOCTOU symlink race, cgroup release_agent escape, negative-quantity checkout, hardcoded signing key in a mobile APK) |
| **API** (new category) | 18 | +18 (BFLA, JWT kid injection, legacy-version IDOR, excessive data exposure, rate-limit bypass, WebAuthn downgrade, method-override authz bypass, GraphQL field-level authz bypass, Referer-header API key leak, OAuth audience confusion, GraphQL field-suggestion leak, pagination cursor tampering, upload content-type spoofing, exposed OpenAPI spec, exposed source map, unrestricted resource consumption, API key in a URL query string, mass assignment role escalation) |
| **Cryptography** (new category) | 16 | +16 (ECB block-shuffling, hash length extension, JWT algorithm confusion, predictable PRNG session tokens, AES-CTR nonce reuse, Bleichenbacher, UUIDv1 reset-token entropy, ECDSA nonce reuse, Logjam, batch GCD shared-prime, TOTP shared-secret reuse, PBKDF2 insufficient iterations, CBC bit-flipping, AES-GCM "Forbidden Attack", RSA e=3 cube root, Debian OpenSSL predictable PRNG CVE-2008-0166) |

## Batches shipped so far

1. **`8030f55`** — 7 labs: API/Cryptography category launch (BFLA, JWT `kid` injection, legacy `/v1/`
   IDOR, excessive data exposure, X-Forwarded-For rate-limit bypass, ECB block-shuffling, hash length
   extension).
2. **`7340eff`** — 8 labs: ADCS ESC1, RBCD abuse, Silver Ticket, Shadow Credentials, IMDSv2 bypass,
   Docker-socket container escape, DNS rebinding, WebAuthn downgrade.
3. **`a2a3c96`** — 6 labs: API batch 2 (X-HTTP-Method-Override authz bypass, GraphQL nested-field authz
   bypass, API key leaked via Referer header) + Cryptography batch 2 (JWT algorithm confusion RS256→HS256,
   predictable time-seeded-PRNG session tokens, AES-CTR nonce reuse / two-time-pad recovery).
4. **`0d46802`** — 6 labs: Cryptography batch 3 (Bleichenbacher RSA padding oracle, UUIDv1 reset-token
   entropy), Binary Analysis (stack canary leak via format string, use-after-free function pointer hijack),
   Forensics (Volume Shadow Copy NTDS.dit dump, NTFS timestomping $SI/$FN mismatch).
5. **`2265f6d`** — 5 labs: OAuth token audience confusion (API), ECDSA nonce reuse private-key recovery
   (Cryptography), Lambda `GetFunctionConfiguration` plaintext secrets (Cloud), process hollowing detection
   via PEB/VAD mismatch (Malware), a secret still live in git history despite later removal (Security
   Engineering).
6. **`75a257c`** — 6 labs, "would this work on a real machine" batch: SPF/DMARC email-spoofing
   misconfiguration (Security+), forged payment webhook via missing signature verification (Security
   Engineering), SMTP open relay abuse (Network), overly-permissive/long-lived Azure SAS token (Cloud),
   ret2libc defeating NX/ASLR via a leaked libc address (Binary Analysis), DLL sideloading detection
   (Malware).
7. **`d0f7f43`** — 6 labs: Logjam-style DHE_EXPORT cipher downgrade and a batch GCD shared-RSA-prime
   recovery (Cryptography), a GraphQL field-suggestion schema leak and pagination cursor tampering (API),
   a DCShadow rogue domain controller attack (Active Directory), PowerShell ScriptBlock Logging revealing
   a de-obfuscated command (Forensics).
8. **`17f169a`** — 6 labs: shared TOTP secret across accounts (Cryptography), file-upload content-type
   spoofing bypassing an extension allowlist (API), a "remember me" token surviving a password reset
   (Security Engineering), a publicly-invocable GCP Cloud Function via an allUsers IAM binding (Cloud), a
   malicious LNK file hiding a command via whitespace padding (Malware), and Golden SAML attack detection
   via missing ADFS/Kerberos events (SOC).
9. **`6ac2ef9`** — 6 labs: GPP cpassword decryption / MS14-025 (Active Directory), heap unlink exploitation
   via forged chunk metadata (Binary Analysis), the real "ECB penguin" pattern leak (Security Engineering),
   an exposed OpenAPI/Swagger spec leaking an undocumented admin endpoint (API), Recycle Bin $I file
   metadata revealing a deleted file's origin (Forensics), and a missing HSTS header enabling SSL stripping
   (Security+).
10. **`47c982d`** — 6 labs: PBKDF2 with an insufficient iteration count (Cryptography), GOT overwrite via a
    format-string arbitrary write requiring Partial RELRO (Binary Analysis), USN Change Journal
    BASIC_INFO_CHANGE records contradicting a timestomped file's forged $SI timestamps (Forensics),
    Kubernetes' `automountServiceAccountToken` default combined with a permissive ClusterRoleBinding
    (Cloud), client-side prototype pollution via a URL fragment reaching an `innerHTML` sink (Web, modeled
    as code review since the engine has no DOM/browser execution and URL fragments never reach a server),
    and insufficient log retention against PCI DSS Requirement 10.5.1's 12-month mandate (Security+).
11. **`d904a42`** — 6 labs: glibc tcache poisoning via a UAF-enabled double-free, requiring a
    pre-Safe-Linking glibc build (Binary Analysis, distinct from batch 10's Partial-RELRO GOT-overwrite lab
    since this target is Full RELRO and reaches a writable global function pointer via heap corruption
    instead), an AWS Lambda Function URL left publicly invocable via authType NONE (Cloud), Windows
    Shellbags (BagMRU) proving folder access that survives both the folder's deletion and its USB volume's
    removal (Forensics), HTTP Host header injection enabling password-reset-link poisoning (Web), the
    regsvr32.exe "Squiblydoo" application-whitelisting bypass via a remote COM scriptlet (Malware, MITRE
    ATT&CK T1218.010), and impossible-travel / geo-velocity detection flagging a compromised account (SOC).
12. **`ba2cd4c`** — 6 labs, every technique real enough to run verbatim against a real Kali box (this
    platform is a safe simulated bridge to practice the exact command syntax, not a different or watered-
    down version of it): a Docker sudo-NOPASSWD GTFOBins privesc bind-mounting the host root filesystem
    (Linux, reusing this session's existing ssh-foothold-and-privesc factory), LDAP anonymous bind exposing
    a password left in a user's description field (Active Directory, real ldapsearch syntax), Apache
    CouchDB's pre-3.0 "Admin Party" default granting full unauthenticated database access (Network), an
    exposed `.js.map` source map reversing minification to leak a hardcoded API key (API), AES-CBC
    bit-flipping forging an admin cookie with no key and no padding oracle at all (Cryptography, verified
    with real Node `crypto` before committing the hex values), and a reflection-based AMSI bypass
    (`amsiInitFailed`) confirmed by the absence of expected scan telemetry (Malware, MITRE-documented,
    2016-disclosed technique still seen in obfuscated form today).
13. **`f36059d`** — 6 labs, each with an explicit, individually-answered "would this work on a real
    Kali box" check (see `NOTES.md` batch 13): a textbook ret2win stack smash overwriting a saved return
    address to redirect into a hidden `win()` function, working even with NX enabled since no shellcode is
    injected (Binary Analysis); an exposed Azure Storage Account primary access key granting full Shared
    Key read/write/delete, distinct from this session's existing SAS-token lab (Cloud); an illicit OAuth
    consent grant that a full password reset and MFA re-enrollment do nothing to revoke, since it isn't
    tied to the user's credentials at all (SOC); a forgotten staging subdomain discovered purely through
    public Certificate Transparency logs (Bug Bounty, real `crt.sh` JSON API); a missing Subresource
    Integrity attribute on a third-party payment script, referencing the real June 2024 polyfill.io CDN
    supply-chain compromise by name (Web); and WMI-based lateral movement via `Win32_Process.Create`,
    MITRE ATT&CK's ninth most common technique overall (Malware).
14. **`a6ae0a3`** — 6 labs, built against an explicit "everything should be real" request: every lab
    uses only this engine's genuinely live command handlers (`exploit`, `nmap`, `gobuster`, `curl`,
    `sqlmap`, `ssh`/`hydra`/`sudo`) with none of the captured-recon-file convention used for a few labs in
    recent batches. Two real, famous CVSS-10.0 CVEs via the same `exploit <module> <ip>` mechanic already
    proven across ~13 existing CVE-RCE labs — CVE-2024-1709 (ConnectWise ScreenConnect setup-wizard auth
    bypass) and CVE-2024-3400 (Palo Alto PAN-OS GlobalProtect command injection) — both Network; an exposed
    `.env` file leaking a Laravel app's full secrets including its APP_KEY, discovered live via `gobuster`
    (Bug Bounty); a blind boolean-based SQL injection extracted live with `sqlmap --batch --dump` as the
    primary tool rather than curl-crafted UNION payloads (Web); a GDB sudo-NOPASSWD GTFOBins shell escape,
    reusing the same ssh-foothold-and-privesc factory as the batch-12 Docker lab (Linux); and Golden Ticket
    detection via a forged TGT's anomalous 10-year lifetime — Mimikatz/Rubeus's own hardcoded forging
    default — genuinely real as a `cat`-based SOC log review, since that IS the actual analyst workflow for
    this job function, not a simulation shortcut (SOC).
15. **`b24635d`** — 6 labs: VLAN hopping via 802.1Q double tagging, requiring the trunk's native
    VLAN to be left at its unchanged factory default (Security+); AES-GCM nonce reuse enabling Joux's real
    "Forbidden Attack" — GHASH subkey recovery via polynomial GCD over GF(2^128), forging a valid
    authentication tag with no encryption key at all (Cryptography, honestly scoped in `NOTES.md`: the deep
    field-arithmetic math is described and cited accurately but the forged value is presented as a given
    tooling output, not hand-rederived); a TOCTOU race condition in a root-owned batch job enabling a
    symlink attack that redirects a privileged write into `/etc/passwd` (Security Engineering); unrestricted
    resource consumption via a pagination-free bulk-export endpoint, OWASP API4:2023 (API); Windows Event ID
    1102 (audit log cleared) correlated via Logon ID back to the responsible account's original network
    logon (Forensics); and a malicious PDF's `/OpenAction` auto-executing embedded JavaScript that calls the
    PDF viewer's own legitimate `app.launchURL()` API with zero user interaction required (Malware).
16. **`ffac58b`** — 6 labs: Kerberos constrained delegation abuse via S4U2Self/S4U2Proxy protocol
    transition, distinct from unconstrained delegation ("any service") and RBCD (configured on the target,
    not the source account) (Active Directory); GCP IAM's `iam.serviceAccounts.actAs` permission — the
    direct GCP equivalent of AWS `iam:PassRole` — enabling privilege escalation to a project-wide Editor
    role (Cloud); a type confusion bug in a tagged union, where a cached-record code path never re-checks a
    tag validated on a different path, letting attacker-chosen "string" bytes get called as a function
    pointer (Binary Analysis, the same real bug class behind CVE-2015-0336); NTFS Alternate Data Streams
    hiding an executable payload inside an ordinary text file, detected via Sysmon Event ID 15
    (FileCreateStreamHash) (Forensics); excessive container capabilities (`--cap-add=SYS_ADMIN`) enabling a
    classic cgroup v1 `release_agent` host escape, distinct from this session's existing Docker-socket and
    sudo-GTFOBins Docker findings (Security Engineering); and a rogue DHCP server winning the race to answer
    client leases and redirecting the default gateway through the attacker, exploiting DHCP's complete lack
    of server authentication (Security+).
17. **`1bc7623`** — 6 labs: an RSA e=3 cube-root attack recovering an unpadded PIN with no private
    key at all — verified end-to-end with real Node BigInt arithmetic before being hardcoded (Cryptography);
    an API key passed in a URL query string leaking through plaintext access logs, distinct from the
    existing Referer-header-leak lab (API); a negative-quantity checkout business logic flaw, a well-formed
    integer no input filter would ever flag, that turns the server's own price × quantity multiplication
    into free account credit (Security Engineering); 125kHz RFID proximity badge cloning, plaintext with
    zero encryption at the protocol level (Security+); WinRM lateral movement (MITRE T1021.006) detected via
    correlating an out-of-baseline Event ID 4624 logon with `wsmprovhost.exe` spawning an unexpected child
    process (SOC); and NTFS `$LogFile` transaction records providing a second, lower-level, independent
    confirmation of timestomping beyond this session's existing USN-journal lab (Forensics).
18. **`d054547`** — 30 labs, a deliberate pace change per explicit instruction ("30+ per commit,
    continue until 500"). 22 more real, GTFOBins-documented sudo/SUID escapes reusing the proven
    ssh-foothold-and-privesc factory (Linux) — GTFOBins lists well over 100 binaries and only 19 had been
    used before this batch, so this is a large, genuinely real, well-documented technique family that was
    nowhere near exhausted, not a stretch to hit a number. Three more famous, real CVEs via the same
    `exploit <module> <ip>` mechanic proven across ~16 existing CVE-RCE labs: CVE-2024-6387 (regreSSHion,
    an OpenSSH signal-handler race condition, CVSS 8.1), CVE-2023-46747 (F5 BIG-IP TMUI AJP request
    smuggling authentication bypass, CVSS 9.8), and CVE-2024-4577 (PHP-CGI Windows "Best Fit" argument
    injection, CVSS 9.8, affecting every default XAMPP-for-Windows install) (Network). Plus five more
    single-technique labs: an IDN homograph domain attack using a Cyrillic lookalike character with a
    genuinely valid TLS certificate (Security+); an encoded PowerShell command decoding to a hardcoded C2
    beacon configuration (SOC); MSBuild.exe's real inline-task feature (MITRE T1127.001) bypassing
    application whitelisting through a signed Microsoft binary (Malware); SSRF via a PDF-generation
    service's headless-browser renderer reaching both local files and cloud metadata (Web); and an exposed
    etcd datastore on its real port 2379 leaking every Kubernetes secret with zero authentication,
    completely bypassing the API server's own RBAC (Cloud).
19. **`6620dfe`** — 30 labs, continuing the 30+/commit pace under a real, disclosed constraint: this
    session's usual runtime verification (`tsx` executing each lab against the real `TerminalEngine`) and
    `oxlint` became unavailable mid-batch, blocked by a safety classifier citing accumulated conversation
    content rather than anything about this batch specifically. `tsc` (static type-checking) stayed
    available throughout and passed cleanly. In its place, every lab was manually traced against the actual
    `engine.ts` source (`parseParams`, `tokenize`, the `-H` header parser, `hydra`/`crackmapexec`/`ssh` port
    requirements) rather than assumed correct — and that manual trace caught seven real mechanical bugs
    before commit that automated `tsx` verification would normally have caught immediately, all fixed (see
    NOTES.md batch 19 for the full list: a header-value payload that was URL-encoded when this engine never
    decodes header values; a JSON request body sent to a parser that only understands form-encoding; a
    protocol/port mismatch plus a missing flag-capture step on a database-credentials lab; a `.so` filename
    mismatch plus an unsupported `grep -A` flag; a referenced-but-undefined file on an Active Directory lab;
    and a hand-computed hex-to-decimal address that was wrong until re-checked with real arithmetic). 13
    more real, famous CVEs via the proven `exploit <module> <ip>` mechanic (now used across 19 total
    CVE-RCE labs) — ProxyLogon, ProxyShell, Confluence OGNL injection, Spring4Shell, PaperCut auth bypass,
    two distinct Citrix ADC/NetScaler CVEs, a second distinct FortiOS SSL VPN CVE, a second distinct
    Confluence CVE, a second distinct vCenter CVE, VMware Aria command injection, JetBrains TeamCity auth
    bypass, and PHPUnit's exposed eval-stdin.php — each explicitly differentiated in its own briefing from
    this platform's existing same-vendor CVE where one already exists, never left implicit (Network). Plus
    17 more single-technique labs spanning Active Directory (GPO GenericWrite abuse, DCSync via WriteDacl),
    Cloud (Azure AD app registration owner privesc, a publicly accessible RDS instance with a weak
    password), Forensics (Jump Lists, Windows Timeline/ActivitiesCache.db), SOC (three Windows Event
    ID-based persistence/credential-access detections), Web (server-side XSS in a dynamic PDF, Node.js
    node-serialize deserialization RCE), Malware (rundll32 `javascript:` protocol abuse, BITSAdmin
    download/persistence), API (mass assignment role escalation), Security Engineering (a hardcoded signing
    key shipped in every copy of a mobile APK), Binary Analysis (fastbin dup, the pre-tcache ancestor of
    batch 11's tcache-poisoning technique), and Cryptography (Debian's real, historic CVE-2008-0166
    predictable-PRNG SSH key weakness).

    **Finalized in a later session** once `tsx`/`oxlint`/`git commit` were all confirmed working again: re-ran
    all 30 labs end-to-end against the real `TerminalEngine`, per this entry's own standing flag to do so.
    15 of 30 failed on first run — a narrative-only final hint (describing the action in prose instead of
    giving the actual runnable command) affecting all 13 network-pack CVE labs plus 2 more in the mixed pack,
    all fixed to real command lines and reverified clean. See `CHANGELOG.md`'s "Batch 19 finalization" entry
    and `NOTES.md` for the full account.

## What's explicitly NOT attempted, and why

- **Wireless labs** (WPA2/WPA3 handshake capture, Evil Twin, deauth, rogue AP) — this platform's labs run
  through a simulated `TerminalEngine` (see `src/labs/engine.ts`), not a real Kali box or real RF hardware.
  The engine's `KNOWN_COMMANDS` list has no `aircrack-ng`/`airodump-ng`/`aireplay-ng` family — adding real
  wireless labs would first require adding new engine commands to simulate those tools' behavior, which is
  a different, larger scope than writing lab content against existing commands. Flagged here rather than
  faking wireless commands that wouldn't actually run.
- **500 as a literal target** — treated the same way every volume target in this session's `CHANGELOG.md`
  is treated: an upper bound to work toward with real per-lab verification, not a quota. 15 real,
  individually-verified labs in this pass; continuing in the same pattern.

## Verification method (same for every lab in this file)

Every lab is scripted directly against the real `TerminalEngine` class (imported via `tsx`, no browser
needed) — the exact solve-path commands from each lab's `objectives`/`hints` are run in sequence and must
capture the intended flag; a plausible benign request is run separately and must capture none. This is
"would this work against the target *as this platform's simulator models it*," which is the correct
verification question for this specific codebase — see `NOTES.md` for why that's a deliberately different
question than "would this work on a real Kali box," and why answering the real-Kali-box question in the
research phase still matters for getting the *briefing/technique* content right even though it isn't what
gets mechanically verified.
