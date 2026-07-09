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
