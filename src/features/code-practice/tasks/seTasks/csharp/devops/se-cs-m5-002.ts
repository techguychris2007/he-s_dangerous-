import { pf, type ProjectTask } from '../../../projectTypes';
import { PROJECT_GRADER_HELPERS } from '../../../devopsTasks/graderHelpers';

const IDENTITY = '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-bookings-prod/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-bookings-api';
const ENVIRONMENT = '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-bookings-prod/providers/Microsoft.App/managedEnvironments/cae-bookings-prod';

const README = `# Week 18 Assignment: Cloud Deployment

Last week's images run anywhere Docker runs. This week the Bookings API goes to **Azure Container Apps** — with no
password stored anywhere, and a deployment anyone on the team can run (and re-run) from a clean checkout.

Three files, three jobs:

| File | Runs | Job |
| --- | --- | --- |
| \`infra/provision.sh\` | once per environment, re-runnable | everything the app stands on |
| \`deploy/containerapp.yaml\` | on every deployment | the app's full, reviewable definition |
| \`deploy/deploy.sh\` | on every deployment | build, release, prove it works |

## 1. \`infra/provision.sh\`

- \`#!/usr/bin/env bash\` and \`set -euo pipefail\` before any \`az\` command; every name in a variable at the top
  (\`RG\`, \`LOCATION\`, \`ACR\`, \`KV\`, \`ENV_NAME\`, \`ID_NAME\`), and only variables passed to \`--name\`,
  \`--resource-group\`, \`--location\`.
- Resource group with \`--tags\` including \`env=prod\`.
- Registry: \`--sku Basic --admin-enabled false\`.
- User-assigned identity; capture \`ID_PRINCIPAL\` with \`az identity show … --query principalId -o tsv\`.
- \`AcrPull\` for that principal (\`--assignee-object-id\`, \`--assignee-principal-type ServicePrincipal\`) scoped to
  \`ACR_ID\` from \`az acr show … --query id -o tsv\`.
- Key Vault with \`--enable-rbac-authorization true\` and \`--enable-purge-protection true\`; \`Key Vault Secrets User\`
  scoped to \`KV_ID\` from \`az keyvault show … --query id -o tsv\`.
- No other role, and no scope wider than one resource.
- The Container Apps environment in \`$LOCATION\`.

## 2. \`deploy/containerapp.yaml\`

Identity id: \`${IDENTITY}\`

- \`identity\`: \`UserAssigned\` with that id.
- Ingress: external, \`targetPort: 8080\`, \`allowInsecure: false\`.
- Registry \`acrbookingsprod.azurecr.io\` pulled with the identity; secret \`db-password\` from
  \`https://kv-bookings-prod.vault.azure.net/secrets/db-password\` with the identity. No \`value\`, no passwords.
- Container \`api\`: image \`acrbookingsprod.azurecr.io/bookings-api:IMAGE_TAG\` (\`deploy.sh\` replaces the placeholder),
  0.5 CPU / 1Gi, \`Database__Password\` from \`secretRef: db-password\`, and
  \`ASPNETCORE_FORWARDEDHEADERS_ENABLED: "true"\` (TLS ends at the platform's proxy).
- Probes: \`Startup\` and \`Liveness\` on \`/health/live\`, \`Readiness\` on \`/health/ready\`, all on port 8080.
- Scale: \`minReplicas: 1\`, \`maxReplicas\` 3 or more, an \`http\` rule on \`concurrentRequests\`.

## 3. \`deploy/deploy.sh\`

- Strict mode and variables as above; \`GIT_SHA=$(git rev-parse --short HEAD)\`.
- \`az acr build\` the image tagged \`$GIT_SHA\` (never \`latest\`).
- Render the manifest with the tag: \`sed "s/IMAGE_TAG/$GIT_SHA/" deploy/containerapp.yaml > "$MANIFEST"\`, then
  \`az containerapp update --name "$APP" --resource-group "$RG" --yaml "$MANIFEST"\`.
- Smoke test after the update: \`FQDN=$(az containerapp show … --query properties.configuration.ingress.fqdn -o tsv)\`,
  then \`curl --fail\` (with retries) \`https://$FQDN/health/ready\`. Because of \`set -e\`, a failing smoke test fails
  the deployment.

**Run** shows how the graders read each file. The checks read structure — finish by running the scripts against
your own subscription (the free account is enough) and deleting the resource group afterwards.
`;

const PROGRAM = `using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Locally (Compose) the password arrives as a file; in Azure as an environment variable that
// Container Apps fills from Key Vault (Database__Password=secretref:db-password).
var cs = new NpgsqlConnectionStringBuilder(builder.Configuration.GetConnectionString("Bookings"));
cs.Password = builder.Configuration["Database:Password"]
    ?? (builder.Configuration["Database:PasswordFile"] is { Length: > 0 } file ? File.ReadAllText(file).Trim() : null);

builder.Services.AddHealthChecks().AddNpgSql(cs.ConnectionString, tags: ["ready"]);

var app = builder.Build();
// With ASPNETCORE_FORWARDEDHEADERS_ENABLED=true the host trusts X-Forwarded-Proto/For from the
// platform's proxy, so redirects and links use https and the real client address.
app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new() { Predicate = c => c.Tags.Contains("ready") });
app.MapBookingEndpoints();
app.Run();
`;

const DOCKERFILE = `# From Week 17 (given): the image deploy.sh builds with az acr build.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Bookings.sln ./
COPY src/Bookings.Api/Bookings.Api.csproj src/Bookings.Api/
COPY src/Bookings.Domain/Bookings.Domain.csproj src/Bookings.Domain/
RUN dotnet restore src/Bookings.Api/Bookings.Api.csproj
COPY src/ src/
RUN dotnet publish src/Bookings.Api/Bookings.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Bookings.Api.dll"]
`;

const INSPECT = `// Run: shows how the graders read your scripts and manifest.
import { readFile, azCalls, parseYaml } from 'dw:project';

for (const path of ['infra/provision.sh', 'deploy/deploy.sh']) {
  console.log(path + ':');
  for (const c of azCalls(readFile(path))) console.log('  line ' + c.line + ': az ' + c.args.slice(0, 3).join(' ') + (c.assignTo ? '  -> $' + c.assignTo : ''));
}
const manifest = parseYaml(readFile('deploy/containerapp.yaml'));
console.log('deploy/containerapp.yaml: ' + (manifest.ok ? 'valid YAML, template image ' + JSON.stringify(manifest.value?.properties?.template?.containers?.[0]?.image) : manifest.error));
`;

const PROVISION_STARTER = `#!/usr/bin/env bash
# TODO: see README section 1.
az group create --name rg-bookings-prod --location westeurope
az acr create --resource-group rg-bookings-prod --name acrbookingsprod --sku Basic --admin-enabled true
az keyvault create --resource-group rg-bookings-prod --name kv-bookings-prod
az containerapp env create --name cae-bookings-prod --resource-group rg-bookings-prod --location westeurope
`;

const PROVISION_SOLUTION = `#!/usr/bin/env bash
# Everything the Bookings API stands on, for one environment. Safe to re-run.
set -euo pipefail

RG=rg-bookings-prod
LOCATION=westeurope
ACR=acrbookingsprod
KV=kv-bookings-prod
ENV_NAME=cae-bookings-prod
ID_NAME=id-bookings-api

az group create --name "$RG" --location "$LOCATION" --tags env=prod app=bookings owner=platform

# Registry: no admin user — images are pulled with the app's identity.
az acr create --resource-group "$RG" --name "$ACR" --sku Basic --admin-enabled false
ACR_ID=$(az acr show --name "$ACR" --query id -o tsv)

# The app's identity, created first so its roles exist before the app's first image pull.
az identity create --resource-group "$RG" --name "$ID_NAME"
ID_PRINCIPAL=$(az identity show --resource-group "$RG" --name "$ID_NAME" --query principalId -o tsv)

az role assignment create --assignee-object-id "$ID_PRINCIPAL" --assignee-principal-type ServicePrincipal \\
  --role AcrPull --scope "$ACR_ID"

# Secrets: RBAC permission model; purge protection so a deleted secret can always be recovered.
az keyvault create --resource-group "$RG" --name "$KV" \\
  --enable-rbac-authorization true --enable-purge-protection true
KV_ID=$(az keyvault show --name "$KV" --query id -o tsv)

az role assignment create --assignee-object-id "$ID_PRINCIPAL" --assignee-principal-type ServicePrincipal \\
  --role "Key Vault Secrets User" --scope "$KV_ID"

az containerapp env create --name "$ENV_NAME" --resource-group "$RG" --location "$LOCATION"
`;

const MANIFEST_STARTER = `# TODO: see README section 2.
location: westeurope
name: bookings-api
type: Microsoft.App/containerApps
properties:
  environmentId: ${ENVIRONMENT}
  configuration:
    activeRevisionsMode: Single
    ingress:
      external: true
      targetPort: 80
    registries:
      - server: acrbookingsprod.azurecr.io
        username: acrbookingsprod
        passwordSecretRef: registry-password
    secrets:
      - name: registry-password
        value: "copied-from-portal"
  template:
    containers:
      - name: api
        image: acrbookingsprod.azurecr.io/bookings-api:latest
        resources:
          cpu: 1
          memory: 1Gi
        env:
          - name: Database__Password
            value: "Pr0d-P@ssw0rd!"
`;

const MANIFEST_SOLUTION = `location: westeurope
name: bookings-api
type: Microsoft.App/containerApps
identity:
  type: UserAssigned
  userAssignedIdentities:
    ${IDENTITY}: {}
properties:
  environmentId: ${ENVIRONMENT}
  configuration:
    activeRevisionsMode: Single
    ingress:
      external: true
      targetPort: 8080
      transport: auto
      allowInsecure: false
    registries:
      - server: acrbookingsprod.azurecr.io
        identity: ${IDENTITY}
    secrets:
      - name: db-password
        keyVaultUrl: https://kv-bookings-prod.vault.azure.net/secrets/db-password
        identity: ${IDENTITY}
  template:
    containers:
      - name: api
        image: acrbookingsprod.azurecr.io/bookings-api:IMAGE_TAG
        resources:
          cpu: 0.5
          memory: 1Gi
        env:
          - name: ASPNETCORE_FORWARDEDHEADERS_ENABLED
            value: "true"
          - name: ConnectionStrings__Bookings
            value: "Host=psql-bookings-prod.postgres.database.azure.com;Database=bookings;Username=bookings_app;SSL Mode=Require"
          - name: Database__Password
            secretRef: db-password
        probes:
          - type: Startup
            httpGet:
              path: /health/live
              port: 8080
            periodSeconds: 3
            failureThreshold: 20
          - type: Liveness
            httpGet:
              path: /health/live
              port: 8080
          - type: Readiness
            httpGet:
              path: /health/ready
              port: 8080
    scale:
      minReplicas: 1
      maxReplicas: 5
      rules:
        - name: http-scaling
          http:
            metadata:
              concurrentRequests: "50"
`;

const DEPLOY_STARTER = `#!/usr/bin/env bash
# TODO: see README section 3.
az acr build --registry acrbookingsprod --image bookings-api:latest .
az containerapp update --name bookings-api --resource-group rg-bookings-prod --image acrbookingsprod.azurecr.io/bookings-api:latest
echo "Deployed!"
`;

const DEPLOY_SOLUTION = `#!/usr/bin/env bash
# Build, release and verify one commit. Any failing step — including the smoke test — fails the deploy.
set -euo pipefail

RG=rg-bookings-prod
ACR=acrbookingsprod
APP=bookings-api
GIT_SHA=$(git rev-parse --short HEAD)
MANIFEST=$(mktemp)

az acr build --registry "$ACR" --image "$APP:$GIT_SHA" .

# The reviewed manifest, with this commit's image.
sed "s/IMAGE_TAG/$GIT_SHA/" deploy/containerapp.yaml > "$MANIFEST"
az containerapp update --name "$APP" --resource-group "$RG" --yaml "$MANIFEST"

# Prove it: the new revision must report ready through the public endpoint.
FQDN=$(az containerapp show --name "$APP" --resource-group "$RG" --query properties.configuration.ingress.fqdn -o tsv)
curl --fail --silent --show-error --retry 10 --retry-delay 6 --retry-all-errors "https://$FQDN/health/ready"
echo "Deployed $GIT_SHA to https://$FQDN"
`;

const TESTS = PROJECT_GRADER_HELPERS + `
const IDENTITY = '${IDENTITY}';

// ======================================================================== provision.sh
const PROVISION = 'infra/provision.sh';
const prov = azOf(PROVISION);
const pAssign = assignsOf(PROVISION);
const pFind = (...p: string[]) => prov.filter((c) => isAz(c, ...p));
const pOne = (...p: string[]) => need(pFind(...p)[0], PROVISION + ': expected az ' + p.join(' '));
const producedBy = (value: string, path: string[], query: string) => {
  const c = prov.find((x) => x.assignTo !== null && x.assignTo === varOf(value));
  return !!c && isAz(c, ...path) && azFlag(c, '--query') === query;
};
const roles = () => pFind('role', 'assignment', 'create');

describe('infra/provision.sh', () => {
  it('stops on the first error and names everything in variables', () => {
    expect(read(PROVISION).startsWith('#!/usr/bin/env bash'), 'Start with #!/usr/bin/env bash').toBe(true);
    const s = need(strictShell(PROVISION), 'Add set -euo pipefail');
    expect(prov.every((c) => c.line > s.line), 'set -euo pipefail before any az command').toBe(true);
    for (const n of ['RG', 'LOCATION', 'ACR', 'KV', 'ENV_NAME', 'ID_NAME']) expect(pAssign.map((a) => a.name), 'Define ' + n).toContain(n);
    const literal = prov.flatMap((c) => ['--name', '-n', '--resource-group', '-g', '--location', '-l'].map((f) => [f, flagValue(c.args, f)] as const)
      .filter(([, v]) => typeof v === 'string' && !v.startsWith('$')).map(([f, v]) => 'line ' + c.line + ': ' + f + ' ' + String(v)));
    expect(literal, 'Only variables for names, groups and locations').toEqual([]);
  });
  it('tags the resource group', () => {
    expect(flagValues(pOne('group', 'create').args, '--tags').some((t) => t.startsWith('env=')), '--tags env=prod').toBe(true);
  });
  it('creates the registry without an admin user', () => {
    expect(azFlag(pOne('acr', 'create'), '--admin-enabled'), '--admin-enabled false').toBe('false');
    expect(pFind('acr', 'credential').length, 'Never read registry credentials').toBe(0);
  });
  it('creates a user-assigned identity and captures its principal id', () => {
    pOne('identity', 'create');
    expect(producedBy('$ID_PRINCIPAL', ['identity', 'show'], 'principalId'), 'ID_PRINCIPAL=$(az identity show … --query principalId -o tsv)').toBe(true);
  });
  it('grants AcrPull on the registry only', () => {
    const r = need(roles().find((c) => azFlag(c, '--role') === 'AcrPull'), 'Assign AcrPull');
    expect(azFlag(r, '--assignee-object-id')).toBe('$ID_PRINCIPAL');
    expect(azFlag(r, '--assignee-principal-type'), '--assignee-principal-type ServicePrincipal').toBe('ServicePrincipal');
    expect(producedBy(azFlag(r, '--scope'), ['acr', 'show'], 'id'), '--scope "$ACR_ID" from az acr show --query id').toBe(true);
  });
  it('creates an RBAC Key Vault with purge protection and grants read access to it only', () => {
    const kv = pOne('keyvault', 'create');
    expect(azFlag(kv, '--enable-rbac-authorization'), '--enable-rbac-authorization true').toBe('true');
    expect(azFlag(kv, '--enable-purge-protection'), '--enable-purge-protection true').toBe('true');
    const r = need(roles().find((c) => azFlag(c, '--role') === 'Key Vault Secrets User'), 'Assign "Key Vault Secrets User"');
    expect(azFlag(r, '--assignee-object-id')).toBe('$ID_PRINCIPAL');
    expect(producedBy(azFlag(r, '--scope'), ['keyvault', 'show'], 'id'), '--scope "$KV_ID" from az keyvault show --query id').toBe(true);
  });
  it('grants nothing else', () => {
    expect(roles().map((c) => azFlag(c, '--role')).filter((r) => r !== 'AcrPull' && r !== 'Key Vault Secrets User'), 'No other roles').toEqual([]);
    expect(roles().filter((c) => !azFlag(c, '--scope').startsWith('$')).length, 'Every scope is a looked-up resource id').toBe(0);
  });
  it('creates the Container Apps environment in the chosen location', () => {
    expect(azFlag(pOne('containerapp', 'env', 'create'), '--location', '-l')).toBe('$LOCATION');
  });
});

// ======================================================================== containerapp.yaml
const manifest = yamlFile('deploy/containerapp.yaml');
const props: Data = manifest.value.properties ?? {};
const cfg: Data = props.configuration ?? {};
const tpl: Data = props.template ?? {};
const api = (): Data => (Array.isArray(tpl.containers) ? tpl.containers.find((c: Data) => c?.name === 'api') : undefined) ?? {};
const envList = (): Data[] => (Array.isArray(api().env) ? api().env : []);
const probeOf = (t: string): Data => (Array.isArray(api().probes) ? api().probes.find((p: Data) => p?.type === t) : undefined) ?? {};

describe('deploy/containerapp.yaml', () => {
  it('runs as the user-assigned identity, serving HTTPS on 8080', () => {
    expect(manifest.error, 'containerapp.yaml must parse').toBe('');
    expect(manifest.value.identity?.type).toBe('UserAssigned');
    expect(Object.keys(manifest.value.identity?.userAssignedIdentities ?? {})).toContain(IDENTITY);
    expect(cfg.ingress?.external, 'external ingress').toBe(true);
    expect(cfg.ingress?.targetPort, 'targetPort: 8080').toBe(8080);
    expect(cfg.ingress?.allowInsecure, 'allowInsecure: false').toBe(false);
  });
  it('holds no credentials: registry and secret both use the identity', () => {
    const regs: Data[] = Array.isArray(cfg.registries) ? cfg.registries : [];
    expect(regs.map((r) => r?.identity), 'registries[].identity').toEqual([IDENTITY]);
    expect(regs.some((r) => r?.passwordSecretRef || r?.username), 'no registry username or password').toBe(false);
    const secrets: Data[] = Array.isArray(cfg.secrets) ? cfg.secrets : [];
    expect(secrets.filter((s) => s && 'value' in s).length, 'no secret values in the file').toBe(0);
    const db = secrets.find((s) => s?.name === 'db-password') ?? {};
    expect(db.keyVaultUrl).toBe('https://kv-bookings-prod.vault.azure.net/secrets/db-password');
    expect(db.identity).toBe(IDENTITY);
  });
  it('configures the api container for the platform', () => {
    expect(String(api().image ?? ''), 'image acrbookingsprod.azurecr.io/bookings-api:IMAGE_TAG — deploy.sh fills in the tag').toBe('acrbookingsprod.azurecr.io/bookings-api:IMAGE_TAG');
    expect([Number(api().resources?.cpu), String(api().resources?.memory)], '0.5 CPU and 1Gi').toEqual([0.5, '1Gi']);
    const pw = envList().find((e) => e?.name === 'Database__Password') ?? {};
    expect(pw.secretRef, 'Database__Password: secretRef: db-password').toBe('db-password');
    expect(envList().some((e) => e && 'value' in e && String(e.value).includes('P@ss')), 'no password values').toBe(false);
    const fwd = envList().find((e) => e?.name === 'ASPNETCORE_FORWARDEDHEADERS_ENABLED') ?? {};
    expect(String(fwd.value), 'ASPNETCORE_FORWARDEDHEADERS_ENABLED: "true" — TLS ends at the proxy').toBe('true');
  });
  it('probes startup, liveness and readiness on the health endpoints', () => {
    for (const [t, path] of [['Startup', '/health/live'], ['Liveness', '/health/live'], ['Readiness', '/health/ready']]) {
      expect(probeOf(t).httpGet?.path, t + ' probe on ' + path).toBe(path);
      expect(probeOf(t).httpGet?.port, t + ' probe on port 8080').toBe(8080);
    }
  });
  it('stays warm and scales on load', () => {
    expect(Number(tpl.scale?.minReplicas ?? 0), 'minReplicas: 1').toBeGreaterThanOrEqual(1);
    expect(Number(tpl.scale?.maxReplicas ?? 0), 'maxReplicas: 3 or more').toBeGreaterThanOrEqual(3);
    const rules: Data[] = Array.isArray(tpl.scale?.rules) ? tpl.scale.rules : [];
    expect(rules.some((r) => r?.http?.metadata?.concurrentRequests !== undefined), 'an http concurrentRequests rule').toBe(true);
  });
});

// ======================================================================== deploy.sh
const DEPLOY = 'deploy/deploy.sh';
const dep = azOf(DEPLOY);
const dAssign = assignsOf(DEPLOY);
const dCommands = parseShell(read(DEPLOY));

describe('deploy/deploy.sh', () => {
  it('stops on the first error', () => {
    const s = need(strictShell(DEPLOY), 'Add set -euo pipefail');
    expect(dep.every((c) => c.line > s.line), 'set -euo pipefail before any az command').toBe(true);
  });
  it('builds the image tagged with the commit', () => {
    const sha = need(dAssign.find((a) => a.name === 'GIT_SHA'), 'GIT_SHA=$(git rev-parse --short HEAD)');
    expect(sha.value.includes('git rev-parse'), 'GIT_SHA comes from git rev-parse').toBe(true);
    const b = need(dep.find((c) => isAz(c, 'acr', 'build')), 'az acr build');
    expect(azFlag(b, '--image', '-t').endsWith(':$GIT_SHA'), '--image "$APP:$GIT_SHA"').toBe(true);
    expect(read(DEPLOY).includes(':latest'), 'never latest').toBe(false);
  });
  it('deploys the reviewed manifest with that tag', () => {
    const render = need(dCommands.find((c) => c.argv[0] === 'sed' && c.text.includes('IMAGE_TAG')), 'Render the manifest with sed "s/IMAGE_TAG/$GIT_SHA/"');
    expect(render.argv.some((a) => a.includes('IMAGE_TAG/$GIT_SHA')), 'replace IMAGE_TAG with $GIT_SHA').toBe(true);
    expect(render.argv.includes('deploy/containerapp.yaml'), 'render deploy/containerapp.yaml').toBe(true);
    const u = need(dep.find((c) => isAz(c, 'containerapp', 'update')), 'az containerapp update --yaml');
    expect(azFlag(u, '--yaml'), '--yaml with the rendered manifest').not.toBe('');
    expect(azFlag(u, '--yaml'), 'deploy the rendered copy, not the template with IMAGE_TAG in it').not.toBe('deploy/containerapp.yaml');
    expect(render.line < u.line, 'render before updating').toBe(true);
  });
  it('fails the deployment unless the new revision is ready', () => {
    const fq = need(dep.find((c) => c.assignTo === 'FQDN'), 'FQDN=$(az containerapp show … --query properties.configuration.ingress.fqdn -o tsv)');
    expect(azFlag(fq, '--query'), '--query properties.configuration.ingress.fqdn').toBe('properties.configuration.ingress.fqdn');
    const curl = need(dCommands.find((c) => c.argv[0] === 'curl'), 'Smoke-test with curl');
    const fails = curl.argv.some((a) => a === '--fail' || (a.startsWith('-') && !a.startsWith('--') && a.includes('f')));
    expect(fails, 'curl --fail, so an HTTP error fails the script').toBe(true);
    expect(curl.argv.includes('https://$FQDN/health/ready'), 'probe https://$FQDN/health/ready').toBe(true);
    expect(curl.argv.some((a) => a.startsWith('--retry')), 'retry while the revision starts (--retry)').toBe(true);
    const update = need(dep.find((c) => isAz(c, 'containerapp', 'update')), 'az containerapp update');
    expect(curl.line > update.line, 'smoke-test after the update').toBe(true);
  });
});
`;

const given = [
  pf('README.md', README, { editable: false }),
  pf('Dockerfile', DOCKERFILE, { editable: false }),
  pf('src/Bookings.Api/Program.cs', PROGRAM, { editable: false }),
  pf('inspect.ts', INSPECT, { editable: false }),
];

const task: ProjectTask = {
  id: 'se-cs-m5-002',
  title: 'Week 18: Cloud Deployment',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 5 · Cloud, DevOps & Delivery',
  tags: ['Azure', 'Container Apps', 'managed identity', 'Key Vault'],
  prompt:
    'Deploy the Bookings API to Azure Container Apps with no stored password: a re-runnable provisioning script that creates the ' +
    'registry, Key Vault and environment and grants a user-assigned identity exactly AcrPull and Key Vault Secrets User on exactly ' +
    'those resources; a reviewable Container App manifest with identity-based pulls, Key Vault secrets, forwarded headers, probes and ' +
    'bounded scaling; and a deploy script that builds a commit-tagged image, releases it and fails unless the new revision reports ready.',
  hints: [
    'Tasks ops-5-05 to ops-5-07 cover each piece on its own; this project joins them.',
    'producedBy in the tests means: the --scope variable must have been set from az acr show (or az keyvault show) with --query id.',
    'In deploy.sh, MANIFEST=$(mktemp) gives a temporary file for the rendered copy; sed "s/IMAGE_TAG/$GIT_SHA/" deploy/containerapp.yaml > "$MANIFEST".',
    'curl --fail --retry 10 --retry-delay 6 --retry-all-errors "https://$FQDN/health/ready" keeps trying while the revision starts, then fails the script if it never becomes ready.',
  ],
  files: [
    ...given,
    pf('infra/provision.sh', PROVISION_STARTER),
    pf('deploy/containerapp.yaml', MANIFEST_STARTER),
    pf('deploy/deploy.sh', DEPLOY_STARTER),
  ],
  solutionFiles: [
    ...given,
    pf('infra/provision.sh', PROVISION_SOLUTION),
    pf('deploy/containerapp.yaml', MANIFEST_SOLUTION),
    pf('deploy/deploy.sh', DEPLOY_SOLUTION),
  ],
  targets: [{ id: 'config', label: 'Azure deployment', kind: 'typescript', entry: 'inspect.ts', testCode: TESTS }],
};

export default task;
