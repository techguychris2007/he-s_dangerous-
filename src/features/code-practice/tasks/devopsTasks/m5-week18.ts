import type { CodeTask } from '../codeTypes';

const CATEGORY = 'Month 5 · Cloud & DevOps';

/** Grader preamble for Azure CLI scripts (no backslashes or template strings inside). */
const AZ_HELPERS = (file: string) => `import { describe, it, expect } from 'vitest';
import { readFile, parseShell, azCalls, shellAssignments, flagValue, flagValues, type AzCall } from 'dw:project';

const script = readFile('${file}');
const commands = parseShell(script);
const calls = azCalls(script);
const assigns = shellAssignments(script);
function need<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) throw new Error(message);
  return value;
}
const isCall = (c: AzCall, ...path: string[]) => path.every((p, i) => c.args[i] === p);
const find = (...path: string[]) => calls.filter((c) => isCall(c, ...path));
const one = (...path: string[]) => need(find(...path)[0], 'Expected an az ' + path.join(' ') + ' command');
const flag = (c: AzCall, ...names: string[]): string => {
  for (const n of names) { const v = flagValue(c.args, n); if (typeof v === 'string') return v; if (v === true) return 'true'; }
  return '';
};
const varName = (value: string): string => (value.startsWith('$') ? value.slice(1).split('{').join('').split('}').join('') : '');
const producer = (value: string): AzCall | undefined => calls.find((c) => c.assignTo !== null && c.assignTo === varName(value));
const strictMode = () => commands.find((c) => c.argv[0] === 'set' && c.argv.join(' ').includes('-e') && c.argv.join(' ').includes('u') && c.argv.join(' ').includes('pipefail'));
`;

/** Grader preamble for Container Apps YAML. */
const CA_HELPERS = `import { describe, it, expect } from 'vitest';
import { readFile, parseYaml } from 'dw:project';

const parsed = parseYaml(readFile('containerapp.yaml'));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = any;
const app: Data = parsed.ok && parsed.value && typeof parsed.value === 'object' ? parsed.value : {};
const config: Data = app.properties?.configuration ?? {};
const template: Data = app.properties?.template ?? {};
const containers: Data[] = Array.isArray(template.containers) ? template.containers : [];
const api = (): Data => containers.find((c) => c?.name === 'api') ?? {};
const probe = (type: string): Data => (Array.isArray(api().probes) ? api().probes.find((p: Data) => p?.type === type) : undefined);
const IDENTITY = '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-bookings-prod/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-bookings-api';
const tagOf = (image: string) => { const s = image.lastIndexOf('/'); const c = image.lastIndexOf(':'); return c > s ? image.slice(c + 1) : ''; };
`;

const IDENTITY = '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-bookings-prod/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-bookings-api';
const ENVIRONMENT = '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-bookings-prod/providers/Microsoft.App/managedEnvironments/cae-bookings-prod';

/** Month 5, week 18 (lessons dn5-3, dn5-4): Azure resources, identity and Container Apps. */
export const DEVOPS_WEEK_18: CodeTask[] = [
  {
    id: 'ops-5-05',
    title: 'Provision the Environment with the Azure CLI',
    difficulty: 'Medium',
    language: 'config',
    fileName: 'provision.sh',
    category: CATEGORY,
    prompt:
      'The starter provision.sh was typed into a terminal once and saved. Turn it into a script a teammate (or a pipeline) can re-run safely. ' +
      '(1) Start with #!/usr/bin/env bash and set -euo pipefail before any az command, so a failed step stops the script instead of ' +
      'carrying on with half an environment. (2) Put every name in a variable at the top — RG=rg-bookings-prod, LOCATION=westeurope, ' +
      'ACR=acrbookingsprod, ENV_NAME=cae-bookings-prod, APP=bookings-api — and pass only variables to --name, --resource-group, ' +
      '--location and --registry. (3) Create the resource group with --tags that include env=prod. (4) Create the registry with ' +
      '--sku Basic and --admin-enabled false: the admin user is a shared, all-powerful password; the app will pull with its own identity ' +
      '(next task). (5) Build the image in Azure with az acr build, tagged with the commit — GIT_SHA=$(git rev-parse --short HEAD) — ' +
      'never latest. (6) Create the Container Apps environment in the same location. Keep the order: group, registry, image, environment.',
    starterCode: `az group create --name rg-bookings-prod --location westeurope
az acr create --resource-group rg-bookings-prod --name acrbookingsprod --sku Basic --admin-enabled true
az acr build --registry acrbookingsprod --image bookings-api:latest .
az containerapp env create --name cae-bookings-prod --resource-group rg-bookings-prod
`,
    hints: [
      'set -e stops at the first failing command, -u makes an unset variable an error (a typo in $RG is caught), and -o pipefail fails a pipeline when any part fails.',
      'Variables: RG=rg-bookings-prod on its own line, then --resource-group "$RG". Quote expansions.',
      'az group create --name "$RG" --location "$LOCATION" --tags env=prod app=bookings',
      'GIT_SHA=$(git rev-parse --short HEAD) then az acr build --registry "$ACR" --image "$APP:$GIT_SHA" .',
    ],
    solution: `#!/usr/bin/env bash
# Provision the Bookings environment and build the first image. Safe to re-run: every
# "create" here is idempotent for an unchanged definition.
set -euo pipefail

RG=rg-bookings-prod
LOCATION=westeurope
ACR=acrbookingsprod
ENV_NAME=cae-bookings-prod
APP=bookings-api
GIT_SHA=$(git rev-parse --short HEAD)

az group create --name "$RG" --location "$LOCATION" --tags env=prod app=bookings

# No admin user: images are pulled with the app's managed identity.
az acr create --resource-group "$RG" --name "$ACR" --sku Basic --admin-enabled false

# Build in Azure (no local Docker needed), tagged with the commit that produced it.
az acr build --registry "$ACR" --image "$APP:$GIT_SHA" .

az containerapp env create --name "$ENV_NAME" --resource-group "$RG" --location "$LOCATION"
`,
    testCode: AZ_HELPERS('provision.sh') + `
describe('script safety', () => {
  it('is a bash script that stops on the first error', () => {
    expect(script.startsWith('#!/usr/bin/env bash') || script.startsWith('#!/bin/bash'), 'Start with #!/usr/bin/env bash').toBe(true);
    const s = need(strictMode(), 'Add set -euo pipefail');
    const firstAz = calls.length ? Math.min(...calls.map((c) => c.line)) : Infinity;
    expect(s.line < firstAz, 'set -euo pipefail must come before the first az command').toBe(true);
  });
  it('names every resource once, in variables', () => {
    for (const name of ['RG', 'LOCATION', 'ACR', 'ENV_NAME', 'APP']) expect(assigns.map((a) => a.name), 'Define ' + name + ' at the top').toContain(name);
    const literal: string[] = [];
    for (const c of calls) {
      for (const f of ['--name', '-n', '--resource-group', '-g', '--location', '-l', '--registry']) {
        const v = flagValue(c.args, f);
        if (typeof v === 'string' && !v.startsWith('$')) literal.push('line ' + c.line + ': ' + f + ' ' + v);
      }
    }
    expect(literal, 'Pass variables, not literal names').toEqual([]);
  });
});

describe('resources', () => {
  it('creates a tagged resource group in the chosen location', () => {
    const g = one('group', 'create');
    expect(flag(g, '--location', '-l'), '--location "$LOCATION"').toBe('$LOCATION');
    expect(flagValues(g.args, '--tags').some((t) => t.startsWith('env=')), '--tags env=prod (cost reports and policies group by tags)').toBe(true);
  });
  it('creates a registry with the admin user disabled', () => {
    const r = one('acr', 'create');
    expect(flag(r, '--sku'), '--sku Basic').not.toBe('');
    expect(flag(r, '--admin-enabled'), '--admin-enabled false — the admin user is one shared password with push rights').toBe('false');
    expect(find('acr', 'credential').length + find('acr', 'update').filter((c) => flag(c, '--admin-enabled') === 'true').length, 'Never read or enable admin credentials').toBe(0);
  });
  it('builds the image in Azure, tagged with the commit', () => {
    const b = one('acr', 'build');
    const image = flag(b, '--image', '-t');
    const tag = image.slice(image.lastIndexOf(':') + 1);
    expect(tag === '' || tag === 'latest' || image.indexOf(':') < 0, 'Tag the image with the commit, never latest').toBe(false);
    expect(tag, 'Use the commit variable as the tag ($GIT_SHA)').toBe('$GIT_SHA');
    const sha = need(assigns.find((a) => a.name === 'GIT_SHA'), 'Set GIT_SHA=$(git rev-parse --short HEAD)');
    expect(sha.value.includes('git rev-parse'), 'GIT_SHA comes from git rev-parse').toBe(true);
  });
  it('creates the Container Apps environment in the same location', () => {
    const e = one('containerapp', 'env', 'create');
    expect(flag(e, '--location', '-l'), '--location "$LOCATION"').toBe('$LOCATION');
  });
  it('runs the steps in dependency order', () => {
    const at = (...p: string[]) => one(...p).line;
    expect(at('group', 'create') < at('acr', 'create') && at('acr', 'create') < at('acr', 'build') && at('group', 'create') < at('containerapp', 'env', 'create'), 'group, then registry, then image; the environment after the group').toBe(true);
  });
});
`,
  },
  {
    id: 'ops-5-06',
    title: 'Replace Passwords with a Managed Identity',
    difficulty: 'Hard',
    language: 'config',
    fileName: 'deploy-app.sh',
    category: CATEGORY,
    prompt:
      'The starter creates the Container App the quick way: it switches on the registry admin user and passes its password, puts the ' +
      'database password on the command line, and — "to fix a permissions error" — grants Contributor on the whole subscription. Rewrite it ' +
      'with one user-assigned managed identity and least privilege. Keep set -euo pipefail and the variables. (1) az identity create, then ' +
      'capture ID_RESOURCE_ID and ID_PRINCIPAL from az identity show --query id / principalId. (2) Look up ACR_ID (az acr show --query id) and ' +
      'grant AcrPull at that scope only, with --assignee-object-id "$ID_PRINCIPAL" --assignee-principal-type ServicePrincipal. (3) Create ' +
      'the Key Vault with --enable-rbac-authorization true, look up KV_ID and grant "Key Vault Secrets User" at the vault\'s scope. ' +
      '(4) Create the app with --user-assigned and --registry-identity set to the identity, no registry username or password, the image ' +
      'tagged with IMAGE_TAG (not latest), the secret as db-password=keyvaultref:$SECRET_URI,identityref:$ID_RESOURCE_ID (SECRET_URI is ' +
      'https://$KV.vault.azure.net/secrets/db-password), --env-vars "Database__Password=secretref:db-password", external ingress on 8080 ' +
      'and at least one replica. No role broader than these two, at no wider scope.',
    starterCode: `#!/usr/bin/env bash
set -euo pipefail

RG=rg-bookings-prod
ACR=acrbookingsprod
KV=kv-bookings-prod
ENV_NAME=cae-bookings-prod
APP=bookings-api
ID_NAME=id-bookings-api
IMAGE_TAG=$(git rev-parse --short HEAD)

SUB_ID=$(az account show --query id -o tsv)
az acr update --name "$ACR" --admin-enabled true
ACR_PASSWORD=$(az acr credential show --name "$ACR" --query "passwords[0].value" -o tsv)

az containerapp create --name "$APP" --resource-group "$RG" --environment "$ENV_NAME" \\
  --image "$ACR.azurecr.io/$APP:latest" \\
  --system-assigned \\
  --registry-server "$ACR.azurecr.io" --registry-username "$ACR" --registry-password "$ACR_PASSWORD" \\
  --secrets "db-password=Pr0d-P@ssw0rd!" \\
  --env-vars "Database__Password=secretref:db-password" \\
  --ingress external --target-port 8080

PRINCIPAL=$(az containerapp show --name "$APP" --resource-group "$RG" --query identity.principalId -o tsv)
az role assignment create --assignee "$PRINCIPAL" --role Contributor --scope "/subscriptions/$SUB_ID"
`,
    hints: [
      'A user-assigned identity exists before the app does, so its role assignments can be in place when the first revision starts pulling — a system-assigned identity cannot have AcrPull until after the app is created.',
      'ID_PRINCIPAL=$(az identity show --resource-group "$RG" --name "$ID_NAME" --query principalId -o tsv) — the principal (object) id is what roles are granted to; the resource id (--query id) is what the app is told to use.',
      'az role assignment create --assignee-object-id "$ID_PRINCIPAL" --assignee-principal-type ServicePrincipal --role AcrPull --scope "$ACR_ID"',
      'az containerapp create … --user-assigned "$ID_RESOURCE_ID" --registry-server "$ACR.azurecr.io" --registry-identity "$ID_RESOURCE_ID" --secrets "db-password=keyvaultref:$SECRET_URI,identityref:$ID_RESOURCE_ID" …',
    ],
    solution: `#!/usr/bin/env bash
set -euo pipefail

RG=rg-bookings-prod
ACR=acrbookingsprod
KV=kv-bookings-prod
ENV_NAME=cae-bookings-prod
APP=bookings-api
ID_NAME=id-bookings-api
IMAGE_TAG=$(git rev-parse --short HEAD)

# One identity for the app. It exists before the app, so its roles are ready for the first pull.
az identity create --resource-group "$RG" --name "$ID_NAME"
ID_RESOURCE_ID=$(az identity show --resource-group "$RG" --name "$ID_NAME" --query id -o tsv)
ID_PRINCIPAL=$(az identity show --resource-group "$RG" --name "$ID_NAME" --query principalId -o tsv)

# Pull images: AcrPull on this registry only.
ACR_ID=$(az acr show --name "$ACR" --query id -o tsv)
az role assignment create --assignee-object-id "$ID_PRINCIPAL" --assignee-principal-type ServicePrincipal \\
  --role AcrPull --scope "$ACR_ID"

# Read secrets: Key Vault Secrets User on this vault only (RBAC, not access policies).
az keyvault create --resource-group "$RG" --name "$KV" --enable-rbac-authorization true
KV_ID=$(az keyvault show --name "$KV" --query id -o tsv)
az role assignment create --assignee-object-id "$ID_PRINCIPAL" --assignee-principal-type ServicePrincipal \\
  --role "Key Vault Secrets User" --scope "$KV_ID"

# Versionless URI: the app picks up a rotated secret without a redeploy.
SECRET_URI="https://$KV.vault.azure.net/secrets/db-password"

az containerapp create --name "$APP" --resource-group "$RG" --environment "$ENV_NAME" \\
  --image "$ACR.azurecr.io/$APP:$IMAGE_TAG" \\
  --user-assigned "$ID_RESOURCE_ID" \\
  --registry-server "$ACR.azurecr.io" --registry-identity "$ID_RESOURCE_ID" \\
  --secrets "db-password=keyvaultref:$SECRET_URI,identityref:$ID_RESOURCE_ID" \\
  --env-vars "Database__Password=secretref:db-password" \\
  --ingress external --target-port 8080 \\
  --min-replicas 1 --max-replicas 5
`,
    testCode: AZ_HELPERS('deploy-app.sh') + `
const app = () => one('containerapp', 'create');
const assignments = () => find('role', 'assignment', 'create');
const roleOf = (c: AzCall) => flag(c, '--role');
const fromQuery = (value: string, path: string[], query: string): boolean => {
  const p = producer(value);
  return !!p && path.every((s, i) => p.args[i] === s) && flag(p, '--query') === query;
};

describe('identity', () => {
  it('creates a user-assigned identity and captures both of its ids', () => {
    expect(strictMode(), 'Keep set -euo pipefail').toBeDefined();
    one('identity', 'create');
    expect(fromQuery('$ID_RESOURCE_ID', ['identity', 'show'], 'id'), 'ID_RESOURCE_ID=$(az identity show … --query id -o tsv)').toBe(true);
    expect(fromQuery('$ID_PRINCIPAL', ['identity', 'show'], 'principalId'), 'ID_PRINCIPAL=$(az identity show … --query principalId -o tsv)').toBe(true);
  });
  it('lets the identity pull from this registry only', () => {
    const pull = need(assignments().find((c) => roleOf(c) === 'AcrPull'), 'Grant the AcrPull role');
    expect(flag(pull, '--assignee-object-id'), '--assignee-object-id "$ID_PRINCIPAL"').toBe('$ID_PRINCIPAL');
    expect(flag(pull, '--assignee-principal-type'), '--assignee-principal-type ServicePrincipal').toBe('ServicePrincipal');
    expect(fromQuery(flag(pull, '--scope'), ['acr', 'show'], 'id'), '--scope "$ACR_ID", where ACR_ID=$(az acr show … --query id -o tsv)').toBe(true);
  });
  it('lets the identity read secrets from this vault only', () => {
    const kv = one('keyvault', 'create');
    expect(flag(kv, '--enable-rbac-authorization'), '--enable-rbac-authorization true').toBe('true');
    const read = need(assignments().find((c) => roleOf(c) === 'Key Vault Secrets User'), 'Grant "Key Vault Secrets User"');
    expect(flag(read, '--assignee-object-id'), '--assignee-object-id "$ID_PRINCIPAL"').toBe('$ID_PRINCIPAL');
    expect(fromQuery(flag(read, '--scope'), ['keyvault', 'show'], 'id'), '--scope "$KV_ID", where KV_ID=$(az keyvault show … --query id -o tsv)').toBe(true);
  });
  it('grants nothing broader', () => {
    const roles = assignments().map(roleOf);
    expect(roles.filter((r) => r !== 'AcrPull' && r !== 'Key Vault Secrets User'), 'Only AcrPull and Key Vault Secrets User — no Contributor, Owner or admin roles').toEqual([]);
    expect(assignments().filter((c) => flag(c, '--scope').startsWith('/subscriptions')).length, 'No subscription-wide scopes').toBe(0);
  });
});

describe('the app', () => {
  it('pulls with the identity, not a password', () => {
    expect(find('acr', 'credential').length, 'Do not read registry credentials').toBe(0);
    expect(find('acr', 'update').filter((c) => flag(c, '--admin-enabled') === 'true').length, 'Do not enable the admin user').toBe(0);
    const a = app();
    expect(flag(a, '--registry-username') + flag(a, '--registry-password'), 'Remove --registry-username and --registry-password').toBe('');
    expect(flag(a, '--user-assigned'), '--user-assigned "$ID_RESOURCE_ID"').toBe('$ID_RESOURCE_ID');
    expect(flag(a, '--registry-identity'), '--registry-identity "$ID_RESOURCE_ID"').toBe('$ID_RESOURCE_ID');
  });
  it('reads the database password from Key Vault', () => {
    const secrets = flagValues(app().args, '--secrets');
    expect(secrets, 'db-password=keyvaultref:$SECRET_URI,identityref:$ID_RESOURCE_ID').toContain('db-password=keyvaultref:$SECRET_URI,identityref:$ID_RESOURCE_ID');
    const uri = need(assigns.find((x) => x.name === 'SECRET_URI'), 'Set SECRET_URI').value;
    expect(uri.includes('.vault.azure.net/secrets/db-password'), 'SECRET_URI=https://$KV.vault.azure.net/secrets/db-password').toBe(true);
    expect(flagValues(app().args, '--env-vars'), 'Database__Password=secretref:db-password').toContain('Database__Password=secretref:db-password');
    expect(script.includes('Pr0d-P@ssw0rd'), 'No password may appear in the script').toBe(false);
  });
  it('runs a commit-tagged image, publicly on 8080, always warm', () => {
    const a = app();
    const image = flag(a, '--image');
    expect(image.endsWith(':$IMAGE_TAG'), '--image "$ACR.azurecr.io/$APP:$IMAGE_TAG"').toBe(true);
    expect(flag(a, '--ingress'), '--ingress external').toBe('external');
    expect(flag(a, '--target-port'), '--target-port 8080').toBe('8080');
    expect(Number(flag(a, '--min-replicas')), '--min-replicas 1: an API that scales to zero makes its next caller wait for a cold start').toBeGreaterThanOrEqual(1);
  });
  it('creates the roles before the app that needs them', () => {
    const appLine = app().line;
    expect(assignments().every((c) => c.line < appLine), 'Grant AcrPull and Key Vault Secrets User before az containerapp create').toBe(true);
  });
});
`,
  },
  {
    id: 'ops-5-07',
    title: 'A Production-Ready Container App Manifest',
    difficulty: 'Hard',
    language: 'config',
    fileName: 'containerapp.yaml',
    category: CATEGORY,
    prompt:
      'Deployments now use az containerapp update --yaml containerapp.yaml, so the app\'s whole definition is reviewed in pull requests. ' +
      'Fix the starter manifest. The identity\'s resource id is ' + IDENTITY + '. ' +
      '(1) identity: type UserAssigned with that id under userAssignedIdentities. (2) ingress: external, targetPort 8080, allowInsecure false ' +
      '(HTTP redirects to HTTPS). (3) registries: server acrbookingsprod.azurecr.io pulled with that identity — no passwordSecretRef. ' +
      '(4) secrets: db-password from keyVaultUrl https://kv-bookings-prod.vault.azure.net/secrets/db-password with that identity — no value. ' +
      '(5) The api container runs a commit-tagged image (not latest), reads Database__Password with secretRef: db-password, and requests a ' +
      'valid Consumption size: memory must be twice the CPU in Gi (0.5 CPU → 1Gi). (6) probes: Startup and Liveness on /health/live and ' +
      'Readiness on /health/ready, all httpGet on port 8080. (7) scale: minReplicas at least 1, maxReplicas at least 3, and an http rule that ' +
      'scales on concurrentRequests.',
    starterCode: `location: westeurope
name: bookings-api
type: Microsoft.App/containerApps
properties:
  environmentId: ${ENVIRONMENT}
  configuration:
    activeRevisionsMode: Single
    ingress:
      external: true
      targetPort: 80
      allowInsecure: true
    registries:
      - server: acrbookingsprod.azurecr.io
        username: acrbookingsprod
        passwordSecretRef: registry-password
    secrets:
      - name: registry-password
        value: "pasted-from-the-portal"
      - name: db-password
        value: "Pr0d-P@ssw0rd!"
  template:
    containers:
      - name: api
        image: acrbookingsprod.azurecr.io/bookings-api:latest
        resources:
          cpu: 0.5
          memory: 2Gi
        env:
          - name: Database__Password
            value: "Pr0d-P@ssw0rd!"
    scale:
      minReplicas: 0
      maxReplicas: 1
`,
    hints: [
      'identity: { type: UserAssigned, userAssignedIdentities: { "<the id>": {} } } at the top level, beside properties.',
      'registries: - server: acrbookingsprod.azurecr.io, identity: <the id>; secrets: - name: db-password, keyVaultUrl: https://kv-bookings-prod.vault.azure.net/secrets/db-password, identity: <the id>.',
      'probes: - type: Liveness, httpGet: { path: /health/live, port: 8080 } — and the same shape for Readiness (/health/ready) and Startup.',
      'scale: { minReplicas: 1, maxReplicas: 5, rules: [ { name: http-scaling, http: { metadata: { concurrentRequests: "50" } } } ] }',
    ],
    solution: `location: westeurope
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
        image: acrbookingsprod.azurecr.io/bookings-api:3f9c2ab
        resources:
          cpu: 0.5
          memory: 1Gi
        env:
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
            periodSeconds: 10
          - type: Readiness
            httpGet:
              path: /health/ready
              port: 8080
            periodSeconds: 5
    scale:
      minReplicas: 1
      maxReplicas: 5
      rules:
        - name: http-scaling
          http:
            metadata:
              concurrentRequests: "50"
`,
    testCode: CA_HELPERS + `
describe('manifest', () => {
  it('is a Container App with one api container', () => {
    expect(parsed.ok ? '' : parsed.error, 'containerapp.yaml must parse').toBe('');
    expect(app.type).toBe('Microsoft.App/containerApps');
    expect(containers.map((c) => c?.name), 'one container named api').toEqual(['api']);
  });
  it('runs as the user-assigned identity', () => {
    expect(app.identity?.type, 'identity: type: UserAssigned').toBe('UserAssigned');
    expect(Object.keys(app.identity?.userAssignedIdentities ?? {}), 'list the identity under userAssignedIdentities').toContain(IDENTITY);
  });
  it('serves HTTPS only, on 8080', () => {
    expect(config.ingress?.external, 'ingress.external: true').toBe(true);
    expect(config.ingress?.targetPort, 'targetPort: 8080 (where ASP.NET Core listens)').toBe(8080);
    expect(config.ingress?.allowInsecure, 'allowInsecure: false').toBe(false);
  });
});

describe('credentials', () => {
  it('pulls images with the identity', () => {
    const regs: Data[] = Array.isArray(config.registries) ? config.registries : [];
    const r = regs.find((x) => x?.server === 'acrbookingsprod.azurecr.io') ?? {};
    expect(r.identity, 'registries[].identity: the identity id').toBe(IDENTITY);
    expect(regs.some((x) => x?.passwordSecretRef || x?.username), 'No registry username or passwordSecretRef').toBe(false);
  });
  it('takes secrets from Key Vault, never inline', () => {
    const secrets: Data[] = Array.isArray(config.secrets) ? config.secrets : [];
    expect(secrets.filter((s) => s && 'value' in s).map((s) => s.name), 'No secret may carry a value').toEqual([]);
    const db = secrets.find((s) => s?.name === 'db-password') ?? {};
    expect(db.keyVaultUrl, 'db-password keyVaultUrl').toBe('https://kv-bookings-prod.vault.azure.net/secrets/db-password');
    expect(db.identity, 'db-password identity').toBe(IDENTITY);
    const env: Data[] = Array.isArray(api().env) ? api().env : [];
    const pw = env.find((e) => e?.name === 'Database__Password') ?? {};
    expect(pw.secretRef, 'Database__Password: secretRef: db-password').toBe('db-password');
    expect(env.filter((e) => e && 'value' in e && String(e.value).includes('P@ss')).length, 'No password in env values').toBe(0);
  });
});

describe('the container', () => {
  it('runs a commit-tagged image at a valid size', () => {
    const tag = tagOf(String(api().image ?? ''));
    expect(tag !== '' && tag !== 'latest', 'Tag the image with a commit, not latest').toBe(true);
    const cpu = Number(api().resources?.cpu);
    const memory = String(api().resources?.memory ?? '');
    expect(memory.endsWith('Gi'), 'memory in Gi, e.g. 1Gi').toBe(true);
    expect(Number(memory.slice(0, -2)), 'Consumption sizes pair memory = 2 × CPU (0.5 CPU → 1Gi)').toBe(cpu * 2);
  });
  it('has startup, liveness and readiness probes on the health endpoints', () => {
    for (const [type, path] of [['Startup', '/health/live'], ['Liveness', '/health/live'], ['Readiness', '/health/ready']]) {
      const p = probe(type) ?? {};
      expect(p.httpGet?.path, type + ' probe: httpGet.path ' + path).toBe(path);
      expect(p.httpGet?.port, type + ' probe on port 8080').toBe(8080);
    }
  });
  it('stays warm and scales on concurrent requests', () => {
    expect(Number(template.scale?.minReplicas ?? 0), 'minReplicas: 1 or more').toBeGreaterThanOrEqual(1);
    expect(Number(template.scale?.maxReplicas ?? 0), 'maxReplicas: 3 or more').toBeGreaterThanOrEqual(3);
    const rules: Data[] = Array.isArray(template.scale?.rules) ? template.scale.rules : [];
    expect(rules.some((r) => r?.http?.metadata?.concurrentRequests !== undefined), 'an http scale rule on concurrentRequests').toBe(true);
  });
});
`,
  },
  {
    id: 'ops-5-08',
    title: 'Canary a New Revision with Traffic Splitting',
    difficulty: 'Hard',
    language: 'config',
    fileName: 'containerapp.yaml',
    category: CATEGORY,
    prompt:
      'Revision v42 (image tag a1b2c3d) serves all traffic. Release commit e4f5a6b as a canary instead of all at once. Change the manifest so ' +
      'that: activeRevisionsMode is Multiple (several revisions run side by side); the new template gets revisionSuffix v43 and image tag ' +
      'e4f5a6b; and ingress.traffic sends 90% to the existing revision by name (bookings-api--v42, label blue) and 10% to the new one ' +
      '(revisionName bookings-api--v43, label green). Weights must add up to 100. Name both revisions explicitly — latestRevision: true would ' +
      'silently move traffic to whatever is deployed next. Keep the readiness probe: a revision only receives traffic once it is ready. ' +
      'Leave everything else as it is. Promoting the canary later is a one-line change: 0 and 100.',
    starterCode: `location: westeurope
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
      allowInsecure: false
      traffic:
        - latestRevision: true
          weight: 100
    registries:
      - server: acrbookingsprod.azurecr.io
        identity: ${IDENTITY}
  template:
    revisionSuffix: v42
    containers:
      - name: api
        image: acrbookingsprod.azurecr.io/bookings-api:a1b2c3d
        resources:
          cpu: 0.5
          memory: 1Gi
        probes:
          - type: Readiness
            httpGet:
              path: /health/ready
              port: 8080
    scale:
      minReplicas: 2
      maxReplicas: 10
`,
    hints: [
      'A revision\'s name is <app name>--<revisionSuffix>: bookings-api--v42 and bookings-api--v43.',
      'traffic: - revisionName: bookings-api--v42, weight: 90, label: blue; - revisionName: bookings-api--v43, weight: 10, label: green.',
      'Labels give each revision its own stable URL (bookings-api---green.<environment domain>) so you can test the canary directly.',
    ],
    solution: `location: westeurope
name: bookings-api
type: Microsoft.App/containerApps
identity:
  type: UserAssigned
  userAssignedIdentities:
    ${IDENTITY}: {}
properties:
  environmentId: ${ENVIRONMENT}
  configuration:
    activeRevisionsMode: Multiple
    ingress:
      external: true
      targetPort: 8080
      allowInsecure: false
      traffic:
        - revisionName: bookings-api--v42
          weight: 90
          label: blue
        - revisionName: bookings-api--v43
          weight: 10
          label: green
    registries:
      - server: acrbookingsprod.azurecr.io
        identity: ${IDENTITY}
  template:
    revisionSuffix: v43
    containers:
      - name: api
        image: acrbookingsprod.azurecr.io/bookings-api:e4f5a6b
        resources:
          cpu: 0.5
          memory: 1Gi
        probes:
          - type: Readiness
            httpGet:
              path: /health/ready
              port: 8080
    scale:
      minReplicas: 2
      maxReplicas: 10
`,
    testCode: CA_HELPERS + `
const traffic: Data[] = Array.isArray(config.ingress?.traffic) ? config.ingress.traffic : [];
const entry = (revision: string): Data => traffic.find((t) => t?.revisionName === revision) ?? {};

describe('revisions', () => {
  it('run side by side', () => {
    expect(parsed.ok ? '' : parsed.error, 'containerapp.yaml must parse').toBe('');
    expect(config.activeRevisionsMode, 'activeRevisionsMode: Multiple').toBe('Multiple');
  });
  it('the new template is revision v43 running commit e4f5a6b', () => {
    expect(template.revisionSuffix, 'revisionSuffix: v43').toBe('v43');
    expect(tagOf(String(api().image ?? '')), 'image tag e4f5a6b').toBe('e4f5a6b');
  });
  it('keeps the readiness probe that gates traffic', () => {
    expect(probe('Readiness')?.httpGet?.path, 'Readiness probe on /health/ready').toBe('/health/ready');
  });
});

describe('traffic', () => {
  it('adds up to 100%', () => {
    expect(traffic.reduce((sum, t) => sum + Number(t?.weight ?? 0), 0), 'weights must sum to 100').toBe(100);
  });
  it('names both revisions instead of following the latest', () => {
    expect(traffic.some((t) => t?.latestRevision === true), 'latestRevision would move traffic to whatever deploys next — name revisions').toBe(false);
    expect(traffic.length, 'two entries: stable and canary').toBe(2);
  });
  it('sends 90% to the stable revision v42 as blue', () => {
    expect(entry('bookings-api--v42').weight, 'bookings-api--v42: weight 90').toBe(90);
    expect(entry('bookings-api--v42').label, 'label: blue').toBe('blue');
  });
  it('sends 10% to the canary v43 as green', () => {
    expect(entry('bookings-api--v43').weight, 'bookings-api--v43: weight 10').toBe(10);
    expect(entry('bookings-api--v43').label, 'label: green').toBe('green');
  });
  it('leaves the rest of the app unchanged', () => {
    expect(config.ingress?.targetPort).toBe(8080);
    expect(config.ingress?.allowInsecure).toBe(false);
    expect(template.scale?.minReplicas).toBe(2);
    expect(Object.keys(app.identity?.userAssignedIdentities ?? {})).toContain(IDENTITY);
  });
});
`,
  },
];
