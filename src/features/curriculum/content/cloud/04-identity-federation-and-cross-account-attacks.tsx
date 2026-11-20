import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IdentityFederationAndCrossAccountAttacks() {
  return (
    <div className="prose-hh">
      <h1>Multi-Cloud Identity Federation & Cross-Account Attacks</h1>
      <p>
        Lesson 2's IAM material covered privilege escalation within a single AWS account. Real organizations
        run many accounts/subscriptions/projects, federated together through trust relationships — and those
        trust relationships are, themselves, a distinct and heavily-researched attack surface.
      </p>

      <h2>AssumeRole and cross-account trust: the mechanism</h2>
      <CodeBlock label="how one AWS account grants another account access, without sharing credentials">{`# Account A's IAM role trust policy explicitly allows Account B to assume it:
{
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::222222222222:root" },
  "Action": "sts:AssumeRole"
}

# any identity in account 222222222222 (the ENTIRE account, per this
# policy's "root" principal -- not one scoped user) can now:
aws sts assume-role --role-arn arn:aws:iam::111111111111:role/CrossAccountAccess \\
  --role-session-name pivot
# receiving temporary credentials valid in Account A, without ever holding
# a real Account A credential of its own`}</CodeBlock>
      <Callout variant="tip">
        <p>
          A trust policy scoped to an entire account's "root" principal (rather than one specific role/user
          ARN) is functionally saying "I trust EVERY identity in that other account" — a scoping mistake with
          the same shape as the API Security module's over-broad authorization findings, just expressed in IAM
          trust-policy syntax instead of a missing ownership check.
        </p>
      </Callout>

      <h2>The AWS IAM privilege escalation research: a systematic methodology</h2>
      <p>
        In 2018, researchers at Rhino Security Labs published a widely cited, systematic catalog of over 20
        distinct AWS IAM privilege escalation paths — permission combinations that, individually, look
        reasonable, but combined let a low-privilege identity escalate to full administrative access. It
        remains a foundational reference for cloud penetration testing methodology.
      </p>
      <CodeBlock label="one representative privesc path from that research — CreatePolicyVersion">{`# a user with ONLY iam:CreatePolicyVersion on their own attached policy
# (seemingly narrow -- "let me update my own policy") can set an entirely
# NEW default policy version granting themselves full admin:
aws iam create-policy-version \\
  --policy-arn arn:aws:iam::111111111111:policy/MyOwnPolicy \\
  --policy-document file://admin-policy.json \\
  --set-as-default
-- the permission looked scoped ("modify a policy I already have attached"),
   but IAM policy documents CONTROL PERMISSIONS THEMSELVES -- a user who
   can edit their own policy can simply grant themselves anything`}</CodeBlock>
      <Callout variant="warn">
        <p>
          This is the cloud-IAM-specific instance of a recurring theme across this entire course: a permission
          that sounds narrow in plain English ("edit your own policy," "pass a role to a new instance") can
          have much broader real consequences once you trace exactly what that permission actually allows the
          holder to configure — the same "read the actual capability, not just the permission's name" discipline
          from the API Security module's excessive-agency-adjacent findings.
        </p>
      </Callout>

      <h2>Cross-tenant attacks in SaaS/identity providers</h2>
      <Callout variant="incident">
        <p>
          <strong>Real incident — the Microsoft "Storm-0558" Azure token-forging breach, disclosed July 2023:</strong>{' '}
          Microsoft disclosed that a China-based threat actor tracked as Storm-0558 had obtained a Microsoft
          account (MSA) consumer signing key and used it to forge authentication tokens, granting access to
          Exchange Online and Outlook email accounts belonging to roughly 25 organizations, including multiple
          US federal government agencies. The US Cyber Safety Review Board's subsequent investigation found the
          key had improperly gained validity for BOTH consumer AND enterprise systems due to a validation flaw
          in Microsoft's own identity infrastructure — meaning a single compromised signing key crossed a trust
          boundary it was never supposed to cross, letting the actor authenticate as if they held a legitimate
          enterprise identity token for essentially any targeted account. It remains a landmark example of how
          a single compromised identity-provider trust anchor can cascade into a mass cross-tenant breach far
          more severe than a single compromised account or workload.
        </p>
      </Callout>

      <h2>Testing cross-account trust in practice</h2>
      <CodeBlock label="the enumeration workflow for a real assessment">{`aws iam list-roles --query "Roles[?AssumeRolePolicyDocument.Statement[?Principal.AWS!=null]]"
  -- surfaces every role in the current account trusting an EXTERNAL
     principal, the starting point for mapping the account's actual
     cross-account trust graph rather than assuming it matches documentation

aws sts get-caller-identity          # confirm current effective identity
                                        after any assume-role pivot, exactly
                                        like re-checking "whoami" after a
                                        privesc technique elsewhere in this
                                        course`}</CodeBlock>

      <p>
        With cross-account and federated identity risk covered, the next lesson turns to detecting exactly
        these kinds of attacks once they're in progress — cloud-native logging and the detection patterns built
        on top of it.
      </p>
    </div>
  );
}
