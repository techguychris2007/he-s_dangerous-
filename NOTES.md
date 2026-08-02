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
