import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

const awsInventory = [
  '# Query only through a view in an account where you are authorized.',
  '# Replace YOUR_VIEW_ARN with a view provisioned for your lab account.',
  'aws resource-explorer-2 search --region us-east-1 \\',
  '  --query-string "resourcetype:AWS::S3::Bucket" \\',
  '  --view-arn YOUR_VIEW_ARN',
  '',
  '# AWS Config Advanced Query: list recorded S3 bucket resources.',
  "aws configservice select-resource-config --expression \"SELECT resourceId WHERE resourceType = 'AWS::S3::Bucket'\"",
  '',
  '# Inspect configuration for one bucket your inventory identified.',
  'aws s3api get-public-access-block --bucket training-bucket',
  '',
  '# These commands inspect account metadata/configuration; they do not',
  '# download bucket objects or enumerate a third party.',
].join('\n');

const azureInventory = [
  '# Query the subscription explicitly assigned to your exercise.',
  'az graph query --subscriptions YOUR_LAB_SUBSCRIPTION_ID \\',
  '  -q "Resources | project name, type, location, resourceGroup" \\',
  '  --output table',
  '',
  '# Narrow the inventory to storage resources for review.',
  "az graph query --subscriptions YOUR_LAB_SUBSCRIPTION_ID -q \"Resources | where type =~ 'microsoft.storage/storageaccounts' | project name, location, resourceGroup\"",
].join('\n');

const gcpInventory = [
  '# Search within the project you own or were assigned in the lab.',
  'gcloud asset search-all-resources \\',
  '  --scope=projects/YOUR_LAB_PROJECT_ID \\',
  '  --asset-types=storage.googleapis.com/Bucket \\',
  '  --format=table(name,assetType,location)',
  '',
  '# Narrow by supported metadata after checking the resource schema.',
  'gcloud asset search-all-resources \\',
  '  --scope=projects/YOUR_LAB_PROJECT_ID \\',
  '  --query="name:training" \\',
  '  --format=json',
].join('\n');

const inventorySchema = [
  'asset_id,provider,account_or_project,region,resource_type,name',
  'owner,environment,data_classification,created_at,last_seen',
  'public_endpoint,dns_names,network_path,identity_binding',
  'logging_enabled,policy_source,scope_decision,review_status',
  '',
  'Example values:',
  'asset_id: cloud://training-project/storage/log-archive',
  'provider: GCP',
  'environment: training',
  'public_endpoint: none confirmed',
  'scope_decision: explicitly authorized inventory',
  'review_status: owner confirmation pending',
].join('\n');

export default function CloudAssetDiscoveryAndAttackSurfaceMapping() {
  return (
    <article className="prose-hh">
      <h1>Cloud Asset Inventory and Attack-Surface Mapping</h1>
      <p>
        Cloud assets are created across accounts, subscriptions, projects, regions, managed services, and
        deployment pipelines. A hostname-only reconnaissance pass cannot show all of them, and guessing storage
        names is a poor substitute for an authorized inventory. In a professional assessment, begin with the
        cloud provider’s control plane and the identity granted for the engagement. Use external DNS and
        certificate data only to generate candidates that can be matched to an approved owner and scope.
      </p>

      <h2>Prerequisites: define the boundary before listing assets</h2>
      <p>
        A cloud account, subscription, or project is an administrative boundary; an individual VM, bucket,
        database, load balancer, serverless function, secret store, or Kubernetes cluster is a resource. A
        public endpoint is a path reachable from outside a private network, but “publicly addressable” and
        “publicly exploitable” are different conclusions. Authentication, firewall rules, resource policies,
        application controls, and data sensitivity all affect impact.
      </p>
      <p>
        Before using inventory tools, record the written scope: organization or account IDs, permitted regions,
        excluded services, approved identity, allowed read operations, test window, data-handling requirements,
        and reporting contact. Use a read-only role where possible. Confirm the active cloud identity and tenant
        before each exercise. Cloud inventory commands can expose sensitive metadata and may consume API quotas;
        request only the fields needed and protect exported results.
      </p>
      <Callout variant="warn">
        <p>
          Do not search for or access resources belonging to an unrelated organization. A public URL pattern or
          familiar brand name does not establish authorization. The examples below use named lab accounts and
          read-only control-plane queries; they do not download data from public buckets or test unknown
          endpoints.
        </p>
      </Callout>

      <h2>1. Build an inventory from authoritative sources</h2>
      <p>
        Inventory has multiple sources because no single service sees every asset or state. Cloud-native search
        finds resources known to the control plane. Configuration services retain configuration history and
        policy state. Kubernetes APIs know cluster objects; registries know images; DNS knows published names;
        CI/CD and infrastructure-as-code (IaC) systems reveal intended deployments; endpoint and identity tools
        add runtime and ownership context.
      </p>
      <ul>
        <li><strong>AWS:</strong> Resource Explorer searches indexed resource metadata in enabled Regions and
          views. AWS Config records supported resource configuration and can query recorded state. These are
          complementary: search locates resources; configuration history helps review state and drift.</li>
        <li><strong>Azure:</strong> Azure Resource Graph queries Azure Resource Manager resources across an
          explicitly selected subscription or management-group scope using a Kusto-derived query language.</li>
        <li><strong>Google Cloud:</strong> Cloud Asset Inventory searches and exports resource and policy
          metadata within project, folder, or organization scopes. Its inventory view is not a guarantee of
          instantaneous runtime state.</li>
        <li><strong>Other sources:</strong> reconcile cloud organization inventories with CSPM, Kubernetes
          cluster inventory, registry metadata, DNS, certificate transparency, configuration repositories, and
          deployment records.</li>
      </ul>
      <p>
        Start with a broad read-only inventory in the smallest authorized scope, then select resource types and
        fields. Track pagination and regional coverage. An empty result may mean the resource is absent, the
        service is not enabled, the role lacks permission, the selected view excludes it, or the index is
        eventually consistent. Check which explanation applies before reporting that no assets exist.
      </p>

      <h2>2. Run scoped, read-only inventory queries</h2>
      <p>
        These examples query metadata in a lab account. Sign in with the read-only identity assigned to your
        training environment first. Replace the project, subscription, and view placeholders with those
        provisioned for that environment. Prefer the provider’s SSO or short-lived credential flow; do not paste
        long-lived access keys into command lines.
      </p>
      <CodeBlock label="AWS Resource Explorer and AWS Config: inventory and inspect configuration">{awsInventory}</CodeBlock>
      <p>
        Resource Explorer search is constrained by a view and caller permissions; its results depend on
        indexing and Region setup. AWS Config advanced queries read configuration records Config has recorded.
        A reviewer can compare intended policy with observed bucket controls, then inspect the bucket policy and
        account-level public-access settings using authorized read operations. Do not infer public data exposure
        solely from a resource existing or one access-block flag.
      </p>
      <CodeBlock label="Azure Resource Graph: list resources in one authorized subscription">{azureInventory}</CodeBlock>
      <p>
        Azure Resource Graph operates over Azure Resource Manager resources accessible within the selected
        scope. Query output is metadata, not permission to interact with application data. Follow the
        subscription ID through the engagement scope and use RBAC that grants only the required read operations.
      </p>
      <CodeBlock label="Google Cloud Asset Inventory: search only the assigned project">{gcpInventory}</CodeBlock>
      <p>
        Cloud Asset Inventory calls require the relevant API and permission on the requested project, folder, or
        organization. Search supports documented resource types and fields, and inventory has a consistency
        model. For time-critical decisions, validate live settings through the service API under the same
        authorization instead of assuming an inventory snapshot is instantaneous.
      </p>

      <h2>3. Map exposure, ownership, and relationships</h2>
      <p>
        A resource list becomes an attack-surface map when it explains how assets connect and who is accountable.
        Record provider and account, resource ID, region, environment, owner, data classification, network
        exposure, identity binding, DNS names, logging coverage, deployment source, and last-seen time. Link a
        public load balancer to its DNS record, backend service, workload identity, storage dependencies, and
        owner. This graph shows where a change or incident can propagate.
      </p>
      <CodeBlock label="A practical asset record for an assessment">{inventorySchema}</CodeBlock>
      <p>
        Use durable provider IDs rather than display names alone. Names can be duplicated or changed; tags can be
        absent or incorrect. Record provenance for every field: control-plane query, IaC repository, owner
        confirmation, DNS resolution, or external passive source. Mark uncertainty instead of silently turning
        an inferred relationship into a confirmed fact.
      </p>

      <h2>4. Review exposure without overclaiming</h2>
      <p>Prioritize assets using reachability, identity, sensitivity, and business importance. Review each layer:</p>
      <ol>
        <li><strong>Network:</strong> public IPs, load balancers, ingress controllers, routes, security groups,
          network ACLs, cloud firewalls, and IPv6 listeners.</li>
        <li><strong>Application:</strong> authentication, tenant boundaries, rate limiting, API authorization,
          administration routes, and whether the service is still intended to exist.</li>
        <li><strong>Identity:</strong> attached roles, workload identities, service principals, trust
          relationships, federation, credential lifetime, and privilege paths.</li>
        <li><strong>Data:</strong> public-access blocks, bucket/container policies, database listeners,
          snapshots, backup copies, object ACL compatibility settings, and classification.</li>
        <li><strong>Operations:</strong> logs, retention, alert routing, patch status, ownership, and a tested
          retirement process.</li>
      </ol>
      <p>
        “Public” should be a tested property with an exact evidence source. Distinguish “resource has an
        internet-facing endpoint,” “policy allows anonymous reads,” and “a particular object was accessible
        without authentication.” These are different claims. Prefer control-plane review and provider
        configuration evidence. Any data-plane validation must be explicitly authorized, use a harmless
        designated test object, avoid copying real data, and stop if unexpected information appears.
      </p>
      <Callout variant="tip">
        <p>
          A storage bucket is not found only by guessing its name. Use account inventory, configuration records,
          deployment templates, DNS, and owner records. Permutation guesses create noise, can miss resources, and
          do not establish ownership or permission to test.
        </p>
      </Callout>

      <h2>5. Use external clues carefully</h2>
      <p>
        Public passive data can help reconcile an organization's external edge with its internal inventory.
        DNS A/AAAA/CNAME records and certificate-transparency names generate host candidates that still need an
        ownership check. Repository secret scanning can identify credentials accidentally committed by an
        organization; IaC and deployment manifests can reveal resource names, account identifiers, and
        relationships. Job postings may indicate technology adoption, but they are low-confidence context, not
        evidence that a particular service is deployed or vulnerable.
      </p>
      <p>
        Handle credentials as incident material. Never test a discovered key by making a login or resource
        request unless the engagement explicitly authorizes that exact action. Preserve repository URL, commit
        hash, file path, exposure time, and secret type without republishing the secret. Notify the owner through
        the approved channel, rotate or revoke through the credential owner, and check audit logs for use. A
        credential found in code may already be invalid; unsuccessful access does not make exposure harmless.
      </p>

      <h2>6. Find orphaned and forgotten assets</h2>
      <p>
        Common inventory leads include resources without an owner, public development systems, unused
        snapshots, stale DNS records, detached disks, unpatched images, service principals with no current
        workload, and resources in unreviewed Regions. “Orphaned” remains a hypothesis until checked: a detached
        volume could be a recovery artifact, and an apparently idle endpoint could serve a scheduled process.
        Use tags, cost and activity history, deployment references, owner confirmation, and change records before
        recommending deletion or shutdown.
      </p>
      <p>
        Prioritize transparently: exposure and reachability; identity privilege; data sensitivity; evidence of
        misconfiguration; business criticality; and confidence in the inventory. Escalate uncertain high-impact
        assets for owner review. Document exact evidence, timestamp, scope, limitation, and recommended
        validation rather than labeling every unknown resource vulnerable.
      </p>

      <h2>Worked example: an unexpected public endpoint</h2>
      <p>
        An authorized inventory finds a test load balancer in a production account with no owner tag. A
        certificate log contains a hostname that resolves to that endpoint. The analyst records its resource ID,
        account, Region, DNS result, and observation time, then checks IaC and change history. It is confirmed as
        a vendor migration endpoint, but its team cannot yet confirm whether it should remain exposed. The
        analyst reports the endpoint and evidence as confirmed, ownership and intended status as unresolved, and
        recommends verifying the listener, backend, identity policy, logging, and retirement plan. The analyst
        does not crawl the site or access data because those actions were not in scope.
      </p>

      <h2>Common mistakes</h2>
      <ul>
        <li>Guessing resource names instead of using authorized provider inventory.</li>
        <li>Confusing a public address with anonymous data access or a confirmed vulnerability.</li>
        <li>Assuming inventory is complete when a service, Region, view, or permission is missing.</li>
        <li>Running broad organization queries when a training project or subscription is sufficient.</li>
        <li>Exporting secret-bearing metadata to an unmanaged laptop or shared report.</li>
        <li>Deleting an “unused” resource before confirming its owner and dependencies.</li>
        <li>Using write-capable credentials for a read-only inventory exercise.</li>
      </ul>

      <h2>Knowledge check</h2>
      <ol>
        <li>Why should inventory begin with an explicitly authorized account or project?</li>
        <li>How do resource search and configuration history answer different questions?</li>
        <li>Name four fields that turn a resource list into an attack-surface map.</li>
        <li>What is the difference between an internet-facing endpoint and anonymously readable data?</li>
        <li>Why should an empty query be checked for permission and indexing coverage?</li>
        <li>How should an analyst handle a cloud credential found publicly without explicit test authorization?</li>
      </ol>

      <h2>References and tool documentation</h2>
      <ul>
        <li><a href="https://docs.aws.amazon.com/resource-explorer/latest/userguide/using-search.html" target="_blank" rel="noreferrer">AWS Resource Explorer: searching resources</a></li>
        <li><a href="https://docs.aws.amazon.com/config/latest/developerguide/query-components.html" target="_blank" rel="noreferrer">AWS Config: advanced query components</a></li>
        <li><a href="https://learn.microsoft.com/en-us/azure/governance/resource-graph/concepts/query-language" target="_blank" rel="noreferrer">Azure Resource Graph query language</a></li>
        <li><a href="https://docs.cloud.google.com/asset-inventory/docs/asset-inventory-overview" target="_blank" rel="noreferrer">Google Cloud Asset Inventory overview</a></li>
        <li><a href="https://docs.cloud.google.com/asset-inventory/docs/search-resources" target="_blank" rel="noreferrer">Google Cloud Asset Inventory: search resources</a></li>
      </ul>
    </article>
  );
}
