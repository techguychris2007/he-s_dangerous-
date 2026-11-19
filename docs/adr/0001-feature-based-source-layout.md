# ADR 0001: Feature-based source layout

* Status: accepted
* Date: 2026-11-19
* Branch: `restructure`

## Context

`src/` was organised by file type: `pages/` (40 files), `components/` (19 folders), `lib/` (66 files),
`data/` (40 files), `labs/`, `content/` and `state/`. Code for one product area, such as billing, was
spread across five of those folders. That made the code hard to navigate, review and assign. Nothing
stopped low-level modules from importing pages, and the 43 verification scripts sat beside the build
tooling in `scripts/`.

## Decision

Organise `src/` by product area, following the pattern used by large React codebases (Bulletproof
React's `app / features / shared` split) and the ownership-by-directory practice used at Google
(OWNERS/CODEOWNERS files per subtree):

* `src/app`: the shell (entry, routes, layout, guards, global styles).
* `src/features/<area>`: everything one product area needs, with the same sub-folder names in every feature.
* `src/shared`: code used by several features, with no knowledge of any feature.
* Imports flow `app → features → shared`, enforced by `tests/check-architecture.cjs` in `test:platform` and CI.
* Verification suites move to `tests/`, SQL checks to `supabase/tests/`, and docs are sorted by purpose.
* Imports stay relative (no `@/` alias), because the node test suites `require()` source files directly and an alias would need a resolver in every suite.
* No barrel `index.ts` files were added. Bulletproof React advises against them because they hurt Vite tree-shaking.

## Consequences

* Finding code: the URL tells you the feature, and the feature tells you the folder.
* Ownership can be assigned per feature in `.github/CODEOWNERS`.
* The move was mechanical (`tools/restructure/`): file contents changed only in import paths and in comments that named old paths. Typecheck, lint, both build modes and every suite pass unchanged.
* `git log --follow` and `git blame -C` still trace history across the moves, because every file was moved with `git mv`.
* Open work on other branches will conflict on paths. Rebase onto `restructure` and let git's rename detection carry edits across, or re-run the codemod.
