import { pf, type ProjectTask } from '../../../projectTypes';
import { PROJECT_GRADER_HELPERS } from '../../../devopsTasks/graderHelpers';

const README = `# Week 19 Assignment: Rebuild the Cloud

\`legacy/main.tf\` is how production was first described: one file, prod only, names and ids typed in, the registry
admin password in use, a database password in a variable default, state on a laptop. Rebuild it as code a team
can own — **one module, two thin environment roots** — so that dev and prod come from the same reviewed definition
and \`terraform plan\` can rebuild either from nothing.

\`\`\`
modules/bookings/
  versions.tf    required_providers only
  variables.tf   the module's inputs
  main.tf        every resource
  outputs.tf     what callers need
envs/dev/main.tf
envs/prod/main.tf
.gitignore
\`\`\`

## The module (\`modules/bookings\`)

- **versions.tf** — \`required_version\`, and \`azurerm\` (\`~> 4.0\`) and \`random\` (\`~> 3.6\`) in \`required_providers\`.
  No \`provider\` or \`backend\` blocks anywhere in the module.
- **variables.tf** — \`environment\` (string; validation: dev or prod), \`location\` (string, default westeurope),
  \`image_tag\` (string; validation rejects \`"latest"\`), \`min_replicas\` and \`max_replicas\` (numbers). Every variable
  has a type and a description.
- **main.tf** —
  - \`locals { tags = { … environment = var.environment … } }\` and \`tags = local.tags\` on every resource that takes tags
    (resource group, registry, identity, Log Analytics workspace, Key Vault, Container Apps environment, app);
  - every name built from \`var.environment\`; locations by reference; no \`/subscriptions/…\` ids typed in;
  - registry \`azurerm_container_registry.acr\` with \`admin_enabled = false\`;
  - identity \`azurerm_user_assigned_identity.app\`, with \`AcrPull\` on the registry (\`acr_pull\`) and
    \`Key Vault Secrets User\` on the vault (\`kv_reader\`), both \`principal_type = "ServicePrincipal"\`;
  - \`data "azurerm_client_config" "current"\`; vault \`azurerm_key_vault.main\` with that tenant, RBAC authorization,
    purge protection and \`lifecycle { prevent_destroy = true }\`; \`Key Vault Secrets Officer\` on the vault for the
    deployer (\`deployer_secrets\`, \`principal_id = data.azurerm_client_config.current.object_id\`);
  - \`random_password.db\` (length ≥ 24) stored as \`azurerm_key_vault_secret.db_password\`, which \`depends_on\` the
    deployer's role; no other role assignments;
  - \`azurerm_log_analytics_workspace.logs\` and \`azurerm_container_app_environment.main\` sending logs to it;
  - \`azurerm_container_app.api\`: the user-assigned identity; registry pulled with it; \`secret\` \`db-password\` from
    \`key_vault_secret_id = azurerm_key_vault_secret.db_password.versionless_id\` with the identity; ingress on 8080;
    container \`api\` running \`<login_server>/bookings-api:<var.image_tag>\` at 0.5 CPU / \`"1Gi"\` with an \`env\`
    \`Database__Password\` from \`secret_name = "db-password"\`, readiness (\`/health/ready\`) and liveness (\`/health/live\`)
    probes; \`min_replicas\` and \`max_replicas\` from the variables; \`depends_on\` both of the identity's role assignments.
- **outputs.tf** — \`app_url\` (from \`latest_revision_fqdn\`) and \`acr_login_server\`. Nothing that reveals a secret.

## The roots (\`envs/dev\`, \`envs/prod\`)

Each: a \`terraform\` block pinning \`azurerm\`, a \`backend "azurerm"\` (\`rg-tfstate\` / \`sttfstatebookings\` /
\`tfstate\`, key \`bookings/<env>.tfstate\`, \`use_azuread_auth = true\`, no keys), \`provider "azurerm" { features {} }\`,
\`variable "image_tag"\`, and \`module "bookings"\` with \`source = "../../modules/bookings"\`, its environment name,
\`image_tag = var.image_tag\`, and replicas — **dev 0 to 3** (it may sleep), **prod 2 to 10**. An \`output "app_url"\`
from the module. No resources of their own.

## .gitignore

Never commit state or the provider cache: ignore \`.terraform/\` and \`*.tfstate\` (and \`*.tfstate.*\` backups) — but
**do** commit \`.terraform.lock.hcl\`, so every machine uses the same provider builds.

**Run** lists what the parser found in each file. The checks read structure; finish with \`terraform init\`,
\`terraform validate\` and \`terraform plan\` in \`envs/dev\` against your own subscription.
`;

const LEGACY = `# The original, hand-written production configuration (read-only reference).
provider "azurerm" {
  features {}
  subscription_id = "00000000-0000-0000-0000-000000000000"
}

variable "db_password" {
  default = "Pr0d-P@ssw0rd!"
}

resource "azurerm_resource_group" "main" {
  name     = "rg-bookings-prod"
  location = "westeurope"
}

resource "azurerm_container_registry" "acr" {
  name                = "acrbookingsprod"
  resource_group_name = "rg-bookings-prod"
  location            = "westeurope"
  sku                 = "Basic"
  admin_enabled       = true
}

resource "azurerm_key_vault" "main" {
  name                = "kv-bookings-prod"
  location            = "westeurope"
  resource_group_name = "rg-bookings-prod"
  tenant_id           = "11111111-1111-1111-1111-111111111111"
  sku_name            = "standard"
}

resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = var.db_password
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_container_app_environment" "main" {
  name                = "cae-bookings-prod"
  resource_group_name = "rg-bookings-prod"
  location            = "westeurope"
}

resource "azurerm_container_app" "api" {
  name                         = "bookings-api"
  resource_group_name          = "rg-bookings-prod"
  container_app_environment_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-bookings-prod/providers/Microsoft.App/managedEnvironments/cae-bookings-prod"
  revision_mode                = "Single"

  secret {
    name  = "acr-password"
    value = "copied-from-portal"
  }

  registry {
    server               = "acrbookingsprod.azurecr.io"
    username             = "acrbookingsprod"
    password_secret_name = "acr-password"
  }

  ingress {
    external_enabled = true
    target_port      = 8080
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    container {
      name   = "api"
      image  = "acrbookingsprod.azurecr.io/bookings-api:latest"
      cpu    = 0.5
      memory = "1Gi"
    }
  }
}
`;

const INSPECT = `// Run: what the parser finds in each Terraform file (the tests read the same structure).
import { readFile, listFiles, parseHcl } from 'dw:project';

for (const path of listFiles().filter((p) => p.endsWith('.tf'))) {
  const r = parseHcl(readFile(path));
  if (!r.ok) { console.log(path + ': ' + r.error); continue; }
  const blocks = r.value.blocks.map((b) => [b.type, ...b.labels].join('.'));
  console.log(path + ': ' + (blocks.length ? blocks.join(', ') : '(empty)'));
}
`;

const TODO = (what: string) => `# TODO: ${what} — see README.md\n`;

const VERSIONS = `terraform {
  required_version = ">= 1.9"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}
# No provider or backend blocks: the roots that call this module configure those.
`;

const VARIABLES = `variable "environment" {
  type        = string
  description = "Deployment environment: dev or prod. Every resource name is derived from it."
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be dev or prod."
  }
}

variable "location" {
  type        = string
  description = "Azure region for every resource."
  default     = "westeurope"
}

variable "image_tag" {
  type        = string
  description = "Commit SHA of the API image to run."
  validation {
    condition     = length(var.image_tag) > 0 && var.image_tag != "latest"
    error_message = "image_tag must name a specific build (a commit SHA), never latest."
  }
}

variable "min_replicas" {
  type        = number
  description = "Replicas kept running; 0 lets the app scale to zero when idle."
  validation {
    condition     = var.min_replicas >= 0
    error_message = "min_replicas cannot be negative."
  }
}

variable "max_replicas" {
  type        = number
  description = "Upper bound on replicas: caps cost and protects the database."
  validation {
    condition     = var.max_replicas >= 1
    error_message = "max_replicas must be at least 1."
  }
}
`;

const MAIN = `locals {
  tags = {
    app         = "bookings"
    environment = var.environment
    managed_by  = "terraform"
  }
}

data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "main" {
  name     = "rg-bookings-\${var.environment}"
  location = var.location
  tags     = local.tags
}

# ---- registry and the app's identity

resource "azurerm_container_registry" "acr" {
  name                = "acrbookings\${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = false
  tags                = local.tags
}

resource "azurerm_user_assigned_identity" "app" {
  name                = "id-bookings-\${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tags                = local.tags
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
  principal_type       = "ServicePrincipal"
}

# ---- secrets

resource "azurerm_key_vault" "main" {
  name                       = "kv-bookings-\${var.environment}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  enable_rbac_authorization  = true
  purge_protection_enabled   = true
  soft_delete_retention_days = 90
  tags                       = local.tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_role_assignment" "kv_reader" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
  principal_type       = "ServicePrincipal"
}

resource "azurerm_role_assignment" "deployer_secrets" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "random_password" "db" {
  length  = 32
  special = true
}

resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = random_password.db.result
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_role_assignment.deployer_secrets]
}

# ---- the platform

resource "azurerm_log_analytics_workspace" "logs" {
  name                = "log-bookings-\${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.tags
}

resource "azurerm_container_app_environment" "main" {
  name                       = "cae-bookings-\${var.environment}"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
  tags                       = local.tags
}

resource "azurerm_container_app" "api" {
  name                         = "bookings-api"
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  revision_mode                = "Single"
  tags                         = local.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app.id]
  }

  registry {
    server   = azurerm_container_registry.acr.login_server
    identity = azurerm_user_assigned_identity.app.id
  }

  secret {
    name                = "db-password"
    key_vault_secret_id = azurerm_key_vault_secret.db_password.versionless_id
    identity            = azurerm_user_assigned_identity.app.id
  }

  ingress {
    external_enabled = true
    target_port      = 8080
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = "api"
      image  = "\${azurerm_container_registry.acr.login_server}/bookings-api:\${var.image_tag}"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name        = "Database__Password"
        secret_name = "db-password"
      }

      readiness_probe {
        transport = "HTTP"
        path      = "/health/ready"
        port      = 8080
      }

      liveness_probe {
        transport = "HTTP"
        path      = "/health/live"
        port      = 8080
      }
    }
  }

  # The first revision pulls its image and reads its secret as the identity.
  depends_on = [azurerm_role_assignment.acr_pull, azurerm_role_assignment.kv_reader]
}
`;

const OUTPUTS = `output "app_url" {
  description = "Public URL of the API."
  value       = "https://\${azurerm_container_app.api.latest_revision_fqdn}"
}

output "acr_login_server" {
  description = "Registry host name, for the pipeline's image builds."
  value       = azurerm_container_registry.acr.login_server
}
`;

const root = (env: string, min: number, max: number) => `terraform {
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
  source = "../../modules/bookings"

  environment  = "${env}"
  image_tag    = var.image_tag
  min_replicas = ${min}
  max_replicas = ${max}
}

output "app_url" {
  value = module.bookings.app_url
}
`;

const GITIGNORE_STARTER = `bin/
obj/
`;

const GITIGNORE = `bin/
obj/
# Terraform: provider cache and state never go in git (state holds secrets).
.terraform/
*.tfstate
*.tfstate.*
# .terraform.lock.hcl IS committed: it pins the exact provider builds.
`;

const TESTS = PROJECT_GRADER_HELPERS + `
const M = 'modules/bookings/';
const files = ['versions.tf', 'variables.tf', 'main.tf', 'outputs.tf'].map((f) => hclFile(M + f));
const mod: HclBody = mergeHcl(...files.map((f) => f.body));
const versions = files[0].body;
const res = (type: string, name: string) => tfBlock(M + 'main.tf', mod, 'resource', type, name);
const app = () => res('azurerm_container_app', 'api');
const container = () => need(tfChild(app(), 'template').blocks.find((b) => b.type === 'container'), 'Add a container { … } block');
const roles = () => findBlocks(mod, 'resource', 'azurerm_role_assignment');
const TAGGED = ['azurerm_resource_group.main', 'azurerm_container_registry.acr', 'azurerm_user_assigned_identity.app', 'azurerm_log_analytics_workspace.logs', 'azurerm_key_vault.main', 'azurerm_container_app_environment.main', 'azurerm_container_app.api'];
const NAMED = TAGGED.filter((a) => a !== 'azurerm_container_app.api');
const at = (address: string) => { const [t, n] = address.split('.'); return res(t, n); };

describe('module: versions and inputs', () => {
  it('every module file parses', () => {
    expect(files.map((f) => f.error).filter(Boolean)).toEqual([]);
  });
  it('declares pinned providers and configures none', () => {
    const req = need(tfBlock(M + 'versions.tf', versions, 'terraform').blocks.find((b) => b.type === 'required_providers'), 'versions.tf: add required_providers');
    for (const [name, src] of [['azurerm', 'hashicorp/azurerm'], ['random', 'hashicorp/random']]) {
      expect(hclText(tfEntry(req.attributes[name], 'source')), name + ' source').toBe(JSON.stringify(src));
      expect(hclText(tfEntry(req.attributes[name], 'version')).startsWith('"~>'), name + ' pinned with ~>').toBe(true);
    }
    expect(findBlocks(mod, 'provider').length, 'No provider blocks in a module').toBe(0);
    expect(mod.blocks.filter((b) => b.type === 'terraform').flatMap((b) => b.blocks).filter((b) => b.type === 'backend').length, 'No backend in a module').toBe(0);
  });
  it('types and describes every input', () => {
    for (const [name, type] of [['environment', 'string'], ['location', 'string'], ['image_tag', 'string'], ['min_replicas', 'number'], ['max_replicas', 'number']]) {
      const v = tfBlock(M + 'variables.tf', mod, 'variable', name);
      expect(tfText(v, 'type'), name + ': type = ' + type).toBe(type);
      expect(tfText(v, 'description'), name + ': description').not.toBe('');
    }
  });
  it('validates the environment and refuses latest', () => {
    const env = tfChild(tfBlock(M + 'variables.tf', mod, 'variable', 'environment'), 'validation');
    expect(tfText(env, 'condition').includes('"dev"') && tfText(env, 'condition').includes('"prod"'), 'environment: dev or prod').toBe(true);
    const tag = tfChild(tfBlock(M + 'variables.tf', mod, 'variable', 'image_tag'), 'validation');
    expect(tfText(tag, 'condition'), 'image_tag validation must reject "latest"').toContain('"latest"');
  });
});

describe('module: resources', () => {
  it('names everything from the environment and tags everything', () => {
    expect(hclText(tfEntry(tfBlock(M + 'main.tf', mod, 'locals').attributes.tags, 'environment')), 'locals.tags.environment = var.environment').toBe('var.environment');
    for (const a of NAMED) expect(tfText(at(a), 'name').includes('var.environment'), a + ': name built from var.environment').toBe(true);
    for (const a of TAGGED) expect(tfText(at(a), 'tags'), a + ': tags = local.tags').toBe('local.tags');
  });
  it('types in no ids, names or regions', () => {
    expect(read(M + 'main.tf').includes('/subscriptions/'), 'no typed resource ids').toBe(false);
    const literalLocations = mod.blocks.filter((b) => b.type === 'resource' && b.attributes.location?.type === 'string').map((b) => b.labels.join('.'));
    expect(literalLocations, 'locations come from var.location or a reference').toEqual([]);
  });
  it('pulls images with the identity: AcrPull on the registry, no admin user', () => {
    expect(tfValue(res('azurerm_container_registry', 'acr'), 'admin_enabled'), 'admin_enabled = false').toBe(false);
    const r = res('azurerm_role_assignment', 'acr_pull');
    expect([tfValue(r, 'role_definition_name'), tfText(r, 'scope'), tfText(r, 'principal_id'), tfValue(r, 'principal_type')])
      .toEqual(['AcrPull', 'azurerm_container_registry.acr.id', 'azurerm_user_assigned_identity.app.principal_id', 'ServicePrincipal']);
  });
  it('protects a tenant-bound RBAC vault from deletion', () => {
    const kv = res('azurerm_key_vault', 'main');
    expect(tfText(kv, 'tenant_id')).toBe('data.azurerm_client_config.current.tenant_id');
    expect(tfValue(kv, 'enable_rbac_authorization') === true || tfValue(kv, 'rbac_authorization_enabled') === true, 'RBAC authorization').toBe(true);
    expect(tfValue(kv, 'purge_protection_enabled'), 'purge_protection_enabled = true').toBe(true);
    expect(tfValue(tfChild(kv, 'lifecycle'), 'prevent_destroy'), 'lifecycle { prevent_destroy = true }').toBe(true);
  });
  it('grants exactly three narrowly scoped roles', () => {
    const reader = res('azurerm_role_assignment', 'kv_reader');
    expect([tfValue(reader, 'role_definition_name'), tfText(reader, 'scope'), tfText(reader, 'principal_id')])
      .toEqual(['Key Vault Secrets User', 'azurerm_key_vault.main.id', 'azurerm_user_assigned_identity.app.principal_id']);
    const deployer = res('azurerm_role_assignment', 'deployer_secrets');
    expect([tfValue(deployer, 'role_definition_name'), tfText(deployer, 'scope'), tfText(deployer, 'principal_id')])
      .toEqual(['Key Vault Secrets Officer', 'azurerm_key_vault.main.id', 'data.azurerm_client_config.current.object_id']);
    expect(roles().map((b) => b.labels[1]).sort(), 'only acr_pull, kv_reader and deployer_secrets').toEqual(['acr_pull', 'deployer_secrets', 'kv_reader']);
  });
  it('generates the database password straight into Key Vault', () => {
    expect(Number(tfValue(res('random_password', 'db'), 'length') ?? 0), 'random_password length ≥ 24').toBeGreaterThanOrEqual(24);
    const s = res('azurerm_key_vault_secret', 'db_password');
    expect(tfText(s, 'value'), 'value = random_password.db.result').toBe('random_password.db.result');
    expect(tfText(s, 'depends_on'), 'depends_on the deployer role').toContain('azurerm_role_assignment.deployer_secrets');
    expect(read(M + 'main.tf').includes('Pr0d-P@ss') || findBlocks(mod, 'variable', 'db_password').length > 0, 'no typed password, no password variable').toBe(false);
  });
  it('sends platform logs to the workspace', () => {
    expect(tfText(res('azurerm_container_app_environment', 'main'), 'log_analytics_workspace_id')).toBe('azurerm_log_analytics_workspace.logs.id');
  });
});

describe('module: the container app', () => {
  it('uses the identity for its image and its secret', () => {
    expect(tfText(tfChild(app(), 'identity'), 'identity_ids')).toBe('[azurerm_user_assigned_identity.app.id]');
    const reg = tfChild(app(), 'registry');
    expect([tfText(reg, 'server'), tfText(reg, 'identity')]).toEqual(['azurerm_container_registry.acr.login_server', 'azurerm_user_assigned_identity.app.id']);
    expect('password_secret_name' in reg.attributes, 'no registry password').toBe(false);
    const secret = tfChild(app(), 'secret');
    expect([tfValue(secret, 'name'), tfText(secret, 'key_vault_secret_id'), tfText(secret, 'identity')])
      .toEqual(['db-password', 'azurerm_key_vault_secret.db_password.versionless_id', 'azurerm_user_assigned_identity.app.id']);
    expect('value' in secret.attributes, 'no inline secret value').toBe(false);
  });
  it('runs the tagged image with the secret, probes and size', () => {
    const c = container();
    expect(tfText(c, 'image').includes('var.image_tag') && tfText(c, 'image').includes('azurerm_container_registry.acr.login_server'), 'image from login_server and var.image_tag').toBe(true);
    expect([tfValue(c, 'cpu'), tfValue(c, 'memory')]).toEqual([0.5, '1Gi']);
    const env = c.blocks.find((b) => b.type === 'env' && tfValue(b, 'name') === 'Database__Password');
    expect(env ? tfValue(env, 'secret_name') : undefined, 'env Database__Password with secret_name = "db-password"').toBe('db-password');
    expect(tfValue(tfChild(c, 'readiness_probe'), 'path')).toBe('/health/ready');
    expect(tfValue(tfChild(c, 'liveness_probe'), 'path')).toBe('/health/live');
  });
  it('serves on 8080 and scales within the variables', () => {
    expect(tfValue(tfChild(app(), 'ingress'), 'target_port')).toBe(8080);
    const t = tfChild(app(), 'template');
    expect([tfText(t, 'min_replicas'), tfText(t, 'max_replicas')]).toEqual(['var.min_replicas', 'var.max_replicas']);
  });
  it('waits for both of its roles', () => {
    const d = tfText(app(), 'depends_on');
    expect(d.includes('azurerm_role_assignment.acr_pull') && d.includes('azurerm_role_assignment.kv_reader'), 'depends_on = [acr_pull, kv_reader]').toBe(true);
  });
  it('outputs the URL and registry, and no secrets', () => {
    expect(tfText(tfBlock(M + 'outputs.tf', mod, 'output', 'app_url'), 'value')).toContain('azurerm_container_app.api.latest_revision_fqdn');
    expect(tfText(tfBlock(M + 'outputs.tf', mod, 'output', 'acr_login_server'), 'value')).toBe('azurerm_container_registry.acr.login_server');
    expect(findBlocks(mod, 'output').filter((o) => ['random_password', 'db_password.value'].some((s) => tfText(o, 'value').includes(s))).length, 'no output reveals the password').toBe(0);
  });
});

for (const [env, min, max] of [['dev', 0, 3], ['prod', 2, 10]] as const) {
  describe('envs/' + env, () => {
    const path = 'envs/' + env + '/main.tf';
    const f = hclFile(path);
    it('keeps its own state, reached with Entra ID', () => {
      expect(f.error).toBe('');
      const tfb = tfBlock(path, f.body, 'terraform');
      const b = need(tfb.blocks.find((x) => x.type === 'backend' && x.labels[0] === 'azurerm'), path + ': add backend "azurerm"');
      expect(tfValue(b, 'key'), 'key = "bookings/' + env + '.tfstate"').toBe('bookings/' + env + '.tfstate');
      expect([tfValue(b, 'resource_group_name'), tfValue(b, 'storage_account_name'), tfValue(b, 'container_name')]).toEqual(['rg-tfstate', 'sttfstatebookings', 'tfstate']);
      expect(tfValue(b, 'use_azuread_auth'), 'use_azuread_auth = true').toBe(true);
      expect(Object.keys(b.attributes).filter((k) => ['access_key', 'sas_token'].includes(k)), 'no keys').toEqual([]);
    });
    it('configures the provider and calls the module with ' + env + ' settings', () => {
      expect(tfBlock(path, f.body, 'provider', 'azurerm').blocks.some((b) => b.type === 'features'), 'provider "azurerm" { features {} }').toBe(true);
      const req = need(tfBlock(path, f.body, 'terraform').blocks.find((b) => b.type === 'required_providers'), 'required_providers');
      expect(hclText(tfEntry(req.attributes.azurerm, 'version')).startsWith('"~>'), 'pin azurerm').toBe(true);
      const m = tfBlock(path, f.body, 'module', 'bookings');
      expect(tfValue(m, 'source')).toBe('../../modules/bookings');
      expect(tfValue(m, 'environment')).toBe(env);
      expect(tfText(m, 'image_tag')).toBe('var.image_tag');
      expect([tfValue(m, 'min_replicas'), tfValue(m, 'max_replicas')], env + ' replicas ' + min + ' to ' + max).toEqual([min, max]);
    });
    it('only composes', () => {
      expect(findBlocks(f.body, 'resource').length, 'no resources in a root').toBe(0);
      expect(tfText(tfBlock(path, f.body, 'output', 'app_url'), 'value')).toBe('module.bookings.app_url');
    });
  });
}

describe('repository', () => {
  it('ignores state and the provider cache, but commits the lock file', () => {
    expect(ignores('.gitignore', '.terraform'), 'ignore .terraform/').toBe(true);
    expect(ignores('.gitignore', '*.tfstate'), 'ignore *.tfstate').toBe(true);
    expect(ignores('.gitignore', '.terraform.lock.hcl') || ignores('.gitignore', '*.hcl'), 'commit .terraform.lock.hcl — do not ignore it').toBe(false);
  });
});
`;

const given = [
  pf('README.md', README, { editable: false }),
  pf('legacy/main.tf', LEGACY, { editable: false }),
  pf('inspect.ts', INSPECT, { editable: false }),
];

const task: ProjectTask = {
  id: 'se-cs-m5-003',
  title: 'Week 19: Rebuild the Cloud',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 5 · Cloud, DevOps & Delivery',
  tags: ['Terraform', 'infrastructure as code', 'modules', 'remote state'],
  prompt:
    'Turn a hand-written, prod-only Terraform file into code a team can own: a bookings module with typed, validated inputs, every ' +
    'name derived from the environment, an identity with exactly three narrowly scoped roles, a protected RBAC Key Vault holding a ' +
    'generated password, and a Container App wired entirely by reference — plus thin dev and prod roots with separate, Entra-authenticated ' +
    'remote state, and a .gitignore that keeps state out of git but the lock file in.',
  hints: [
    'Start by moving each legacy resource into modules/bookings/main.tf and replacing every typed name, region and id with a variable or a reference.',
    'Tasks ops-5-09 to ops-5-12 each cover one part: settings and variables, wiring the app, the environment roots, and secrets.',
    'The grader merges the four module files, as Terraform does — put each block in whichever file the README names.',
    'dev: min_replicas = 0, max_replicas = 3; prod: min_replicas = 2, max_replicas = 10. Everything else about the roots is identical apart from the backend key and environment.',
  ],
  files: [
    ...given,
    pf(M('versions.tf'), TODO('required_providers for azurerm and random')),
    pf(M('variables.tf'), TODO('the module inputs')),
    pf(M('main.tf'), TODO('every resource, rebuilt from legacy/main.tf')),
    pf(M('outputs.tf'), TODO('app_url and acr_login_server')),
    pf('envs/dev/main.tf', TODO('backend, provider and the module for dev')),
    pf('envs/prod/main.tf', TODO('backend, provider and the module for prod')),
    pf('.gitignore', GITIGNORE_STARTER, { language: 'plaintext' }),
  ],
  solutionFiles: [
    ...given,
    pf(M('versions.tf'), VERSIONS),
    pf(M('variables.tf'), VARIABLES),
    pf(M('main.tf'), MAIN),
    pf(M('outputs.tf'), OUTPUTS),
    pf('envs/dev/main.tf', root('dev', 0, 3)),
    pf('envs/prod/main.tf', root('prod', 2, 10)),
    pf('.gitignore', GITIGNORE, { language: 'plaintext' }),
  ],
  targets: [{ id: 'config', label: 'Terraform', kind: 'typescript', entry: 'inspect.ts', testCode: TESTS }],
};

function M(file: string): string {
  return 'modules/bookings/' + file;
}

export default task;
