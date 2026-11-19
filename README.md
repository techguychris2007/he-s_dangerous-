# DarkWorld Academy

Hands-on cybersecurity and software-engineering training in the browser: guided lessons, simulated
hacking labs, SOC investigations in realistic SIEM consoles, and coding practice with real runtimes.
Live at [darkworldacademy.tech](https://darkworldacademy.tech).

## Quick start

```bash
npm ci
```

```bash
cp .env.example .env.local   # then fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

```bash
npm run dev
```

## Project map

| Path | What is there |
| --- | --- |
| `src/app/` | App shell: entry point, routes, layout, guards |
| `src/features/` | One folder per product area: `labs`, `soc`, `curriculum`, `code-practice`, `library`, `progress`, `account`, `billing`, `admin`, `ai-tutor`, `offline`, `onboarding`, `marketing`, `support` |
| `src/shared/` | Reusable UI, the character cast, Supabase client, monitoring, types |
| `supabase/` | Database migrations, Edge Functions, SQL checks |
| `tests/` | Verification suites (`npm run test:*`) |
| `scripts/` | Build, publish and audit tooling |
| `docs/` | Architecture, decisions, operations, legal, release notes |

Start with **[docs/architecture/README.md](docs/architecture/README.md)** to see how everything fits together.

## Everyday commands

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Typecheck, production build, paid-content leak check |
| `npm run lint` | oxlint |
| `npm run test:architecture` | Checks the folder layout and import direction |
| `npm run test:platform` | Architecture check plus the main platform suites (run in CI) |

## Launch switches

| Variable | Off (default) | On |
| --- | --- | --- |
| `VITE_PAID_PLANS` | Everything is free and in the bundle | Pro/Max content is served from the plan-gated bucket ([billing setup](docs/operations/billing-setup.md)) |
| `VITE_COMPUTER_ONLY` | Phones, tablets and computers allowed | Laptops and desktops only |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## DarkWorld contributors

DarkWorld was built together by **[ChrisB](https://www.linkedin.com/in/christopher-bondam-53bb973b8/)** and **[Benedict Adjei](https://www.linkedin.com/in/benedictadjei/)**.

Benedict championed the idea behind the platform and has given his dedication, ideas and hands-on contributions to building it alongside ChrisB. DarkWorld is a shared creation, grounded in their friendship and commitment to practical cybersecurity learning.
