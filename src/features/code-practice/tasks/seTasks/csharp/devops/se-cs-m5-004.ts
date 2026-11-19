import { pf, type ProjectTask } from '../../../projectTypes';
import { PROJECT_GRADER_HELPERS } from '../../../devopsTasks/graderHelpers';

const README = `# Week 20 Assignment: No Manual Deployment

From now on nobody types \`az\`, \`terraform apply\` or \`docker build\` against a shared environment. A pull request runs
the checks; a merge to \`main\` builds **one** image, deploys it to dev, proves it works, waits for an approval, then
promotes the **same** image to production and proves that too. And when production hurts users, the right person is
paged — only then.

Given (read-only): the API's \`Dockerfile\` and last week's Terraform roots \`envs/dev\` and \`envs/prod\` (each takes
\`-var image_tag=…\` and outputs \`app_url\`). Registries: \`acrbookingsdev\` and \`acrbookingsprod\`.

## 1. \`.github/workflows/ci.yml\` — the required check

- \`on\`: \`pull_request\` and \`push\` to \`main\`; \`permissions: contents: read\`; a \`concurrency\` group from
  \`github.workflow\` and \`github.ref\` with \`cancel-in-progress: true\`; every job has \`timeout-minutes\` (≤ 15).
- Job **dotnet**: \`actions/setup-dotnet\` (10.0.x), then \`dotnet restore\`, \`dotnet format --verify-no-changes\`,
  \`dotnet build --no-restore -c Release\`, \`dotnet test --no-build -c Release\`, in that order.
- Job **terraform**: \`hashicorp/setup-terraform\`, \`terraform fmt -check -recursive\`, and for **each** of \`envs/dev\` and
  \`envs/prod\`: \`terraform -chdir=… init -backend=false\` then \`terraform -chdir=… validate\` (no Azure access needed).
- Every action pinned to a version.

## 2. \`.github/workflows/deploy.yml\` — build once, promote

- \`on\`: \`push\` to \`main\` and \`workflow_dispatch\` — never pull requests. \`permissions\`: \`id-token: write\`,
  \`contents: read\`. \`concurrency\`: a fixed group with \`cancel-in-progress: false\`.
- Workflow \`env\`: \`ARM_USE_OIDC: "true"\` (Terraform's azurerm provider and backend sign in with the job's OIDC token).
- Job **deploy-dev** (\`environment: dev\`): \`azure/login\` with \`client-id\`, \`tenant-id\`, \`subscription-id\` from \`vars\`
  (no \`creds\`, no secrets); \`hashicorp/setup-terraform\`; **the only image build in the workflow**:
  \`az acr build --registry acrbookingsdev --image bookings-api:<github.sha> .\`; then
  \`terraform -chdir=envs/dev init\` and \`terraform -chdir=envs/dev apply -auto-approve -input=false -var "image_tag=<github.sha>"\`;
  then a smoke test: \`URL=$(terraform -chdir=envs/dev output -raw app_url)\` and \`curl --fail --retry …  "$URL/health/ready"\`.
- Job **deploy-prod** (\`needs: deploy-dev\`, \`environment: production\` — where reviewers approve): the same sign-in;
  **no build** — promote the tested image with
  \`az acr import --name acrbookingsprod --source acrbookingsdev.azurecr.io/bookings-api:<github.sha> --image bookings-api:<github.sha>\`;
  then init and apply \`envs/prod\` with the same \`image_tag\`, and the same smoke test against prod's \`app_url\`.
- Each job has \`timeout-minutes\`; Terraform's ARM ids come from the same \`vars\` (\`ARM_CLIENT_ID\`, \`ARM_TENANT_ID\`,
  \`ARM_SUBSCRIPTION_ID\` in the job's \`env\`). Every action pinned.

## 3. \`observability/alerts.yaml\` — page on what users feel

The SLO is 99.9% non-5xx over 30 days. Recording rules \`bookings:error_ratio:rate5m\`, \`rate30m\`, \`rate1h\`, \`rate6h\`
from \`http_server_request_duration_seconds_count{job="bookings-api"}\` (5xx: \`http_response_status_code=~"5.."\`);
\`BookingsErrorBudgetFastBurn\` (1h and 5m above \`14.4 * 0.001\`) and \`BookingsErrorBudgetSlowBurn\` (6h and 30m above
\`6 * 0.001\`), both \`severity: page\`, each with \`for\`, \`summary\` and \`runbook_url\`. No pages on CPU, memory or "any error".

## 4. \`.github/dependabot.yml\` — keep the pipeline's own dependencies patched

\`version: 2\`, with weekly updates for \`github-actions\` and \`nuget\` (directory \`/\`).
`;

const ENV_ROOT = (env: string) => `# Given: Week 19's ${env} root (backend bookings/${env}.tfstate, module ../../modules/bookings).
terraform {
  required_version = ">= 1.9"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "sttfstatebookings"
    container_name       = "tfstate"
    key                  = "bookings/${env}.tfstate"
    use_azuread_auth     = true
  }
}

provider "azurerm" {
  features {}
}

variable "image_tag" {
  type        = string
  description = "Commit SHA to deploy; passed by the pipeline."
}

module "bookings" {
  source       = "../../modules/bookings"
  environment  = "${env}"
  image_tag    = var.image_tag
  min_replicas = ${env === 'prod' ? 2 : 0}
  max_replicas = ${env === 'prod' ? 10 : 3}
}

output "app_url" {
  value = module.bookings.app_url
}
`;

const DOCKERFILE = `# Given: the API image from Week 17.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Bookings.sln ./
COPY src/Bookings.Api/Bookings.Api.csproj src/Bookings.Api/
COPY src/Bookings.Domain/Bookings.Domain.csproj src/Bookings.Domain/
RUN dotnet restore src/Bookings.Api/Bookings.Api.csproj
COPY src/ src/
RUN dotnet publish src/Bookings.Api/Bookings.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Bookings.Api.dll"]
`;

const INSPECT = `// Run: a summary of each workflow's jobs and steps, as the graders read them.
import { readFile, fileExists, parseYaml } from 'dw:project';

for (const path of ['.github/workflows/ci.yml', '.github/workflows/deploy.yml', 'observability/alerts.yaml', '.github/dependabot.yml']) {
  if (!fileExists(path)) { console.log(path + ': missing'); continue; }
  const r = parseYaml(readFile(path));
  if (!r.ok) { console.log(path + ': ' + r.error); continue; }
  const jobs = (r.value?.jobs ?? {}) as Record<string, { steps?: { name?: string; uses?: string; run?: string }[] }>;
  const names = Object.keys(jobs);
  console.log(path + ': ' + (names.length ? names.map((j) => j + ' (' + (jobs[j].steps ?? []).length + ' steps)').join(', ') : 'valid YAML'));
}
`;

const CI_STARTER = `# TODO: see README section 1.
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@main
      - run: dotnet test
`;

const CI_SOLUTION = `name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  dotnet:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: 10.0.x
      - run: dotnet restore
      - run: dotnet format --verify-no-changes --no-restore
      - run: dotnet build --no-restore -c Release
      - run: dotnet test --no-build -c Release --logger trx --results-directory TestResults
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: TestResults

  terraform:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform fmt -check -recursive
      # No backend and no Azure access: validate is a static check.
      - run: terraform -chdir=envs/dev init -backend=false
      - run: terraform -chdir=envs/dev validate
      - run: terraform -chdir=envs/prod init -backend=false
      - run: terraform -chdir=envs/prod validate
`;

const DEPLOY_STARTER = `# TODO: see README section 2.
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with:
          creds: \${{ secrets.AZURE_CREDENTIALS }}
      - run: az acr build --registry acrbookingsprod --image bookings-api:latest .
      - run: terraform -chdir=envs/prod apply -auto-approve -var image_tag=latest
`;

const DEPLOY_SOLUTION = `name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

concurrency:
  group: deploy
  cancel-in-progress: false

env:
  ARM_USE_OIDC: "true"
  IMAGE_TAG: \${{ github.sha }}

jobs:
  deploy-dev:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    environment: dev
    env:
      ARM_CLIENT_ID: \${{ vars.AZURE_CLIENT_ID }}
      ARM_TENANT_ID: \${{ vars.AZURE_TENANT_ID }}
      ARM_SUBSCRIPTION_ID: \${{ vars.AZURE_SUBSCRIPTION_ID }}
    steps:
      - uses: actions/checkout@v4

      - uses: azure/login@v2
        with:
          client-id: \${{ vars.AZURE_CLIENT_ID }}
          tenant-id: \${{ vars.AZURE_TENANT_ID }}
          subscription-id: \${{ vars.AZURE_SUBSCRIPTION_ID }}

      - uses: hashicorp/setup-terraform@v3

      # The only build: every later environment runs this exact image.
      - name: Build image
        run: az acr build --registry acrbookingsdev --image "bookings-api:\${{ github.sha }}" .

      - name: Deploy to dev
        run: |
          terraform -chdir=envs/dev init -input=false
          terraform -chdir=envs/dev apply -auto-approve -input=false -var "image_tag=\${{ github.sha }}"

      - name: Smoke test dev
        run: |
          URL=$(terraform -chdir=envs/dev output -raw app_url)
          curl --fail --silent --show-error --retry 10 --retry-delay 6 --retry-all-errors "$URL/health/ready"

  deploy-prod:
    needs: deploy-dev
    runs-on: ubuntu-latest
    timeout-minutes: 30
    environment: production
    env:
      ARM_CLIENT_ID: \${{ vars.AZURE_CLIENT_ID }}
      ARM_TENANT_ID: \${{ vars.AZURE_TENANT_ID }}
      ARM_SUBSCRIPTION_ID: \${{ vars.AZURE_SUBSCRIPTION_ID }}
    steps:
      - uses: actions/checkout@v4

      - uses: azure/login@v2
        with:
          client-id: \${{ vars.AZURE_CLIENT_ID }}
          tenant-id: \${{ vars.AZURE_TENANT_ID }}
          subscription-id: \${{ vars.AZURE_SUBSCRIPTION_ID }}

      - uses: hashicorp/setup-terraform@v3

      # Promote, do not rebuild: the bytes tested in dev are the bytes that run in prod.
      - name: Promote image
        run: az acr import --name acrbookingsprod --source "acrbookingsdev.azurecr.io/bookings-api:\${{ github.sha }}" --image "bookings-api:\${{ github.sha }}"

      - name: Deploy to production
        run: |
          terraform -chdir=envs/prod init -input=false
          terraform -chdir=envs/prod apply -auto-approve -input=false -var "image_tag=\${{ github.sha }}"

      - name: Smoke test production
        run: |
          URL=$(terraform -chdir=envs/prod output -raw app_url)
          curl --fail --silent --show-error --retry 10 --retry-delay 6 --retry-all-errors "$URL/health/ready"
`;

const ALERTS_STARTER = `# TODO: see README section 3.
groups:
  - name: bookings
    rules:
      - alert: HighCpu
        expr: avg(container_cpu_usage_ratio{app="bookings-api"}) > 0.8
        labels:
          severity: page
`;

const ratio = (w: string) => `      - record: bookings:error_ratio:rate${w}
        expr: |
          sum(rate(http_server_request_duration_seconds_count{job="bookings-api",http_response_status_code=~"5.."}[${w}]))
          /
          sum(rate(http_server_request_duration_seconds_count{job="bookings-api"}[${w}]))
`;

const ALERTS_SOLUTION = `# SLO: 99.9% of requests succeed (non-5xx) over 30 days. Error budget 0.1%.
groups:
  - name: bookings-slo-recording
    rules:
${['5m', '30m', '1h', '6h'].map(ratio).join('')}
  - name: bookings-slo-alerts
    rules:
      - alert: BookingsErrorBudgetFastBurn
        expr: bookings:error_ratio:rate1h > (14.4 * 0.001) and bookings:error_ratio:rate5m > (14.4 * 0.001)
        for: 2m
        labels:
          severity: page
        annotations:
          summary: Bookings API is spending its error budget 14x too fast.
          runbook_url: https://runbooks.example.com/bookings/error-budget
      - alert: BookingsErrorBudgetSlowBurn
        expr: bookings:error_ratio:rate6h > (6 * 0.001) and bookings:error_ratio:rate30m > (6 * 0.001)
        for: 15m
        labels:
          severity: page
        annotations:
          summary: Bookings API is spending its error budget 6x too fast.
          runbook_url: https://runbooks.example.com/bookings/error-budget
`;

const DEPENDABOT = `version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
  - package-ecosystem: nuget
    directory: /
    schedule:
      interval: weekly
`;

const TESTS = PROJECT_GRADER_HELPERS + `
const NL = String.fromCharCode(10);
const EXPR = '$' + '{{';
const list = (v: Data): Data[] => (Array.isArray(v) ? v : []);
const wf = (path: string) => {
  const y = yamlFile(path);
  const jobs: Record<string, Data> = y.value.jobs && typeof y.value.jobs === 'object' ? y.value.jobs : {};
  const on = y.value.on;
  const triggers: Record<string, Data> = typeof on === 'string' ? { [on]: {} } : Array.isArray(on) ? Object.fromEntries(on.map((t: string) => [t, {}])) : on && typeof on === 'object' ? on : {};
  return { ...y, jobs, triggers };
};
const job = (w: { jobs: Record<string, Data> }, name: string): Data => need(w.jobs[name], 'Add a job named ' + name);
const steps = (j: Data): Data[] => list(j?.steps);
const runText = (j: Data): string => steps(j).map((s) => String(s?.run ?? '')).join(NL);
const runLines = (j: Data): string[] => runText(j).split(NL).map((l) => l.trim()).filter(Boolean);
const lineIndex = (j: Data, needle: string) => runLines(j).findIndex((l) => l.includes(needle));
const usesOf = (j: Data, action: string): Data | undefined => steps(j).find((s) => String(s?.uses ?? '').split('@')[0] === action);
const unpinned = (w: { jobs: Record<string, Data> }) => Object.values(w.jobs).flatMap((j) => steps(j).map((s) => s?.uses).filter((u): u is string => typeof u === 'string'))
  .filter((u) => { const ref = u.split('@')[1] ?? ''; return ref === '' || ['main', 'master', 'latest', 'HEAD'].includes(ref); });
const fromVars = (v: unknown) => String(v ?? '').startsWith(EXPR) && String(v ?? '').includes('vars.');

// ======================================================================== ci.yml
const ci = wf('.github/workflows/ci.yml');

describe('ci.yml', () => {
  it('runs on pull requests and main, read-only, cancelling superseded runs', () => {
    expect(ci.error, 'ci.yml must parse').toBe('');
    expect('pull_request' in ci.triggers, 'on: pull_request').toBe(true);
    expect(list(ci.triggers.push?.branches), 'on: push: branches: [main]').toEqual(['main']);
    expect(ci.value.permissions, 'permissions: contents: read').toEqual({ contents: 'read' });
    expect(String(ci.value.concurrency?.group ?? '').includes('github.ref') && ci.value.concurrency?.['cancel-in-progress'] === true, 'concurrency on github.ref with cancel-in-progress: true').toBe(true);
  });
  it('bounds every job and pins every action', () => {
    for (const [name, j] of Object.entries(ci.jobs)) expect(Number(j?.['timeout-minutes'] ?? 360), name + ': timeout-minutes ≤ 15').toBeLessThanOrEqual(15);
    expect(unpinned(ci), 'pin every action').toEqual([]);
  });
  it('checks the .NET code in order', () => {
    const j = job(ci, 'dotnet');
    expect(String(usesOf(j, 'actions/setup-dotnet')?.with?.['dotnet-version'] ?? ''), 'setup-dotnet 10.0.x').toBe('10.0.x');
    const order = ['dotnet restore', 'dotnet format --verify-no-changes', 'dotnet build --no-restore -c Release', 'dotnet test --no-build -c Release'].map((c) => lineIndex(j, c));
    expect(order.every((v) => v >= 0), 'restore, format check, build --no-restore -c Release, test --no-build -c Release').toBe(true);
    expect(order.every((v, i) => i === 0 || v > order[i - 1]), 'in that order').toBe(true);
  });
  it('checks the Terraform for both environments without touching Azure', () => {
    const j = job(ci, 'terraform');
    expect(usesOf(j, 'hashicorp/setup-terraform'), 'hashicorp/setup-terraform').toBeDefined();
    expect(lineIndex(j, 'terraform fmt -check'), 'terraform fmt -check -recursive').toBeGreaterThanOrEqual(0);
    for (const env of ['envs/dev', 'envs/prod']) {
      const init = lineIndex(j, 'terraform -chdir=' + env + ' init -backend=false');
      const validate = lineIndex(j, 'terraform -chdir=' + env + ' validate');
      expect(init >= 0 && validate > init, env + ': init -backend=false, then validate').toBe(true);
    }
  });
});

// ======================================================================== deploy.yml
const dep = wf('.github/workflows/deploy.yml');
const dev = () => job(dep, 'deploy-dev');
const prod = () => job(dep, 'deploy-prod');
const envName = (j: Data) => (typeof j?.environment === 'string' ? j.environment : j?.environment?.name);

describe('deploy.yml', () => {
  it('runs for main only, queued, with OIDC permissions', () => {
    expect(dep.error, 'deploy.yml must parse').toBe('');
    expect(list(dep.triggers.push?.branches), 'on: push: branches: [main]').toEqual(['main']);
    expect('workflow_dispatch' in dep.triggers, 'on: workflow_dispatch').toBe(true);
    expect('pull_request' in dep.triggers || 'pull_request_target' in dep.triggers, 'never from pull requests').toBe(false);
    expect(dep.value.permissions, 'permissions: id-token: write, contents: read').toEqual({ 'id-token': 'write', contents: 'read' });
    expect(dep.value.concurrency?.['cancel-in-progress'], 'concurrency with cancel-in-progress: false').toBe(false);
    expect(String(dep.value.env?.ARM_USE_OIDC ?? ''), 'env: ARM_USE_OIDC: "true"').toBe('true');
  });
  it('deploys dev first, then production behind its environment', () => {
    expect(envName(dev()), 'deploy-dev: environment: dev').toBe('dev');
    expect(envName(prod()), 'deploy-prod: environment: production').toBe('production');
    expect(list(prod().needs).concat(typeof prod().needs === 'string' ? [prod().needs] : []), 'deploy-prod needs deploy-dev').toContain('deploy-dev');
    for (const j of [dev(), prod()]) expect(Number(j['timeout-minutes'] ?? 360), 'timeout-minutes').toBeLessThanOrEqual(60);
  });
  it('signs in with OIDC in both jobs, for the CLI and for Terraform', () => {
    for (const [name, j] of [['deploy-dev', dev()], ['deploy-prod', prod()]] as const) {
      const w = need(usesOf(j, 'azure/login'), name + ': azure/login').with ?? {};
      expect(['creds', 'client-secret'].filter((k) => k in w), name + ': no stored credentials').toEqual([]);
      expect(['client-id', 'tenant-id', 'subscription-id'].every((k) => fromVars(w[k])), name + ': ids from vars').toBe(true);
      expect(['ARM_CLIENT_ID', 'ARM_TENANT_ID', 'ARM_SUBSCRIPTION_ID'].every((k) => fromVars(j.env?.[k])), name + ': ARM_* ids from vars for Terraform').toBe(true);
      expect(usesOf(j, 'hashicorp/setup-terraform'), name + ': hashicorp/setup-terraform').toBeDefined();
    }
    expect(unpinned(dep), 'pin every action').toEqual([]);
  });
  it('builds exactly once, in dev, tagged with the commit', () => {
    const builds = Object.entries(dep.jobs).flatMap(([n, j]) => runLines(j).filter((l) => l.includes('az acr build') || l.includes('docker build')).map((l) => n + ': ' + l));
    expect(builds.length, 'one image build in the whole workflow').toBe(1);
    const b = runLines(dev()).find((l) => l.includes('az acr build')) ?? '';
    expect(b.includes('--registry acrbookingsdev') && b.includes('github.sha'), 'az acr build --registry acrbookingsdev --image bookings-api:<github.sha>').toBe(true);
    expect(read('.github/workflows/deploy.yml').includes(':latest'), 'never latest').toBe(false);
  });
  it('promotes the tested image to production instead of rebuilding', () => {
    const imp = runLines(prod()).find((l) => l.includes('az acr import')) ?? '';
    expect(imp.includes('--name acrbookingsprod'), 'az acr import --name acrbookingsprod').toBe(true);
    expect(imp.includes('acrbookingsdev.azurecr.io/bookings-api:') && imp.split('github.sha').length - 1 === 2, '--source the dev image and --image, both tagged with github.sha').toBe(true);
    expect(lineIndex(prod(), 'az acr import') < lineIndex(prod(), 'apply'), 'import before applying prod').toBe(true);
  });
  it('applies each environment root with the commit tag, unattended', () => {
    for (const [env, j] of [['dev', dev()], ['prod', prod()]] as const) {
      const init = lineIndex(j, 'terraform -chdir=envs/' + env + ' init');
      const apply = runLines(j).find((l) => l.startsWith('terraform -chdir=envs/' + env + ' apply')) ?? '';
      expect(init, env + ': terraform -chdir=envs/' + env + ' init').toBeGreaterThanOrEqual(0);
      expect(apply.includes('-auto-approve') && apply.includes('-input=false'), env + ': apply -auto-approve -input=false').toBe(true);
      expect(apply.includes('image_tag=') && apply.includes('github.sha'), env + ': -var "image_tag=<github.sha>"').toBe(true);
    }
  });
  it('fails each deployment unless the environment reports ready', () => {
    for (const [env, j] of [['dev', dev()], ['prod', prod()]] as const) {
      const url = lineIndex(j, 'terraform -chdir=envs/' + env + ' output -raw app_url');
      const curl = runLines(j).findIndex((l) => l.startsWith('curl'));
      const apply = lineIndex(j, 'terraform -chdir=envs/' + env + ' apply');
      expect(url > apply && curl > url, env + ': read app_url, then curl, after the apply').toBe(true);
      const c = runLines(j)[curl] ?? '';
      expect(c.includes('--fail') && c.includes('--retry') && c.includes('/health/ready'), env + ': curl --fail --retry … /health/ready').toBe(true);
    }
  });
});

// ======================================================================== alerts.yaml
const alertsFile = yamlFile('observability/alerts.yaml');
const rules: Data[] = list(alertsFile.value.groups).flatMap((g) => list(g?.rules));
const squash = (s: unknown) => String(s ?? '').split(' ').join('').split(NL).join('');
const alertRules = () => rules.filter((r) => typeof r?.alert === 'string');

describe('observability/alerts.yaml', () => {
  it('records the 5xx ratio over four windows', () => {
    expect(alertsFile.error).toBe('');
    for (const w of ['5m', '30m', '1h', '6h']) {
      const r = need(rules.find((x) => x?.record === 'bookings:error_ratio:rate' + w), 'Add bookings:error_ratio:rate' + w);
      const e = squash(r.expr);
      expect(e.split('[' + w + ']').length - 1 === 2 && e.includes('http_response_status_code=~"5.."') && e.includes('/'), w + ': 5xx rate / all requests over [' + w + ']').toBe(true);
    }
  });
  it('pages on fast and slow error-budget burns', () => {
    const fast = squash(need(rules.find((r) => r?.alert === 'BookingsErrorBudgetFastBurn'), 'Add BookingsErrorBudgetFastBurn').expr);
    expect(fast.includes('rate1h>(14.4*0.001)') && fast.includes('rate5m>(14.4*0.001)'), 'fast: 1h and 5m above 14.4 * 0.001').toBe(true);
    const slow = squash(need(rules.find((r) => r?.alert === 'BookingsErrorBudgetSlowBurn'), 'Add BookingsErrorBudgetSlowBurn').expr);
    expect(slow.includes('rate6h>(6*0.001)') && slow.includes('rate30m>(6*0.001)'), 'slow: 6h and 30m above 6 * 0.001').toBe(true);
    for (const a of alertRules()) {
      expect(a.labels?.severity === 'page' && !!a.for && !!a.annotations?.summary && String(a.annotations?.runbook_url ?? '').startsWith('https://'), a.alert + ': severity page, for, summary, runbook_url').toBe(true);
    }
  });
  it('does not page on causes or single errors', () => {
    expect(alertRules().filter((a) => { const e = squash(a.expr).toLowerCase(); return e.includes('cpu') || e.includes('memory') || e.endsWith('>0'); }).map((a) => a.alert)).toEqual([]);
  });
});

// ======================================================================== dependabot
describe('.github/dependabot.yml', () => {
  it('keeps actions and NuGet packages patched', () => {
    const d = yamlFile('.github/dependabot.yml');
    expect(d.error, 'dependabot.yml must parse').toBe('');
    expect(d.value.version, 'version: 2').toBe(2);
    const ecosystems = list(d.value.updates).filter((u) => u?.schedule?.interval).map((u) => u['package-ecosystem']).sort();
    expect(ecosystems, 'weekly updates for github-actions and nuget').toEqual(['github-actions', 'nuget']);
  });
});
`;

const given = [
  pf('README.md', README, { editable: false }),
  pf('Dockerfile', DOCKERFILE, { editable: false }),
  pf('envs/dev/main.tf', ENV_ROOT('dev'), { editable: false }),
  pf('envs/prod/main.tf', ENV_ROOT('prod'), { editable: false }),
  pf('inspect.ts', INSPECT, { editable: false }),
];

const task: ProjectTask = {
  id: 'se-cs-m5-004',
  title: 'Week 20: No Manual Deployment',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 5 · Cloud, DevOps & Delivery',
  tags: ['GitHub Actions', 'OIDC', 'continuous delivery', 'SLO alerts'],
  prompt:
    'Replace every manual step: a required CI check for the .NET code and both Terraform roots; a deploy workflow that signs in with ' +
    'OIDC, builds one commit-tagged image, applies dev, smoke-tests it, waits for production approval, promotes the identical image ' +
    'with az acr import and applies and smoke-tests production; SLO burn-rate alerts that page only when users are hurt; and Dependabot ' +
    'keeping the pipeline\'s own dependencies patched.',
  hints: [
    'Tasks ops-5-13 (CI), ops-5-14 (OIDC deploy) and ops-5-16 (burn-rate alerts) each cover one part.',
    'terraform validate needs providers but not state: terraform -chdir=envs/dev init -backend=false, then validate.',
    'Terraform\'s azurerm provider signs in with the job\'s OIDC token when ARM_USE_OIDC is "true" and ARM_CLIENT_ID, ARM_TENANT_ID and ARM_SUBSCRIPTION_ID are set.',
    'az acr import copies an image between registries without rebuilding it — the digest in prod is the digest you tested in dev.',
  ],
  files: [
    ...given,
    pf('.github/workflows/ci.yml', CI_STARTER),
    pf('.github/workflows/deploy.yml', DEPLOY_STARTER),
    pf('observability/alerts.yaml', ALERTS_STARTER),
    pf('.github/dependabot.yml', '# TODO: see README section 4.\n'),
  ],
  solutionFiles: [
    ...given,
    pf('.github/workflows/ci.yml', CI_SOLUTION),
    pf('.github/workflows/deploy.yml', DEPLOY_SOLUTION),
    pf('observability/alerts.yaml', ALERTS_SOLUTION),
    pf('.github/dependabot.yml', DEPENDABOT),
  ],
  targets: [{ id: 'config', label: 'Pipelines & alerts', kind: 'typescript', entry: 'inspect.ts', testCode: TESTS }],
};

export default task;
