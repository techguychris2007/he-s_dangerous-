import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function CloudSecurityFundamentals() {
  return (
    <div className="prose-hh">
      <h1>Cloud Security Fundamentals</h1>
      <p>
        Most modern infrastructure runs on AWS, Azure, or GCP — and most cloud breaches aren't caused by
        the cloud provider being hacked, they're caused by the customer misconfiguring what the provider
        gave them. This module covers the handful of misconfiguration patterns responsible for the vast
        majority of real-world cloud incidents.
      </p>

      <h2>The shared responsibility model</h2>
      <CodeBlock label="who's responsible for what">{`CLOUD PROVIDER is responsible for:      YOU are responsible for:
- Physical data center security          - Identity & access management (IAM)
- Hypervisor/host security                - Network configuration (security groups, firewalls)
- Infrastructure availability               - Data encryption & classification
                                              - Application-level security
                                              - "Security OF the cloud" is theirs;
                                                "Security IN the cloud" is yours`}</CodeBlock>
      <p>
        Nearly every headline cloud breach — public S3 buckets, exposed databases, leaked credentials —
        falls squarely on the "your responsibility" side of this line.
      </p>

      <h2>Object storage misconfiguration (S3 and equivalents)</h2>
      <p>
        Cloud object storage defaults to private, but is trivially easy to misconfigure as public — a
        single ACL setting or bucket policy mistake exposes everything inside to anyone with the bucket
        name, which is often guessable (company-name-backups, company-name-assets).
      </p>
      <CodeBlock label="what a public bucket looks like from the outside">{`curl https://bucket-name.s3.amazonaws.com/
# a misconfigured bucket returns a full XML listing of every object inside —
# no credentials needed at all`}</CodeBlock>

      <h2>The same mistake, three different provider names</h2>
      <p>
        Everything in this module uses AWS terminology since it's the market leader, but every major provider
        has a direct equivalent — and the exact same misconfiguration pattern shows up on all three, just
        under a different service name:
      </p>
      <CodeBlock label="the same failure mode, mapped across providers">{`Object storage        AWS S3              Azure Blob Storage         GCP Cloud Storage
IAM                    AWS IAM              Azure Entra ID (RBAC)      GCP IAM
Metadata service        169.254.169.254      169.254.169.254            169.254.169.254 (same address,
                                                                          different response format)
Secrets manager           AWS Secrets Manager   Azure Key Vault            GCP Secret Manager
Audit logging               AWS CloudTrail        Azure Activity Log         GCP Cloud Audit Logs`}</CodeBlock>
      <p>
        Notice the metadata service address is identical across all three — 169.254.169.254 is a
        link-local address reserved for exactly this purpose, which is why an SSRF-to-credential-theft
        finding transfers almost mechanically from an AWS engagement to an Azure or GCP one: same address,
        same underlying attack, just a different JSON shape in the response.
      </p>

      <h2>The instance metadata service: cloud's signature SSRF target</h2>
      <p>
        Every major cloud provider runs a metadata service reachable only from inside a running instance,
        at a fixed address — most famously <code>169.254.169.254</code> on AWS. It's meant to let an
        instance query its own configuration and temporary IAM credentials without hardcoding secrets.
        The problem: if an application on that instance has an SSRF vulnerability (covered in the Web
        Application Hacking module), an attacker can make the *server* request that metadata endpoint on
        their behalf — turning a web bug into full cloud credential theft.
      </p>
      <CodeBlock label="the attack in one line">{`vulnerable_app.fetch("http://169.254.169.254/latest/meta-data/iam/security-credentials/<role-name>")
# returns temporary AWS access keys for whatever IAM role is attached to that instance`}</CodeBlock>
      <Callout variant="danger">
        <p>
          This exact technique was central to a major real-world breach in which an SSRF vulnerability in
          a web application led to full compromise of a company's cloud environment via stolen instance
          credentials — it's not a theoretical attack, it's one of the most consequential cloud attack
          patterns in the industry's history.
        </p>
      </Callout>

      <h2>Infrastructure-as-Code secrets</h2>
      <p>
        Tools like Terraform and CloudFormation manage cloud resources as code — and their "state" files
        (Terraform's <code>.tfstate</code> in particular) routinely contain plaintext secrets for every
        resource they provision: database passwords, API keys, private key material. State files are
        meant to stay private and are frequently, accidentally, not.
      </p>

      <h2>Case study: one compromised SaaS integration, 700+ downstream victims</h2>
      <p>
        In August 2025, a threat actor tracked as UNC6395 compromised the GitHub environment belonging to
        Salesloft, a sales-engagement SaaS vendor. From there, the actor pivoted into the AWS environment
        of Drift, a chatbot product Salesloft owns, and stole OAuth refresh tokens that Drift held on behalf
        of every customer who had connected the Drift-to-Salesforce integration. Those stolen tokens let the
        attacker impersonate the trusted Drift application itself and use its already-granted API access to
        reach Salesforce data across more than 700 downstream customer organizations — in some cases
        including API keys and cloud credentials that support staff had innocently pasted into support-case
        text fields, handing the attacker a second wave of credentials to abuse well beyond Salesforce
        itself.
      </p>
      <p>
        No firewall was breached, no password was guessed, and no perimeter defense at any of those 700+
        victim organizations was ever tested — because the attacker never touched their perimeter or login
        page at all. A single OAuth integration, trusted and pre-authorized by each of those organizations,
        was itself the access path. This is a distinctly cloud/SaaS-era supply chain risk worth naming
        explicitly: the security of every app you connect via OAuth becomes, transitively, part of your own
        attack surface, and it's a dependency most organizations never think to audit the way they audit
        their own infrastructure.
      </p>
      <Callout variant="danger">
        <p>
          The practical lesson: treat every third-party OAuth grant and API integration as a credential of
          its own that needs an inventory, an owner, and a revocation plan — "we don't control that vendor's
          security" is true and also irrelevant, because their compromise becomes your breach the moment a
          token they hold grants access to your data.
        </p>
      </Callout>

      <Callout variant="tip">
        <p>
          Notice the pattern across all three techniques in this module: cloud security failures are
          rarely exotic — they're the same fundamentals (access control, don't expose secrets, validate
          server-side requests) applied to unfamiliar-looking infrastructure. If you're solid on the
          fundamentals from earlier modules, cloud security is mostly about knowing where to look.
        </p>
      </Callout>
    </div>
  );
}
