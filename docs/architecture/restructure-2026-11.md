# Restructure report: November 2026

Branch `restructure`, based on `main` at `16d55e7`. The first commit on the branch is a snapshot of the
unfinished billing, paid-content, account-deletion and legal work. The restructure follows as
separate commits, so it can be reviewed and reverted on its own.

## Why

| Before | Problem |
| --- | --- |
| `src/pages` (40), `src/lib` (66), `src/data` (40), `src/components` (19 folders), `src/labs`, `src/content`, `src/state` | Folders named after file types. Billing alone was spread across `pages/`, `components/billing/`, `lib/` (3 files) and `data/`. |
| `lib/` mixed Supabase clients, language runtimes, admin analytics, offline caching and PDF generation | No way to tell what a module belongs to, or who should review it |
| Shared UI imported feature data (`RoomHero` → lab rooms, `WorkspaceHeader` → characters) | Hidden coupling: changing a feature could break "generic" components |
| 43 `check-*.cjs` suites lived beside build tools in `scripts/` | Tests and tooling were indistinguishable |
| 23 docs in one flat folder, with 300 KB of notes at the repo root | Current operating guides were buried among historical release notes |
| README was the Vite template | No project overview for a new contributor |

## Research basis

* **Bulletproof React** (a widely used reference architecture for production React): code is grouped
  into `app`, `features` and `shared`, with a one-way import flow (shared → features → app) enforced by
  tooling, a `components/` folder only for genuinely reusable UI, and no barrel files because they hurt
  Vite tree-shaking.
  [project structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
* **Google** monorepo practice: the code is organised hierarchically by owned subtrees, and per-directory
  OWNERS files route reviews to the right people (Android, Fuchsia, Chromium).
  [Potvin & Levenberg, CACM 2016](https://alastairreid.github.io/RelatedWork/papers/potvin:cacm:2016),
  [Fuchsia owners](https://fuchsia.googlesource.com/fuchsia/+/0c00fd3/docs/concepts/source_code/owners.md),
  [Android OWNERS](https://android.googlesource.com/platform/frameworks/base/+/master/OWNERS).
  Applied here as `.github/CODEOWNERS` and one folder per owned feature.
* **Architecture Decision Records**: a short, dated record of each structural decision
  (`docs/adr/`), standard practice across large engineering organisations.
* **Supabase** conventions: functions stay at the repo root as shared infrastructure, reusable code sits in
  `functions/_shared` (never deployed on its own), and schema changes happen only through ordered
  migrations. These were already followed and are unchanged. SQL checks moved into `supabase/tests/`.

## What changed

### Source (`src/`): 1,113 files moved, 0 behaviour changes

| Old location | New location |
| --- | --- |
| `App.tsx`, `main.tsx`, `index.css`, `academy-system.css` | `app/`, `app/styles/` |
| `components/layout/*` | `app/layout/` (shell), `app/guards/` (error boundary, device gate), `features/offline/components/` (install and offline cards), `shared/components/layout/` (icons, logo, portal hero) |
| `pages/LoginPage`, `ResetPasswordPage`, `ProfilePage`, `components/account`, `state/authStore`, `useHandle`, `lib/owner*` | `features/account/` |
| `pages/AdminDashboardPage`, `InstructorDashboardPage`, `components/admin`, `lib/admin*`, `lib/instructor*` | `features/admin/` |
| `pages/BillingPage`, `PricingPage`, `components/billing`, `lib/billing`, `lib/paidContent`, `lib/paidLessonTree`, `data/planTiers` | `features/billing/` |
| `content/`, `data/*Curriculum*`, `data/questionBank`, `data/mlLessons`, `components/{learning,lesson,roadmap,ml}`, module, lesson, roadmap and ML pages | `features/curriculum/` |
| `labs/{engine,vfs,types,narratives,…}`, `labs/scenarios`, `data/labs*`, `components/labs`, `components/terminal`, `lib/lab*`, `state/useLabsData`, `shared/components/Room*`, `MissionPlan`, `TaskList` | `features/labs/` (`engine/`, `scenarios/`, `components/`, `components/room/`) |
| `labs/siem*`, `queryWorker`, `queryLanguages`, `investigation`, `workbookAssessment`, `packetFilter`, `labs/casebooks`, `components/siem`, SIEM and SOC pages | `features/soc/` (`engine/`, `casebooks/`, `components/`) |
| `labs/*Tasks`, `codeTypes`, `projectTypes`, `components/code`, `lib/*Runner`, `*Worker`, `*Harness`, `tsCompile`, `monacoLoader`, code pages | `features/code-practice/` (`tasks/`, `runtimes/`) |
| `pages/LibraryPage`, `BookReaderPage`, `ResourcesPage`, `components/books`, `data/books`, `data/mlLibrary`, `lib/library*`, `lib/offlineReader*`, `labs/securityTasks` | `features/library/` (`data/bookLabs/`) |
| Progress, leaderboard and certificate pages, `components/{certificate,dashboard,companion}`, gamification UI, `data/{xp,levels,streak,…}`, `state/progressStore`, `lib/progressSync`, `lib/leaderboard` | `features/progress/` |
| `components/characters`, `data/characters`, `data/handles` | `shared/characters/` (`HandleWelcome` → `features/account/components/`) |
| `lib/aiTutor`, `components/common/AiChatWindow`, `chatStreaming` | `features/ai-tutor/` |
| `components/tour`, `lib/guidedTour` | `features/onboarding/` |
| `pages/IntroPage`, `landing.css`, `data/contributors` | `features/marketing/` |
| `pages/HelpFaqPage`, `FeedbackPage`, `AnnouncementsPage`, `SecurityPage`, `lib/feedback` | `features/support/` |
| `state/pwa`, `lib/offline{Runtime,Session,Workspace,Coding}` | `features/offline/` |
| `components/common/*` (generic), `hooks/`, `types.ts` → `types/domain.ts`, `lib/{supabaseClient,analytics*,monitoring*,deviceAccess}`, `state/theme` | `shared/` |
| `lib/pdfGenerator` | `features/labs/lib/` (it renders lab write-ups and certificates) |
| `lib/staleBuildRecovery` | `app/` |

### Repository

| Old | New |
| --- | --- |
| `scripts/check-*.cjs` (43 suites) | `tests/` (build gate `check-paid-build.cjs` stays in `scripts/`) |
| `scripts/check-*.sql` | `supabase/tests/` |
| `docs/*.md` (flat) | `docs/operations/`, `docs/releases/`, `docs/reviews/`; `docs/lab-depth-audit.json` → `docs/reviews/` (the audit script now writes there) |
| `NOTES.md`, `labs-index.md`, `MISSING_LABS_ANALYSIS.md` (root) | `docs/notes/` |
| Vite template README | Project README; new `CONTRIBUTING.md`, `.github/CODEOWNERS`, `docs/architecture/`, `docs/adr/` |
| `src/data/labs.ts.bak` (tracked despite `*.bak` in `.gitignore`) | Untracked. The local copy is kept at `src/features/labs/data/labs.ts.bak` and remains in git history (`f92e2ee`) |

### New guard

`tests/check-architecture.cjs` (`npm run test:architecture`, first step of `test:platform` and therefore CI):

* Every source file is in `app/`, `features/<area>/`, `shared/` or `assets/`.
* `shared/` imports no feature and nothing from `app/`.
* Features import nothing from `app/` except the two allowed shell pieces.

At the end of the restructure: 1,096 source files, 14 features and 2,655 relative imports, all passing.
After the first pass, `shared/` still had 18 imports into features or `app/`, and features had 78
imports into `app/` (mostly icons and the logo). The second pass moved those pieces into `shared/`.
Both counts are now 0, apart from 6 explicitly allowed shell imports.

## How the move was done

`tools/restructure/migrate.mjs` applies the ordered rules in `layout.mjs` (and `layout-pass2.mjs`):

1. It maps every tracked file to its new path and fails if any file is unmapped or two files collide.
2. It parses each TypeScript/JavaScript file with the TypeScript compiler and rewrites only real module
   references (`import`, `export … from`, `import()`, `require()`, `new URL(…, import.meta.url)` for
   workers). Lesson and task content that merely contains import-like text, such as the JavaScript
   exercise `require('./routes')`, is never touched.
3. It rewrites relative `url()` paths in CSS.
4. It updates repository paths such as `src/data/labs.ts` in tooling, tests and current docs, and in source comments.
   Paths like `src/App.tsx` that describe a learner's own React project are left alone.
   Applied migrations (`supabase/migrations/0001`–`0015`) are kept byte-identical, so a few of their
   comments still name pre-restructure paths (for example `src/lib/ownerSession.ts` →
   `src/features/account/lib/ownerSession.ts`).
5. It moves each file with `git mv`, so history follows the file.

## Verification

| Check | Before | After |
| --- | --- | --- |
| `tsc -b` | pass | pass |
| `oxlint` | 1 existing warning (`ResearchTerms` fast-refresh) | same warning, nothing new |
| `npm run test:platform` (23 suites) | pass | pass, plus the new architecture suite |
| navigation, engagements, workbook, achievement awards, dig shell, documents, offline library and workspace, ML library | pass | pass |
| `npm run build` (free mode) | pass | pass |
| `VITE_PAID_PLANS=on npm run build` + leak check | pass | pass: none of 674 paid flags or 160 paid lessons in `dist/` |
| `test:owner-content` | pass | pass: 404 owner-only items absent |
| `test:ml-content` (full) | fails: no `python` on this machine | same, unrelated |
| Browser smoke test: 21 routes signed in (landing, pricing, help, roadmap, labs, SOC portal, a casebook, code portal, library, leaderboard, progress, module, billing, profile, announcements, security, resources, certificates, my learning, feedback) | — | every route rendered, no module-load errors |

## For anyone with work in progress

Branches cut from `main` before this change will see path conflicts. Rebase onto `restructure`; git's
rename detection carries most edits across. Files added on another branch in old folders can be moved
by adding a rule to `tools/restructure/layout.mjs` and re-running
`node tools/restructure/migrate.mjs --dry` first.
