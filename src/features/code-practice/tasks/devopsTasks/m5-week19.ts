import type { CodeTask } from '../codeTypes';

const CATEGORY = 'Month 5 · Cloud & DevOps';

/** Grader preamble for Terraform tasks. Graders never contain a dollar-brace sequence (they are
 *  embedded in template literals); template-ness is read from the parser's `template` flag. */
const TF_HELPERS = (file: string) => `import { describe, it, expect } from 'vitest';
import { readFile, parseHcl, findBlocks, hclText, type HclBody, type HclBlock, type HclValue } from 'dw:project';

const source = readFile('${file}');
const parsed = parseHcl(source);
const tf: HclBody = parsed.ok ? parsed.value : { attributes: {}, blocks: [] };
function need<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) throw new Error(message);
  return value;
}
const block = (type: string, ...labels: string[]): HclBlock =>
  need(findBlocks(tf, type, ...labels)[0], 'Add ' + [type, ...labels.map((l) => '"' + l + '"')].join(' ') + ' { … }');
const resource = (type: string, name: string) => block('resource', type, name);
const text = (b: { attributes: Record<string, HclValue> }, attr: string): string => hclText(b.attributes[attr]);
const child = (b: HclBlock, type: string): HclBlock => need(b.blocks.find((x) => x.type === type), 'Add ' + ('aeiou'.includes(type[0]) ? 'an ' : 'a ') + type + ' { … } block inside ' + [b.type, ...b.labels].join(' '));
const literal = (v: HclValue | undefined): boolean => !!v && ((v.type === 'string' && !v.template) || v.type === 'number' || v.type === 'bool');
const value = (b: { attributes: Record<string, HclValue> }, attr: string): unknown => {
  const v = b.attributes[attr];
  return v && (v.type === 'string' || v.type === 'number' || v.type === 'bool') ? v.value : undefined;
};
const objectEntry = (v: HclValue | undefined, key: string): HclValue | undefined => (v && v.type === 'object' ? v.entries[key] : undefined);
const provider = (name: string) => {
  const tfBlock = need(findBlocks(tf, 'terraform')[0], 'Add a terraform { … } block');
  const req = need(tfBlock.blocks.find((b) => b.type === 'required_providers'), 'Add required_providers inside terraform { … }');
  return { tfBlock, entry: req.attributes[name] };
};
`;

/** Month 5, week 19 (lessons dn5-5, dn5-6): infrastructure as code with Terraform. */
export const DEVOPS_WEEK_19: CodeTask[] = [
  {
    id: 'ops-5-09',
    title: 'Your First Terraform Configuration',
    difficulty: 'Medium',
    language: 'config',
    fileName: 'main.tf',
    category: CATEGORY,
    prompt:
      'The starter main.tf creates the resource group and registry, but only for production, with every value typed in twice, an ' +
      'unpinned provider, a subscription id committed to the repository and the registry admin user switched on. Rewrite it: ' +
      '(1) a terraform block with required_version (">= 1.9") and required_providers pinning hashicorp/azurerm with a pessimistic ' +
      'constraint ("~> 4.0"); (2) provider "azurerm" with features {} and no subscription_id (it comes from the ARM_SUBSCRIPTION_ID ' +
      'environment variable); (3) variable "environment" (type string, a description, and a validation block that only accepts dev or ' +
      'prod) and variable "location" (type string, a description, default westeurope); (4) locals { tags = { … } } including ' +
      'environment = var.environment; (5) the resource group named "rg-bookings-<environment>" with location = var.location and the tags; ' +
      '(6) the registry named "acrbookings<environment>", taking its resource group and location by reference to the resource group ' +
      'resource, with admin_enabled = false and the tags; (7) output "acr_login_server" with a description.',
    starterCode: `provider "azurerm" {
  features {}
  subscription_id = "00000000-0000-0000-0000-000000000000"
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
`,
    hints: [
      'terraform { required_version = ">= 1.9"  required_providers { azurerm = { source = "hashicorp/azurerm", version = "~> 4.0" } } }',
      'validation { condition = contains(["dev", "prod"], var.environment)  error_message = "environment must be dev or prod." }',
      'Interpolate inside strings: name = "rg-bookings-$' + '{var.environment}".',
      'resource_group_name = azurerm_resource_group.main.name — a reference, which also tells Terraform to create the group first.',
    ],
    solution: `terraform {
  required_version = ">= 1.9"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

# subscription_id comes from ARM_SUBSCRIPTION_ID, so the same code targets any subscription.
provider "azurerm" {
  features {}
}

variable "environment" {
  type        = string
  description = "Deployment environment: dev or prod."
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

locals {
  tags = {
    app         = "bookings"
    environment = var.environment
    managed_by  = "terraform"
  }
}

resource "azurerm_resource_group" "main" {
  name     = "rg-bookings-\${var.environment}"
  location = var.location
  tags     = local.tags
}

resource "azurerm_container_registry" "acr" {
  name                = "acrbookings\${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = false
  tags                = local.tags
}

output "acr_login_server" {
  description = "Registry host name, for image references and docker push."
  value       = azurerm_container_registry.acr.login_server
}
`,
    testCode: TF_HELPERS('main.tf') + `
describe('settings', () => {
  it('pins Terraform and the azurerm provider', () => {
    expect(parsed.ok ? '' : parsed.error, 'main.tf must parse').toBe('');
    const { tfBlock, entry } = provider('azurerm');
    expect(text(tfBlock, 'required_version'), 'required_version = ">= 1.9"').not.toBe('');
    expect(hclText(objectEntry(entry, 'source')), 'source = "hashicorp/azurerm"').toBe('"hashicorp/azurerm"');
    expect(hclText(objectEntry(entry, 'version')).startsWith('"~>'), 'version = "~> 4.0" — a pessimistic constraint takes fixes, not breaking majors').toBe(true);
  });
  it('configures the provider without committing a subscription id', () => {
    const p = block('provider', 'azurerm');
    expect(p.blocks.some((b) => b.type === 'features'), 'features {} is required').toBe(true);
    expect('subscription_id' in p.attributes, 'Remove subscription_id — set ARM_SUBSCRIPTION_ID instead').toBe(false);
  });
});

describe('inputs', () => {
  it('validates the environment', () => {
    const v = block('variable', 'environment');
    expect(text(v, 'type'), 'type = string').toBe('string');
    expect(text(v, 'description'), 'describe every variable').not.toBe('');
    const check = child(v, 'validation');
    expect(text(check, 'condition').includes('var.environment') && text(check, 'condition').includes('"prod"') && text(check, 'condition').includes('"dev"'), 'condition = contains(["dev", "prod"], var.environment)').toBe(true);
    expect(text(check, 'error_message'), 'error_message').not.toBe('');
  });
  it('takes the location as a described variable', () => {
    const v = block('variable', 'location');
    expect(text(v, 'type')).toBe('string');
    expect(text(v, 'description'), 'description').not.toBe('');
  });
  it('defines shared tags once', () => {
    const l = block('locals');
    expect(hclText(objectEntry(l.attributes.tags, 'environment')), 'locals { tags = { environment = var.environment, … } }').toBe('var.environment');
  });
});

describe('resources', () => {
  it('names the resource group per environment', () => {
    const rg = resource('azurerm_resource_group', 'main');
    expect(rg.attributes.name?.type === 'string' && rg.attributes.name.template && text(rg, 'name').includes('var.environment'), 'name = "rg-bookings-<environment>" built from var.environment').toBe(true);
    expect(text(rg, 'location'), 'location = var.location').toBe('var.location');
    expect(text(rg, 'tags'), 'tags = local.tags').toBe('local.tags');
  });
  it('builds the registry from references, with no admin user', () => {
    const acr = resource('azurerm_container_registry', 'acr');
    expect(text(acr, 'resource_group_name'), 'resource_group_name = azurerm_resource_group.main.name').toBe('azurerm_resource_group.main.name');
    expect(text(acr, 'location'), 'location = azurerm_resource_group.main.location').toBe('azurerm_resource_group.main.location');
    expect(text(acr, 'name').includes('var.environment'), 'name built from var.environment').toBe(true);
    expect(value(acr, 'admin_enabled'), 'admin_enabled = false').toBe(false);
    expect(text(acr, 'tags'), 'tags = local.tags').toBe('local.tags');
  });
  it('types nothing in twice', () => {
    const literals = ['westeurope', 'rg-bookings-prod', 'acrbookingsprod'].filter((s) => tf.blocks.some((b) => b.type === 'resource' && Object.values(b.attributes).some((v) => literal(v) && hclText(v) === JSON.stringify(s))));
    expect(literals, 'Resources take names and locations from variables and references').toEqual([]);
  });
  it('outputs the registry login server', () => {
    const o = block('output', 'acr_login_server');
    expect(text(o, 'value')).toBe('azurerm_container_registry.acr.login_server');
    expect(text(o, 'description'), 'describe outputs too').not.toBe('');
  });
});
`,
  },
  {
    id: 'ops-5-10',
    title: 'Wire a Container App Together by Reference',
    difficulty: 'Hard',
    language: 'config',
    fileName: 'main.tf',
    category: CATEGORY,
    prompt:
      'The top of main.tf (settings, variables, tags, resource group, registry) is done. The Container Apps part was written by copying ids ' +
      'out of the portal and still uses the registry admin password. Replace it with resources that refer to each other: ' +
      '(1) azurerm_user_assigned_identity "app"; (2) azurerm_role_assignment "acr_pull" — AcrPull, scope azurerm_container_registry.acr.id, ' +
      'principal_id from the identity, principal_type "ServicePrincipal"; (3) azurerm_log_analytics_workspace "logs" (PerGB2018, 30 days) ' +
      'and the environment\'s log_analytics_workspace_id pointing at it; (4) the app\'s identity block (UserAssigned, identity_ids = [the ' +
      'identity\'s id]) and registry block (server = the registry\'s login_server, identity = the identity\'s id) — no secret, username or ' +
      'password_secret_name; (5) ingress on target_port 8080; (6) one container "api" whose image is "<login_server>/bookings-api:<var.image_tag>", ' +
      '0.5 CPU / "1Gi", with readiness (/health/ready) and liveness (/health/live) probes on 8080, and min_replicas of at least 1; ' +
      '(7) depends_on = [azurerm_role_assignment.acr_pull] on the app — nothing else tells Terraform the first image pull needs that role; ' +
      '(8) output "app_url" built from the app\'s latest_revision_fqdn. Every name comes from var.environment; no "/subscriptions/…" id ' +
      'is typed anywhere.',
    starterCode: `terraform {
  required_version = ">= 1.9"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}

variable "environment" {
  type        = string
  description = "dev or prod."
}

variable "location" {
  type        = string
  description = "Azure region."
  default     = "westeurope"
}

variable "image_tag" {
  type        = string
  description = "Commit SHA of the image to run."
}

locals {
  tags = { app = "bookings", environment = var.environment }
}

resource "azurerm_resource_group" "main" {
  name     = "rg-bookings-\${var.environment}"
  location = var.location
  tags     = local.tags
}

resource "azurerm_container_registry" "acr" {
  name                = "acrbookings\${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
  tags                = local.tags
}

# ---- TODO: everything below was copied from the portal ----

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
    target_port      = 80
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
`,
    hints: [
      'A reference such as azurerm_container_registry.acr.id is both a value and a dependency: Terraform creates the registry before anything that reads its id.',
      'principal_id = azurerm_user_assigned_identity.app.principal_id; identity_ids = [azurerm_user_assigned_identity.app.id] — the principal id is for role assignments, the resource id is for attaching the identity.',
      'Nothing in the container app reads from the role assignment, so Terraform could create both at once and the first pull would fail with 401: add depends_on = [azurerm_role_assignment.acr_pull].',
      'image = "$' + '{azurerm_container_registry.acr.login_server}/bookings-api:$' + '{var.image_tag}"; probes: readiness_probe { transport = "HTTP"  path = "/health/ready"  port = 8080 }.',
    ],
    solution: `terraform {
  required_version = ">= 1.9"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}

variable "environment" {
  type        = string
  description = "dev or prod."
}

variable "location" {
  type        = string
  description = "Azure region."
  default     = "westeurope"
}

variable "image_tag" {
  type        = string
  description = "Commit SHA of the image to run."
}

locals {
  tags = { app = "bookings", environment = var.environment }
}

resource "azurerm_resource_group" "main" {
  name     = "rg-bookings-\${var.environment}"
  location = var.location
  tags     = local.tags
}

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

  ingress {
    external_enabled = true
    target_port      = 8080
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 1
    max_replicas = 5

    container {
      name   = "api"
      image  = "\${azurerm_container_registry.acr.login_server}/bookings-api:\${var.image_tag}"
      cpu    = 0.5
      memory = "1Gi"

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

  # The first revision pulls its image as the identity, so AcrPull must exist first. No attribute
  # here reads from the role assignment, so the dependency has to be stated.
  depends_on = [azurerm_role_assignment.acr_pull]
}

output "app_url" {
  description = "Public URL of the API."
  value       = "https://\${azurerm_container_app.api.latest_revision_fqdn}"
}
`,
    testCode: TF_HELPERS('main.tf') + `
const app = () => resource('azurerm_container_app', 'api');
const template = () => child(app(), 'template');
const container = () => need(template().blocks.find((b) => b.type === 'container'), 'Add a container { … } block');

describe('identity and access', () => {
  it('creates a user-assigned identity per environment', () => {
    expect(parsed.ok ? '' : parsed.error, 'main.tf must parse').toBe('');
    expect(text(resource('azurerm_user_assigned_identity', 'app'), 'name').includes('var.environment'), 'name built from var.environment').toBe(true);
  });
  it('grants AcrPull on the registry to that identity, by reference', () => {
    const r = resource('azurerm_role_assignment', 'acr_pull');
    expect(text(r, 'role_definition_name')).toBe('"AcrPull"');
    expect(text(r, 'scope'), 'scope = azurerm_container_registry.acr.id').toBe('azurerm_container_registry.acr.id');
    expect(text(r, 'principal_id'), 'principal_id = azurerm_user_assigned_identity.app.principal_id').toBe('azurerm_user_assigned_identity.app.principal_id');
    expect(text(r, 'principal_type'), 'principal_type = "ServicePrincipal"').toBe('"ServicePrincipal"');
  });
  it('turns the registry admin user off', () => {
    expect(value(resource('azurerm_container_registry', 'acr'), 'admin_enabled'), 'admin_enabled = false').toBe(false);
  });
});

describe('the environment', () => {
  it('sends logs to a workspace defined here', () => {
    const w = resource('azurerm_log_analytics_workspace', 'logs');
    expect(text(w, 'sku')).toBe('"PerGB2018"');
    const env = resource('azurerm_container_app_environment', 'main');
    expect(text(env, 'log_analytics_workspace_id'), 'log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id').toBe('azurerm_log_analytics_workspace.logs.id');
    expect(text(env, 'name').includes('var.environment') && text(env, 'resource_group_name') === 'azurerm_resource_group.main.name', 'name from var.environment, group by reference').toBe(true);
  });
});

describe('the container app', () => {
  it('runs as the identity and pulls with it', () => {
    const id = child(app(), 'identity');
    expect(text(id, 'type')).toBe('"UserAssigned"');
    expect(text(id, 'identity_ids'), 'identity_ids = [azurerm_user_assigned_identity.app.id]').toBe('[azurerm_user_assigned_identity.app.id]');
    const reg = child(app(), 'registry');
    expect(text(reg, 'server'), 'server = azurerm_container_registry.acr.login_server').toBe('azurerm_container_registry.acr.login_server');
    expect(text(reg, 'identity'), 'identity = azurerm_user_assigned_identity.app.id').toBe('azurerm_user_assigned_identity.app.id');
    expect(Object.keys(reg.attributes).filter((k) => k === 'username' || k === 'password_secret_name'), 'no username or password').toEqual([]);
    expect(app().blocks.filter((b) => b.type === 'secret').length, 'no secret blocks with copied passwords').toBe(0);
  });
  it('references its environment instead of a typed id', () => {
    expect(text(app(), 'container_app_environment_id')).toBe('azurerm_container_app_environment.main.id');
    expect(source.includes('/subscriptions/'), 'No /subscriptions/… ids typed into the file').toBe(false);
  });
  it('serves on 8080', () => {
    const ingress = child(app(), 'ingress');
    expect(value(ingress, 'target_port'), 'target_port = 8080').toBe(8080);
    expect(value(ingress, 'allow_insecure_connections') === true, 'no insecure connections').toBe(false);
  });
  it('runs the tagged image at a valid size, warm', () => {
    const c = container();
    const image = c.attributes.image;
    expect(image?.type === 'string' && image.template && text(c, 'image').includes('azurerm_container_registry.acr.login_server') && text(c, 'image').includes('var.image_tag'), 'image = "<login_server>/bookings-api:<var.image_tag>"').toBe(true);
    expect([value(c, 'cpu'), value(c, 'memory')], 'cpu = 0.5, memory = "1Gi"').toEqual([0.5, '1Gi']);
    expect(Number(value(template(), 'min_replicas') ?? 0), 'min_replicas = 1 or more').toBeGreaterThanOrEqual(1);
  });
  it('probes readiness and liveness', () => {
    const c = container();
    expect(text(child(c, 'readiness_probe'), 'path'), 'readiness_probe path /health/ready').toBe('"/health/ready"');
    expect(text(child(c, 'liveness_probe'), 'path'), 'liveness_probe path /health/live').toBe('"/health/live"');
    expect(value(child(c, 'readiness_probe'), 'port'), 'probes on port 8080').toBe(8080);
  });
  it('waits for the AcrPull role', () => {
    expect(text(app(), 'depends_on'), 'depends_on = [azurerm_role_assignment.acr_pull]').toContain('azurerm_role_assignment.acr_pull');
  });
  it('outputs its URL', () => {
    expect(text(block('output', 'app_url'), 'value'), 'value built from azurerm_container_app.api.latest_revision_fqdn').toContain('azurerm_container_app.api.latest_revision_fqdn');
  });
});
`,
  },
  {
    id: 'ops-5-11',
    title: 'An Environment Root: Remote State and a Module',
    difficulty: 'Medium',
    language: 'config',
    fileName: 'envs/prod/main.tf',
    category: CATEGORY,
    prompt:
      'The team copied envs/dev/main.tf into envs/prod/main.tf and edited names by hand; state lives on someone\'s laptop. All the resources ' +
      'now live in a module at modules/bookings (inputs: environment, location, image_tag, min_replicas, max_replicas; output: app_url). ' +
      'Rewrite envs/prod/main.tf as a thin root: (1) a terraform block with required_version and azurerm pinned "~> 4.0"; (2) a backend ' +
      '"azurerm" storing state in resource group rg-tfstate, storage account sttfstatebookings, container tfstate, key ' +
      '"bookings/prod.tfstate", with use_azuread_auth = true and no access_key or sas_token; (3) the provider "azurerm" block (with ' +
      'features {}) — providers are configured in roots, never in modules; (4) variable "image_tag" (string, described: the pipeline passes ' +
      'it); (5) module "bookings" with source "../../modules/bookings", environment "prod", location westeurope, image_tag = var.image_tag, ' +
      'min_replicas 2 and max_replicas 10; (6) output "app_url" from the module. No resource blocks: the root only composes.',
    starterCode: `# Copied from envs/dev and edited for prod.
terraform {
  required_providers {
    azurerm = {
      source = "hashicorp/azurerm"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "main" {
  name     = "rg-bookings-prod"
  location = "westeurope"
}

resource "azurerm_container_registry" "acr" {
  name                = "acrbookingsprod"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = false
}

# ... 150 more lines copied from dev ...
`,
    hints: [
      'backend "azurerm" { resource_group_name = "rg-tfstate"  storage_account_name = "sttfstatebookings"  container_name = "tfstate"  key = "bookings/prod.tfstate"  use_azuread_auth = true } goes inside terraform { }.',
      'Backend settings cannot use variables — they are read before anything else. Each environment\'s root has its own key.',
      'module "bookings" { source = "../../modules/bookings"  environment = "prod" … } — a local path source takes no version argument.',
      'output "app_url" { value = module.bookings.app_url }',
    ],
    solution: `terraform {
  required_version = ">= 1.9"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  # Shared, locked, encrypted state: one blob per environment, reached with Entra ID, not a storage key.
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "sttfstatebookings"
    container_name       = "tfstate"
    key                  = "bookings/prod.tfstate"
    use_azuread_auth     = true
  }
}

provider "azurerm" {
  features {}
}

variable "image_tag" {
  type        = string
  description = "Commit SHA of the image to deploy; passed by the pipeline."
}

module "bookings" {
  source = "../../modules/bookings"

  environment  = "prod"
  location     = "westeurope"
  image_tag    = var.image_tag
  min_replicas = 2
  max_replicas = 10
}

output "app_url" {
  description = "Public URL of the production API."
  value       = module.bookings.app_url
}
`,
    testCode: TF_HELPERS('envs/prod/main.tf') + `
const backend = () => need(provider('azurerm').tfBlock.blocks.find((b) => b.type === 'backend' && b.labels[0] === 'azurerm'), 'Add backend "azurerm" { … } inside terraform { … }');
const mod = () => block('module', 'bookings');

describe('settings', () => {
  it('pins Terraform and the provider', () => {
    expect(parsed.ok ? '' : parsed.error, 'main.tf must parse').toBe('');
    const { tfBlock, entry } = provider('azurerm');
    expect(text(tfBlock, 'required_version'), 'required_version').not.toBe('');
    expect(hclText(objectEntry(entry, 'version')).startsWith('"~>'), 'version = "~> 4.0"').toBe(true);
  });
  it('keeps prod state in its own blob in the shared storage account', () => {
    const b = backend();
    expect([value(b, 'resource_group_name'), value(b, 'storage_account_name'), value(b, 'container_name')]).toEqual(['rg-tfstate', 'sttfstatebookings', 'tfstate']);
    expect(value(b, 'key'), 'key = "bookings/prod.tfstate"').toBe('bookings/prod.tfstate');
  });
  it('reaches state with Entra ID, not a storage key', () => {
    const b = backend();
    expect(value(b, 'use_azuread_auth'), 'use_azuread_auth = true').toBe(true);
    expect(Object.keys(b.attributes).filter((k) => ['access_key', 'sas_token', 'client_secret'].includes(k)), 'No keys or tokens in the backend').toEqual([]);
  });
  it('configures the provider here, in the root', () => {
    expect(block('provider', 'azurerm').blocks.some((b) => b.type === 'features'), 'provider "azurerm" { features {} }').toBe(true);
  });
});

describe('composition', () => {
  it('takes the image tag from the pipeline', () => {
    const v = block('variable', 'image_tag');
    expect(text(v, 'type')).toBe('string');
    expect(text(v, 'description')).not.toBe('');
  });
  it('uses the shared module by local path', () => {
    expect(value(mod(), 'source'), 'source = "../../modules/bookings"').toBe('../../modules/bookings');
    expect('version' in mod().attributes, 'A local path module takes no version').toBe(false);
  });
  it('passes prod settings in', () => {
    const m = mod();
    expect(value(m, 'environment')).toBe('prod');
    expect(value(m, 'location')).toBe('westeurope');
    expect(text(m, 'image_tag'), 'image_tag = var.image_tag').toBe('var.image_tag');
    expect(Number(value(m, 'min_replicas') ?? 0), 'min_replicas = 2 for production').toBe(2);
    expect(Number(value(m, 'max_replicas') ?? 0)).toBe(10);
  });
  it('only composes: no resources of its own', () => {
    expect(tf.blocks.filter((b) => b.type === 'resource').map((b) => b.labels.join('.')), 'Move resources into the module').toEqual([]);
    expect(text(block('output', 'app_url'), 'value'), 'value = module.bookings.app_url').toBe('module.bookings.app_url');
  });
});
`,
  },
  {
    id: 'ops-5-12',
    title: 'Keep Secrets Out of Terraform Code',
    difficulty: 'Hard',
    language: 'config',
    fileName: 'main.tf',
    category: CATEGORY,
    prompt:
      'The database password is a variable default in main.tf, written into Key Vault from there, and printed by an output. Fix it. ' +
      '(1) Generate the password: random_password "db" with length of at least 24 (add hashicorp/random, pinned "~> 3.6", to ' +
      'required_providers). (2) Store random_password.db.result in azurerm_key_vault_secret "db_password"; delete the db_password variable. ' +
      '(3) The vault: tenant_id from data "azurerm_client_config" "current", RBAC authorization (enable_rbac_authorization = true — newer ' +
      'provider versions call it rbac_authorization_enabled; either is accepted), purge_protection_enabled = true, and lifecycle { ' +
      'prevent_destroy = true }. (4) Whoever runs Terraform needs to write that secret: azurerm_role_assignment "deployer_secrets" with ' +
      '"Key Vault Secrets Officer" on the vault, for data.azurerm_client_config.current.object_id, and the secret depends_on it. (5) No output ' +
      'may reveal the password: output the secret\'s versionless_id instead, and mark sensitive = true any output that reads a password. ' +
      'Remember that the generated value still lives in Terraform state — the reason state is stored encrypted, access-controlled, and never in git.',
    starterCode: `terraform {
  required_version = ">= 1.9"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}

variable "environment" {
  type        = string
  description = "dev or prod."
}

variable "db_password" {
  type    = string
  default = "Pr0d-P@ssw0rd!"
}

resource "azurerm_resource_group" "main" {
  name     = "rg-bookings-\${var.environment}"
  location = "westeurope"
}

resource "azurerm_key_vault" "main" {
  name                = "kv-bookings-\${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = "11111111-1111-1111-1111-111111111111"
  sku_name            = "standard"
}

resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = var.db_password
  key_vault_id = azurerm_key_vault.main.id
}

output "db_password" {
  value = var.db_password
}
`,
    hints: [
      'resource "random_password" "db" { length = 32  special = true } — its result attribute is the generated value.',
      'data "azurerm_client_config" "current" {} exposes tenant_id and object_id of whoever is running Terraform.',
      'azurerm_key_vault_secret: value = random_password.db.result and depends_on = [azurerm_role_assignment.deployer_secrets] — on an RBAC vault, writing a secret needs a data-plane role even for the vault\'s creator.',
      'output "db_password_secret_id" { value = azurerm_key_vault_secret.db_password.versionless_id } — an id, not the value.',
    ],
    solution: `terraform {
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

provider "azurerm" {
  features {}
}

variable "environment" {
  type        = string
  description = "dev or prod."
}

data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "main" {
  name     = "rg-bookings-\${var.environment}"
  location = "westeurope"
}

resource "azurerm_key_vault" "main" {
  name                       = "kv-bookings-\${var.environment}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  enable_rbac_authorization  = true
  purge_protection_enabled   = true
  soft_delete_retention_days = 90

  lifecycle {
    prevent_destroy = true
  }
}

# The identity running Terraform (the pipeline) may manage secrets in this vault only.
resource "azurerm_role_assignment" "deployer_secrets" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# Generated, never typed. The value is still in state: state is a secret too.
resource "random_password" "db" {
  length  = 32
  special = true
}

resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = random_password.db.result
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.deployer_secrets]
}

output "db_password_secret_id" {
  description = "Versionless Key Vault reference for the app's configuration."
  value       = azurerm_key_vault_secret.db_password.versionless_id
}
`,
    testCode: TF_HELPERS('main.tf') + `
const vault = () => resource('azurerm_key_vault', 'main');
const secret = () => resource('azurerm_key_vault_secret', 'db_password');
const READS_SECRET = ['random_password.', 'var.db_password', 'db_password.value'];

describe('the password', () => {
  it('is generated, with a pinned random provider', () => {
    expect(parsed.ok ? '' : parsed.error, 'main.tf must parse').toBe('');
    expect(hclText(objectEntry(provider('random').entry, 'source')), 'random = { source = "hashicorp/random", version = "~> 3.6" }').toBe('"hashicorp/random"');
    expect(hclText(objectEntry(provider('random').entry, 'version')).startsWith('"~>'), 'pin the random provider').toBe(true);
    expect(Number(value(resource('random_password', 'db'), 'length') ?? 0), 'length = 24 or more').toBeGreaterThanOrEqual(24);
  });
  it('is never typed into the code', () => {
    expect(source.includes('Pr0d-P@ss'), 'Remove the typed password').toBe(false);
    expect(findBlocks(tf, 'variable', 'db_password').length, 'Delete the db_password variable').toBe(0);
    expect(literal(secret().attributes.value), 'The secret value must not be a literal').toBe(false);
  });
  it('goes straight into Key Vault', () => {
    expect(text(secret(), 'value'), 'value = random_password.db.result').toBe('random_password.db.result');
    expect(text(secret(), 'key_vault_id'), 'key_vault_id = azurerm_key_vault.main.id').toBe('azurerm_key_vault.main.id');
  });
  it('is never printed', () => {
    const leaking = tf.blocks.filter((b) => b.type === 'output' && READS_SECRET.some((r) => text(b, 'value').includes(r)) && value(b, 'sensitive') !== true).map((b) => b.labels[0]);
    expect(leaking, 'Outputs that read a password must be sensitive = true — better, output the secret id').toEqual([]);
    expect(text(block('output', 'db_password_secret_id'), 'value'), 'output the versionless_id').toBe('azurerm_key_vault_secret.db_password.versionless_id');
  });
});

describe('the vault', () => {
  it('belongs to the current tenant and uses RBAC', () => {
    expect(text(vault(), 'tenant_id'), 'tenant_id = data.azurerm_client_config.current.tenant_id').toBe('data.azurerm_client_config.current.tenant_id');
    expect(value(vault(), 'enable_rbac_authorization') === true || value(vault(), 'rbac_authorization_enabled') === true, 'enable_rbac_authorization = true').toBe(true);
  });
  it('cannot be lost by accident', () => {
    expect(value(vault(), 'purge_protection_enabled'), 'purge_protection_enabled = true').toBe(true);
    const lc = child(vault(), 'lifecycle');
    expect(value(lc, 'prevent_destroy'), 'lifecycle { prevent_destroy = true }').toBe(true);
  });
  it('lets the deployer write secrets to it, and only it', () => {
    const r = resource('azurerm_role_assignment', 'deployer_secrets');
    expect(value(r, 'role_definition_name')).toBe('Key Vault Secrets Officer');
    expect(text(r, 'scope'), 'scope = azurerm_key_vault.main.id').toBe('azurerm_key_vault.main.id');
    expect(text(r, 'principal_id'), 'principal_id = data.azurerm_client_config.current.object_id').toBe('data.azurerm_client_config.current.object_id');
    expect(text(secret(), 'depends_on'), 'the secret depends_on the role assignment').toContain('azurerm_role_assignment.deployer_secrets');
  });
});
`,
  },
];
