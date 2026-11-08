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
];
