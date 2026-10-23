# DarkWorld platform audit

Date: 2026-10-22 · Scope: whole repository (`hackerhub`, package `darkworld`) · Benchmarks: TryHackMe (UX, gamification, offensive rooms) and KC7 Cyber (defensive investigations).

Research method: the repository itself, the local preview harness (`scripts/preview-platform.html`) screenshotted at desktop/mobile in light and dark, public pages of both reference platforms captured headlessly, logged-in screenshots of both supplied by the owner, and their public help/docs.

---

## 1. Platform map

| Area | What exists |
|---|---|
| Stack | React 19 + TypeScript 6, Vite 8 (Rolldown), react-router 7, Tailwind CSS v4 (`@theme` tokens in `src/index.css`) plus per-feature CSS files, PWA via `vite-plugin-pwa` (full offline precache). |
| Routing | `src/App.tsx`, every page `lazy()`-loaded. 31 routes: dashboard, roadmap, modules/lessons, `/labs` + `/lab/:slug`, `/soc-portal` + `/siem-lab/:id`, code/build/ML portals, library, leaderboard, profile, progress, instructor, auth pages. |
| State | `src/state/progressStore.ts` — an external store (`useSyncExternalStore`) persisted to localStorage per account and merged with Supabase. Auth in `authStore.ts`. |
| Backend | Supabase: Postgres + RLS (`supabase/migrations/0001–0009`), auth (email/password, guest/anonymous), two edge functions (`ai-tutor`, `ai-lab-tutor`). One `user_progress` row per learner, jsonb columns. RPCs for leaderboard and instructor dashboard. |
| Labs | **Terminal labs** (669): declarative `LabScenario` objects in `src/labs/scenarios/*` run by an in-browser engine (`src/labs/engine.ts`, virtual filesystem `vfs.ts`, simulated network hosts, simulated tools). **SIEM labs** (39): `src/labs/siemScenarios.ts`, seven simulated vendor consoles plus a local multi-dialect query engine (`siemQuery.ts`, `queryLanguages.ts`, worker). **OSINT** (16). **Code/Build tasks**: Pyodide, JS, C++ (JSCPP) runners in workers. |
| Progress & points | Flags captured, lessons, quiz scores, code tasks, activity dates — all derived client-side. XP, levels, ranks, streak freezes, Daily Op and weekly missions are derived from these (added 2026-10-22, `src/data/levels.ts`, `xp.ts`, `streak.ts`, `dailyOp.ts`, `weekly.ts`). Leaderboard ranks opted-in learners by lab points computed from their synced `lab_flags`. |
| Tests | `node scripts/check-*.cjs` integrity suites (`npm run test:platform`), `tsc -b`, `oxlint`. No component/E2E test runner. |
| Device policy | `src/lib/deviceAccess.ts` deliberately blocks phones and tablets (tested). |

## 2. Design tokens (single source of truth: `src/index.css`)

- **Colour** (light / dark): `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-border`, `--color-heading`, `--color-text`, `--color-text-dim`, `--color-navy`, `--color-navy-dim`, `--color-accent` (electric blue), `--color-accent-dim`, `--color-accent-2` (violet), `--color-gold`, `--color-gold-dim`, `--color-gold-soft`, `--color-success`, `--color-warn`, `--color-danger`, `--color-ai-text`. Terminal palette (theme-invariant): `--term-bg`, `--term-output`, `--term-input`, `--term-system`, `--term-muted`, `--term-error`, `--term-error-text`, `--term-success`.
- **Type**: `--font-sans` Inter, `--font-display` Plus Jakarta Sans, `--font-mono` JetBrains Mono; extra steps `--text-2xs` (11px), `--text-code` (13px).
- **Elevation**: `--shadow-card`, `--shadow-glow-accent` (both derived from tokens via `color-mix`).
- **Drift found**: raw hex outside the token block — `navigation.css` 79, `academy-system.css` 71, `lab-mission.css` 51, `entry-pages.css` 50, `query-console.css` 45, `case-workbook.css` 37, `terminal.css` 23, `ModuleBanner.tsx` 54, `ResetPasswordPage.tsx` 25, `ErrorBoundary.tsx` 8. Radii are ad hoc (6px–28px); no radius or motion tokens.
- **Deliberate exception**: the seven SIEM consoles (`SplunkConsole`, `SentinelConsole`, `QRadarConsole`, `ElasticConsole`, `ChronicleConsole`, `SuricataConsole`, `TcpdumpConsole`) imitate the real vendor UIs for training realism. Their vendor colours stay inside the console frame only.

## 3. Page and flow audit

Legend: **F** friction · **V** visual inconsistency · **T** gap vs TryHackMe · **K** gap vs KC7 · **A** accessibility · **P** performance · **S** security · **M** responsiveness.

| Page / flow | Findings |
|---|---|
| Shell (sidebar, top bar) | V: sidebar is hard-coded navy hex, not tokens. T: no Learn / Practice / Compete grouping by that name; notification bell only lists past flags/lessons. P (fixed 2026-10-22): the top bar had started importing the full lab catalog; moved behind lazy `useXpModule`. Ctrl+K search already exists. |
| Dashboard `/` | Rebuilt 2026-10-22: profile header (rank, level, streak, XP, badges), continue card, Daily Op, week + missions, crew picker. T: no recommended rooms, activity heatmap, skill radar, league standing card. |
| Roadmap / paths | T: no visual path tree with prerequisites and lock state; paths are lists. No certificates per path. |
| Module & lesson | F: long text pages with good content; V: module hero uses its own styling. T: no per-module XP/time chips matching rooms. |
| Lab catalog `/labs` | Good filters. T: cards now show ring + XP + guide; missing "new/popular", offensive/defensive indicator, locked state, tags. P: renders 30 at a time — fine. |
| Lab room `/lab/:slug` | Rebuilt overview (room header, tasks). Workspace is a focused dialog: guide tabs + terminal. T: no inline question inputs per task (flags only), no target info panel/timer (not applicable — local simulation), no notes/loot tracker, no attack-path map except 2 labs, no debrief. |
| SOC portal / cases | K: only **1 of 39** SIEM labs is a KC7-style casebook; the other 38 have **median 8 log records** — far from KC7's realistic datasets. 12 have evidence-checkpoint "investigations". No seasons, no recurring company/actor, no entity graph, no evidence locker, no detection-rule scoring. |
| Leaderboard | Podium + leagues added. T/K: single all-time board only; no weekly reset, streak/climber boards, team/university boards. S: see §5. |
| Profile | Rank card added. T: no badge showcase rarity, no activity heatmap, no shareable certificates. |
| Auth | Works (email, guest upgrade). V: `ResetPasswordPage` has 25 raw hex + gradients. |
| Instructor | Exists (progress RPC). T: no funnels/drop-off/most-failed analytics; no authoring UI. |
| States | Error boundary exists (raw hex). Skeletons on some pages; inconsistent elsewhere. |
| M | Phones/tablets intentionally blocked; desktop layouts verified down to 390px wide during this audit — two overflow bugs fixed on the dashboard. |

## 4. Lab content audit

**Terminal labs — 669** (Easy 114 · Medium 281 · Hard 274) across 18 categories (Linux 56, Network 86, Web 61, AD 33, Bug Bounty 30, SOC 44, Forensics 32, Cloud 34, Security+ 29, Binary 28, Malware 29, SecEng 28, API 28, Crypto 27, Mobile 32, Wireless 30, IoT 32, AI Security 30).

- Teaching: every lab's objectives carry a "why" explanation (good); 497/669 have ≥3 hints; only **2** have field-note reference panels.
- Depth: **539 (81%) award a single flag**; 393 target one host, 253 are local-only; only **23 are multi-host**. Most are single-technique rooms, not recon → foothold → privesc → lateral → objective chains.
- Environment: in-browser simulation (no VMs). This is safe by design (no route to real infrastructure) but command coverage is bounded.
- Validation: flags compared client-side; flags are plaintext in the bundle (§5).
- Missing vs TryHackMe-plus: per-task questions, debrief + ATT&CK mapping, defender's view, loot/notes, attack-path map, unguided mode, report task.

**SIEM labs — 39** (Sentinel 8, Splunk 9, Suricata 4, Chronicle 5, tcpdump 4, QRadar 5, Elastic 4) + **OSINT — 16**.

- Only the phishing casebook (12,014 records, 20 questions, 5 chapters, five query dialects, answers computed by running the reference query) meets KC7 quality. It is the template for the rest.
- 38 labs have tiny hand-written datasets (median 8 entries): good for syntax practice, not for investigation.

## 5. Security review (platform)

| # | Severity | Finding |
|---|---|---|
| S1 | **P0** | **622 flags ship in plaintext** in `dist/assets/labs-*.js`. They are the contents of simulated files the learner must be able to `cat`, so a client-side simulation cannot simply hash them. Real fix: per-learner dynamic flags (server derives `HMAC(secret, user, lab, baseFlag)` when a lab starts and verifies submissions), so a flag read from the bundle or shared by a classmate scores nothing. |
| S2 | **P0** | **Progress is self-reported**: the client writes its own `user_progress.lab_flags` under "update own row" RLS, and the leaderboard ranks from it. Scores can be forged. |
| S3 | P1 | Workbook answers are computed client-side from the shipped dataset (acceptable for practice; not for competitive scoring). |
| S4 | P1 | No answer-attempt rate limit. |
| S5 | P2 | No CSP/security headers configured in `vercel`/hosting docs; review needed. |
| S6 | OK | RLS present on every table checked; anon key cannot bypass it; leaderboard is opt-in and exposes only name + flags. |

## 6. Prioritised plan

Effort: S ≤ ½ day · M 1–2 days · L 3–5 days · XL > 1 week (single engineer).

### P0 — correctness, trust, the defensive experience
| Item | Effort |
|---|---|
| Server-authoritative scoring: `submit-proof` edge function + `verified_proofs` table (insert only via the function, rate-limited), per-learner dynamic flags issued at lab start, leaderboard reads verified proofs only; offline play still works and syncs proofs for verification when back online; migration keeps legacy progress readable | L |
| Convert every SIEM lab to a KC7-style casebook on a seeded, deterministic telemetry generator (one fictional company world, consistent actor infrastructure, realistic noise), questions answered by query | XL |
| Design-token consolidation: replace raw hex in shell/lab/case CSS with tokens; add radius + motion tokens | M |

### P1 — TryHackMe-grade experience
| Item | Effort |
|---|---|
| Lab room: per-task questions with instant validation, notes/loot tracker with report export, debrief (what you did / what the defender saw / prevention, ATT&CK) linked to the matching defensive case | L |
| Defensive season: "Season 1" storyline across 3+ linked cases; entity board + evidence locker; detection-rule task scored on TP/FP | XL |
| Paths: visual roadmap tree with prerequisites, lock state, progress rings, completion certificate with verification id | L |
| Leaderboards: weekly league reset with promotion/demotion, streak/climber boards, teams/classes (needs tables) | L |
| Profile: badge showcase with rarity tiers, activity heatmap, skill radar | M |
| Instructor analytics: funnels, drop-off, most-failed questions, hint usage | M |

### P2 — scale and tooling
| Item | Effort |
|---|---|
| Offensive attack-chain rewrites (multi-host recon → objective) beginning with Web, AD, Linux privesc; unguided mode | XL |
| Lab spec JSON schema + validator/linter in `scripts/`; authoring guide | L |
| Authoring UI with preview, draft/publish | XL |
| Events: timed CTFs, King of the Hill | XL |
| Component/E2E test runner (Vitest + Playwright) for core flows | M |

## 7. Constraints and assumptions

1. **No VM/container infrastructure exists** (Supabase only). Offensive labs stay in-browser simulations — isolated by construction, no network egress — rather than per-user cloud machines. "Start/stop/extend" machine controls are therefore not applicable; session reset is.
2. **Phones/tablets remain blocked** by the owner's tested device policy; layouts are still built to work at narrow desktop widths.
3. **Brand colours are fixed** to the tokens in §2; derived tints use `color-mix` of tokens only. The owner allows refining token values where contrast or harmony needs it (same hues, never a new brand colour). Vendor console colours are confined to the simulated consoles.
6. Server-side pieces (migrations, edge functions) are written into `supabase/` but **not applied to the live project** without the owner's go-ahead; the client degrades gracefully until they are deployed.
4. Characters (Sentinel, Ledger, Beacon / Vex, Cipher, Byte / Wraith) appear where they guide or celebrate — room headers, dashboard cards, toasts, empty states — drawn only in platform tokens.
5. Schema changes ship as new numbered migrations; existing `user_progress` rows keep working unchanged.
