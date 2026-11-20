import type { CurriculumLesson } from '../curriculumDefinition';

const R = {
  tfIntro: { title: 'HashiCorp — What is Terraform?', url: 'https://developer.hashicorp.com/terraform/intro' },
  tfLanguage: { title: 'Terraform language documentation', url: 'https://developer.hashicorp.com/terraform/language' },
  tfAzureTutorial: { title: 'HashiCorp tutorials — Get started with Terraform on Azure', url: 'https://developer.hashicorp.com/terraform/tutorials/azure-get-started' },
  tfVariables: { title: 'Terraform — Input variables (types, validation, sensitive)', url: 'https://developer.hashicorp.com/terraform/language/values/variables' },
  tfVersions: { title: 'Terraform — Version constraints', url: 'https://developer.hashicorp.com/terraform/language/expressions/version-constraints' },
  tfState: { title: 'Terraform — State', url: 'https://developer.hashicorp.com/terraform/language/state' },
  tfSensitiveState: { title: 'Terraform — Sensitive data in state', url: 'https://developer.hashicorp.com/terraform/language/state/sensitive-data' },
  tfAzureBackend: { title: 'Terraform — The azurerm backend', url: 'https://developer.hashicorp.com/terraform/language/backend/azurerm' },
  tfModules: { title: 'Terraform — Creating modules', url: 'https://developer.hashicorp.com/terraform/language/modules/develop' },
  tfLifecycle: { title: 'Terraform — The lifecycle meta-argument', url: 'https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle' },
  tfImport: { title: 'Terraform — Import existing resources (import blocks)', url: 'https://developer.hashicorp.com/terraform/language/import' },
  azurerm: { title: 'Terraform Registry — AzureRM provider documentation', url: 'https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs' },
  azurermContainerApp: { title: 'Terraform Registry — azurerm_container_app', url: 'https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/container_app' },
  msTerraform: { title: 'Microsoft Learn — Terraform on Azure', url: 'https://learn.microsoft.com/en-us/azure/developer/terraform/' },
  msStateStorage: { title: 'Microsoft Learn — Store Terraform state in Azure Storage', url: 'https://learn.microsoft.com/en-us/azure/developer/terraform/store-state-in-azure-storage' },
  bicep: { title: 'Microsoft Learn — What is Bicep?', url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview' },
  opentofu: { title: 'OpenTofu documentation', url: 'https://opentofu.org/docs/' },
  upAndRunning: { title: 'Yevgeniy Brikman — Terraform: Up & Running (book site)', url: 'https://www.terraformupandrunning.com/' },
  ghaDocs: { title: 'GitHub Docs — Understanding GitHub Actions', url: 'https://docs.github.com/en/actions/about-github-actions/understanding-github-actions' },
  ghaDotnet: { title: 'GitHub Docs — Building and testing .NET', url: 'https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-net' },
  ghaHardening: { title: 'GitHub Docs — Security hardening for GitHub Actions', url: 'https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions' },
  ghaTokenPermissions: { title: 'GitHub Docs — Controlling permissions for GITHUB_TOKEN', url: 'https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token' },
  ghaOidcAzure: { title: 'GitHub Docs — Configuring OpenID Connect in Azure', url: 'https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-azure' },
  ghaEnvironments: { title: 'GitHub Docs — Managing environments for deployment', url: 'https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment' },
  ghaConcurrency: { title: 'GitHub Docs — Control the concurrency of workflows and jobs', url: 'https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs' },
  azureLoginOidc: { title: 'Microsoft Learn — Use GitHub Actions to connect to Azure (OIDC)', url: 'https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect' },
  dora: { title: 'DORA — Software delivery performance metrics', url: 'https://dora.dev/guides/dora-metrics-four-keys/' },
  cdBook: { title: 'Martin Fowler — Continuous Delivery', url: 'https://martinfowler.com/bliki/ContinuousDelivery.html' },
  otelDotnet: { title: 'OpenTelemetry — .NET getting started', url: 'https://opentelemetry.io/docs/languages/dotnet/getting-started/' },
  dotnetObservability: { title: 'Microsoft Learn — .NET observability with OpenTelemetry', url: 'https://learn.microsoft.com/en-us/dotnet/core/diagnostics/observability-with-otel' },
  dotnetLogging: { title: 'Microsoft Learn — Logging in .NET (message templates, high-performance logging)', url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/logging' },
  dotnetDistributedTracing: { title: 'Microsoft Learn — Distributed tracing in .NET (Activity, ActivitySource)', url: 'https://learn.microsoft.com/en-us/dotnet/core/diagnostics/distributed-tracing' },
  dotnetMetrics: { title: 'Microsoft Learn — Creating metrics in .NET (Meter, counters, histograms)', url: 'https://learn.microsoft.com/en-us/dotnet/core/diagnostics/metrics-instrumentation' },
  azureMonitorOtel: { title: 'Microsoft Learn — Enable Azure Monitor OpenTelemetry for .NET', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable?tabs=aspnetcore' },
  otelCollector: { title: 'OpenTelemetry — Collector configuration', url: 'https://opentelemetry.io/docs/collector/configuration/' },
  aspire: { title: 'Aspire documentation (formerly .NET Aspire)', url: 'https://learn.microsoft.com/en-us/dotnet/aspire/' },
  aspireDashboard: { title: 'Aspire — Dashboard overview', url: 'https://learn.microsoft.com/en-us/dotnet/aspire/fundamentals/dashboard/overview' },
  sreSlo: { title: 'Google SRE book — Service Level Objectives', url: 'https://sre.google/sre-book/service-level-objectives/' },
  sreAlerting: { title: 'Google SRE workbook — Alerting on SLOs', url: 'https://sre.google/workbook/alerting-on-slos/' },
  w3cTrace: { title: 'W3C — Trace Context', url: 'https://www.w3.org/TR/trace-context/' },
} as const;

/** Month 5, weeks 19–20: infrastructure as code with Terraform (assignment: Rebuild the Cloud), then
 *  CI/CD and observability (assignment: No Manual Deployment). */
export const DN_MONTH5_B: CurriculumLesson[] = [
  {
    id: 'dn5-5',
    slug: 'infrastructure-as-code-terraform',
    title: 'Infrastructure as Code with Terraform: Providers, Resources and the Plan',
    summary: 'Why infrastructure belongs in reviewed code, and how Terraform turns a declarative description into changes: providers and version pinning, resources and data sources, variables with validation, locals and outputs, references and the dependency graph, and the init–plan–apply workflow.',
    minutes: 60,
    prerequisite: 'Lessons dn5-3 and dn5-4 (the Azure resources you will now describe in code). Install the Terraform CLI to try the workflow; the graded tasks run in your browser.',
    outcomes: [
      'Explain what infrastructure as code solves that scripts and portal clicks do not, and how a declarative tool decides what to change.',
      'Write a Terraform configuration with pinned providers, validated variables, locals, resources, data sources and outputs.',
      'Use references so that values and creation order follow from the code, and recognise when depends_on is needed.',
      'Run the init, fmt, validate, plan and apply workflow and read a plan before approving it.',
      'Compare Terraform with Bicep and with imperative CLI scripts, and choose deliberately.',
    ],
    introduction:
      'Last week\'s scripts were a big step up from clicking in the portal, but they describe steps, not results. Run one against an environment that has drifted — a setting changed by hand, a resource deleted — and it cannot tell you what is different, only try its steps again. Infrastructure as code describes the result you want and lets a tool work out the steps: what to create, what to change, what to destroy, and in which order. This lesson teaches Terraform, the most widely used such tool, by rebuilding last week\'s environment as code you can review in a pull request.',
    keyTerms: [
      { term: 'Declarative', meaning: 'Describing the desired end state and letting the tool compute the changes, rather than listing commands.' },
      { term: 'Provider', meaning: 'A plugin that maps Terraform resources onto a platform\'s API (azurerm for Azure Resource Manager).' },
      { term: 'Resource', meaning: 'A thing Terraform creates and manages: resource "azurerm_container_registry" "acr" { … }.' },
      { term: 'Data source', meaning: 'A read-only lookup of something Terraform does not manage: data "azurerm_client_config" "current" {}.' },
      { term: 'State', meaning: 'Terraform\'s record of which real objects correspond to which resources in your code.' },
      { term: 'Plan', meaning: 'The computed set of creates, updates and deletes needed to make reality match the code.' },
      { term: 'Drift', meaning: 'A difference between real infrastructure and the code, usually from a manual change.' },
    ],
    sections: [
      {
        title: 'Why infrastructure belongs in code',
        paragraphs: [
          'An environment built by hand exists only as itself: nobody can review it before it changes, recreate it exactly, or say why a setting is the way it is. Infrastructure as code (IaC) gives infrastructure the properties your application code already has. Changes are pull requests that a colleague reviews; history explains every setting; a second environment (staging, a disaster-recovery region) is the same code with different inputs; and a deleted resource group can be rebuilt in minutes.',
          'Declarative tools go further than scripts. You describe the registry you want — Basic SKU, admin user off, these tags — and the tool compares that with what exists and computes the difference. If someone enabled the admin user in the portal, the next plan shows the drift and offers to put it back. Terraform (and its open-source fork OpenTofu, which reads the same language) does this across many platforms; Bicep is Microsoft\'s Azure-only declarative language, compiled to ARM templates. Both are good choices for Azure; this course uses Terraform because the same skills apply to every cloud and to things outside clouds, such as DNS, GitHub settings and monitoring.',
        ],
      },
      {
        title: 'Providers, resources and data sources',
        paragraphs: [
          'A configuration is a directory of .tf files that Terraform reads as one. Providers are plugins downloaded by terraform init: the terraform block says which ones you need and which versions are acceptable, and the provider block configures them. Pin providers with a pessimistic constraint such as "~> 4.0" (any 4.x, never 5.0), because a major version can change resource behaviour; init records the exact versions chosen in .terraform.lock.hcl, which you commit so every machine and pipeline uses the same build.',
          'Version 4 of the azurerm provider requires a subscription id. Do not write it in the code; set the ARM_SUBSCRIPTION_ID environment variable (the pipeline sets it next week), so the same configuration can target any subscription. A resource block declares something Terraform manages, with a type defined by the provider and a local name you choose: resource "azurerm_container_registry" "acr" is addressed as azurerm_container_registry.acr. A data block reads something Terraform does not manage — data "azurerm_client_config" "current" {} returns the tenant and object id of whoever is running Terraform.',
        ],
        code: `terraform {
  required_version = ">= 1.9"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"          # 4.x only; the lock file records the exact build
    }
  }
}

provider "azurerm" {
  features {}                     # subscription from ARM_SUBSCRIPTION_ID
}

data "azurerm_client_config" "current" {}`,
        label: 'Settings, provider and a data source',
      },
      {
        title: 'Variables, locals and outputs',
        paragraphs: [
          'Variables are a configuration\'s inputs. Give each a type and a description, and a validation block when only some values make sense — an environment of "prd" should fail at plan time with a clear message, not create a third environment. Defaults suit values that rarely change (a region); leave them off values that must be chosen deliberately. Locals name values computed inside the configuration, such as a tag map every resource shares. Outputs are its results: the registry\'s login server, the app\'s URL — what a pipeline or another configuration needs to read.',
          'Inside strings, interpolation builds names from inputs: "rg-bookings-${var.environment}". Deriving every name from a few variables is what lets one configuration produce dev and prod side by side without collisions.',
        ],
        code: `variable "environment" {
  type        = string
  description = "Deployment environment: dev or prod."
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be dev or prod."
  }
}

locals {
  tags = { app = "bookings", environment = var.environment, managed_by = "terraform" }
}

output "acr_login_server" {
  description = "Registry host name for image references."
  value       = azurerm_container_registry.acr.login_server
}`,
        label: 'Inputs, shared values and results',
      },
      {
        title: 'References and the dependency graph',
        paragraphs: [
          'When one resource uses another\'s attribute — resource_group_name = azurerm_resource_group.main.name, scope = azurerm_container_registry.acr.id — Terraform learns two things: the value, which may not exist until the other resource is created, and an ordering constraint. From all the references it builds a dependency graph, creates independent resources in parallel, and destroys in reverse order. Typing an id copied from the portal instead throws all of that away: the code no longer works in another environment, and Terraform no longer knows the order.',
          'Occasionally a dependency is real but invisible to Terraform. A Container App that pulls its image with a managed identity needs the AcrPull role assignment to exist first, yet nothing in the app reads from the assignment. Without help, Terraform may create both at once and the first revision fails to pull. depends_on = [azurerm_role_assignment.acr_pull] states the dependency. Use it only for cases like this, where a side effect rather than a value creates the ordering; elsewhere, references say it better.',
        ],
        code: `resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
  principal_type       = "ServicePrincipal"
}

resource "azurerm_container_app" "api" {
  # ...
  registry {
    server   = azurerm_container_registry.acr.login_server
    identity = azurerm_user_assigned_identity.app.id
  }
  depends_on = [azurerm_role_assignment.acr_pull]   # the pull needs the role; no attribute says so
}`,
        label: 'Values and order from references',
      },
      {
        title: 'init, plan, apply — and reading the plan',
        paragraphs: [
          'terraform init downloads providers and connects to the state backend. terraform fmt formats the code and terraform validate checks it without touching Azure — both belong in CI. terraform plan compares the code, the state and the real resources and prints what it would do: + create, ~ update in place, - destroy, and -/+ replace, where a change to an argument that cannot be updated forces Terraform to destroy and recreate the resource. terraform apply carries a plan out.',
          'Read every plan as if it were a code review, because it is one. The line to stop at is an unexpected destroy or replace: renaming a resource in code, changing a property that forces replacement (a registry\'s name, a vault\'s location), or a provider upgrade can plan to delete something with data in it. Save plans with plan -out=tfplan and apply that exact file, so what was reviewed is what runs. Next lesson adds the protections — remote state, lifecycle rules, pipelines — that make this safe for a team.',
        ],
        code: `terraform init                      # providers + backend
terraform fmt -check && terraform validate
terraform plan -var environment=dev -out=tfplan
#   + azurerm_user_assigned_identity.app will be created
#   ~ azurerm_container_registry.acr will be updated in-place
#       ~ admin_enabled = true -> false      # drift from a portal change, corrected
terraform apply tfplan               # exactly the reviewed plan`,
        label: 'The workflow',
      },
    ],
    table: {
      headers: ['Approach', 'Strength', 'Weakness'],
      rows: [
        ['Portal clicks', 'Fast to explore', 'Unreviewable, unrepeatable, invisible drift'],
        ['Azure CLI scripts', 'Simple, reviewable steps', 'Describe steps, not results; no plan of changes'],
        ['Bicep', 'Azure-native, day-one support for new features', 'Azure only'],
        ['Terraform / OpenTofu', 'One language for many platforms; plan shows changes', 'State to manage and protect'],
      ],
    },
    exercise: {
      scenario: 'A plan for a small change shows "-/+ azurerm_container_registry.acr must be replaced" because someone renamed the resource from "registry" to "acr" in code, and "~ admin_enabled = true -> false" on the same registry.',
      task: 'Explain both lines and what you would do before applying.',
      answer: 'Renaming a resource\'s local name changes its address, so Terraform thinks the old one should be destroyed and a new one created — replacing a registry deletes every image in it. Before applying, tell Terraform about the rename with a moved block (moved { from = azurerm_container_registry.registry  to = azurerm_container_registry.acr }), re-plan and confirm the replacement is gone. The admin_enabled change is drift: someone enabled the admin user outside Terraform, and the plan will switch it back off, which is the desired state — but find out who needed it and why, because something may be using those credentials. Apply only the saved, reviewed plan.',
      evidence: 'Stop at unexpected replacements; use moved blocks for renames; treat drift as information.',
    },
    misconceptions: [
      'Terraform runs your file from top to bottom. It builds a dependency graph from references and runs independent changes in parallel.',
      'depends_on is needed between every pair of related resources. References already create dependencies; depends_on is for hidden ones.',
      'An unpinned provider is fine because the lock file exists. The constraint decides what an upgrade may choose; pin majors with ~>.',
      'A plan is a formality before apply. It is the review: an unexpected destroy or replace is how data gets lost.',
      'Renaming a resource in code renames it in Azure. It changes the address; without a moved block Terraform plans a replacement.',
    ],
    sources: [R.tfIntro, R.tfLanguage, R.tfAzureTutorial, R.msTerraform, R.azurerm, R.azurermContainerApp, R.tfVariables, R.tfVersions, R.bicep, R.opentofu, R.upAndRunning],
    labs: [],
    questions: [
      { prompt: 'Which Terraform command shows the changes it would make without making them? (one word)', answer: 'plan', accept: ['terraform plan'] },
      { prompt: 'Which meta-argument states a dependency that no reference expresses? (underscore between words)', answer: 'depends_on', accept: ['depends on', 'dependson'] },
    ],
    quiz: [
      { question: 'What does "~> 4.0" allow?', options: ['Exactly 4.0.0', 'Any 4.x version, but not 5.0', 'Any version from 4.0 up', 'Only 4.0.x'], answer: 1, explanation: 'The pessimistic constraint allows the rightmost component to increase.' },
      { question: 'Why write resource_group_name = azurerm_resource_group.main.name rather than the group\'s name as text?', options: ['It is shorter', 'It carries the value and the creation order, and works in every environment', 'Text values are not allowed', 'It makes the plan faster'], answer: 1, explanation: 'References build the dependency graph.' },
      { question: 'Where should the azurerm subscription id come from?', options: ['Hard-coded in the provider block', 'The ARM_SUBSCRIPTION_ID environment variable', 'A resource', 'An output'], answer: 1, explanation: 'Keep the code environment-independent.' },
      { question: 'A plan shows -/+ for a resource. What does that mean?', options: ['Updated in place', 'Destroyed and recreated', 'Imported', 'Ignored'], answer: 1, explanation: 'Replacement — check what data that resource holds.' },
      { question: 'What is a data source for?', options: ['Creating databases', 'Reading information about something Terraform does not manage', 'Storing state', 'Defining outputs'], answer: 1, explanation: 'data blocks are read-only lookups.' },
    ],
  },
  {
    id: 'dn5-6',
    slug: 'terraform-state-modules-environments',
    title: 'Terraform for Teams: State, Modules, Environments and Safety',
    summary: 'Run Terraform as a team: remote state with locking and Entra authentication, why state is a secret, modules with clear inputs and outputs, one root per environment, lifecycle protections, importing and moving resources, secrets without hard-coding, and plan review in pull requests.',
    minutes: 60,
    prerequisite: 'Lesson dn5-5.',
    outcomes: [
      'Explain what state records, why it must be shared, locked and protected, and configure the azurerm backend with Entra authentication.',
      'Design a module with typed, validated inputs and useful outputs, and keep provider configuration in root modules.',
      'Structure dev and prod as separate roots that share a module, with separate state.',
      'Protect important resources with lifecycle rules and bring existing resources under management with import and moved blocks.',
      'Generate secrets with Terraform without exposing them, knowing they still live in state.',
    ],
    introduction:
      'Terraform on one laptop is easy. Terraform for a team raises questions the first lesson skipped: where does state live, what happens when two people apply at once, how do dev and prod share code without sharing mistakes, and how do you stop a plan from deleting the production database? This lesson answers them with the structure most teams converge on: a reusable module, a small root per environment, state in Azure Storage, and safety rails in the code itself.',
    keyTerms: [
      { term: 'Backend', meaning: 'Where Terraform stores state; the azurerm backend uses a blob in an Azure Storage account.' },
      { term: 'State locking', meaning: 'Preventing two Terraform runs from changing the same state at once (a blob lease for azurerm).' },
      { term: 'Module', meaning: 'A directory of Terraform code with inputs (variables) and outputs, used by other configurations.' },
      { term: 'Root module', meaning: 'The directory where you run Terraform; it configures providers and the backend and calls modules.' },
      { term: 'lifecycle', meaning: 'A meta-argument controlling replacement and destruction: prevent_destroy, create_before_destroy, ignore_changes.' },
      { term: 'Import', meaning: 'Bringing an existing resource under Terraform management by recording it in state.' },
    ],
    sections: [
      {
        title: 'State: what it is and why it matters',
        paragraphs: [
          'State maps each resource address in your code (azurerm_container_registry.acr) to a real object\'s id, and caches its attributes. Without it, Terraform could not tell "create this registry" from "this registry already exists", or know what to destroy when you delete a block. Local state — a terraform.tfstate file on one laptop — breaks the moment a second person or a pipeline runs Terraform: each has a different idea of what exists. State must be shared, and changes to it must be serialised.',
          'The azurerm backend stores state as a blob in a storage account and locks it with a blob lease during every operation, so a second apply waits or fails instead of corrupting it. Give each environment its own key (bookings/dev.tfstate, bookings/prod.tfstate) so a mistake in dev cannot touch prod\'s state. Authenticate with Entra ID (use_azuread_auth = true) and a data-plane role such as Storage Blob Data Contributor on that container, rather than the storage account key, which grants everything in the account. Backend blocks cannot use variables, because they are read before anything else; the values are either written in the block or supplied to terraform init with -backend-config.',
          'State is a secret. It contains every attribute of every resource — including generated passwords and connection strings — in plain text. Never commit it, restrict who can read the container, keep blob versioning or soft delete on so a bad write can be recovered, and remember that marking a variable or output sensitive = true hides it from the console, not from state.',
        ],
        code: `terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "sttfstatebookings"
    container_name       = "tfstate"
    key                  = "bookings/prod.tfstate"   # one key per environment
    use_azuread_auth     = true                      # Entra ID, not the account key
  }
}`,
        label: 'Shared, locked, separate state',
      },
      {
        title: 'Modules: one definition, many environments',
        paragraphs: [
          'A module is a directory of Terraform with variables as its inputs and outputs as its results — a function for infrastructure. Put the whole Bookings environment (resource group, registry, identity and roles, vault, Log Analytics, Container Apps environment and app) in modules/bookings, with inputs for what genuinely differs between environments: the environment name, location, image tag, replica counts. Type and validate every input and describe it, because a module\'s variables are its documentation. Expose what callers need — the app URL, the registry login server — and nothing that is a secret.',
          'Modules declare which providers they need (required_providers) but do not configure them: no provider blocks, no backend. Configuration belongs to the root module that calls them, which keeps the module usable with any subscription and any credentials. A module that hides a provider block cannot be used with for_each and makes removing it painful.',
        ],
        code: `modules/bookings/
  versions.tf     # required_providers only — no provider or backend blocks
  variables.tf    # environment, location, image_tag, min_replicas, max_replicas
  main.tf         # every resource, names derived from var.environment
  outputs.tf      # app_url, acr_login_server

envs/dev/main.tf  # backend key bookings/dev.tfstate, provider, module "bookings" { min_replicas = 0 }
envs/prod/main.tf # backend key bookings/prod.tfstate, provider, module "bookings" { min_replicas = 2 }`,
        label: 'A module and two thin roots',
      },
      {
        title: 'Environments: separate roots, not copies',
        paragraphs: [
          'Each environment gets a small root directory that configures the backend and provider and calls the module with that environment\'s values. The roots are a dozen lines each, so differences between dev and prod are visible at a glance — prod has more replicas, dev scales to zero — and a change to the module reaches both through the same reviewed code. Copying the full configuration into each environment and editing it by hand is the alternative to avoid: the copies drift apart, and nobody can tell which differences are intended.',
          'Terraform also has CLI workspaces (terraform workspace new prod), which keep several states for one directory. They suit short-lived copies of the same environment, such as a test environment per pull request, but HashiCorp\'s own guidance is that they are not suited to separating environments that need different credentials or access controls. Separate roots with separate state and separately permissioned pipelines give prod the isolation it needs.',
        ],
      },
      {
        title: 'Safety rails in the code',
        paragraphs: [
          'lifecycle { prevent_destroy = true } makes any plan that would destroy a resource fail — put it on the key vault, the database and anything else whose loss would be a disaster. create_before_destroy builds a replacement before removing the original, for resources that can coexist. ignore_changes tells Terraform not to fight a specific attribute that something else legitimately manages; use it sparingly and comment why, because every ignored attribute is drift you have chosen not to see.',
          'Two blocks change state without touching resources. A moved block records a rename or a move into a module (moved { from = azurerm_container_registry.registry  to = module.bookings.azurerm_container_registry.acr }), so the plan shows a move instead of destroy-and-create. An import block brings an existing, hand-made resource under management: write the resource block, add import { to = …  id = "<Azure resource id>" }, and plan until it shows no changes. Both live in code, so they are reviewed like any other change.',
        ],
        code: `resource "azurerm_key_vault" "main" {
  # ...
  purge_protection_enabled = true
  lifecycle {
    prevent_destroy = true      # a plan that deletes the vault fails
  }
}

moved {
  from = azurerm_container_registry.registry
  to   = azurerm_container_registry.acr
}`,
        label: 'Make the dangerous change impossible',
      },
      {
        title: 'Secrets in Terraform',
        paragraphs: [
          'Never type a secret into Terraform code or a .tfvars file in git — not as a variable default, not as a resource argument. When a secret must exist, let Terraform generate it (random_password) and write it straight into Key Vault, from which the app reads it through its managed identity. The generated value never appears in code or in a pipeline log, though it is in state, which is why state is protected. On a Key Vault using RBAC, whoever runs Terraform needs a data-plane role (Key Vault Secrets Officer) on that vault to write the secret; grant it in the same configuration and make the secret depend on it.',
          'Outputs must not reveal secrets. Output the secret\'s versionless id for the app\'s configuration rather than its value; if an output must carry a sensitive value, mark it sensitive = true, and Terraform refuses to print it. Better still, avoid generated secrets entirely where Entra authentication works, as Week 18 argued: the most secure password is the one that does not exist. Recent Terraform versions also add ephemeral values and write-only arguments that some providers use to keep a secret out of state altogether — worth adopting as your providers support them.',
        ],
      },
      {
        title: 'Terraform in a team workflow',
        paragraphs: [
          'Nobody runs terraform apply against production from a laptop. A pull request runs fmt, validate and plan, and posts the plan for review; merging applies exactly that plan through a pipeline whose identity is the only one with write access to production. Engineers get read access to production (to investigate) and broad access to dev. Next week\'s CI/CD lesson builds this pipeline, including signing in to Azure with OpenID Connect so that no long-lived secret is stored in GitHub.',
          'Schedule a plan against each environment (nightly, say) and alert when it is not empty: that is drift detection. A non-empty plan means someone changed something outside Terraform, and the earlier you know, the easier the conversation.',
        ],
      },
    ],
    table: {
      headers: ['Problem', 'Practice', 'Mechanism'],
      rows: [
        ['Two applies at once', 'Remote state with locking', 'azurerm backend blob lease'],
        ['Dev mistake hits prod', 'Separate state per environment', 'One backend key per root'],
        ['Copies drift apart', 'Shared module, thin roots', 'module "bookings" { … }'],
        ['Accidental deletion', 'Protect critical resources', 'lifecycle { prevent_destroy = true }'],
        ['Rename plans a replacement', 'Record the move', 'moved { from … to … }'],
        ['Secret in code or logs', 'Generate into Key Vault; protect state', 'random_password + azurerm_key_vault_secret'],
      ],
    },
    exercise: {
      scenario: 'A team keeps terraform.tfstate in the repository "so everyone has it". Two engineers applied at the same time last week and the state now lists a registry that was deleted. The prod configuration is a copy of dev with names edited, and a variable default holds the database password.',
      task: 'List the problems and the structure you would move them to.',
      answer: 'State in git exposes every secret it contains to anyone with repository access and has no locking, which caused the conflicting applies and the corrupted record. Move state to the azurerm backend — a storage account with a container per system, a separate key per environment, Entra authentication and blob versioning — and remove the file from the repository and its history, rotating any secrets it held. Replace the copied configurations with a shared module and thin dev and prod roots that pass only the differing values. Delete the password default: generate it with random_password, store it in Key Vault (with Key Vault Secrets Officer for the deployer and depends_on), output only the secret id, and put prevent_destroy on the vault and database. Then run a plan per environment to check state matches reality, using import blocks for anything missing.',
      evidence: 'Remote locked state per environment; module plus thin roots; generated secrets; lifecycle protection.',
    },
    misconceptions: [
      'State is just a cache Terraform can rebuild. Without it Terraform cannot tell existing resources from new ones; losing it is a serious incident.',
      'sensitive = true keeps a value out of state. It only hides the value from console output.',
      'Workspaces are the standard way to separate dev and prod. Separate roots with separate state and credentials isolate them better.',
      'Modules should configure their own providers. Providers and backends belong in root modules.',
      'ignore_changes is a good fix for a noisy plan. It hides drift; use it only for attributes something else deliberately manages.',
    ],
    sources: [R.tfState, R.tfAzureBackend, R.msStateStorage, R.tfSensitiveState, R.tfModules, R.tfLifecycle, R.tfImport, R.tfVariables, R.azurerm, R.upAndRunning],
    labs: [],
    questions: [
      { prompt: 'Which lifecycle argument makes any plan that would delete the resource fail? (underscore between words)', answer: 'prevent_destroy', accept: ['prevent destroy'] },
      { prompt: 'Which block records a rename so Terraform moves state instead of replacing the resource? (one word)', answer: 'moved' },
    ],
    quiz: [
      { question: 'Why must Terraform state be remote for a team?', options: ['It is faster', 'Everyone and the pipeline must share one locked record of what exists', 'Local state is not supported', 'To enable outputs'], answer: 1, explanation: 'Shared and locked prevents conflicting applies.' },
      { question: 'What does marking an output sensitive = true do?', options: ['Encrypts it in state', 'Hides it from CLI output; it is still in state', 'Deletes it after apply', 'Stores it in Key Vault'], answer: 1, explanation: 'State still holds the value.' },
      { question: 'Where should provider blocks live?', options: ['In every module', 'In root modules only', 'In the backend', 'In outputs'], answer: 1, explanation: 'Modules only declare required providers.' },
      { question: 'How should dev and prod differ in a module-based layout?', options: ['Separate copies of all code', 'Thin roots passing different inputs, with separate state', 'One state file with two workspaces of the same credentials', 'Different providers'], answer: 1, explanation: 'Differences are visible and intentional.' },
      { question: 'What does writing a secret to an RBAC Key Vault with Terraform require?', options: ['Nothing — the creator has full access', 'A data-plane role such as Key Vault Secrets Officer for the deploying identity', 'An access key', 'Contributor on the subscription'], answer: 1, explanation: 'Control-plane rights do not include writing secrets.' },
    ],
  },
  {
    id: 'dn5-7',
    slug: 'ci-cd-github-actions',
    title: 'CI/CD with GitHub Actions: From Commit to Production Without Hands',
    summary: 'Build the pipeline that replaces every manual step: a fast, trustworthy CI workflow as the required check on pull requests; a hardened workflow with least-privilege tokens and pinned actions; OpenID Connect sign-in to Azure with no stored secrets; build once, promote the same image through environments with approvals; and the DORA metrics that tell you whether it works.',
    minutes: 60,
    prerequisite: 'Lessons dn5-1 to dn5-6. A GitHub account; the graded tasks run in your browser.',
    outcomes: [
      'Explain continuous integration, continuous delivery and continuous deployment, and what each demands of a team.',
      'Write a GitHub Actions CI workflow for .NET that restores, checks formatting, builds, tests and keeps results, fast enough to run on every push.',
      'Harden workflows: least-privilege GITHUB_TOKEN permissions, pinned actions, safe triggers, timeouts and concurrency.',
      'Sign in to Azure from a workflow with OpenID Connect and a federated credential instead of a stored secret.',
      'Design a deployment that builds one artifact, promotes it through environments behind approvals, verifies it and can be rolled back.',
    ],
    introduction:
      'Every week of this month has ended with "now run it yourself": build the image, apply the Terraform, run the deploy script. That is exactly the work a pipeline should do. When a merge to main produces a tested, deployed, verified release with no human typing commands, releasing stops being an event and becomes routine — and routine releases are small, frequent and easy to undo. This lesson builds that pipeline with GitHub Actions, with the security care a system that holds the keys to production deserves.',
    keyTerms: [
      { term: 'Continuous integration (CI)', meaning: 'Merging small changes to the main branch often, each verified automatically by a build and tests.' },
      { term: 'Continuous delivery', meaning: 'Keeping main always releasable, with deployment a push-button (or approval) away.' },
      { term: 'Continuous deployment', meaning: 'Every change that passes the pipeline goes to production automatically.' },
      { term: 'Workflow', meaning: 'A YAML file in .github/workflows describing jobs that run on events such as push and pull_request.' },
      { term: 'Environment', meaning: 'A named deployment target in GitHub with its own protection rules (required reviewers) and secrets.' },
      { term: 'OIDC federation', meaning: 'Azure trusting short-lived tokens that GitHub issues for a specific repository and environment, instead of a stored secret.' },
      { term: 'Build once, deploy many', meaning: 'Producing one immutable artifact and promoting that same artifact through every environment.' },
    ],
    sections: [
      {
        title: 'CI, CD and why small changes win',
        paragraphs: [
          'Continuous integration means everyone merges small changes into main frequently — at least daily — and every change is verified automatically. The point is not the tool but the feedback loop: a broken build is found minutes after the change that broke it, by the person who made it, while the change is small enough to understand. Long-lived branches merged weekly produce the opposite: big, conflicting changes whose failures nobody can attribute.',
          'Continuous delivery extends that guarantee to release: main is always in a deployable state, and deploying is a routine, automated act — gated, perhaps, by an approval. Continuous deployment removes the gate. Research from DORA (DevOps Research and Assessment) has shown for years that teams that deploy small changes frequently have both higher throughput and fewer, faster-recovered failures; speed and stability are not a trade-off. Their four keys — deployment frequency, lead time for changes, change failure rate and time to restore service — are the measures to watch.',
        ],
      },
      {
        title: 'A CI workflow for .NET',
        paragraphs: [
          'A workflow is a YAML file under .github/workflows. on: lists the events that start it, jobs: lists jobs that run on fresh virtual machines (runners), and each job\'s steps either run shell commands (run:) or use reusable actions (uses:). For a pull request check, run on pull_request and on push to main; feature-branch pushes are already covered by their pull requests.',
          'Restore once, then build and test with --no-restore and --no-build so no step repeats work, and use Release so you test what you ship. dotnet format --verify-no-changes makes formatting a check rather than a code-review argument. Write test results to a folder and upload them with actions/upload-artifact under if: always(), so a failing run still leaves its evidence. Then make the workflow a required status check in the branch protection rules for main: no merge without green CI. Keep it fast — under ten minutes — or people stop waiting for it.',
        ],
        code: `on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

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
        with: { dotnet-version: 10.0.x }
      - run: dotnet restore
      - run: dotnet format --verify-no-changes --no-restore
      - run: dotnet build --no-restore -c Release
      - run: dotnet test --no-build -c Release --logger trx --results-directory TestResults
      - if: always()
        uses: actions/upload-artifact@v4
        with: { name: test-results, path: TestResults }`,
        label: 'The required check',
      },
      {
        title: 'Hardening: a pipeline is production infrastructure',
        paragraphs: [
          'A deploy workflow can change production, so an attacker who controls it controls production. Start with the token: every run gets a GITHUB_TOKEN, and the permissions: block decides what it may do. Set it at the top of every workflow to the minimum — contents: read for CI — and grant more per job only where needed. Pin actions to a version tag or, for the strongest guarantee, a full commit SHA; uses: some/action@main runs whatever that repository\'s main branch contains today, including a compromise pushed five minutes ago.',
          'Be careful with triggers. pull_request runs code from a contributor\'s branch with a read-only token and no secrets, which is safe. pull_request_target runs with the base repository\'s secrets and write token, so it must never check out and run code from the pull request. Never interpolate untrusted text such as a pull request title directly into a run: script (an injection risk); pass it through an environment variable instead. Add timeout-minutes to every job (the default is six hours) and concurrency groups so overlapping runs do not race.',
        ],
      },
      {
        title: 'Signing in to Azure without a secret',
        paragraphs: [
          'The classic way to let a workflow reach Azure is a service principal with a client secret stored in GitHub — a long-lived credential that works from anywhere, must be rotated, and leaks if a workflow prints it. OpenID Connect removes it. You add a federated credential to the deployment identity (an app registration or a user-assigned managed identity) that says: trust tokens issued by GitHub for repository acme/bookings, environment production. At run time the workflow asks GitHub for a short-lived token (which needs permissions: id-token: write), and azure/login exchanges it for an Azure access token. Nothing secret is stored anywhere; the client, tenant and subscription ids are identifiers, conventionally kept in repository variables.',
          'Scope the trust tightly. A federated credential for environment:production only works for jobs that run in that GitHub environment, so the production identity cannot be used from a feature branch or a pull request. Give that identity only the roles it needs on the production resource group — this is the "only the pipeline can change production" rule from Week 19, enforced.',
        ],
        code: `permissions:
  id-token: write      # allow requesting an OIDC token
  contents: read

jobs:
  deploy:
    environment: production          # federated credential subject: environment:production
    steps:
      - uses: azure/login@v2
        with:
          client-id: \${{ vars.AZURE_CLIENT_ID }}
          tenant-id: \${{ vars.AZURE_TENANT_ID }}
          subscription-id: \${{ vars.AZURE_SUBSCRIPTION_ID }}
      # Terraform reads the same login: ARM_USE_OIDC=true plus ARM_CLIENT_ID / ARM_TENANT_ID / ARM_SUBSCRIPTION_ID`,
        label: 'OIDC: no secret to steal',
      },
      {
        title: 'Build once, promote, verify, roll back',
        paragraphs: [
          'Build the image exactly once, tag it with the commit SHA, and deploy that same image to every environment. Rebuilding per environment means production runs something that was never tested in staging. A typical deployment workflow has a build job, a deploy-to-dev job that needs it and runs automatically, and a deploy-to-production job that needs dev and runs in the production environment, whose protection rules require a reviewer\'s approval (and can restrict it to the main branch). Each deploy job applies the environment\'s Terraform root with -var image_tag=<sha>, so infrastructure and application change through one reviewed path.',
          'A deployment is not finished when the command returns; it is finished when the new version is proven healthy. End every deploy job with a smoke test — curl --fail with retries against /health/ready, and ideally one or two real read requests — so a bad release fails the pipeline loudly. Use a concurrency group with cancel-in-progress: false for deployments: queue them, never kill one halfway. Rolling back means redeploying the previous SHA (the image still exists) or, with Container Apps revisions, moving traffic back. Practise it before you need it.',
        ],
        code: `jobs:
  build:        # az acr build … --image bookings-api:\${{ github.sha }}
  deploy-dev:
    needs: build
    environment: dev
    # terraform -chdir=envs/dev apply -auto-approve -var "image_tag=\${{ github.sha }}"; smoke test
  deploy-prod:
    needs: deploy-dev
    environment: production      # waits for a required reviewer
    # the same commands against envs/prod, the same image`,
        label: 'One artifact, two environments, one gate',
      },
    ],
    table: {
      headers: ['Risk', 'Control', 'Where'],
      rows: [
        ['Token can do too much', 'permissions: least privilege', 'Top of every workflow'],
        ['Third-party action changes under you', 'Pin to a version or commit SHA', 'Every uses:'],
        ['Stored cloud secret leaks', 'OIDC federated credential', 'azure/login with id-token: write'],
        ['Unreviewed production change', 'Environment with required reviewers', 'environment: production'],
        ['Untested artifact in production', 'Build once, promote by SHA', 'Deploy jobs reuse the image'],
        ['Broken release goes unnoticed', 'Smoke test that fails the job', 'Last step of each deploy'],
      ],
    },
    exercise: {
      scenario: 'A team\'s deploy workflow runs on every push to any branch, signs in with AZURE_CREDENTIALS (a client secret created two years ago), uses some-org/deploy-action@main, builds a new image in each environment\'s job, and reports success as soon as az containerapp update returns.',
      task: 'List the risks and the changes that fix each.',
      answer: 'Any branch can deploy to production: trigger on push to main only and put the production job in a protected environment with required reviewers. The client secret is long-lived and stealable: replace it with OIDC (a federated credential scoped to environment:production, permissions: id-token: write, azure/login with client, tenant and subscription ids) and delete the secret. @main runs whatever that repository contains now: pin it to a release tag or commit SHA, and review it. Rebuilding per environment means production runs an untested artifact: build once, tag with github.sha, promote the same image. Success on command return hides bad releases: add a smoke test with curl --fail and retries against /health/ready. Also add least-privilege permissions, timeouts and a non-cancelling concurrency group.',
      evidence: 'Main-only trigger, environment approval, OIDC, pinned actions, one artifact, smoke test.',
    },
    misconceptions: [
      'CI means having a build server. It means integrating small changes into main often, with automated verification.',
      'Deploying frequently makes production less stable. DORA research finds frequent small deployments go with lower failure rates and faster recovery.',
      'A secret stored in GitHub is safe because it is masked in logs. It is still a long-lived credential that a malicious step can exfiltrate; OIDC avoids storing one.',
      'Pinning actions to @main keeps you up to date safely. It runs unreviewed code; pin versions or SHAs and update deliberately.',
      'A deploy step that exits 0 means the release works. Only a health or smoke check proves it.',
    ],
    sources: [R.ghaDocs, R.ghaDotnet, R.ghaHardening, R.ghaTokenPermissions, R.ghaOidcAzure, R.azureLoginOidc, R.ghaEnvironments, R.ghaConcurrency, R.dora, R.cdBook],
    labs: [],
    questions: [
      { prompt: 'Which permission must a workflow have to request an OIDC token from GitHub? (hyphenated, as written in YAML)', answer: 'id-token: write', accept: ['id-token write', 'id-token', 'id token write'] },
      { prompt: 'Which GitHub feature holds required reviewers that must approve a production deployment? (one word)', answer: 'environment', accept: ['environments'] },
    ],
    quiz: [
      { question: 'Why pin actions to a version or SHA?', options: ['It is faster', 'A branch reference runs whatever that repository contains at the time, including compromises', 'GitHub requires it', 'It enables caching'], answer: 1, explanation: 'Pinned code is reviewed code.' },
      { question: 'What does OIDC federation replace?', options: ['The runner', 'A long-lived client secret stored in GitHub', 'The container registry', 'Branch protection'], answer: 1, explanation: 'Azure trusts short-lived GitHub-issued tokens instead.' },
      { question: 'Why build the image once and promote it?', options: ['To save registry space only', 'So production runs the exact artifact that was tested in earlier environments', 'Images cannot be rebuilt', 'It is required by Container Apps'], answer: 1, explanation: 'Rebuilding can produce a different artifact.' },
      { question: 'Which concurrency setting suits a production deployment workflow?', options: ['cancel-in-progress: true', 'cancel-in-progress: false', 'No concurrency at all', 'A random group name'], answer: 1, explanation: 'Queue deployments; never kill one halfway.' },
      { question: 'Which is one of DORA\'s four key metrics?', options: ['Lines of code per day', 'Change failure rate', 'Number of microservices', 'Test coverage'], answer: 1, explanation: 'Also deployment frequency, lead time and time to restore.' },
    ],
  },
  {
    id: 'dn5-8',
    slug: 'observability-dotnet-opentelemetry',
    title: 'Observability for .NET: Logs, Metrics, Traces and Alerts That Matter',
    summary: 'Make a running system explain itself: structured logging with message templates, OpenTelemetry traces and metrics in ASP.NET Core, context propagation across services, the Collector, the Aspire dashboard for local development, and SLO-based burn-rate alerts that page for what users feel.',
    minutes: 60,
    prerequisite: 'Lesson dn5-7, and the reliability ideas from Month 3 (SLOs and error budgets).',
    outcomes: [
      'Distinguish logs, metrics and traces, and choose the right signal for a question.',
      'Write structured logs with message templates, scopes and appropriate levels, keeping secrets and personal data out.',
      'Instrument an ASP.NET Core API with OpenTelemetry — automatic and custom spans and metrics — and export through OTLP or Azure Monitor.',
      'Explain trace context propagation and use the Aspire dashboard to follow a request across services locally.',
      'Define SLIs and SLOs and alert on error-budget burn with multiple windows instead of on causes.',
    ],
    introduction:
      'The system now deploys itself. When it misbehaves at 3 a.m., the only things you will have are what it recorded about itself. Observability is the ability to answer new questions about a running system from the outside — "why is booking creation slow for this one tenant since the last deploy?" — without shipping new code to find out. This lesson instruments the Bookings API with the three signals, routes them through OpenTelemetry, and finishes with the part most teams get wrong: alerts that wake people only when users are actually hurting.',
    keyTerms: [
      { term: 'Structured log', meaning: 'A log event with named, typed fields (OrderId=42) rather than only a formatted sentence.' },
      { term: 'Metric', meaning: 'A numeric measurement aggregated over time — counts, rates, histograms — cheap to keep and to alert on.' },
      { term: 'Trace and span', meaning: 'A trace is one request\'s journey; spans are its timed steps (an HTTP call, a database query), linked parent to child.' },
      { term: 'OpenTelemetry (OTel)', meaning: 'The vendor-neutral standard and SDKs for producing and exporting traces, metrics and logs.' },
      { term: 'OTLP', meaning: 'The OpenTelemetry protocol for sending telemetry to a collector or backend.' },
      { term: 'SLI / SLO', meaning: 'A service level indicator measures user experience (success ratio); an objective sets its target (99.9% over 30 days).' },
      { term: 'Burn rate', meaning: 'How fast the error budget is being spent, relative to spending exactly all of it over the SLO window.' },
    ],
    sections: [
      {
        title: 'Three signals, three kinds of question',
        paragraphs: [
          'Metrics answer "how much, how often, how fast?" across all requests: request rate, error ratio, latency percentiles, queue depth. They are cheap to store, so you keep them for months and alert on them. Traces answer "where did the time go in this request?": a tree of spans from the edge through your API, the database and downstream services. Logs answer "what exactly happened here?": discrete events with context — a validation failure, a retry, a payment provider\'s error message.',
          'The signals are most powerful connected. A latency alert (metric) leads to slow traces from that period (trace), whose spans carry the trace id that finds the exact log lines for that request (log). OpenTelemetry provides that connection: every log written inside a traced request carries its trace and span ids automatically.',
        ],
      },
      {
        title: 'Structured logging done properly',
        paragraphs: [
          'ILogger supports message templates: logger.LogInformation("Booking {BookingId} cancelled by {UserId}", bookingId, userId). The template stays constant and the values become named properties you can filter and aggregate on (all events for BookingId 42). String interpolation — $"Booking {bookingId} cancelled" — produces a different message for every call and throws the structure away, so avoid it in log calls. For hot paths, the [LoggerMessage] source generator produces allocation-free logging methods.',
          'Choose levels deliberately: Information for significant business events, Warning for something unexpected that the system handled, Error for a failed operation someone may need to act on, Debug for detail you switch on when investigating. Use scopes (logger.BeginScope) to attach context such as a tenant id to every event in a unit of work. Never log secrets, tokens, passwords or full personal data; log identifiers instead, and treat the log store as sensitive anyway.',
        ],
        code: `public sealed partial class BookingService(ILogger<BookingService> logger)
{
    public void Cancel(Booking booking, string reason)
    {
        // ... cancel ...
        LogCancelled(logger, booking.Id, reason);   // structured: BookingId, Reason
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Booking {BookingId} cancelled: {Reason}")]
    private static partial void LogCancelled(ILogger logger, Guid bookingId, string reason);
}

// Not this: one unique string per call, nothing to filter on
logger.LogInformation($"Booking {booking.Id} cancelled: {reason}");`,
        label: 'Templates, not interpolation',
      },
      {
        title: 'OpenTelemetry in ASP.NET Core',
        paragraphs: [
          '.NET has the building blocks built in: System.Diagnostics.Activity is a span, ActivitySource creates them, and System.Diagnostics.Metrics.Meter creates counters and histograms. ASP.NET Core and HttpClient already emit spans and the standard http.server.request.duration metric. The OpenTelemetry SDK collects all of it and exports it: add the service name as a resource, enable the ASP.NET Core, HttpClient and runtime instrumentation, register your own ActivitySource and Meter names, and choose an exporter — OTLP to a collector or the Aspire dashboard, or the Azure Monitor distro (UseAzureMonitor) straight to Application Insights.',
          'Add custom spans around meaningful work (charging a card, applying a migration) and custom metrics for business signals (bookings created, payments declined). Keep metric attribute values to a small, bounded set: an attribute per user id or per URL with ids in it creates a separate time series for every value and can overwhelm a metrics backend.',
        ],
        code: `builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("bookings-api"))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddSource("Bookings"))
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddRuntimeInstrumentation()
        .AddMeter("Bookings"))
    .UseOtlpExporter();                    // endpoint from OTEL_EXPORTER_OTLP_ENDPOINT
builder.Logging.AddOpenTelemetry(o => { o.IncludeScopes = true; o.IncludeFormattedMessage = true; });

// Custom telemetry
static readonly ActivitySource Source = new("Bookings");
static readonly Meter Meter = new("Bookings");
static readonly Counter<long> Created = Meter.CreateCounter<long>("bookings.created");

using var activity = Source.StartActivity("ChargeDeposit");
activity?.SetTag("booking.id", booking.Id);
Created.Add(1, new KeyValuePair<string, object?>("channel", "web"));   // bounded values only`,
        label: 'Traces, metrics and logs from one setup',
      },
      {
        title: 'Propagation, the Collector and the Aspire dashboard',
        paragraphs: [
          'When the API calls another service, HttpClient instrumentation adds a W3C traceparent header carrying the trace id and the current span id; the receiving service continues the same trace. Messages need the same treatment: put the trace context into the message headers when publishing (the Week 11 outbox) and restore it when consuming, so one trace spans the request, the event and the worker that handled it.',
          'In production, apps usually send OTLP to an OpenTelemetry Collector rather than straight to a vendor. The Collector receives, processes and exports: it limits its own memory, batches, removes sensitive attributes such as Authorization headers, samples, and fans out to one or more backends — so changing backend is configuration, not a redeploy. Order matters in its pipelines: memory_limiter first, batch last. Locally, the Aspire dashboard (part of Aspire, formerly .NET Aspire, and also runnable as a single container) receives OTLP and shows logs, traces and metrics together; Aspire\'s ServiceDefaults project wires up OpenTelemetry, health checks and resilience for every service in a solution in one call.',
        ],
        code: `# Run the Aspire dashboard locally as an OTLP endpoint for any app
docker run --rm -p 18888:18888 -p 4317:18889 mcr.microsoft.com/dotnet/aspire-dashboard:9.0
# then: OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 dotnet run`,
        label: 'See every signal on your machine',
      },
      {
        title: 'SLOs and alerts that respect people\'s sleep',
        paragraphs: [
          'Alert on symptoms users feel, not on causes. A CPU at 85% may be perfectly healthy; a single 5xx is normal at scale; both pages train on-call engineers to ignore pages. Define service level indicators that reflect user experience — the proportion of requests that succeed, the proportion served under 500 ms — and objectives for them: 99.9% of requests succeed over 30 days. The remaining 0.1% is the error budget: the amount of failure you have agreed is acceptable, to spend on releases, experiments and bad luck.',
          'Then alert on how fast the budget is burning. A burn rate of 1 spends exactly the whole budget in 30 days; 14.4 spends 2% of it in an hour. The Google SRE workbook\'s multi-window, multi-burn-rate pattern pages when the burn rate is above 14.4 over the last hour and still above it over the last five minutes (so the alert is significant and current, and clears quickly once fixed), and when it is above 6 over six hours and thirty minutes; slower burns become tickets for working hours. Each page links to a runbook. Few, meaningful pages — each of which needs a human now — are the goal.',
        ],
        code: `# Recording rule: 5xx ratio over one hour (repeat for 5m, 30m, 6h)
- record: bookings:error_ratio:rate1h
  expr: |
    sum(rate(http_server_request_duration_seconds_count{job="bookings-api",http_response_status_code=~"5.."}[1h]))
    / sum(rate(http_server_request_duration_seconds_count{job="bookings-api"}[1h]))

# Page: 2% of the 30-day budget in an hour, and still happening
- alert: BookingsErrorBudgetFastBurn
  expr: bookings:error_ratio:rate1h > (14.4 * 0.001) and bookings:error_ratio:rate5m > (14.4 * 0.001)
  for: 2m
  labels: { severity: page }
  annotations:
    runbook_url: https://runbooks.example.com/bookings/error-budget`,
        label: 'Multi-window burn-rate alerting',
      },
    ],
    table: {
      headers: ['Question', 'Signal', 'Example'],
      rows: [
        ['Is the service meeting its objective?', 'Metrics (SLI)', 'Ratio of non-5xx requests over 30 days'],
        ['Where did this slow request spend its time?', 'Trace', 'API span → database span 1.8 s'],
        ['What happened to booking 42?', 'Logs', 'Filter on BookingId = 42'],
        ['Should someone be woken up?', 'Burn-rate alert', '14.4× over 1h and 5m'],
        ['Is a dependency failing?', 'Metrics + traces', 'HttpClient error rate by host'],
      ],
    },
    exercise: {
      scenario: 'After an incident, the review finds: alerts fired constantly for CPU and single errors and were muted; logs contained lines like "Error processing booking" with no ids; and nobody could tell whether the slowness was in the API or the payment provider.',
      task: 'Describe the observability changes that would have shortened the incident.',
      answer: 'Replace cause-based and single-error pages with SLO burn-rate alerts: define a success-ratio SLI and a 99.9% objective, record the error ratio over 5m, 30m, 1h and 6h, and page only on 14.4× (1h and 5m) and 6× (6h and 30m) burns, each with a runbook. Use structured logging with message templates (Booking {BookingId} payment failed: {Reason}) and scopes so events can be filtered by id, with OpenTelemetry attaching trace ids to logs. Instrument with OpenTelemetry — ASP.NET Core and HttpClient spans plus a custom span around the payment call — so a trace shows directly whether time went to the API or the provider, and an HttpClient error-rate metric by host shows a failing dependency.',
      evidence: 'Symptom-based burn-rate alerts; structured, trace-correlated logs; spans around dependencies.',
    },
    misconceptions: [
      'More alerts mean safer systems. Noisy alerts get ignored; page only when users are hurting now.',
      'String interpolation in log calls is equivalent to message templates. It discards the structured properties.',
      'Observability means buying a monitoring product. It is instrumenting the code so the system can answer new questions; OpenTelemetry keeps the backend replaceable.',
      'High-cardinality metric attributes are harmless. Each distinct value creates a time series; use bounded values and put ids in traces and logs.',
      'An SLO of 100% is the right goal. It leaves no budget for change; users cannot tell 99.99% from 100%, but your release speed can.',
    ],
    sources: [R.otelDotnet, R.dotnetObservability, R.dotnetLogging, R.dotnetDistributedTracing, R.dotnetMetrics, R.azureMonitorOtel, R.otelCollector, R.aspire, R.aspireDashboard, R.w3cTrace, R.sreSlo, R.sreAlerting],
    labs: [],
    questions: [
      { prompt: 'Which HTTP header carries W3C trace context between services? (one word)', answer: 'traceparent' },
      { prompt: 'What is the error budget of a 99.9% SLO, as a percentage? (number with a decimal point, no % sign)', answer: '0.1', accept: ['0.1%', '.1'] },
    ],
    quiz: [
      { question: 'Which call keeps structured properties in the log event?', options: ['LogInformation($"Booking {id} cancelled")', 'LogInformation("Booking {BookingId} cancelled", id)', 'Console.WriteLine(id)', 'LogInformation("Booking " + id)'], answer: 1, explanation: 'Message templates keep BookingId as a field.' },
      { question: 'What does a burn rate of 14.4 sustained for one hour consume of a 30-day budget?', options: ['0.1%', '2%', '14.4%', '50%'], answer: 1, explanation: '14.4 × 1h / 720h = 0.02.' },
      { question: 'Why use two windows (1h and 5m) in one alert?', options: ['To double the number of pages', 'The long window shows significance; the short one shows it is still happening and lets the alert clear quickly', 'Prometheus requires two', 'To measure latency'], answer: 1, explanation: 'Multi-window alerts are both precise and responsive.' },
      { question: 'In a Collector pipeline, where do memory_limiter and batch go?', options: ['batch first, memory_limiter last', 'memory_limiter first, batch last', 'Either order', 'They cannot be combined'], answer: 1, explanation: 'Refuse data early; batch what is actually sent.' },
      { question: 'Which should page the on-call engineer?', options: ['CPU above 80% for a minute', 'Any single 5xx', 'The error budget burning 14.4× over 1h and 5m', 'A deployment starting'], answer: 2, explanation: 'Page on user-facing symptoms that need action now.' },
    ],
  },
];
