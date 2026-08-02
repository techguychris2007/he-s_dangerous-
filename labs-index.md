# Labs index

Running count and category breakdown for the offensive-security lab expansion. See `CHANGELOG.md` for
full narrative detail on every batch (what was added, why, and how each one was verified); this file is
just the running tally `NOTES.md`'s citations and the "when I'm back" summary can point at.

**Total labs: 231** (204 at the start of this expansion → 231 now, +27 so far toward the "up to 500, quality
first" target). Every count below is the actual `LABS.length` broken out by `category`, not an estimate.

| Category | Count | This expansion added |
|---|---|---|
| Linux | 22 | — |
| Network | 25 | — |
| Web | 41 | +1 (DNS rebinding SSRF-allowlist bypass) |
| Active Directory | 19 | +4 (ADCS ESC1, RBCD abuse, Silver Ticket, Shadow Credentials) |
| Bug Bounty | 20 | — |
| SOC | 16 | — |
| Forensics | 12 | +2 (Volume Shadow Copy NTDS.dit dump, NTFS timestomping $SI/$FN mismatch) |
| Cloud | 14 | +2 (IMDSv2 bypass, Docker-socket container escape) |
| Security+ | 11 | — |
| Binary Analysis | 12 | +2 (stack canary leak via format string, use-after-free function pointer hijack) |
| Malware | 13 | — |
| Security Engineering | 10 | — |
| **API** (new category) | 9 | +9 (BFLA, JWT kid injection, legacy-version IDOR, excessive data exposure, rate-limit bypass, WebAuthn downgrade, method-override authz bypass, GraphQL field-level authz bypass, Referer-header API key leak) |
| **Cryptography** (new category) | 7 | +7 (ECB block-shuffling, hash length extension, JWT algorithm confusion, predictable PRNG session tokens, AES-CTR nonce reuse, Bleichenbacher RSA padding oracle, UUIDv1 reset-token entropy) |

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
