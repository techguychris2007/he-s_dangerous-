import type { TypedQuestion } from '../../types';

/** Cloud security and Security+ (GRC, crypto, IAM, architecture, IR) lessons. */
export const CLOUD_GRC_QUESTIONS: Record<string, TypedQuestion[]> = {
  'cloud-1': [
    { prompt: 'A cloud account is an administrative and ____ boundary.', answer: 'billing' },
    { prompt: 'Distinct infrastructure locations inside a region are called availability what?', answer: 'zones', accept: ['availability zones'] },
  ],
  'cloud-modern-1': [
    { prompt: 'In a policy, s3:GetObject is which element?', answer: 'action', accept: ['an action'] },
    { prompt: 'Which policy controls who may assume a role?', answer: 'trust policy', accept: ['role trust policy'] },
  ],
  'cloud-modern-2': [
    { prompt: 'Temporary credentials need an access-key ID, a secret access key and which third part?', answer: 'session token' },
    { prompt: 'SDKs and the CLI choose credentials through a credential-provider what?', answer: 'chain', accept: ['credential-provider chain'] },
  ],
  'cloud-modern-3': [
    { prompt: 'In S3, reports/january.csv is the object’s what?', answer: 'key', accept: ['object key'] },
    { prompt: 'New buckets default to bucket-owner-____ object ownership. Fill the blank.', answer: 'enforced', accept: ['bucket-owner-enforced'] },
  ],
  'cloud-modern-4': [
    { prompt: 'Which EC2 metadata service version adds token-based protection?', answer: 'IMDSv2' },
    { prompt: 'The metadata service’s IPv4 address is what kind of address?', answer: 'link-local', accept: ['link local'] },
  ],
  'cloud-modern-5': [
    { prompt: 'What is a logically isolated network in AWS called? (acronym)', answer: 'VPC' },
    { prompt: 'A public subnet generally has a route to an internet what?', answer: 'gateway', accept: ['internet gateway'] },
  ],
  'cloud-modern-6': [
    { prompt: 'Selected object-level reads are recorded as which kind of CloudTrail events?', answer: 'data events', accept: ['data'] },
    { prompt: 'Configuration changes are recorded as which kind of events?', answer: 'management events', accept: ['management'] },
  ],
  'cloud-modern-7': [
    { prompt: 'Base64 is an ____, not encryption.', answer: 'encoding' },
    { prompt: 'Which AWS service provides key management and cryptographic operations? (acronym)', answer: 'KMS' },
  ],
  'cloud-modern-8': [
    { prompt: 'Which AWS serverless function service is this lesson about?', answer: 'Lambda' },
    { prompt: 'Which role decides what the running function can access?', answer: 'execution role' },
  ],
  'cloud-modern-9': [
    { prompt: 'Which tool deploys intentionally vulnerable cloud training scenarios?', answer: 'CloudGoat' },
    { prompt: 'Which tool assesses configuration and security controls?', answer: 'Prowler' },
  ],
  'cloud-2': [
    { prompt: 'What does IAM stand for?', answer: 'Identity and Access Management' },
    { prompt: 'The identity named in an access decision is called the what?', answer: 'principal', accept: ['a principal'] },
  ],
  'cloud-3': [
    { prompt: 'A container image is an immutable collection of filesystem what?', answer: 'layers' },
    { prompt: 'What does IaC stand for?', answer: 'infrastructure-as-code', accept: ['infrastructure as code'] },
  ],
  'cloud-4': [
    { prompt: 'Which STS action lets an identity assume a role in another account?', answer: 'sts:AssumeRole', accept: ['AssumeRole'] },
    { prompt: 'Which Azure breach is studied in this lesson?', answer: 'Storm-0558', accept: ['storm 0558'] },
  ],
  'cloud-5': [
    { prompt: 'Which AWS service records control-plane audit events?', answer: 'CloudTrail' },
    { prompt: 'Which AWS service produces the threat findings discussed here?', answer: 'GuardDuty' },
  ],
  'cloud-6': [
    { prompt: 'What does CSPM stand for?', answer: 'Cloud Security Posture Management' },
    { prompt: 'How many million records were exposed in the Verizon/NICE case?', answer: '14', accept: ['14 million'] },
  ],
  'secplus-1': [
    { prompt: 'Which abbreviation names annualized loss expectancy?', answer: 'ALE' },
    { prompt: 'Which document is the high-level, board-approved statement of intent?', answer: 'policy', accept: ['a policy'] },
  ],
  'secplus-2': [
    { prompt: 'Which kind of encryption uses one shared key?', answer: 'symmetric' },
    { prompt: 'Name the first symmetric algorithm listed in the comparison.', answer: 'AES' },
  ],
  'secplus-3': [
    { prompt: '"Something you are" factors such as fingerprints are called what?', answer: 'biometrics', accept: ['biometric'] },
    { prompt: 'Two passwords are not MFA because both belong to which factor category?', answer: 'knowledge' },
  ],
  'secplus-4': [
    { prompt: 'Multiple independent layers of control is called defense in what?', answer: 'depth' },
    { prompt: 'Which zone isolates public-facing services from the internal network? (acronym)', answer: 'DMZ' },
  ],
  'secplus-5': [
    { prompt: 'How many phases does the incident response lifecycle have here?', answer: 'six', accept: ['6'] },
    { prompt: 'Which phase removes the root cause, such as malware or a backdoor?', answer: 'eradication' },
  ],
};
