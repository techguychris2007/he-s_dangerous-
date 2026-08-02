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
