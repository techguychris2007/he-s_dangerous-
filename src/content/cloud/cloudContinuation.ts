import type { CurriculumLesson } from '../curriculumDefinition';

type Chapter = Pick<CurriculumLesson, 'id' | 'slug' | 'title' | 'summary' | 'prerequisite' | 'sections' | 'labs' | 'misconceptions' | 'exercise' | 'quiz'>;
function chapter(value: Chapter): CurriculumLesson {
  return { ...value, minutes: 40, outcomes: value.sections.map(section => section.title),
    introduction: value.summary,
    table: { headers: ['Operation', 'Identity', 'Resource'], rows: [] },
    sources: [
      { title: 'AWS shared responsibility', url: 'https://aws.amazon.com/compliance/shared-responsibility-model/' },
      { title: 'AWS IAM security best practices', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html' },
      { title: 'AWS IAM policy evaluation', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html' },
      { title: 'AWS S3 security practices', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html' },
      { title: 'EC2 instance metadata', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html' },
      { title: 'CloudTrail data events', url: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-data-events-with-cloudtrail.html' },
      { title: 'CloudTrail event types and control/data plane', url: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-events.html' },
    ],
  };
}

export const cloudFoundation = chapter({
  id: 'cloud-1', slug: 'cloud-security-fundamentals', title: 'Cloud Security Fundamentals',
  summary: 'Learn accounts, regions, service models and API operations before studying cloud permissions or exploitation.',
  prerequisite: 'Basic files, network requests and user accounts; these concepts are explained below.',
  sections: [
    { title: 'A cloud service is accessed through an API', paragraphs: [
      'A server runs a program and answers requests. A cloud provider exposes APIs for requesting servers, storing objects, managing identities and many other operations. The console is a graphical client of these services; a command-line tool is another client. Creating a virtual machine is a management operation. Sending an HTTP request to the application running on that machine is an application operation. They may use different identities and logs.',
      'An account is an administrative and billing boundary. A region is a geographic service location; availability zones provide distinct infrastructure locations within a region. Not every service is regional: IAM has different scope from a regional EC2 instance. A resource identifier names an object; an identifier is not a password. An AWS ARN contains partition, service, region/account fields where applicable, and a resource part. Always read the service-specific format rather than assuming every ARN has identical populated fields.',
    ] },
    { title: 'IaaS, PaaS and SaaS change your responsibilities', paragraphs: [
      'Infrastructure as a Service exposes infrastructure such as virtual machines and networks. With EC2, the customer normally manages the guest operating system, application and its configuration while AWS operates underlying physical infrastructure. Platform as a Service manages more of the runtime platform; the customer still owns application behavior, identity choices and data handling. Software as a Service supplies an application, but customer account access, sharing configuration and data classification still matter.',
      'Managed does not mean permission-free or automatically appropriate for every workload. A managed database may handle host patching while you still choose its network access, users, encryption configuration and retention. A private cloud describes a deployment model, not proof of secure configuration. Public cloud does not mean that every object is publicly readable. Hybrid systems connect multiple environments and introduce routes, federation and configuration boundaries that need explicit ownership.',
    ] },
    { title: 'Control plane and data plane answer different questions', paragraphs: [
      'The control plane creates and changes cloud resources: creating a bucket, changing a firewall rule, attaching a role policy or updating a database configuration. The data plane uses those resources: reading an object, querying a database, invoking a function or sending a message. The same service may expose both kinds of operations through separate APIs and authorization checks. A control-plane permission to configure a storage service does not automatically mean the caller can read every stored object, and an object-read permission does not grant permission to change the bucket policy.',
      'This distinction matters during investigations because audit coverage can differ. In AWS CloudTrail, management events describe control-plane operations. Data events describe operations on or within resources, such as S3 object reads and writes, and are not included by default in every trail configuration. A defender who only checks management events might see who changed the bucket but lack evidence about which objects were accessed. Confirm which event classes are enabled for the resources and time period under investigation; absence of a record is meaningful only when collection was active and the event type was covered.',
      'Cloud platforms use different names and implementations for these planes. Azure documentation describes Azure Resource Manager as the control plane and resource-specific endpoints as data plane. Learn the provider’s service-specific behavior: a label such as “control plane” is a reasoning aid, not a guarantee that every API fits one simple boundary.',
    ] },
    { title: 'Identity is a lifecycle, not just a username and password', paragraphs: [
      'A human user signs in through an identity provider and may receive a short-lived role session. A workload, such as a virtual machine or CI job, should receive an identity through a platform-supported role or federation mechanism instead of storing a developer’s long-lived key. A service identity can be powerful even though no person types its password. Inventory human identities, workload identities, federation trust, attached permissions, credential lifetime and the owner responsible for rotation or revocation.',
      'Temporary credentials reduce the time a leaked credential remains usable, but they still carry authority until they expire or are otherwise invalidated. A stolen session can still read or modify every resource its policies permit. Use least privilege, short session duration appropriate to the workflow, MFA for human access, and restrictions on where federation assertions may originate. In a CI workflow, for example, trust should constrain the expected issuer and the repository or deployment context, not merely accept any token signed by the same identity provider.',
      'The root or account-owner identity is a recovery and account-governance boundary, not a routine administrator login. Protect it with strong phishing-resistant MFA where supported, avoid creating unnecessary long-lived keys, and use delegated roles for ordinary operations. Keep break-glass access tightly controlled, monitored and periodically tested so emergency access exists without becoming the default path.',
    ] },
    { title: 'Shared responsibility must be mapped to the actual service', paragraphs: [
      'The provider secures the physical facilities and the underlying cloud infrastructure. The customer remains responsible for data classification, identity choices, access grants, endpoint security and the configuration of services the customer controls. The split moves as the service becomes more managed: with a virtual machine, the customer normally patches the guest operating system; with a managed application platform, the provider patches the host runtime but the customer still secures application code, secrets, identities and data access.',
      'Do not learn the shared-responsibility model as one universal diagram. It is a starting point, and the exact boundary depends on the service, options selected, contract and jurisdiction. For each workload, write down who configures each control, who observes failures, and who responds to an incident. A managed database can remove host maintenance from your team while leaving network exposure, database authorization, backup retention and encryption-key policy as customer decisions.',
      'Compliance labels do not prove that a particular deployment is compliant. The customer still needs to configure the service correctly, choose an appropriate region and retention policy, document data flows, and verify that evidence is collected. Legal obligations vary by data type and jurisdiction; use the organization’s compliance and legal guidance for binding decisions.',
    ] },
    { title: 'Identity, network reachability and data access are separate', paragraphs: [
      'Authentication establishes the requesting identity. Authorization decides whether that identity may perform an action on a resource under the relevant conditions. A network route provides a path; a firewall filters traffic on that path. A publicly reachable application can still require correct authorization. Conversely, a private network does not stop an over-permissioned role from reading data through a permitted service endpoint.',
      'Consider an application retrieving one object from S3. The application role needs the appropriate object action, the storage policy must permit the request under its evaluation rules, and applicable deny restrictions must not block it. Encryption-at-rest protects stored bytes, but the service can decrypt for an authorized reader. It therefore cannot replace an access policy. A presigned URL authorizes its signed operation for a limited lifetime and context; treat it as a sensitive capability, not a harmless filename.',
    ] },
    { title: 'Begin with an identity check, not resource creation', paragraphs: [
      'The command below calls STS to describe the identity of the configured AWS CLI session. It does not create resources, enumerate every account or grant new permissions. The profile must already be configured through the supported authentication flow. Region configuration affects regional calls. Never paste access keys or session tokens into screenshots, exercises or public discussions.',
      'In DarkWorld, terminal cloud commands operate on scenario fixtures. They do not deploy an AWS account. The terminal teaches command shape and selected concepts; it is not the AWS policy engine. Real-account testing additionally requires owner authorization, the current AWS testing policy, cost controls and cleanup procedures. An old slide’s list of permitted services must not be treated as the current provider policy.',
    ], code: 'aws --version\naws configure list\naws sts get-caller-identity\n# Expected fields: UserId, Account and Arn for your configured session.\n# No credentials should be printed or shared.', label: 'Read-only identity inspection with a configured AWS CLI' },
  ],
  labs: ['cloud-public-s3-bucket', 'cloud-multi-account-cross-account-iam'],
  misconceptions: ['A public cloud is not synonymous with public data.', 'An ARN identifies a resource but does not authorize access.', 'A simulator does not reproduce all AWS evaluation rules.'],
  exercise: { scenario: 'A private database is read by an application role with broad permissions.', task: 'Name the network and identity controls separately and explain why private addressing alone is insufficient.', answer: 'Private addressing concerns reachability. The application’s service identity and database/object grants determine what a permitted connection can do. Restricting one does not automatically restrict the other.', evidence: 'Your description of the distinct network and identity boundaries.' },
  quiz: [{ question: 'What does get-caller-identity establish?', options: ['Which configured identity made the call', 'Permission to perform every action', 'Ownership of every regional resource'], answer: 0 }],
});

export const cloudContinuationLessons: CurriculumLesson[] = [
  chapter({
    id: 'cloud-modern-1', slug: 'iam-actions-resources-and-explicit-deny', title: 'IAM Policies: Actions, Resources and Explicit Deny',
    summary: 'Read real JSON policies and distinguish a narrowly granted operation from the complete effective permission decision.',
    prerequisite: 'JSON objects, identity and resource identifiers. The first section explains the policy vocabulary.',
    sections: [
      { title: 'Read the request before the policy', paragraphs: [
        'A principal is the requesting identity, such as an IAM role session. An action names a service operation, such as s3:GetObject. A resource is the object affected by that action. Conditions add context tests, such as a required transport property or a permitted source. JSON uses quoted property names, arrays for lists and braces for objects. A policy statement declares Effect, Action and Resource, with other fields where the policy type requires them.',
        'Identity-based policies attach permissions to an identity; resource-based policies attach permissions to a resource. A role trust policy controls who may assume a role, while its permission policies control what the resulting role session can do. Do not confuse these two documents. A successful assume-role operation is not proof that the session may read every bucket.',
      ] },
      { title: 'Write an object permission with the correct ARN shape', paragraphs: [
        'The policy below allows GetObject for one object prefix. It does not allow listing the bucket, writing objects or changing policies. ListBucket applies to a bucket ARN, while GetObject applies to object ARNs. Confusing these resource shapes is a common cause of AccessDenied. The bucket name here is a synthetic fixture; this policy is educational data and is not installed by the lesson.',
        'The Version field names the policy-language version, not its deployment date. A wildcard may be appropriate in an object prefix or required by an action that does not support resource-level permissions; banning every asterisk is not a correct policy-design rule. Narrow the action and resource according to the service’s actual authorization support.',
      ], code: '{\n  "Version": "2012-10-17",\n  "Statement": [{\n    "Effect": "Allow",\n    "Action": "s3:GetObject",\n    "Resource": "arn:aws:s3:::dw-training-records/reports/*"\n  }]\n}', label: 'Minimal identity-policy fixture for reading one prefix' },
      { title: 'Effective permissions combine multiple policy types', paragraphs: [
        'An explicit applicable deny overrides an allow. Permissions boundaries and organization policies can restrict the available permissions; they do not grant an action merely by allowing it in their maximum set. Resource-based grants and role-session principals have important evaluation nuances. The full decision also depends on policy type, principal type, request context and service behavior. A two-line Python allow/deny evaluator would not be a faithful AWS implementation.',
        'Cross-account access generally needs the appropriate permission relationship on both sides under the service’s rules. A policy simulator is useful for selected checks but has documented limits and does not replace a controlled request to the intended fixture. Preserve the action, resource ARN and identity when diagnosing a denial. Do not respond by attaching AdministratorAccess.',
      ] },
      { title: 'Validate both a permitted and a denied operation', paragraphs: [
        'Use a known report object and a known object outside the permitted prefix in a disposable account. An allowed read establishes that one action succeeded; a denied read checks the intended restriction. Neither result establishes every other permission. Object existence, encryption-key permissions, organization restrictions and endpoint policies can all affect the observed result.',
        'In the paired scenario, identify the role and read its policy summary before attempting the specified action. The summary is a simplified training representation rather than a complete AWS policy document. Translate it into action/resource reasoning and state which parts of a real evaluation are not modeled.',
      ] },
    ],
    labs: ['cloud-iam-passrole-privesc', 'cloud-multi-account-cross-account-iam'],
    misconceptions: ['Trust and permission policies have different purposes.', 'Boundaries and SCPs do not grant permissions by themselves.', 'A simulator is not the full authorization service.'],
    exercise: { scenario: 'A role can GetObject under reports/* but receives AccessDenied when listing the bucket.', task: 'Explain the missing permission and identify its resource type.', answer: 'Listing requires s3:ListBucket on the bucket ARN; GetObject on object ARNs is a separate action. Do not infer that the read grant failed merely from a listing denial.', evidence: 'Action/resource pairs for the two operations.' },
    quiz: [{ question: 'Which ARN shape applies to GetObject?', options: ['Only a role ARN', 'An object ARN including its key or prefix', 'Only an account number'], answer: 1 }],
  }),
  chapter({
    id: 'cloud-modern-2', slug: 'temporary-credentials-role-trust-and-passrole', title: 'Temporary Credentials, Role Trust and PassRole',
    summary: 'Understand access keys, session tokens, role assumption and service delegation without confusing them with ordinary passwords.',
    prerequisite: 'Authentication proves identity; authorization limits actions. IAM roles and JSON policies are introduced in the preceding lesson.',
    sections: [
      { title: 'A temporary credential is a three-part set', paragraphs: [
        'An access-key ID identifies a credential, the secret access key is used in request signing, and temporary credentials also require a session token. These are not interchangeable fields. Omitting the token can make an otherwise correct temporary key pair unusable. Expiry limits lifetime but does not make a currently valid credential harmless.',
        'SDKs and the CLI use credential-provider chains: environment variables, profile settings and workload mechanisms can influence the identity used by a call. The exact order depends on the tool. An old exported environment key can override the profile you intended to use. get-caller-identity helps reveal the resulting identity without displaying the secret.',
      ] },
      { title: 'AssumeRole and PassRole are different operations', paragraphs: [
        'AssumeRole requests a new role session under the target role’s trust and applicable caller permissions. PassRole permits a caller to designate a role for a supported AWS service to use; it does not simply hand the caller that role’s credentials. The service role needs the appropriate trust relationship, and the caller also needs relevant service operations.',
        'A privilege-escalation path requires a meaningful combination: the caller can pass a powerful role, control a workload that uses it, and exercise that workload’s authority. A PassRole permission alone is not proof of that complete path. Conditions such as the intended service can narrow delegation but still need compatible resource and workload controls.',
      ] },
      { title: 'Federation avoids distributing static secrets', paragraphs: [
        'Federation connects an external authenticated identity or workload assertion to a cloud role. A CI job can obtain an OIDC assertion and exchange it under a configured trust policy. The policy should restrict the intended issuer, audience and subject context, such as a repository and permitted branch or environment. A valid token from the issuer is not sufficient if any project can assume the role.',
        'A customer-facing integration may require an external ID to help address the confused-deputy problem. That value is not a replacement for principal restrictions or a general-purpose secret password. Human sessions, workload sessions and third-party access need different trust contracts and expiry/revocation procedures.',
      ] },
      { title: 'Interpret session evidence without exposing credentials', paragraphs: [
        'An assumed-role ARN names a role session, not an IAM user. Record the role, account and relevant session attribution while redacting secrets. A leaked credential response does not itself establish which actions it can perform. Test only the designated fixture operation and preserve the relevant denied comparison.',
        'Temporary credentials reduce long-lived-secret handling, but incident response must still consider active sessions and related authorization paths. Rotating an unrelated application password does not invalidate every role session. Follow the provider’s supported revocation and containment procedures rather than inventing a universal logout command.',
      ], code: 'aws sts get-caller-identity\naws configure list\n# Inspect the credential source and returned ARN.\n# Do not print AWS_SECRET_ACCESS_KEY or AWS_SESSION_TOKEN.', label: 'Identify the active session without dumping secrets' },
    ],
    labs: ['cloud-iam-passrole-privesc', 'cloud-github-leaked-iam-keys'],
    misconceptions: ['PassRole is not AssumeRole.', 'Temporary keys still have real authority.', 'A CI identity needs subject restrictions, not issuer verification alone.'],
    exercise: { scenario: 'A CI job from an unintended repository can obtain the deployment role.', task: 'Identify the missing trust restriction.', answer: 'The trust policy must restrict the appropriate assertion context, including the intended subject and audience. Trusting all assertions from a shared issuer is broader than trusting the intended deployment job.', evidence: 'The required assertion fields and intended values.' },
    quiz: [{ question: 'Which additional field do temporary credentials require?', options: ['A bucket ACL', 'A session token', 'A public IP'], answer: 1 }],
  }),
  chapter({
    id: 'cloud-modern-3', slug: 's3-object-ownership-public-access-and-encryption', title: 'S3: Object Ownership, Public Access and Encryption',
    summary: 'Separate listing, reading, writing, ownership and encryption instead of calling every bucket public or private.',
    prerequisite: 'Objects are stored bytes identified by keys; a prefix is a key-name convention, not an ordinary directory.',
    sections: [
      { title: 'Buckets contain objects, not filesystem directories', paragraphs: [
        'An S3 object has a key, content and associated metadata. reports/january.csv is a key whose slashes create a familiar visual grouping. Listing keys and retrieving one known key are separate permissions. A denied listing does not prove that every known object is unreadable, and a readable object does not prove that new objects can be written.',
        'Current S3 general-purpose bucket defaults include bucket-owner-enforced Object Ownership with ACLs disabled and protective public-access settings for new buckets. Existing buckets and deliberately changed settings can differ. Do not reuse an old tutorial’s ACL assumptions without inspecting the actual configuration.',
      ] },
      { title: 'Block Public Access adds another restriction', paragraphs: [
        'Public-access blocking settings can apply at multiple administrative scopes. An apparently public policy statement may not produce public access when the applicable blocking controls reject or restrict it. Inspect effective configuration and the actual supported request. Authenticated AWS users is not synonymous with users from your own account.',
        'A public-read requirement for static content should be deliberately bounded. A private CloudFront origin can use origin access control under the supported design; a WAF in front of one endpoint does not automatically prevent access through an independently exposed S3 path. CloudFront, storage authorization and application authorization solve different parts of the architecture.',
      ] },
      { title: 'Encryption does not replace a permission policy', paragraphs: [
        'S3 encrypts new object uploads by default with server-side encryption. SSE-S3 uses S3-managed keys, while SSE-KMS integrates KMS keys and associated access requirements. An authorized read can still return plaintext. Transport encryption protects the request path; at-rest encryption protects stored representation. An encrypted publicly readable object can therefore still disclose its content.',
        'Versioning preserves object versions under its behavior; it is not an independent backup policy or automatic protection against every deletion path. Recovery requires the relevant version retention, permissions and a tested restore operation. A presigned URL carries authorization for its specific signed operation and expiry; do not log or distribute it as if it were an ordinary public URL.',
      ] },
      { title: 'Run a bounded anonymous read in the designated fixture', paragraphs: [
        'The platform lab gives a specific synthetic bucket name. Use anonymous CLI mode to distinguish anonymous access from credentials already present in the environment. List only the designated fixture and retrieve the named training object. Do not guess real organization bucket names or download unrelated data.',
        'In an actual account, read the current public-access configuration, ownership controls, bucket policy and encryption settings using authorized APIs. Those configuration calls themselves require permissions; an AccessDenied response is a visibility limitation, not proof of a secure configuration. Record operation-level results instead of assigning a single exposure label to the whole service.',
      ], code: 'aws s3 ls s3://meridian-corp-backups/ --no-sign-request\n# The lab supplies the object key; reading it is a separate operation.\n# This terminal uses synthetic fixture data, not a live AWS bucket.', label: 'Anonymous listing syntax for the existing DarkWorld fixture' },
    ],
    labs: ['cloud-public-s3-bucket', 'cloud-public-write-bucket'],
    misconceptions: ['Listing, reading and writing have separate permissions.', 'Default encryption does not prevent authorized or public reads.', 'Prefixes are not operating-system directories.'],
    exercise: { scenario: 'A bucket denies listing, but a known test object can be retrieved anonymously.', task: 'Describe the exact exposure.', answer: 'Anonymous retrieval of that known object is permitted; anonymous listing is denied. Neither result proves the permissions on all other objects or write operations.', evidence: 'Two separate action results against the training fixture.' },
    quiz: [{ question: 'Does default at-rest encryption make a public read confidential?', options: ['Yes, because ciphertext is always returned', 'Only for objects with slashes', 'No; authorized service reads can return plaintext'], answer: 2 }],
  }),
  chapter({
    id: 'cloud-modern-4', slug: 'imdsv2-ssrf-and-workload-credentials', title: 'IMDSv2, SSRF and Workload Credentials',
    summary: 'Learn the metadata protocol, the application request boundary and the limitations of token-based metadata protection.',
    prerequisite: 'HTTP methods describe operations; headers carry named request fields. SSRF means an application makes a request influenced by an untrusted party.',
    sections: [
      { title: 'Link-local metadata is not a public website', paragraphs: [
        'EC2 metadata exposes instance information from inside the relevant workload environment. Its familiar IPv4 address is link-local, not a public destination to scan. Metadata credentials are associated with the attached instance role and have that role’s permissions. Not every instance has an attached role, and not every metadata field contains a secret.',
        'Provider protocols differ: matching an address does not establish matching headers, token flows, identity semantics or reachability. AWS, Azure and Google Cloud require their own supported request contracts. A server-side request vulnerability has to satisfy the actual environment and protocol conditions before it can disclose credentials.',
      ] },
      { title: 'IMDSv2 uses a session token', paragraphs: [
        'An IMDSv2 client requests a token using PUT and the token-lifetime header, then supplies that token in subsequent metadata requests. Requiring IMDSv2 removes the simple token-free IMDSv1 path. Metadata options, endpoint state, request routing and hop-limit behavior affect the result; do not assume that every account or instance uses identical defaults.',
        'If an application lets an attacker control methods, headers and follow-up requests, the application boundary may still be inadequate even when metadata requires a token. That is a stronger prerequisite than a basic URL-only fetch. IMDSv2 is a valuable defense, but it is not a universal proof that every SSRF path is impossible.',
      ] },
      { title: 'Inspect configuration before attempting access', paragraphs: [
        'For a real designated instance, authorized describe operations reveal MetadataOptions without retrieving role credentials. Check whether the endpoint is enabled and tokens are required. The command below lists configured instances in the selected account/region; use an explicit approved instance filter for a real exercise. It is not supported by every DarkWorld terminal fixture.',
        'Prevent SSRF using an application-specific destination contract, safe parsing, redirect handling and network egress controls. DNS resolution and rebinding, alternate address forms and redirects can affect enforcement. A string check for the literal metadata address is incomplete. Narrow the workload role independently so a successful disclosure has less authority.',
      ], code: 'aws ec2 describe-instances --query "Reservations[].Instances[].{Id:InstanceId,Metadata:MetadataOptions}"\n# Real account: read-only inspection requires suitable permissions.\n# Do not extract or print credentials as a configuration check.', label: 'Real AWS CLI configuration inspection; not a simulator command' },
      { title: 'The lab proves one request path', paragraphs: [
        'The existing lab simulates a controlled fetch endpoint and a particular credential-gated effect. Complete the provided baseline and altered request, then identify the authority used in the resulting service operation. A fixture credential is training data; it should never be reused on a live account.',
        'A failed fetch can reflect method restrictions, response parsing, routing, endpoint settings or token requirements. State the layer actually tested. Do not call the workload safe merely because one URL form failed, and do not call the account compromised merely because a non-sensitive metadata response was visible.',
      ] },
    ],
    labs: ['cloud-metadata-ssrf', 'cloud-imdsv2-bypass-method-controllable-ssrf'],
    misconceptions: ['Metadata reachability is environment-specific.', 'IMDSv2 is not a replacement for SSRF prevention.', 'Credential disclosure does not imply administrator permissions.'],
    exercise: { scenario: 'A fetch feature allows GET URLs but cannot set headers or use PUT.', task: 'Explain which prerequisite of an IMDSv2 token flow is missing.', answer: 'The demonstrated client cannot perform the required token PUT with its lifetime header or supply the returned token in a follow-up request. This describes the observed request capability, not a universal conclusion about all SSRF paths.', evidence: 'Method/header capabilities and relevant metadata options.' },
    quiz: [{ question: 'Which operation starts the EC2 IMDSv2 token flow?', options: ['A PUT request with a token-lifetime header', 'Any public DNS query', 'Listing an S3 bucket'], answer: 0 }],
  }),
  chapter({
    id: 'cloud-modern-5', slug: 'vpc-routes-security-groups-and-endpoints', title: 'VPC Routes, Security Groups and Private Endpoints',
    summary: 'Trace cloud network reachability through addressing, routes, stateful filters and service endpoints.',
    prerequisite: 'An IP address identifies a network interface destination; a port identifies a transport endpoint. CIDR expresses an address range.',
    sections: [
      { title: 'A subnet is an address range with routing context', paragraphs: [
        'A VPC is a logically isolated network in AWS. A subnet uses part of its address range and is associated with route behavior. A public subnet generally has a route to an internet gateway, but an instance also needs the relevant addressing and permitted traffic path to communicate directly. Merely naming a subnet public does not assign an address or open a service.',
        'A route chooses where matching destination traffic goes. A default IPv4 route covers destinations not matched more specifically. Route selection and a firewall decision are separate: a permissive rule cannot create a missing route. A NAT gateway can support outbound connections for private resources under its design; it is not a general inbound port-forwarding invitation.',
      ] },
      { title: 'Security groups and network ACLs differ', paragraphs: [
        'Security groups are stateful traffic controls associated with supported resources/interfaces. Return traffic for an allowed connection is handled under their stateful rules. Network ACLs are subnet-level stateless controls with ordered rules; return-direction traffic must be considered explicitly. Neither is a substitute for application authentication or object authorization.',
        'Allowing a source security group can express a workload relationship within supported configurations; it does not copy the source group’s rules into the destination group. The application port, protocol, source, route and listening process all matter. A 0.0.0.0/0 ingress rule is broad IPv4 exposure, but IPv6 policy has its own address ranges and must be reviewed separately.',
      ] },
      { title: 'Private endpoints change the path, not every permission', paragraphs: [
        'A service endpoint can keep supported service traffic on a designated private path. Endpoint policy, service resource policy and identity policy may all affect authorization. Private DNS configuration controls name resolution for applicable endpoint types. A service responding through a private endpoint can still be read by an overly broad authorized identity.',
        'For an RDS database, inspect reachability configuration alongside database authentication, TLS and grants. A public-access setting alone does not demonstrate a successful login, and a denied network connection does not prove least privilege inside the database. Preserve these as distinct test results.',
      ] },
      { title: 'Read flow evidence with its limits', paragraphs: [
        'VPC flow logs describe supported traffic metadata such as addresses, ports and accepted/rejected actions. They are not full packet captures and do not generally contain application payloads. Record the interface, traffic direction, timestamps and logging configuration before correlating a flow with an application event.',
        'In the lab, identify the designated database service and compare reachability with authentication results. Real account inspection should use an approved resource inventory and read-only configuration calls. Do not generate traffic across every private address range simply because it belongs to one account.',
      ] },
    ],
    labs: ['cloud-aws-rds-publicly-accessible-weak-password', 'network-recon'],
    misconceptions: ['A route is not a firewall rule.', 'A private endpoint does not automatically authorize the correct users.', 'Flow logs are not application payload captures.'],
    exercise: { scenario: 'A database port is reachable, but login is denied.', task: 'Explain the two observations.', answer: 'The observed network path reaches a listening service. The supplied authentication attempt failed. This does not prove all credentials fail or that database grants are correctly restricted.', evidence: 'Separate reachability and authentication results.' },
    quiz: [{ question: 'Which control is stateless at subnet level?', options: ['An SQL role', 'A network ACL', 'A security group'], answer: 1 }],
  }),
  chapter({
    id: 'cloud-modern-6', slug: 'cloudtrail-data-events-and-investigation-timelines', title: 'CloudTrail Data Events and Investigation Timelines',
    summary: 'Read audit events, distinguish event coverage and build a timeline from a complete synthetic example.',
    prerequisite: 'JSON is structured text containing fields and lists. UTC timestamps allow events to be compared across time zones.',
    sections: [
      { title: 'Management events and data events answer different questions', paragraphs: [
        'Management events describe supported resource-management activity, such as changing configuration. Data events describe supported operations against resource data, such as selected object-level actions, when their collection is configured. CloudTrail event history is not a complete record of every S3 object read. Trails and event data stores have explicit coverage, region, resource selection and retention settings.',
        'CloudWatch application logs, CloudTrail audit events, VPC flow logs and service findings are different evidence sources. A GuardDuty finding summarizes a detected condition; it does not reproduce every raw event. A stopped trail, expired retention period or missing data-event selector can create a visibility gap rather than prove an action never happened.',
      ] },
      { title: 'Inspect identity, operation, resource and outcome together', paragraphs: [
        'Read eventTime, eventSource, eventName and userIdentity before interpreting a record. sourceIPAddress provides source context, but proxy/service behavior can affect what it represents. requestParameters and resources help identify the target where provided. errorCode can distinguish a recorded denial from a successful call, but not every success includes an explicit success flag.',
        'The fixture below is synthetic and intentionally small. Sorting timestamps produces an ordered list of recorded observations, not a claim that intermediate events never occurred. Real logs may arrive late or include retries; deduplicate according to stable event identifiers and preserve the original records.',
      ], code: 'events = [\n    {"eventTime": "2026-01-02T10:02:00Z", "eventName": "GetObject", "user": "training-role", "key": "reports/a.csv"},\n    {"eventTime": "2026-01-02T10:01:00Z", "eventName": "ListObjectsV2", "user": "training-role", "errorCode": "AccessDenied"},\n]\nfor event in sorted(events, key=lambda item: item["eventTime"]):\n    outcome = event.get("errorCode", "no error recorded")\n    print(event["eventTime"], event["eventName"], outcome)\n# The denied listing precedes the object-read observation.', label: 'Executable Python ordering of synthetic cloud observations' },
      { title: 'Correlate sessions without leaking credentials', paragraphs: [
        'A role session may be attributed through its identity fields and session context. Correlate compatible events by account, role/session, time and operation. Do not equate every similarly named role across accounts. A session name can be chosen under some workflows and is not by itself strong identity proof.',
        'Store audit evidence with appropriate read permissions, retention and integrity controls. Log validation can support integrity checks under its specific configuration, but does not create events that were never collected. Raw logs can contain sensitive identifiers and request values, so provide controlled access rather than broad public sharing.',
      ] },
      { title: 'Investigate an actual question', paragraphs: [
        'For the logging lab, determine which collection setting changed, who made the recorded call and which evidence remains. Explain the resulting coverage gap using the configured resources and dates. Do not expand the task into client remediation or report handoff; the objective is understanding event coverage and attribution.',
        'For practice, add a second denied event and an out-of-order timestamp to the local fixture, then write your own function returning only denied operations. Add an event with missing identity and keep that missingness explicit. The task teaches parsing and investigation vocabulary without pretending to query a live CloudTrail service.',
      ] },
    ],
    labs: ['py-cloud-events', 'cloud-disabled-logging-coverup', 'cloud-native-detection-container-logs'],
    misconceptions: ['No event is not proof that no action occurred.', 'Findings and raw events are different evidence.', 'A session name alone does not authenticate a person.'],
    exercise: { scenario: 'No GetObject record exists, and S3 data-event logging was never enabled.', task: 'Explain the evidence limit.', answer: 'The collection did not cover the requested object-level observation. You cannot use its absence to conclude that no object read occurred.', evidence: 'The relevant event-selector and retention context.' },
    quiz: [{ question: 'What is required to rely on absence of an object-read event?', options: ['Only the bucket name', 'Only a public IP', 'Relevant event coverage and retention, with their limitations'], answer: 2 }],
  }),
  chapter({
    id: 'cloud-modern-7', slug: 'secrets-kms-state-and-credential-lifecycle', title: 'Secrets, KMS, Terraform State and Credential Lifecycle',
    summary: 'Understand where secrets travel, which permissions protect them and why removing a file does not revoke exposed credentials.',
    prerequisite: 'A secret grants access or supports cryptography. Encryption transforms bytes using a key; encoding only changes representation.',
    sections: [
      { title: 'Secret stores and encryption keys are different services', paragraphs: [
        'A secrets manager stores and retrieves secret values under its access policy and lifecycle features. KMS provides key-management and cryptographic operations; its key policies and grants can affect use of encrypted resources. Reading ciphertext, requesting decryption and reading an application secret are distinct capabilities.',
        'Base64 is an encoding, not encryption. Marking a Terraform value sensitive usually changes display behavior; it does not guarantee the value is absent from state. An environment variable may be accessible through workload or configuration permissions. The relevant storage and API access controls must match the sensitivity of the value.',
      ] },
      { title: 'Infrastructure state can reveal more than source files', paragraphs: [
        'Terraform state records managed resource data and may contain sensitive values. A remote backend needs appropriate authentication, encryption, access policy, locking support and version/retention behavior. A plan artifact can also carry sensitive configuration context. Restrict artifact handling alongside source review.',
        'In the state-file lab, the fixture contains an intentionally exposed synthetic credential. Identify the value and demonstrate only the specified training effect. A real finding would require containment and credential lifecycle work, but this concept lab grades the exposure and authority relationship, not a full engagement methodology.',
      ] },
      { title: 'Revocation is not deletion of the visible copy', paragraphs: [
        'Deleting a key from a repository does not invalidate copies already fetched, build artifacts or cached history. Revoke or rotate through the owning system under its supported lifecycle, then update legitimate consumers. Rotation is a coordinated change, not merely generating a second value and leaving the old one active indefinitely.',
        'Temporary workload identities can reduce static-secret distribution, but their trust policies still need restrictions. Never validate a suspected live leaked credential by trying it without authorization. Synthetic fixtures are enough to learn credential-provider behavior and the difference between exposure, validity and permitted actions.',
      ] },
      { title: 'Minimize what your program returns', paragraphs: [
        'Return a secret identifier and classification when the task is inventory; avoid returning the secret itself. Redact logs at the point where sensitive values can enter them. A last-four-character convention may still be unsuitable for short or low-entropy values, so define the logging contract deliberately.',
        'The example below produces a metadata-only inventory result from a local fixture. It does not decrypt anything, call a secret service or print the password. Extend it with missing keys and unknown secret kinds; do not add real credentials to the exercise.',
      ], code: 'record = {"id": "training/db-password", "kind": "password", "value": "synthetic-only"}\npublic_inventory = {"id": record["id"], "kind": record["kind"], "present": bool(record["value"])}\nprint(public_inventory)\nassert "value" not in public_inventory', label: 'Executable Python inventory without secret disclosure' },
    ],
    labs: ['cloud-exposed-terraform-state', 'cloud-lambda-env-secrets-exposure'],
    misconceptions: ['Sensitive display labels are not universal state encryption.', 'Deleting a leaked copy does not revoke its authority.', 'Encoding does not provide confidentiality.'],
    exercise: { scenario: 'A leaked key was deleted from Git but remains active.', task: 'Explain the unresolved risk.', answer: 'Any previously obtained copy can still authenticate under the credential’s current permissions. Repository deletion and provider-side revocation are separate operations.', evidence: 'A lifecycle explanation using synthetic data only.' },
    quiz: [{ question: 'What prevents an already copied active key from authenticating?', options: ['Supported revocation or relevant expiry', 'Deleting a screenshot', 'Base64 encoding its file'], answer: 0 }],
  }),
  chapter({
    id: 'cloud-modern-8', slug: 'lambda-invocation-and-execution-role-boundaries', title: 'Lambda Invocation and Execution-Role Boundaries',
    summary: 'Distinguish who can invoke a function, who can modify its code and what the running function can access.',
    prerequisite: 'A function accepts input and returns output. A role supplies an identity to a running workload; this differs from the caller identity.',
    sections: [
      { title: 'Serverless still runs application code', paragraphs: [
        'Serverless means the provider manages much of the execution infrastructure. The customer still controls code, dependencies, configuration and permissions. A Lambda invocation carries an event shaped by the invoking service. An HTTP request, queue message and scheduled event therefore need different parsing and authentication assumptions.',
        'A function URL or API integration has its own exposure and authentication settings. Public invocation can be deliberate, but it does not justify returning private data or skipping application authorization. A successful HTTP response proves a reachable execution path, not appropriate access to every downstream object.',
      ] },
      { title: 'The caller and execution role have different authority', paragraphs: [
        'Invocation permission controls who can trigger execution. The execution role controls supported AWS actions performed by the function. Code-modification permission controls who can change what will execute. Combining broad code control with a powerful execution role can create a serious authority path even if direct role assumption is unavailable.',
        'Do not use the runtime role as an application user identifier. If Alice invokes a billing function, its role may retrieve records for multiple customers, while the application must enforce Alice’s permitted records. Derive the actor from a verified invocation/application context, not a user-supplied owner field in the JSON body.',
      ] },
      { title: 'Dependencies and event retries affect behavior', paragraphs: [
        'A layer or package supplies code that runs with the function’s context. Review its provenance and version rather than treating shared layers as inert configuration. A change to a commonly used dependency can affect every attached workload. Pinning and deployment review address this supply-chain boundary.',
        'Event-source delivery can include retries. A payment-like operation needs a suitable idempotency contract so a repeated event does not duplicate the effect. A function timeout is not proof that an external effect did not occur. The downstream operation and durable state decide what happened.',
      ] },
      { title: 'Practice with a deterministic local handler', paragraphs: [
        'The local function below models an authenticated actor passed by trusted server code. It validates a requested object’s owner before returning a title. It is not a full Lambda authorizer implementation and does not authenticate the actor string by itself. Its purpose is to show the application policy that the execution role cannot infer for you.',
        'Write your own handler for the assignment, adding missing ID, malformed input and denied-owner tests. The platform’s over-permissioned-function and public-URL labs teach distinct cloud configuration concepts; finish the specific objectives without adding covert persistence or unrelated account actions.',
      ], code: 'records = {1: {"owner": "alice", "title": "Training invoice"}}\ndef handler(event, verified_actor):\n    if not isinstance(event, dict) or type(event.get("id")) is not int:\n        raise ValueError("An integer id is required")\n    record = records.get(event["id"])\n    if record is None or record["owner"] != verified_actor:\n        raise PermissionError("Not permitted")\n    return {"title": record["title"]}\nprint(handler({"id": 1}, "alice"))', label: 'Complete local Python ownership fixture' },
    ],
    labs: ['cloud-lambda-overpermissioned-role', 'cloud-lambda-function-url-auth-none-public'],
    misconceptions: ['Serverless is not permissionless.', 'The execution role does not identify the application user.', 'A timeout does not prove an external side effect was canceled.'],
    exercise: { scenario: 'A public function runs under a role that can read every customer record.', task: 'Identify the two separate access policies.', answer: 'Invocation policy controls calling the function. Application actor/object policy and downstream role permissions control access to customer data. Restricting one does not automatically implement the other.', evidence: 'The two identities and their distinct permissions.' },
    quiz: [{ question: 'Which identity normally signs the function’s AWS service requests?', options: ['Every browser’s local user', 'The configured execution-role session', 'The bucket filename'], answer: 1 }],
  }),
  chapter({
    id: 'cloud-modern-9', slug: 'cloud-lab-tooling-and-configuration-validation', title: 'Cloud Lab Tooling and Configuration Validation',
    summary: 'Use configuration review, local fixtures and bounded tool checks before deploying a real cloud practice environment.',
    prerequisite: 'A CLI accepts arguments; a profile selects configuration. An infrastructure plan describes proposed resource changes.',
    sections: [
      { title: 'Assessment, exploitation and deployment tools differ', paragraphs: [
        'Prowler assesses supported configuration and security controls. Pacu provides AWS assessment and exploitation modules whose behavior and required permissions vary by module. CloudGoat deploys intentionally vulnerable training scenarios. These tools do not have the same job, and none should be described as automatically harmless because it is popular in training.',
        'Use current project documentation and a separate learning account. A historical installation command may assume an older Python version, package layout or scenario name. Read the selected tool’s installed help and verify dependencies. Do not import every available credential automatically; select only the intended training identity.',
      ] },
      { title: 'Deployment changes resources and can create costs', paragraphs: [
        'Terraform init initializes a working directory and providers/backend configuration; validate checks supported configuration consistency. plan proposes changes under the available state and permissions. A valid plan is not a security approval and may still create publicly exposed or costly resources. Backend and plan artifacts can contain sensitive information.',
        'For an actual learning deployment, choose an isolated account, bounded permissions, a budget and the scenario’s supported cleanup procedure. Review proposed identities and public endpoints before creation. Teardown must be verified against the resource inventory; deleting a local folder does not delete cloud infrastructure.',
      ] },
      { title: 'A local fixture is enough to learn inventory validation', paragraphs: [
        'The example checks that every synthetic inventory record has an account, region and resource identifier. It does not claim to evaluate IAM or prove compliance. A validation script should reject missing context rather than silently assigning every resource to the current account.',
        'For your task, write a validator returning valid records and rejected records with reasons. Add duplicate identifiers, empty regions and a service that is not regional under your declared schema. Decide how the schema represents global services instead of assuming every resource must look like EC2.',
      ], code: 'inventory = [\n    {"account": "111122223333", "region": "us-east-1", "id": "training-instance"},\n    {"account": "", "region": "us-east-1", "id": "missing-account"},\n]\nfor row in inventory:\n    missing = [key for key in ("account", "region", "id") if not row.get(key)]\n    print(row["id"], "rejected: " + ",".join(missing) if missing else "valid fixture")', label: 'Executable local inventory check with a deliberate rejected record' },
      { title: 'Keep platform and provider behavior explicit', paragraphs: [
        'DarkWorld’s cloud terminal is a simulated learning environment. It supports a defined subset of commands and synthetic account data. A complete provider policy simulator, deployment engine and live CloudTrail service are outside that terminal contract. A command unsupported by the terminal may still be a valid command on a real configured AWS CLI.',
        'Use existing cloud labs for the specific concept in their objectives. Real practice environments require current AWS testing rules; prohibited traffic and approval requirements can change. The slide deck’s old service count and contact details are historical context, not instructions for today’s account. Consult the official provider policy before real testing.',
      ] },
    ],
    labs: ['cloud-multi-account-cross-account-iam', 'cloud-exposed-terraform-state'],
    misconceptions: ['Tool popularity is not an authorization decision.', 'Configuration validation is not a complete security audit.', 'Removing local files does not destroy deployed resources.'],
    exercise: { scenario: 'A tool reports one failed control because its identity cannot read the relevant configuration.', task: 'Distinguish a permission/visibility error from a confirmed insecure setting.', answer: 'A failed configuration read does not establish the underlying setting. Record the visibility limitation and obtain the intended authorized evidence before assigning a finding.', evidence: 'The failed read and its stated evidence limit.' },
    quiz: [{ question: 'What does a successful terraform validate establish?', options: ['Every permission is least privilege', 'No cloud costs are possible', 'The configuration passes its supported validation checks'], answer: 2 }],
  }),
];
