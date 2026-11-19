# DarkWorld Academy architecture

How the platform is put together, where each part lives, and how a request flows through it.
This document reflects the layout introduced on the `restructure` branch in November 2026
([ADR 0001](../adr/0001-feature-based-source-layout.md)). `npm run test:architecture` keeps the
code and this document in agreement.

## 1. System at a glance

DarkWorld is a single-page web app with no application server of its own. The browser does almost all
of the work: labs, SIEM queries, code execution and book search all run client-side. Supabase provides
identity, storage and a few server-side functions. Vercel serves the static build.

```
                 ┌──────────────────────────── Browser (React 19 SPA, HashRouter) ───────────────────────────┐
  learner ──────▶│  app shell ─▶ features (labs · soc · curriculum · code-practice · library · progress …)    │
                 │                 │            │                    │                    │                  │
                 │       simulated hosts   query worker   Pyodide / sql.js / JSCPP /   pdf.js + local       │
                 │       (virtual FS,      (SPL, KQL,     .NET wasm / TS compiler      search & embeddings  │
                 │        shell engine)     EQL, AQL…)    in Web Workers               in Web Workers       │
                 │  localStorage (progress, session) · Cache Storage (owner-only offline PWA)               │
                 └───────────────┬──────────────────────────────────────┬─────────────────────────────────────┘
                                 │ supabase-js (anon key + user JWT)     │ static files
                                 ▼                                       ▼
   ┌──────────────────────── Supabase (rbkqqwmqdzgnpnhkwomg) ───────────┐   ┌────── Vercel ──────┐
   │ Auth: email, Google, GitHub                                       │   │ dist/ (Vite build) │
   │ Postgres + row-level security: progress, leaderboard, feedback,   │   │ public/ (books,    │
   │   ratings, comments, instructor & admin views, billing, access    │   │  runtimes, legal)  │
   │ Storage: owner-content (private), paid-content (plan-gated)       │   └────────────────────┘
   │ Edge Functions (Deno): ai-tutor, ai-lab-tutor, admin-analyst,     │
   │   paystack-checkout, paystack-webhook, delete-account             │──▶ Groq · Gemini · Anthropic
   └───────────────────────────────────────────────────────────────────┘──▶ Paystack (cards, MoMo)
```

| Concern | Technology |
| --- | --- |
| UI | React 19, React Router 7 (hash routes), Tailwind 4 plus hand-written CSS per component |
| Build | Vite, TypeScript (`tsc -b` typecheck), oxlint, vite-plugin-pwa |
| Backend | Supabase Auth, Postgres with RLS, Storage, Edge Functions (Deno) |
| Payments | Paystack (Stripe-owned; accepts Ghana-registered businesses), card subscriptions and one-time MoMo/card passes |
| AI | Groq first, Gemini fallback (tutors); Anthropic, with Gemini fallback (admin analyst). Every key lives server-side only |
| Observability | Sentry (scrubbed of learner identity), SimpleAnalytics (production only, honours Do Not Track) |
| Hosting | Vercel (static), CI on GitHub Actions |

## 2. Repository layout

```
.
├── src/                    the web app (see §3)
├── supabase/
│   ├── migrations/         0001 … 0015, applied in order; the only way the database schema changes
│   ├── functions/          one folder per Edge Function, plus _shared/ (CORS, LLM, Paystack, prices)
│   └── tests/              SQL checks run against a database (anonymous access, instructor views)
├── tests/                  node verification suites (check-*.cjs), run by `npm run test:*` and CI
├── scripts/                build, publish and audit tooling (paid/owner content, banners, policy pages)
├── tools/                  separately built runtimes (C# runner, TypeScript runtime) and the restructure codemod
├── public/                 files served as-is: books, wasm runtimes, icons, legal pages
├── docs/
│   ├── architecture/       this document and the restructure report
│   ├── adr/                architecture decision records
│   ├── operations/         launch, billing, Vercel access, release flags, offline reader
│   ├── legal/              policy drafts and the launch legal checklist
│   ├── releases/           per-release notes (historical)
│   ├── reviews/            curriculum reviews and audits (historical)
│   └── notes/              long-running research notes and lab indexes
├── .github/                CI workflow and CODEOWNERS
├── index.html · vite.config.ts · tsconfig*.json · vercel.json · package.json
└── README.md · CONTRIBUTING.md · CHANGELOG.md
```

## 3. Source layout and dependency rule

`src/` has four layers. Imports flow in one direction only: **app → features → shared**.
`tests/check-architecture.cjs` fails the build if a file sits outside these layers or an import
points the wrong way.

```
src/
├── app/          the shell: entry point, routes, layout chrome, guards, global styles
├── features/     one folder per product area; owns its pages, components, data and logic
├── shared/       building blocks used by several features; knows nothing about any feature
├── assets/       fonts and banner images
└── vite-env.d.ts environment variable types
```

| Layer | May import | Must not import |
| --- | --- | --- |
| `app/` | features, shared, assets | — |
| `features/<area>/` | its own files, other features, shared, assets | `app/`, except `app/layout/PortalNavigation` and `app/guards/ComputerAccessGate` (documented exceptions) |
| `shared/` | shared, assets | features, app |

Within a feature the sub-folders are always named the same way, so a newcomer knows where to look:

| Folder | Holds |
| --- | --- |
| `pages/` | route components (one per URL in `app/App.tsx`), plus page-level CSS |
| `components/` | React components used by this feature's pages |
| `data/` | static catalogues and content definitions (TypeScript, not fetched) |
| `lib/` | non-React logic: Supabase calls, calculations, formatting |
| `state/` | stores and hooks holding client state |
| feature-specific | `engine/` (simulators), `scenarios/` (lab packs), `tasks/` (coding exercises), `runtimes/` (language workers), `content/` (lesson bodies), `casebooks/` (SOC cases) |

### 3.1 Features

Sizes are TypeScript files and lines at the time of the restructure.

| Feature | Files / lines | What it owns | Key routes |
| --- | --- | --- | --- |
| `labs` | 177 / 50k | Lab catalogue, simulated hosts (virtual filesystem and shell engine), 130+ scenario packs, room UI, comments, ratings, write-up PDFs | `/labs`, `/lab/:labSlug`, `/tasks` |
| `soc` | 40 / 7k | SIEM workspace (Splunk, Elastic, Sentinel, Chronicle, QRadar, Suricata, tcpdump consoles), query engine and worker, investigation workbooks, 38 casebook cases | `/soc-portal`, `/siem-lab/:labId` |
| `curriculum` | 303 / 58k | Learning paths, 66 modules, lesson bodies (`content/`), quizzes and typed-question bank, roadmap, ML lessons | `/`, `/roadmap`, `/my-learning`, `/module/…`, `/schedule`, `/ml-portal`, `/ml-lesson/:id` |
| `code-practice` | 359 / 71k | Coding tasks (Python, JS, TS, C++, C#, SQL, DevOps, software-engineering projects), Monaco editor, test harnesses, language runtimes in Web Workers | `/code-portal`, `/code-task/:id`, `/build-portal`, `/build-task/:id`, `/se-verify` |
| `library` | 25 / 6k | Free book library, PDF reader, offline passage search, book-to-lab mapping | `/library`, `/library/:bookId`, `/resources` |
| `progress` | 30 / 3k | XP, levels, streaks, weekly missions, achievements, leaderboard, certificates, cloud sync of progress | `/progress`, `/leaderboard`, `/certificates` |
| `account` | 10 / 1k | Sign-in, password reset, profile, account deletion, owner access and owner-only content | `/login`, `/reset-password`, `/profile` |
| `billing` | 8 / 1k | Plan tiers, pricing, checkout, entitlements, paid-content unlock | `/pricing`, `/billing` |
| `admin` | 9 / 2k | Instructor dashboard and the operator dashboard with its AI analyst | `/instructor`, `/admin` |
| `ai-tutor` | 3 / 0.4k | Streaming chat window and the tutor API client shared by labs and the reader | — |
| `offline` | 10 / 0.4k | Installable PWA (owner accounts only), offline runtime and workspace preparation | — |
| `onboarding` | 2 / 0.4k | Guided tour | — |
| `marketing` | 2 / 0.3k | Public landing page and founders section | `/welcome` |
| `support` | 5 / 0.4k | Help/FAQ, feedback, announcements, security page | `/help`, `/feedback`, `/announcements`, `/security` |

### 3.2 Shared

| Folder | Contents |
| --- | --- |
| `shared/components/` | Design-system pieces: `WorkspaceHeader`, `AcademyHero`, `StatCard`, `ProgressRing`, `Skeleton`, `StarRating`, `DifficultyPill`, `MarkdownText`, `IsoBlock`, `DarkWorldBadge`; `layout/` holds icons, logo, portal hero |
| `shared/characters/` | The DarkWorld cast (crews, avatars, "dig" mascot) and cyber-name handles, derived from the account id |
| `shared/lib/` | `supabaseClient`, monitoring (Sentry with scrubbing), analytics policy, device detection |
| `shared/hooks/`, `shared/state/` | Accessible-modal hook; theme |
| `shared/types/` | Domain types (`domain.ts`: modules, lessons, quizzes) and type shims for JSCPP and sql.js |
| `shared/styles/` | Entry-page styling shared by landing, sign-in and the device gate |

## 4. How it works

### 4.1 Start-up and routing
`index.html` loads `src/app/main.tsx`. It applies the saved theme, starts the PWA logic, sets up stale-build
recovery (a tab left open across a deploy reloads once), starts Sentry, then renders
`ErrorBoundary → ComputerAccessGate → App`. `app/App.tsx` declares every route. Each page is loaded with
`React.lazy`, so a learner downloads only the features they open. `app/layout/AppLayout` wraps
learning pages in the sidebar and top bar; work areas (labs, SIEM, code) use the focused header from
`learningWorkspace.ts`.

### 4.2 Identity and sessions
`features/account/state/authStore.ts` wraps Supabase Auth (email/password, Google, GitHub). It also reads
the stored session directly, so an offline device with an expired access token still knows who is
signed in. Owner accounts (the two founders) are recognised in `features/account/lib/ownerSession.ts`
and unlock owner-only tracks, offline install and the admin area.

### 4.3 Progress
`features/progress/state/progressStore.ts` is the single source of truth for completions, flags, quiz
scores, code tasks, streak days and XP. It saves to `localStorage` on every change. When the learner is
signed in, `progressSync.ts` merges it with the `user_progress` row (migration 0001 and later) and pushes
updates with retries. Errors are never treated as empty progress, so a failed fetch cannot wipe an
account. Streaks, weekly missions, daily ops and certificates are recomputed from synced timestamps
rather than stored.

### 4.4 Labs (simulated hosts)
`features/labs/data/labs.ts` assembles the catalogue from `scenarios/` packs; `labScenarios.ts` is the
list the paid-content build plugin can replace with stubs. `useLabsData` loads the catalogue lazily,
because it holds about 2.5 MB of scenario content. A lab runs entirely in the browser:
`engine/vfs.ts` is a virtual filesystem and `engine/engine.ts` interprets shell commands against it,
answering with each real tool's own error text. Flags are earned by reaching the scenario's objectives.
Supplied credentials are allow-listed (`starterAccess.ts`), so accounts found during an exercise are
never treated as handed out.

### 4.5 SOC and SIEM
`features/soc/engine/siemScenarios.ts` defines datasets. The `queryWorker.ts` Web Worker parses and runs
SPL, KQL, EQL, AQL and similar dialects (`queryLanguages.ts`, `siemQuery.ts`, `siemExecution.ts`) so heavy
queries never block the page. Casebooks (`casebooks/`) are multi-question investigations; each answer is
checked against the dataset (`workbookAssessment.ts`). The tests prove all 395 casebook answers are
reachable.

### 4.6 Code practice
Tasks live in `features/code-practice/tasks/`. Running code never leaves the browser: `runtimes/` starts
one Web Worker per language (Pyodide for Python, sql.js for SQL, JSCPP for C++, a .NET WebAssembly
runtime from `public/csharp-runtime/` for C#, and the TypeScript compiler from `tools/ts-runtime/`).
Each task carries tests. `testResult.ts` and `runResult.ts` read only genuine harness output, so printed
text cannot fake a pass. React projects are previewed in an isolated frame (`reactHarness.ts`).

### 4.7 Library
Books are open-licence PDFs in `public/books/`, rendered with pdf.js. Book search
(`features/library/lib/librarySearch.ts`) is extractive and deterministic: it returns real passages with
page numbers and never generated text. It runs in a worker over text extracted once per library and can
be prepared for offline use.

### 4.8 AI tutoring
The browser never holds an AI key. `features/ai-tutor/lib/aiTutor.ts` streams from the `ai-tutor` and
`ai-lab-tutor` Edge Functions. These call Groq first and fall back to Gemini, which can ground answers
with Google Search; citations are only shown when the provider actually returned them. The operator
dashboard's analyst (`admin-analyst`) receives aggregated, de-identified statistics only.

### 4.9 Paid plans and protected content
Two launch switches control commercial behaviour, both off by default:

* `VITE_PAID_PLANS=on`: the build runs `scripts/vite-paid-content.mjs`, which replaces Pro/Max lessons and
  labs with stubs. The full payloads are uploaded to the private `paid-content` bucket
  (`npm run publish:paid-content`), and `paid_access()` row-level security (migration 0014) serves them
  only to entitled accounts. `scripts/check-paid-build.cjs` fails the build if any paid flag or lesson
  text leaks into `dist/`.
* `VITE_COMPUTER_ONLY=on`: phones and tablets see a "continue on a computer" notice.

Checkout: `features/billing/lib/billing.ts` calls the `paystack-checkout` function, which uses the server
price table in `supabase/functions/_shared/billingPlans.ts`. The browser imports that same file, so
prices never drift. Paystack calls `paystack-webhook`, which verifies the HMAC-SHA512 signature,
re-verifies the charge with Paystack and records the entitlement through an idempotent SQL function
only the service role can call (migration 0013).

Owner-only tracks (machine learning, C# and .NET, software engineering) use the same pattern with the
`owner-content` bucket (`scripts/publish-owner-content.cjs`, migration 0012), and
`test:owner-content` proves they are absent from the public bundle.

### 4.10 Offline
The service worker is registered only for owner accounts (`features/offline/state/pwa.ts`). Owners can
prepare runtimes, books and workspaces for offline use; everyone else gets a normal online site with no
lingering cache.

### 4.11 Account deletion
`/profile` → `delete-account` Edge Function. It cancels any renewing Paystack subscription first, then
deletes the auth user; database cascades remove progress, comments, ratings and feedback. Payment
records are kept, without the account link, for tax purposes.

## 5. Data model (Supabase)

| Migration | Adds |
| --- | --- |
| 0001–0002 | `user_progress` (one JSON row per account) and code-task completions |
| 0003, 0009, 0010 | Instructor dashboard views and identity |
| 0004 | Opt-in leaderboard |
| 0005–0008 | Feedback, lab ratings, engagement signals, lab comments |
| 0011 | Guest (anonymous) data access disabled |
| 0012 | Owner content bucket and access |
| 0013 | Billing: payments, subscriptions, entitlements, `record_payment` |
| 0014 | Paid content bucket and `paid_access()` |
| 0015 | Admin dashboard |

Every table uses row-level security. A learner can read and write only their own rows. Staff views
check an allow-list; service-role-only functions handle money.

## 6. Build, test and deploy

```
npm run dev                 Vite dev server (needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
npm run build               tsc -b → vite build → paid-content leak check
npm run lint                oxlint
npm run test:architecture   layout and import-direction guard
npm run test:platform       architecture + 23 platform suites (labs, SIEM, casebooks, code tasks, billing …)
```

CI (`.github/workflows/ci.yml`) runs lint, build, `test:platform`, the owner-content bundle check and the
remaining content suites on every push and pull request. Vercel builds `main`. Database changes ship as
new numbered migrations; functions deploy with `supabase functions deploy <name> --use-api`.

The suites in `tests/` load real source files through a small TypeScript loader
(`scripts/register-typescript.cjs`) and replay labs, casebooks and coding tasks end to end. Reference
solutions must pass and starter code must fail.

## 7. Security model in one page

* No secret reaches the browser: AI and Paystack keys are Edge Function secrets, and the anon key is public by design.
* RLS on every table, a staff allow-list, and service-role-only payment writes.
* Paid and owner content are absent from the bundle and served from private buckets behind RLS. The build fails on a leak.
* Webhooks are signature-checked and re-verified with Paystack; recording a payment is idempotent.
* Sentry events are scrubbed of identity, tokens, query strings and typed input (`test:monitoring`).
* Lab content is simulation only; no real network traffic leaves the browser.

## 8. Known exceptions and follow-ups

* Two features import from the shell (`PortalNavigation`, `ComputerAccessGate`). Both are allowed explicitly in the guard.
* Features import each other freely (for example `curriculum → labs`, `soc → labs`). A later step could give each feature a public `index.ts` and forbid deep cross-feature imports.
* `supabase/functions/ai-lab-tutor/` contains a stray file named `from shapes import area_circle, area_rec.py`. It is not deployed and was left untouched.
* `test:ml-content` (full mode) needs a `python` executable with numpy; the structure-only mode runs in CI.
