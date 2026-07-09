import { dir } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) };
}

export const bugBountyLabs: LabScenario[] = [
  {
    id: 'bb-forgotten-staging',
    title: 'Bug Bounty: The Forgotten Staging Subdomain',
    difficulty: 'Easy',
    category: 'Bug Bounty',
    briefing:
      'Program scope for Meridian Corp includes *.meridiancorp.example (simulated, not a real domain). ' +
      'Recon turned up an old staging host, 10.10.105.1, that the main security review never covered.',
    objectives: [
      'Scan 10.10.105.1 and enumerate the web server',
      'Check for a debug endpoint left enabled from development',
    ],
    hints: ['nmap -sV 10.10.105.1', 'curl 10.10.105.1/robots.txt', 'curl 10.10.105.1/debug'],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'staging-old', ip: '10.10.105.1', os: 'Ubuntu 18.04',
        services: [{
          port: 80, name: 'http', version: 'Apache httpd 2.4.29',
          http: {
            '/': '<html><body><h1>Meridian Corp — Staging</h1></body></html>',
            '/robots.txt': 'User-agent: *\nDisallow: /debug\n',
            '/debug': '<html><body><h1>Debug Mode Enabled</h1><p>DB_PASSWORD=st4ging_only_2019</p><p>flag{forgotten_staging_subdomain_debug_mode}</p></body></html>',
          },
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'bb-js-secret-leak',
    title: 'Bug Bounty: API Key Leaked in a JS Bundle',
    difficulty: 'Easy',
    category: 'Bug Bounty',
    briefing:
      'The main application at 10.10.105.2 ships a large JavaScript bundle. Analyzing it for hardcoded ' +
      'secrets is a core recon habit for any bug bounty hunter — and this one has something in it.',
    objectives: ['Scan 10.10.105.2', 'Fetch the JS bundle and search it for hardcoded secrets'],
    hints: ['nmap -sV 10.10.105.2', 'curl 10.10.105.2/static/app.js'],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'app-main', ip: '10.10.105.2', os: 'Ubuntu 22.04',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0',
          http: {
            '/': '<html><body><h1>Meridian App</h1></body></html>',
            '/static/app.js':
              'const CONFIG = {\n  apiBase: "https://api.meridiancorp.example",\n' +
              '  // TODO: move to env vars before launch (nobody did)\n' +
              '  internalApiKey: "flag{hardcoded_api_key_in_js_bundle}"\n};\n',
          },
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'bb-exposed-git',
    title: 'Bug Bounty: Exposed .git Directory',
    difficulty: 'Medium',
    category: 'Bug Bounty',
    briefing:
      'A deployment script accidentally copied the .git directory into the live web root at 10.10.105.3. ' +
      'This is a frequent real-world bug bounty finding — the full commit history becomes downloadable.',
    objectives: ['Scan 10.10.105.3', 'Check for an exposed .git/config revealing repository details'],
    hints: ['nmap -sV 10.10.105.3', 'curl 10.10.105.3/.git/config', 'curl 10.10.105.3/.git/COMMIT_EDITMSG'],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'webapp03', ip: '10.10.105.3', os: 'Ubuntu 20.04',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.20.1',
          http: {
            '/': '<html><body><h1>Meridian Portal</h1></body></html>',
            '/.git/config': '[core]\n\trepositoryformatversion = 0\n[remote "origin"]\n\turl = git@internal-gitlab.meridiancorp.example:portal/webapp.git\n',
            '/.git/COMMIT_EDITMSG': 'Remove hardcoded deploy token before launch\n\nflag{exposed_git_directory_leaks_commit_history}\n',
          },
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'bb-api-idor',
    title: 'Bug Bounty: IDOR in the Public API',
    difficulty: 'Medium',
    category: 'Bug Bounty',
    briefing:
      'Meridian Corp\'s public API (in scope per the program brief) exposes an order-lookup endpoint. ' +
      'This is exactly the kind of high-value, low-competition finding the "recon at scale" lesson describes.',
    objectives: ['Scan 10.10.105.4', 'Look up your own order, then try a neighboring order ID'],
    hints: ['nmap -sV 10.10.105.4', 'curl "http://10.10.105.4/api/order?id=5001"', 'curl "http://10.10.105.4/api/order?id=5002"'],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'api04', ip: '10.10.105.4', os: 'Ubuntu 22.04',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0',
          http: {},
          vulnRoutes: [{
            kind: 'idor', path: '/api/order', param: 'id',
            triggerSubstrings: ['5002', '5003', '5099'],
            vulnerableResponse: '{"order_id":5002,"customer":"Another Customer","card_last4":"4242","flag":"flag{public_api_idor_leaks_order_pii}"}',
            normalResponse: '{"order_id":5001,"customer":"You"}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'bb-ssrf-webhook-scope',
    title: 'Bug Bounty: SSRF via In-Scope Webhook Feature',
    difficulty: 'Hard',
    category: 'Bug Bounty',
    briefing:
      'The integrations page (explicitly listed in scope) lets users register a webhook URL. Confirm the ' +
      'server actually calls that URL server-side, then redirect it internally — exactly the SSRF pattern ' +
      'covered in the Web Application Hacking module, now applied against an in-scope bounty target.',
    objectives: ['Scan 10.10.105.5', 'Register a normal webhook URL', 'Redirect the webhook to an internal service'],
    hints: [
      'nmap -sV 10.10.105.5',
      'curl "http://10.10.105.5/integrations/webhook?callback=https://example.com/hook"',
      'curl "http://10.10.105.5/integrations/webhook?callback=http://127.0.0.1:9000/internal"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'integrations05', ip: '10.10.105.5', os: 'Ubuntu 22.04',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0',
          http: {},
          vulnRoutes: [{
            kind: 'ssrf', path: '/integrations/webhook', param: 'callback',
            triggerSubstrings: ['127.0.0.1', 'localhost', 'internal', '169.254.169.254'],
            vulnerableResponse: '{"status":"delivered","internal_response":"flag{in_scope_ssrf_via_webhook_callback}"}',
            normalResponse: '{"status":"delivered","internal_response":null}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
];
