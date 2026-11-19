import { pf, type ProjectTask } from '../../../projectTypes';

const BRIEF = `# Week 24: Capstone

Your capstone is **one substantial, production-style product that you build, deploy and defend on your own** — in your
own GitHub repository, running on Azure. Mentors review the product itself at each milestone and at Demo Day. This
project is your **submission kit**: the documents and pipeline files every capstone must have, checked here for
completeness so nothing is missing when you present. Replace the templates with your own capstone's content (the
reference solution is a complete worked example for a fictional product, *Kliniq*).

| Milestone | Files in this kit |
| --- | --- |
| Proposal | \`capstone/PROPOSAL.md\` — Problem, Users, Features, Non-goals, Success measures |
| Design document | \`capstone/DESIGN.md\` — Requirements, Estimates, Architecture, Data model, API, Security (a STRIDE threat model), Risks; \`docs/adr/NNNN-title.md\` — at least three ADRs |
| Working product | \`README.md\` (quick start with \`docker compose up\`, how to run the tests, links), \`.github/workflows/ci.yml\` |
| Deployed product | \`.github/workflows/deploy.yml\` (OIDC, a production environment, a smoke test), \`capstone/RUNBOOK.md\` (an entry per alert) |
| Final submission | \`capstone/EVIDENCE.md\` (tests, load test, SLO, security, pull requests), \`capstone/DEMO.md\` (a timed demo script) |

What the checks look for:
- **PROPOSAL**: every section; at least three features and one non-goal as \`-\` bullets; a number in Success measures.
- **DESIGN**: every section with substance; numbers in Estimates; a Security section that walks at least four STRIDE
  categories by name and says how authorisation is enforced.
- **ADRs**: at least three files named like \`0001-use-postgresql.md\`, each with a \`Status:\` line (Proposed, Accepted,
  Superseded or Deprecated) and \`## Context\`, \`## Decision\` and \`## Consequences\` sections.
- **RUNBOOK**: at least two \`## Alert: …\` entries, each with \`Meaning:\`, \`Check:\`, \`Mitigate:\` and \`Escalate:\`.
- **DEMO**: segments as \`-\` bullets ending in \`(N min)\`, totalling 5–10 minutes, and a fallback plan.
- **EVIDENCE**: p95 and p99 latencies in ms, an error rate in %, a number of tests, an SLO in %, and a link or count of
  pull requests.
- **ci.yml**: runs on pull requests, read-only permissions, \`dotnet test\`. **deploy.yml**: \`id-token: write\`,
  \`environment: production\`, a \`curl --fail\` smoke test on \`/health/ready\`.
- **README**: \`docker compose up\`, how to run the tests, and links to the design document and the runbook.
`;

const INSPECT = `// Run: which kit files exist, and their ## sections.
import { listFiles, readFile } from 'dw:project';

for (const path of listFiles()) {
  if (!path.endsWith('.md') || path === 'CAPSTONE-BRIEF.md') continue;
  const headings = readFile(path).split(String.fromCharCode(10)).filter((l) => l.startsWith('## ')).map((l) => l.slice(3));
  console.log(path + (headings.length ? ': ' + headings.join(' · ') : ''));
}
`;

const PROPOSAL_STARTER = `# Capstone proposal — TODO: product name

## Problem

TODO

## Users

TODO

## Features

TODO

## Non-goals

TODO

## Success measures

TODO
`;

const PROPOSAL = `# Capstone proposal — Kliniq

## Problem

Public clinics in Accra hand out paper numbers from 6 a.m.; patients queue for hours without knowing when they will be
seen, and staff cannot plan the day. Missed appointments are never released to other patients.

## Users

Patients with an Android phone or a basic phone (SMS); reception staff at small clinics; clinic managers who plan
staffing.

## Features

- Patients book a same-day or next-day slot from a phone (web app or SMS) and receive a confirmation code.
- Reception sees the day's queue, checks patients in and marks no-shows, which releases the slot.
- Patients get an SMS when they are three places from the front.
- Managers see daily attendance and average waiting time.

## Non-goals

- Medical records, prescriptions and insurance claims.
- Payments (all clinic visits in the pilot are free at the point of care).
- Multi-clinic chains with shared doctors.

## Success measures

In a four-week pilot with two clinics: 60% of visits booked through Kliniq, median waiting time on site below 45
minutes, fewer than 5% of booked slots wasted, and receptionists rating it 4 out of 5 or better.
`;

const DESIGN_STARTER = `# Capstone design — TODO: product name

## Requirements

TODO

## Estimates

TODO

## Architecture

TODO

## Data model

TODO

## API

TODO

## Security

TODO

## Risks

TODO
`;

const DESIGN = `# Capstone design — Kliniq

## Requirements

Functional: patients book, view and cancel slots by web app or SMS; reception manages the day's queue; patients are
notified as their turn approaches; managers see attendance reports. Non-functional: booking available 99.5% of clinic
opening hours; queue updates visible to reception within 2 seconds; works on 3G phones (first load under 300 KB);
personal data handled under Ghana's Data Protection Act. Non-goals: medical records and payments.

## Estimates

Pilot: 2 clinics × 120 patients a day = 240 bookings a day. Target after a year: 50 clinics × 150 = 7 500 bookings a day,
peaking at about 40 bookings per minute when slots open at 6 a.m. — under 1 request per second on average, with a burst
of about 5 per second. Queue views poll every 15 seconds from 50 reception desks: about 3 requests per second. Data:
7 500 bookings × 1 KB ≈ 7.5 MB a day, about 2.7 GB a year. SMS: about 3 per booking, 22 500 a day, the main running cost.

## Architecture

A React PWA and an SMS gateway adapter call an ASP.NET Core API (modular monolith: Booking, Queue, Notifications) on
Azure Container Apps, with PostgreSQL Flexible Server, Key Vault for secrets and a managed identity for all Azure
access. Domain events go through a transactional outbox to a background worker that sends SMS. OpenTelemetry exports to
Application Insights; health endpoints feed Container Apps probes. Infrastructure is Terraform; deployment is GitHub
Actions with OIDC and environment approvals.

## Data model

Clinic (id, name, opening hours, slot length) → Slot (clinic, start, capacity, booked, row version) → Booking (slot,
patient phone, code, status, created, checked-in, no-show). Bookings are queried by clinic and day, indexed on (clinic_id,
day). Phone numbers are stored in E.164 format and encrypted at rest with Postgres column encryption keys from Key Vault.

## API

POST /api/clinics/{id}/bookings with an Idempotency-Key header returns 201 with a booking code, 409 when the slot is full.
DELETE /api/bookings/{code} cancels. GET /api/clinics/{id}/queue?day= returns the queue for reception (staff only).
POST /api/bookings/{code}/check-in and /no-show update status (staff only). Errors are RFC 9457 problem details.

## Security

STRIDE walk over the data flows. Spoofing: staff sign in with Entra ID; patients identify by phone with a one-time SMS
code. Tampering: all traffic over HTTPS, row versions prevent lost updates, SMS gateway callbacks are signed and
verified. Repudiation: check-ins and no-shows are written to an append-only audit log with the staff member's id.
Information disclosure: authorisation is enforced per clinic — every staff query filters by the clinics in the user's
claims, tested for each endpoint; phone numbers are encrypted and masked in logs. Denial of service: rate limits per
phone number and per IP on booking and OTP endpoints. Elevation of privilege: policies separate reception and manager
roles; the API's managed identity has only the roles it needs.

## Risks

SMS delivery delays could make notifications late; we track delivery receipts and alert on latency. Clinics may lose
internet for hours; reception can export the day's queue as a printable list each morning. Adoption depends on
receptionists: we train them on site and keep the paper process as a fallback during the pilot.
`;

const ADR_STARTER = `# 0001. TODO: decision title

Status: Proposed

## Context

TODO

## Decision

TODO

## Consequences

TODO
`;

const ADR1 = `# 0001. Use a modular monolith

Status: Accepted

## Context

One developer, a four-week pilot and three areas (booking, queue, notifications) that change together. Microservices
would add deployment, networking and consistency work with no benefit at this scale.

## Decision

One ASP.NET Core application with modules that communicate only through public contracts and domain events, with
boundaries enforced by architecture tests.

## Consequences

Simple deployment and transactions within one database. Modules can be split out later if scale demands it; the
architecture tests keep that option open.
`;

const ADR2 = `# 0002. Use optimistic concurrency for slots

Status: Accepted

## Context

Slots open at 6 a.m. and up to 40 patients book in the same minute; two patients must never get the last place.

## Decision

Each slot row has a row version; booking reads and writes with it, retrying up to three times, then returns 409.

## Consequences

No locks held across requests. Under extreme contention some patients see "slot just taken" and choose again; we
monitor the 409 rate.
`;

const ADR3 = `# 0003. Send SMS through an outbox and a worker

Status: Accepted

## Context

SMS sending is slow and the gateway sometimes fails; a booking must not fail because an SMS could not be sent, and no
confirmation may be lost.

## Decision

Bookings write an outbox row in the same transaction; a background worker sends SMS with retries and an idempotency key
per message.

## Consequences

Bookings stay fast and reliable. SMS can arrive a few seconds late, and the worker needs monitoring of its backlog.
`;

const RUNBOOK_STARTER = `# Runbook — TODO: product name

## Alert: TODO

Meaning: TODO
Check: TODO
Mitigate: TODO
Escalate: TODO
`;

const RUNBOOK = `# Runbook — Kliniq

## Alert: BookingErrorBudgetFastBurn

Meaning: more than 7% of booking requests have failed over the last hour (14.4× the 0.5% budget); patients cannot book.
Check: the "Kliniq — golden signals" dashboard (which endpoint, since when); the latest Deploy workflow run; /health/ready.
Mitigate: roll back to the previous image tag if a deployment just finished; turn off the "sms-otp" flag if OTP is failing; scale the API if saturated.
Escalate: not mitigated within 30 minutes → call the project mentor and post in #kliniq-incidents.

## Alert: SmsOutboxBacklog

Meaning: more than 200 SMS messages have waited longer than 5 minutes; patients are not getting confirmations or turn alerts.
Check: worker replica status and logs; SMS gateway status page; failed sends by error code in Application Insights.
Mitigate: restart the worker revision; if the gateway is down, switch to the secondary gateway key in Key Vault.
Escalate: gateway down for more than 1 hour → tell clinic receptionists to call patients from the printed queue.
`;

const DEMO_STARTER = `# Demo Day script — TODO

## Story

TODO

## Segments

- TODO (0 min)

## Fallback

TODO
`;

const DEMO = `# Demo Day script — Kliniq

## Story

Ama, a mother in Madina, used to queue from 5 a.m. at the clinic. With Kliniq she books from her phone, arrives when the
SMS says she is three places away, and is seen within 30 minutes.

## Segments

- The problem: a photo of the 6 a.m. queue and the pilot clinic's numbers (1 min)
- Live demo: Ama books by phone, reception checks her in, the SMS arrives (3 min)
- Architecture: the container diagram and the outbox path for SMS (2 min)
- Hard decisions: optimistic concurrency at 6 a.m. and the modular monolith (2 min)
- Evidence: tests, load test, SLO dashboard, threat model (1 min)
- What next: multi-clinic staffing and USSD booking (1 min)

## Fallback

A recorded run of the same journey on the deployed system, plus screenshots of the dashboard, in case the venue's network
or the SMS gateway fails during the live demo.
`;

const EVIDENCE_STARTER = `# Evidence — TODO

## Tests

TODO

## Load test

TODO

## SLO

TODO

## Security

TODO

## Pull requests

TODO
`;

const EVIDENCE = `# Evidence — Kliniq

## Tests

312 tests in CI on every pull request: 214 domain unit tests, 81 API integration tests against PostgreSQL in a container,
and 17 end-to-end tests of the booking and check-in journeys. All green on main (commit 7c41e2a).

## Load test

Azure Load Testing, 10 minutes at 8 bookings per second (about twice the expected 6 a.m. burst) and 5 queue reads per
second: p95 186 ms, p99 412 ms, error rate 0.2% (all 409 "slot just taken", which is correct behaviour), CPU 38%.

## SLO

Booking availability SLO 99.5% during opening hours. Pilot weeks 1–3: 99.91% measured, 82% of the error budget left.

## Security

STRIDE threat model in DESIGN.md; per-clinic authorisation tests for every staff endpoint; dependency and container scans
in CI with no high findings; secrets only in Key Vault.

## Pull requests

64 merged pull requests, median 140 changed lines, each with CI green: https://github.com/example/kliniq/pulls?q=is%3Amerged
`;

const README_STARTER = `# TODO: product name

TODO
`;

const README = `# Kliniq

Clinic appointment queues by phone and SMS. Design: [capstone/DESIGN.md](capstone/DESIGN.md) · Decisions:
[docs/adr](docs/adr) · Operations: [capstone/RUNBOOK.md](capstone/RUNBOOK.md)

## Quick start

\`\`\`bash
cp .env.example .env              # local settings; no real secrets
docker compose up --build         # API on http://localhost:8080, web on http://localhost:8081
\`\`\`

## Tests

\`\`\`bash
dotnet test                       # unit and integration tests (needs Docker for PostgreSQL)
npm --prefix web test             # React tests
\`\`\`

## Deployment

Every merge to main is deployed by GitHub Actions: CI, image build, Terraform apply to dev, smoke test, approval,
production. See .github/workflows.
`;

const CI_STARTER = `name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo TODO
`;

const CI = `name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: 10.0.x
      - run: dotnet restore
      - run: dotnet build --no-restore -c Release
      - run: dotnet test --no-build -c Release
`;

const DEPLOY_STARTER = `name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo TODO
`;

const DEPLOY = `name: Deploy

on:
  push:
    branches: [main]

permissions:
  id-token: write
  contents: read

concurrency:
  group: deploy
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with:
          client-id: \${{ vars.AZURE_CLIENT_ID }}
          tenant-id: \${{ vars.AZURE_TENANT_ID }}
          subscription-id: \${{ vars.AZURE_SUBSCRIPTION_ID }}
      - run: az acr build --registry acrkliniq --image "kliniq-api:\${{ github.sha }}" .
      - run: az containerapp update --name kliniq-api --resource-group rg-kliniq-prod --image "acrkliniq.azurecr.io/kliniq-api:\${{ github.sha }}"
      - name: Smoke test
        run: |
          FQDN=$(az containerapp show --name kliniq-api --resource-group rg-kliniq-prod --query properties.configuration.ingress.fqdn -o tsv)
          curl --fail --retry 10 --retry-delay 6 --retry-all-errors "https://$FQDN/health/ready"
`;

const TESTS = `import { describe, it, expect } from 'vitest';
import { readFile, fileExists, listFiles, parseYaml } from 'dw:project';

const NL = String.fromCharCode(10);
const read = (p: string) => (fileExists(p) ? readFile(p) : '');
function sectionsOf(path: string): Map<string, string> {
  const map = new Map<string, string>();
  let current = '';
  for (const line of read(path).split(NL)) {
    if (line.startsWith('## ')) { current = line.slice(3).trim().toLowerCase(); map.set(current, ''); continue; }
    if (current) map.set(current, (map.get(current) ?? '') + NL + line);
  }
  return map;
}
const words = (s: string) => s.split(NL).join(' ').split(' ').map((w) => w.trim()).filter((w) => w.length > 0 && w !== 'TODO');
const bullets = (s: string) => s.split(NL).map((l) => l.trim()).filter((l) => l.startsWith('- ') && !l.includes('TODO'));
const numbersIn = (s: string) => words(s).filter((w) => '0123456789'.includes(w[0])).length;
const missing = (map: Map<string, string>, names: string[]) => names.filter((n) => !map.has(n.toLowerCase()));
const thin = (map: Map<string, string>, names: string[], min: number) => names.filter((n) => words(map.get(n.toLowerCase()) ?? '').length < min);
const has = (s: string, t: string) => s.toLowerCase().includes(t.toLowerCase());

describe('proposal', () => {
  const p = sectionsOf('capstone/PROPOSAL.md');
  const names = ['Problem', 'Users', 'Features', 'Non-goals', 'Success measures'];
  it('has every section, filled in', () => {
    expect(missing(p, names), 'capstone/PROPOSAL.md: add these ## sections').toEqual([]);
    expect(thin(p, ['Problem', 'Users', 'Success measures'], 15), 'write at least a few sentences in').toEqual([]);
  });
  it('lists features and non-goals, and measurable success', () => {
    expect(bullets(p.get('features') ?? '').length, 'at least three - feature bullets').toBeGreaterThanOrEqual(3);
    expect(bullets(p.get('non-goals') ?? '').length, 'at least one - non-goal bullet').toBeGreaterThanOrEqual(1);
    expect(numbersIn(p.get('success measures') ?? ''), 'Success measures: include numbers').toBeGreaterThan(0);
  });
});

describe('design document', () => {
  const d = sectionsOf('capstone/DESIGN.md');
  const names = ['Requirements', 'Estimates', 'Architecture', 'Data model', 'API', 'Security', 'Risks'];
  it('has every section, each substantial', () => {
    expect(missing(d, names), 'capstone/DESIGN.md: add these ## sections').toEqual([]);
    expect(thin(d, names, 30), 'sections with fewer than 30 words').toEqual([]);
  });
  it('puts numbers on load and data', () => {
    expect(numbersIn(d.get('estimates') ?? ''), 'Estimates: show the arithmetic').toBeGreaterThanOrEqual(6);
  });
  it('threat-models with STRIDE and enforces authorisation', () => {
    const s = d.get('security') ?? '';
    const categories = ['spoofing', 'tampering', 'repudiation', 'information disclosure', 'denial of service', 'elevation of privilege'];
    expect(categories.filter((c) => has(s, c)).length, 'Security: walk at least four STRIDE categories by name').toBeGreaterThanOrEqual(4);
    expect(has(s, 'authoris') || has(s, 'authoriz'), 'Security: how authorisation is enforced').toBe(true);
  });
});

describe('architecture decision records', () => {
  const adrs = listFiles().filter((f) => f.startsWith('docs/adr/') && f.endsWith('.md') && '0123456789'.includes(f.slice(9, 10)) && f.slice(13, 14) === '-');
  it('there are at least three, numbered', () => {
    expect(adrs.length, 'add docs/adr/0001-title.md, 0002-…, 0003-…').toBeGreaterThanOrEqual(3);
  });
  it('each has a status, context, decision and consequences', () => {
    const problems: string[] = [];
    for (const path of adrs) {
      const text = read(path);
      const s = sectionsOf(path);
      const status = text.split(NL).find((l) => l.startsWith('Status:')) ?? '';
      if (!['Proposed', 'Accepted', 'Superseded', 'Deprecated'].some((v) => status.includes(v))) problems.push(path + ': Status');
      for (const name of ['Context', 'Decision', 'Consequences']) if (words(s.get(name.toLowerCase()) ?? '').length < 10) problems.push(path + ': ' + name);
    }
    expect(problems, 'complete these ADRs').toEqual([]);
  });
});

describe('runbook', () => {
  it('has an entry per alert with meaning, checks, mitigation and escalation', () => {
    const text = read('capstone/RUNBOOK.md');
    const entries = text.split(NL + '## Alert:').slice(1);
    expect(entries.length, 'at least two ## Alert: entries').toBeGreaterThanOrEqual(2);
    const incomplete = entries.filter((e) => ['Meaning:', 'Check:', 'Mitigate:', 'Escalate:'].some((label) => {
      const line = e.split(NL).find((l) => l.startsWith(label));
      return !line || words(line).length < 5;
    }));
    expect(incomplete.length, 'every entry needs Meaning:, Check:, Mitigate: and Escalate: lines with real content').toBe(0);
  });
});

describe('demo script', () => {
  const d = sectionsOf('capstone/DEMO.md');
  it('fits the slot, with timed segments', () => {
    const segments = bullets(d.get('segments') ?? '');
    const minutes = segments.map((b) => { const open = b.lastIndexOf('('); return open < 0 ? NaN : Number(b.slice(open + 1).split(' ')[0]); });
    expect(segments.length, 'at least four segments').toBeGreaterThanOrEqual(4);
    expect(minutes.every((m) => m > 0), 'end every segment with (N min)').toBe(true);
    const total = minutes.reduce((a, b) => a + b, 0);
    expect(total >= 5 && total <= 10, 'segments total 5–10 minutes (now ' + total + ')').toBe(true);
  });
  it('has a story and a fallback plan', () => {
    expect(words(d.get('story') ?? '').length, 'Story: who is the user and what changes for them?').toBeGreaterThanOrEqual(15);
    expect(words(d.get('fallback') ?? '').length, 'Fallback: what if the network fails on stage?').toBeGreaterThanOrEqual(10);
  });
});

describe('evidence', () => {
  const e = sectionsOf('capstone/EVIDENCE.md');
  it('backs every claim with numbers', () => {
    const load = e.get('load test') ?? '';
    expect(has(load, 'p95') && has(load, 'p99') && has(load, 'ms') && has(load, '%'), 'Load test: p95 and p99 in ms, and an error rate in %').toBe(true);
    expect(numbersIn(e.get('tests') ?? ''), 'Tests: how many, of which kinds').toBeGreaterThan(0);
    expect(has(e.get('slo') ?? '', '%'), 'SLO: the target and what you measured, in %').toBe(true);
    expect(words(e.get('security') ?? '').length, 'Security: what you did and how you know').toBeGreaterThanOrEqual(10);
    const prs = e.get('pull requests') ?? '';
    expect(has(prs, 'http') || numbersIn(prs) > 0, 'Pull requests: a link or a count').toBe(true);
  });
});

describe('pipelines', () => {
  it('CI runs the tests on every pull request with a read-only token', () => {
    const ci = parseYaml(read('.github/workflows/ci.yml'));
    const doc = ci.ok ? ci.value : {};
    expect(doc?.on && typeof doc.on === 'object' && 'pull_request' in doc.on, 'ci.yml: on: pull_request').toBe(true);
    expect(doc?.permissions, 'ci.yml: permissions: contents: read').toEqual({ contents: 'read' });
    expect(read('.github/workflows/ci.yml').includes('dotnet test'), 'ci.yml: dotnet test').toBe(true);
  });
  it('deployment uses OIDC, a protected environment and a smoke test', () => {
    const text = read('.github/workflows/deploy.yml');
    const parsed = parseYaml(text);
    const doc = parsed.ok ? parsed.value : {};
    expect(doc?.permissions?.['id-token'], 'deploy.yml: permissions: id-token: write').toBe('write');
    const jobs = Object.values(doc?.jobs ?? {}) as { environment?: unknown }[];
    expect(jobs.some((j) => j.environment === 'production' || (j.environment as { name?: string } | undefined)?.name === 'production'), 'deploy.yml: environment: production').toBe(true);
    expect(text.includes('curl --fail') && text.includes('/health/ready'), 'deploy.yml: curl --fail … /health/ready').toBe(true);
    expect(text.includes('client-secret') || text.includes('creds:'), 'deploy.yml: no stored Azure credentials').toBe(false);
  });
});

describe('README', () => {
  it('gets a newcomer running and points to the docs', () => {
    const r = read('README.md');
    expect(r.includes('docker compose up'), 'README: docker compose up').toBe(true);
    expect(r.includes('dotnet test'), 'README: how to run the tests').toBe(true);
    expect(r.includes('DESIGN.md') && r.includes('RUNBOOK.md'), 'README: link the design document and the runbook').toBe(true);
  });
});
`;

const given = [
  pf('CAPSTONE-BRIEF.md', BRIEF, { editable: false }),
  pf('inspect.ts', INSPECT, { editable: false }),
];

const task: ProjectTask = {
  id: 'se-cs-m6-004',
  title: 'Week 24: Capstone',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 6 · System Design & Capstone',
  tags: ['capstone', 'design document', 'ADRs', 'runbook', 'Demo Day'],
  prompt:
    'Assemble the submission kit for your capstone — the production-style product you build, deploy and defend on your own: a proposal ' +
    'with non-goals and measurable success, a design document with a STRIDE threat model, at least three ADRs, a runbook entry per ' +
    'alert, a timed Demo Day script with a fallback, an evidence file that backs every claim with numbers, CI and OIDC deployment ' +
    'workflows, and a README that gets a newcomer running. The checks make sure nothing is missing; mentors judge the product itself.',
  hints: [
    'Start with PROPOSAL.md and cut the feature list until it is small enough to finish well.',
    'Write an ADR whenever you choose between two reasonable options; three is the minimum, eight is typical.',
    'Walk STRIDE over each data flow in your design, naming the category and the mitigation in the Security section.',
    'Every alert you configure gets a runbook entry; if you cannot say what to check first, add the missing signal.',
    'Rehearse DEMO.md with a timer — most first drafts run twice as long as planned.',
  ],
  files: [
    ...given,
    pf('capstone/PROPOSAL.md', PROPOSAL_STARTER),
    pf('capstone/DESIGN.md', DESIGN_STARTER),
    pf('docs/adr/0001-architecture-style.md', ADR_STARTER),
    pf('docs/adr/0002-concurrency.md', ADR_STARTER.replace('0001', '0002')),
    pf('docs/adr/0003-notifications.md', ADR_STARTER.replace('0001', '0003')),
    pf('capstone/RUNBOOK.md', RUNBOOK_STARTER),
    pf('capstone/DEMO.md', DEMO_STARTER),
    pf('capstone/EVIDENCE.md', EVIDENCE_STARTER),
    pf('README.md', README_STARTER),
    pf('.github/workflows/ci.yml', CI_STARTER),
    pf('.github/workflows/deploy.yml', DEPLOY_STARTER),
  ],
  solutionFiles: [
    ...given,
    pf('capstone/PROPOSAL.md', PROPOSAL),
    pf('capstone/DESIGN.md', DESIGN),
    pf('docs/adr/0001-architecture-style.md', ADR1),
    pf('docs/adr/0002-concurrency.md', ADR2),
    pf('docs/adr/0003-notifications.md', ADR3),
    pf('capstone/RUNBOOK.md', RUNBOOK),
    pf('capstone/DEMO.md', DEMO),
    pf('capstone/EVIDENCE.md', EVIDENCE),
    pf('README.md', README),
    pf('.github/workflows/ci.yml', CI),
    pf('.github/workflows/deploy.yml', DEPLOY),
  ],
  targets: [{ id: 'kit', label: 'Capstone kit', kind: 'typescript', entry: 'inspect.ts', testCode: TESTS }],
};

export default task;
