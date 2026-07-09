import { dir } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) };
}

export const cloudAdvancedLabs: LabScenario[] = [
  {
    id: 'cloud-waf-ssrf-breach-chain',
    title: 'Cloud: Misconfigured WAF Leads to Full Data Breach',
    difficulty: 'Hard',
    category: 'Cloud',
    briefing:
      'This lab recreates the general mechanics behind one of the largest publicly disclosed cloud breaches ' +
      'in history: a misconfigured web application firewall allowed a crafted request to reach the instance ' +
      'metadata service, stealing temporary IAM credentials attached to the WAF\'s own EC2 role — a role that ' +
      'turned out to have far broader S3 permissions than the WAF itself ever needed. That single ' +
      'overprivileged role was then used to list and download data from every bucket in the account.',
    objectives: [
      { text: 'Send a crafted request through the WAF that triggers an SSRF to the metadata service', why: 'The real-world root cause was a WAF feature that could be tricked into making arbitrary outbound requests — exactly the SSRF pattern from the Web Application Hacking module, just hosted inside the firewall product itself.' },
      { text: 'Use the leaked temporary credentials to list every S3 bucket the WAF\'s role can reach', why: 'This is the step that turned a single SSRF into a full breach — the compromised role\'s permissions were scoped far wider than "read the WAF\'s own config," a classic least-privilege failure.' },
      { text: 'Retrieve the sensitive file from the over-exposed bucket and capture the flag', why: 'The lesson every cloud security review takes from this incident: an SSRF bug is only as dangerous as the IAM permissions attached to the box it\'s running on — scope every instance role down to the absolute minimum.' },
    ],
    hints: [
      'curl "10.10.109.1/waf/proxy?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/waf-role"',
      'curl "10.10.109.1/s3/list?role=waf-role"',
      'curl "10.10.109.1/s3/object?bucket=customer-records&key=full-export.csv"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'waf-appliance', ip: '10.10.109.1', os: 'Cloud VM (WAF appliance, over-permissioned instance role)',
        services: [{
          port: 80, name: 'http', version: 'Custom WAF proxy service',
          http: {
            '/s3/list?role=waf-role': '{"buckets":["waf-config-internal","customer-records"],"note":"waf-role should only reach waf-config-internal"}',
            '/s3/object?bucket=customer-records&key=full-export.csv': 'customer_id,name,card_last4\n10441,J. Alvarez,4242\nflag{overprivileged_iam_role_plus_ssrf_equals_full_breach}',
          },
          vulnRoutes: [{
            kind: 'ssrf', path: '/waf/proxy', param: 'url',
            triggerSubstrings: ['169.254.169.254', 'metadata'],
            vulnerableResponse: '{"AccessKeyId":"AKIA-WAFROLE-SIMULATED","SecretAccessKey":"REDACTED","Role":"waf-role"}',
            normalResponse: '{"status":"proxied","bytes":128}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'cloud-exposed-kubernetes-dashboard',
    title: 'Cloud: Exposed Kubernetes Dashboard',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'This recreates a widely publicized 2018 incident in which a company\'s Kubernetes administration ' +
      'dashboard was left internet-facing with no authentication at all. Anyone who found it could see every ' +
      'running pod, every secret mounted into them, and could schedule their own workloads on the cluster — ' +
      'which is exactly how attackers turned it into a large-scale cryptocurrency mining operation running on ' +
      'someone else\'s cloud bill.',
    objectives: [
      { text: 'Scan 10.10.109.2 and confirm the Kubernetes dashboard is reachable with no login', why: 'The dashboard is meant to be an internal admin tool — reachable from the public internet with zero authentication is the entire root cause here.' },
      { text: 'List the running pods and their mounted secrets via the dashboard API', why: 'A Kubernetes dashboard with no auth exposes cluster secrets (API tokens, database credentials) to anyone who finds it — full cluster visibility, no login required.' },
      { text: 'Capture the flag from the exposed cloud credentials secret', why: 'In the real incident, the exposed dashboard gave attackers everything needed to also pivot into the underlying cloud account, not just the cluster itself.' },
    ],
    hints: [
      'nmap -sV 10.10.109.2',
      'curl 10.10.109.2/api/v1/pods',
      'curl 10.10.109.2/api/v1/secrets/cloud-credentials',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'k8s-dashboard', ip: '10.10.109.2', os: 'Kubernetes cluster (dashboard exposed, no RBAC/auth)',
        services: [{
          port: 80, name: 'http', version: 'Kubernetes Dashboard 1.10 (no authentication configured)',
          http: {
            '/api/v1/pods': '{"pods":["web-frontend","payment-worker","cloud-credentials-sidecar"]}',
            '/api/v1/secrets/cloud-credentials': '{"AccessKeyId":"AKIA-CLUSTER-SIMULATED","SecretAccessKey":"REDACTED","flag":"flag{exposed_k8s_dashboard_leaks_cluster_secrets}"}',
          },
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'cloud-lambda-overpermissioned-role',
    title: 'Cloud: Over-Permissioned Serverless Function',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'A serverless function that only needs to resize uploaded thumbnails was deployed with a wildcard IAM ' +
      'policy attached "to save time" — a very common real-world shortcut. A vulnerability in the function\'s ' +
      'image-processing library was exploited to achieve code execution inside it, and from there, the ' +
      'attacker inherited every permission the function\'s role held — far more than resizing images ever ' +
      'required.',
    objectives: [
      { text: 'Trigger code execution in the thumbnail function via a malicious upload payload', why: 'This step represents exploiting a real vulnerability class (image library RCE bugs are a recurring CVE category) to get a foothold inside the function\'s execution environment.' },
      { text: 'Query the function\'s attached IAM role and note how broad it is', why: 'A "just resize images" function should never be able to read arbitrary S3 buckets or launch EC2 instances — but wildcard policies (Action: "*", Resource: "*") are still disturbingly common in real serverless deployments built under deadline pressure.' },
      { text: 'Use the inherited role to access an unrelated resource and capture the flag', why: 'This demonstrates exactly why least-privilege IAM matters even for "small" functions — the blast radius of any single vulnerability is defined entirely by what its role is allowed to do, not by what the function was designed to do.' },
    ],
    hints: [
      'curl -X POST -d "payload=malicious_image_exploit" 10.10.109.3/thumbnail/process',
      'curl 10.10.109.3/lambda/role-policy',
      'curl 10.10.109.3/s3/unrelated-bucket/secrets.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'thumbnail-fn', ip: '10.10.109.3', os: 'Serverless function runtime (Node.js 18)',
        services: [{
          port: 80, name: 'http', version: 'Function-as-a-Service runtime',
          http: {
            '/lambda/role-policy': '{"policy":{"Effect":"Allow","Action":"*","Resource":"*"},"note":"a thumbnail resizer should never need wildcard permissions"}',
            '/s3/unrelated-bucket/secrets.txt': 'internal_db_password=Wh7_D0es_A_Th4mbnail_Fn_Need_This\nflag{overpermissioned_lambda_role_wildcard_iam}',
          },
          vulnRoutes: [{
            kind: 'auth-bypass', path: '/thumbnail/process', param: 'payload',
            triggerSubstrings: ['malicious_image_exploit', 'exploit'],
            vulnerableResponse: '{"status":"code_execution_achieved","note":"image library vulnerability triggered inside the function sandbox"}',
            normalResponse: '{"status":"thumbnail_generated"}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'cloud-public-write-bucket',
    title: 'Cloud: Public-Write Storage Bucket',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'Unlike the public-READ bucket misconfiguration covered earlier in this course, this bucket was left ' +
      'with public WRITE access — a rarer but far more dangerous mistake. Anyone can upload arbitrary content ' +
      'to it, and because it also happens to be the origin for Meridian Corp\'s public JavaScript CDN, ' +
      'uploading a file with the right name overwrites what every visitor to the main site downloads and runs.',
    objectives: [
      { text: 'Confirm the bucket allows public writes by uploading a test file', why: 'Public-write is functionally worse than public-read — it means anyone can inject content, not just read it, turning a storage misconfiguration into a potential supply-chain compromise.' },
      { text: 'Identify that the bucket also serves the production JS CDN', why: 'The severity here comes entirely from what the bucket is USED for — the same misconfiguration on an unused test bucket would be low severity; on a live CDN origin, it\'s critical.' },
      { text: 'Overwrite the CDN\'s tracked file and capture the flag confirming the takeover', why: 'This is the exact mechanism behind real supply-chain attacks where a compromised or misconfigured asset host lets an attacker modify code served to every visitor of a legitimate site.' },
    ],
    hints: [
      'curl -X POST -d "content=test-upload" 10.10.109.4/bucket/upload?key=test.txt',
      'curl 10.10.109.4/bucket/list  — notice app.min.js is served from here too.',
      'curl -X POST -d "content=overwritten" 10.10.109.4/bucket/upload?key=app.min.js',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'cdn-origin-bucket', ip: '10.10.109.4', os: 'Cloud object storage (public-write misconfigured)',
        services: [{
          port: 80, name: 'http', version: 'S3-compatible object storage',
          http: { '/bucket/list': '{"objects":["app.min.js","logo.png","favicon.ico"],"acl":"public-read-write (misconfigured)"}' },
          vulnRoutes: [{
            kind: 'auth-bypass', path: '/bucket/upload', param: 'key',
            triggerSubstrings: ['app.min.js'],
            vulnerableResponse: '{"status":"overwritten","object":"app.min.js","impact":"every visitor to the main site now loads attacker-controlled JavaScript","flag":"flag{public_write_bucket_cdn_supply_chain_takeover}"}',
            normalResponse: '{"status":"uploaded","object":"test.txt"}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'cloud-iam-passrole-privesc',
    title: 'Cloud: IAM Privilege Escalation via PassRole',
    difficulty: 'Hard',
    category: 'Cloud',
    briefing:
      'You have a low-privilege cloud account (developer-readonly) that cannot directly access sensitive ' +
      'data — but it does have permission to launch new compute instances AND to attach any IAM role to them ' +
      'via the "PassRole" permission. This specific combination is one of the most common real-world AWS ' +
      'privilege escalation paths, because the two permissions look harmless individually but are dangerous ' +
      'together.',
    objectives: [
      { text: 'Confirm developer-readonly cannot directly read the sensitive bucket', why: 'Establishes the baseline: this account is genuinely supposed to be low-privilege.' },
      { text: 'Check what roles developer-readonly is allowed to pass to new instances', why: 'The PassRole permission alone does nothing dangerous — it becomes a privilege escalation path only combined with the ability to launch instances that then use the passed role.' },
      { text: 'Launch an instance with the high-privilege role attached and read the sensitive data through it', why: 'This is the exact escalation chain: low-privilege account -> launch instance with a role it can "pass" but not directly assume -> the instance itself now has that role\'s full permissions, and the low-privilege account controls the instance.' },
    ],
    hints: [
      'curl "10.10.109.5/s3/sensitive-data?role=developer-readonly"  — confirm access denied.',
      'curl "10.10.109.5/iam/passable-roles?user=developer-readonly"',
      'curl "10.10.109.5/ec2/launch?role=data-admin-role"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'iam-privesc-lab', ip: '10.10.109.5', os: 'Cloud IAM simulation',
        services: [{
          port: 80, name: 'http', version: 'Cloud IAM policy simulator',
          http: {
            '/s3/sensitive-data?role=developer-readonly': '{"error":"AccessDenied","message":"developer-readonly cannot read this bucket directly"}',
            '/iam/passable-roles?user=developer-readonly': '{"passable_roles":["data-admin-role"],"note":"developer-readonly can attach data-admin-role to new EC2 instances via iam:PassRole, even though it cannot assume that role itself"}',
          },
          vulnRoutes: [{
            kind: 'auth-bypass', path: '/ec2/launch', param: 'role',
            triggerSubstrings: ['data-admin-role'],
            vulnerableResponse: '{"status":"instance_launched","attached_role":"data-admin-role","s3_access":"full","flag":"flag{iam_passrole_privilege_escalation}"}',
            normalResponse: '{"error":"role not passable by this user"}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'cloud-exposed-docker-api',
    title: 'Cloud: Unauthenticated Docker API',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'A cloud host has the Docker daemon\'s remote API exposed on its default port with no TLS and no ' +
      'authentication configured — a real, widely scanned-for misconfiguration that has been mass-exploited ' +
      'for cryptomining campaigns for years. Anyone who finds it can list, create, and run containers with ' +
      'full host-level privileges.',
    objectives: [
      { text: 'Scan 10.10.109.6 and confirm the Docker API is reachable without authentication', why: 'The Docker API on this port is meant to be reachable only over a secured, authenticated local socket — exposing it to the network with no auth is equivalent to giving root access to anyone who finds the port.' },
      { text: 'List running containers via the exposed API', why: 'Even just listing containers with no credentials confirms the misconfiguration is real and exploitable, not just theoretical.' },
      { text: 'Launch a privileged container that mounts the host filesystem and capture the flag', why: 'This is exactly the technique real cryptojacking campaigns automated at scale — an exposed Docker API is a direct path to full host compromise, not just "container" compromise, because you can mount the host\'s own filesystem into a new container you control.' },
    ],
    hints: [
      'nmap -sV 10.10.109.6 — the Docker API listens on 2375, not the default web port 80.',
      'curl 10.10.109.6:2375/containers/json',
      'curl -X POST -d "mount=/:/host" 10.10.109.6:2375/containers/create',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'docker-host', ip: '10.10.109.6', os: 'Ubuntu 20.04 (Docker daemon, TCP API exposed, no TLS/auth)',
        services: [{
          port: 2375, name: 'docker', version: 'Docker 20.10 remote API (unauthenticated)',
          http: { '/containers/json': '[{"Id":"a1b2c3","Image":"nginx:latest"},{"Id":"d4e5f6","Image":"redis:6"}]' },
          vulnRoutes: [{
            kind: 'auth-bypass', path: '/containers/create', param: 'mount',
            triggerSubstrings: ['/:/host', ':/host'],
            vulnerableResponse: '{"status":"container_created","host_fs_mounted":true,"note":"a privileged container with the host filesystem mounted is equivalent to root on the host itself","flag":"flag{unauthenticated_docker_api_host_takeover}"}',
            normalResponse: '{"status":"container_created","host_fs_mounted":false}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'cloud-disabled-logging-coverup',
    title: 'Cloud: Attacker Disables Audit Logging',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'This lab flips perspective: you\'re investigating a cloud account where an attacker, after gaining ' +
      'initial access, deliberately disabled the account\'s audit/activity logging before doing anything ' +
      'else — a very common real-world step attackers take specifically to blind incident responders. Your ' +
      'job is to find the gap in the log timeline that itself is the evidence.',
    objectives: [
      { text: 'Review the cloud activity log timeline for 10.10.109.7', why: 'Cloud activity logs (CloudTrail-style) are the primary evidence source for any cloud incident investigation — always start here.' },
      { text: 'Identify the exact event where logging was disabled', why: 'A "StopLogging" or equivalent event appearing in the log right before a suspicious gap is one of the strongest indicators of deliberate attacker tradecraft, not an accident.' },
      { text: 'Confirm what account performed the disabling action and capture the flag', why: 'This is exactly why security teams configure logging changes themselves to trigger a HIGH-priority alert — if logging can be silently disabled by a compromised account with no separate approval step, incident response is blinded exactly when it matters most.' },
    ],
    hints: [
      'curl 10.10.109.7/activity-log',
      'grep -i "logging" is the equivalent of searching for the disable event — look for a StopLogging-style entry.',
      'Note which account performed that action, and what happens right after it in the timeline.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'cloud-account-audit', ip: '10.10.109.7', os: 'Cloud activity log service',
        services: [{
          port: 80, name: 'http', version: 'Cloud audit/activity log API',
          http: {
            '/activity-log':
              '2026-07-12T02:10:00Z  user=devops-ci        action=ConsoleLogin        result=SUCCESS\n' +
              '2026-07-12T02:41:12Z  user=devops-ci        action=StopLogging         result=SUCCESS  <-- logging disabled here\n' +
              '2026-07-12T02:41:15Z  --- LOGGING GAP: no events recorded for 47 minutes ---\n' +
              '2026-07-12T03:28:33Z  user=devops-ci        action=StartLogging        result=SUCCESS  <-- re-enabled after the fact\n' +
              'flag{disabled_logging_hides_attacker_activity_window}',
          },
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
];
