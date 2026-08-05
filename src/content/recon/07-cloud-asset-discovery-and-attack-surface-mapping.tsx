import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function CloudAssetDiscoveryAndAttackSurfaceMapping() {
  return (
    <div className="prose-hh">
      <h1>Cloud Asset Discovery & Attack Surface Mapping</h1>
      <p>
        A modern organization's real attack surface increasingly lives in cloud infrastructure that a
        subdomain-focused recon pass never touches directly — storage buckets with no DNS record pointing to
        them, exposed management APIs, and infrastructure discoverable only by NAME-GUESSING rather than
        enumeration. This lesson covers finding it, setting up the Cloud Security module's entire premise.
      </p>

      <h2>Cloud storage bucket discovery: name-guessing, not scanning</h2>
      <CodeBlock label="why bucket names are guessed, not port-scanned into existence">{`# Cloud storage buckets (S3, Azure Blob, GCS) live at predictable URL
# patterns based on their NAME, not an IP address a port scanner would find:
https://<bucket-name>.s3.amazonaws.com/
https://<bucket-name>.blob.core.windows.net/

# Permutation-based bucket hunting, using the company/product name as a seed:
for pattern in backup dev staging prod assets uploads data; do
  echo "acmecorp-$pattern"
  echo "$pattern-acmecorp"
done > bucket-candidates.txt

s3scanner scan -f bucket-candidates.txt
  -- tests each candidate name for existence AND checks its access policy
     in one pass, surfacing exactly the public-bucket misconfiguration
     class from the Cloud Security module's IAM/misconfiguration lesson`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is a fundamentally different discovery model than everything in Lesson 6 — DNS-based subdomain
          enumeration finds what a target has explicitly pointed a hostname at, while cloud asset discovery is
          closer to a dictionary attack against a NAMESPACE, since a bucket needs no DNS record at all to be
          publicly reachable at its default cloud-provider URL.
        </p>
      </Callout>

      <h2>Cloud provider metadata leakage in job postings, code repos, and documentation</h2>
      <CodeBlock label="the highest-signal, lowest-effort cloud recon source">{`# public GitHub/GitLab code search for accidentally-committed cloud config:
"aws_access_key_id" site:github.com
"AccountId" AND "acmecorp" filetype:tf   # leaked Terraform referencing
                                           # real account IDs

# job postings routinely leak real internal tooling/architecture:
"experience with our internal Kubernetes cluster on EKS" site:linkedin.com
  -- confirms cloud provider (AWS) and orchestration platform (EKS)
     before ever touching the target's actual infrastructure`}</CodeBlock>
      <Callout variant="incident">
        <p>
          <strong>Real-world pattern — public GitHub secret scanning, an ongoing, constant finding source:</strong>{' '}
          GitHub's own secret-scanning partner program and independent researchers have repeatedly documented
          that accidentally committed cloud credentials in public repositories are found and exploited by
          automated scanners within MINUTES of being pushed — not hours or days. This isn't a hypothetical
          recon technique; it's one of the most consistently productive and heavily automated real attack
          vectors against cloud infrastructure, precisely because a leaked access key requires no additional
          vulnerability at all — just the key itself, discoverable through nothing more sophisticated than a
          code-search query.
        </p>
      </Callout>

      <h2>Cloud-native service enumeration once you have any foothold</h2>
      <CodeBlock label="extending the Cloud Security module's IAM material to the recon phase">{`aws s3 ls --no-sign-request s3://discovered-bucket-name/
  -- --no-sign-request tests anonymous/public access directly, no
     credentials needed at all -- the fastest confirmation of the exact
     misconfiguration class from the Cloud Security module

nslookup <suspected-internal-hostname>.internal.acmecorp.com
  -- internal-only DNS names occasionally leak through misconfigured
     split-horizon DNS or forgotten public records, revealing internal
     naming conventions useful for later social-engineering or
     credential-stuffing pretexting`}</CodeBlock>

      <p>
        With both web-facing and cloud-native asset discovery covered, the final lesson in this module ties
        every recon technique from all eight lessons into one repeatable, automatable workflow and closes with
        how findings actually get reported.
      </p>
    </div>
  );
}
