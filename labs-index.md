# Labs index

Running count and category breakdown for the offensive-security lab expansion. See `CHANGELOG.md` for
full narrative detail on every batch (what was added, why, and how each one was verified); this file is
just the running tally `NOTES.md`'s citations and the "when I'm back" summary can point at.

**Total labs: 278** (204 at the start of this expansion → 278 now, +74 so far toward the "up to 500, quality
first" target). Every count below is the actual `LABS.length` broken out by `category`, not an estimate.

| Category | Count | This expansion added |
|---|---|---|
| Linux | 23 | +1 (Docker sudo NOPASSWD GTFOBins bind-mount privesc) |
| Network | 27 | +2 (SMTP open relay abuse, CouchDB "Admin Party" unauthenticated access) |
| Web | 43 | +3 (DNS rebinding SSRF-allowlist bypass, client-side prototype pollution via URL fragment to DOM XSS, Host header injection enabling password reset poisoning) |
| Active Directory | 22 | +7 (ADCS ESC1, RBCD abuse, Silver Ticket, Shadow Credentials, DCShadow rogue DC, GPP cpassword/MS14-025, LDAP anonymous bind description-field password disclosure) |
| Bug Bounty | 20 | — |
| SOC | 18 | +2 (Golden SAML detection via missing ADFS/Kerberos events, impossible travel / geo-velocity anomaly detection) |
| Forensics | 16 | +6 (Volume Shadow Copy NTDS.dit dump, NTFS timestomping $SI/$FN mismatch, PowerShell ScriptBlock de-obfuscation, Recycle Bin $I metadata, USN Change Journal contradicts a timestomped file, Shellbags survive a deleted folder on a removed USB volume) |
| Cloud | 19 | +7 (IMDSv2 bypass, Docker-socket container escape, Lambda env-var secrets exposure, overly-permissive Azure SAS token, GCP allUsers Cloud Function, Kubernetes default automountServiceAccountToken + permissive RBAC, AWS Lambda Function URL public via authType NONE) |
| Security+ | 14 | +3 (SPF/DMARC misconfiguration enables spoofing, missing HSTS enables SSL stripping, insufficient log retention violates PCI DSS 10.5.1) |
| Binary Analysis | 16 | +6 (stack canary leak via format string, use-after-free function pointer hijack, ret2libc defeating NX/ASLR, heap unlink metadata corruption, GOT overwrite via format-string arbitrary write, tcache poisoning via a UAF-enabled double-free) |
| Malware | 18 | +5 (process hollowing detection via PEB/VAD mismatch, DLL sideloading via search-order hijacking, LNK whitespace-padding command hiding, regsvr32 "Squiblydoo" AppLocker bypass, AMSI bypass via reflection-based field patching) |
| Security Engineering | 14 | +4 (secret still live in git history, forged webhook via missing signature verification, remember-me token survives password reset, ECB-penguin pattern leak) |
| **API** (new category) | 15 | +15 (BFLA, JWT kid injection, legacy-version IDOR, excessive data exposure, rate-limit bypass, WebAuthn downgrade, method-override authz bypass, GraphQL field-level authz bypass, Referer-header API key leak, OAuth audience confusion, GraphQL field-suggestion leak, pagination cursor tampering, upload content-type spoofing, exposed OpenAPI spec, exposed source map leaking a hardcoded key) |
| **Cryptography** (new category) | 13 | +13 (ECB block-shuffling, hash length extension, JWT algorithm confusion, predictable PRNG session tokens, AES-CTR nonce reuse, Bleichenbacher RSA padding oracle, UUIDv1 reset-token entropy, ECDSA nonce reuse, Logjam DHE_EXPORT downgrade, batch GCD shared-prime attack, TOTP shared-secret reuse, PBKDF2 insufficient iteration count, CBC bit-flipping admin-cookie forgery) |

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
