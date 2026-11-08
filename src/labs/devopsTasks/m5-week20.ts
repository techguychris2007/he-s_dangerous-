import type { CodeTask } from '../codeTypes';

const CATEGORY = 'Month 5 · Cloud & DevOps';

/** Grader preamble for YAML tasks (GitHub Actions, OpenTelemetry Collector, alert rules). Graders never
 *  contain a dollar-brace sequence; they build it as '$' + '{' where needed. */
const YAML_HELPERS = (file: string) => `import { describe, it, expect } from 'vitest';
import { readFile, parseYaml } from 'dw:project';

const source = readFile('${file}');
const parsed = parseYaml(source);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = any;
const doc: Data = parsed.ok && parsed.value && typeof parsed.value === 'object' ? parsed.value : {};
const NL = String.fromCharCode(10);
const EXPR = '$' + '{{';
function need<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) throw new Error(message);
  return value;
}
const list = (v: Data): Data[] => (Array.isArray(v) ? v : []);
`;

const WORKFLOW_HELPERS = `
const jobs: Record<string, Data> = doc.jobs && typeof doc.jobs === 'object' ? doc.jobs : {};
const job = (name: string): Data => need(jobs[name], 'Add a job named ' + name);
const steps = (j: Data): Data[] => list(j?.steps);
const usesOf = (j: Data, action: string): Data | undefined => steps(j).find((s) => String(s?.uses ?? '').split('@')[0] === action);
const runText = (j: Data): string => steps(j).map((s) => String(s?.run ?? '')).join(NL);
const stepIndex = (j: Data, test: (s: Data) => boolean): number => steps(j).findIndex(test);
const runs = (needle: string) => (s: Data) => String(s?.run ?? '').includes(needle);
const triggers = (): Record<string, Data> => {
  const on = doc.on ?? doc.true;
  if (typeof on === 'string') return { [on]: {} };
  if (Array.isArray(on)) return Object.fromEntries(on.map((t: string) => [t, {}]));
  return on && typeof on === 'object' ? on : {};
};
const allUses = (): string[] => Object.values(jobs).flatMap((j) => steps(j).map((s) => s?.uses).filter((u): u is string => typeof u === 'string'));
const pinned = (uses: string): boolean => {
  const ref = uses.split('@')[1] ?? '';
  return ref !== '' && !['main', 'master', 'latest', 'HEAD'].includes(ref);
};
`;

/** Month 5, week 20 (lessons dn5-7, dn5-8): CI/CD with GitHub Actions, then observability. */
export const DEVOPS_WEEK_20: CodeTask[] = [
  {
    id: 'ops-5-13',
    title: 'A Continuous Integration Workflow You Can Trust',
    difficulty: 'Medium',
    language: 'config',
    fileName: '.github/workflows/ci.yml',
    category: CATEGORY,
    prompt:
      'Make ci.yml the required check on every pull request. It must: (1) run on pull_request and on push to main only; (2) give ' +
      'GITHUB_TOKEN least privilege with a top-level permissions: contents: read; (3) cancel superseded runs with a concurrency group built ' +
      'from github.workflow and github.ref and cancel-in-progress: true; (4) give the build job a timeout-minutes of 15 or less; (5) pin every ' +
      'action to a version (actions/checkout@v4, never @main); (6) install .NET with actions/setup-dotnet, dotnet-version: 10.0.x; ' +
      '(7) run dotnet restore, then dotnet build --no-restore -c Release, then dotnet test --no-build -c Release (with --logger trx ' +
      '--results-directory TestResults), and check formatting with dotnet format --verify-no-changes; (8) upload TestResults with ' +
      'actions/upload-artifact even when tests fail (if: always()).',
    starterCode: `name: CI
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@main
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - run: dotnet build
      - run: dotnet test
`,
    hints: [
      'on: { pull_request: {}, push: { branches: [main] } } — a push to a feature branch is already covered by its pull request.',
      'concurrency: { group: "$' + '{{ github.workflow }}-$' + '{{ github.ref }}", cancel-in-progress: true } — a new push to the same PR cancels the old run.',
      'Restore once, then build and test with --no-restore and --no-build so each step reuses the last one\'s output.',
      '- uses: actions/upload-artifact@v4 with if: always(), name: test-results, path: TestResults',
    ],
    solution: `name: CI

on:
  pull_request:
  push:
    branches: [main]

# The workflow's token can read the repository and nothing else.
permissions:
  contents: read

# A new push to the same branch or PR cancels the run it replaces.
concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: 10.0.x

      - name: Restore
        run: dotnet restore

      - name: Check formatting
        run: dotnet format --verify-no-changes --no-restore

      - name: Build
        run: dotnet build --no-restore -c Release

      - name: Test
        run: dotnet test --no-build -c Release --logger trx --results-directory TestResults

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: TestResults
`,
    testCode: YAML_HELPERS('.github/workflows/ci.yml') + WORKFLOW_HELPERS + `
const build = () => job('build');

describe('when it runs', () => {
  it('runs on pull requests and on pushes to main', () => {
    expect(parsed.ok ? '' : parsed.error, 'ci.yml must parse').toBe('');
    const t = triggers();
    expect('pull_request' in t, 'on: pull_request').toBe(true);
    expect(list(t.push?.branches), 'on: push: branches: [main]').toEqual(['main']);
  });
  it('cancels superseded runs', () => {
    const c = doc.concurrency ?? {};
    expect(String(c.group ?? ''), 'group from github.workflow and github.ref').toContain('github.ref');
    expect(String(c.group ?? '')).toContain('github.workflow');
    expect(c['cancel-in-progress'], 'cancel-in-progress: true').toBe(true);
  });
  it('cannot hang for hours', () => {
    expect(Number(build()['timeout-minutes'] ?? 360), 'timeout-minutes: 15 (the default is 360)').toBeLessThanOrEqual(15);
  });
});

describe('security', () => {
  it('gives the token read-only access', () => {
    expect(doc.permissions, 'permissions: contents: read').toEqual({ contents: 'read' });
  });
  it('pins every action to a version', () => {
    expect(allUses().filter((u) => !pinned(u)), 'Use a version tag or commit SHA, never a branch').toEqual([]);
  });
});

describe('the build', () => {
  it('uses .NET 10', () => {
    const s = need(usesOf(build(), 'actions/setup-dotnet'), 'Add actions/setup-dotnet');
    expect(String(s.with?.['dotnet-version'] ?? ''), 'dotnet-version: 10.0.x').toBe('10.0.x');
  });
  it('restores once, then builds and tests in Release without repeating work', () => {
    const b = build();
    const restore = stepIndex(b, runs('dotnet restore'));
    const compile = stepIndex(b, runs('dotnet build'));
    const test = stepIndex(b, runs('dotnet test'));
    expect(restore >= 0 && compile > restore && test > compile, 'restore, then build, then test').toBe(true);
    const text = runText(b);
    expect(text.includes('dotnet build --no-restore -c Release'), 'dotnet build --no-restore -c Release').toBe(true);
    expect(text.includes('dotnet test --no-build -c Release'), 'dotnet test --no-build -c Release').toBe(true);
    expect(text.includes('--results-directory TestResults'), 'write test results to TestResults').toBe(true);
  });
  it('fails on unformatted code', () => {
    expect(runText(build()), 'dotnet format --verify-no-changes').toContain('dotnet format --verify-no-changes');
  });
  it('keeps test results even when tests fail', () => {
    const up = need(usesOf(build(), 'actions/upload-artifact'), 'Upload TestResults with actions/upload-artifact');
    expect(String(up.if ?? ''), 'if: always()').toContain('always()');
    expect(String(up.with?.path ?? ''), 'path: TestResults').toBe('TestResults');
  });
});
`,
  },
  {
    id: 'ops-5-14',
    title: 'Deploy with OpenID Connect and an Approval Gate',
    difficulty: 'Hard',
    language: 'config',
    fileName: '.github/workflows/deploy.yml',
    category: CATEGORY,
    prompt:
      'The starter deploys from every push to every branch, signs in with a long-lived service-principal secret (AZURE_CREDENTIALS), ships ' +
      ':latest and never checks the result. Rewrite it: (1) trigger on push to main (and workflow_dispatch for re-runs) — never on pull ' +
      'requests; (2) permissions: id-token: write (to request an OIDC token) and contents: read, nothing else; (3) concurrency group ' +
      'deploy-production with cancel-in-progress: false — a deployment must never be cancelled halfway; (4) a test job that runs ' +
      'dotnet test, and a deploy job that needs it, with environment: production (where required reviewers approve) and a timeout; ' +
      '(5) sign in with azure/login@v2 using client-id, tenant-id and subscription-id from repository variables or secrets — no creds and no ' +
      'client secret; (6) build and deploy the image tagged with github.sha, never latest; (7) after the update, smoke-test ' +
      'https://<fqdn>/health/ready with curl --fail and retries. All actions pinned.',
    starterCode: `name: Deploy
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with:
          creds: \${{ secrets.AZURE_CREDENTIALS }}
      - run: |
          az acr build --registry acrbookingsprod --image bookings-api:latest .
          az containerapp update --name bookings-api --resource-group rg-bookings-prod --image acrbookingsprod.azurecr.io/bookings-api:latest
`,
    hints: [
      'OIDC: Azure trusts tokens GitHub issues for this repository and environment (a federated credential on the deploy identity), so there is no secret to store or rotate. The job needs permissions: id-token: write.',
      'with: { client-id: "$' + '{{ vars.AZURE_CLIENT_ID }}", tenant-id: "$' + '{{ vars.AZURE_TENANT_ID }}", subscription-id: "$' + '{{ vars.AZURE_SUBSCRIPTION_ID }}" } — ids, not secrets.',
      'environment: production makes the job wait for the environment\'s protection rules (required reviewers, branch restrictions) and scopes its secrets.',
      'FQDN=$(az containerapp show -n "$APP" -g "$RG" --query properties.configuration.ingress.fqdn -o tsv) then curl --fail --retry 10 --retry-delay 6 --retry-all-errors "https://$FQDN/health/ready".',
    ],
    solution: `name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  id-token: write    # request an OIDC token for azure/login
  contents: read

# Queue deployments; never cancel one halfway through.
concurrency:
  group: deploy-production
  cancel-in-progress: false

env:
  ACR: acrbookingsprod
  RG: rg-bookings-prod
  APP: bookings-api

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: 10.0.x
      - run: dotnet test -c Release

  deploy:
    needs: test
    runs-on: ubuntu-latest
    timeout-minutes: 20
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Sign in to Azure (OIDC, no stored secret)
        uses: azure/login@v2
        with:
          client-id: \${{ vars.AZURE_CLIENT_ID }}
          tenant-id: \${{ vars.AZURE_TENANT_ID }}
          subscription-id: \${{ vars.AZURE_SUBSCRIPTION_ID }}

      - name: Build image
        run: az acr build --registry "$ACR" --image "$APP:\${{ github.sha }}" .

      - name: Deploy
        run: az containerapp update --name "$APP" --resource-group "$RG" --image "$ACR.azurecr.io/$APP:\${{ github.sha }}"

      - name: Smoke test
        run: |
          FQDN=$(az containerapp show --name "$APP" --resource-group "$RG" --query properties.configuration.ingress.fqdn -o tsv)
          curl --fail --silent --show-error --retry 10 --retry-delay 6 --retry-all-errors "https://$FQDN/health/ready"
`,
    testCode: YAML_HELPERS('.github/workflows/deploy.yml') + WORKFLOW_HELPERS + `
const deploy = () => job('deploy');

describe('when it runs', () => {
  it('runs only for main', () => {
    expect(parsed.ok ? '' : parsed.error, 'deploy.yml must parse').toBe('');
    const t = triggers();
    expect(list(t.push?.branches), 'on: push: branches: [main]').toEqual(['main']);
    expect('pull_request' in t || 'pull_request_target' in t, 'Never deploy from pull requests').toBe(false);
  });
  it('queues deployments instead of cancelling them', () => {
    expect(doc.concurrency?.group, 'concurrency: group: deploy-production').toBe('deploy-production');
    expect(doc.concurrency?.['cancel-in-progress'], 'cancel-in-progress: false').toBe(false);
  });
  it('deploys only after tests pass, through the production environment', () => {
    const d = deploy();
    expect(list(d.needs).concat(typeof d.needs === 'string' ? [d.needs] : []), 'needs: test').toContain('test');
    expect(runText(job('test')), 'the test job runs dotnet test').toContain('dotnet test');
    const env = typeof d.environment === 'string' ? d.environment : d.environment?.name;
    expect(env, 'environment: production — required reviewers approve here').toBe('production');
    expect(Number(d['timeout-minutes'] ?? 360), 'timeout-minutes').toBeLessThanOrEqual(30);
  });
});

describe('credentials', () => {
  it('can request an OIDC token and little else', () => {
    expect(doc.permissions, 'permissions: id-token: write, contents: read').toEqual({ 'id-token': 'write', contents: 'read' });
  });
  it('signs in with OIDC, not a stored secret', () => {
    const login = need(usesOf(deploy(), 'azure/login'), 'Sign in with azure/login');
    const w = login.with ?? {};
    expect(['creds', 'client-secret'].filter((k) => k in w), 'Remove creds / client-secret').toEqual([]);
    for (const k of ['client-id', 'tenant-id', 'subscription-id']) {
      const v = String(w[k] ?? '');
      expect(v.startsWith(EXPR) && (v.includes('vars.') || v.includes('secrets.')), k + ' from vars or secrets').toBe(true);
    }
  });
  it('pins every action', () => {
    expect(allUses().filter((u) => !pinned(u))).toEqual([]);
  });
});

describe('the release', () => {
  it('builds and deploys the commit\\'s image', () => {
    const text = runText(deploy());
    expect(text.includes('az acr build') && text.includes('az containerapp update'), 'build with az acr build, deploy with az containerapp update').toBe(true);
    expect(text.split('github.sha').length - 1, 'tag the build and the deployment with github.sha').toBeGreaterThanOrEqual(2);
    expect(text.includes(':latest'), 'never latest').toBe(false);
  });
  it('fails unless the new revision reports ready', () => {
    const d = deploy();
    const smoke = stepIndex(d, runs('curl'));
    const update = stepIndex(d, runs('az containerapp update'));
    expect(smoke > update && update >= 0, 'smoke-test after the update').toBe(true);
    const curl = String(steps(d)[smoke]?.run ?? '');
    expect(curl.includes('--fail') && curl.includes('/health/ready') && curl.includes('--retry'), 'curl --fail --retry … https://$FQDN/health/ready').toBe(true);
  });
});
`,
  },
  {
    id: 'ops-5-15',
    title: 'Route Telemetry Through an OpenTelemetry Collector',
    difficulty: 'Medium',
    language: 'config',
    fileName: 'otel-collector.yaml',
    category: CATEGORY,
    prompt:
      'The API exports traces, metrics and logs over OTLP to a collector, which forwards them to Application Insights. The starter collector ' +
      'only handles traces, references an exporter it never defines, batches before limiting memory, has the connection string pasted in, and ' +
      'forwards Authorization headers. Fix it: (1) the otlp receiver accepts both grpc (0.0.0.0:4317) and http (0.0.0.0:4318); ' +
      '(2) processors memory_limiter, batch, and attributes/redact, which deletes http.request.header.authorization; (3) the azuremonitor ' +
      'exporter reads connection_string from the environment: $' + '{env:APPLICATIONINSIGHTS_CONNECTION_STRING}; (4) the health_check ' +
      'extension, enabled under service.extensions; (5) three pipelines — traces, metrics and logs — each receiving from otlp and exporting ' +
      'to azuremonitor, with memory_limiter first and batch last; traces and logs also run attributes/redact. Every component a pipeline ' +
      'names must be defined.',
    starterCode: `receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
  memory_limiter:
    check_interval: 1s
    limit_percentage: 80

exporters:
  azuremonitor:
    connection_string: "InstrumentationKey=4f1e0c2a-0000-0000-0000-000000000000;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, memory_limiter]
      exporters: [azuremonitor, logging]
`,
    hints: [
      'A component is defined under receivers/processors/exporters/extensions and only runs if a pipeline (or service.extensions) names it.',
      'memory_limiter goes first so it can refuse data before anything else allocates; batch goes last so it batches what is actually sent.',
      'attributes/redact: { actions: [ { key: http.request.header.authorization, action: delete } ] } — the part after the slash names a second instance of the same component type.',
      'connection_string: $' + '{env:APPLICATIONINSIGHTS_CONNECTION_STRING} — the value is supplied as a secret environment variable, never committed.',
    ],
    solution: `extensions:
  health_check:
    endpoint: 0.0.0.0:13133

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  # First: refuse data before the collector runs out of memory.
  memory_limiter:
    check_interval: 1s
    limit_percentage: 80
    spike_limit_percentage: 25
  # Credentials must never reach the telemetry backend.
  attributes/redact:
    actions:
      - key: http.request.header.authorization
        action: delete
  # Last: send in efficient batches.
  batch:
    timeout: 5s

exporters:
  azuremonitor:
    connection_string: \${env:APPLICATIONINSIGHTS_CONNECTION_STRING}

service:
  extensions: [health_check]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, attributes/redact, batch]
      exporters: [azuremonitor]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [azuremonitor]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, attributes/redact, batch]
      exporters: [azuremonitor]
`,
    testCode: YAML_HELPERS('otel-collector.yaml') + `
const pipelines: Record<string, Data> = doc.service?.pipelines ?? {};
const defined = (section: string): string[] => (doc[section] && typeof doc[section] === 'object' ? Object.keys(doc[section]) : []);

describe('pipelines', () => {
  it('carry traces, metrics and logs', () => {
    expect(parsed.ok ? '' : parsed.error, 'otel-collector.yaml must parse').toBe('');
    expect(Object.keys(pipelines).sort(), 'service.pipelines: traces, metrics, logs').toEqual(['logs', 'metrics', 'traces']);
    for (const [name, p] of Object.entries(pipelines)) {
      expect(list(p?.receivers), name + ' receives from otlp').toContain('otlp');
      expect(list(p?.exporters), name + ' exports to azuremonitor').toContain('azuremonitor');
    }
  });
  it('name only components that are defined', () => {
    const missing: string[] = [];
    for (const [name, p] of Object.entries(pipelines)) {
      for (const [kind, section] of [['receivers', 'receivers'], ['processors', 'processors'], ['exporters', 'exporters']]) {
        for (const c of list(p?.[kind])) if (!defined(section).includes(String(c))) missing.push(name + ': ' + kind + ' ' + String(c));
      }
    }
    for (const e of list(doc.service?.extensions)) if (!defined('extensions').includes(String(e))) missing.push('extension ' + String(e));
    expect(missing, 'A pipeline names a component that is not defined — the collector will refuse to start').toEqual([]);
  });
  it('limit memory first and batch last', () => {
    for (const [name, p] of Object.entries(pipelines)) {
      const procs = list(p?.processors).map(String);
      expect(procs[0], name + ': memory_limiter first').toBe('memory_limiter');
      expect(procs[procs.length - 1], name + ': batch last').toBe('batch');
    }
  });
  it('redact credentials from traces and logs', () => {
    const actions = list(doc.processors?.['attributes/redact']?.actions);
    expect(actions.some((a) => a?.key === 'http.request.header.authorization' && a?.action === 'delete'), 'attributes/redact deletes http.request.header.authorization').toBe(true);
    for (const name of ['traces', 'logs']) expect(list(pipelines[name]?.processors), name + ' runs attributes/redact').toContain('attributes/redact');
  });
});

describe('components', () => {
  it('accept OTLP over gRPC and HTTP', () => {
    const protocols = doc.receivers?.otlp?.protocols ?? {};
    expect(String(protocols.grpc?.endpoint ?? ''), 'grpc endpoint 0.0.0.0:4317').toBe('0.0.0.0:4317');
    expect(String(protocols.http?.endpoint ?? ''), 'http endpoint 0.0.0.0:4318').toBe('0.0.0.0:4318');
  });
  it('read the connection string from the environment', () => {
    expect(String(doc.exporters?.azuremonitor?.connection_string ?? ''), 'connection_string from env:APPLICATIONINSIGHTS_CONNECTION_STRING').toBe('$' + '{env:APPLICATIONINSIGHTS_CONNECTION_STRING}');
    expect(source.includes('InstrumentationKey='), 'Remove the pasted connection string').toBe(false);
  });
  it('report their own health', () => {
    expect(defined('extensions'), 'define the health_check extension').toContain('health_check');
    expect(list(doc.service?.extensions), 'enable it under service.extensions').toContain('health_check');
  });
});
`,
  },
  {
    id: 'ops-5-16',
    title: 'Alert on Error-Budget Burn, Not on Noise',
    difficulty: 'Hard',
    language: 'config',
    fileName: 'alerts.yaml',
    category: CATEGORY,
    prompt:
      'The Bookings API\'s SLO: 99.9% of requests succeed (no 5xx) over 30 days — an error budget of 0.1%. The current rules page someone ' +
      'when CPU passes 80% and on any single 5xx, so the on-call engineer has learned to ignore them. Replace them with multi-window, ' +
      'multi-burn-rate alerts (Google SRE workbook) in Prometheus rule format. (1) A group of recording rules ' +
      'bookings:error_ratio:rate5m, …:rate30m, …:rate1h and …:rate6h, each = 5xx request rate / all request rate over that window, from ' +
      'http_server_request_duration_seconds_count{job="bookings-api"} (5xx: http_response_status_code=~"5.."). (2) BookingsErrorBudgetFastBurn: ' +
      'rate1h and rate5m both above 14.4 × 0.001 (2% of the monthly budget in one hour) → severity page. (3) BookingsErrorBudgetSlowBurn: ' +
      'rate6h and rate30m both above 6 × 0.001 → severity page. (4) Every alert has a for duration and summary and runbook_url annotations. ' +
      'No paging alerts on CPU, memory or "any error".',
    starterCode: `groups:
  - name: bookings
    rules:
      - alert: HighCpu
        expr: avg(container_cpu_usage_ratio{app="bookings-api"}) > 0.8
        for: 1m
        labels:
          severity: page
      - alert: AnyErrors
        expr: sum(rate(http_server_request_duration_seconds_count{job="bookings-api",http_response_status_code=~"5.."}[1m])) > 0
        labels:
          severity: page
`,
    hints: [
      'Burn rate = how many times faster than "exactly on budget" you are spending errors. At 14.4× for one hour you spend 14.4 / 720 = 2% of a 30-day budget.',
      'The long window says the problem is significant; the short window says it is still happening, so the alert also clears quickly once fixed.',
      '- record: bookings:error_ratio:rate5m\n  expr: sum(rate(…{job="bookings-api",http_response_status_code=~"5.."}[5m])) / sum(rate(…{job="bookings-api"}[5m]))',
      'expr: bookings:error_ratio:rate1h > (14.4 * 0.001) and bookings:error_ratio:rate5m > (14.4 * 0.001)',
    ],
    solution: `# SLO: 99.9% of Bookings API requests succeed (non-5xx) over 30 days. Error budget: 0.1%.
groups:
  - name: bookings-slo-recording
    rules:
      - record: bookings:error_ratio:rate5m
        expr: |
          sum(rate(http_server_request_duration_seconds_count{job="bookings-api",http_response_status_code=~"5.."}[5m]))
          /
          sum(rate(http_server_request_duration_seconds_count{job="bookings-api"}[5m]))
      - record: bookings:error_ratio:rate30m
        expr: |
          sum(rate(http_server_request_duration_seconds_count{job="bookings-api",http_response_status_code=~"5.."}[30m]))
          /
          sum(rate(http_server_request_duration_seconds_count{job="bookings-api"}[30m]))
      - record: bookings:error_ratio:rate1h
        expr: |
          sum(rate(http_server_request_duration_seconds_count{job="bookings-api",http_response_status_code=~"5.."}[1h]))
          /
          sum(rate(http_server_request_duration_seconds_count{job="bookings-api"}[1h]))
      - record: bookings:error_ratio:rate6h
        expr: |
          sum(rate(http_server_request_duration_seconds_count{job="bookings-api",http_response_status_code=~"5.."}[6h]))
          /
          sum(rate(http_server_request_duration_seconds_count{job="bookings-api"}[6h]))

  - name: bookings-slo-alerts
    rules:
      # 2% of the monthly budget in an hour, and still happening.
      - alert: BookingsErrorBudgetFastBurn
        expr: bookings:error_ratio:rate1h > (14.4 * 0.001) and bookings:error_ratio:rate5m > (14.4 * 0.001)
        for: 2m
        labels:
          severity: page
        annotations:
          summary: Bookings API is spending its error budget 14x too fast.
          runbook_url: https://runbooks.example.com/bookings/error-budget
      # 5% of the monthly budget in six hours, and still happening.
      - alert: BookingsErrorBudgetSlowBurn
        expr: bookings:error_ratio:rate6h > (6 * 0.001) and bookings:error_ratio:rate30m > (6 * 0.001)
        for: 15m
        labels:
          severity: page
        annotations:
          summary: Bookings API is spending its error budget 6x too fast.
          runbook_url: https://runbooks.example.com/bookings/error-budget
`,
    testCode: YAML_HELPERS('alerts.yaml') + `
const rules: Data[] = list(doc.groups).flatMap((g) => list(g?.rules));
const recording = (name: string): Data => need(rules.find((r) => r?.record === name), 'Add the recording rule ' + name);
const alert = (name: string): Data => need(rules.find((r) => r?.alert === name), 'Add the alert ' + name);
const alerts = (): Data[] => rules.filter((r) => typeof r?.alert === 'string');
const squash = (s: unknown) => String(s ?? '').split(' ').join('').split(NL).join('');

describe('recording rules', () => {
  it('record the 5xx ratio over 5m, 30m, 1h and 6h', () => {
    expect(parsed.ok ? '' : parsed.error, 'alerts.yaml must parse').toBe('');
    for (const w of ['5m', '30m', '1h', '6h']) {
      const e = squash(recording('bookings:error_ratio:rate' + w).expr);
      expect(e.split('[' + w + ']').length - 1, 'rate…[' + w + '] in both the numerator and the denominator').toBe(2);
      expect(e.includes('http_response_status_code=~"5.."'), w + ': numerator counts 5xx').toBe(true);
      expect(e.includes('job="bookings-api"') && e.includes('/'), w + ': divided by all requests').toBe(true);
    }
  });
});

describe('burn-rate alerts', () => {
  it('page on a fast burn over 1h and 5m', () => {
    const a = alert('BookingsErrorBudgetFastBurn');
    const e = squash(a.expr);
    expect(e.includes('bookings:error_ratio:rate1h>(14.4*0.001)') && e.includes('bookings:error_ratio:rate5m>(14.4*0.001)') && e.includes('and'), 'rate1h > (14.4 * 0.001) and rate5m > (14.4 * 0.001)').toBe(true);
    expect(a.labels?.severity, 'severity: page').toBe('page');
  });
  it('page on a slow burn over 6h and 30m', () => {
    const a = alert('BookingsErrorBudgetSlowBurn');
    const e = squash(a.expr);
    expect(e.includes('bookings:error_ratio:rate6h>(6*0.001)') && e.includes('bookings:error_ratio:rate30m>(6*0.001)') && e.includes('and'), 'rate6h > (6 * 0.001) and rate30m > (6 * 0.001)').toBe(true);
    expect(a.labels?.severity, 'severity: page').toBe('page');
  });
  it('tell the responder what is wrong and what to do', () => {
    for (const a of alerts()) {
      expect(String(a.annotations?.summary ?? ''), a.alert + ': annotations.summary').not.toBe('');
      expect(String(a.annotations?.runbook_url ?? '').startsWith('https://'), a.alert + ': annotations.runbook_url').toBe(true);
      expect(String(a.for ?? ''), a.alert + ': a for duration').not.toBe('');
    }
  });
});

describe('noise', () => {
  it('pages on symptoms users feel, not on causes or single errors', () => {
    const noisy = alerts().filter((a) => a.labels?.severity === 'page').filter((a) => {
      const e = squash(a.expr).toLowerCase();
      return e.includes('cpu') || e.includes('memory') || e.endsWith('>0');
    }).map((a) => a.alert);
    expect(noisy, 'Remove pages on CPU, memory or any single error').toEqual([]);
  });
});
`,
  },
];
