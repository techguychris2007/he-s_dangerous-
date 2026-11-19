# Contributing to DarkWorld Academy

## Where code goes

Read [docs/architecture/README.md](docs/architecture/README.md) first. In short:

* **A new page or capability for one product area** goes in `src/features/<area>/`, in the usual
  sub-folders: `pages/`, `components/`, `data/`, `lib/`, `state/`.
* **A new product area** gets its own `src/features/<new-area>/`. Register its routes in `src/app/App.tsx`.
* **Something three or more features need** goes in `src/shared/`. Shared code must not import from a feature.
* **Shell-wide behaviour** (routing, layout, guards) goes in `src/app/`.

Imports flow `app → features → shared`. `npm run test:architecture` enforces this, and CI fails if it is broken.

## Conventions

* TypeScript everywhere in `src/`. Use relative imports, with no path aliases (the node test suites `require()` source files directly).
* Import files directly. Do not add `index.ts` re-export barrels (they slow Vite and hurt tree-shaking).
* Component CSS lives next to its component, in kebab-case (`lesson-reader.css`). Components use PascalCase file names; logic modules use camelCase.
* Secrets never use the `VITE_` prefix. AI and payment keys are Supabase Edge Function secrets.
* Database changes are new numbered files in `supabase/migrations/`. Never edit an applied migration.

## Before you push

```bash
npm run lint
```

```bash
npm run build
```

```bash
npm run test:platform
```

Add or extend a suite in `tests/` for every behaviour you change. Labs, casebooks and coding tasks are
replayed end to end: reference solutions must pass and starter code must fail.

## Decisions

Structural decisions are recorded in [docs/adr/](docs/adr/). Copy the format of
`0001-feature-based-source-layout.md` and number the next one in sequence.

## Commits and branches

* Work on a branch; `main` deploys to production through Vercel.
* Write commit messages in the imperative mood ("Add casebook 39"), with the reason in the body.
