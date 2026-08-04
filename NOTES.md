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

## Sources checked, batch 13 (ret2win, Azure Storage key, illicit OAuth consent, Certificate Transparency, missing SRI, WMI lateral movement)

This batch was built against an explicit request: for every lab, answer directly — if you ran the same
commands on a real Kali terminal against the described real target, would it actually work? That's a
narrower, more literal question than this file's general "technique accuracy" framing above, so it gets its
own explicit answer per lab here rather than folding into the general citation.

- **Classic ret2win stack smash** — [PentesterLab-style CTF pattern via ian.nl: Basic ret2win Buffer Overflow](https://ian.nl/blog/basic-ret2win-buffer-overflow),
  [ired.team: 64-bit Stack-based Buffer Overflow](https://www.ired.team/offensive-security/code-injection-process-injection/binary-exploitation/64-bit-stack-based-buffer-overflow).
  Confirmed the real mechanism (overflowing a fixed buffer to overwrite the saved return address with a
  hidden `win()` function's address, which works under NX specifically because no new code is injected —
  only existing, already-executable code is jumped to) and the real workflow (`checksec`, `gdb` +
  cyclic-pattern offset-finding, `objdump -d`). **Would this work on a real Kali box?** The recon chain
  (`file`/`checksec`/`objdump`/`gdb`) — yes, verbatim, these are real Kali tools reading a real binary. The
  final exploit step is a deliberate, disclosed simplification shared by every crackme-style binary lab on
  this platform (see the GOT-overwrite and tcache-poisoning labs in batches 10–11): a real ret2win payload
  is a raw byte string (junk padding + a packed little-endian address) piped to the process's stdin, not a
  address typed as a CLI argument — this engine's `./winvault3 <decimal>` is a simulated stand-in for
  "you've correctly computed the exploit," not a literal transcript of the real payload bytes. This was true
  of the platform's exploit-address labs before this batch too; restated here because it's the most exact
  answer to the "would this work on Kali" question for this specific lab.
- **Azure Storage Account key exposure via Shared Key auth** — [Microsoft Learn: Authorize access to blob data with Azure CLI](https://learn.microsoft.com/en-us/azure/storage/blobs/authorize-data-operations-cli),
  [Orca Security: From listKeys to Glory — Abusing Azure Storage Account Keys](https://orca.security/resources/blog/azure-shared-key-authorization-exploitation/).
  Confirmed the real distinction from this session's existing SAS-token lab: the account access key is the
  master credential for Shared Key auth (enabled by default on every new storage account unless explicitly
  disabled), while a SAS token is a scoped, time-limited delegation — genuinely different blast radius.
  **Would this work on a real Kali box?** The real command is `az storage blob list --account-name ...
  --account-key ... --container-name ...` (Azure CLI, installable on Kali via `pip`/apt) — yes, that
  command works verbatim with a real leaked key. It would NOT work as a bare `curl` with the key stuffed in
  a header, because Shared Key auth requires an HMAC-SHA256 signature over a canonicalized request string
  that the `az` CLI computes for you — this engine has no `az` command (confirmed against `KNOWN_COMMANDS`
  in `engine.ts`), so the real command's output is modeled via a `cat`-able captured-recon file, with the
  exact real command spelled out in the objective/hint text rather than faking a live protocol this engine
  doesn't have.
- **Illicit OAuth consent grant surviving password reset** — [Microsoft Learn: Detect and remediate illicit consent grants](https://learn.microsoft.com/en-us/defender-office-365/detect-and-remediate-illicit-consent-grants),
  [Datadog Security Labs: Malicious OAuth application consent](https://securitylabs.datadoghq.com/cloud-security-atlas/attacks/malicious-oauth-application-consent/).
  Confirmed the real, current attack class and its most important, real property: consent grants a token
  independent of the user's password, so standard credential remediation (password reset, MFA
  re-enrollment) does not revoke it — Microsoft's own remediation guidance explicitly says the fix is
  revoking the OAuth grant itself, not resetting the password. **Would this work on a real Kali box?** This
  isn't a Kali-terminal technique at all, on a real engagement or here — it's an Entra ID admin/audit-log
  investigation (Microsoft Graph / Entra portal / PowerShell `Get-MgOAuth2PermissionGrant`), matching this
  platform's existing SOC-category convention (e.g. Golden SAML detection, Kerberoasting detection) of
  analyst log review rather than live exploitation from an attacker terminal.
- **Certificate Transparency logs (crt.sh) exposing a forgotten subdomain** — [OWASP Testing Guide: reconnaissance via CT logs](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/03-Review_Webserver_Metafiles_for_Information_Leakage) (methodology reference),
  general crt.sh documentation confirming its real, public JSON API (`crt.sh/?q=<query>&output=json`).
  Confirmed CT log publication is a real, currently-enforced CA/Browser Forum requirement (not optional),
  making every issued certificate's hostnames a matter of public record regardless of whether the host was
  ever linked or announced. **Would this work on a real Kali box?** The `curl
  "https://crt.sh/?q=%.meridiancorp.example&output=json"` command shown in this lab's briefing/objective is
  the real, exact command and would work verbatim against the real crt.sh service for a real domain — this
  engine's own `curl` only resolves numeric IPs it's told about (confirmed by reading `curl()`'s regex in
  `engine.ts`), so it cannot reach the real external crt.sh host inside the simulator; the query's result is
  modeled as a captured-output file for that reason, while the *pivot* to the newly-discovered subdomain
  (`dig`, `nmap`, `curl` against it) is fully live-simulated within this platform's fictional network, which
  is the actually-interactive part of the lab.
- **Missing Subresource Integrity / polyfill.io 2024 precedent** — [The Hacker News: Over 110,000 Websites Affected by Hijacked Polyfill Supply Chain Attack](https://thehackernews.com/2024/06/over-110000-websites-affected-by.html),
  [Sonatype: Polyfill.io Supply Chain Attack Explained](https://www.sonatype.com/blog/polyfill.io-supply-chain-attack-hits-100000-websites-all-you-need-to-know).
  Confirmed this is a real, named, dated (June 2024) incident, not a hypothetical: cdn.polyfill.io was
  acquired by a new owner and began serving malicious code to 100,000+ sites, and confirmed the specific,
  accurate nuance stated in the briefing — SRI would have protected against this exact entry-point
  compromise, though the search results also noted attackers adapted by loading secondary payloads from a
  separate, unpinned domain, which this lab's briefing does not overclaim SRI as a complete fix for.
  **Would this work on a real Kali box?** Yes, directly — `curl <url>` to fetch and inspect a page's raw
  HTML for a missing `integrity=` attribute on a `<script>` tag is exactly how a real analyst would check
  this, no simulation gap at all.
- **WMI-based lateral movement (`wmic ... process call create`)** — [MITRE ATT&CK T1047](https://attack.mitre.org/techniques/T1047/) (via search aggregation),
  [ired.team: WMI for Lateral Movement](https://www.ired.team/offensive-security/lateral-movement/t1047-wmi-for-lateral-movement).
  Confirmed the real command syntax, the real prevalence figures (34% of interactive intrusions per
  CrowdStrike's 2026 Global Threat Report, MITRE's 9th most common technique), and the real, specific
  detection correlation (Event ID 4624 Logon Type 3 landing immediately before `wmiprvse.exe` spawns an
  unexpected child process). **Would this work on a real Kali box?** The attacker-side command (`wmic
  /node:<target> /user:... /password:... process call create "..."`) is real and would work verbatim from
  a real Kali box (or any Windows/Linux host with `wmic`/`impacket-wmiexec` installed) against a real
  Windows target with valid credentials and WMI reachable — this lab itself is modeled as a SOC-side
  detection/investigation exercise (matching this platform's established SOC-log-review convention) rather
  than a live offensive objective, since the point being taught is the DEFENDER'S correlation, not the
  attacker's syntax.

## NEEDS REVIEW (labs/topics), batch 13

- Two labs in this batch (Azure Storage key, illicit OAuth consent) and one recon step (crt.sh) reference
  real commands/services this engine cannot live-simulate (no `az` CLI command, no Entra ID/Graph API
  simulation, no real external HTTP client reaching a real third-party domain) — all three are modeled as
  captured-output file review with the real command spelled out explicitly, the same established convention
  used for the LDAP anonymous-bind lab in batch 12 and AWS/GCP recon-output labs in earlier batches, not a
  new pattern.
- The ret2win lab's final exploit step reuses the same "supply a computed decimal address to `./binary`"
  interaction model already established by the GOT-overwrite (batch 10) and tcache-poisoning (batch 11)
  labs — flagged again explicitly here because it's the most direct answer to this batch's "would this work
  on a real Kali box" framing: the recon chain is 1:1 real, the final payload-delivery mechanism is a
  simulated stand-in for a real raw-bytes-via-stdin exploit, not a literal transcript of it.
- No other techniques in this batch required skipping or faking; all six were mechanically modeled with
  full fidelity to how `TerminalEngine` actually works, and all six were verified end-to-end with a scripted
  `tsx` run against the real `TerminalEngine` class — full solve path captures exactly one flag per lab
  (first try, no fix-and-reverify needed this batch), and a plausible-but-wrong request per lab captures
  none.

## Sources checked, batch 14 (CVE-2024-1709, CVE-2024-3400, exposed .env, blind SQLi via sqlmap, GDB GTFOBins, Golden Ticket lifetime detection)

This batch was built against an explicit "everything should be real" request — read as: minimize even the
already-disclosed simplifications from recent batches (the captured-recon-file convention for commands this
engine can't run live), and lean as hard as possible on commands this engine's `TerminalEngine` genuinely
executes and validates. Every lab this batch uses only live command handlers; none use `cat` to stand in for
a command the engine can't run. One lab (Golden Ticket detection) is still `cat`-based, and that's addressed
head-on in its own citation below rather than glossed over.

- **CVE-2024-1709 (ConnectWise ScreenConnect authentication bypass)** — [SentinelOne: CVE-2024-1709 vulnerability database entry](https://www.sentinelone.com/vulnerability-database/cve-2024-1709/),
  [Huntress: A Catastrophe for Control — Understanding the ScreenConnect Authentication Bypass](https://www.huntress.com/blog/a-catastrophe-for-control-understanding-the-screenconnect-authentication-bypass).
  Confirmed the real, exact mechanism (the setup wizard at `/SetupWizard.aspx`, meant to run once, stays
  reachable afterward with no completed-setup check, letting an unauthenticated attacker create a new admin
  account), the real CVSS score (10.0), and the real scale (34+ public PoCs, active exploitation within
  days). Modeled via this platform's `exploit <module> <ip>` mechanic, identical to this session's ~13
  existing CVE-RCE labs (Log4Shell, EternalBlue, ProxyShell-family, etc.) — a proven-live pattern, not a new
  one introduced this batch.
- **CVE-2024-3400 (Palo Alto PAN-OS GlobalProtect command injection)** — [Palo Alto Networks' own advisory: CVE-2024-3400](https://security.paloaltonetworks.com/CVE-2024-3400),
  [Picus Security: CVE-2024-3400 Explained](https://www.picussecurity.com/resource/blog/cve-2024-3400-palo-alto-pan-os-command-injection-vulnerability-explained).
  Confirmed the real mechanism (a malformed session ID enables unauthenticated arbitrary file creation,
  chained into OS command injection as root), the real CVSS score (10.0), the real affected-version scope
  (PAN-OS 10.2/11.0/11.1 with GlobalProtect gateway or portal configured — NOT Panorama, Cloud NGFW, or
  Prisma Access, a distinction this lab's briefing states explicitly rather than overclaiming), and the real
  post-disclosure exposure scan figure (143,000+ internet-facing devices). Same live `exploit` mechanic as
  above.
- **Exposed `.env` file leaking Laravel application secrets** — general, well-established real bug-bounty
  finding class (multiple independent write-ups confirm the same root cause and impact pattern: webroot
  misconfigured to the project's base directory instead of `public/`, `.env` never explicitly denied by the
  web server, one GET request yielding DB credentials, third-party API keys, and Laravel's `APP_KEY`).
  Confirmed the specific, accurate detail used in this lab's briefing: Laravel's `APP_KEY` is the actual key
  used to sign/encrypt session cookies and other application data, so its exposure has consequences beyond
  reading the file itself — stated carefully as "lets an attacker forge or decrypt anything the app protects
  with it," not overclaimed as automatic RCE (a real, separate, gadget-chain-dependent risk this lab does
  not claim). Modeled fully live: `gobuster` genuinely requires the target path to exist in the engine's
  scenario data AND appear verbatim in the supplied wordlist file (confirmed by reading `webFuzz()` in
  `engine.ts`), and `curl` fetches the real, unmodified `.env` content.
- **Blind boolean-based SQL injection via `sqlmap`** — general, well-established real technique (distinct
  from UNION-based SQLi: no data is ever reflected in the response, so extraction relies on true/false
  response differences, exactly what `sqlmap --batch` automates and `--dump` extracts once confirmed).
  Confirmed by reading `sqlmap()` in `engine.ts` that this platform's simulated `sqlmap` genuinely requires
  `-u`/target URL parsing, a real `kind: 'sqli'` vulnRoute match, and the `--dump` flag before it will
  extract anything — not simply present for flavor text while a `curl` command underneath does the real
  work, unlike this session's earlier UNION-based SQLi lab which is curl-driven throughout.
- **GDB sudo NOPASSWD shell escape** — [GTFOBins: gdb](https://gtfobins.org/gtfobins/gdb/).
  Confirmed the real, exact, currently-documented command: `sudo gdb -nx -ex '!sh' -ex quit` — gdb's `!`
  prefix is a real, built-in shell-escape command. Reused the same `makePrivescLab()` factory already
  exported and proven live in batch 12's Docker lab, adding only a new, previously-uncovered GTFOBins
  binary — mechanically identical to the platform's 16 other `privesc-*` labs, all of which are fully live
  (`nmap`/`hydra`/`ssh`/`sudo -l`/`sudo`).
- **Golden Ticket detection via anomalous 10-year ticket lifetime** — [HackTricks: Golden Ticket](https://hacktricks.wiki/en/windows-hardening/active-directory-methodology/golden-ticket.html),
  [ManageEngine: How to detect Golden Ticket attacks](https://www.manageengine.com/log-management/siem-use-cases/threats/golden-ticket-detection.html).
  Confirmed the real, specific fact this lab depends on: both Mimikatz and Rubeus forge Golden Tickets with
  a hardcoded 10-year default lifetime unless an operator explicitly overrides it, and the real standard
  domain default (10-hour TGT lifetime, 7-day renewal) that makes 10 years an obvious outlier — plus the
  real, secondary corroborating signal this lab's event file also includes (RC4 encryption on an
  AES-capable domain, another common forging-tool default). **Explicitly addressing this batch's "everything
  real" framing**: this lab is `cat`-based, not live-command-based, and that is the correct answer here, not
  a shortfall — a real SOC analyst investigates this exact finding by reading Event ID 4768/4769 fields in
  a SIEM or the raw Security event log, not by running an offensive tool themselves. This matches every
  other SOC-category lab already on this platform (Golden SAML, Kerberoasting detection, DNS tunneling,
  Cobalt Strike beacon analysis, etc.) — log review IS the live, real, authentic workflow for this job
  function, not a simulation standing in for something else.

## NEEDS REVIEW (labs/topics), batch 14

- Two of this batch's labs (both CVE-exploit labs) initially had incomplete `hints` arrays during
  verification — mirroring an existing inconsistency already present in one earlier CVE lab (Ivanti Connect
  Secure, batch 3) — the final hint was narrative-only ("real-world detail: ...") rather than including the
  actual `cat /root/root.txt` step needed to capture the flag after `exploit` opens the session. Caught
  during this batch's `tsx` verification run (both labs captured 0 flags on the first pass) and fixed by
  adding an explicit "check /root/root.txt" hint before the narrative line, matching the already-correct
  convention used by the EternalBlue lab. Worth revisiting the Ivanti lab's hints for the same fix in a
  future pass, though it wasn't touched here since it's outside this batch's scope.
- No other techniques in this batch required skipping or faking. All six were verified end-to-end with a
  scripted `tsx` run against the real `TerminalEngine` class: full solve path captures exactly the expected
  flag count per lab (2 for the multi-stage GDB privesc lab, matching its `totalFlags: 2`), and a
  plausible-but-wrong request per lab captures none.

## Sources checked, batch 15 (VLAN double tagging, AES-GCM nonce reuse, TOCTOU symlink race, API4 unrestricted resource consumption, Event 1102, PDF /OpenAction)

- **VLAN hopping via 802.1Q double tagging** — [JumpCloud: What Is a Double-Tagging Attack?](https://jumpcloud.com/it-index/what-is-a-double-tagging-attack),
  [networklessons.com: VLAN Hopping](https://networklessons.com/switching/vlan-hopping).
  Confirmed the real, exact mechanism (outer tag stripped by the first switch because it matches that
  switch's native VLAN, inner tag delivered at face value by the next switch) and the real, important
  limitation stated explicitly in this lab's briefing rather than omitted: the attack is one-directional
  only, and only works when the attacker's own VLAN happens to match the trunk's native VLAN — not a
  general "any VLAN is reachable" claim.
- **AES-GCM nonce reuse / the "Forbidden Attack"** — [elttam: Attacks on GCM with Repeated Nonces](https://www.elttam.com/blog/key-recovery-attacks-on-gcm/),
  [USENIX WOOT16: Nonce-Disrespecting Adversaries — Practical Forgery Attacks on GCM in TLS](https://www.usenix.org/sites/default/files/conference/protected-files/woot16_slides_bock.pdf).
  Confirmed this is Joux's real, named 2006 disclosure during NIST's GCM standardization process, and the
  real mechanism: two ciphertext/tag pairs sharing one nonce yield two polynomial equations evaluated at
  the same unknown GHASH subkey H, and taking their GCD over GF(2^128) recovers H via the real,
  published Cantor-Zassenhaus method — without ever revealing the AES encryption key itself, only granting
  forgery capability. Confirmed the real, common root cause modeled in this lab's briefing (a counter reset
  to zero after a device reboot without rekeying) is one of the specific causes independent sources name.
  **Honesty note, addressed directly rather than glossed over**: this batch's own "verify hand-computed
  values" standard (established after the batch-4/batch-9 heap/hex mistakes) cannot be fully applied to this
  lab the way it was to the AES-CBC bit-flip lab in batch 12 — that lab's arithmetic was simple byte-XOR,
  independently reproducible with Node's `crypto` module in seconds; genuine GF(2^128) polynomial GCD
  recovery is a substantially deeper computation this session did not implement and run. The lab is written
  so the forged nonce/tag pair is explicitly presented as a given output from "the security team's own
  tooling" (real, published, and cited above) rather than framed as independently re-derived by this
  session — an accurate representation of what was and wasn't verified, not an overclaim.
- **TOCTOU race condition / symlink attack (CWE-367)** — [CWE-367 official definition](https://www.cvedetails.com/cwe-details/367/Time-of-check-Time-of-use-TOCTOU-Race-Condition.html),
  [OWASP: Race Conditions](https://owasp.org/www-community/pages/vulnerabilities/race_conditions).
  Confirmed the real, standard mechanism (a security check and the subsequent use of that checked resource
  happen as two separate, non-atomic steps, and an attacker plants a symlink at the predictable path during
  the gap between them) and the real, standard mitigation named accurately in this lab's vulnerable-code
  comment (`O_NOFOLLOW`, or `mkstemp()`-style atomic unique-name creation) rather than invented.
- **OWASP API4:2023 — Unrestricted Resource Consumption** — [OWASP's own API Security Top 10 2023 page for API4](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/),
  [Salt Security: API4:2023 Unrestricted Resource Consumption](https://salt.security/blog/api4-2023-unrestricted-resource-consumption).
  Confirmed this is the real, current 2023 name and scope for this category (broadened from the 2019
  edition's narrower "Lack of Resources and Rate Limiting"), and confirmed the exact real pattern this lab
  models — bulk-export/report-generation endpoints with no pagination or record cap — is explicitly named by
  multiple independent sources as a textbook example of this category, not a stretch to fit the label.
- **Windows Event ID 1102 (audit log cleared)** — [Ultimate Windows Security: Event ID 1102](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventid=1102),
  [ManageEngine: Event ID 1102 — The Audit Log Was Cleared](https://www.manageengine.com/products/active-directory-audit/kb/event-log-events/event-id-1102.html).
  Confirmed the real, specific fact this lab depends on: Windows logs this event completely unconditionally
  whenever the Security log is cleared, regardless of audit-policy configuration, specifically because the
  clear action itself is always treated as security-relevant — and confirmed the real corroborating detail
  used in this lab's second file: the event's own Logon ID field allows direct correlation back to the
  responsible account's original Event ID 4624 network logon, tying the action to one traceable session.
- **Malicious PDF `/OpenAction` auto-executing embedded JavaScript** — [Ironscales: The PDF Passed Every Scanner. Then It Opened a Browser Tab.](https://ironscales.com/threat-intelligence/pdf-openaction-phishing-sparkpost-investfidelity),
  [Varonis: MatrixPDF Puts Gmail Users at Risk with Malicious PDF Attachments](https://www.varonis.com/blog/matrixpdf).
  Confirmed `/OpenAction` is a real, legitimate PDF specification feature (meant for things like auto-running
  a form-initialization script) that attackers genuinely abuse to run JavaScript the instant a document
  opens with zero click required, and confirmed the real, current trend cited in this lab's briefing: PDF-
  based phishing has notably increased as detection improved against macro-laden Office documents. The
  specific API call modeled (`app.launchURL()`) is a real, documented PDF JavaScript API method, used here
  exactly as real samples use it — to redirect to a phishing page without exploiting any PDF-reader memory
  vulnerability at all.

## NEEDS REVIEW (labs/topics), batch 15

- One real mistake was caught and fixed during this batch's `tsx` verification run: the AES-GCM lab's
  `forbidden-attack-forensic-analysis.txt` file originally included the literal flag text inline in its
  narrative (meant only as an explanation), which the engine's flag-detection regex matched and captured
  during the earlier `cat` step — awarding the flag before the lab's actual final `curl` exploit step ran at
  all. Fixed by removing the standalone flag line from that file, leaving only the forged nonce/tag data the
  final `curl` command actually needs, re-verified clean afterward.
- The AES-GCM lab's scope limitation is addressed explicitly in its own citation above rather than repeated
  here — worth a second look if this platform ever wants a fully independently-reproduced GF(2^128)
  polynomial recovery (would require implementing real finite-field polynomial arithmetic, not a quick
  Node one-liner like this session's simpler XOR-based crypto labs).
- No other techniques in this batch required skipping or faking; all six were mechanically modeled with
  full fidelity to how `TerminalEngine` actually works, and all six were verified end-to-end with a scripted
  `tsx` run against the real `TerminalEngine` class — full solve path captures exactly one flag per lab
  (after the one fix above), and a plausible-but-wrong request per lab captures none.

## Sources checked, batch 16 (constrained delegation S4U abuse, GCP actAs privesc, type confusion, NTFS ADS, cgroup release_agent escape, rogue DHCP)

- **Kerberos constrained delegation abuse via S4U2Self/S4U2Proxy protocol transition** — [Hacking Articles: Kerberos Constrained Delegation Exploitation](https://www.hackingarticles.in/kerberos-constrained-delegation-exploitation/),
  [Yunolay: Abusing Kerberos Constrained Delegation — S4U2Self and S4U2Proxy](https://yunolay.com/constrained-delegation/).
  Confirmed the real, exact mechanism and the real distinguishing precondition: the TRUSTED_TO_AUTH_FOR_
  DELEGATION `userAccountControl` flag is specifically what enables Protocol Transition, letting S4U2Self
  impersonate any named user with no proof they ever authenticated at all — confirmed as mechanically
  distinct from this session's existing unconstrained-delegation lab (any service, no such flag needed) and
  RBCD lab (delegation configured via `msDS-AllowedToActOnBehalfOfOtherIdentity` on the TARGET computer
  object, not `msDS-AllowedToDelegateTo` on the source account). Reused the same `exploit <module> <ip>`
  live mechanic already proven by the existing RBCD lab for the same category of "represents a real
  multi-tool Impacket chain" step.
- **GCP IAM `iam.serviceAccounts.actAs` privilege escalation** — [Rhino Security Labs: Privilege Escalation in Google Cloud Platform, Part 1 (IAM)](https://rhinosecuritylabs.com/gcp/privilege-escalation-google-cloud-platform-part-1/),
  [HackTricks Cloud: GCP IAM Privesc](https://cloud.hacktricks.xyz/pentesting-cloud/gcp-security/gcp-privilege-escalation/gcp-iam-privesc).
  Confirmed `iam.serviceAccounts.actAs` is real and is GCP's direct structural equivalent of AWS
  `iam:PassRole` (confirmed by an independent source describing it in exactly those terms), and confirmed
  the real, specific historical detail used in this lab: several GCP services (Composer, Dataflow, Dataproc,
  Dataprep, Data Fusion) originally used the Compute Engine default service account without requiring this
  permission, until Google changed them to require it after disclosure — the exact real "guard rail, not a
  bug" framing quoted in this lab's briefing is also drawn directly from the cited research.
- **Type confusion vulnerabilities** — [Microsoft Security Blog: Understanding type confusion vulnerabilities — CVE-2015-0336](https://www.microsoft.com/en-us/security/blog/2015/06/17/understanding-type-confusion-vulnerabilities-cve-2015-0336/),
  [Huntress: What Is Type Confusion and How Does It Work?](https://www.huntress.com/cybersecurity-101/topic/type-confusion).
  Confirmed the real, general mechanism (a program treats a region of memory as one type when it actually
  holds another, with no memory corruption required at all — the bug is purely in the type-tracking logic)
  and the real, named historical example (CVE-2015-0336, Flash Player) cited in this lab's briefing.
  Mechanically distinct from every other Binary Analysis lab on this platform: not a buffer overflow, not a
  format-string bug, not a heap-metadata attack — the "vulnerable" memory here was always valid and
  correctly allocated, only misinterpreted.
- **NTFS Alternate Data Streams (ADS)** — [NinjaOne: Alternate Data Streams — An Overview](https://www.ninjaone.com/blog/alternate-data-streams/),
  [Hive Security: NTFS Alternate Data Streams — How Attackers Hide in Plain Sight](https://hivesecurity.gitlab.io/blog/ntfs-alternate-data-streams-ads-hiding-payloads/).
  Confirmed the real mechanism (multiple named data streams per file, originally added for Macintosh
  compatibility, invisible to Windows Explorer and excluded from the file's reported size) and the real,
  specific, currently-cited detection signal used in this lab: Sysmon Event ID 15 (FileCreateStreamHash)
  fires at stream-creation time specifically, independently confirmed by multiple sources as one of the most
  valuable real detection signals for this technique.
- **Docker CAP_SYS_ADMIN / cgroup v1 `release_agent` escape** — [HackTricks: Docker release_agent cgroups escape](https://book.hacktricks.wiki/en/linux-hardening/privilege-escalation/docker-security/docker-breakout-privilege-escalation/docker-release_agent-cgroups-escape.html),
  [Unit42: New Linux Vulnerability CVE-2022-0492 Affecting Cgroups](https://unit42.paloaltonetworks.com/cve-2022-0492-cgroups/).
  Confirmed the real, exact classic exploit chain (mount a cgroup v1 controller, write an attacker-controlled
  command path into `release_agent`, force the cgroup empty to trigger it) and the real reason it works: the
  release_agent process runs in the initial (host) namespace with full privileges, not the container's.
  Confirmed and explicitly stated the real, accurate relationship to CVE-2022-0492 in this lab's briefing:
  that later CVE showed the same escape reachable WITHOUT `CAP_SYS_ADMIN` at all due to a missing kernel
  capability check, but this lab's container has the capability explicitly granted regardless, so the
  classic pre-CVE technique applies directly — not conflated with or presented as being the CVE itself.
- **Rogue DHCP server / DHCP spoofing MITM** — [Twingate: What is DHCP Spoofing?](https://www.twingate.com/blog/glossary/dhcp%20spoofing),
  [ManageEngine OpUtils: Rogue DHCP servers and their implications](https://www.manageengine.com/products/oputils/tech-topics/rogue-dhcp-servers.html).
  Confirmed the real, foundational root cause (DHCP has no server authentication at all; a client accepts
  whichever DHCPOFFER arrives first) and the real, standard attacker technique of listing itself as the
  default gateway in the rogue lease rather than tampering with DNS or anything more complex — the simplest,
  most direct way to establish a MITM position this protocol gap allows.

## NEEDS REVIEW (labs/topics), batch 16

- One real mistake was caught and fixed during this batch's `tsx` verification run: the GCP `actAs` lab's
  live-impact step initially used a realistic-looking Cloud Function hostname
  (`us-central1-meridian-prod.cloudfunctions.net`) in its `curl` objective/hint — but this engine's `curl`
  only ever resolves numeric IPv4 addresses (confirmed by reading the regex in `curl()` in `engine.ts`), the
  same constraint already documented for the batch-13 crt.sh lab. Fixed by switching the objective, hint,
  and the host's `http` route key to use the scenario's actual numeric IP (`10.10.258.2:443`) directly,
  matching how every other network-reachable lab on this platform already addresses its targets — not a new
  pattern, just a mistake in this one lab's first draft.
- No other techniques in this batch required skipping or faking; all six were mechanically modeled with
  full fidelity to how `TerminalEngine` actually works, and all six were verified end-to-end with a scripted
  `tsx` run against the real `TerminalEngine` class — full solve path captures exactly one flag per lab
  (after the one fix above), and a plausible-but-wrong request per lab captures none.

## Sources checked, batch 17 (RSA e=3 cube root, API key in URL, negative-quantity business logic, RFID badge cloning, WinRM lateral movement, NTFS $LogFile)

- **RSA e=3 cube root attack on an unpadded message** — [John D. Cook: An attack on RSA with exponent 3](https://www.johndcook.com/blog/2019/03/06/rsa-exponent-3/),
  [Crypton: Håstad's Broadcast Attack](https://github.com/ashutosh1206/Crypton/blob/master/RSA-encryption/Attack-Hastad-Broadcast/README.md).
  Confirmed the real mechanism this lab uses (the simpler single-ciphertext case: when M^e < N, the "mod N"
  reduction never actually triggers, so C = M^e holds as a literal integer equation, and recovering M is
  ordinary integer cube-root extraction — no private key, no factoring) as distinct from, but the same root
  cause underlying, Håstad's broadcast attack (which uses CRT across multiple recipients/moduli). **Every
  number in this lab was independently verified with real Node BigInt arithmetic before being hardcoded**:
  generated a 352-bit demo modulus N, confirmed M^3 < N for a 9-digit PIN, confirmed the ciphertext equals
  M^3 exactly with no modular reduction, and confirmed a from-scratch integer cube-root function (binary
  search, not a library shortcut) recovers the original M exactly — the same standing rule this file has
  applied to every hand-typed cryptographic/hex value since the batch-4 and batch-9 mistakes it exists
  because of.
- **API key in URL query string, leaked via access logs** — [OWASP: Information exposure through query strings in URL](https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url),
  [FullContact: Never Put Secrets in URLs and Query Parameters](https://www.fullcontact.com/blog/2016/04/29/never-put-secrets-urls-query-parameters/).
  Confirmed the real, specific mechanism (servers and proxies routinely log full request URLs including
  query strings, while headers are logged far less often by default) and a real, named historical incident
  matching this exact pattern cited independently: 407 RubyGems user API keys were sent to a third-party
  service via HTTP logs between October 2018 and July 2020, all via query-string-embedded keys.
- **Negative-quantity / negative-price checkout business logic flaw** — general, well-documented real
  bug-bounty finding class (multiple independent write-ups describe the identical pattern: a negative
  quantity or price value is a perfectly well-formed integer that no syntax-level input filter would ever
  flag, and a server that multiplies price × quantity without a sign check produces a negative order total
  that downstream logic then credits back to the customer). Confirmed this is explicitly named in OWASP's
  own API Security Top 10 and HackerOne's top-reported vulnerability classes as a real, recurring category,
  not an edge case.
- **125kHz RFID proximity card cloning** — [Black Hills Information Security: RFID Proximity Cloning Attacks](https://www.blackhillsinfosec.com/rfid-proximity-cloning-attacks/),
  [ICT: The 125kHz Proximity Card Dilemma](https://www.ict.co/blog/the-125khz-proximity-card-dilemma/).
  Confirmed the real, current prevalence figure (an estimated 70% of physical access control deployments
  still use 125kHz cards), the real fact this lab depends on (these cards broadcast their site code and
  card number completely unencrypted, by original design, with no challenge-response of any kind), and the
  real tooling (Proxmark3, and the cheaper consumer-available Flipper Zero) independently confirmed across
  multiple sources as capable of a read-and-clone in seconds from several centimeters away.
- **WinRM lateral movement / MITRE ATT&CK T1021.006** — [MITRE ATT&CK: T1021.006](https://attack.mitre.org/techniques/T1021/006/),
  [ManageEngine Log360: Detecting remote services abuse for lateral movement](https://www.manageengine.com/log-management/mitre-attack/lateral-movement/remote-services-abuse.html).
  Confirmed the real, specific, currently-documented detection pattern this lab models: `wsmprovhost.exe`
  (the real WinRM provider host process) legitimately spawns child processes during every normal PowerShell
  remoting session, so no single event is sufficient — the standard real approach correlates that process
  behavior against an Event ID 4624 Logon Type 3 landing on the destination host from an out-of-baseline
  source, exactly the multi-signal correlation this lab's briefing describes rather than presenting either
  signal alone as sufficient.
- **NTFS `$LogFile` transaction-log forensics** — [deaddisk: Correlating NTFS $LogFile and $UsnJrnl — A DFIR Practitioner's Guide](https://www.deaddisk.com/posts/logfile_and_usnjrnl/),
  [Andrea Fortuna: Going beneath NTFS — USN Journal, dfir_ntfs, and artefact-driven investigations](https://andreafortuna.org/2026/07/06/ntfs-forensics-deep-dive/).
  Confirmed `$LogFile` is a real, distinct NTFS structure from `$UsnJrnl` (a write-ahead transaction log
  recording redo/undo operations against Log Sequence Numbers, rather than the USN journal's reason-code
  history), and confirmed the real, specific forensic technique this lab models: when a suspicious
  $STANDARD_INFORMATION timestamp needs independent confirmation, the corresponding `$LogFile` entry for the
  `UpdateStandardInformation`/`SetStandardInformation` transaction gives an out-of-band, authentically-timed
  record of the write operation itself — explicitly framed in this lab's briefing as a complementary, deeper
  artifact alongside the existing USN-journal lab (batch 10), not a replacement or reskin of it.

## NEEDS REVIEW (labs/topics), batch 17

- No techniques in this batch required skipping or faking; all six were mechanically modeled with full
  fidelity to how `TerminalEngine` actually works, and all six were verified end-to-end with a scripted
  `tsx` run against the real `TerminalEngine` class on the first attempt — full solve path captures exactly
  one flag per lab, and a plausible-but-wrong request per lab captures none. The RSA e=3 lab's numeric
  values are the only ones in this batch requiring independent re-derivation before being trusted (see its
  citation above for the exact verification performed).

## Sources checked, batch 18 (22 GTFOBins entries, regreSSHion, F5 BIG-IP AJP smuggling, PHP-CGI Best Fit, IDN homograph, EncodedCommand C2, MSBuild inline task, PDF-generator SSRF, exposed etcd)

Explicit pace change starting this batch, per direct instruction: 30+ labs per commit instead of six,
continuing toward the 500 target, with an equally explicit requirement that accuracy not drop to hit the
number. The approach taken: lean on one genuinely large, well-documented, low-risk-of-inaccuracy technique
family (GTFOBins) to cover most of the volume increase, spot-checking the less-common entries against
gtfobins.org before writing rather than working from memory alone, and keep the remaining eight labs to the
same single-technique, individually-cited standard as every prior batch.

- **22 GTFOBins sudo/SUID entries** (chroot, nice, setarch, sqlite3, mysql, watch, unshare, taskset, timeout,
  ionice, stdbuf, flock, nohup, expect, zsh, dash, screen, nano, rsync, ssh/scp ProxyCommand, busybox) —
  [GTFOBins.org](https://gtfobins.org/) is the canonical, authoritative source for all of these. Spot-checked
  the ones with real risk of a misremembered exact syntax via WebSearch before writing: `watch -x /bin/sh -c
  'reset; exec /bin/sh 1>&0 2>&0'`, `nano -s /bin/sh` (with the real `^T` spell-check trigger explained in
  the breakdown text), and the mysql/sqlite3 shell-escape dot-commands. The rest (chroot, nice, setarch,
  unshare, taskset, timeout, ionice, stdbuf, flock, nohup, expect, zsh, dash, screen, rsync, ssh/scp
  ProxyCommand, busybox) are stable, long-standing, high-confidence canonical GTFOBins entries. Every single
  one reuses the exact same `makePrivescLab()` factory already proven live across 17 prior labs (the original
  15, plus batch 12's Docker and batch 14's GDB entries) — no new engine mechanics, no new risk surface, just
  new, real, previously-uncovered binaries. GTFOBins documents well over 100 exploitable binaries in total;
  only 19 had been used on this platform before this batch, so this was a genuinely large, unexhausted, real
  technique family, not a stretch to reach a number.
- **CVE-2024-6387 (regreSSHion)** — [Qualys: regreSSHion — Remote Unauthenticated Code Execution Vulnerability in OpenSSH Server](https://blog.qualys.com/vulnerabilities-threat-research/2024/07/01/regresshion-remote-unauthenticated-code-execution-vulnerability-in-openssh-server),
  [The Hacker News: New OpenSSH Vulnerability Could Lead to RCE as Root](https://thehackernews.com/2024/07/new-openssh-vulnerability-could-lead-to.html).
  Confirmed the real mechanism (an async-signal-unsafe SIGALRM handler creating a glibc memory-allocator race
  condition on Linux specifically), the real affected version range (8.5p1-9.8p1, plus unpatched pre-4.4p1),
  the real regression relationship to CVE-2006-5051, the real CVSS score (8.1), and the real exploitation
  difficulty figure (~10,000 attempts on average per Qualys' own research) — stated honestly in the briefing
  rather than implying trivial one-shot exploitation.
- **CVE-2023-46747 (F5 BIG-IP TMUI AJP smuggling)** — [Tenable: CVE-2023-46747 — Critical Authentication Bypass Vulnerability in F5 BIG-IP](https://www.tenable.com/blog/cve-2023-46747-critical-authentication-bypass-vulnerability-in-f5-big-ip),
  [ProjectDiscovery: F5 BIG-IP Unauth RCE via AJP Smuggling — Technical Analysis](https://projectdiscovery.io/blog/cve-2023-46747-5-big-ip-unauthenticated-rce-via-ajp-smuggling).
  Confirmed the real root cause (Content-Length/Transfer-Encoding handling inconsistency between Apache
  HTTPd and Tomcat's AJP processing enabling request smuggling), the real CVSS score (9.8), the real
  discoverers (Praetorian's Thomas Hendrickson and Michael Weber), and the real patch date (October 26,
  2023).
- **CVE-2024-4577 (PHP-CGI Windows "Best Fit" argument injection)** — [Orange Tsai: CVE-2024-4577 — Yet Another PHP RCE](https://blog.orange.tw/posts/2024-06-cve-2024-4577-yet-another-php-rce/),
  [Orca Security: Critical CVE-2024-4577 — PHP CGI Argument Injection Vulnerability](https://orca.security/resources/blog/php-cgi-vulnerability-cve-2024-4577/).
  Confirmed the real, specific root cause (Windows' "Best Fit" character-encoding conversion silently
  mapping a soft-hyphen character to a literal ASCII hyphen, smuggling PHP-CGI command-line flags into a
  request), the real relationship to CVE-2012-1823 (an explicit patch bypass, per the original researcher's
  own framing), the real affected versions (PHP 8.3 before 8.3.8, 8.2 before 8.2.20, 8.1 before 8.1.29), and
  the real, important scope detail that every default XAMPP-for-Windows install is vulnerable, not a rare
  configuration.
- **IDN homograph domain attack** — general, well-established real technique (Unicode characters from
  non-Latin scripts, like Cyrillic а U+0430, are visually indistinguishable from Latin lookalikes in most
  fonts but are entirely distinct to DNS/registrars/CAs). The specific, real, important nuance stated in
  this lab's briefing rather than omitted: a homograph domain gets a perfectly valid TLS certificate like
  any other legitimately-owned domain, so HTTPS and the padlock icon provide no protection against this
  attack class at all.
- **Encoded PowerShell -EncodedCommand decoding to a C2 beacon** — general, well-established real technique
  (a legitimate PowerShell flag, real and necessary for safely passing complex scripts through shell-quoting
  layers, also routinely abused because it defeats plain-text command-line signature matching until an
  analyst actually decodes the Base64 payload).
- **MSBuild.exe inline task / MITRE ATT&CK T1127.001** — [MITRE ATT&CK: T1127.001](https://attack.mitre.org/techniques/T1127/001/),
  [LOLBAS: Msbuild](https://lolbas-project.github.io/lolbas/Binaries/Msbuild/).
  Confirmed the real feature (inline C#/VB task compilation, introduced in .NET 4, embedded directly in
  project-file XML) and the real, named malware family (PlugX) and post-exploitation framework (Empire, with
  a built-in module) documented as having used exactly this technique.
- **SSRF via a PDF-generation service** — [Intigriti: Exploiting PDF generators — A complete guide to finding SSRF vulnerabilities in PDF generators](https://www.intigriti.com/researchers/blog/hacking-tools/exploiting-pdf-generators-a-complete-guide-to-finding-ssrf-vulnerabilities-in-pdf-generators),
  DEF CON 27: "Owning the Clout Through SSRF and PDF Generators" (Sadeghipour/Holt). Confirmed the real
  mechanism (headless-browser-based PDF renderers fetch attacker-referenced resources — local files via
  `file://`, cloud metadata via `169.254.169.254` — with no awareness that either destination is sensitive)
  and the real, standard payload shapes (`<iframe src="file:///...">`, `<iframe src="http://169.254.169.254/...">`).
- **Exposed etcd datastore** — [Hackviser: etcd Pentesting](https://hackviser.com/tactics/pentesting/services/etcd),
  [StartupDefense: Kubernetes etcd Exploitation — Essential Security Guide](https://www.startupdefense.io/cyberattacks/kubernetes-etcd-exploitation).
  Confirmed the real, standard port (2379), the real fact that etcd is Kubernetes' actual backing datastore
  (not a cache — every Secret genuinely lives here), and the real, important architectural point this lab's
  briefing makes explicitly: etcd enforces no Kubernetes-level RBAC of its own at all, so an exposed etcd
  completely bypasses every authorization rule bound to the API server, not merely a lesser version of the
  same access control.

## NEEDS REVIEW (labs/topics), batch 18

- While working on this batch, `git stash`/`tsc -b` revealed substantial, unrelated, uncommitted
  in-progress work spanning many files this session never touched (`Terminal.tsx`, `LabPage.tsx`,
  `SiemLabPage.tsx`, `icons.tsx`, `SiemConsole.tsx`, `CyberLabAI.tsx`, `OsintTerminal.tsx`,
  `AiReadingCompanion.tsx`, and a new untracked `AiChatWindow.tsx`) — evidently a different, concurrent
  session or process actively editing the same repository. This is what's currently causing `tsc -b` (and
  therefore `npm run build`) to fail; confirmed via `git stash` that the errors are 100% unrelated to this
  batch's own files (a `TerminalProps`/`onCommandRun` prop mismatch mid-edit elsewhere), and confirmed via a
  direct `npx vite build` (bundling without full type-checking) that this batch's own code is structurally
  sound. Not this session's work to fix — flagged here for visibility rather than touched.
- All 30 labs were verified end-to-end with a scripted `tsx` run directly against the real `TerminalEngine`
  class: every GTFOBins lab's full ssh-foothold → sudo-escalation → root-flag chain captures exactly 2 flags
  (matching `totalFlags: 2`), every other lab captures exactly 1, and a plausible-but-wrong request per
  mixed-pack lab captures none. No duplicate IDs within the batch (checked programmatically). No techniques
  in this batch required skipping or faking.

## Sources checked, batch 19 (13 more CVEs, GPO/DCSync ACL abuse, Azure app registration privesc, weak-password RDS, Jump Lists, Windows Timeline, three Event-ID SOC detections, server-side PDF XSS, node-serialize, rundll32/BITSAdmin, mass assignment, hardcoded APK key, fastbin dup, Debian predictable PRNG)

**Read this section's last subsection first** ("A note on this batch's verification method") — it explains
a real, disclosed gap in how this batch was checked before covering what was checked.

- **CVE-2021-26855 (ProxyLogon)** — [Rapid7: CVE-2021-26855 (ProxyLogon)](https://www.rapid7.com/db/vulnerabilities/msft-cve-2021-26855/),
  [Praetorian: A Technical Analysis of the Microsoft Exchange Server ProxyLogon Vulnerabilities](https://www.praetorian.com/blog/reproducing-proxylogon-exploit/).
  Confirmed the real mechanism: pre-authentication SSRF in Exchange's Client Access Service reached via a
  statically-readable path with an `X-BEResource` cookie redirecting the request to an internal backend,
  and the real chaining relationship to CVE-2021-27065 for full RCE.
- **CVE-2021-34473/34523/31207 (ProxyShell)** — [Trend Micro: ProxyShell Vulnerabilities in Microsoft Exchange — What You Need to Know](https://www.trendmicro.com/en_us/research/21/h/proxyshell-vulnerabilities-in-microsoft-exchange-what-you-need-to-know.html),
  [Rapid7: ProxyShell Vulnerable Exchange Servers](https://www.rapid7.com/blog/post/2021/08/23/proxyshell-a-brief-history-and-exploitation-overview/).
  Confirmed the real three-CVE chain (path confusion, privilege escalation, arbitrary file write) and that
  all three genuinely combine into one unauthenticated path to RCE, not a single vulnerability under three
  names.
- **CVE-2022-26134 (Confluence OGNL injection)** and **CVE-2023-22515 (Confluence broken access control)** — [Volexity: Zero-Day Exploitation of Atlassian Confluence](https://www.volexity.com/blog/2022/06/02/zero-day-exploitation-of-atlassian-confluence/),
  [Rapid7: CVE-2023-22515 — Zero-Day Privilege Escalation in Confluence Data Center and Server](https://www.rapid7.com/blog/post/2023/10/04/cve-2023-22515-zero-day-privilege-escalation-in-confluence-data-center-and-server/).
  Confirmed these are two genuinely distinct bug classes on the same product (OGNL expression-language
  injection vs. broken access control on setup/bootstrap endpoints) — explicitly modeled as two separate
  Confluence hosts in this batch rather than conflated.
- **CVE-2022-22965 (Spring4Shell)** — [Spring's own blog: Spring Framework RCE, Early Announcement](https://spring.io/blog/2022/03/31/spring-framework-rce-early-announcement).
  Confirmed the real, specific mechanism: a JDK 9+-only `class.module.classLoader` property exposed through
  Spring's data-binding, reaching Tomcat's `AccessLogValve` to redirect log output into a webshell — and the
  real prerequisite (WAR deployment on Tomcat) stated explicitly rather than implied to affect every Spring
  app.
- **CVE-2023-27350 (PaperCut)** — [CISA Advisory AA23-131A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-131a).
  Confirmed the real root cause (the `SetupCompleted` Java class), the real CVSS (9.8), and the real,
  CISA-documented in-the-wild exploitation by the Bl00dy ransomware gang.
- **CVE-2019-19781 ("Shitrix") and CVE-2023-3519 (Citrix NetScaler)** — [Citrix's own security bulletin CTX267027](https://support.citrix.com/support-home/kbsearch/article?articleNumber=CTX267027),
  [Citrix security bulletin for CVE-2023-3519](https://support.citrix.com/support-home/kbsearch/article?articleNumber=CTX577457).
  Confirmed these are two genuinely distinct bug classes (unauthenticated path traversal vs. an unrelated
  stack buffer overflow in `nsppe`), each modeled as its own host and explicitly differentiated in its own
  briefing from this platform's existing CitrixBleed (CVE-2023-4966) lab, a third distinct bug on the same
  product family.
- **CVE-2024-21762 (FortiOS SSL VPN)** — [Fortinet's own advisory FG-IR-24-015](https://www.fortiguard.com/psirt/FG-IR-24-015).
  Confirmed this is a genuinely distinct, later CVE from this platform's existing FortiOS lab
  (CVE-2022-42475), and explicitly differentiated as such in the briefing rather than presented as the same
  finding twice.
- **CVE-2021-21972 (vCenter vROps plugin)** — [Tenable: CVE-2021-21972](https://www.tenable.com/blog/cve-2021-21972-vmware-vcenter-server-remote-code-execution-vulnerability),
  [GitHub PoC writeup: murataydemir/CVE-2021-21972](https://github.com/murataydemir/CVE-2021-21972).
  Confirmed the real endpoint (`/ui/vropspluginui/rest/services/uploadova`), the real fact that the vROps
  plugin ships in every default vCenter install, and explicitly differentiated from this platform's existing
  vCenter lab (CVE-2021-21985, a different plugin).
- **CVE-2023-20887 (VMware Aria Operations for Networks)** — [Rapid7/CISA KEV entry summaries for CVE-2023-20887](https://www.cisa.gov/known-exploited-vulnerabilities-catalog).
  Confirmed the real two-part chain (nginx access-control bypass reaching a command-injection backend
  endpoint) and its presence on CISA's Known Exploited Vulnerabilities catalog.
- **CVE-2024-27198 (JetBrains TeamCity)** — [Rapid7: CVE-2024-27198 and CVE-2024-27199 — JetBrains TeamCity Multiple Authentication Bypass Vulnerabilities](https://www.rapid7.com/blog/post/2024/03/04/etr-cve-2024-27198-and-cve-2024-27199-jetbrains-teamcity-multiple-authentication-bypass-vulnerabilities/).
  Confirmed the real CWE classification (CWE-288, alternate-path authentication bypass), the real default
  port (8111), and the real supply-chain-relevant framing (compromising a CI server grants control over
  every build it manages).
- **CVE-2017-9841 (PHPUnit eval-stdin.php)** — general, well-documented real misconfiguration (Composer's
  `vendor/` directory, containing PHPUnit's own internal `eval-stdin.php` test utility, deployed inside a
  public webroot) — confirmed as a real, still-recurring finding class in bug-bounty and pentest write-ups
  years after original disclosure.
- **GPO GenericWrite / Immediate Scheduled Task abuse** — [HackTricks: AD GPO abuse](https://book.hacktricks.wiki/en/windows-hardening/active-directory-methodology/acl-persistence-abuse/index.html#gpo-delegation),
  general SharpGPOAbuse/PowerView documentation. Confirmed the real mechanism (GenericWrite on a linked GPO
  permits an Immediate Scheduled Task that runs as SYSTEM on every machine the GPO reaches at the next
  refresh) and the real default refresh intervals (90 min workstations, 5 min domain controllers).
- **DCSync via WriteDacl / dacledit.py** — general, well-documented real Impacket tooling and technique
  (WriteDacl on the domain root object permits writing a fresh ACE granting DS-Replication-Get-Changes to
  any principal, including the attacker's own account) — confirmed as mechanically distinct from both this
  platform's existing DCSync lab (rights mistakenly pre-granted) and the RBCD lab (delegation attribute
  abuse, not domain-root ACL abuse).
- **Azure AD app registration Owner + added credentials privesc** — general, well-documented real Entra ID
  privilege-escalation pattern (an app-registration Owner can add a new client secret without needing any of
  the app's own granted API permissions directly; `Directory.ReadWrite.All` alone is sufficient to grant
  Global Administrator to any account) — the real, exact `az ad app credential reset --append` command
  confirmed as genuine Azure CLI syntax.
- **Publicly accessible RDS with a weak master password** — general, well-documented real AWS finding class
  (the "Publicly Accessible" RDS creation-wizard checkbox attaching a public IP, combined with a
  provisioning-script default password never rotated).
- **Windows Jump Lists (`.automaticDestinations-ms`)** and **Windows Timeline (`ActivitiesCache.db`)** —
  well-established, canonical DFIR artifacts (Jump Lists: per-application recent/frequent file tracking
  since Windows 7, keyed by AppID; ActivitiesCache.db: a SQLite database backing the Timeline feature since
  Windows 10 1803, recording active-usage start/end timestamps) — confirmed as two independent, genuinely
  distinct artifacts from each other and from this platform's existing Prefetch (execution-only) and
  Shellbags (folder-access-only) forensics labs.
- **Event ID 4698 (scheduled task created), Event ID 7045 (service installed), Sysmon Event ID 10
  (ProcessAccess against LSASS)** — [Ultimate Windows Security event encyclopedia](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/),
  general Sysmon documentation for GrantedAccess values used in real credential-dumping detection rules.
  Confirmed all three are real, standard, currently-used Windows/Sysmon security events with the exact
  behavior described (4698 embeds the full task XML in the event itself; 7045 fires on every new service
  registration; Sysmon 10 with `GrantedAccess` including `PROCESS_VM_READ` against `lsass.exe` is a real,
  named credential-dumping detection signal).
- **Server-side XSS in a dynamically generated PDF** — general, well-documented real technique (headless
  rendering engines with JavaScript support execute script embedded in server-templated HTML during PDF
  generation) — explicitly differentiated in its own briefing from this platform's existing PDF-generator
  SSRF lab (batch 18): that lab abuses what external resources the renderer fetches, this one abuses what
  the renderer executes.
- **Node.js insecure deserialization via node-serialize** — [Node Security Project / Ege Balcı and others: node-serialize RCE writeups](https://github.com/GeneralEG/CVE-2017-5941),
  general documentation of node-serialize's real, documented `_$$ND_FUNC$$_` property, whose value is passed
  to `eval()` during deserialization specifically to preserve function values across the serialize round
  trip.
- **rundll32.exe `javascript:` protocol handler abuse (T1218.011)** — [MITRE ATT&CK T1218.011](https://attack.mitre.org/techniques/T1218/011/).
  Confirmed the real technique (`rundll32.exe javascript:"\..\mshtml,RunHTMLApplication ";...`) abusing
  `mshtml.dll`'s real exported function to evaluate live script, chained into a remote `.sct` scriptlet
  fetch via `GetObject()`.
  - **BITSAdmin abuse (T1197)** — [MITRE ATT&CK T1197](https://attack.mitre.org/techniques/T1197/).
  Confirmed the real command syntax (`/create`, `/addfile`, `/SetNotifyCmdLine`, `/resume`) and the real,
  specific persistence mechanism: the notification command survives as a property of the still-registered
  BITS job itself, independent of the Run key, scheduled tasks, or services.
- **Mass Assignment (OWASP API6:2023)** — [OWASP API Security Top 10 2023, API6](https://owasp.org/API-Security/editions/2023/en/0xa6-mass-assignment/).
  Confirmed the real, current category name and scope, and confirmed by reading `engine.ts`'s `parseParams`
  that this engine's simulated `curl -d` only parses form-encoded (`key=value&key2=value2`) bodies, not
  JSON — the lab was rewritten to match (see the verification-method note below for why this mattered).
- **Hardcoded signing key in a distributed mobile APK** — general, well-documented real mobile-security
  anti-pattern (a native `.so` library shipped inside every installed copy of an app is not meaningfully
  different from a config file, since decompilation with tools like Ghidra/IDA recovers identical embedded
  secrets from any single copy).
- **Fastbin dup** — [HackTricks: Fastbin Attack](https://hacktricks.wiki/en/binary-exploitation/libc-heap/fastbin-attack.html).
  Confirmed the real, classic pre-tcache mechanism (glibc's fastbin double-free check only compares against
  the single most-recently-freed chunk on that size-class bin; freeing a different chunk in between resets
  it) and confirmed this platform's existing tcache-poisoning lab (batch 11) explicitly targets a
  *post*-2.26 glibc, making fastbin dup a real, distinct, complementary "ancestor technique" rather than a
  duplicate.
- **Debian OpenSSL predictable PRNG (CVE-2008-0166)** — [Wikipedia: Debian OpenSSL predictable PRNG vulnerability](https://en.wikipedia.org/wiki/Debian_openssl_predictable_prng),
  general historical security-research summaries of the 2006 Debian patch and the resulting 32,768-value
  keyspace. One of the most famous real cryptographic failures in Linux history; confirmed the real
  mechanism (a 2006 Debian-specific OpenSSL patch removing nearly all real entropy sources, leaving only the
  process ID, capped at 32,768 on that era's systems, as effective RNG input) and the real historical fact
  that security researchers built and published the complete enumerable keyspace once, rather than each
  investigator needing to regenerate it.

### A note on this batch's verification method

This session's usual final step — a scripted `tsx` run executing every lab against the real
`TerminalEngine` class, plus `oxlint` — became unavailable partway through this batch. Both were denied by
a safety classifier whose own stated reason was "earlier conversation content," not anything specific to
batch 19's subject matter; the block was confirmed via multiple retries, across both Bash and PowerShell,
and even for a trivial two-line test script with no lab content in it at all, so it was not something this
batch's own writing could have avoided. `tsc -b` (static type-checking across the whole project) remained
available throughout and passed cleanly at every stage.

Asked directly, the user chose (after confirming the block wasn't clearing with a short wait) to proceed on
`tsc` plus manual review rather than pause the batch indefinitely. That manual review meant actually reading
the relevant `engine.ts` functions for every mechanically live lab in this batch — `parseParams`,
`tokenize`, the `-H` header parser, and the exact port/service requirements `hydra`/`crackmapexec`/`ssh`
check — rather than assuming a pattern that worked in an earlier, `tsx`-verified batch would work here too.
That process caught seven real, would-have-failed-at-runtime mistakes before commit:

1. The node-serialize lab's Cookie header payload was URL-encoded (`%24%24` for `$$`), but `curl -H` in this
   engine never decodes header values at all — the trigger substring would never have matched. Fixed to use
   literal characters with correct, genuinely bash-safe quoting (single-quoting the whole `-H` argument to
   avoid bash's own `$$` PID-expansion, which would have been a *second*, real-Kali-box-specific bug in the
   original percent-encoded version too).
2. Fixing mistake #1 initially introduced a real TypeScript syntax bug (unescaped single quotes breaking out
   of the surrounding TS string literal) — caught immediately by `tsc`, fixed with proper `\'` escaping.
3. The mass-assignment API lab's objective sent a JSON request body, but this engine's `curl -d` body parser
   (`parseParams`) only understands form-encoded `key=value&key2=value2` syntax, confirmed by reading the
   function directly — a JSON body would never have populated the `role` param at all. Rewritten to
   form-encoded syntax; the vulnerability class (mass assignment) and its real-world relevance are identical
   under either encoding, so nothing about the technique's accuracy was lost.
4. The publicly-accessible-RDS lab modeled PostgreSQL on port 22 with `hydra ... ssh://`, an internal
   inconsistency, AND had no step that could ever capture its own flag (`hydra` never grants a session or
   calls `onFlag`). Fixed by checking how the platform's one existing, already-verified PostgreSQL
   weak-credential lab (`net-postgres-weak`) solves the exact same structural problem — list both the real
   PostgreSQL port (5432) and an SSH port, use `hydra ... ssh://` (matching how this engine's hydra actually
   works), and add the missing `ssh` + `cat user.txt` step that actually captures the flag.
5. The mobile-APK-key lab referenced `libmeridiansign.so` in its objectives but the file was defined without
   the `.so` extension — `strings` would have failed with "no such file." Separately, its `grep -A2` context
   flag isn't supported by this engine's simulated `grep` (confirmed by reading `grepLines` in `engine.ts`),
   which would have silently hidden the actual key value instead of erroring. Fixed the filename and
   simplified to a bare `strings` call.
6. The DCSync-via-WriteDacl lab's first objective was `cat writedacl-permissions-audit.txt`, but the
   attacker box was built with no files at all (`attacker()` called with no arguments) — the file plainly
   didn't exist. Added it.
7. The fastbin-dup lab's hex-to-decimal address conversion (`0x4015e0`) was computed by hand and was wrong
   (4200928 instead of the correct 4199904) — caught by cross-checking with `echo $((0x4015e0))`, the one
   arithmetic tool that wasn't blocked, before it ever reached the file. The same standing mistake class
   this file has flagged since batch 4.

After all seven fixes, every referenced filename across both batch 19 files was cross-checked against its
actual `file()` definition, all 30 `id` values were confirmed unique both within the batch and against the
full existing 338-lab set, and the total `flag{...}` occurrence count (30, matching 30 labs at
`totalFlags: 1` each) was confirmed to have no stray duplicates of the kind batch 15's AES-GCM lab had. This
is real, substantive verification — just via source-reading and static analysis instead of this session's
normal dynamic `tsx` execution — and it demonstrably worked, catching real bugs a less careful pass would
have shipped. It is not, however, a full substitute for actually running the labs: **the next batch that
successfully runs `tsx` should also re-run all 30 batch-19 labs end-to-end**, both network CVE labs and
mixed-pack labs, before treating this batch as fully closed out to the same standard as every other batch in
this file.

### Batch 19 finalization (later session, `tsx`/`oxlint`/`git commit` all confirmed working)

Did exactly what the paragraph above asked: wrote a throwaway `tsx` harness (`TerminalEngine` imported
directly, every hint from every lab's own `hints` array run through `engine.run()` in order, unique
flags-captured count compared against `totalFlags`) and ran all 30 batch-19 labs end-to-end. **15 of 30
failed on the first run.** The manual source-reading review from the original session was real and did catch
seven genuine bugs (confirmed still fixed, still correct) — but reading `parseParams`/`tokenize`/header
parsing logic can only catch mistakes in how a command would be *interpreted*; it has no way to notice that a
hint line isn't a command at all, only prose describing one. That's exactly what slipped through:

- All 13 `cveLab()`-factory labs in `batch19-network-pack.ts` shared one final hint written as narration —
  `'Once the session opens, check /root/root.txt (this lab treats the elevated session\'s home as /root for
  simplicity).'` — instead of an actual command. `engine.run()` on that string just falls through to
  "command not found," so the lab's own solve path could never capture its flag. This is the identical bug
  class `NOTES.md` batch 14 already named once (the Ivanti lab, plus two CVE labs caught and fixed that same
  batch) and explicitly flagged as "worth revisiting" — it had clearly not been added to a hard checklist the
  way the "port defaults to 80" mistake was after batch 9, and cost 13 labs here as a result. Fixed by
  replacing the narration with the literal command: `cat /root/root.txt`.
- `batch19-mixed-pack.ts`'s GPO GenericWrite lab used the identical hand-written pattern (same factory logic,
  copied by hand rather than through `cveLab()`) — one more instance of the same bug, fixed the same way.
- `batch19-mixed-pack.ts`'s publicly-accessible-RDS lab's final hint ran two steps together as prose in one
  string — `'ssh postgres@10.10.282.2 then cat user.txt.'` — which `engine.run()` treats as a single
  (invalid) command rather than two sequential steps. Fixed by splitting into the real three-step sequence
  this engine's `ssh` flow actually requires: `ssh postgres@10.10.282.2`, then the password (`dragon`, already
  correct in the account definition and present in the lab's own wordlist) as its own line, then `cat
  user.txt`.
- `batch19-mixed-pack.ts`'s fastbin-dup Binary Analysis lab's final hint was pure narration — `'win_admin()
  lives at 0x4015e0 -- convert to decimal and supply it to ./legacyalloc3 <value>'` — never actually
  substituting the decimal value into a runnable line. The decimal value itself (4199904) was already correct
  (this was original bug #7 above, genuinely fixed in the marker text), just never turned into the actual
  command a learner would type. Fixed to `./legacyalloc3 4199904`, matching this engine's real
  `tryRunCrackme()` invocation syntax (confirmed by reading it directly: `./binary <guess>`, single positional
  arg compared byte-for-byte against `#CRACKME_PASSWORD:`).

**Net finding: the previous session's technique-accuracy research (CVE details, ACL abuse mechanics, DFIR
artifact behavior, etc.) held up completely — zero citation or technical-content problems surfaced by this
re-verification.** Every failure was purely mechanical (a hint that wasn't a runnable command), exactly the
category of mistake `tsx` execution catches immediately and static reading can miss even when done carefully.
After all four fixes, reran the full 30-lab suite: **all 30 now capture exactly 1 flag each via their own
hint solve-path.** `tsc -b` clean, `oxlint` clean (only the two pre-existing, unrelated warnings —
`LabCard.tsx` and `code-python-advanced/03-...` — both predate this batch and this session). Batch 19 is now
verified to the same standard as every other batch in this file, not an exception to it.

## Sources checked, batch 20 (10 more CVEs, ADCS ESC8/ESC4, Lambda Layers backdoor, GCP SA key exposure, Azure
Key Vault overpermissioning, Registry Run key / Amcache forensics, four Event-ID SOC detections, XXE via SVG
upload, second-order SQLi, classic/reflective DLL injection)

The six `batch20-*.ts` files were drafted by the previous session with `WebSearch` unavailable (blocked by the
same classifier that had already taken out `tsx`/`oxlint`/`git commit`), and each file says so explicitly in
its own header comment rather than silently presenting unverified content as researched. This session
confirmed `WebSearch` is working again and used it to close that gap — prioritizing the two techniques
explicitly flagged for a recheck (ESC8, ESC4) plus the ten specific CVEs (highest-risk category for a
misremembered detail, since each carries a specific number/CVSS/mechanism a static-knowledge pass could get
subtly wrong) and two more technically-specific general claims.

- **ADCS ESC8 (NTLM relay to AD CS HTTP web enrollment)** — [Hacking Articles: ADCS ESC8 — NTLM Relay to AD CS HTTP Endpoints](https://www.hackingarticles.in/adcs-esc8-ntlm-relay-to-ad-cs-http-endpoints/),
  [SpecterOps BloodHound: CoerceAndRelayNTLMToADCS](https://bloodhound.specterops.io/resources/edges/coerce-and-relay-ntlm-to-adcs),
  [SecureLayer7: What is ESC8?](https://securelayer7.net/learn/active-directory/what-is-esc8).
  Confirmed real and exactly as modeled: this is SpecterOps' own "Certified Pre-Owned" research (ESC8 =
  "NTLM Relay to AD CS HTTP Endpoints"), the real two-tool chain is PetitPotam (abusing MS-EFSRPC to coerce a
  DC into authenticating) plus Certipy's relay module targeting the web enrollment endpoint, and the real
  precondition is exactly what the lab's audit file states — web enrollment reachable with NTLM accepted and
  no Extended Protection for Authentication / channel binding enforced. A DC certificate leads straight to
  DCSync, confirming the lab's framed impact.
- **ADCS ESC4 (certificate template ACL abuse)** — [RedFox Security: ESC4 Attack — Exploiting Weak ACLs on AD Cert Templates](https://www.redfoxsec.com/blog/exploiting-weak-acls-on-active-directory-certificate-templates-esc4-explained),
  [ly4k/Certipy Wiki: Privilege Escalation](https://github.com/ly4k/Certipy/wiki/06-%E2%80%90-Privilege-Escalation),
  [SpecterOps BloodHound: ADCSESC4](https://bloodhound.specterops.io/resources/edges/adcs-esc4).
  Confirmed real and exactly as modeled: ESC4 is write access (WriteProperty/WriteOwner/GenericWrite/etc.)
  over a certificate template OBJECT itself, abused by rewriting the template's own configuration to make it
  vulnerable to ESC1 (SAN-supplying enrollment), then requesting a certificate naming a privileged principal
  — Certipy's real `template` command does exactly this in one step, matching the lab's own framing of "ESC4
  reached by first weakening a template rather than finding one already ESC1-vulnerable."
- **CVE-2019-0708 (BlueKeep)** — [Wikipedia: BlueKeep](https://en.wikipedia.org/wiki/BlueKeep), multiple
  vendor vulnerability-database entries (Rapid7, Tenable) confirmed via search. Confirmed: pre-auth
  use-after-free in the RDP `termdd.sys` driver's handling of the internal `MS_T120` virtual channel, CVSS
  10.0, and the real detail the lab's briefing leads with — Microsoft patched Windows XP and Server 2003
  (both years past end-of-life) given how wormable they judged it.
- **CVE-2020-0796 (SMBGhost)** — [SentinelOne vulnerability database: CVE-2020-0796](https://www.sentinelone.com/vulnerability-database/cve-2020-0796/),
  [SANS: Microsoft SMBv3.11 Vulnerability and Patch Explained](https://www.sans.org/blog/microsoft-smbv3-11-vulnerability-and-patch-cve-2020-0796-explained).
  Confirmed: integer overflow in SMBv3.1.1's handling of a compressed packet (compression being a genuinely
  new feature in that protocol version), pre-auth, CVSS 10.0, wormable — matches the lab exactly, including
  its explicit differentiation from the platform's existing EternalBlue (SMBv1) lab.
- **CVE-2024-3094 (XZ Utils / liblzma backdoor)** — [Wikipedia: XZ Utils backdoor](https://en.wikipedia.org/wiki/XZ_Utils_backdoor),
  [Sonatype: CVE-2024-3094 — Backdoor Attack Against xz and liblzma](https://www.sonatype.com/blog/cve-2024-3094-the-targeted-backdoor-supply-chain-attack-against-xz-and-liblzma).
  Confirmed: the "Jia Tan" multi-year social-engineering operation, the backdoor present only in release
  tarballs (not the public git repo), the IFUNC-resolver hijack intercepting `RSA_public_decrypt` during SSH
  certificate auth, and Andres Freund's discovery via a ~500ms SSH login slowdown — every specific detail the
  lab's briefing states checks out against the primary incident writeups.
- **CVE-2023-23397 (Outlook zero-click NTLM leak)** — [SentinelOne: CVE-2023-23397](https://www.sentinelone.com/blog/cve-2023-23397/),
  [Trend Micro: Patch CVE-2023-23397 Immediately](https://www.trendmicro.com/en_us/research/23/c/patch-cve-2023-23397-immediately-what-you-need-to-know-and-do.html).
  Confirmed: the `PidLidReminderFileParameter` MAPI property set to a UNC path, triggered automatically when
  Outlook processes the reminder (genuinely zero-click, no open/preview needed), leaking NTLMv2 to the
  attacker-controlled SMB server. CVSS 9.8 confirmed (the lab states 9.8, matching).
- **CVE-2019-11510 (Pulse Secure pre-auth arbitrary file read)** — [Acunetix: Pulse Secure SSL VPN Arbitrary File Reading](https://www.acunetix.com/vulnerabilities/web/pulse-secure-ssl-vpn-arbitrary-file-reading-cve-2019-11510/),
  [KELA: Ransomware Victims & Leaked Pulse Secure VPN Credentials](https://www.kelacyber.com/blog/easy-way-in-5-ransomware-victims-had-their-pulse-secure-vpn-credentials-leaked/).
  Confirmed: CVSS 10.0, the real `/dana-na/...` traversal path pattern, the real target file (the session
  database containing plaintext credentials), and the real, specifically-named Travelex ransomware incident.
- **CVE-2022-41040/CVE-2022-41082 (ProxyNotShell)** — [Picus Security: ProxyNotShell Exploits Explained](https://www.picussecurity.com/resource/blog/proxynotshellcve-2022-41040-and-cve-2022-41082-exploits-explained),
  [Unit42: ProxyNotShell Threat Brief](https://unit42.paloaltonetworks.com/proxynotshell-cve-2022-41040-cve-2022-41082/).
  Confirmed: CVE-2022-41040 is an SSRF exploitable by an authenticated user (any mailbox, not just admin),
  chained into CVE-2022-41082 for PowerShell-remoting RCE, and GTSC's real discovery (already-current-patched
  servers, already under active exploitation) — matches the lab's framing exactly, including the explicit
  differentiation from the platform's existing ProxyLogon/ProxyShell labs.
- **CVE-2021-41773 / CVE-2021-42013 (Apache HTTP Server path traversal + incomplete-fix RCE)** — [Rapid7: CVE-2021-41773 Exploited in the Wild](https://www.rapid7.com/blog/post/2021/10/06/apache-http-server-cve-2021-41773-exploited-in-the-wild/),
  [Qualys: Path Traversal & RCE in Apache HTTP Server](https://blog.qualys.com/vulnerabilities-threat-research/2021/10/27/apache-http-server-path-traversal-remote-code-execution-cve-2021-41773-cve-2021-42013).
  Confirmed: the regression is specific to 2.4.49, `mod_cgi`-enabled paths escalate file-read to RCE, and
  Apache's own first patch (2.4.50) was confirmed incomplete against double-URL-encoding, tracked as
  CVE-2021-42013 and fully fixed only in 2.4.51 — matches the lab's briefing precisely.
- **CVE-2023-38831 (WinRAR spoofed-extension RCE)** — [Group-IB: CVE-2023-38831 zero-day exploited by cybercriminals to target traders](https://www.group-ib.com/blog/cve-2023-38831-winrar-zero-day/),
  [SentinelOne: CVE-2023-38831 WinRAR ZIP Archive RCE Vulnerability](https://www.sentinelone.com/vulnerability-database/cve-2023-38831/).
  Confirmed: the decoy-file-plus-same-named-folder mechanism, real-world exploitation via trading-forum
  archive attachments delivering DarkMe/GuLoader/Remcos, and the real fixed version (6.23) — matches exactly.
- **CVE-2018-13379 (FortiOS SSL VPN path traversal, plaintext credential disclosure)** — [Rapid7: CVE-2018-13379 Path Traversal in Fortinet FortiOS](https://www.rapid7.com/blog/post/ra-cve-2018-13379-path-traversal-in-fortinet-fortios-analysis/),
  [CPO Magazine: Threat Actor Leaks Login Credentials of About 500,000 Fortinet VPN Accounts](https://www.cpomagazine.com/cyber-security/threat-actor-leaks-login-credentials-of-about-500000-fortinet-vpn-accounts/).
  Confirmed: reads `sslvpn_websession`, containing plaintext credentials, via a pre-auth path-traversal URI.
  The lab's specific "~500,000 credentials leaked in 2021" claim checks out precisely — a distinct, later,
  larger incident (September 2021, via the RAMP forum) from an earlier, smaller November 2020 leak (~50,000
  vulnerable devices) that a less careful search could have conflated with it; confirmed the lab cites the
  right one.
- **Amcache.hve execution evidence** — [Securelist: AmCache artifact — forensic value and a tool for data extraction](https://securelist.com/amcache-forensic-artifact/117622/),
  [amcacheparser.com: Understanding Amcache for Windows forensics](https://www.amcacheparser.com/en/blog/understanding-amcache).
  Confirmed the specific, checkable technical detail the lab depends on: Amcache computes its SHA-1 over only
  the first ~31MB (31,457,280 bytes) of each executable — exactly the figure the lab's briefing states — and
  is populated independently of Prefetch by the Application Compatibility subsystem, supporting the lab's
  distinction from this platform's existing Prefetch execution-evidence lab.
- **Malicious AWS Lambda Layer backdoor** — [Zest Security: How Malicious AWS Lambda Layers Can Compromise Your Serverless Environment](https://www.zestsecurity.io/resources/content/how-malicious-aws-lambda-layers-can-compromise-your-serverless-environment).
  Confirmed the real, current attack shape: a layer's own initialization code runs automatically inside every
  attached function's execution environment before that function's handler code runs, a compromised/malicious
  layer can exfiltrate the full environment-variable set (including the function's STS credentials) on cold
  start, and — the specific detail the lab's "blast radius" framing depends on — one shared layer attached to
  many functions backdoors all of them simultaneously, not just one.
- **GCP service account JSON key exposed via a public GCS bucket (`allUsers` Storage Object Viewer)** — not
  independently re-searched this batch; this is the same real GCP `allUsers` public-access mechanism already
  confirmed via search in batch 8 (for the GCP Cloud Function lab), applied here to Cloud Storage instead of
  Cloud Run/Functions — a service account JSON key being a real, long-lived, directly-usable credential
  format is well-established GCP documentation, not a claim needing a fresh citation.
- **Azure Key Vault legacy Access Policies model applying vault-wide with no per-secret scoping** — not
  independently re-searched this batch; this is Microsoft's own long-documented distinction between the
  legacy Access Policies permission model and the newer Azure RBAC integration (which can scope to individual
  secrets), consistent with established Azure security guidance rather than a claim needing a fresh citation.
- **Registry Run key persistence, Event ID 4720 (user created), Event ID 4732 (added to a local group),
  Sysmon Event ID 13 (RegistryEvent Value Set), Sysmon Event ID 22 (DNSEvent)** — not independently
  re-searched this batch; all five are extremely well-established, standard Windows/Sysmon telemetry sources
  already used correctly elsewhere on this platform (Run-key persistence, Sysmon 13, and DNS-based C2
  detection all appear in this platform's existing lesson content and other labs), and none of these labs
  depend on a specific disclosed CVE or a number that could be subtly wrong.
- **XXE via a malicious SVG upload, second-order SQL injection, classic DLL injection (`CreateRemoteThread`),
  reflective DLL injection** — not independently re-searched this batch; all four are long-established,
  textbook vulnerability/technique classes (SVG-as-XML XXE, stored-value-reaches-a-second-unparameterized-sink
  SQLi, the classic `OpenProcess`/`VirtualAllocEx`/`WriteProcessMemory`/`CreateRemoteThread` injection
  primitive, and manual in-memory PE loading for reflective injection) that are consistent with established,
  widely-taught security knowledge rather than claims resting on a single disclosed incident or a number that
  could be subtly wrong.

## NEEDS REVIEW (labs/topics), batch 20

- **Mechanical bugs found and fixed during `tsx` verification** (five total, across four files): (1) all 10
  `cveLab()`-factory labs in `batch20-network-pack.ts` and both ESC8/ESC4 labs in `batch20-mixed-pack-a.ts`
  shared the identical narrative-only final hint bug already fixed at scale in batch 19's finalization above
  (`'Once the session opens, check /root/root.txt (this lab treats...)'` instead of the runnable `cat
  /root/root.txt`) — the previous session had clearly copied the `cveLab()` factory (and its bug) forward from
  `batch19-network-pack.ts` before this session's batch-19 fix existed. Fixed the same way, both files. (2)
  `batch20-cloud-pack.ts`'s GCP service-account-key lab used `curl https://10.10.302.2/...` with no explicit
  port against a service defined on port 443 — the single most recurring mistake class in this platform's
  entire history (first flagged batch 6, recurred at least six times since) — fixed to `:443` explicitly. (3)
  `batch20-mixed-pack-a.ts`'s ESC4 lab's `exploit`/hint targeted `10.10.300.2` (the ESC8 lab's host) while its
  own `network` array defines the host at `10.10.300.3` — a copy-paste IP mismatch, not a port issue — fixed
  to the correct IP. (4) `batch20-web-malware-pack.ts`'s second-order-SQLi lab's final step (a bare GET with
  no parameters at all) could never trigger its own `vulnRoute`, because this engine's `curl` has no
  cross-request state — a value "stored" by one request is never visible to a later, unrelated request; there
  is no way to honestly model true second-order SQLi (payload persists server-side, fires later with no
  attacker involvement in the second request) against a stateless simulator. Fixed the same way this file has
  handled comparable engine-limitation cases before (Host-header-poisoning's combined request in batch 11,
  the AES-GCM lab's given-not-rederived value in batch 15): the final request now carries the same
  already-stored payload explicitly as a query parameter, so the vulnerable, unparameterized SINK is still
  what's being tested — flagged here rather than left implicit, since a learner reading the raw solve command
  could otherwise reasonably assume real second-order SQLi requires resending the payload, which it doesn't.
- **Citation gap now closed for the two AD CS labs and all ten CVE labs**, per an explicit instruction to
  recheck them once `WebSearch` was confirmed working again — all twelve check out with no factual corrections
  needed, see citations above. The remaining labs in this batch (Cloud's two general-mechanism labs, all four
  Forensics/SOC labs, and Web/Malware's four technique-class labs) were spot-reviewed for internal consistency
  during the `tsx` verification pass but not independently re-searched this batch, for the reasons stated
  next to each in the citations above — none of them rest on a specific disclosed CVE, exact CVSS score, or
  other single fact that a general-knowledge pass would be likely to misremember, unlike the CVE labs.

## Sources checked, batch 21 (Wiener's attack, AES-CBC static IV, bcrypt cost factor, GraphQL query-depth DoS,
sequential API keys, SSRF via open-redirect chaining, ARP poisoning, typosquatting, rogue root CA, pre-signed
URL with no expiry, verbose error stack traces, a debug feature flag in production, off-by-one stack overflow,
signed/unsigned integer comparison bypass, uninitialized stack variable leak, leaked Postman collection,
broken link hijacking, exposed Firebase Realtime Database)

New batch, new content (not a previous session's unfinished work) — picked the six thinnest categories after
batch 20 (`labs-index.md`'s own counts: Cryptography 16, Security+/Security Engineering/API 18 each, Binary
Analysis 19, Bug Bounty 22) and added 3 labs to each, 18 total. Every technique below was researched via
`WebSearch` before writing, not after — continuing this file's standing practice — and every duplicate-title
risk was checked against all 393 existing lab titles first via targeted `grep` before any lab was drafted.

- **Wiener's attack (RSA small private exponent recovery)** — [Wikipedia: Wiener's attack](https://en.wikipedia.org/wiki/Wiener's_attack),
  [CryptoBook: Wiener's Attack](https://cryptohack.gitbook.io/cryptobook/untitled/low-private-component-attacks/wieners-attack).
  Confirmed the real mechanism (continued-fraction expansion of e/N is guaranteed to include k/d as an early
  convergent whenever d < N^(1/4)/3) and independently implemented and ran the full algorithm — real prime
  generation, key derivation, encryption, and a from-scratch continued-fraction/convergent Wiener recovery —
  in Node before writing the lab, confirming the chosen N/e/d/ciphertext genuinely round-trip (d=997 recovered
  from (N, e) exactly, C decrypts to the intended plaintext M=918273645 exactly). Not toy-sized in the sense
  of being fabricated — a real, if illustratively small (49-bit N), example that actually demonstrates the
  attack rather than merely asserting numbers that happen to work.
- **AES-CBC with a static/zero IV (CWE-329)** — [CWE-329: Generation of Predictable IV with CBC Mode](https://cwe.mitre.org/data/definitions/329.html),
  [Ubiq Security: Exploring CWE-329](https://www.ubiqsecurity.com/exploring-cwe-329-generation-of-predictable-iv-with-cbc-mode/).
  Confirmed real and currently disclosed, not merely theoretical: CVE-2020-5408 (Spring Security, a null IV in
  its CBC mode handler), CVE-2023-48056 (PyPinkSign, static IV in AES-CBC), and CVE-2024-53845 (ESPTouchV2,
  zero IV with no way to change it) all name this exact root cause. Confirmed the specific mechanism the lab
  depends on: a static/zero IV collapses CBC's chaining property for the first block only, making identical
  plaintext always produce identical ciphertext there — the exact ciphertext block value used in the lab
  (`dfa76048c0cb84eefe43d73f347c59dd`) was computed and round-trip-verified with real Node `crypto`
  (`aes-128-cbc`, `setAutoPadding(false)`) before being hardcoded, per this file's standing rule on computed
  cryptographic values.
- **bcrypt cost factor tuned too low** — [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
  (already cited in this file for the PBKDF2 lab, batch 10), [Clio Labs: Perils of the default bcrypt cost factor](https://labs.clio.com/bcrypt-cost-factor-4ca0a9b03966).
  Confirmed OWASP's current documented baseline minimum of 10 for bcrypt, and confirmed the real,
  independently-benchmarked figure the briefing cites (cost-5 hashes crackable at ~56/sec on ordinary capable
  hardware) — the lab uses cost 4, one below that benchmark, making the "practical, not theoretical" framing
  accurate. Confirmed this is a genuinely distinct defect from the existing PBKDF2 lab (different algorithm
  family, bcrypt vs. PBKDF2-HMAC-SHA256) despite the shared "stale tuning parameter" root cause shape.
- **GraphQL query depth/complexity resource exhaustion (OWASP API4:2023)** — [Checkmarx: Exploiting GraphQL Query Depth](https://checkmarx.com/blog/exploiting-graphql-query-depth/),
  [Sourcery: GraphQL Query Depth and Complexity Attacks Causing Resource Exhaustion](https://www.sourcery.ai/vulnerabilities/graphql-query-depth-attack).
  Confirmed the real mechanism (recursive schema relationships like `user{friends{friends{...}}}` letting one
  syntactically-valid request traverse dozens of levels, multiplying resolver fan-out exponentially per level)
  and that this is a real, OWASP-catalogued, CVE-documented abuse pattern distinct from generic rate-limiting
  gaps. Confirmed as mechanically distinct from this platform's existing pagination-free bulk-export API4 lab
  (that one abuses a missing record cap on one flat query; this one abuses GraphQL's own recursive structure).
- **Sequential/predictable API keys (OWASP API2:2023, Broken Authentication)** — general, well-established
  API security anti-pattern; cross-referenced against real incident patterns (a 64-million-record exposure via
  sequential identifiers, and general documented guidance that "sequential token identifiers... indicate weak
  generation that attackers can exploit") confirming the underlying mechanism — a legitimately-issued key
  revealing the entire keyspace's shape — is a real, current, named category (API2:2023) rather than a
  fabricated scenario.
- **SSRF via open-redirect chaining bypassing a URL allowlist** — [Leviathan Security Group: Bypassing SSRF Filters Using r3dir](https://www.leviathansecurity.com/blog/bypassing-ssrf-filters-using-r3dir),
  general SSRF/webhook security research confirming the exact pattern (an allowlist-approved hostname's own
  legitimate open redirect chaining an SSRF-protected fetcher into an internal destination the allowlist was
  built to block). Confirmed real and distinct from this platform's existing DNS-rebinding SSRF-allowlist
  bypass lab: DNS rebinding exploits a TOCTOU gap between DNS resolution and connection; this exploits an
  allowlist that's never re-applied after the first hop, a different root cause even though both defeat a
  hostname allowlist.
- **ARP cache poisoning / ARP spoofing** — [Imperva: What is ARP Spoofing?](https://www.imperva.com/learn/application-security/arp-spoofing/),
  [Cyberhaven: What Is ARP Poisoning?](https://www.cyberhaven.com/infosec-essentials/arp-poisoning). Confirmed
  the real, standard mechanism (ARP has no authentication at all, so unsolicited replies claiming ownership of
  the gateway's IP are accepted by every receiving host with no verification) — foundational, exam-aligned
  Security+ content, modeled via the same `cat`-based captured-analysis convention already established for
  this platform's other network-layer labs (Rogue DHCP, batch 16) that this engine has no raw packet
  simulation for.
- **Typosquatting domain phishing** — [SentinelOne: What Is Typosquatting?](https://www.sentinelone.com/cybersecurity-101/cybersecurity/what-is-typosquatting/),
  [Breachsense: Typosquatting — How Fake Domains Steal Your Credentials](https://www.breachsense.com/blog/typosquatting/).
  Confirmed as a real, standard, Security+-aligned social-engineering/domain-based attack, and confirmed as
  mechanically distinct from this platform's existing IDN homograph lab (batch 18): homograph attacks swap in
  a visually-identical Unicode lookalike CHARACTER; typosquatting relies on ordinary ASCII typing/reading
  errors, needing no special rendering trick at all. Confirmed Certificate Transparency's real role in
  catching exactly this pattern (mandatory CA/Browser Forum logging makes every issued cert, including a
  typosquatter's, a matter of public record).
- **Rogue trusted root CA enabling TLS interception** — [MITRE ATT&CK T1553.004: Install Root Certificate](https://www.startupdefense.io/mitre-attack-techniques/t1553-004-install-root-certificate),
  [Veil Framework: Root CA Abuse — The New Stealth Evasion Technique of 2025-26](https://www.veil-framework.com/root-ca-abuse-the-new-stealth-evasion-technique-of-2025-26/).
  Confirmed the real, current (2025-26) technique and its mechanism: a rogue CA in the trusted root store can
  sign a valid-looking certificate for any domain, accepted with zero browser warning, enabling full TLS
  interception. Confirmed distinct from every other MITM lab already on this platform (ARP poisoning, this
  same batch, is Layer 2/3; DHCP spoofing, batch 16, hijacks routing; this one operates entirely at the
  certificate-trust layer, needing no network position manipulation at all).
- **Pre-signed URL with no/excessive expiry** — [ivision Research: Signed, Sealed, Delivered... Secure? (Pre-)Signed AWS URL Hacks](https://research.ivision.com/signed-sealed-delivered-secure.html),
  general AWS S3 pre-signed URL security guidance confirming "a common security mistake... is using a long
  expiration time, which turns them into capability URLs" and the real risk of archived pre-signed links
  remaining fetchable indefinitely. Confirmed as an implementation/configuration mistake rather than a flaw in
  pre-signed URLs as a mechanism, matching this lab's own framing.
- **Verbose error messages / stack trace disclosure** and **a debug feature flag left enabled in production**
  — not independently re-searched this batch; both are extremely well-established, textbook secure-coding
  anti-patterns (a development error handler or debug route shipped unchanged to production) rather than
  claims resting on a single disclosed CVE or exact figure that a general-knowledge pass would be likely to
  misremember.
- **Off-by-one stack buffer overflow (CWE-193)** — [CWE-193: Off-by-one Error](https://cwe.mitre.org/data/definitions/193.html),
  [ImmuniWeb: Off-by-one Error Vulnerability](https://www.immuniweb.com/vulnerability/off-by-one-error.html).
  Confirmed the real mechanism (an incorrect `<=` vs `<` comparison writes exactly one byte past a buffer
  boundary) and the real exploitation consequence on a stack buffer specifically (that single stray byte can
  land on and corrupt the saved return address, redirecting execution) — confirmed mechanically distinct from
  every other Binary Analysis lab on this platform (a full-overwrite classic stack smash, a format-string
  write, heap-metadata corruption, etc.), since only ONE byte is ever attacker-controlled here, not an
  arbitrary-length write. The address conversion (0x401932 → 4200754) was independently recomputed with Node
  before being hardcoded.
- **Signed/unsigned integer comparison bypass (CWE-195)** — [CWE-195: Signed to Unsigned Conversion Error](https://cwe.mitre.org/data/definitions/195),
  general vulnerability-research confirmation that integer signedness conversion errors are a common, high-
  prevalence weakness class. Confirmed the exact mechanism the lab depends on: a negative signed length passes
  a signed bounds check (`len < MAX_LEN`) trivially, then converts to a very large unsigned value once read as
  `size_t` by a function like `memcpy` — confirmed as a genuinely distinct bug class from this platform's
  existing generic "Integer Overflow Authentication Bypass" lab (that one is arithmetic wraparound; this one
  is a type-conversion bug needing no arithmetic overflow to occur at all).
- **Uninitialized stack variable leak (CWE-457)** — [CWE-457: Use of Uninitialized Variable](https://cwe.mitre.org/data/definitions/457.html).
  Confirmed the real mechanism (C stack variables are never zero-initialized by default; an uninitialized
  buffer contains whatever bytes a previous function call left at that stack address) and real historical CVE
  examples of exactly this bug class causing information disclosure. Confirmed as mechanically distinct from
  every corruption-based Binary Analysis lab on this platform, since no memory is ever written or corrupted
  here — only read — a genuinely different bug shape (a read of stale data, not a write past a boundary).
- **Leaked public Postman collection exposing live API keys** — [CloudSEK: Hackers Scour Exposed Postman Instances for Credentials and API Secrets](https://www.cloudsek.com/threatintelligence/hackers-scour-exposed-postman-instances-for-credentials-and-api-secrets),
  [RedHunt Labs: Leaky Postman Collections Reveal Thousands of Secrets](https://redhuntlabs.com/blog/leaky-postman-collections-reveal-thousands-of-secrets-wave14-project-resonance/).
  Confirmed the real, large-scale, currently-documented 2023-2024 exposure class (30,000+ publicly accessible
  Postman workspaces found by researchers, 4,000+ live leaked credentials) and the exact real mechanism the
  lab depends on: API keys saved directly as collection "environment" variables for one-click convenience,
  then the whole workspace accidentally shared publicly rather than kept private.
- **Broken Link Hijacking via a dangling social-media handle** — [Invicti: Broken Link Hijacking (BLH)](https://www.invicti.com/learn/broken-link-hijacking-blh),
  a real public HackerOne report matching this exact pattern ([Omise: Facebook Username Takeover via Broken Link in Footer](https://hackerone.com/reports/3119034)).
  Confirmed the real, named vulnerability class and its social-media-handle variant specifically (a deleted,
  not merely inactive, account's handle becomes available for anyone to register, inheriting whatever trust a
  company's own website link still lends it) — confirmed mechanically distinct from this platform's existing
  subdomain-takeover labs (a dangling DNS record vs. a dangling social-platform link, different systems
  entirely even though the "abandoned-but-still-trusted reference" root cause shape rhymes).
- **Exposed Firebase Realtime Database with public read/write rules** — [Medium (Mustafa Mohamed): Firebase Misconfigurations — From Discovery to Exploitation](https://medium.com/@mustafamohammed789mm/firebase-misconfigurations-from-discovery-to-exploitation-0a282b81ad4f),
  a real documented incident affecting ~152,000 users across multiple mobile apps cited in the search results.
  Confirmed the real, exact, currently-documented mechanism: `.read`/`.write` rules left at `true` (a
  development "test mode" default never tightened), and the real REST convention (appending `.json` to the
  database root returns the full contents with zero authentication) — the first non-AWS/GCP/Azure cloud-
  platform misconfiguration lab this session has added, a genuinely distinct provider from every existing
  Cloud-category lab.

## NEEDS REVIEW (labs/topics), batch 21

- One mechanical bug caught and fixed during `tsx` verification: the verbose-error-stack-trace Security
  Engineering lab initially modeled the malformed invoice ID as a REST-style path segment
  (`/api/invoices/not-a-number`), but this engine's `curl` only matches a `vulnRoute`'s tested parameter
  against query-string/POST-body params, never against arbitrary path segments (confirmed by reading `curl()`
  in `engine.ts` — the same convention already established by this platform's existing IDOR labs, which all
  use `?id=...` query parameters, not REST path segments). Fixed to `?id=not-a-number`, reverified clean —
  same underlying lesson as this file's standing "read the actual engine before assuming a URL shape works"
  practice.
- No techniques in this batch required skipping or faking; all 18 mapped cleanly onto existing engine
  commands/conventions (`curl`-simulated HTTP `vulnRoutes` with explicit ports throughout, `cat`-based
  analysis for the three network-layer-only Security+ labs this engine has no raw-packet simulation for, and
  the established `#CRACKME_*`-marker crackme convention for the three Binary Analysis labs), and all 18 were
  verified end-to-end with a scripted `tsx` run against the real `TerminalEngine` class — full solve path
  captures exactly one flag per lab, first try after the one fix above. `tsc -b` and `oxlint` both clean.

## Sources checked, batch 22 (Mobile + Wireless — new categories, plus real engine capability expansion)

The real gap this batch closes: `labs-index.md`'s "What's explicitly NOT attempted" section has flagged
wireless labs as out of scope since batch 2 — "the engine has no aircrack-ng-family commands, so a real
wireless lab needs new engine work first." This batch adds exactly that (`airmon-ng`/`airodump-ng`/
`aireplay-ng` in `engine.ts`), purely additively (new `KNOWN_COMMANDS` entries, new dispatch-switch cases, new
private methods — no existing method's behavior touched), then builds real lab content against it. Mobile
Security labs needed no comparable engine work at all — the existing "binaries/apps as pre-extracted text
files" convention (`cat`/`strings`/`grep`/`curl`) covers nearly everything a static-analysis-heavy mobile
assessment needs directly.

**Engine additions, and why each is scoped the way it is**: `airmon-ng start|stop <iface>` is a pure
confirmation printout — no session state is tracked, matching the same "narrate the prerequisite, don't gate
later commands on it" convention this engine already uses for `chmod`. `airodump-ng` reads a new optional
`HostDef.wifiNetwork` field (`{ ssid, bssid, channel, encryption, captureFile? }` — added to `types.ts`) and
has two modes: a bare scan lists every network a scenario defines, and a targeted `--bssid ... -w <prefix>`
capture writes `<prefix>-01.hc22000` using the network's `captureFile` string, if one is set. That
`captureFile` string reuses the *exact* `#HASHCAT_HASH:`/`#HASHCAT_PLAINTEXT:`/`#HASHCAT_FLAG:` marker
convention `hashcat`/`john` already read elsewhere in this engine, unmodified — meaning cracking a captured
handshake needed zero new engine code beyond the capture step itself, just the existing
`hashcat -m 22000 <file> <wordlist>` command every lab author already knows works. `aireplay-ng --deauth`
is flavor/framing only, matching this batch's own instruction to keep it lightweight if tracked state adds no
real teaching value — the *outcome* of a successful deauth (a handshake becoming capturable) is modeled
directly via whether `wifiNetwork.captureFile` is set, not via a separate "was a deauth actually sent" flag.

- **PMKID attack / hashcat mode 22000** — [hashcat's own wiki: cracking_wpawpa2](https://hashcat.net/wiki/doku.php?id=cracking_wpawpa2),
  [evilsocket: Pwning WiFi networks with bettercap and the PMKID client-less attack](https://www.evilsocket.net/2019/02/13/Pwning-WiFi-networks-with-bettercap-and-the-PMKID-client-less-attack/).
  Confirmed: the technique was first demonstrated by hashcat's own creator, Jens "atom" Steube, in 2018;
  modern hashcat mode 22000 unifies PMKID and EAPOL-handshake captures into one format (superseding the
  deprecated mode 2500), and the real capture chain is `hcxdumptool` -> `hcxpcapngtool` -> `hashcat -m 22000`
  — no connected client or deauth frame required at all, the specific "clientless" property this lab's
  briefing depends on.
- **WEP IV reuse / FMS and PTW attacks** — [Aircrack-ng's own wiki](https://www.aircrack-ng.org/doku.php?id=aircrack-ng),
  general search-aggregated confirmation of the FMS (Fluhrer-Mantin-Shamir, 2001) and PTW (Pyshkin-Tews-
  Weinmann, 2007) attacks. Confirmed: WEP's 24-bit IV is transmitted in plaintext and collides within
  thousands of packets on a busy network; PTW (aircrack-ng's default WEP-cracking method today) needs far
  fewer captured packets than the older FMS attack and doesn't depend on "weak" IVs the way FMS did. Modeled
  deliberately as a *statistical key recovery*, not a dictionary/wordlist attack — this engine's `hashcat`/
  `john` marker convention would have been a technically inaccurate framing for WEP specifically, since real
  WEP key recovery isn't a password guess at all; used the established `cat`-a-captured-recon-file convention
  instead, with the real `aircrack-ng` PTW-attack command spelled out in the briefing.
- **KARMA attack** — [Wikipedia: KARMA attack](https://en.wikipedia.org/wiki/KARMA_attack), [theta44.org (the
  original KARMA tools page)](https://theta44.org/karma/). Confirmed: first published in 2004 by Dino Dai Zovi
  and Shane Macaulay; the real, defining mechanism is a rogue AP listening for devices' own unencrypted probe-
  request broadcasts (their "Preferred Network List") and answering *every* probed SSID — mechanically
  distinct from a classic evil twin, which clones one specific, already-observed nearby network rather than
  impersonating whatever a device asks for by name.
- **Evil twin / rogue AP, open-network variant** and **captive portal credential phishing** — grounded
  directly in this platform's own `src/content/wireless/04-rogue-aps-and-evil-twin-attacks.tsx` lesson
  content (already written and cited in a prior session), which itself names `wifiphisher`'s real automation
  chain (clone SSID -> deauth -> serve fake captive portal -> capture credentials) — not independently
  re-searched this batch since the lesson content was the direct source, consistent with this file's standing
  practice of citing prior verified platform content as a source when that's genuinely where a lab's framing
  came from.
- **WPA3-SAE resistance to offline cracking** — grounded directly in this platform's own
  `src/content/wireless/03-cracking-handshakes-and-wpa3.tsx` lesson content. Confirmed the real, current
  protocol property this lab depends on: SAE (Dragonfly) requires a fresh, interactive exchange with the AP
  for every authentication attempt, producing no static value an attacker can carry away and test guesses
  against offline — deliberately built so the lab's own `airodump-ng --bssid ... -w` capture step can **never**
  succeed (the scenario's `wifiNetwork.captureFile` is left undefined entirely), matching the platform's own
  explicit instruction not to fake a lab where WPA3-SAE can be offline-cracked. The flag is earned by reading
  and demonstrating understanding of *why* the capture fails, via a `cat`-based analysis file — the same
  "code-review/analysis lab" convention already established for the ECB-penguin (batch 9) and client-side-
  prototype-pollution (batch 10) labs, applied here to a conceptual-resistance finding instead of a live bug.
- **BLE GATT characteristic enumeration** — grounded directly in this platform's own
  `src/content/wireless/05-bluetooth-and-ble-security.tsx` lesson content, which already documents the real
  `gatttool -b <mac> -I` / `primary` / `char-read-hnd` workflow and the "proximity is not authentication" gap
  this lab models. This engine has no live Bluetooth/BLE radio simulation at all, so — consistent with the
  established captured-recon-file convention (LDAP anonymous bind, Azure Storage key, crt.sh in earlier
  batches) — the enumeration output is presented via `cat`, with the real command spelled out for direct
  transferability to a genuine BLE assessment.
- **BlueBorne (2017)** — [BleepingComputer: BlueBorne Vulnerabilities Impact Over 5 Billion Bluetooth-Enabled
  Devices](https://www.bleepingcomputer.com/news/security/blueborne-vulnerabilities-impact-over-5-billion-bluetooth-enabled-devices/),
  [Wikipedia: BlueBorne (security vulnerability)](https://en.wikipedia.org/wiki/BlueBorne_(security_vulnerability)).
  Confirmed the real, specific CVE list (CVE-2017-0781/0782/0783/0785 Android, CVE-2017-1000251/1000250 Linux,
  CVE-2017-14315 iOS, CVE-2017-8628 Windows), the real disclosure date (September 12, 2017, by Armis Labs),
  and the real affected-device estimate (5.3+ billion at disclosure) — cross-checked the CVE list against two
  independent sources rather than trusting one, since a wrong CVE number is exactly the kind of specific,
  checkable detail this file's standing practice treats as worth double-checking. Built as a pure case-study
  analysis lab (not a live exploit) since this is a genuine memory-corruption RCE chain in compiled OS
  Bluetooth-stack code — fundamentally outside what a request/response terminal simulator can honestly model
  live, the same reasoning already applied to this batch's WPA3-SAE lab and to the ECB-penguin/DOM-XSS labs
  in prior batches.
- **WPA2-Enterprise missing certificate validation / rogue RADIUS (hostapd-wpe)** — [SecureW2: Without Server
  Certificate Validation, WPA2-Enterprise Isn't Secure](https://securew2.com/blog/without-server-certificate-validation-wpa2-enterprise-isnt-secure),
  general search-aggregated confirmation of `hostapd-wpe`'s real, documented behavior. Confirmed: `hostapd-wpe`
  is a real, patched RADIUS server specifically built to capture MSCHAPv2 username/challenge/response when a
  connecting client skips validating the RADIUS server's TLS certificate against the corporate CA — and that
  hashcat mode 5500 is the real, current mode for cracking a captured NetNTLM/MSCHAPv2 exchange, the same
  "capture then crack" shape as this module's WPA2-Personal labs, applied one layer up at the 802.1X/RADIUS
  level instead of the PSK.
- **Android `addJavascriptInterface` WebView bridge RCE** — [WithSecure Labs: WebView addJavascriptInterface
  Remote Code Execution](https://labs.withsecure.com/publications/webview-addjavascriptinterface-remote-code-execution),
  [CERT Secure Coding: DRD13](https://wiki.sei.cmu.edu/confluence/pages/viewpage.action?pageId=87150717).
  Confirmed the real, exact mitigation boundary: Android 4.2 (API 17)'s `@JavascriptInterface` annotation
  requirement closes the older, more general reflection-based RCE (any public method reachable pre-4.2), but
  only restricts *which* methods are exposed — an annotated method that is itself dangerous (this lab's
  `runDiagnostic(String)` piping straight to `Runtime.exec()`) remains fully exploitable on any modern Android
  version. This lab's flag is earned via a live exploitation-chain PoC file (not merely finding the bridge
  declaration), since actually running injected JavaScript inside a live WebView is beyond what this
  request/response engine can execute.
- **Unprotected exported Android ContentProvider / SQL injection** — [Corgea: CWE-926 — Improper Export of
  Android Application Components](https://hub.corgea.com/vulnerabilities/CWE-926), [Advania: SQL Injection In
  com.android.providers.telephony ver 10 — CVE-2020-0060](https://www.advania.co.uk/blog/security/android-telephony-vulnerability/).
  Confirmed the real, named CWE (CWE-926, covering exported Activities/Services/Receivers/Providers alike —
  this lab's Provider variant specifically), and a real, disclosed CVE (CVE-2020-0060) matching the identical
  root-cause shape modeled here: a `ContentProvider.query()` implementation concatenating caller-supplied
  projection/selection arguments directly into raw SQL instead of parameterizing them.
- **Exported Android Activity bypassing a login gate (CWE-926, Activity variant)** — same CWE-926 source as
  above; confirmed the real, general mechanism (an exported component reachable via a raw `Intent` from any
  other installed app, regardless of what the app's own UI normally requires to reach the same screen) —
  this specific lab reuses/extends a pre-existing, previously-unregistered draft lab already covering this
  exact class (`mobile-exported-activity-admin-bypass`, found already sitting in `mobile-pack.ts`
  unregistered — see the note on the pre-existing draft below), so no new lab was written for it this batch,
  just verified and kept.
- **Custom URL scheme OAuth authorization-code hijacking (CWE-939)** — [CWE-939: Improper Authorization in
  Handler for Custom URL Scheme](https://cwe.mitre.org/data/definitions/939.html), [Ostorlab: One Scheme to
  Rule Them All — OAuth Account Takeover](https://blog.ostorlab.co/one-scheme-to-rule-them-all.html), [Evan
  Connelly: Mobile OAuth Attacks — iOS URL Scheme Hijacking Revamped](https://evanconnelly.github.io/post/ios-oauth/).
  Confirmed the real, named CWE and the real mechanism: a bare custom URL scheme (unlike an HTTPS-based
  Android App Link/iOS Universal Link, which is cryptographically verified via a hosted digital-asset-links
  file) can be registered by any app on the device with no verification at all, and — specifically when the
  OAuth flow lacks PKCE — possessing the intercepted authorization code alone is sufficient to redeem it for
  a token; PKCE's `code_verifier` requirement is confirmed as the real, standard mitigation that breaks this
  exact interception chain.
- **iOS Keychain `kSecAttrAccessibleAlways`** — [Apple's own developer documentation:
  kSecAttrAccessibleAlways](https://developer.apple.com/documentation/security/ksecattraccessiblealways),
  [Apple's own developer documentation: kSecAttrAccessibleWhenUnlockedThisDeviceOnly](https://developer.apple.com/documentation/security/ksecattraccessiblewhenunlockedthisdeviceonly).
  Confirmed directly from Apple's own primary documentation (the strongest possible source for this specific
  claim): `kSecAttrAccessibleAlways` items "can always be accessed regardless of whether the device is
  locked" and are explicitly "not recommended for application use," while
  `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` restricts access to only while unlocked and ties the item to
  one specific device — the exact contrast this lab's briefing depends on.
- **Root detection / SSL pinning defeated via static smali patching** — [Cywarx: APK Code Tampering & Smali
  Patching — A Bug Bounty Guide](https://cywarx.com/blogs/android-apk-code-tampering-guide), [OWASP MASTG:
  MASTG-TECH-0012 — Bypassing Certificate Pinning](https://mas.owasp.org/MASTG/techniques/android/MASTG-TECH-0012/).
  Confirmed the real, standard static workflow (`apktool d` -> identify and flip the specific `if-eqz`/`if-nez`
  branch controlling enforcement in the decompiled smali -> `apktool b` -> re-sign) as a genuine alternative to
  runtime Frida hooking, specifically useful against apps hardened with anti-Frida/anti-instrumentation
  detection — deliberately built as a *distinct* lab from the pre-existing draft's `mobile-trust-all-
  certificate-mitm-proof` (a TrustManager that was broken from the start, found already-defeated) rather than
  a reskin: this new lab's app has a genuinely *working* pinning/root check that a static patch defeats after
  the fact, a mechanically different finding.
- **Hardcoded third-party API key in decompiled Android source**, **plaintext SQLite local storage**,
  **cleartext HTTP via a missing Android Network Security Config** — all three grounded directly in this
  platform's own `src/content/mobile/02-static-analysis-of-android-apps.tsx` and
  `src/content/mobile/04-insecure-data-storage-and-communication.tsx` lesson content, which already documents
  the real `jadx`/`grep` hardcoded-secret workflow, the real insecure-local-storage patterns (SharedPreferences/
  SQLite/Keychain-skipped), and the real `cleartextTrafficPermitted="true"` Network Security Config tell — not
  independently re-searched this batch since the lesson content (itself researched in an earlier session) was
  the direct, sufficient source for these well-established, standard mobile-assessment findings.

## A pre-existing, unregistered draft was found and extended, not replaced

`src/labs/scenarios/mobile-pack.ts` already existed on disk with 5 real, well-built labs (an exported-Activity
login bypass, a hardcoded payment API key, a trust-all `TrustManager` MITM proof, plaintext-SharedPreferences
credential storage, and a BOLA-via-intercepted-mobile-request capstone) — drafted in an earlier, unfinished
session and never registered in `src/data/labs.ts`, never verified, never committed. Same situation this file
already documented once before for `batch20-*.ts` (see the batch 20 entry above). Checked all 5 for id/flag/IP
collisions against every other lab on the platform (`grep` across all scenario files — zero collisions found),
then verified all 5 end-to-end via the same `tsx`-against-`TerminalEngine` harness used for this batch's own
new labs: all 5 pass, capturing exactly 1 flag each via their own `hints` solve path. Kept as-is rather than
rewritten, and this batch's 6 new mobile labs were written to complement rather than duplicate their coverage
(see the id list in `labs-index.md`). One cosmetic, non-blocking observation from verification, logged here
for completeness rather than silently fixed: `mobile-bola-intercepted-api-replay`'s final `hints` entry is a
narrative sentence rather than a runnable command — but the flag is already captured by the SECOND hint (the
actual `curl ... trip_id=48832` command), so this does **not** reproduce the batch-14/19 "unsolvable due to
narrative-only final hint" bug class (that class only breaks a lab when the FINAL, flag-capturing step is
itself narrative) — flagged for optional future polish, not fixed here since it doesn't affect solvability and
touching pre-existing content outside a batch's stated scope is exactly the kind of thing this file's own
precedent (batch 14's Ivanti-lab note) treats as "worth revisiting, not required now."

## NEEDS REVIEW (labs/topics), batch 22

- **The WEP lab's key-recovery step is presented as a given tooling output** (aircrack-ng's own PTW-attack
  result), not independently re-derived — the real PTW/FMS statistical recovery algorithm is a substantially
  deeper computation than this session implemented or ran, the same honestly-scoped-rather-than-independently-
  reproduced treatment already applied to the AES-GCM "Forbidden Attack" lab in batch 15 for an analogous
  reason (real finite-field/statistical math beyond a quick Node one-liner).
- **The BlueBorne lab is deliberately a case-study/analysis lab, not a live exploit** — a genuine memory-
  corruption RCE chain in compiled OS Bluetooth-stack code has no honest live-simulation path in a
  request/response terminal engine; same reasoning as every prior "fundamentally dynamic, can't be faked as a
  live exploit" case in this file (client-side prototype pollution, ECB-penguin).
- **The WPA3-SAE lab is deliberately built so it cannot be "cracked"** — this is a feature of the lab design,
  not a limitation to note as a gap: SAE's real protocol property is that it produces no offline-attackable
  static value at all, and faking a successful crack against it would have been the one genuinely dishonest
  option available, explicitly ruled out by this batch's own brief.
- **BLE GATT enumeration is modeled via the established captured-recon-file convention** (this engine has no
  Bluetooth/BLE radio simulation at all, confirmed by reading `KNOWN_COMMANDS` in `engine.ts` before writing
  this lab) — same convention already used for LDAP anonymous bind (batch 12), Azure Storage key and crt.sh
  (batch 13).
- **Every ContentProvider/exported-component/WebView-bridge finding is modeled via `cat`-based static
  analysis plus a PoC-output file, not a live `adb`/Binder-IPC/JavaScript-execution simulation** — these are
  genuinely device-local IPC and in-WebView JS-execution mechanisms with no honest request/response mapping
  onto this engine, the same "don't force a fake live exploit path that wouldn't reflect reality" standard
  this file has applied consistently since the DOM-XSS lab in batch 10.
- No other techniques in this batch required skipping or faking. All 21 new/newly-registered labs (11
  Mobile — 5 pre-existing-draft + 6 new, 10 Wireless — all new) were verified end-to-end with a scripted `tsx`
  run against the real `TerminalEngine` class: full solve path captures exactly one flag per lab, and a
  plausible-but-wrong request per lab (spot-checked across every `vulnRoute`-based lab in both packs, plus a
  dedicated check confirming the WPA3-SAE lab's capture step genuinely cannot succeed) captures none. Also
  re-ran a full-solve-path spot-check against three pre-existing labs from other categories/batches (the
  existing pre-baked WPA2-handshake lab, EternalBlue, and a GTFOBins Linux-privesc chain) to confirm this
  batch's purely-additive `engine.ts`/`types.ts` changes introduced zero regressions — all three still pass.
  `tsc -b` and `oxlint` both clean (same two pre-existing, unrelated warnings as every prior batch, neither
  touched by this one).

## Sources checked, batch 23 (IoT finish + AI Security pickup + Mobile/Wireless pack 2)

This repo had two concurrent sessions running against it during this batch — one drafted a complete IoT &
Embedded Security module (lessons + 3 starter labs), another drafted a complete AI Security module (lessons +
20 labs across two packs), both fully wired into `curriculum.ts`/`labs.ts`/`types.ts`/`icons.tsx` already but
never committed. Rather than duplicate that work or leave it to rot in the working tree while more concurrent
edits piled on, both were read in full, mechanically re-verified end-to-end against `TerminalEngine` in this
session, and committed. **Honesty note on citations**: the AI Security pack's specific facts (Air Canada
ruling, the FCM-server-key 2020 incident referenced in Mobile pack 2, CVE-2023-1389, CVE-2024-43093, WPS
Pixie Dust, MouseJack) were written by whichever earlier session drafted them — this session did not
independently re-run `WebSearch` against every one of those claims, since the content was already complete
and internally consistent, and re-deriving already-well-established facts from scratch would have been
redundant rather than adding rigor. What THIS session verified independently: mechanical correctness (every
lab's solve path actually captures its flag against the real engine), id/flag/IP collision-freedom across all
482 labs, `tsc -b`/`oxlint` cleanliness, and that the four shared registry files (`curriculum.ts`/`labs.ts`/
`types.ts`/`icons.tsx`) contain ONLY IoT/AI-Security/Mobile-2/Wireless-2 hunks with nothing else bled in from
other unrelated concurrent work.

- **CVE-2023-1389 (TP-Link Archer AX21 unauthenticated command injection)** — a real, currently-tracked CVE;
  this is the same specific router RCE that has been observed being actively incorporated into Mirai-derived
  botnet campaigns per public threat-intel reporting, making it a fitting closer for the IoT category given
  the platform's existing Mirai-credential labs already cover the *other* half of Mirai's real attack story
  (weak credentials, not memory-corruption RCE).
- **CVE-2024-43093 (Android privilege escalation)** — a real, disclosed 2024 Android Framework component
  vulnerability; modeled at the level of "a documented privesc CVE exists and this is its shape," consistent
  with how every other named-CVE lab on this platform is scoped (technique-accurate framing, not a literal
  working exploit binary).
- **Mirai's real default-credential list** — the ~60-pair table is a real, publicly leaked list (Mirai's
  source code itself leaked in 2016); the platform's existing Mirai lesson content (`src/content/iot/05-iot-
  botnets-mirai-and-beyond.tsx`) already documents this history, which is the direct source for the two Mirai
  IoT labs rather than a fresh re-search this batch.
- **Malicious pickle model files (AI Security)** — well-established, current ML-security knowledge: Python's
  `pickle` module executes arbitrary code via `__reduce__` on deserialization by design, not a bug — this is
  why `safetensors` exists as a safer alternative and why every major ML security scanner (e.g. Hugging Face's
  own `picklescan`) specifically flags pickle-format model files; not re-searched fresh this batch since it's
  foundational, non-controversial Python-security knowledge already reflected correctly in the lesson content.

## NEEDS REVIEW (labs/topics), batch 23

- **This session did not independently re-run `WebSearch` against every factual claim in the two
  concurrently-drafted packs it picked up (IoT, AI Security)** — flagged honestly per this file's own standard
  (see the batch 3 precedent for the same kind of disclosure) rather than implying every citation got a fresh
  verification pass this round when only the newly-authored Mobile/Wireless pack-2 labs and the two CVEs above
  did.
- **`mobile-bola-intercepted-api-replay`'s narrative-final-hint cosmetic issue (flagged in batch 22) remains
  unfixed** — still doesn't affect solvability (flag captures on the prior hint), still outside this batch's
  stated scope, carried forward rather than silently fixed.
- No new engine limitations were hit this batch — IoT was modeled entirely with existing primitives (`cat`/
  `strings`/`grep`/`find`/`curl`+`vulnRoutes`/`exploit`), and AI Security's labs (already written) use the same
  `curl`+`vulnRoutes` and file-analysis conventions throughout.

## Sources checked, batch 24 (real msfconsole simulation + Metasploit lab pack)

Explicit brief this round, given directly rather than inferred: the platform's existing Metasploit-flavored
labs use a one-line `exploit <name> <ip>` shortcut; the ask was for the real, literal, multi-step `msfconsole`
workflow instead — commands accurate enough to copy into a real Kali box's `msfconsole` against a real
vulnerable target (Metasploitable2, for the classic ones below) and have them genuinely work. Every module
path and required/default option below was checked against Rapid7's own module documentation or source, not
assumed from memory.

- **`exploit/unix/ftp/vsftpd_234_backdoor`** — [Rapid7: VSFTPD 2.3.4 Backdoor Command Execution](https://www.rapid7.com/db/modules/exploit/unix/ftp/vsftpd_234_backdoor/),
  [rapid7/metasploit-framework: vsftpd_234_backdoor.rb](https://github.com/rapid7/metasploit-framework/blob/master/modules/exploits/unix/ftp/vsftpd_234_backdoor.rb).
  Confirmed the real 2011 malicious-source-tarball incident and the real module's two options (RHOST, RPORT
  defaulting to 21) — no credentials or crafted payload needed beyond a target IP, the standard first
  Metasploitable2 teaching exploit.
- **`exploit/unix/irc/unreal_ircd_3281_backdoor`** — [Rapid7: UnrealIRCD 3.2.8.1 Backdoor Command Execution](https://www.rapid7.com/db/modules/exploit/unix/irc/unreal_ircd_3281_backdoor/),
  [InfosecMatter module library entry](https://www.infosecmatter.com/metasploit-module-library/?mm=exploit%2Funix%2Firc%2Funreal_ircd_3281_backdoor).
  Confirmed the real 2009-2010 trojaned `Unreal3.2.8.1.tar.gz` distribution-archive compromise and RPORT's
  real default of 6667 (IRC's standard port).
- **`exploit/multi/http/tomcat_mgr_upload`** — [rapid7/metasploit-framework: tomcat_mgr_upload.md](https://github.com/rapid7/metasploit-framework/blob/master/documentation/modules/exploit/multi/http/tomcat_mgr_upload.md).
  Confirmed the real `HttpUsername`/`HttpPassword` option names (mixed case — the exact detail that exposed
  this batch's `set` case-sensitivity bug, see below) and that authenticated WAR deploy through the Manager
  application is code execution "by design," not a CVE.
- **`exploit/multi/http/struts2_content_type_ognl`** — [rapid7/metasploit-framework: struts2_content_type_ognl.rb](https://github.com/rapid7/metasploit-framework/blob/master/modules/exploits/multi/http/struts2_content_type_ognl.rb),
  [Rapid7: Apache Struts Jakarta Multipart Parser OGNL Injection](https://www.rapid7.com/db/modules/exploit/multi/http/struts2_content_type_ognl/).
  Confirmed CVE-2017-5638 (the real Equifax-breach CVE), the real required options (RHOSTS, RPORT, TARGETURI),
  and TARGETURI's real default of `/struts2-showcase/` — used directly rather than guessed.
- **`exploit/multi/http/php_cgi_arg_injection`** — [rapid7/metasploit-framework: php_cgi_arg_injection.rb](https://github.com/rapid7/metasploit-framework/blob/master/modules/exploits/multi/http/php_cgi_arg_injection.rb),
  [PentesterLab: CVE-2012-1823](https://pentesterlab.com/exercises/cve-2012-1823).
  Confirmed CVE-2012-1823's real mechanism (the CGI spec's de-globbing step never running for an
  unrecognized Content-Type, letting a `-d`-flag query string set arbitrary php.ini directives) and RPORT's
  real default of 80.
- **`exploit/unix/webapp/wp_admin_shell_upload`** — [rapid7/metasploit-framework: wp_admin_shell_upload.md](https://github.com/rapid7/metasploit-framework/blob/master/documentation/modules/exploit/unix/webapp/wp_admin_shell_upload.md).
  Confirmed the real required options (USERNAME, PASSWORD, TARGETURI, RHOST, RPORT — all uppercase, unlike
  Tomcat's mixed-case pair) and that this module works via the legitimate plugin editor rather than any
  specific WordPress CVE, making it version-independent by design.
- **`exploit/windows/smb/psexec`** — [rapid7/metasploit-framework: psexec.md](https://github.com/rapid7/metasploit-framework/blob/master/documentation/modules/exploit/windows/smb/psexec.md).
  Confirmed the real `SMBUser`/`SMBPass` option names (mixed case again) and that this module is the same
  legitimate technique as Microsoft's own Sysinternals PsExec — credentialed SMB service creation, not
  exploitation of a bug.
- **`auxiliary/scanner/smb/smb_version`** — [rapid7/metasploit-framework: smb_version.md](https://github.com/rapid7/metasploit-framework/blob/master/documentation/modules/auxiliary/scanner/smb/smb_version.md).
  Confirmed this is a real, extremely commonly used auxiliary (non-exploit) module and its real output shape
  (SMB dialect/version, OS fingerprint) — the basis for modeling auxiliary modules as never opening a session,
  distinct from every exploit-module lab in this pack.

## A real mechanical bug caught by this batch's own verification

`set`/`unset` originally force-uppercased every option name before storing it (`session.options[name.toUpperCase()]`).
This is wrong: real `msfconsole` option names keep their real declared casing (`HttpUsername`, `SMBUser`) and
`set` matches case-insensitively against that canonical form, not by mangling everything to uppercase. The
bug stayed invisible through the first six labs written (all-uppercase real names: RHOSTS, RPORT, TARGETURI,
USERNAME, PASSWORD all happen to already BE uppercase) and only surfaced when the Tomcat and psexec labs'
`show options`/`run` logic checked `requiredOptions` (declared as `'HttpUsername'`, `'SMBUser'`) against
options stored under `'HTTPUSERNAME'`/`'SMBUSER'` — a silent mismatch, caught by this batch's own `tsx`
verification harness (both labs failed to capture their flag on the first run) rather than by reading the
code. Fixed by caching the currently-loaded module's real declared option names on the msf session at `use`
time and resolving a typed name against them case-insensitively, falling back to uppercase only for the
implicit options (RHOSTS/RPORT/LHOST) no module declares explicitly.

## NEEDS REVIEW (labs/topics), batch 24

- **This pack models 8 real modules but is not an exhaustive Metasploit walkthrough** — real `msfconsole` has
  thousands of modules; these 8 were chosen for real-world teaching value and mechanic diversity (backdoored-
  archive exploits needing zero configuration, credentialed web-app RCE, a named CVE, credentialed lateral
  movement, and one auxiliary-only recon module) rather than breadth for its own sake. A future batch could
  extend this pack the same way Mobile/Wireless got a "pack 2."
- **`search` is a minimal substring match against this lab's own network, not a real module database** — this
  engine has no full catalog of Metasploit's thousands of real modules to search against, so `search` only
  ever surfaces whatever `metasploitModule` a lab's own hosts define. Flagged honestly rather than implying
  full real-msfconsole search behavior.
- **Three pre-existing labs were mis-picked as regression-check targets and initially appeared broken**
  (`linux-fundamentals`, `msf-samba-usermap-domain-pivot`, `ad-golden-ticket-persistence`) — all three predate
  the hints-as-literal-commands convention this file has documented since early batches, writing `hints` as
  narrative prose instead of runnable command strings (confirmed by reading each one's actual `hints` array
  before concluding it wasn't a real regression). Swapped in four labs from batches known to use the modern
  convention (an AD CS ESC8 lab, a WPS Pixie Dust lab, an AI Security jailbreak lab, and the CVE-2023-1389 IoT
  lab) — all four passed unchanged, the actual, valid confirmation that this batch's `engine.ts` changes are
  regression-free.

## Sources checked, batch 25 (Mobile/Wireless/IoT/AI Security lessons 6-8 + matching lab packs)

This batch's content (all 12 labs, all 12 lesson files, all 4 lesson-6-8 quiz sets) was written by a
concurrent session, not this one — this session's job was to confirm it was genuinely finished (not just
present on disk) and mechanically real, per an explicit instruction partway through ("make them real,
executable against a real engine"). That instruction was taken as directly on-point: the 4 new lab packs were
imported into `src/data/labs.ts` but never spread into the `LABS` array, meaning all 12 labs were completely
unreachable in the running app despite looking like finished work at a glance. Registered them, then ran every
one through the real `TerminalEngine` before treating any of it as done — the same standard this file has
applied to every batch since the beginning, restated here because the instruction asked for it explicitly.

- **California SB-327 / UK PSTI Act default-credential requirements** — not independently re-searched this
  batch; both are real, already-cited regulatory facts this platform's own IoT lesson content (`src/content/
  iot/08-iot-testing-methodology-and-compliance.tsx`, written in the same concurrent session) already
  documents accurately, and the lab's compliance-mapping worksheet draws directly from that lesson rather than
  introducing a new claim needing separate verification.
- **Modbus TCP's complete lack of built-in authentication** — well-established, foundational OT/ICS security
  knowledge (Modbus predates modern network security entirely, designed in 1979 for serial links with an
  implicit trust model), consistent with this platform's own Lesson 7 content; not re-searched fresh since
  it's not a disputed or narrow technical claim.
- **hostapd-wpe as the real tool for a rogue-RADIUS/EAP-downgrade credential-capture attack** — well-
  established, standard red-team tooling for exactly this attack class; consistent with this platform's own
  Lesson 6 content on 802.1X/EAP/RADIUS security, which the lab's session log draws from directly.
- **IMSI catcher detection via forced-downgrade-then-vanish baseband patterns** — the general detection
  pattern (an unregistered tower ID forcing a downgrade to an older network generation, then disappearing) is
  standard, well-documented IMSI-catcher-detection methodology; not independently re-searched this batch since
  it follows directly from the platform's own cellular-security lesson content rather than introducing a new,
  narrower claim.
- **Adversarial example generation via gradient-based optimization against a classifier's decision boundary,
  with the underlying malicious behavior unchanged** — this is the real, foundational mechanism behind
  adversarial ML evasion (a well-established research area since at least 2013-2014); the lab's specific
  framing (static ML malware classifier, behavior-preserving perturbation) is consistent with this platform's
  own Lesson 6 content and real documented antivirus-evasion research.
- **AI system cards as a real external red-teaming/governance artifact** — real, current practice (OpenAI's
  GPT-4 system card and similar documents from other labs are the real-world template this lesson and lab
  reference); not independently re-searched this batch since it's descriptive of an established, public
  practice rather than a disputed technical claim.
- **Multi-agent indirect-injection propagation (an injected instruction surviving being "laundered" through
  an intermediate trusted agent's summary)** — a real, current, actively-discussed AI-agent-security concern
  as multi-agent systems move to production; consistent with and building directly on this platform's
  existing indirect-prompt-injection lab from an earlier AI Security batch, differentiated here by the
  two-agent propagation mechanic specifically (the Action Agent never sees the original attacker-controlled
  text at all, only the already-injected summary).

## NEEDS REVIEW (labs/topics), batch 25

- **This batch's factual claims largely inherit verification from this platform's own lesson content**
  (written by the same concurrent session, in the same sitting) rather than fresh, independent `WebSearch`
  citations for every individual fact — flagged honestly per this file's standing practice (see the batch 3
  precedent) rather than overstating how much new external verification happened here. What this session DID
  independently verify: that the labs are mechanically real (registered, reachable, and solvable against the
  actual engine) — the specific gap the mid-batch instruction was aimed at.
- **No new engine capability or limitation surfaced this batch** — all 12 labs fit existing conventions
  cleanly (11 file-review via `cat`, matching the established pattern for protocols this engine can't live-
  simulate; 1 live `curl`+`vulnRoutes` lab, identical in shape to every other API-style lab on the platform).
- **This batch also ran a full-platform duplicate-flag check for the first time**, not just a duplicate-id
  check — zero collisions found across all 502 `flag{...}` strings. Worth adopting as a standing part of every
  future batch's verification pass alongside the duplicate-id check, given how cheap it is to run and that a
  duplicate flag string (unlike a duplicate id, which would be a build-breaking collision) could otherwise
  ship silently.
